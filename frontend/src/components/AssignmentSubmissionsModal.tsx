// @ts-nocheck
import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Search, Filter, RefreshCw, User, Calendar, CheckCircle2 } from 'lucide-react';
import { assignmentsService, Assignment } from '../services/assignments.service';
import { academicService } from '../services/academic.service';
import { Toast } from './Toast';

interface AssignmentSubmissionsModalProps {
    assignment: Assignment;
    onClose: () => void;
    onRefresh: () => void;
}

interface EnrolledStudent {
    enrollmentId: string;
    studentId: string;
    studentNumber: string;
    studentNameAr: string;
    studentNameEn: string;
    className: string;
    gender?: string;
    submission: {
        id: string | null;
        submittedAt: string;
        status: 'missing' | 'submitted' | 'being_assessed' | 'graded';
        sentToAssessorAt: string;
        assessorName: string;
        assessedAt: string;
        score: string;
    };
}

export function AssignmentSubmissionsModal({ assignment, onClose, onRefresh }: AssignmentSubmissionsModalProps) {
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<EnrolledStudent[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<EnrolledStudent[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const [editData, setEditData] = useState<{
        [studentId: string]: {
            submittedAt: string;
            assessorName: string;
            assessedAt: string;
            score: string;
        }
    }>({});

    useEffect(() => { loadStudents(); }, [assignment.id]);

    useEffect(() => {
        let filtered = [...students];
        if (searchTerm.trim()) {
            filtered = filtered.filter(s =>
                s.studentNameAr.includes(searchTerm) ||
                s.studentNumber.includes(searchTerm)
            );
        }
        if (statusFilter !== 'all') {
            filtered = filtered.filter(s => s.submission.status === statusFilter);
        }
        setFilteredStudents(filtered);
    }, [students, searchTerm, statusFilter]);

    const loadStudents = async () => {
        setLoading(true);
        try {
            const [enrollmentsRes, submissionsRes] = await Promise.all([
                academicService.getUnitStudents(assignment.unitId),
                assignmentsService.getAssignmentSubmissions(assignment.id)
            ]);

            const enrollments = enrollmentsRes.data?.enrollments || [];
            const submissions = submissionsRes.data?.submissions || [];

            const mergedData: EnrolledStudent[] = enrollments.map(enr => {
                const sub = submissions.find(s => s.studentEnrollmentId === enr.id);
                let status = 'missing';
                if (sub) {
                    status = (sub.score !== null || sub.grade) ? 'graded' : 'submitted';
                }
                return {
                    enrollmentId: enr.id,
                    studentId: enr.student.id,
                    studentNumber: enr.student.studentNumber,
                    studentNameAr: `${enr.student.firstNameAr} ${enr.student.lastNameAr}`,
                    studentNameEn: `${enr.student.firstNameEn} ${enr.student.lastNameEn}`,
                    className: enr.class?.name || 'N/A',
                    gender: enr.student.gender,
                    submission: {
                        id: sub?.id || null,
                        submittedAt: sub?.submittedAt ? new Date(sub.submittedAt).toISOString().slice(0, 16) : '',
                        status: status,
                        assessorName: sub?.assignment?.assessedBy || '',
                        assessedAt: sub?.gradedAt ? new Date(sub.gradedAt).toISOString().slice(0, 16) : '',
                        score: sub?.score?.toString() || ''
                    }
                };
            });

            setStudents(mergedData);
            const initialEdit = {};
            mergedData.forEach(s => {
                initialEdit[s.studentId] = {
                    submittedAt: s.submission.submittedAt,
                    assessorName: s.submission.assessorName,
                    assessedAt: s.submission.assessedAt,
                    score: s.submission.score
                };
            });
            setEditData(initialEdit);
        } catch (error) {
            setToast({ type: 'error', message: 'فشل تحميل البيانات' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (studentId: string, enrollmentId: string) => {
        const data = editData[studentId];
        const student = students.find(s => s.studentId === studentId);
        if (!student) return;

        try {
            let submissionId = student.submission.id;
            if (!submissionId && data.submittedAt) {
                const res = await assignmentsService.createSubmission({
                    assignmentId: assignment.id,
                    studentEnrollmentId: enrollmentId,
                    content: 'تحديث يدوي',
                    submittedAt: data.submittedAt
                });
                submissionId = res.data?.id;
            }

            if (submissionId && data.score) {
                await assignmentsService.gradeSubmission(submissionId, {
                    score: parseFloat(data.score),
                    grade: parseFloat(data.score) >= (assignment.passThreshold || 50) ? 'pass' : 'refer',
                    feedback: `المصحح: ${data.assessorName}`,
                    gradedAt: data.assessedAt || new Date().toISOString()
                });
            }
            setToast({ type: 'success', message: 'تم الحفظ بنجاح' });
            loadStudents();
            onRefresh();
        } catch (error) {
            setToast({ type: 'error', message: 'فشل الحفظ' });
        }
    };

    if (loading) return (
        <div className="as-modal-overlay" style={{ background: 'rgba(0,0,0,0.8)' }}>
            <RefreshCw className="spinner" size={40} color="var(--hz-orange)" />
        </div>
    );

    return (
        <div className="ag-modal-overlay" style={{ zIndex: 6000 }} onClick={onClose}>
            <div className="ag-modal" style={{ maxWidth: '1200px', height: '90vh' }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="ag-modal-head">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: 'var(--hz-orange)', color: '#fff', padding: '6px', borderRadius: '8px' }}><CheckCircle2 size={20} /></div>
                        <div>
                            <h3 className="ag-modal-title">تتبع التسليمات والنتائج</h3>
                            <span style={{ fontSize: '0.7rem', color: 'var(--hz-text-muted)' }}>{assignment.title} • {assignment.unit?.nameAr}</span>
                        </div>
                    </div>
                    <button className="ag-btn-icon" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="ag-modal-body" style={{ background: 'var(--hz-dark)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Tiny Stats Strip inside modal */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <div style={{ background: 'var(--hz-surface)', border: '1px solid var(--hz-border-soft)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>{students.length}</span>
                            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--hz-text-muted)', textTransform: 'uppercase' }}>إجمالي المسجلين</span>
                        </div>
                        <div style={{ background: 'var(--hz-surface)', border: '1px solid var(--hz-border-soft)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 900, color: '#68D391' }}>{students.filter(s => s.submission.status !== 'missing').length}</span>
                            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--hz-text-muted)', textTransform: 'uppercase' }}>تم التسليم</span>
                        </div>
                        <div style={{ background: 'var(--hz-surface)', border: '1px solid var(--hz-border-soft)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 900, color: '#FC8181' }}>{students.filter(s => s.submission.status === 'missing').length}</span>
                            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--hz-text-muted)', textTransform: 'uppercase' }}>لم يسلموا</span>
                        </div>
                    </div>

                    {/* Inner Filters */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <div className="ag-search" style={{ flex: 1, minWidth: '200px' }}>
                            <Search size={16} />
                            <input type="text" placeholder="بحث الطالب بالاسم أو الرقم..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <select className="ag-select" style={{ width: '160px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="all">كل الحالات</option>
                            <option value="missing">لم يسلم</option>
                            <option value="submitted">تم التسليم</option>
                            <option value="graded">تم التصحيح</option>
                        </select>
                    </div>

                    {/* Student Records */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px' }}>
                        {filteredStudents.map(student => (
                            <div key={student.studentId} style={{ background: 'var(--hz-surface)', border: '1px solid var(--hz-border-soft)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '12px 16px', background: 'var(--hz-surface-2)', borderBottom: '1px solid var(--hz-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--hz-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                                            {student.gender === 'female' ? '👩' : '👨'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.85rem' }}>{student.studentNameAr}</div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--hz-text-muted)' }}>{student.studentNumber} • {student.className}</div>
                                        </div>
                                    </div>
                                    <span className={`ag-status-badge ${student.submission.status}`}>
                                        {student.submission.status === 'graded' ? 'مصحح' : student.submission.status === 'missing' ? 'مفقود' : 'مستلم'}
                                    </span>
                                </div>

                                <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="ag-filter-group" style={{ marginBottom: 0 }}>
                                        <label className="ag-filter-label">تاريخ التسليم</label>
                                        <input type="datetime-local" className="ag-select" style={{ backgroundImage: 'none', paddingLeft: '12px' }} value={editData[student.studentId]?.submittedAt} onChange={e => setEditData({ ...editData, [student.studentId]: { ...editData[student.studentId], submittedAt: e.target.value } })} />
                                    </div>
                                    <div className="ag-filter-group" style={{ marginBottom: 0 }}>
                                        <label className="ag-filter-label">الدرجة (/{assignment.totalMarks})</label>
                                        <input type="number" className="ag-select" style={{ backgroundImage: 'none', paddingLeft: '12px', textAlign: 'center', fontWeight: 900, color: 'var(--hz-orange)' }} value={editData[student.studentId]?.score} onChange={e => setEditData({ ...editData, [student.studentId]: { ...editData[student.studentId], score: e.target.value } })} />
                                    </div>
                                    <div className="ag-filter-group" style={{ marginBottom: 0 }}>
                                        <label className="ag-filter-label">المصحح</label>
                                        <input type="text" className="ag-select" style={{ backgroundImage: 'none', paddingLeft: '12px' }} value={editData[student.studentId]?.assessorName} onChange={e => setEditData({ ...editData, [student.studentId]: { ...editData[student.studentId], assessorName: e.target.value } })} placeholder="الاسم..." />
                                    </div>
                                    <div className="ag-filter-group" style={{ marginBottom: 0 }}>
                                        <label className="ag-filter-label">تاريخ التصحيح</label>
                                        <input type="datetime-local" className="ag-select" style={{ backgroundImage: 'none', paddingLeft: '12px' }} value={editData[student.studentId]?.assessedAt} onChange={e => setEditData({ ...editData, [student.studentId]: { ...editData[student.studentId], assessedAt: e.target.value } })} />
                                    </div>
                                </div>

                                <div style={{ padding: '12px 16px', background: 'var(--hz-surface-2)', borderTop: '1px solid var(--hz-border-subtle)' }}>
                                    <button onClick={() => handleSave(student.studentId, student.enrollmentId)} className="ag-btn ag-btn-primary" style={{ width: '100%', height: '36px', justifyContent: 'center' }}>
                                        <Save size={14} /> حفظ النتائج
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        </div>
    );
}
