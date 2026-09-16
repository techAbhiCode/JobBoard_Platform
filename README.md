# CodeAlpha JobBoard Platform

A full-stack job board that connects candidates with employers and provides resume analysis and job matching powered by Google Gemini. The project is organized as a React/Vite frontend and an Express/MongoDB/Redis backend.

## Contents

- [Features](#features)
- [Technology](#technology)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Run the Application](#run-the-application)
- [User Roles and Workflows](#user-roles-and-workflows)
- [API Reference](#api-reference)
- [Docker Services](#docker-services)
- [Vercel Deployment](#vercel-deployment)
- [Troubleshooting](#troubleshooting)

## Features

### Candidates

- Register and sign in as a candidate.
- Maintain a profile with contact details, skills, experience, projects, and certificates.
- Upload a resume in PDF, DOC, or DOCX format, up to 5 MB.
- Browse and search open jobs.
- Apply to jobs with a resume and application details.
- View application statuses.
- Analyze a resume with Google Gemini.
- View resume history and AI-generated job match scores.

### Employers

- Register and sign in as an employer.
- Create, update, close, and delete job listings.
- View applications submitted to owned jobs.
- Update application status.

### Administrators

- Initialize the first administrator through the dedicated admin portal.
- Sign in through the admin authentication flow.
- View platform statistics and registered users.
- Access admin-only routes protected by JWT and role authorization.

## Technology

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, React Router, Axios, Tailwind CSS |
| Backend | Node.js, Express 5 |
| Database | MongoDB with Mongoose |
| Cache and rate limiting | Redis with ioredis and rate-limit-redis |
| Authentication | JWT and bcrypt |
| File uploads | Multer |
| Resume parsing | pdf-parse |
| AI workflows | LangChain, LangGraph, Google Gemini |
| Deployment | Vercel |

## Project Structure

```text
.
├── backend/
│   ├── config/              MongoDB and Redis connections
│   ├── controllers/         Request handlers
│   ├── middlewares/         Authentication, uploads, errors, rate limits
│   ├── models/              Mongoose schemas
│   ├── routes/              API route definitions
│   ├── services/            AI resume and job-matching services
│   ├── index.js             Express application entrypoint
│   ├── package.json
│   └── vercel.json
├── frontend-latest/
│   ├── public/
│   ├── src/
│   │   ├── api/             Axios client
│   │   ├── components/      Shared UI components
│   │   ├── context/         Authentication context
│   │   ├── pages/            Application screens
│   │   └── utils/            Frontend utilities
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json
├── docker-compose.yml        Local MongoDB and Redis services
└── README.md
```

## Requirements

- Node.js 18 or newer
- npm 9 or newer
- Docker Desktop, recommended for local MongoDB and Redis
- A Google Gemini API key for resume analysis features

For production, use hosted MongoDB and Redis providers such as MongoDB Atlas and Upstash Redis or Redis Cloud.

## Local Setup

Clone the repository and install dependencies in both applications:

```bash
git clone <repository-url>
cd CodeAlpha_JobBoard_Platform

cd backend
npm install

cd ../frontend-latest
npm install
```

Start MongoDB and Redis from the repository root:

```bash
docker compose up -d
```

The Compose file publishes MongoDB on `localhost:27017` and Redis on `localhost:6379`, and stores their data in named Docker volumes.

## Environment Variables

### Backend

Create `backend/.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/jobboard
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=replace-with-a-long-random-secret
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.5-flash
PORT=5000
```

`MONGO_URI`, `JWT_SECRET`, and `GEMINI_API_KEY` are required for the corresponding features. `REDIS_URL` defaults to `redis://127.0.0.1:6379`, `GEMINI_MODEL` defaults to `gemini-3.5-flash`, and `PORT` defaults to `5000`.

### Frontend

Create or update `frontend-latest/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Vite exposes only variables prefixed with `VITE_` to browser code. Do not place secrets in the frontend environment file.

Never commit `.env` files or API keys. The repository `.gitignore` excludes environment files, uploads, build output, and dependency directories.

## Run the Application

Run the backend in one terminal:

```bash
cd backend
npm run dev
```

Run the frontend in a second terminal:

```bash
cd frontend-latest
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

Useful commands:

```bash
# Frontend production build
cd frontend-latest
npm run build

# Frontend linting
npm run lint

# Preview the built frontend
npm run preview
```

The backend currently has no automated test suite. Its `npm test` script is the default placeholder and exits with an error.

## User Roles and Workflows

### Candidate registration

Use `POST /api/auth/register` with a `role` of `Candidate`. Public registration cannot create an administrator account.

### Employer registration

Use the same endpoint with a `role` of `Employer` and provide `companyName`.

### Administrator initialization

The first administrator is created with `POST /api/admin/auth/init`. Once an administrator exists, initialization is permanently locked and subsequent calls are rejected. Use `POST /api/admin/auth/login` afterward.

### Authentication

Successful login and registration responses return a JWT. The frontend stores the token in `localStorage` and sends it as:

```http
Authorization: Bearer <token>
```

JWTs expire after 30 days. Protected endpoints require a valid token and some endpoints additionally require a specific role.

## API Reference

The base URL is `http://localhost:5000/api` locally, or the deployed backend URL followed by `/api` in production.

### Health

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/health` | Public | Check whether the API is running |

### Authentication

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Register a Candidate or Employer |
| POST | `/auth/login` | Public | Log in a Candidate or Employer |
| GET | `/auth/me` | Authenticated | Return the current user |

### Jobs

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/jobs` | Public | List jobs |
| POST | `/jobs` | Employer | Create a job |
| GET | `/jobs/:id` | Public | Get one job |
| PUT | `/jobs/:id` | Employer or Admin | Update a job |
| DELETE | `/jobs/:id` | Employer or Admin | Delete a job |

Job listings use fields including `title`, `description`, `company`, `location`, `salary`, `jobType`, `status`, and `skillsRequired`. Supported job types are `Full-Time`, `Part-Time`, `Contract`, and `Internship`; statuses are `Open` and `Closed`.

### Applications

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/applications/:jobId` | Candidate | Apply with multipart form data and an optional resume |
| GET | `/applications/me` | Candidate | List the current candidate's applications |
| GET | `/applications/jobs/:jobId` | Employer or Admin | List applications for a job |
| PUT | `/applications/:id` | Employer or Admin | Update an application status |

Application statuses are `Pending`, `Reviewed`, `Accepted`, and `Rejected`. Resume uploads use the multipart field name `resume`.

### Profiles

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/profile` | Authenticated | Get the current profile |
| PUT | `/profile` | Authenticated | Update profile data |
| POST | `/profile/resume` | Candidate | Upload or replace a profile resume |
| POST | `/profile/recalculate-matches` | Candidate | Recalculate stored job matches |

### AI and matching

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/ai/analyze-resume` | Candidate | Analyze a resume |
| POST | `/ai/analyze-resume-detailed` | Candidate | Run detailed resume analysis |
| GET | `/ai/match/:jobId` | Candidate | Get a match score for a job |
| GET | `/ai/my-analysis` | Candidate | Get the current resume analysis |
| GET | `/ai/detailed-history` | Candidate | Get detailed analysis history |

AI resume endpoints expect a multipart file in the `resume` field. The Gemini API key must be configured on the backend.

### Administration

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/admin/auth/status` | Public | Check whether an admin exists |
| POST | `/admin/auth/init` | Public, one time | Initialize the first admin |
| POST | `/admin/auth/login` | Public | Log in as an admin |
| GET | `/admin/stats` | Admin | Get user, job, and application counts |
| GET | `/admin/users` | Admin | List users without passwords |

Authentication endpoints are rate-limited to 20 requests per IP per 15 minutes. All API requests are limited to 500 requests per IP per 15 minutes. Redis is used for the rate-limit store when available, with an in-memory fallback.

## Docker Services

`docker-compose.yml` starts:

| Service | Image | Host port | Data volume |
| --- | --- | --- | --- |
| `mongodb` | `mongo:7` | `27017` | `mongodb_data` |
| `redis` | `redis:7-alpine` | `6379` | `redis_data` |

Commands:

```bash
# Start services in the background
docker compose up -d

# View service status
docker compose ps

# View logs
docker compose logs -f mongodb redis

# Stop services while retaining volumes
docker compose down

# Stop services and delete local database/cache data
docker compose down -v
```

## Vercel Deployment

Deploy the frontend and backend as two separate Vercel projects.

### Backend project

1. Import the repository into Vercel.
2. Set the project root directory to `backend`.
3. Vercel uses `backend/vercel.json` and the `@vercel/node` runtime.
4. Add the backend environment variables:

```env
MONGO_URI=<MongoDB Atlas connection string>
REDIS_URL=<hosted Redis connection string>
JWT_SECRET=<secure production secret>
GEMINI_API_KEY=<Gemini API key>
GEMINI_MODEL=gemini-3.5-flash
```

The backend exposes `/api/health` for a deployment smoke test.

### Frontend project

1. Create a second Vercel project from the same repository.
2. Set the project root directory to `frontend-latest`.
3. Vercel uses `frontend-latest/vercel.json` to build `dist` and rewrite SPA routes to `index.html`.
4. Add:

```env
VITE_API_URL=https://<backend-project>.vercel.app/api
```

Redeploy the frontend after changing its environment variables. The backend currently enables CORS globally, so the separately hosted frontend can call the API.

### Important production storage note

Vercel functions use ephemeral storage. Files written to the backend `uploads/` directory are not durable across deployments or function instances. For production resume storage, replace local disk uploads with object storage such as Vercel Blob, Amazon S3, Cloudinary, or another persistent storage provider, and save the resulting URL in MongoDB.

## Troubleshooting

### MongoDB connection fails

- Confirm Docker is running and `docker compose ps` shows MongoDB as healthy.
- Confirm `MONGO_URI` points to port `27017` locally.
- For Vercel, use a publicly reachable MongoDB Atlas connection string and allow the required network access.

### Redis connection fails

- Confirm port `6379` is available locally.
- Confirm `REDIS_URL` includes the correct hosted Redis protocol and credentials in production.
- The API can fall back to an in-memory rate limiter, but hosted Redis is recommended for serverless deployments.

### The frontend shows API errors

- Check that `VITE_API_URL` ends with `/api`.
- Restart Vite after changing `.env` because environment variables are read at build/start time.
- Check that the backend `/api/health` endpoint is reachable.

### A refreshed frontend route returns 404

Ensure the frontend is deployed from `frontend-latest` and that its `vercel.json` rewrite is included. The rewrite is required by React Router's browser history routing.

### Resume upload fails

- Use the multipart field name `resume`.
- Use PDF, DOC, or DOCX files only.
- Keep the file size at or below 5 MB.
- Verify that the local backend has a writable `uploads/` directory.

## License

No license file is currently included in this repository.