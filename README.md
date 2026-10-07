# Job Tracker API

REST API for a job application tracker. Users register, log in, and manage their own job applications.

**Live API:** https://job-api-zeek.onrender.com
**Frontend repo:** https://github.com/Manish-singh116/job-client
**Live app:** https://job-client-black.vercel.app

> This runs on a free plan and sleeps when idle, so the first request can take up to a minute.

## Features
- User registration and login with JWT authentication
- Passwords hashed with bcrypt
- Protected routes: every job belongs to the user who created it
- Full CRUD for job applications
- Input validation and clear error messages

## Tech stack
- Node.js and Express
- MongoDB Atlas with Mongoose
- JSON Web Tokens (jsonwebtoken) and bcryptjs
- CORS, dotenv

## API endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | No | Create an account |
| POST | /api/auth/login | No | Log in and get a token |
| GET | /api/jobs | Yes | List my jobs |
| POST | /api/jobs | Yes | Add a job |
| PUT | /api/jobs/:id | Yes | Update a job |
| DELETE | /api/jobs/:id | Yes | Delete a job |

Send the token as a header: `Authorization: Bearer <token>`

## Environment variables
Create a `.env` file in the project root:

```
MONGO_URI=your MongoDB connection string
JWT_SECRET=any long random text
CLIENT_URL=http://localhost:5173
```

## Run locally
```bash
git clone https://github.com/Manish-singh116/job-api.git
cd job-api
npm install
node server.js
```
The server starts on port 5000.
