// @ts-nocheck
import { useState, useEffect } from 'react';
import { studentService, Student, CreateStudentInput } from '../services/student.service';
import { academicService } from '../services/academic.service';
import { Toast, ToastType } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';

export default function Students() {
    // === STATE ===
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [programs, setPrograms] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // === UI STATE ===
    const [showModal, setShowModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [activeTab, setActiveTab] = useState<'personal' | 'contact' | 'registration' | 'academic' | 'enrollment'>('personal');

    // === FILTERS ===
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'graduated' | 'suspended' | 'withdrawn'>('all');
    const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all');
    const [filterProgram, setFilterProgram] = useState('');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // === TOAST & CONFIRM ===
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        title: string;
        message: string;
        type: 'danger' | 'warning' | 'info';
        onConfirm: () => void;
    } | null>(null);

    // === FORM DATA ===
    const [formData, setFormData] = useState<CreateStudentInput>({
        // Names
        firstNameEn: '',
        lastNameEn: '',
        firstNameAr: '',
        lastNameAr: '',
        fullNameId: '',
        fullNamePassport: '',
        certificateName: '',

        // Basic
        dateOfBirth: '',
        gender: 'male',
        nationality: '',

        // Identity
        nationalId: '',
        passportNumber: '',

        // Contact
        email: '',
        phone: '',
        phone2: '',
        address: '',
        city: '',
        country: '',

        // Emergency
        emergencyContactName: '',
        emergencyContactPhone: '',

        // Registration
        registrationNumberPearson: '',
        enrolmentNumberAlsalam: '',
        registrationDateAlsalam: '',

        // Academic
        specialization: '',
        certificateCourseTitle: '',
        notificationCourseTitle: '',
        qualificationLevel: '',
        awardType: undefined,
        yearOfAward: '',

        // Enrollment
        admissionDate: '',
        enrollmentDate: '',
        status: 'active',

        // Platform
        platformUsername: '',
        platformPassword: '',
    });

    // === ENROLLMENT STATE ===
    const [selectedProgram, setSelectedProgram] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [programDetails, setProgramDetails] = useState<any>(null);

    // === LIFECYCLE ===
    useEffect(() => {
        fetchAllData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [students, searchTerm, filterStatus, filterGender, filterProgram]);

    useEffect(() => {
        if (selectedProgram) {
            fetchProgramDetails(selectedProgram);
        } else {
            setProgramDetails(null);
        }
    }, [selectedProgram]);

    // === DATA FETCHING ===
    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [studentsRes, programsRes, classesRes] = await Promise.all([
                studentService.getStudents(),
                academicService.getPrograms(),
                academicService.getClasses(),
            ]);
            if (studentsRes.data) setStudents(studentsRes.data.students || []);
            if (programsRes.data) setPrograms(programsRes.data.programs || []);
            if (classesRes.data) setClasses(classesRes.data.classes || []);
        } catch (error) {
            console.error('Error:', error);
            setToast({ type: 'error', message: '❌ فشل في تحميل البيانات' });
        } finally {
            setLoading(false);
        }
    };

    const fetchProgramDetails = async (programId: string) => {
        try {
            const response = await academicService.getProgramById(programId);
            if (response.data) {
                setProgramDetails(response.data.program);
            }
        } catch (error) {
            console.error('Error fetching program:', error);
        }
    };

    const applyFilters = () => {
        let filtered = [...students];

        // Search
        if (searchTerm) {
            filtered = filtered.filter(s =>
                s.firstNameAr?.includes(searchTerm) ||
                s.lastNameAr?.includes(searchTerm) ||
                s.firstNameEn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.lastNameEn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.studentNumber.includes(searchTerm) ||
                s.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.registrationNumberPearson?.includes(searchTerm) ||
                s.enrolmentNumberAlsalam?.includes(searchTerm)
            );
        }

        // Status
        if (filterStatus !== 'all') {
            filtered = filtered.filter(s => s.status === filterStatus);
        }

        // Gender
        if (filterGender !== 'all') {
            filtered = filtered.filter(s => s.gender === filterGender);
        }

        // Program
        if (filterProgram) {
            filtered = filtered.filter(s =>
                s.enrollments?.some(e => e.class.program.id === filterProgram)
            );
        }

        setFilteredStudents(filtered);
    };

    // === FORM HANDLERS ===
    const resetForm = () => {
        setFormData({
            firstNameEn: '', lastNameEn: '', firstNameAr: '', lastNameAr: '',
            fullNameId: '', fullNamePassport: '', certificateName: '',
            dateOfBirth: '', gender: 'male', nationality: '',
            nationalId: '', passportNumber: '',
            email: '', phone: '', phone2: '', address: '', city: '', country: '',
            emergencyContactName: '', emergencyContactPhone: '',
            registrationNumberPearson: '', enrolmentNumberAlsalam: '', registrationDateAlsalam: '',
            specialization: '', certificateCourseTitle: '', notificationCourseTitle: '',
            qualificationLevel: '', awardType: undefined, yearOfAward: '',
            admissionDate: '', enrollmentDate: '', status: 'active',
            platformUsername: '', platformPassword: '',
        });
        setEditingStudent(null);
        setActiveTab('personal');
        setSelectedProgram('');
        setSelectedClass('');
        setProgramDetails(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const cleanData = { ...formData };

            // Remove empty optional fields
            Object.keys(cleanData).forEach(key => {
                if (cleanData[key as keyof CreateStudentInput] === '') {
                    delete cleanData[key as keyof CreateStudentInput];
                }
            });

            if (editingStudent) {
                await studentService.updateStudent(editingStudent.id, cleanData);
                setToast({ type: 'success', message: '✅ تم تحديث بيانات الطالب بنجاح' });
            } else {
                const response = await studentService.createStudent(cleanData);
                setToast({ type: 'success', message: '✅ تم إضافة الطالب بنجاح' });

                // Enroll in class if selected
                if (selectedClass && response.data?.student?.id) {
                    await studentService.enrollStudent(response.data.student.id, {
                        classId: selectedClass,
                        programId: selectedProgram
                    });
                    setToast({ type: 'success', message: '✅ تم إضافة الطالب للفصل بنجاح' });
                }
            }

            setShowModal(false);
            resetForm();
            fetchAllData();
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

    const handleEdit = (student: Student) => {
        setEditingStudent(student);
        setFormData({
            firstNameEn: student.firstNameEn || '',
            lastNameEn: student.lastNameEn || '',
            firstNameAr: student.firstNameAr || '',
            lastNameAr: student.lastNameAr || '',
            fullNameId: student.fullNameId || '',
            fullNamePassport: student.fullNamePassport || '',
            certificateName: student.certificateName || '',
            dateOfBirth: student.dateOfBirth || '',
            gender: student.gender || 'male',
            nationality: student.nationality || '',
            nationalId: student.nationalId || '',
            passportNumber: student.passportNumber || '',
            email: student.user?.email || '',
            phone: student.phone || '',
            phone2: student.phone2 || '',
            address: student.address || '',
            city: student.city || '',
            country: student.country || '',
            emergencyContactName: student.emergencyContactName || '',
            emergencyContactPhone: student.emergencyContactPhone || '',
            registrationNumberPearson: student.registrationNumberPearson || '',
            enrolmentNumberAlsalam: student.enrolmentNumberAlsalam || '',
            registrationDateAlsalam: student.registrationDateAlsalam || '',
            specialization: student.specialization || '',
            certificateCourseTitle: student.certificateCourseTitle || '',
            notificationCourseTitle: student.notificationCourseTitle || '',
            qualificationLevel: student.qualificationLevel || '',
            awardType: (student.awardType as 'Academic' | 'Vocational' | undefined) || undefined,
            yearOfAward: student.yearOfAward || '',
            admissionDate: student.enrollmentDate || '',
            enrollmentDate: student.enrollmentDate || '',
            status: student.status,
            platformUsername: student.platformUsername || '',
            platformPassword: '',
        });
        setShowModal(true);
    };

    const handleDelete = async (student: Student) => {
        const enrollmentCount = student._count?.enrollments || 0;
        setConfirmDialog({
            title: 'حذف الطالب',
            message: enrollmentCount > 0
                ? `⚠️ هذا الطالب مسجل في ${enrollmentCount} فصل/فصول. هل أنت متأكد من حذفه؟`
                : `هل أنت متأكد من حذف الطالب "${student.firstNameAr} ${student.lastNameAr}"؟`,
            type: enrollmentCount > 0 ? 'warning' : 'danger',
            onConfirm: async () => {
                try {
                    setLoading(true);
                    await studentService.deleteStudent(student.id);
                    setToast({ type: 'success', message: '✅ تم حذف الطالب بنجاح' });
                    fetchAllData();
                } catch (error) {
                    setToast({ type: 'error', message: '❌ فشل في حذف الطالب' });
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    // === STATS ===
    const stats = {
        total: students.length,
        active: students.filter(s => s.status === 'active').length,
        graduated: students.filter(s => s.status === 'graduated').length,
        suspended: students.filter(s => s.status === 'suspended').length,
    };

    // === LOADING ===
    if (loading && students.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F8FAFC' }}>
                <div className="next-gen-loader"></div>
            </div>
        );
    }

    return (
        <div className="next-gen-page-container">
            {/* Continue with JSX... */}
            <p>Students Page - Under Construction (Part 1/3)</p>

            {/* Toast & Confirm Dialog */}
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
            {confirmDialog && (
                <ConfirmDialog
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    type={confirmDialog.type}
                    onConfirm={() => {
                        confirmDialog.onConfirm();
                        setConfirmDialog(null);
                    }}
                    onCancel={() => setConfirmDialog(null)}
                />
            )}
        </div>
    );
}
