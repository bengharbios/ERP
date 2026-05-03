import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

async function debugExport() {
    try {
        console.log('Fetching students...');
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
            take: 10
        });

        console.log(`Mapping ${students.length} students...`);
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

        console.log('Generating Workbook...');
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        ws['!dir'] = 'rtl';
        XLSX.utils.book_append_sheet(wb, ws, 'الطلاب');

        console.log('Writing to buffer...');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        console.log('Buffer details:', {
            type: typeof buffer,
            isBuffer: Buffer.isBuffer(buffer),
            length: buffer.length
        });

        console.log('Export Debug Success!');
    } catch (error) {
        console.error('Export Debug Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugExport();
