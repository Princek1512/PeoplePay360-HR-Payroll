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

- **Frontend Client (`client/`)**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React Icons, Axios, React Router v6
- **Backend API (`server/`)**: Node.js, Express, TypeScript, tsx
- **ORM & Database**: Prisma ORM + PostgreSQL 16 (Supports local Docker and Cloud PostgreSQL e.g., Supabase, Neon, Railway)
- **Authentication**: Stateless JWT access & refresh tokens + bcrypt password hashing
- **Security & Permissions**: Centralized 5-tier RBAC matrix and audited transactions

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 20+
- Cloud PostgreSQL (e.g., Supabase, Neon) OR Docker for local PostgreSQL

### 2. Configure Backend
Copy `server/.env.example` to `server/.env`:
```bash
cd server
cp .env.example .env
```
Set your PostgreSQL connection string in `server/.env`:
```env
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/postgres?sslmode=require"
```

### 3. Initialize Database & Seed
From `server/` directory:
```bash
npm install
npx prisma generate
npm run prisma:push
npm run prisma:seed
```

### 4. Start Backend Server
```bash
npm run dev
```
Backend runs at `http://localhost:5000` (Health check: `http://localhost:5000/api/health`).

### 5. Start Frontend Client
In another terminal:
```bash
cd client
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

---

## 👥 Default Demo Accounts

Use the **1-Click Quick Demo Switcher** on the login page or enter credentials manually:

| Role | Email | Password | Scope |
|---|---|---|---|
| **Admin** | `admin@peoplepay360.com` | `Admin@123` | Full system control, users & roles |
| **HR Payroll Manager** | `payroll.manager@peoplepay360.com` | `Password@123` | Full payroll runs, salary structures & rules |
| **HR Manager** | `hr.manager@peoplepay360.com` | `Password@123` | Employees, contracts, attendance, time off approvals |
| **HR Payroll User** | `payroll.user@peoplepay360.com` | `Password@123` | Payrun generation & payslips view |
| **Employee** | `employee@peoplepay360.com` | `Password@123` | Personal profile, punch clock, time off & payslips |

---

## 📜 License
MIT
