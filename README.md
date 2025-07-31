# SoleCRM Starter Boilerplate

This is a minimal CRM built with React, Express, Prisma, and PostgreSQL.

## Setup Instructions

### 1. Database

- Install PostgreSQL locally or use a cloud provider (Supabase recommended).
- Create a database and get the connection string.
- Set environment variable `DATABASE_URL`:

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

### 2. Backend

```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev --name init
node index.js
```

Backend will run on port 4000.

### 3. Frontend

```bash
cd ../client
npm install
npm start
```

Frontend runs on port 3000 by default and connects to backend.

---

## Notes

- Currently no authentication implemented. Add Firebase/Auth.js or NextAuth as needed.
- This is a simple base for leads CRUD operations.
- Expand with filtering, user management, and real estate-specific fields.

---

## Deployment Suggestions

- Host backend on Railway or Render.
- Host frontend on Vercel.
- Use Supabase for managed PostgreSQL and Auth.

---

Built for Damian Clarke — SoleCRM starter.

