import { Request, Response } from 'express';
import prisma from '../../common/db/prisma';
import * as XLSX from 'xlsx';
import { AuthRequest } from '../../common/utils/jwt';
import { hashPassword } from '../../common/utils/password';

export const exportStudentsToExcel = async (req: Request, res: Response): Promise<void> => {
    try {
        const students = await prisma.student.findMany({
            include: {
                user: {
                    select: {
                        email: true,
                        phone: true,
                    }
                },
                enrollments: {
                    where: { status: 'active' },
                    include: {
                        class: {
                            include: {
                                program: true
                            }
                        }
                    }
                }
            },
            orderBy: { studentNumber: 'asc' }
        });

        const data = students.map(s => {
            const activeEnrollment = s.enrollments[0];
            return {
                'رقم الطالب': s.studentNumber,
                'الاسم بالعربي': `${s.firstNameAr || ''} ${s.lastNameAr || ''}`.trim(),
                'الاسم بالإنجليزي': `${s.firstNameEn || ''} ${s.lastNameEn || ''}`.trim(),
                'البريد الإلكتروني': s.user?.email || s.email || '',
                'رقم الهاتف': s.user?.phone || s.phone || '',
                'الجنس': s.gender === 'female' ? 'أنثى' : 'ذكر',
                'الجنسية': s.nationality || '',
                'رقم الهوية': s.nationalId || '',
                'البرنامج الدراسي': activeEnrollment?.class?.program?.nameAr || '',
                'الفصل الدراسي': activeEnrollment?.class?.name || '',
                'حالة الطالب': s.status === 'active' ? 'نشط' : (s.status === 'graduated' ? 'متخرج' : 'موقوف'),
                'تاريخ الالتحاق': s.enrollmentDate ? new Date(s.enrollmentDate).toLocaleDateString('en-GB') : ''
            };
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);

        // RTL orientation for Arabic compatibility
        ws['!dir'] = 'rtl';

        XLSX.utils.book_append_sheet(wb, ws, 'الطلاب');

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=students_export.xlsx');
        res.setHeader('Content-Length', buffer.length.toString());
        res.status(200).end(buffer, 'binary');
    } catch (error: any) {
        console.error('Excel Export Error:', error);
        res.status(500).json({ success: false, error: 'Failed to export students' });
    }
};

export const importStudentsFromExcel = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, error: 'لم يتم رفع ملف' });
            return;
        }

        console.log(`Processing file: ${req.file.originalname}, size: ${req.file.size}`);

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet) as any[];

        console.log(`Parsed ${data.length} rows from Excel`);

        if (data.length === 0) {
            res.status(400).json({ success: false, error: 'الملف المرفوع فارغ أو تنسيقه غير صحيح' });
            return;
        }

        let successCount = 0;
        let skipCount = 0;
        const errors: string[] = [];

        const defaultPassword = await hashPassword('Student@123');
        const currentYear = new Date().getFullYear();
        let studentCount = await prisma.student.count();

        for (const row of data) {
            try {
                // Key normalization: trim header keys
                const normalizedRow: any = {};
                Object.keys(row).forEach(key => {
                    normalizedRow[key.trim()] = row[key];
                });

                let studentNumber = (normalizedRow['رقم الطالب'] || '').toString().trim();
                const email = (normalizedRow['البريد الإلكتروني'] || '').toString().trim();

                // If no student number, generate one
                if (!studentNumber) {
                    studentCount++;
                    studentNumber = `S${currentYear}${String(studentCount).padStart(4, '0')}`;
                    console.log(`Generated new student number: ${studentNumber}`);
                }

                const namesAr = (normalizedRow['الاسم بالعربي'] || '').toString().split(' ');
                const namesEn = (normalizedRow['الاسم بالإنجليزي'] || '').toString().split(' ');

                await prisma.student.upsert({
                    where: { studentNumber },
                    update: {
                        firstNameAr: namesAr[0] || undefined,
                        lastNameAr: namesAr.slice(1).join(' ') || undefined,
                        firstNameEn: namesEn[0] || undefined,
                        lastNameEn: namesEn.slice(1).join(' ') || undefined,
                        status: normalizedRow['حالة الطالب'] === 'نشط' ? 'active' : undefined,
                        phone: (normalizedRow['رقم الهاتف'] || '').toString() || undefined,
                        nationality: (normalizedRow['الجنسية'] || '') || undefined,
                        nationalId: (normalizedRow['رقم الهوية'] || '').toString() || undefined,
                    },
                    create: {
                        studentNumber,
                        firstNameAr: namesAr[0] || '',
                        lastNameAr: namesAr.slice(1).join(' ') || '',
                        firstNameEn: namesEn[0] || '',
                        lastNameEn: namesEn.slice(1).join(' ') || '',
                        email: email || `${studentNumber}@temp.com`,
                        phone: (normalizedRow['رقم الهاتف'] || '').toString() || '',
                        nationality: (normalizedRow['الجنسية'] || '') || '',
                        nationalId: (normalizedRow['رقم الهوية'] || '').toString() || '',
                        status: 'active',
                        user: {
                            create: {
                                username: studentNumber,
                                email: email || `${studentNumber}@temp.com`,
                                passwordHash: defaultPassword,
                                firstName: namesEn[0] || '',
                                lastName: namesEn.slice(1).join(' ') || '',
                                phone: (normalizedRow['رقم الهاتف'] || '').toString() || '',
                                isActive: true
                            }
                        }
                    }
                });

                successCount++;
            } catch (err: any) {
                console.error(`Row processing error:`, err.message);
                errors.push(`Row ${data.indexOf(row) + 2}: ${err.message}`);
            }
        }

        res.json({
            success: true,
            data: {
                successCount,
                skipCount,
                errors
            }
        });
    } catch (error: any) {
        console.error('Excel Import Error:', error);
        res.status(500).json({
            success: false,
            error: `خطأ في معالجة الملف: ${error.message}`,
            details: error.stack
        });
    }
};
