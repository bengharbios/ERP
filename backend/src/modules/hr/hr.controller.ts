import { Request, Response } from 'express';
import prisma from '../../common/db/prisma';
import { AuthRequest } from '../../common/utils/jwt';
import { Decimal } from '@prisma/client/runtime/library';
import journalService from '../../services/journal.service';

// --- DEPARTMENTS ---

export const getDepartments = async (_req: Request, res: Response) => {
    try {
        const departments = await prisma.department.findMany({
            include: { _count: { select: { employees: true } } }
        });
        res.json({ success: true, data: departments });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};

export const createDepartment = async (req: Request, res: Response) => {
    try {
        const department = await prisma.department.create({ data: req.body });
        res.status(201).json({ success: true, data: department });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
};

// --- EMPLOYEES ---

export const getEmployees = async (req: Request, res: Response) => {
    try {
        const { departmentId, search } = req.query;
        const employees = await prisma.employee.findMany({
            where: {
                ...(departmentId ? { departmentId: String(departmentId) } : {}),
                ...(search ? {
                    OR: [
                        { employeeCode: { contains: String(search), mode: 'insensitive' } },
                        { user: { firstName: { contains: String(search), mode: 'insensitive' } } },
                        { user: { lastName: { contains: String(search), mode: 'insensitive' } } }
                    ]
                } : {})
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        profilePicture: true
                    }
                },
                department: true,
                shift: true,
                commissionTiers: true,
                documents: true,
                assets: true,
                performances: {
                    include: {
                        reviewer: { select: { firstName: true, lastName: true } }
                    }
                },
                trainings: true
            }
        });
        res.json({ success: true, data: employees });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};

export const getEmployeeById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const employee = await prisma.employee.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        profilePicture: true
                    }
                },
                department: true,
                commissionTiers: true,
                documents: true,
                assets: true,
                performances: {
                    include: {
                        reviewer: { select: { firstName: true, lastName: true } }
                    }
                },
                trainings: true,
                shift: true
            }
        });

        if (!employee) {
            return res.status(404).json({ success: false, error: { message: 'Employee not found' } });
        }

        res.json({ success: true, data: employee });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};

export const createEmployee = async (req: Request, res: Response) => {
    try {
        const {
            userId, departmentId, employeeCode, jobTitleAr, jobTitleEn,
            hiringDate, joiningDate, salary, housingAllowance, transportAllowance,
            otherAllowances, totalDeductions, contractType,
            salaryType, targetType, targetValue, commissionRate,
            isCommissionPercentage, hourlyRate, hourlyUnit,
            commissionLogic, minimumSalaryFloor,
            // Personal/Identity
            nationality, gender, dateOfBirth, maritalStatus,
            passportNumber, passportExpiry, nationalId, idExpiry,
            visaNumber, visaExpiry, laborCardNumber, laborCardExpiry,
            // Status & Dates
            status, statusChangeDate, lastWorkingDate,
            // Bank
            bankName, iban, swiftCode,
            // Emergency
            emergencyContactName, emergencyContactPhone, emergencyContactRelation,
            // Collections
            commissionTiers, documents, assets, performances, trainings,
            shiftId
        } = req.body;

        let finalUserId = userId;

        if (userId === 'CREATE_NEW_USER') {
            const { firstName, lastName, phone, email } = req.body;
            if (!firstName || !lastName || !phone) {
                return res.status(400).json({ success: false, error: { message: 'الاسم الأول، الاسم الأخير، ورقم الهاتف مطلوبة لإنشاء موظف جديد.' } });
            }

            // Create a brand new inactive shadow User
            const generatedUsername = `emp_${employeeCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Math.floor(1000 + Math.random() * 9000)}`;
            const generatedEmail = email && email.trim() !== '' ? email : `${generatedUsername}@alsalam-erp.com`;

            // Check if email already exists
            const emailCheck = await prisma.user.findFirst({ where: { email: generatedEmail } });
            if (emailCheck) {
                return res.status(400).json({ success: false, error: { message: `البريد الإلكتروني ${generatedEmail} مستخدم بالفعل في النظام.` } });
            }

            const newUser = await prisma.user.create({
                data: {
                    username: generatedUsername,
                    email: generatedEmail,
                    passwordHash: 'shadow_user_disabled_password_hash',
                    firstName,
                    lastName,
                    phone,
                    isActive: false
                }
            });

            finalUserId = newUser.id;
        } else {
            // Ensure user exists and isn't already an employee
            const existing = await prisma.employee.findUnique({ where: { userId } });
            if (existing) {
                return res.status(400).json({ success: false, error: { message: 'هذا المستخدم مرتبط بملف موظف آخر بالفعل.' } });
            }
        }

        // Helper for safe decimal
        const safeDecimal = (val: any) => (val === '' || val === null || val === undefined) ? new Decimal(0) : new Decimal(val);
        const safeNullableDecimal = (val: any) => (val === '' || val === null || val === undefined) ? null : new Decimal(val);

        // Helper for safe date
        const safeDate = (val: any) => (val && val !== '') ? new Date(val) : null;

        const employee = await prisma.employee.create({
            data: {
                userId: finalUserId,
                departmentId: departmentId || null,
                employeeCode,
                jobTitleAr,
                jobTitleEn,
                hiringDate: safeDate(hiringDate),
                joiningDate: safeDate(joiningDate),
                salary: safeDecimal(salary),
                housingAllowance: safeDecimal(housingAllowance),
                transportAllowance: safeDecimal(transportAllowance),
                otherAllowances: safeDecimal(otherAllowances),
                totalDeductions: safeDecimal(totalDeductions),
                contractType,
                salaryType: salaryType || 'FIXED',
                targetType: targetType || null,
                targetValue: safeNullableDecimal(targetValue),
                commissionRate: safeNullableDecimal(commissionRate),
                isCommissionPercentage: !!isCommissionPercentage,
                commissionLogic: commissionLogic || 'POSITIVE',
                minimumSalaryFloor: safeDecimal(minimumSalaryFloor),
                hourlyRate: safeNullableDecimal(hourlyRate),
                hourlyUnit: hourlyUnit ? parseInt(hourlyUnit) : 1,
                // Personal/Identity
                nationality,
                gender: gender || null,
                dateOfBirth: safeDate(dateOfBirth),
                maritalStatus: maritalStatus || null,
                passportNumber,
                passportExpiry: safeDate(passportExpiry),
                nationalId,
                idExpiry: safeDate(idExpiry),
                visaNumber,
                visaExpiry: safeDate(visaExpiry),
                laborCardNumber,
                laborCardExpiry: safeDate(laborCardExpiry),
                status: status || 'active',
                statusChangeDate: safeDate(statusChangeDate),
                lastWorkingDate: safeDate(lastWorkingDate),
                // Bank
                bankName,
                iban,
                swiftCode,
                // Emergency
                emergencyContactName,
                emergencyContactPhone,
                emergencyContactRelation,
                shiftId: shiftId || null,
                status: 'active',
                // Tiers Relation
                commissionTiers: (commissionTiers && Array.isArray(commissionTiers) && commissionTiers.length > 0) ? {
                    create: commissionTiers.map((tier: any) => ({
                        targetNumber: parseInt(tier.targetNumber),
                        targetThreshold: safeDecimal(tier.targetThreshold),
                        commissionAmount: safeDecimal(tier.commissionAmount)
                    }))
                } : undefined,
                documents: (documents && Array.isArray(documents) && documents.length > 0) ? {
                    create: documents.map((doc: any) => ({
                        title: doc.title,
                        fileUrl: doc.fileUrl || '', // Ensure no null if required
                        docType: doc.docType,
                        expiryDate: safeDate(doc.expiryDate)
                    }))
                } : undefined,
                assets: (assets && Array.isArray(assets) && assets.length > 0) ? {
                    create: assets.map((asset: any) => ({
                        assetName: asset.assetName,
                        serialNumber: asset.serialNumber,
                        category: asset.category,
                        status: asset.status || 'assigned',
                        assignmentDate: safeDate(asset.assignmentDate) || new Date()
                    }))
                } : undefined,
                performances: (performances && Array.isArray(performances) && performances.length > 0) ? {
                    create: performances.map((p: any) => ({
                        reviewerId: p.reviewerId || (req as any).user?.id,
                        reviewDate: safeDate(p.reviewDate) || new Date(),
                        period: p.period,
                        rating: parseInt(p.rating),
                        feedback: p.feedback,
                        goals: p.goals
                    }))
                } : undefined,
                trainings: (trainings && Array.isArray(trainings) && trainings.length > 0) ? {
                    create: trainings.map((t: any) => ({
                        courseName: t.courseName,
                        provider: t.provider,
                        completionDate: safeDate(t.completionDate),
                        expiryDate: safeDate(t.expiryDate),
                        status: t.status || 'completed'
                    }))
                } : undefined
            },
            include: { user: true, department: true, commissionTiers: true, documents: true, assets: true, performances: true, trainings: true }
        });
        return res.status(201).json({ success: true, data: employee });
    } catch (error: any) {
        console.error('Create Employee Error detailed:', error);
        return res.status(400).json({ success: false, error: { message: error.message, details: error.meta } });
    }
};

export const updateEmployee = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Clean up fields that shouldn't be updated directly or need special handling
        const dataToUpdate: any = { ...data };

        // Remove relation fields that we handle separately or shouldn't update
        delete dataToUpdate.id;
        delete dataToUpdate.commissionTiers;
        delete dataToUpdate.documents;
        delete dataToUpdate.assets;
        delete dataToUpdate.performances;
        delete dataToUpdate.trainings;
        delete dataToUpdate.user;
        delete dataToUpdate.department;
        delete dataToUpdate.createdAt;
        delete dataToUpdate.updatedAt;

        // Helpers (Same as create)
        const safeDecimal = (val: any) => (val === '' || val === null || val === undefined) ? new Decimal(0) : new Decimal(val);
        const safeNullableDecimal = (val: any) => (val === '' || val === null || val === undefined) ? null : new Decimal(val);
        const safeDate = (val: any) => (val && val !== '') ? new Date(val) : null;

        // Apply safe conversions
        if (data.salary !== undefined) dataToUpdate.salary = safeDecimal(data.salary);
        if (data.housingAllowance !== undefined) dataToUpdate.housingAllowance = safeDecimal(data.housingAllowance);
        if (data.transportAllowance !== undefined) dataToUpdate.transportAllowance = safeDecimal(data.transportAllowance);
        if (data.otherAllowances !== undefined) dataToUpdate.otherAllowances = safeDecimal(data.otherAllowances);
        if (data.totalDeductions !== undefined) dataToUpdate.totalDeductions = safeDecimal(data.totalDeductions);
        if (data.minimumSalaryFloor !== undefined) dataToUpdate.minimumSalaryFloor = safeDecimal(data.minimumSalaryFloor);

        if (data.targetValue !== undefined) dataToUpdate.targetValue = safeNullableDecimal(data.targetValue);
        if (data.commissionRate !== undefined) dataToUpdate.commissionRate = safeNullableDecimal(data.commissionRate);
        if (data.hourlyRate !== undefined) dataToUpdate.hourlyRate = safeNullableDecimal(data.hourlyRate);
        if (data.shiftId !== undefined) dataToUpdate.shiftId = data.shiftId === '' ? null : data.shiftId;

        if (data.hiringDate !== undefined) dataToUpdate.hiringDate = safeDate(data.hiringDate);
        if (data.joiningDate !== undefined) dataToUpdate.joiningDate = safeDate(data.joiningDate);
        if (data.dateOfBirth !== undefined) dataToUpdate.dateOfBirth = safeDate(data.dateOfBirth);
        if (data.passportExpiry !== undefined) dataToUpdate.passportExpiry = safeDate(data.passportExpiry);
        if (data.idExpiry !== undefined) dataToUpdate.idExpiry = safeDate(data.idExpiry);
        if (data.visaExpiry !== undefined) dataToUpdate.visaExpiry = safeDate(data.visaExpiry);
        if (data.laborCardExpiry !== undefined) dataToUpdate.laborCardExpiry = safeDate(data.laborCardExpiry);
        if (data.statusChangeDate !== undefined) dataToUpdate.statusChangeDate = safeDate(data.statusChangeDate);
        if (data.lastWorkingDate !== undefined) dataToUpdate.lastWorkingDate = safeDate(data.lastWorkingDate);
        if (data.hourlyUnit !== undefined) dataToUpdate.hourlyUnit = data.hourlyUnit ? parseInt(data.hourlyUnit) : 1;

        // Handle nested collections - Only if they are provided in the request

        // 1. Commission Tiers
        if (data.commissionTiers && Array.isArray(data.commissionTiers)) {
            await prisma.employeeCommissionTier.deleteMany({ where: { employeeId: id } });
            if (data.commissionTiers.length > 0) {
                dataToUpdate.commissionTiers = {
                    create: data.commissionTiers.map((t: any) => ({
                        targetNumber: parseInt(t.targetNumber),
                        targetThreshold: safeDecimal(t.targetThreshold),
                        commissionAmount: safeDecimal(t.commissionAmount)
                    }))
                };
            }
        }

        // 2. Documents
        if (data.documents && Array.isArray(data.documents)) {
            await prisma.employeeDocument.deleteMany({ where: { employeeId: id } });
            if (data.documents.length > 0) {
                dataToUpdate.documents = {
                    create: data.documents.map((d: any) => ({
                        title: d.title,
                        fileUrl: d.fileUrl || '',
                        docType: d.docType,
                        expiryDate: safeDate(d.expiryDate)
                    }))
                };
            }
        }

        // 3. Assets
        if (data.assets && Array.isArray(data.assets)) {
            await prisma.employeeAsset.deleteMany({ where: { employeeId: id } });
            if (data.assets.length > 0) {
                dataToUpdate.assets = {
                    create: data.assets.map((a: any) => ({
                        assetName: a.assetName,
                        serialNumber: a.serialNumber,
                        category: a.category,
                        status: a.status || 'assigned',
                        assignmentDate: safeDate(a.assignmentDate) || new Date(),
                        returnDate: safeDate(a.returnDate)
                    }))
                };
            }
        }

        // 4. Performances
        if (data.performances && Array.isArray(data.performances)) {
            await prisma.performanceReview.deleteMany({ where: { employeeId: id } });
            if (data.performances.length > 0) {
                dataToUpdate.performances = {
                    create: data.performances.map((p: any) => ({
                        reviewerId: p.reviewerId || (req as any).user?.id,
                        reviewDate: safeDate(p.reviewDate) || new Date(),
                        period: p.period,
                        rating: parseInt(p.rating),
                        feedback: p.feedback,
                        goals: p.goals
                    }))
                };
            }
        }

        const employee = await prisma.employee.update({
            where: { id },
            data: dataToUpdate,
            include: { user: true, department: true, commissionTiers: true, documents: true, assets: true, performances: true }
        });

        res.json({ success: true, data: employee });
    } catch (error: any) {
        console.error('Update employee error:', error);
        res.status(400).json({ success: false, error: { message: error.message } });
    }
};

// --- ATTENDANCE ---

export const getStaffAttendance = async (req: Request, res: Response) => {
    try {
        const { date, employeeId, startDate, endDate } = req.query;
        let whereClause: any = {};

        if (employeeId) {
            whereClause.employeeId = String(employeeId);
        }

        // Support for range (Reports) - Using UTC to avoid timezone shifts
        if (startDate || endDate) {
            whereClause.date = {};
            if (startDate) {
                const s = new Date(String(startDate));
                // Force UTC to match how Prisma/DB stores pure dates
                const utcStart = new Date(Date.UTC(s.getFullYear(), s.getMonth(), s.getDate(), 0, 0, 0));
                whereClause.date.gte = utcStart;
            }
            if (endDate) {
                const e = new Date(String(endDate));
                const utcEnd = new Date(Date.UTC(e.getFullYear(), e.getMonth(), e.getDate(), 23, 59, 59, 999));
                whereClause.date.lte = utcEnd;
            }
        }
        // Backward compatibility for single date
        else if (date) {
            const d = new Date(String(date));
            const startOfDay = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0));
            const endOfDay = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999));

            whereClause.date = {
                gte: startOfDay,
                lte: endOfDay
            };
        }

        const attendance = await prisma.staffAttendance.findMany({
            where: whereClause,
            include: {
                employee: {
                    include: {
                        user: { select: { firstName: true, lastName: true } },
                        shift: true,
                        department: true
                    }
                }
            },
            orderBy: { date: 'desc' }
        });
        res.json({ success: true, data: attendance });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};

export const markAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const { employeeId, date, checkIn, checkOut, status, notes, reset } = req.body;
        const attendanceDate = new Date(date);

        if (reset) {
            await (prisma as any).staffAttendance.delete({
                where: { employeeId_date: { employeeId, date: attendanceDate } }
            }).catch(() => { });
            return res.json({ success: true, message: 'Attendance record reset' });
        }

        let totalWorkMinutes = undefined;

        // 1. Get existing attendance to check for changes and notes
        const existing = await prisma.staffAttendance.findUnique({
            where: { employeeId_date: { employeeId, date: attendanceDate } },
            include: { events: true }
        });

        let historyNotes = notes || (existing?.notes || '');

        // 2. Helper to format time for notes
        const formatTime = (iso: string | undefined) => iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '--:--';

        // 3. Handle Manual Events if times changed
        if (checkIn || checkOut || req.body.checkIn2 || req.body.checkOut2) {
            const newIn = checkIn ? new Date(checkIn) : null;
            const newOut = checkOut ? new Date(checkOut) : null;
            const newIn2 = req.body.checkIn2 ? new Date(req.body.checkIn2) : null;
            const newOut2 = req.body.checkOut2 ? new Date(req.body.checkOut2) : null;

            const upsertAttendance = async () => {
                if (existing?.id) return existing.id;
                const created = await prisma.staffAttendance.upsert({
                    where: { employeeId_date: { employeeId, date: attendanceDate } },
                    update: {},
                    create: { employeeId, date: attendanceDate, status: 'present' }
                });
                return created.id;
            };

            const createEvent = async (type: string, time: Date) => {
                const aid = await upsertAttendance();
                await (prisma as any).attendanceEvent.create({
                    data: {
                        attendanceId: aid,
                        eventType: type,
                        eventTime: time,
                        method: 'Manual Override',
                        deviceInfo: 'System Admin'
                    }
                });
            };

            // Check-In 1
            if (newIn && (!existing?.checkIn || existing.checkIn.getTime() !== newIn.getTime())) {
                historyNotes = `[تعديل لدخول 1: ${formatTime(newIn.toISOString())}] ` + historyNotes;
                await createEvent('checkIn', newIn);
            }
            // Check-Out 1 (Break Out)
            if (newOut && (!existing?.checkOut || existing.checkOut.getTime() !== newOut.getTime())) {
                historyNotes = `[تعديل لخروج 1/استراحة: ${formatTime(newOut.toISOString())}] ` + historyNotes;
                await createEvent('breakOut', newOut);
            }
            // Check-In 2 (Return)
            if (newIn2) {
                historyNotes = `[تعديل لعودة: ${formatTime(newIn2.toISOString())}] ` + historyNotes;
                await createEvent('breakIn', newIn2);
            }
            // Check-Out 2
            if (newOut2) {
                historyNotes = `[تعديل لانصراف نهائي: ${formatTime(newOut2.toISOString())}] ` + historyNotes;
                await createEvent('checkOut', newOut2);
            }
        }

        // 4. Update the summary
        const attendance = await prisma.staffAttendance.upsert({
            where: {
                employeeId_date: {
                    employeeId,
                    date: attendanceDate
                }
            },
            update: {
                status,
                notes: historyNotes
            },
            create: {
                employeeId,
                date: attendanceDate,
                status: status || 'present',
                notes: historyNotes
            }
        });

        // 5. Force recalculate summary from all events (including the new manual ones)
        const biometricService = (await import('./biometric.service')).default;
        await biometricService.recalculateAttendanceSummary(attendance.id);

        res.json({ success: true, data: attendance });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
};

// --- LEAVES ---

export const getLeaveRequests = async (req: Request, res: Response) => {
    try {
        const { status, employeeId } = req.query;
        const leaves = await prisma.leaveRequest.findMany({
            where: {
                ...(status ? { status: String(status) } : {}),
                ...(employeeId ? { employeeId: String(employeeId) } : {})
            },
            include: {
                employee: {
                    include: {
                        user: { select: { firstName: true, lastName: true } },
                        shift: true,
                        department: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: leaves });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};

export const createLeaveRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { employeeId, type, startDate, endDate, reason } = req.body;
        const leave = await prisma.leaveRequest.create({
            data: {
                employeeId,
                type,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason,
                status: 'pending'
            }
        });
        res.status(201).json({ success: true, data: leave });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
};

export const updateLeaveStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status, comment } = req.body;
        const leave = await prisma.leaveRequest.update({
            where: { id },
            data: {
                status,
                comment,
                approvedBy: req.user?.id,
                actionDate: new Date()
            }
        });
        res.json({ success: true, data: leave });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
};

// --- PAYROLL ---

export const getPayroll = async (req: Request, res: Response) => {
    try {
        const { month, year, employeeId } = req.query;
        const payrolls = await prisma.payroll.findMany({
            where: {
                ...(month ? { month: Number(month) } : {}),
                ...(year ? { year: Number(year) } : {}),
                ...(employeeId ? { employeeId: String(employeeId) } : {})
            },
            include: {
                employee: {
                    include: {
                        user: { select: { firstName: true, lastName: true } }
                    }
                }
            }
        });
        res.json({ success: true, data: payrolls });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};

export const processPayroll = async (req: Request, res: Response) => {
    try {
        const {
            employeeId, month, year,
            basicSalary, housingAllowance, transportAllowance, otherAllowances,
            deductions, commission, notes,
            achievedTarget, hoursWorked
        } = req.body;

        const totalAllowances = new Decimal(housingAllowance || 0)
            .add(new Decimal(transportAllowance || 0))
            .add(new Decimal(otherAllowances || 0));

        const netSalary = new Decimal(basicSalary || 0)
            .add(totalAllowances)
            .add(new Decimal(commission || 0))
            .sub(new Decimal(deductions || 0));

        const payrollData = {
            basicSalary: new Decimal(basicSalary || 0),
            housingAllowance: new Decimal(housingAllowance || 0),
            transportAllowance: new Decimal(transportAllowance || 0),
            otherAllowances: new Decimal(otherAllowances || 0),
            deductions: new Decimal(deductions || 0),
            commission: new Decimal(commission || 0),
            netSalary,
            notes,
            achievedTarget: achievedTarget ? new Decimal(achievedTarget) : null,
            hoursWorked: hoursWorked ? new Decimal(hoursWorked) : null,
        };

        const payroll = await prisma.payroll.upsert({
            where: {
                employeeId_month_year: { employeeId, month, year }
            },
            update: payrollData,
            create: {
                employeeId,
                month,
                year,
                ...payrollData,
                status: 'processed'
            },
            include: {
                employee: {
                    include: { user: true }
                }
            }
        });

        // --- AUTOMATIC JOURNAL ENTRY FOR PAYROLL ACCRUAL ---
        try {
            const finSettings = await prisma.financialSettings.findFirst();
            if (finSettings?.defaultPayrollExpenseAccountId && finSettings?.defaultPayrollPayableAccountId) {
                const journal = await prisma.financialJournal.findFirst({
                    where: { type: 'MISC' } // General Journal for accruals
                });

                const employeeName = payroll.employee?.user?.firstName || 'موظف';

                const je = await journalService.createJournalEntry({
                    date: new Date().toISOString(),
                    description: `استحقاق راتب شهر ${month}/${year} - ${employeeName}`,
                    reference: `PAY-${month}-${year}-${payroll.id.substring(0, 4)}`,
                    journalId: journal?.id,
                    lines: [
                        {
                            accountId: finSettings.defaultPayrollExpenseAccountId,
                            debit: netSalary.toNumber(),
                            credit: 0,
                            description: `مصروفات رواتب وأجور - شهر ${month}/${year}`
                        },
                        {
                            accountId: finSettings.defaultPayrollPayableAccountId,
                            debit: 0,
                            credit: netSalary.toNumber(),
                            description: `رواتب مستحقة غير مدفوعة - شهر ${month}/${year}`
                        }
                    ]
                }, (req as any).user?.id || 'system');

                await journalService.postJournalEntry(je.id, (req as any).user?.id || 'system');
            }
        } catch (accError) {
            console.error('Accounting Error (Payroll Accrual):', accError);
        }

        res.json({ success: true, data: payroll });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
};
