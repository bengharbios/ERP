import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// Triggering nodemon restart for prisma generate
import authRoutes from './modules/auth/auth.routes';
import academicRoutes from './modules/academic/academic.routes';
import studentsRoutes from './modules/students/students.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import assignmentsRoutes from './modules/assignments/assignments.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import settingsRoutes from './modules/settings/settings.routes';
import usersRoutes from './modules/users/users.routes';
import financeRoutes from './modules/finance/finance.routes';
import expenseRoutes from './modules/finance/expense.routes';
import marketingRoutes from './modules/marketing/marketing.routes';
import hrRoutes from './modules/hr/hr.routes';
import hrmsRoutes from './modules/hr/hrms.routes';
import databaseRoutes from './modules/database/database.routes';
import crmRoutes from './modules/crm/crm.routes';
import accountingRoutes from './routes/accounting.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
    res.json({
        success: true,
        message: 'Institute ERP API is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.get('/api/v1', (_req, res) => {
    res.json({
        success: true,
        message: 'Institute ERP API v1',
        version: '1.0.0'
    });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/academic', academicRoutes);
app.use('/api/v1/students', studentsRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/assignments', assignmentsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/fees', financeRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/marketing', marketingRoutes);
app.use('/api/v1/hr', hrRoutes);
app.use('/api/v1/hrms', hrmsRoutes);
app.use('/api/v1/crm', crmRoutes);
app.use('/api/v1/database', databaseRoutes);
app.use('/api/v1/accounting', accountingRoutes); // 💰 Accounting Module

// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Endpoint not found'
        }
    });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        error: {
            code: err.code || 'INTERNAL_SERVER_ERROR',
            message: err.message || 'An unexpected error occurred'
        }
    });
});

const HOST = '0.0.0.0';
app.listen(Number(PORT), HOST, () => {
    console.log(`🚀 Server is running on http://${HOST}:${PORT}`);
    console.log(`📚 API: http://${HOST}:${PORT}/api/v1`);
    console.log(`❤️  Health: http://${HOST}:${PORT}/health`);
});

export default app;