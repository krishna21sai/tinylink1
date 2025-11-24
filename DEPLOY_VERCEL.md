Vercel deployment guide (frontend + backend)
===========================================

This repository contains a Create React App frontend (`/frontend`) and a Node/Express backend (`/backend`).

Recommended approach
- Deploy the frontend to Vercel (static site).
- Deploy the backend to a Node host (Render, Railway, or Render) and point the frontend to the backend URL via environment variables.

Steps — Backend (recommended: Render / Railway / Heroku)
1. Provision a Postgres database (Neon, Render Postgres, Railway, etc.).
2. Ensure the DB connection env vars are set on your backend host (use the same names the app reads):

   - `PGHOST`
   - `PGDATABASE`
   - `PGUSER`
   - `PGPASSWORD`
   - `PGPORT` (optional)
   - `PGSSLMODE` (set to `require` for Neon)

3. Deploy the backend (example with Render):
   - Create a new Web Service, connect your Git repo, and set the root directory to `/backend`.
   - Build / start command: `npm start` (the repo already has `start` script in `backend/package.json`).
   - Set the environment variables above in the Render dashboard.
4. Initialize the DB schema (run the SQL in `backend/db/init.sql`) using psql or your provider's SQL editor. Example using psql:

```powershell
psql "host=$env:PGHOST dbname=$env:PGDATABASE user=$env:PGUSER password=$env:PGPASSWORD sslmode=require" -f backend/db/init.sql
```

5. Confirm the backend is up: `GET https://your-backend.example.com/healthz` should return 200 JSON.

Steps — Frontend (Vercel)
1. Go to https://vercel.com and create/import a new project from this Git repository.
2. When Vercel asks for the Project Root, set it to `frontend` (this ensures Vercel builds the CRA app).
3. Set Environment Variables in the Vercel project settings (Environment > Environment Variables):
   - `REACT_APP_API_BASE_URL` → `https://your-backend.example.com`
   - `REACT_APP_REDIRECT_BASE_URL` → `https://your-backend.example.com`

4. Vercel will detect `package.json` and use the build command `npm run build` and output directory `build`. If it doesn't auto-detect, configure:
   - Build Command: `npm run build`
   - Output Directory: `build`

5. Deploy. After the build, your frontend will be available at `https://<your-vercel-project>.vercel.app`.

Optional: Single-project deployment on Vercel (serverless backend)
- You can convert the Express backend into Vercel Serverless Functions under `/api/*` but that requires reorganizing the backend (moving route handlers into serverless function files) and wiring Postgres connections carefully for serverless.
- If you'd like, I can help convert critical endpoints to serverless functions so both frontend & backend run on Vercel.

Notes & tips
- Keep your database credentials secret — use Vercel/Render environment variable settings (do not commit secrets).
- For auth or cookie-based flows, configure CORS and `Access-Control-Allow-Credentials` appropriately.
- Update `frontend/.env.example` and `backend/.env.example` if you change environment variable names.

If you want, I can:
- Add a small `vercel.json` or project-specific config file to the repo.
- Convert the backend into Vercel serverless functions (I can scaffold this for the core endpoints: POST /api/links, GET /api/links, GET /api/links/:code, DELETE /api/links/:code, and GET /:code redirect).
- Create a GitHub Action that deploys the backend to Render/Railway automatically on push.
