# How to Run JADMAA Varmakalai Platform

## 1. Project Overview & Architecture

**JADMAA Varmakalai** is a full-stack Learning Management System (LMS) and web portal for traditional martial arts, healing arts, and self-defence courses.

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, React Router 7, Lucide Icons, AOS animations.
- **Backend**: Node.js, Express 5, TypeScript (`tsx`), Prisma ORM 5, PostgreSQL (Supabase).
- **Architecture**: In development mode, `server.ts` runs an Express server that integrates Vite as middleware on **Port 3000**. The entire application (both the frontend Single Page Application and the `/api/v1` backend endpoints) is served seamlessly through a single URL: `http://localhost:3000`.

---

## 2. Directory Structure

> **Note**: You cloned the repo inside `jadma/`, so the project files are located in `jadma/jadma/`:

```
jadma/
└── jadma/                    <-- Project Root (package.json, .env, server.ts)
    ├── src/                  <-- React Frontend
    │   ├── components/       <-- UI components (Navbar, Footer, etc.)
    │   ├── pages/            <-- Pages (Home, Courses, Dashboard, Admin)
    │   ├── routes/           <-- App router (AppRoutes.tsx)
    │   └── lib/api/          <-- Frontend API clients
    ├── server/               <-- Express Backend
    │   ├── app.ts            <-- Express app setup and route registration
    │   ├── modules/          <-- Auth, courses, enrollments, payments, etc.
    │   └── services/         <-- Email (Brevo/SMTP), SMS services
    ├── prisma/               <-- Database schema (schema.prisma) & seeds
    ├── .env                  <-- Environment variables (Already configured)
    └── server.ts             <-- Unified Dev Server entry point
```

---

## 3. Prerequisites

- **Node.js**: v18.0.0 or higher (Your installed version: `v22.19.0` ✅)
- **npm**: v9.0.0 or higher (Your installed version: `11.10.0` ✅)

---

## 4. Step-by-Step Instructions to Run

### Step 1: Open the Project Directory

Open your PowerShell or Terminal and navigate to the project directory:

```powershell
cd "c:\Users\Hari karthick\Desktop\jadma\jadma"
```

### Step 2: Install Dependencies (Already Completed)

If you ever need to re-install dependencies:

```powershell
npm install
```
*(This automatically runs `prisma generate` to configure the Prisma client).*

### Step 3: Verify Environment Configuration (`.env`)

A `.env` file has already been prepared with the active Supabase PostgreSQL database connection:

```env
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/jadmaa_db?schema=public"
JWT_SECRET="your_secure_random_jwt_secret_min_32_chars"
JWT_REFRESH_SECRET="your_secure_random_refresh_secret_min_32_chars"
FRONTEND_URL="http://localhost:3000"
API_BASE_URL="http://localhost:3000/api/v1"
```

### Step 4: Run the Development Server

Execute:

```powershell
npm run dev
```

You should see output similar to:
```
Server running on http://localhost:3000
```

### Step 5: Open in Your Browser

Open your browser and navigate to:

👉 **[http://localhost:3000](http://localhost:3000)**

---

## 5. Seeded Credentials

The database comes pre-seeded with sample courses and admin accounts:

- **Super Admin Login**:
  - **URL**: `http://localhost:3000/login`
  - **Email**: `info@jadmaa.com`
  - **Password**: `Jadmaa@2026`
- **Admin Panel URL**: `http://localhost:3000/admin`
- **Student Dashboard URL**: `http://localhost:3000/student`

---

## 6. Useful npm Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Starts Express + Vite on `http://localhost:3000` |
| `npm run build` | Builds Vite frontend bundle and compiles `server.ts` to `dist/server.cjs` |
| `npm run start` | Runs the compiled production server (`node dist/server.cjs`) |
| `npx tsx check_db.ts` | Tests the database connection and displays course count |
| `npm run prisma:seed` | Re-seeds courses from `prisma/seed.ts` |
| `npm run prisma:generate` | Re-generates Prisma client files after schema changes |

---

## 7. Troubleshooting

- **Port 3000 is already in use**:
  Check which process is using port 3000 and stop it:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
  ```
- **Database connection error**:
  Ensure your network allows outbound traffic on ports 5432/6543 to Supabase AWS Tokyo (`aws-0-ap-northeast-1.pooler.supabase.com`). You can verify connection status anytime by running:
  ```powershell
  npx tsx check_db.ts
  ```
