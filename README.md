# PeoplePay360 — HR & Payroll Enterprise Platform

PeoplePay360 is an integrated, enterprise-grade HR + Payroll platform where the **Employee record is the central hub**. Contracts and Working Schedules feed payroll context, Attendance and Time Off capture daily activity, Salary Structures/Rules define computation, and **Payruns** turn selected employees into validated, printable, emailable **Payslips**.

---

## 🌟 Key Features

1. **5-Tier Role-Based Access Control (RBAC)**:
   - `Employee`: Profile, check-in/out, own time-off requests, and own payslip view.
   - `HR Manager`: Full employee, contract, schedule, attendance, and time-off approval.
   - `HR Payroll User`: Payrun & payslip management, read-only structure views.
   - `HR Payroll Manager`: Full CRUD on payroll, salary structures & sequenced rules.
   - `Admin`: Full system control including user management and role assignment.

2. **Core Business Logic Engines**:
   - **Sequenced Salary Engine**: Computes rules in ascending sequence order (`BASIC`, `HRA`, `CONVEYANCE`, `SPECIAL`, `GROSS`, `PF`, `TAX`, `NET`) supporting fixed amounts, percentages, and custom math formulas.
   - **One Active Contract Rule**: Enforces that no employee can have overlapping active running contracts for any given period.
   - **Auto-Derived Weekly Hours**: Computes weekly hours from daily schedule lines (shifts and breaks).
   - **Transactional Time-Off Decrement**: Atomically updates request status and deducts allocated days within a single database transaction.
   - **2-Step Payrun Lifecycle**: Step 1 scope collection (no persistence) ➔ Step 2 employee selection ➔ Compute ➔ Validate (blocking vs informational warnings) ➔ Mark Paid ➔ Bulk Send Payslips.
   - **Live SQL Dashboard Aggregation**: Real aggregate analytics for salary costs by department, net salary trends, attendance health %, and active alerts.
   - **HTML/Printable Payslips**: Formatted payslip statement ready for printing and PDF generation.

---

## 🏗️ Architecture & Tech Stack

- **Backend Framework**: Node.js + Express + TypeScript
- **ORM & Database**: Prisma ORM + PostgreSQL 16 (supports Docker and Cloud providers like Neon, Supabase, Railway)
- **Authentication**: Stateless JWT access & refresh tokens + bcrypt password hashing
- **Security**: Centralized RBAC permissions matrix, strict input validation

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 20+
- Docker (optional, if running PostgreSQL locally) OR a Cloud PostgreSQL database URL (Neon, Supabase, Railway)

### 2. Environment Setup
Copy `.env.example` to `server/.env`:
```bash
cp .env.example server/.env
```
Set your PostgreSQL connection string in `server/.env`:
```env
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/peoplepay360?schema=public"
```

### 3. Install Dependencies & Generate Prisma Client
```bash
cd server
npm install
npx prisma generate
```

### 4. Push Database Schema & Seed Demo Data
```bash
npm run prisma:push
npm run prisma:seed
```

### 5. Start Development Server
```bash
npm run dev
```
Server runs on `http://localhost:5000`.
Health check: `http://localhost:5000/api/health`

---

## 🐳 Docker Deployment

To spin up PostgreSQL 16 Alpine, pgAdmin 4, and the PeoplePay360 backend in Docker containers:
```bash
docker compose up -d
```
- API: `http://localhost:5000`
- pgAdmin: `http://localhost:5050` (Login: `admin@peoplepay360.com` / `admin123`)

---

## 👥 Default Demo Accounts

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@peoplepay360.com` | `Admin@123` |
| **HR Payroll Manager** | `payroll.manager@peoplepay360.com` | `Password@123` |
| **HR Manager** | `hr.manager@peoplepay360.com` | `Password@123` |
| **HR Payroll User** | `payroll.user@peoplepay360.com` | `Password@123` |
| **Employee** | `employee@peoplepay360.com` | `Password@123` |

---

## 📜 License
MIT
