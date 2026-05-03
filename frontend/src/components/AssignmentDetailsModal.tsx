// @ts-nocheck
import { useState, useEffect } from 'react';
import { X, Search, Plus, User, Clock, CheckCircle2, AlertCircle, FileText, ChevronRight, RefreshCw } from 'lucide-react';
import { assignmentsService, Assignment, Submission } from '../services/assignments.service';
import { academicService } from '../services/academic.service';
import { studentsService } from '../services/students.service';
import { Toast } from './Toast';

interface AssignmentDetailsModalProps {
    assignment: Assignment;
    onClose: () => void;
}

export function AssignmentDetailsModal({ assignment, onClose }: AssignmentDetailsModalProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'submissions'>('submissions');
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // Manual Submission State
    const [showAddSubmission, setShowAddSubmission] = useState(false);
    const [searchStudentTerm, setSearchStudentTerm] = useState('');
    const [foundStudents, setFoundStudents] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [studentEnrollments, setStudentEnrollments] = useState<any[]>([]);
    const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('');
    const [submissionNote, setSubmissionNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, [assignment.id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const subsResponse = await assignmentsService.getAssignmentSubmissions(assignment.id);
            const studentsResponse = await academicService.getUnitStudents(assignment.unitId);

            const fetchedSubmissions = subsResponse.data?.submissions || [];
            const allEnrollments = studentsResponse.data?.enrollments || [];

            const mergedData = allEnrollments.map(enr => {
                const sub = fetchedSubmissions.find(s => s.studentEnrollmentId === enr.id);
                return sub || {
                    id: `missing-${enr.id}`,
                    studentEnrollment: enr,
                    status: 'missing',
                    score: null,
                    submittedAt: null
                };
            });
            setSubmissions(mergedData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchStudent = async (term: string) => {
        setSearchStudentTerm(term);
        if (term.length > 2) {
            const res = await studentsService.getStudents('active', term);
            if (res.success) setFoundStudents(res.data?.students || []);
        } else setFoundStudents([]);
    };

    const handleSelectStudent = async (student: any) => {
        setSelectedStudent(student);
        setFoundStudents([]);
        setSearchStudentTerm(`${student.firstNameAr} ${student.lastNameAr}`);
        const res = await studentsService.getStudentEnrollments(student.id);
        if (res.success) {
            const enrollmentData = res.data?.enrollments || [];
            setStudentEnrollments(enrollmentData);
            if (enrollmentData.length > 0) setSelectedEnrollmentId(enrollmentData[0].id);
        }
    };

    const handleCreateSubmission = async () => {
        if (!selectedEnrollmentId) return;
        setSubmitting(true);
        try {
            await assignmentsService.createSubmission({
                assignmentId: assignment.id,
                studentEnrollmentId: selectedEnrollmentId,
                content: submissionNote || 'تسليم يدوي',
                remarks: 'تمت الإضافة بواسطة المسؤول'
            });
            setToast({ type: 'success', message: 'تم تسجيل التسليم بنجاح' });
            setShowAddSubmission(false);
            resetSubmissionForm();
            loadData();
        } catch (error) {
            setToast({ type: 'error', message: 'فشل تسجيل التسليم' });
        } finally {
            setSubmitting(false);
        }
    };

    const resetSubmissionForm = () => {
        setSearchStudentTerm('');
        setSelectedStudent(null);
        setStudentEnrollments([]);
        setSelectedEnrollmentId('');
        setSubmissionNote('');
    };

    const filteredSubmissions = submissions.filter(sub => {
        const nameAr = sub.studentEnrollment?.student?.firstNameAr || '';
        const nameEn = sub.studentEnrollment?.student?.firstNameEn || '';
        const num = sub.studentEnrollment?.student?.studentNumber || '';
        const term = searchTerm.toLowerCase();
        const matchesSearch = nameAr.includes(searchTerm) || nameEn.toLowerCase().includes(term) || num.includes(term);
        const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="ag-modal-overlay" style={{ zIndex: 6500 }} onClick={onClose}>
            <div className="ag-modal" style={{ maxWidth: '900px', height: '85vh' }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="ag-modal-head">
                    <div>
                        <h3 className="ag-modal-title">{assignment.title}</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--hz-orange)', fontWeight: 800 }}>{assignment.unit?.nameAr}</span>
                    </div>
                    <button className="ag-btn-icon" onClick={onClose}><X size={20} /></button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', padding: '0 24px', background: 'var(--hz-surface)', borderBottom: '1px solid var(--hz-border-subtle)', gap: '20px' }}>
                    <button
                        onClick={() => setActiveTab('submissions')}
                        style={{ padding: '12px 0', background: 'none', border: 'none', color: activeTab === 'submissions' ? 'var(--hz-orange)' : 'var(--hz-text-muted)', borderBottom: activeTab === 'submissions' ? '2px solid var(--hz-orange)' : '2px solid transparent', fontWeight: 800, cursor: 'pointer', transition: '0.2s', fontSize: '0.85rem' }}
                    >
                        تسليمات الطلاب ({submissions.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('overview')}
                        style={{ padding: '12px 0', background: 'none', border: 'none', color: activeTab === 'overview' ? 'var(--hz-orange)' : 'var(--hz-text-muted)', borderBottom: activeTab === 'overview' ? '2px solid var(--hz-orange)' : '2px solid transparent', fontWeight: 800, cursor: 'pointer', transition: '0.2s', fontSize: '0.85rem' }}
                    >
                        نظرة عامة
                    </button>
                </div>

                <div className="ag-modal-body" style={{ background: 'var(--hz-dark)', flex: 1 }}>
                    {activeTab === 'submissions' ? (
                        <>
                            {!showAddSubmission ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'nowrap', alignItems: 'center' }}>
                                        <div className="ag-search" style={{ flex: 1 }}>
                                            <Search size={14} />
                                            <input type="text" placeholder="بحث الطالب بالاسم أو الرقم..." className="ag-select" style={{ backgroundImage: 'none', paddingLeft: '12px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                        </div>
                                        <select className="ag-select" style={{ width: '150px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                            <option value="all">الحالة</option>
                                            <option value="submitted">تم التسليم</option>
                                            <option value="graded">تم التصحيح</option>
                                            <option value="missing">مفقود</option>
                                        </select>
                                        <button className="ag-btn ag-btn-primary" onClick={() => setShowAddSubmission(true)} >
                                            <Plus size={16} /> تسليم يدوي
                                        </button>
                                    </div>

                                    <div style={{ overflowX: 'auto', background: 'var(--hz-surface)', borderRadius: '12px', border: '1px solid var(--hz-border-soft)' }}>
                                        <table className="ag-table">
                                            <thead>
                                                <tr>
                                                    <th>الطالب</th>
                                                    <th>التاريخ</th>
                                                    <th>الحالة</th>
                                                    <th>الدرجة</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredSubmissions.map(sub => (
                                                    <tr key={sub.id}>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--hz-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                                                                    {sub.studentEnrollment?.student?.gender === 'female' ? '👩' : '👨'}
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.8rem' }}>{sub.studentEnrollment?.student?.firstNameAr} {sub.studentEnrollment?.student?.lastNameAr}</div>
                                                                    <div style={{ fontSize: '0.65rem', color: 'var(--hz-text-muted)' }}>{sub.studentEnrollment?.student?.studentNumber}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td dir="ltr" style={{ fontSize: '0.75rem', color: 'var(--hz-text-secondary)' }}>
                                                            {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('ar-EG') : '—'}
                                                        </td>
                                                        <td>
                                                            <span className={`ag-status-badge ${sub.status}`}>
                                                                {sub.status === 'graded' ? 'مصحح' : sub.status === 'submitted' ? 'مستلم' : 'مفقود'}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontWeight: 900, color: '#fff' }}>
                                                            {sub.score !== null ? `${sub.score} / ${assignment.totalMarks}` : (sub.grade || '—')}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0, fontWeight: 900, color: '#fff' }}>تسجيل تسليم يدوي</h4>
                                        <button onClick={() => { setShowAddSubmission(false); resetSubmissionForm(); }} style={{ background: 'none', border: 'none', color: '#FC8181', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}>إلغاء</button>
                                    </div>

                                    <div className="ag-filter-group">
                                        <label className="ag-filter-label">بحث عن الطالب *</label>
                                        <div className="ag-search">
                                            <Search size={14} />
                                            <input type="text" className="ag-select" style={{ backgroundImage: 'none', paddingLeft: '12px' }} placeholder="الاسم أو الرقم..." value={searchStudentTerm} onChange={e => handleSearchStudent(e.target.value)} />
                                            {foundStudents.length > 0 && (
                                                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--hz-surface-2)', border: '1px solid var(--hz-border-soft)', borderRadius: '8px', zIndex: 10, marginTop: '4px', maxHeight: '150px', overflowY: 'auto' }}>
                                                    {foundStudents.map(s => (
                                                        <div key={s.id} onClick={() => handleSelectStudent(s)} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--hz-border-subtle)' }}>
                                                            <div style={{ fontWeight: 800, fontSize: '0.8rem' }}>{s.firstNameAr} {s.lastNameAr}</div>
                                                            <div style={{ fontSize: '0.65rem', color: 'var(--hz-text-muted)' }}>{s.studentNumber}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {selectedStudent && (
                                        <div className="ag-filter-group">
                                            <label className="ag-filter-label">الفصل الدراسي</label>
                                            <select className="ag-select" value={selectedEnrollmentId} onChange={e => setSelectedEnrollmentId(e.target.value)}>
                                                {studentEnrollments.map(enr => <option key={enr.id} value={enr.id}>{enr.class?.name || 'فصل غير مسمى'}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    <div className="ag-filter-group">
                                        <label className="ag-filter-label">ملاحظات</label>
                                        <textarea className="ag-select" style={{ height: '70px', paddingTop: '10px', backgroundImage: 'none' }} value={submissionNote} onChange={e => setSubmissionNote(e.target.value)} placeholder="ملاحظات التسليم..." />
                                    </div>

                                    <button
                                        onClick={handleCreateSubmission}
                                        disabled={submitting || !selectedEnrollmentId}
                                        className="ag-btn ag-btn-primary"
                                        style={{ height: '44px', justifyContent: 'center' }}
                                    >
                                        {submitting ? <RefreshCw className="spinner" size={18} /> : <CheckCircle2 size={18} />}
                                        تأكيد التسليم
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div>
                                <label className="ag-filter-label" style={{ marginBottom: '12px', display: 'block' }}>وصف الواجب</label>
                                <div style={{ background: 'var(--hz-surface)', padding: '20px', borderRadius: '12px', fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--hz-text-secondary)', border: '1px solid var(--hz-border-soft)' }}>
                                    {assignment.description || 'لا يوجد وصف متاح.'}
                                </div>
                            </div>
                            <div>
                                <label className="ag-filter-label" style={{ marginBottom: '12px', display: 'block' }}>المعايير والإحصائيات</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div style={{ background: 'var(--hz-surface)', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--hz-border-soft)' }}>
                                        <span style={{ display: 'block', fontSize: '1.4rem', fontWeight: 900, color: 'var(--hz-orange)' }}>{assignment.totalMarks}</span>
                                        <span style={{ fontSize: '0.6rem', color: 'var(--hz-text-muted)', fontWeight: 700 }}>الدرجة الكلية</span>
                                    </div>
                                    <div style={{ background: 'var(--hz-surface)', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--hz-border-soft)' }}>
                                        <span style={{ display: 'block', fontSize: '1.4rem', fontWeight: 900, color: '#68D391' }}>{assignment.passThreshold || '50'}%</span>
                                        <span style={{ fontSize: '0.6rem', color: 'var(--hz-text-muted)', fontWeight: 700 }}>حد النجاح</span>
                                    </div>
                                    <div style={{ background: 'var(--hz-surface)', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--hz-border-soft)' }}>
                                        <span style={{ display: 'block', fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>{submissions.filter(s => s.status !== 'missing').length}</span>
                                        <span style={{ fontSize: '0.6rem', color: 'var(--hz-text-muted)', fontWeight: 700 }}>تسليمات فعالية</span>
                                    </div>
                                    <div style={{ background: 'var(--hz-surface)', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--hz-border-soft)' }}>
                                        <span style={{ display: 'block', fontSize: '1.4rem', fontWeight: 900, color: '#FC8181' }}>{submissions.filter(s => s.status === 'missing').length}</span>
                                        <span style={{ fontSize: '0.6rem', color: 'var(--hz-text-muted)', fontWeight: 700 }}>مفقود</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        </div>
    );
}
