/**
 * Heuristic Match Calculator for instant job post suggestions based on:
 * - Candidate Skills
 * - Candidate Projects
 * - Candidate Experience
 * - Candidate Certificates
 * - Resume Analysis indicators
 */

export const calculateJobMatch = (job, user) => {
  if (!job || !user || user.role !== 'Candidate') {
    return null;
  }

  const requiredSkills = Array.isArray(job.skillsRequired) ? job.skillsRequired : [];
  const candidateSkills = Array.isArray(user.skills) ? user.skills : [];
  const projects = Array.isArray(user.projects) ? user.projects : [];
  const experience = Array.isArray(user.experience) ? user.experience : [];
  const certificates = Array.isArray(user.certificates) ? user.certificates : [];

  // If candidate has empty profile, score is 0 / Low Match
  if (
    candidateSkills.length === 0 &&
    projects.length === 0 &&
    experience.length === 0 &&
    certificates.length === 0 &&
    !user.resumeUrl
  ) {
    return {
      score: 15,
      category: 'Low Match',
      matchedSkills: [],
      reason: 'Complete your profile with skills, projects, and experience to improve match accuracy.',
    };
  }

  // Normalize string helper
  const normalize = (str) =>
    (str || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim();

  const jobTitleNorm = normalize(job.title);
  const jobDescNorm = normalize(job.description);

  // 1. Skill Matching (Weight: 50%)
  let matchedSkills = [];
  let skillMatchRatio;

  if (requiredSkills.length > 0) {
    const normCandSkills = candidateSkills.map(normalize);

    requiredSkills.forEach((reqSkill) => {
      const normReq = normalize(reqSkill);
      // Check exact or partial match in candidate skills, projects, or experience
      const foundInSkills = normCandSkills.some(
        (cs) => cs === normReq || cs.includes(normReq) || normReq.includes(cs)
      );

      // Also check if demonstrated in candidate's project descriptions or title
      const foundInProjects = projects.some((p) => {
        const pText = normalize(`${p.title} ${p.description}`);
        return pText.includes(normReq);
      });

      // Check in experience descriptions or role
      const foundInExp = experience.some((e) => {
        const expText = normalize(`${e.role} ${e.description}`);
        return expText.includes(normReq);
      });

      if (foundInSkills || foundInProjects || foundInExp) {
        matchedSkills.push(reqSkill);
      }
    });

    skillMatchRatio = matchedSkills.length / requiredSkills.length;
  } else {
    // If no specific skillsRequired listed on job, check how many candidate skills appear in job description
    const matched = candidateSkills.filter((s) => jobDescNorm.includes(normalize(s)));
    matchedSkills = matched;
    skillMatchRatio = candidateSkills.length > 0 ? Math.min(matched.length / 3, 1) : 0.5;
  }

  // 2. Experience & Title Alignment (Weight: 25%)
  let experienceScore = 0;
  if (experience.length > 0) {
    experienceScore = 0.5; // Has baseline experience
    // Check if role title overlaps with job title
    const hasRoleMatch = experience.some((e) => {
      const roleWords = normalize(e.role).split(/\s+/);
      return roleWords.some((word) => word.length > 3 && jobTitleNorm.includes(word));
    });
    if (hasRoleMatch) experienceScore = 1.0;
  } else if (user.resumeUrl) {
    experienceScore = 0.4;
  }

  // 3. Projects & Practical Demonstrations (Weight: 15%)
  let projectScore = 0;
  if (projects.length > 0) {
    projectScore = 0.5;
    const projectRelevance = projects.some((p) => {
      const pText = normalize(`${p.title} ${p.description}`);
      return pText.split(/\s+/).some((word) => word.length > 3 && jobDescNorm.includes(word));
    });
    if (projectRelevance) projectScore = 1.0;
  }

  // 4. Certifications Bonus (Weight: 10%)
  let certScore = 0;
  if (certificates.length > 0) {
    certScore = 0.5;
    const certRelevance = certificates.some((c) => {
      const cText = normalize(`${c.title} ${c.issuer}`);
      return cText.split(/\s+/).some((word) => word.length > 3 && (jobDescNorm.includes(word) || jobTitleNorm.includes(word)));
    });
    if (certRelevance) certScore = 1.0;
  }

  // Calculate weighted composite score
  const composite = skillMatchRatio * 50 + experienceScore * 25 + projectScore * 15 + certScore * 10;
  const finalScore = Math.min(Math.max(Math.round(composite), 10), 99);

  let category = 'Low Match';
  if (finalScore >= 75) {
    category = 'Strong Match';
  } else if (finalScore >= 50) {
    category = 'Good Match';
  }

  return {
    score: finalScore,
    category,
    matchedSkills,
    skillsCoverage: Math.round(skillMatchRatio * 100),
  };
};
