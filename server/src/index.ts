import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { prisma } from './config/db.js';
import { errorHandler } from './middleware/error.middleware.js';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/users.routes.js';
import employeeRoutes from './modules/employees/employees.routes.js';
import contractRoutes from './modules/contracts/contracts.routes.js';
import scheduleRoutes from './modules/schedules/schedules.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';
import timeoffRoutes from './modules/timeoff/timeoff.routes.js';
import salaryConfigRoutes from './modules/salary-config/salary-config.routes.js';
import payrollRoutes from './modules/payroll/payroll.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';

const app = express();

// Middlewares
app.use(cors({
  origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
  credentials: true
}));
app.use(express.json());

// Request logging in development
if (env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    // Quick DB ping
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      service: 'PeoplePay360 API',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'error',
      service: 'PeoplePay360 API',
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/timeoff', timeoffRoutes);
app.use('/api/salary-config', salaryConfigRoutes);
app.use('/api', payrollRoutes); // mounts /api/payruns and /api/payslips
app.use('/api/dashboard', dashboardRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 PeoplePay360 Backend running on port ${PORT}`);
  console.log(`📡 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=========================================`);
});

export default app;
