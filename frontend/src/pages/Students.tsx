import { useState, useEffect } from 'react';
import { studentService, Student, CreateStudentInput } from '../services/student.service';
import { academicService } from '../services/academic.service';
import { Toast, ToastType } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Plus, Search, Filter, Trash2, Edit2, MoreHorizontal, FileDown, FileUp, Grid, List, Users, BookOpen, Download, Upload, CreditCard, Calendar as CalendarIcon, MapPin, GraduationCap, Check } from 'lucide-react';
import StudentFormModal from '../components/StudentFormModal';
import StudentAcademicRecord from '../components/StudentAcademicRecord';
import { ModernCard, ModernStat, ModernTable, ModernButton, ModernInput, ModernFormGroup, ModernLoader } from '../layouts/ModernGlobal2026/components/ModernUI';
import { useSettingsStore } from '../store/settingsStore';

export default function Students() {
    const settings = useSettingsStore((state) => state.settings);
    const activeTemplate = settings?.activeTemplate || 'legacy';
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [programs, setPrograms] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState<string | null>(null);
    const [academicRecordStudentId, setAcademicRecordStudentId] = useState<string | null>(null);

    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    // Search and Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'graduated' | 'suspended' | 'withdrawn'>('all');
    const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [showHeader, setShowHeader] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    // Toast and Confirm Dialog states
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        title: string;
        message: string;
        type: 'danger' | 'warning' | 'info';
        onConfirm: () => void;
    } | null>(null);

    const [formData, setFormData] = useState<CreateStudentInput>({
        // === NAMES ===
        firstNameEn: '',
        lastNameEn: '',
        firstNameAr: '',
        lastNameAr: '',
        fullNameId: '',
        fullNamePassport: '',
        certificateName: '',

        // === BASIC INFO ===
        dateOfBirth: '',
        gender: 'male',
        nationality: '',

        // === IDENTITY DOCUMENTS ===
        nationalId: '',
        passportNumber: '',

        // === CONTACT INFO ===
        email: '',
        phone: '',
        phone2: '',
        address: '',
        city: '',
        country: '',

        // === EMERGENCY CONTACT ===
        emergencyContactName: '',
        emergencyContactPhone: '',

        // === PEARSON & ALSALAM REGISTRATION ===
        registrationNumberPearson: '',
        enrolmentNumberAlsalam: '',
        registrationDateAlsalam: '',

        // === ACADEMIC INFO ===
        specialization: '',
        certificateCourseTitle: '',
        notificationCourseTitle: '',
        qualificationLevel: '',
        awardType: undefined,
        yearOfAward: '',

        // === ENROLLMENT & STATUS ===
        admissionDate: '',
        enrollmentDate: '',
        status: 'active',

        // === PLATFORM ===
        platformUsername: '',
        platformPassword: '',
    });

    useEffect(() => {
        fetchData();

        const handleScroll = () => {
            if (window.innerWidth >= 768) {
                setShowHeader(true);
                return;
            }
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 60) {
                setShowHeader(false); // Scrolling down
            } else {
                setShowHeader(true); // Scrolling up
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    useEffect(() => {
        let filtered = [...students];

        if (searchTerm) {
            filtered = filtered.filter(s =>
                s.firstNameAr?.includes(searchTerm) ||
                s.lastNameAr?.includes(searchTerm) ||
                s.firstNameEn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.lastNameEn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.studentNumber.includes(searchTerm) ||
                s.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterStatus !== 'all') {
            filtered = filtered.filter(s => s.status === filterStatus);
        }

        if (filterGender !== 'all') {
            filtered = filtered.filter(s => s.gender === filterGender);
        }

        setFilteredStudents(filtered);
    }, [students, searchTerm, filterStatus, filterGender]);

    const fetchData = async () => {
        try {
            setLoading(true);
            console.log('🔄 Fetching Programs, Classes, and Students...');

            const [programsRes, classesRes, studentsRes] = await Promise.all([
                academicService.getPrograms(),
                academicService.getClasses(),
                studentService.getStudents(),
            ]);

            console.log('📊 Programs API Response:', programsRes);
            console.log('🏫 Classes API Response:', classesRes);
            console.log('👥 Students API Response:', studentsRes);

            // Handle Programs
            if (programsRes.success && programsRes.data) {
                setPrograms(programsRes.data.programs || []);
            } else {
                console.warn('⚠️ Programs API failed or returned empty:', programsRes);
            }

            // Handle Classes
            if (classesRes.success && classesRes.data) {
                setClasses(classesRes.data.classes || []);
            } else {
                console.warn('⚠️ Classes API failed or returned empty:', classesRes);
            }

            // Handle Students
            if (studentsRes.success && studentsRes.data) {
                const loadedStudents = studentsRes.data.students || [];
                console.log(`✅ Loaded ${loadedStudents.length} students from API`);
                setStudents(loadedStudents);

                // Force update filtered list initially
                if (loadedStudents.length > 0) {
                    setFilteredStudents(loadedStudents);
                }
            } else {
                console.warn('⚠️ Students API failed or returned empty:', studentsRes);
                setToast({ type: 'warning', message: '⚠️ لم يتم العثور على بيانات طلاب' });
            }

        } catch (error: any) {
            console.error('❌ Error in fetchData:', error);
            const msg = error.response?.data?.error?.message || error.message || 'Unknown error';
            setToast({ type: 'error', message: `❌ فشل في تحميل البيانات: ${msg}` });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (submittedData: CreateStudentInput) => {
        try {
            setLoading(true);
            const cleanData = { ...submittedData };

            // Remove empty optional fields
            Object.keys(cleanData).forEach(key => {
                if (cleanData[key as keyof CreateStudentInput] === '' || cleanData[key as keyof CreateStudentInput] === undefined) {
                    delete cleanData[key as keyof CreateStudentInput];
                }
            });

            if (editingStudent) {
                await studentService.updateStudent(editingStudent.id, cleanData);
                setToast({ type: 'success', message: '✅ تم تحديث بيانات الطالب بنجاح' });
            } else {
                await studentService.createStudent(cleanData);
                setToast({ type: 'success', message: '✅ تم إضافة الطالب بنجاح' });
            }

            setShowModal(false);
            resetForm();
            fetchData();
        } catch (error: any) {
            let message = 'حدث خطأ أثناء حفظ البيانات';
            if (error.response?.data?.error?.message) {
                message = error.response.data.error.message;
            }
            setToast({ type: 'error', message: `❌ ${message}` });
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            setLoading(true);
            const blob = await studentService.downloadExcel();

            // If the response is JSON, it might be an error even with 200/Blob
            if (blob instanceof Blob && blob.type === 'application/json') {
                const text = await blob.text();
                const json = JSON.parse(text);
                setToast({ type: 'error', message: json.error || 'فشل في تصدير البيانات' });
                return;
            }

            if (!(blob instanceof Blob)) {
                throw new Error('لم يتم استلام ملف صحيح');
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            setToast({ type: 'success', message: '✅ تم تصدير البيانات بنجاح' });
        } catch (error) {
            console.error('Export error:', error);
            setToast({ type: 'error', message: '❌ فشل في تصدير البيانات' });
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setLoading(true);
            const response = await studentService.uploadExcel(file);
            if (response.success) {
                const { successCount, skipCount, errors } = response.data;
                let msg = `✅ تم استيراد ${successCount} طالب بنجاح.`;
                if (skipCount > 0) msg += ` (تجاوز ${skipCount})`;
                setToast({ type: 'success', message: msg });
                if (errors.length > 0) console.warn('Import warnings:', errors);
                fetchData();
            }
        } catch (error: any) {
            console.error('Import error:', error);
            const message = error.response?.data?.error || error.message || 'فشل في استيراد البيانات';
            setToast({ type: 'error', message: `❌ ${message}` });
        } finally {
            setLoading(false);
            e.target.value = ''; // Reset input
        }
    };


    const handleEdit = async (student: Student) => {
        try {
            setLoading(true);

            // Fetch full student details to get latest data
            const response = await studentService.getStudent(student.id);
            const fullStudent = response.data?.student || student;

            setEditingStudent(fullStudent);

            // Find active enrollment (support both 'enrolled' and 'active' for backward compatibility, case-insensitive)
            const activeEnrollment = fullStudent.enrollments?.find((e: any) => ['active', 'enrolled'].includes((e.status || '').toLowerCase())) || fullStudent.enrollments?.[0];

            // Find latest fee calculation
            const financial = (fullStudent as any).feeCalculations?.[0];
            const tuitionItem = financial?.feeItems?.find((f: any) => f.type === 'TUITION');
            const regItem = financial?.feeItems?.find((f: any) => f.type === 'REGISTRATION');

            setFormData({
                firstNameEn: fullStudent.firstNameEn || '',
                lastNameEn: fullStudent.lastNameEn || '',
                firstNameAr: fullStudent.firstNameAr || '',
                lastNameAr: fullStudent.lastNameAr || '',
                fullNameId: fullStudent.fullNameId || '',
                fullNamePassport: fullStudent.fullNamePassport || '',
                certificateName: fullStudent.certificateName || '',
                dateOfBirth: fullStudent.dateOfBirth ? (typeof fullStudent.dateOfBirth === 'string' ? fullStudent.dateOfBirth.split('T')[0] : (fullStudent.dateOfBirth as any).toISOString().split('T')[0]) : '',
                gender: fullStudent.gender || 'male',
                nationality: fullStudent.nationality || '',
                nationalId: fullStudent.nationalId || '',
                passportNumber: fullStudent.passportNumber || '',
                passportExpiryDate: fullStudent.passportExpiryDate ? (typeof fullStudent.passportExpiryDate === 'string' ? fullStudent.passportExpiryDate.split('T')[0] : (fullStudent.passportExpiryDate as any).toISOString().split('T')[0]) : '',
                email: fullStudent.user?.email || fullStudent.email || '',
                phone: fullStudent.user?.phone || fullStudent.phone || '',
                phone2: fullStudent.phone2 || '',
                address: fullStudent.address || '',
                city: fullStudent.city || '',
                country: fullStudent.country || '',
                emergencyContactName: fullStudent.emergencyContactName || '',
                emergencyContactPhone: fullStudent.emergencyContactPhone || '',
                registrationNumberPearson: fullStudent.registrationNumberPearson || '',
                enrolmentNumberAlsalam: fullStudent.enrolmentNumberAlsalam || '',
                registrationDateAlsalam: fullStudent.registrationDateAlsalam ? (typeof fullStudent.registrationDateAlsalam === 'string' ? fullStudent.registrationDateAlsalam.split('T')[0] : (fullStudent.registrationDateAlsalam as any).toISOString().split('T')[0]) : '',
                specialization: fullStudent.specialization || '',
                certificateCourseTitle: fullStudent.certificateCourseTitle || '',
                notificationCourseTitle: fullStudent.notificationCourseTitle || '',
                qualificationLevel: fullStudent.qualificationLevel || '',
                awardType: (fullStudent.awardType as 'Academic' | 'Vocational' | undefined) || undefined,
                yearOfAward: fullStudent.yearOfAward || '',
                admissionDate: fullStudent.enrollmentDate ? (typeof fullStudent.enrollmentDate === 'string' ? fullStudent.enrollmentDate.split('T')[0] : (fullStudent.enrollmentDate as any).toISOString().split('T')[0]) : '',
                enrollmentDate: fullStudent.enrollmentDate ? (typeof fullStudent.enrollmentDate === 'string' ? fullStudent.enrollmentDate.split('T')[0] : (fullStudent.enrollmentDate as any).toISOString().split('T')[0]) : '',
                status: fullStudent.status || 'active',
                platformUsername: fullStudent.platformUsername || '',
                platformPassword: '',

                // Academic
                programId: activeEnrollment?.class?.programId || activeEnrollment?.class?.program?.id || '',
                classId: activeEnrollment?.class?.id || '',

                // Financial
                tuitionFee: tuitionItem ? Number(tuitionItem.amount) : undefined,
                registrationFee: regItem ? Number(regItem.amount) : undefined,
                discountType: financial?.discountAmount > 0 ? 'fixed' : 'percentage',
                discountValue: financial?.discountAmount ? Number(financial.discountAmount) : undefined,
                initialPayment: financial?.paidAmount ? Number(financial.paidAmount) : undefined,

                // Advanced Installment Logic Extraction
                installmentCount: (() => {
                    const insts: any[] = financial?.installmentPlans?.[0]?.installments || [];
                    // Filter out reg fee installment (0) to get tuition count
                    const tuitionInsts = insts.filter((i: any) => i.installmentNumber > 0);
                    return tuitionInsts.length > 0 ? tuitionInsts.length : undefined;
                })(),

                firstInstallmentDate: financial?.installmentPlans?.[0]?.startDate ? (typeof financial.installmentPlans[0].startDate === 'string' ? financial.installmentPlans[0].startDate.split('T')[0] : new Date(financial.installmentPlans[0].startDate).toISOString().split('T')[0]) : undefined,

                // Extract Registration Fee Date from Installment 0
                registrationFeeDate: (() => {
                    const insts: any[] = financial?.installmentPlans?.[0]?.installments || [];
                    const regInst = insts.find((i: any) => i.installmentNumber === 0);
                    if (regInst?.dueDate) {
                        return typeof regInst.dueDate === 'string' ? regInst.dueDate.split('T')[0] : new Date(regInst.dueDate).toISOString().split('T')[0];
                    }
                    return undefined;
                })(),

                includeRegistrationInInstallments: (() => {
                    try {
                        if (financial?.internalNotes) {
                            const notes = JSON.parse(financial.internalNotes);
                            return notes.includeRegistrationInInstallments;
                        }
                    } catch (e) { }
                    return undefined;
                })(),
            });
            console.log('🔍 handleEdit Input:', {
                studentId: fullStudent.id,
                enrollmentsCount: fullStudent.enrollments?.length,
                activeEnrollment,
                classId: activeEnrollment?.class?.id,
                programId: activeEnrollment?.class?.program?.id
            });
            setShowModal(true);
        } catch (error) {
            console.error('Error loading student details:', error);
            setToast({ type: 'error', message: '❌ فشل في تحميل بيانات الطالب' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (student: Student) => {
        const enrollmentCount = student._count?.enrollments || 0;
        setConfirmDialog({
            title: 'حذف الطالب',
            message: enrollmentCount > 0
                ? `⚠️ تنبيه! لديه ${enrollmentCount} تسجيل. هل أنت متأكد؟`
                : `هل أنت متأكد من حذف "${student.firstNameAr} ${student.lastNameAr}"؟`,
            type: enrollmentCount > 0 ? 'warning' : 'danger',
            onConfirm: async () => {
                setConfirmDialog(null);
                try {
                    setLoading(true);
                    await studentService.deleteStudent(student.id);
                    setToast({ type: 'success', message: '✅ تم الحذف بنجاح' });
                    fetchData();
                } catch (error) {
                    setToast({ type: 'error', message: '❌ فشل الحذف' });
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    const handleStatusChange = async (studentId: string, newStatus: string) => {
        try {
            await studentService.updateStatus(studentId, newStatus);
            setToast({ type: 'success', message: '✅ تم تحديث الحالة بنجاح' });
            fetchData();
        } catch (error) {
            setToast({ type: 'error', message: '❌ فشل تحديث الحالة' });
        }
    };

    const resetForm = () => {
        setFormData({
            firstNameEn: '', lastNameEn: '', firstNameAr: '', lastNameAr: '',
            fullNameId: '', fullNamePassport: '', certificateName: '',
            dateOfBirth: '', gender: 'male', nationality: '',
            nationalId: '', passportNumber: '', passportExpiryDate: '',
            email: '', phone: '', phone2: '', address: '', city: '', country: '',
            emergencyContactName: '', emergencyContactPhone: '',
            registrationNumberPearson: '', enrolmentNumberAlsalam: '', registrationDateAlsalam: '',
            specialization: '', certificateCourseTitle: '', notificationCourseTitle: '',
            qualificationLevel: '', awardType: undefined, yearOfAward: '',
            admissionDate: '', enrollmentDate: '', status: 'active',
            platformUsername: '', platformPassword: '',
        });
        setEditingStudent(null);
    };

    const handleOpenAcademicRecord = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        setAcademicRecordStudentId(id);
    };

    const studentStats = {
        total: students.length,
        active: students.filter(s => s.status === 'active').length,
        graduated: students.filter(s => s.status === 'graduated').length,
        suspended: students.filter(s => s.status === 'suspended').length,
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return '#38A169';
            case 'graduated': return '#3182CE';
            case 'suspended': return '#DD6B20';
            case 'withdrawn': return '#718096';
            default: return '#718096';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'نشط';
            case 'graduated': return 'متخرج';
            case 'suspended': return 'موقوف';
            case 'withdrawn': return 'منسحب';
            default: return status;
        }
    };

    if (loading && students.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: activeTemplate === 'modern_global_2026' ? 'var(--mg26-bg-page)' : '#F8FAFC' }}>
                <ModernLoader />
            </div>
        );
    }

    // --- Legacy UI (Abdelkader Standard) ---
    if (activeTemplate === 'legacy') {
        return (
            <div className="next-gen-page-container">
                <style>{`
                    .next-gen-page-container {
                        font-family: 'Inter', 'Cairo', sans-serif;
                        direction: rtl;
                        min-height: 100vh;
                        background: #F8FAFC;
                        padding: 1.5rem;
                    }
                    .glass-header {
                        position: sticky;
                        top: 1rem;
                        z-index: 1000;
                        background: rgba(255, 255, 255, 0.9);
                        backdrop-filter: blur(12px);
                        border: 1px solid rgba(226, 232, 240, 0.8);
                        border-radius: 20px;
                        padding: 1rem 1.5rem;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.02);
                        margin-bottom: 2rem;
                    }
                    .branding-icon {
                        width: 48px;
                        height: 48px;
                        border-radius: 12px;
                        background: #FFF5F0;
                        color: #DD6B20;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                        gap: 1.5rem;
                        margin-bottom: 2rem;
                    }
                    .stat-card-mini {
                        background: white;
                        padding: 1.5rem;
                        border-radius: 20px;
                        border: 1px solid #EDF2F7;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .stat-info .stat-label { font-size: 0.8rem; color: #718096; font-weight: 700; margin: 0; }
                    .stat-info .stat-value { font-size: 1.8rem; font-weight: 800; color: #2D3748; line-height: 1; }

                    /* Student Card Legacy */
                    .students-grid-legacy {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                        gap: 1.5rem;
                    }
                    .legacy-student-card {
                        background: white;
                        border-radius: 24px;
                        padding: 1.5rem;
                        border: 1px solid #EDF2F7;
                        transition: all 0.3s ease;
                        position: relative;
                        overflow: hidden;
                    }
                    .legacy-student-card:hover { transform: translateY(-5px); box-shadow: 0 12px 30px rgba(0,0,0,0.05); }
                    
                    .card-header-legacy { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
                    .student-main-info { display: flex; gap: 1rem; align-items: center; }
                    .student-avatar-legacy { 
                        width: 56px; height: 56px; border-radius: 16px; 
                        background: #F7FAFC; display: flex; align-items: center; justify-content: center; font-size: 24px;
                        border: 2px solid #EDF2F7;
                    }
                    .student-names h3 { margin: 0; font-size: 1.1rem; font-weight: 800; color: #2D3748; }
                    .student-names p { margin: 2px 0 0 0; font-size: 0.8rem; color: #718096; font-family: 'Inter'; }

                    .financial-summary-badge {
                        background: #F8FAFC;
                        border-radius: 16px;
                        padding: 1rem;
                        margin: 1.25rem 0;
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 0.5rem;
                        border: 1px dashed #E2E8F0;
                    }
                    .fin-item { text-align: center; }
                    .fin-val { display: block; font-weight: 800; font-size: 0.95rem; color: #2D3748; }
                    .fin-lbl { font-size: 0.65rem; color: #718096; font-weight: 700; text-transform: uppercase; }

                    .btn-legacy-action {
                        padding: 8px 16px;
                        border-radius: 10px;
                        border: none;
                        font-weight: 700;
                        font-size: 0.85rem;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        transition: 0.2s;
                    }
                    .btn-sajil { background: #EBF8FF; color: #2B6CB0; }
                    .btn-sajil:hover { background: #BEE3F8; }
                    .btn-edit-legacy { background: #F0FFF4; color: #2F855A; }
                    .btn-delete-legacy { background: #FFF5F5; color: #C53030; }
                `}</style>

                {/* Glass Header */}
                <header className="glass-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="branding-icon">
                            <Users size={24} />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#9C4221' }}>سجل الطلاب</h1>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#718096' }}>إدارة بيانات منتسبي معهد السلام</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <ModernButton variant="primary" icon={<Plus size={18} />} onClick={() => { resetForm(); setShowModal(true); }} style={{ background: 'linear-gradient(135deg, #DD6B20 0%, #ED8936 100%)', borderRadius: '12px' }}>
                            طالب جديد
                        </ModernButton>
                    </div>
                </header>

                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card-mini">
                        <div className="stat-info">
                            <p className="stat-label">إجمالي الطلاب</p>
                            <h3 className="stat-value">{studentStats.total}</h3>
                        </div>
                        <div style={{ color: '#3182CE' }}><Users size={32} /></div>
                    </div>
                    <div className="stat-card-mini">
                        <div className="stat-info">
                            <p className="stat-label">نشط حالياً</p>
                            <h3 className="stat-value">{studentStats.active}</h3>
                        </div>
                        <div style={{ color: '#38A169' }}><Check size={32} /></div>
                    </div>
                    <div className="stat-card-mini">
                        <div className="stat-info">
                            <p className="stat-label">الطلبة الخريجين</p>
                            <h3 className="stat-value">{studentStats.graduated}</h3>
                        </div>
                        <div style={{ color: '#805AD5' }}><GraduationCap size={32} /></div>
                    </div>
                </div>

                {/* Filters */}
                <div style={{ background: 'white', padding: '1rem', borderRadius: '20px', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', border: '1px solid #EDF2F7' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#A0AEC0' }} />
                        <input
                            type="text"
                            placeholder="ابحث بالاسم، الرقم، أو البريد..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '12px 40px 12px 12px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }}
                        />
                    </div>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }}>
                        <option value="all">كافة الحالات</option>
                        <option value="active">نشط</option>
                        <option value="graduated">متخرج</option>
                    </select>
                </div>

                {/* Grid */}
                <div className="students-grid-legacy">
                    {filteredStudents.map(student => {
                        const enrollment = student.enrollments?.[0];
                        const financial = (student as any).feeCalculations?.[0];

                        return (
                            <div key={student.id} className="legacy-student-card">
                                <div className="card-header-legacy">
                                    <div className="student-main-info">
                                        <div className="student-avatar-legacy">
                                            {student.gender === 'female' ? '👩‍🎓' : '👨‍🎓'}
                                        </div>
                                        <div className="student-names">
                                            <h3>{student.firstNameAr} {student.lastNameAr}</h3>
                                            <p>{student.firstNameEn} {student.lastNameEn}</p>
                                        </div>
                                    </div>
                                    <span style={{
                                        padding: '4px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900,
                                        background: `${getStatusColor(student.status)}15`, color: getStatusColor(student.status)
                                    }}>
                                        {getStatusLabel(student.status)}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem', color: '#718096', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <CreditCard size={14} /> {student.studentNumber}
                                    </div>
                                    {enrollment?.class?.program && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <BookOpen size={14} /> {enrollment.class.program.nameAr}
                                        </div>
                                    )}
                                </div>

                                {/* Financial Summary */}
                                <div className="financial-summary-badge">
                                    <div className="fin-item">
                                        <span className="fin-val">{financial?.totalAmount || 0}</span>
                                        <span className="fin-lbl">الإجمالي</span>
                                    </div>
                                    <div className="fin-item">
                                        <span className="fin-val" style={{ color: '#38A169' }}>{financial?.paidAmount || 0}</span>
                                        <span className="fin-lbl">المدفوع</span>
                                    </div>
                                    <div className="fin-item">
                                        <span className="fin-val" style={{ color: '#E53E3E' }}>{(financial?.totalAmount || 0) - (financial?.paidAmount || 0)}</span>
                                        <span className="fin-lbl">المتبقي</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                                    <button className="btn-legacy-action btn-sajil" onClick={(e) => handleOpenAcademicRecord(e, student.id)}>
                                        <BookOpen size={16} /> السجل
                                    </button>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn-legacy-action btn-edit-legacy" onClick={() => handleEdit(student)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="btn-legacy-action btn-delete-legacy" onClick={() => handleDelete(student)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
                {confirmDialog && <ConfirmDialog title={confirmDialog.title} message={confirmDialog.message} type={confirmDialog.type} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog(null)} />}

                <StudentFormModal show={showModal} onClose={() => { setShowModal(false); resetForm(); }} onSubmit={handleSubmit} initialData={formData} isEditing={!!editingStudent} loading={loading} programs={programs} classes={classes} />
                <StudentAcademicRecord studentId={academicRecordStudentId || ''} isOpen={!!academicRecordStudentId} onClose={() => setAcademicRecordStudentId(null)} />
            </div>
        );
    }

    // --- Modern Global 2026 UI ---
    return (
        <div style={{ padding: 'var(--mg26-space-xl)', background: 'var(--mg26-surface-low)', minHeight: '100vh' }}>
            {/* --- Modern Action Header --- */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--mg26-space-2xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mg26-space-lg)' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '12px', background: 'var(--mg26-primary-soft)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mg26-primary)'
                    }}>
                        <Users size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--mg26-text-primary)', margin: 0 }}>سجل الطلاب</h2>
                        <p style={{ color: 'var(--mg26-text-muted)', fontSize: '0.9rem', margin: '4px 0 0 0', fontWeight: '500' }}>متابعة وإدارة السجلات الأكاديمية والبيانات الشخصية</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--mg26-space-md)' }}>
                    <div style={{ display: 'flex', background: 'var(--mg26-border-subtle)', borderRadius: '8px', padding: '4px' }}>
                        <button
                            onClick={() => setViewMode('grid')}
                            style={{
                                padding: '8px', borderRadius: '6px', border: 'none',
                                background: viewMode === 'grid' ? 'white' : 'transparent',
                                color: viewMode === 'grid' ? 'var(--mg26-primary)' : 'var(--mg26-text-muted)',
                                cursor: 'pointer', boxShadow: viewMode === 'grid' ? 'var(--mg26-shadow-sm)' : 'none'
                            }}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            style={{
                                padding: '8px', borderRadius: '6px', border: 'none',
                                background: viewMode === 'table' ? 'white' : 'transparent',
                                color: viewMode === 'table' ? 'var(--mg26-primary)' : 'var(--mg26-text-muted)',
                                cursor: 'pointer', boxShadow: viewMode === 'table' ? 'var(--mg26-shadow-sm)' : 'none'
                            }}
                        >
                            <List size={18} />
                        </button>
                    </div>
                    <ModernButton variant="outline" icon={<Download size={16} />} onClick={handleExport}>تصدير</ModernButton>
                    <label style={{ display: 'flex' }}>
                        <ModernButton variant="outline" icon={<Upload size={16} />} style={{ cursor: 'pointer' }}>استيراد</ModernButton>
                        <input type="file" accept=".xlsx, .xls" onChange={handleImport} style={{ display: 'none' }} />
                    </label>
                    <ModernButton variant="primary" icon={<Plus size={16} />} onClick={() => { resetForm(); setShowModal(true); }}>طالب جديد</ModernButton>
                </div>
            </div>

            {/* --- Main Content --- */}
            <main className="container-wide main-content">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--mg26-space-xl)', marginBottom: 'var(--mg26-space-xl)' }}>
                    <ModernCard>
                        <div style={{ display: 'flex', gap: 'var(--mg26-space-xl)', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                                <ModernFormGroup label="البحث السريع">
                                    <ModernInput
                                        placeholder="ابحث بالاسم، الرقم، أو البريد..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </ModernFormGroup>
                            </div>
                            <div style={{ width: '180px' }}>
                                <ModernFormGroup label="الحالة">
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value as any)}
                                        style={{
                                            width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--mg26-border-strong)',
                                            background: 'var(--mg26-surface-high)', fontSize: '14px', color: 'var(--mg26-text-primary)', outline: 'none'
                                        }}
                                    >
                                        <option value="all">كافة الحالات</option>
                                        <option value="active">نشط</option>
                                        <option value="graduated">متخرج</option>
                                        <option value="suspended">موقوف</option>
                                        <option value="withdrawn">منسحب</option>
                                    </select>
                                </ModernFormGroup>
                            </div>
                            <div style={{ width: '120px' }}>
                                <ModernFormGroup label="الجنس">
                                    <select
                                        value={filterGender}
                                        onChange={(e) => setFilterGender(e.target.value as any)}
                                        style={{
                                            width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--mg26-border-strong)',
                                            background: 'var(--mg26-surface-high)', fontSize: '14px', color: 'var(--mg26-text-primary)', outline: 'none'
                                        }}
                                    >
                                        <option value="all">الكل</option>
                                        <option value="male">ذكر</option>
                                        <option value="female">أنثى</option>
                                    </select>
                                </ModernFormGroup>
                            </div>
                        </div>
                    </ModernCard>
                    <ModernCard style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'var(--mg26-space-sm)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--mg26-text-secondary)', fontSize: '0.875rem', fontWeight: '600' }}>إجمالي الطلاب</span>
                            <span style={{ fontWeight: '800', fontSize: '1.25rem', color: 'var(--mg26-text-primary)' }}>{studentStats.total}</span>
                        </div>
                        <div style={{ height: '6px', background: 'var(--mg26-border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: '100%', height: '100%', background: 'var(--mg26-primary)', borderRadius: '3px' }}></div>
                        </div>
                    </ModernCard>
                </div>

                <div className={`content-transition-wrapper ${viewMode}`}>
                    {filteredStudents.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--mg26-space-4xl)', background: 'var(--mg26-surface-high)', borderRadius: 'var(--mg26-radius-component)', border: '1px dashed var(--mg26-border-strong)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: 'var(--mg26-space-md)' }}>👥</div>
                            <h2 style={{ color: 'var(--mg26-text-primary)', margin: 0, fontWeight: '700' }}>لا توجد نتائج مطابقة</h2>
                            <p style={{ color: 'var(--mg26-text-muted)' }}>جرب تغيير معايير البحث أو الفلترة</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--mg26-space-xl)' }}>
                            {filteredStudents.map(student => (
                                <ModernCard key={student.id} className="student-grid-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--mg26-space-lg)' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--mg26-primary)', background: 'var(--mg26-primary-soft)', padding: '4px 10px', borderRadius: '6px' }}>
                                            {student.studentNumber}
                                        </span>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={(e) => handleOpenAcademicRecord(e, student.id)} style={{ border: 'none', background: 'var(--mg26-surface-low)', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: 'var(--mg26-text-secondary)' }}><BookOpen size={16} /></button>
                                            <button onClick={() => handleEdit(student)} style={{ border: 'none', background: 'var(--mg26-surface-low)', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: 'var(--mg26-text-secondary)' }}><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(student)} style={{ border: 'none', background: 'var(--mg26-surface-low)', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: 'var(--mg26-error)' }}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mg26-space-lg)', marginBottom: 'var(--mg26-space-lg)' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--mg26-surface-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', border: '1px solid var(--mg26-border-subtle)' }}>
                                            {student.gender === 'female' ? '👩‍🎓' : '👨‍🎓'}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: 0, color: 'var(--mg26-text-primary)' }}>{student.firstNameAr} {student.lastNameAr}</h3>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--mg26-text-muted)', margin: 0, fontWeight: '500' }}>{student.firstNameEn} {student.lastNameEn}</p>
                                        </div>
                                    </div>
                                    <div style={{ background: 'var(--mg26-surface-low)', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--mg26-text-secondary)', fontWeight: '600' }}>الحالة الأكاديمية</span>
                                        <span style={{
                                            fontSize: '0.8rem', fontWeight: '700', color: getStatusColor(student.status),
                                            background: `${getStatusColor(student.status)}15`, padding: '2px 8px', borderRadius: '4px'
                                        }}>
                                            {getStatusLabel(student.status)}
                                        </span>
                                    </div>
                                </ModernCard>
                            ))}
                        </div>
                    ) : (
                        <ModernTable headers={['رقم الطالب', 'الاسم الكامل', 'الحالة', 'الإجراءات']}>
                            {filteredStudents.map(student => (
                                <tr key={student.id}>
                                    <td><span style={{ fontWeight: '700', color: 'var(--mg26-primary)' }}>{student.studentNumber}</span></td>
                                    <td>
                                        <div style={{ fontWeight: '700', color: 'var(--mg26-text-primary)' }}>{student.firstNameAr} {student.lastNameAr}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--mg26-text-muted)', fontWeight: '500' }}>{student.firstNameEn} {student.lastNameEn}</div>
                                    </td>
                                    <td>
                                        <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', background: `${getStatusColor(student.status)}15`, color: getStatusColor(student.status) }}>
                                            {getStatusLabel(student.status)}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={(e) => handleOpenAcademicRecord(e, student.id)} style={{ padding: '8px', border: 'none', background: 'var(--mg26-surface-low)', borderRadius: '8px', cursor: 'pointer', color: 'var(--mg26-primary)' }} title="السجل الأكاديمي"><BookOpen size={16} /></button>
                                            <button onClick={() => handleEdit(student)} style={{ padding: '8px', border: 'none', background: 'var(--mg26-surface-low)', borderRadius: '8px', cursor: 'pointer', color: 'var(--mg26-text-secondary)' }} title="تعديل"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(student)} style={{ padding: '8px', border: 'none', background: 'var(--mg26-surface-low)', borderRadius: '8px', cursor: 'pointer', color: 'var(--mg26-error)' }} title="حذف"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </ModernTable>
                    )}
                </div>
            </main>

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
            {confirmDialog && <ConfirmDialog title={confirmDialog.title} message={confirmDialog.message} type={confirmDialog.type} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog(null)} />}

            <StudentFormModal show={showModal} onClose={() => { setShowModal(false); resetForm(); }} onSubmit={handleSubmit} initialData={formData} isEditing={!!editingStudent} loading={loading} programs={programs} classes={classes} />
            <StudentAcademicRecord studentId={academicRecordStudentId || ''} isOpen={!!academicRecordStudentId} onClose={() => setAcademicRecordStudentId(null)} />
        </div>
    );
}
