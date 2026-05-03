import { Request, Response } from 'express';
import prisma from '../../common/db/prisma';

// --- RECRUITMENT ---

export const getJobs = async (_req: Request, res: Response) => {
    try {
        const jobs = await prisma.jobOpening.findMany({
            include: { department: true, _count: { select: { applications: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: jobs });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Failed to fetch jobs' } });
    }
};

export const createJob = async (req: Request, res: Response) => {
    try {
        const { title, description, departmentId, deadline } = req.body;
        const job = await prisma.jobOpening.create({
            data: {
                title,
                description,
                departmentId,
                deadline: deadline ? new Date(deadline) : null
            }
        });
        res.json({ success: true, data: job });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Failed to create job' } });
    }
};

export const getApplications = async (req: Request, res: Response) => {
    try {
        const { jobId } = req.query;
        const apps = await prisma.jobApplication.findMany({
            where: jobId ? { jobId: String(jobId) } : {},
            include: { job: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: apps });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Failed to fetch applications' } });
    }
};

export const createApplication = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const app = await prisma.jobApplication.create({ data });
        res.json({ success: true, data: app });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Failed to submit application' } });
    }
};

export const updateApplicationStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const app = await prisma.jobApplication.update({
            where: { id },
            data: { status }
        });
        res.json({ success: true, data: app });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Failed to update application' } });
    }
};

// --- EMPLOYEE ACTIONS ---

export const getAwards = async (_req: Request, res: Response) => {
    try {
        const awards = await prisma.employeeAward.findMany({
            include: { employee: { include: { user: true } } },
            orderBy: { date: 'desc' }
        });
        res.json({ success: true, data: awards });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Failed to fetch awards' } });
    }
};

export const createAward = async (req: Request, res: Response) => {
    try {
        const { employeeId, awardType, date, gift, description } = req.body;
        const award = await prisma.employeeAward.create({
            data: { employeeId, awardType, date: new Date(date), gift, description }
        });
        res.json({ success: true, data: award });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Failed to create award' } });
    }
};

export const getWarnings = async (_req: Request, res: Response) => {
    try {
        const warnings = await prisma.employeeWarning.findMany({
            include: { employee: { include: { user: true } } },
            orderBy: { date: 'desc' }
        });
        res.json({ success: true, data: warnings });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Failed to fetch warnings' } });
    }
};

export const createWarning = async (req: Request, res: Response) => {
    try {
        const { employeeId, warningBy, subject, date, description } = req.body;
        const warning = await prisma.employeeWarning.create({
            data: { employeeId, warningBy, subject, date: new Date(date), description }
        });
        res.json({ success: true, data: warning });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Failed to create warning' } });
    }
};

export const getComplaints = async (_req: Request, res: Response) => {
    try {
        const complaints = await prisma.employeeComplaint.findMany({
            include: {
                complainer: { include: { user: true } },
                accused: { include: { user: true } }
            },
            orderBy: { date: 'desc' }
        });
        res.json({ success: true, data: complaints });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Failed to fetch complaints' } });
    }
};

export const createComplaint = async (req: Request, res: Response) => {
    try {
        const { employeeId, complaintAgainst, subject, date, description } = req.body;
        const complaint = await prisma.employeeComplaint.create({
            data: { employeeId, complaintAgainst, subject, date: new Date(date), description }
        });
        res.json({ success: true, data: complaint });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Failed to create complaint' } });
    }
};

export const processPromotion = async (req: Request, res: Response) => {
    try {
        const { employeeId, designation, promotionDate, description } = req.body;
        const promotion = await prisma.$transaction(async (tx) => {
            const p = await tx.promotion.create({
                data: { employeeId, designation, promotionDate: new Date(promotionDate), description }
            });
            await tx.employee.update({
                where: { id: employeeId },
                data: { jobTitleAr: designation } // Auto-update job title
            });
            return p;
        });
        res.json({ success: true, data: promotion });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Failed to process promotion' } });
    }
};

export const processTransfer = async (req: Request, res: Response) => {
    try {
        const { employeeId, departmentId, transferDate, description } = req.body;
        const transfer = await prisma.$transaction(async (tx) => {
            const t = await tx.transfer.create({
                data: { employeeId, departmentId, transferDate: new Date(transferDate), description }
            });
            await tx.employee.update({
                where: { id: employeeId },
                data: { departmentId }
            });
            return t;
        });
        res.json({ success: true, data: transfer });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Failed to process transfer' } });
    }
};

export const processResignation = async (req: Request, res: Response) => {
    try {
        const { employeeId, noticeDate, resignationDate, description } = req.body;
        const resignation = await prisma.resignation.create({
            data: { employeeId, noticeDate: new Date(noticeDate), resignationDate: new Date(resignationDate), description }
        });
        res.json({ success: true, data: resignation });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Failed to process resignation' } });
    }
};

export const processTermination = async (req: Request, res: Response) => {
    try {
        const { employeeId, noticeDate, terminationDate, terminationType, description } = req.body;
        const termination = await prisma.$transaction(async (tx) => {
            const t = await tx.termination.create({
                data: { employeeId, noticeDate: new Date(noticeDate), terminationDate: new Date(terminationDate), terminationType, description }
            });
            await tx.employee.update({
                where: { id: employeeId },
                data: { status: 'terminated' }
            });
            return t;
        });
        res.json({ success: true, data: termination });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Failed to process termination' } });
    }
};

// --- COMMUNICATIONS ---

export const getAnnouncements = async (_req: Request, res: Response) => {
    try {
        const anns = await prisma.announcement.findMany({
            include: { department: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: anns });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Failed to fetch announcements' } });
    }
};

export const createAnnouncement = async (req: Request, res: Response) => {
    try {
        const { title, description, departmentId, startDate, endDate } = req.body;
        const ann = await prisma.announcement.create({
            data: {
                title,
                description,
                departmentId,
                startDate: new Date(startDate),
                endDate: new Date(endDate)
            }
        });
        res.json({ success: true, data: ann });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Failed to create announcement' } });
    }
};

export const getMeetings = async (_req: Request, res: Response) => {
    try {
        const meetings = await prisma.hRMeeting.findMany({ orderBy: { date: 'desc' } });
        res.json({ success: true, data: meetings });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Failed to fetch meetings' } });
    }
};

export const createMeeting = async (req: Request, res: Response) => {
    try {
        const { title, date, time, location, description } = req.body;
        const meeting = await prisma.hRMeeting.create({
            data: { title, date: new Date(date), time, location, description }
        });
        res.json({ success: true, data: meeting });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Failed to create meeting' } });
    }
};

export const getEvents = async (_req: Request, res: Response) => {
    try {
        const events = await prisma.hREvent.findMany({ orderBy: { startDate: 'desc' } });
        res.json({ success: true, data: events });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Failed to fetch events' } });
    }
};

export const createEvent = async (req: Request, res: Response) => {
    try {
        const { title, startDate, endDate, description } = req.body;
        const event = await prisma.hREvent.create({
            data: { title, startDate: new Date(startDate), endDate: new Date(endDate), description }
        });
        res.json({ success: true, data: event });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Failed to create event' } });
    }
};

// --- ANALYTICS ---

export const getHRDashboard = async (_req: Request, res: Response) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            totalEmployees,
            totalDepts,
            activeJobs,
            todayApps,
            todayAttendance,
            expiredDocs,
            upcomingBirthdays,
            deptDistribution,
            attendanceStats
        ] = await Promise.all([
            prisma.employee.count({ where: { status: 'active' } }),
            prisma.department.count(),
            prisma.jobOpening.count({ where: { status: 'active' } }),
            prisma.jobApplication.count({ where: { createdAt: { gte: today } } }),
            prisma.staffAttendance.count({ where: { date: today, status: 'present' } }),
            prisma.employeeDocument.count({ where: { expiryDate: { lte: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000) } } }),
            prisma.employee.findMany({
                where: { status: 'active' },
                include: { user: true },
                take: 5
            }),
            prisma.department.findMany({
                select: {
                    nameAr: true,
                    _count: { select: { employees: true } }
                }
            }),
            prisma.staffAttendance.groupBy({
                by: ['date'],
                _count: { id: true },
                where: { date: { gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000) }, status: 'present' },
                orderBy: { date: 'asc' }
            })
        ]);

        const stats = {
            totalEmployees,
            totalDepts,
            activeJobs,
            todayApps,
            attendanceRate: totalEmployees > 0 ? (todayAttendance / totalEmployees) * 100 : 0,
            expiredDocsCount: expiredDocs,
            deptChart: deptDistribution.map(d => ({ name: d.nameAr, value: d._count.employees })),
            attendanceTrend: attendanceStats.map(a => ({ date: a.date.toLocaleDateString('ar-SA', { weekday: 'short' }), count: a._count.id }))
        };

        res.json({ success: true, data: { stats, upcomingBirthdays } });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Failed to fetch dashboard data' } });
    }
};

// --- SHIFTS ---
export const getShifts = async (_req: Request, res: Response) => {
    try {
        const shifts = await prisma.shift.findMany({
            include: { _count: { select: { employees: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: shifts });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Failed to fetch shifts' } });
    }
};

export const createShift = async (req: Request, res: Response) => {
    try {
        const { nameAr, nameEn, startTime, endTime, type, isSplit, startTime2, endTime2, breakDuration, totalHours } = req.body;
        console.log('[HRMSController] Creating shift:', { nameAr, nameEn, startTime, endTime, type, isSplit, breakDuration, totalHours });
        const shift = await prisma.shift.create({
            data: {
                nameAr,
                nameEn,
                startTime,
                endTime,
                type: type || 'M',
                isSplit: !!isSplit,
                startTime2,
                endTime2,
                breakDuration: Number(breakDuration) || 0,
                totalHours: Number(totalHours) || 0
            }
        });
        res.json({ success: true, data: shift });
    } catch (error: any) {
        console.error('[HRMSController] Create shift error:', error);
        res.status(500).json({ success: false, error: { message: 'Failed to create shift', details: error.message } });
    }
};

export const updateShift = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { nameAr, nameEn, startTime, endTime, type, isSplit, startTime2, endTime2, breakDuration, totalHours } = req.body;
        const shift = await prisma.shift.update({
            where: { id },
            data: {
                nameAr,
                nameEn,
                startTime,
                endTime,
                type,
                isSplit: !!isSplit,
                startTime2,
                endTime2,
                breakDuration: Number(breakDuration) || 0,
                totalHours: Number(totalHours) || 0
            }
        });
        res.json({ success: true, data: shift });
    } catch (error: any) {
        console.error('[HRMSController] Update shift error:', error);
        res.status(500).json({ success: false, error: { message: 'Failed to update shift', details: error.message } });
    }
};

export const deleteShift = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check if shift is assigned to any employees
        const employeeCount = await prisma.employee.count({ where: { shiftId: id } });
        if (employeeCount > 0) {
            return res.status(400).json({
                success: false,
                error: { message: 'Cannot delete shift because it is assigned to employees. Please reassign them first.' }
            });
        }

        await prisma.shift.delete({ where: { id } });
        res.json({ success: true });
    } catch (error: any) {
        console.error('[HRMSController] Delete shift error:', error);
        res.status(500).json({ success: false, error: { message: 'Failed to delete shift', details: error.message } });
    }
};
