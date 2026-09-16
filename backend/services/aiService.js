const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { MemorySaver, StateGraph, END } = require('@langchain/langgraph');
const { z } = require('zod');
const { StructuredOutputParser } = require('@langchain/core/output_parsers');
const { PromptTemplate } = require('@langchain/core/prompts');
const pdfParse = require('pdf-parse');

const ResumeAnalysis = require('../models/ResumeAnalysis');
const AIHistory = require('../models/AIHistory');
const JobListing = require('../models/JobListing');
const User = require('../models/User');

const llm = new ChatGoogleGenerativeAI({
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.1
});

// Helper for temporal ground truth so Gemini recognizes current calendar date/year
const getTemporalContext = () => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const currentYear = now.getFullYear();
    return `[TEMPORAL CONTEXT: Today's date is ${formattedDate}, and the current calendar year is ${currentYear}. Any project dates, completion dates, or employment dates on or before ${currentYear} (e.g. 2024, 2025, 2026) are valid past or present dates. DO NOT flag dates up to ${currentYear} as future dates or red flags.]`;
};

// Clean formatters to avoid raw JSON curly-brace collisions with LangChain f-strings
const formatProjectsList = (projects) => {
    if (!projects || projects.length === 0) return 'None listed';
    return projects.map(p => `• ${p.title} | Link: ${p.link || 'N/A'} | Description: ${p.description || 'N/A'}`).join('\n');
};

const formatExperienceList = (experience) => {
    if (!experience || experience.length === 0) return 'None listed';
    return experience.map(e => `• ${e.role} at ${e.company} (${e.duration}) | Description: ${e.description || 'N/A'}`).join('\n');
};

const formatCertificatesList = (certificates) => {
    if (!certificates || certificates.length === 0) return 'None listed';
    return certificates.map(c => `• ${c.title} issued by ${c.issuer} (${c.date || 'N/A'})`).join('\n');
};

// Zod Schema for structured output
const resumeSchema = z.object({
    overallScore: z.number().min(0).max(100).describe('Score out of 100 representing resume quality and impact.'),
    skills: z.array(z.string()).describe('List of technical and soft skills.'),
    experienceYears: z.number().describe('Total years of professional experience inferred.'),
    strengths: z.array(z.string()).describe('Top 3 strengths of the candidate.'),
    weaknesses: z.array(z.string()).describe('Areas of improvement.'),
    actionableFeedback: z.string().describe('Detailed feedback on how to improve the resume.'),
});

const parser = StructuredOutputParser.fromZodSchema(resumeSchema);

// -----------------------------------------------------
// RESUME SCORER GRAPH
// -----------------------------------------------------

const resumeGraphState = {
    rawText: { value: null },
    analysis: { value: null }
};

const extractAndScoreNode = async (state) => {
    const { rawText } = state;
    const temporalContext = getTemporalContext();
    
    const prompt = PromptTemplate.fromTemplate(`
You are an expert technical recruiter and resume scorer. 
${temporalContext}

Analyze the following resume text and extract the required information.
Format the output EXACTLY as requested.

{format_instructions}

Resume Text:
{rawText}
`);

    const chain = prompt.pipe(llm).pipe(parser);
    const analysis = await chain.invoke({
        rawText: rawText,
        format_instructions: parser.getFormatInstructions()
    });

    return { analysis };
};

const workflow = new StateGraph({ channels: resumeGraphState })
    .addNode("extractAndScore", extractAndScoreNode)
    .addEdge("__start__", "extractAndScore")
    .addEdge("extractAndScore", END);

const memorySaver = new MemorySaver();
const resumeApp = workflow.compile({ checkpointer: memorySaver });

exports.analyzeResumePdf = async (userId, pdfBuffer) => {
    // 1. Parse PDF
    const parsed = await pdfParse(pdfBuffer);
    const rawText = parsed.text;

    const threadId = `resume_${userId}_${Date.now()}`;
    const config = { configurable: { thread_id: threadId } };

    // 2. Run Graph
    const result = await resumeApp.invoke({ rawText }, config);

    // 3. Save History
    const state = await resumeApp.getState(config);
    await AIHistory.create({
        userId,
        threadId,
        state: state,
        metadata: { type: 'resume_scorer' }
    });

    // 4. Update Document Saver (ResumeAnalysis)
    let analysisDoc = await ResumeAnalysis.findOne({ userId });
    if (analysisDoc) {
        analysisDoc.set({ ...result.analysis, rawText });
        await analysisDoc.save();
    } else {
        analysisDoc = await ResumeAnalysis.create({
            userId,
            ...result.analysis,
            rawText
        });
    }

    // 5. Automatically recalculate & persist job matches in DB
    try {
        await exports.recalculateAndStoreUserJobMatches(userId);
    } catch (matchErr) {
        console.warn("Could not recalculate matches in analyzeResumePdf:", matchErr.message);
    }

    return analysisDoc;
};


// -----------------------------------------------------
// JOB MATCHER (RAG - Profile + Resume Synthesis)
// -----------------------------------------------------

const matchSchema = z.object({
    matchScore: z.number().min(0).max(100).describe('Matching score between 0 and 100.'),
    category: z.string().describe('Must be one of: "Strong Match", "Good Match", "Low Match"'),
    reasoning: z.string().describe('Detailed reasoning comparing candidate skills, projects, experience, and certificates with job requirements.')
});

const matchParser = StructuredOutputParser.fromZodSchema(matchSchema);

exports.evaluateMatchScore = async (userId, jobId) => {
    const temporalContext = getTemporalContext();

    // 1. Retrieve Candidate Full Profile & Resume Analysis
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const analysis = await ResumeAnalysis.findOne({ userId });

    let candidateData = `--- Candidate Platform Profile ---
Full Name: ${user.name}
About: ${user.about || 'Not provided'}
Core Skills: ${(user.skills && user.skills.length > 0) ? user.skills.join(', ') : 'None listed'}
Experience Roles:
${formatExperienceList(user.experience)}
Projects Portfolio:
${formatProjectsList(user.projects)}
Certifications:
${formatCertificatesList(user.certificates)}`;

    if (analysis) {
        candidateData += `\n\n--- Parsed Resume Insights ---
Resume Extracted Skills: ${(analysis.skills && analysis.skills.length > 0) ? analysis.skills.join(', ') : 'N/A'}
Inferred Experience Years: ${analysis.experienceYears || 0}
Resume Strengths: ${(analysis.strengths && analysis.strengths.length > 0) ? analysis.strengths.join('; ') : 'N/A'}`;
    }

    // 2. Retrieve Job Details
    const job = await JobListing.findById(jobId);
    if (!job) throw new Error("Job not found");

    const jobData = `Title: ${job.title}\nCompany: ${job.company}\nDescription: ${job.description}\nSkills Required: ${(job.skillsRequired || []).join(', ')}`;

    // 3. Evaluate Match
    const prompt = PromptTemplate.fromTemplate(`
You are an expert technical recruiter matching candidates to job openings.
${temporalContext}

Carefully analyze BOTH the Candidate's Platform Profile (Skills, Projects, Experience, Certifications) and their Resume Insights against the Job Listing.
Evaluate how well their projects demonstrate relevant tech stack skills, whether their certifications validate domain knowledge, and if their experience fits the role.

Scoring Criteria:
- matchScore >= 75: category must be "Strong Match"
- matchScore between 50 and 74: category must be "Good Match"
- matchScore < 50: category must be "Low Match"

{format_instructions}

Candidate Data:
{candidateData}

Job Listing:
{jobData}
`);

    const chain = prompt.pipe(llm).pipe(matchParser);
    const result = await chain.invoke({
        candidateData,
        jobData,
        format_instructions: matchParser.getFormatInstructions()
    });

    // Save history
    const threadId = `match_${userId}_${jobId}_${Date.now()}`;
    await AIHistory.create({
        userId,
        threadId,
        state: { candidateData, jobData, result },
        metadata: { type: 'job_match', jobId }
    });

    // Persist to user's jobMatches in MongoDB
    try {
        if (!Array.isArray(user.jobMatches)) {
            user.jobMatches = [];
        }
        const existingIdx = user.jobMatches.findIndex(m => m.jobId.toString() === jobId.toString());
        const matchPayload = {
            jobId,
            score: result.matchScore,
            category: result.category,
            matchedSkills: (user.skills || []).filter(s => 
                (job.skillsRequired || []).some(js => js.toLowerCase() === s.toLowerCase())
            ),
            reasoning: result.reasoning,
            updatedAt: new Date()
        };

        if (existingIdx >= 0) {
            user.jobMatches[existingIdx] = matchPayload;
        } else {
            user.jobMatches.push(matchPayload);
        }
        await user.save();
    } catch (saveErr) {
        console.warn("Could not persist evaluateMatchScore to user document:", saveErr.message);
    }

    return result;
};

// -----------------------------------------------------
// BATCH RECALCULATE & PERSIST MATCH SCORES FOR USER
// Recalculates upon Profile or Resume updates and saves in DB
// -----------------------------------------------------
const normalizeStr = (str) => (str || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();

exports.recalculateAndStoreUserJobMatches = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user || user.role !== 'Candidate') return [];

        const analysis = await ResumeAnalysis.findOne({ userId });
        const openJobs = await JobListing.find({ status: 'Open' });

        const candidateSkills = Array.isArray(user.skills) ? user.skills : [];
        const projects = Array.isArray(user.projects) ? user.projects : [];
        const experience = Array.isArray(user.experience) ? user.experience : [];
        const certificates = Array.isArray(user.certificates) ? user.certificates : [];

        // Inferred skills from parsed resume
        const resumeSkills = (analysis && Array.isArray(analysis.skills)) ? analysis.skills : [];
        const allCandidateSkills = Array.from(new Set([
            ...candidateSkills.map(s => s.trim()),
            ...resumeSkills.map(s => s.trim())
        ])).filter(Boolean);

        const newMatches = openJobs.map(job => {
            const requiredSkills = Array.isArray(job.skillsRequired) ? job.skillsRequired : [];
            const jobTitleNorm = normalizeStr(job.title);
            const jobDescNorm = normalizeStr(job.description);

            // Empty profile fallback
            if (allCandidateSkills.length === 0 && projects.length === 0 && experience.length === 0 && certificates.length === 0 && !user.resumeUrl) {
                return {
                    jobId: job._id,
                    score: 15,
                    category: 'Low Match',
                    matchedSkills: [],
                    reasoning: 'Profile is not yet completed with skills, projects, or experience.',
                    updatedAt: new Date()
                };
            }

            // 1. Skill Match (50% weight)
            let matchedSkills = [];
            let skillScore = 0;

            if (requiredSkills.length > 0) {
                const candSkillsNorm = allCandidateSkills.map(normalizeStr);
                requiredSkills.forEach(reqSkill => {
                    const reqNorm = normalizeStr(reqSkill);
                    const inSkills = candSkillsNorm.some(cs => cs === reqNorm || cs.includes(reqNorm) || reqNorm.includes(cs));
                    const inProj = projects.some(p => normalizeStr(`${p.title} ${p.description}`).includes(reqNorm));
                    const inExp = experience.some(e => normalizeStr(`${e.role} ${e.description}`).includes(reqNorm));

                    if (inSkills || inProj || inExp) {
                        matchedSkills.push(reqSkill);
                    }
                });
                const ratio = matchedSkills.length / requiredSkills.length;
                skillScore = Math.min(ratio, 1.0) * 50;
            } else {
                const matched = allCandidateSkills.filter(s => jobDescNorm.includes(normalizeStr(s)));
                matchedSkills = matched;
                skillScore = allCandidateSkills.length > 0 ? Math.min((matched.length / 3), 1.0) * 50 : 20;
            }

            // 2. Experience & Title Alignment (25% weight)
            let experienceScore = 0;
            if (experience.length > 0) {
                experienceScore = 15;
                const hasRoleMatch = experience.some(e => {
                    const words = normalizeStr(e.role).split(/\s+/);
                    return words.some(w => w.length > 3 && jobTitleNorm.includes(w));
                });
                if (hasRoleMatch) experienceScore = 25;
            } else if (user.resumeUrl) {
                experienceScore = 10;
            }

            // 3. Projects (15% weight)
            let projectScore = 0;
            if (projects.length > 0) {
                projectScore = Math.min(projects.length * 5, 10);
                const hasRelevantProject = projects.some(p => {
                    const pText = normalizeStr(`${p.title} ${p.description}`);
                    return requiredSkills.some(rs => pText.includes(normalizeStr(rs))) || pText.includes(jobTitleNorm);
                });
                if (hasRelevantProject) projectScore = 15;
            }

            // 4. Certifications & Profile completeness (10% weight)
            let certScore = 0;
            if (certificates.length > 0) {
                certScore = Math.min(certificates.length * 4, 8);
                const hasRelevantCert = certificates.some(c => {
                    const cText = normalizeStr(`${c.title} ${c.issuer}`);
                    return requiredSkills.some(rs => cText.includes(normalizeStr(rs)));
                });
                if (hasRelevantCert) certScore = 10;
            } else if (user.about && user.about.length > 30) {
                certScore = 5;
            }

            const totalScore = Math.min(Math.round(skillScore + experienceScore + projectScore + certScore), 100);

            let category = 'Low Match';
            if (totalScore >= 75) {
                category = 'Strong Match';
            } else if (totalScore >= 50) {
                category = 'Good Match';
            }

            let reasoning = `${category} (${totalScore}%): ${matchedSkills.length} of ${requiredSkills.length || 'key'} required skills demonstrated across profile, projects, and resume.`;

            return {
                jobId: job._id,
                score: totalScore,
                category,
                matchedSkills,
                reasoning,
                updatedAt: new Date()
            };
        });

        user.jobMatches = newMatches;
        await user.save();
        return user.jobMatches;
    } catch (err) {
        console.error('Error in recalculateAndStoreUserJobMatches:', err);
        return [];
    }
};

// -----------------------------------------------------
// DETAILED RESUME & PROFILE ANALYZER (WITH OPTIONAL JD)
// -----------------------------------------------------

const detailedResumeSchema = z.object({
    overallScore: z.number().min(0).max(100).describe('Overall score out of 100 representing the resume and profile quality and fit.'),
    perfect: z.array(z.string()).describe('List of things that are perfect or very strong about the resume and profile.'),
    wrong: z.array(z.string()).describe('List of mistakes, red flags, or areas that are poorly written.'),
    missing: z.array(z.string()).describe('List of missing keywords, sections, projects, or certifications that should be added.'),
    detailedAnalysis: z.string().describe('A detailed paragraph explaining the complete analysis.')
});

const detailedParser = StructuredOutputParser.fromZodSchema(detailedResumeSchema);

exports.analyzeResumeDetailed = async (userId, pdfBuffer, jobDescription) => {
    const temporalContext = getTemporalContext();

    // 1. Parse PDF
    const parsed = await pdfParse(pdfBuffer);
    const rawText = parsed.text;

    // 2. Fetch User Profile to analyze profile & resume in tandem
    let userContext = "";
    if (userId) {
        const user = await User.findById(userId);
        if (user) {
            userContext = `\n--- Candidate Profile Information ---
About / Summary: ${user.about || 'N/A'}
Profile Skills: ${(user.skills && user.skills.length > 0) ? user.skills.join(', ') : 'N/A'}
Projects Portfolio:
${formatProjectsList(user.projects)}
Experience:
${formatExperienceList(user.experience)}
Certificates:
${formatCertificatesList(user.certificates)}
`;
        }
    }

    // 3. Build Prompt (userContext passed as LangChain input variable {userContext})
    let promptText = `
You are an expert technical recruiter, career coach, and resume scorer.
${temporalContext}

Analyze the candidate's resume text and platform profile details.
Be brutally honest, highlight what is strong or perfect, what needs improvement, and what is missing (skills, projects, or certifications).
IMPORTANT: Note the temporal context above. Do NOT falsely identify valid project or graduation dates as future dates.

{format_instructions}

Resume Text:
{rawText}

Candidate Profile Context:
{userContext}
`;

    if (jobDescription && jobDescription.trim().length > 0) {
        promptText += `\nAdditionally, the candidate wants to tailor their resume and profile for the following Job Description. Compare their profile and resume specifically to this Job Description, and evaluate 'missing', 'wrong', and 'perfect' points on how well they fit this target position:\nJob Description:\n{jobDescription}\n`;
    }

    const prompt = PromptTemplate.fromTemplate(promptText);
    const chain = prompt.pipe(llm).pipe(detailedParser);

    // 4. Execute with userContext as variable (safe from f-string syntax collision)
    const result = await chain.invoke({
        rawText: rawText,
        userContext: userContext || "No platform profile data provided.",
        jobDescription: jobDescription || "",
        format_instructions: detailedParser.getFormatInstructions()
    });

    // 5. Save History
    const threadId = `detailed_resume_${userId}_${Date.now()}`;
    await AIHistory.create({
        userId,
        threadId,
        state: { rawText, jobDescription, result },
        metadata: { type: 'detailed_resume_scorer' }
    });

    return result;
};