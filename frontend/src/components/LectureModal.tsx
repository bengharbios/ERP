import { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, BookOpen, AlertCircle, CheckCircle2, XCircle, Clock3, Save, RotateCcw, MinusCircle } from 'lucide-react';
import { Lecture, scheduleService } from '../services/schedule.service';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface StudentAttendance {
    studentId: string;
    studentNumber: string;
    studentName: string;
    attendanceStatus: 'present' | 'absent' | 'late' | 'excused' | 'not_studied' | 'not_recorded';
    notes: string | null;
}

interface LectureModalProps {
    lecture: Lecture | null;
    isOpen: boolean;
    onClose: () => void;
    onPostpone: (lectureId: string, reason: string) => Promise<void>;
    onCancel: (lectureId: string, reason: string) => Promise<void>;
    onUndo?: (lectureId: string) => Promise<void>;
}

export default function LectureModal({ lecture, isOpen, onClose, onPostpone, onCancel, onUndo }: LectureModalProps) {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [actionType, setActionType] = useState<'postpone' | 'cancel' | 'undo' | 'attendance' | null>(null);
    const [students, setStudents] = useState<StudentAttendance[]>([]);
    const [fetchingAttendance, setFetchingAttendance] = useState(false);
    const [showAttendance, setShowAttendance] = useState(false);

    useEffect(() => {
        if (isOpen && lecture?.id) {
            fetchAttendance();
        } else {
            setShowAttendance(false);
            setStudents([]);
        }
    }, [isOpen, lecture?.id]);

    const fetchAttendance = async () => {
        if (!lecture?.id) return;
        setFetchingAttendance(true);
        try {
            const response = await scheduleService.getLectureAttendance(lecture.id);
            console.log('📡 Attendance API Response:', response);

            // Check if data is nested or direct
            const result = response.data?.data || response.data || response;

            if (result && (result.students || (result.data && result.data.students))) {
                const studentsList = result.students || result.data.students;
                console.log('✅ Students loaded:', studentsList);
                setStudents(studentsList);
            } else {
                console.log('⚠️ No students list found in response');
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
        } finally {
            setFetchingAttendance(false);
        }
    };

    const handleUpdateStudentStatus = (studentId: string, status: StudentAttendance['attendanceStatus']) => {
        setStudents(prev => prev.map(s =>
            s.studentId === studentId ? { ...s, attendanceStatus: status } : s
        ));
    };

    const handleSaveAttendance = async () => {
        if (!lecture?.id) return;
        setLoading(true);
        try {
            const records = students
                .filter(s => s.attendanceStatus !== 'not_recorded')
                .map(s => ({
                    studentId: s.studentId,
                    status: s.attendanceStatus,
                    notes: s.notes || undefined
                }));

            await scheduleService.recordAttendance(lecture.id, records);
            alert('تم حفظ الحضور بنجاح');
            fetchAttendance();
        } catch (error) {
            console.error('Error saving attendance:', error);
            alert('فشل حفظ الحضور');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !lecture) return null;

    const isPostponed = lecture.status === 'postponed';
    const isCancelled = lecture.status === 'cancelled';
    const canUndo = (isPostponed || isCancelled) && onUndo;

    const handleAction = async (type: 'postpone' | 'cancel') => {
        if (!reason.trim()) {
            alert('يرجى إدخال سبب التأجيل أو الإلغاء');
            return;
        }

        setLoading(true);
        setActionType(type);

        try {
            if (type === 'postpone') {
                await onPostpone(lecture.id, reason);
            } else {
                await onCancel(lecture.id, reason);
            }
            setReason('');
            onClose();
        } catch (error) {
            console.error(`Failed to ${type} lecture:`, error);
            alert(`فشل ${type === 'postpone' ? 'التأجيل' : 'الإلغاء'}`);
        } finally {
            setLoading(false);
            setActionType(null);
        }
    };

    const handleUndo = async () => {
        if (!onUndo) return;

        setLoading(true);
        setActionType('undo');

        try {
            await onUndo(lecture.id);
            onClose();
        } catch (error) {
            console.error('Failed to undo lecture:', error);
            alert('فشل التراجع');
        } finally {
            setLoading(false);
            setActionType(null);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleBackdropClick}>
            <div className="modal-container lecture-modal">
                {/* Header */}
                <div className="modal-header">
                    <h2 className="modal-title">
                        {canUndo ? 'استرجاع المحاضرة' : 'إدارة المحاضرة'}
                    </h2>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="modal-content">
                    {/* Lecture Info Card */}
                    <div className="lecture-info-card">
                        <div className="info-row">
                            <span className="info-label">
                                <BookOpen size={16} />
                                المادة:
                            </span>
                            <span className="info-value">{lecture.unit?.nameAr || 'غير محدد'}</span>
                            <button
                                onClick={() => {
                                    setActionType('attendance');
                                    setShowAttendance(!showAttendance);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '1px solid #E2E8F0',
                                    background: showAttendance ? '#EBF8FF' : '#F8FAFC',
                                    color: showAttendance ? '#3182CE' : '#4A5568',
                                    fontWeight: 700,
                                    transition: 'all 0.2s',
                                    cursor: 'pointer'
                                }}
                            >
                                <CheckCircle2 size={18} />
                                تسجيل الحضور
                            </button>
                        </div>

                        {/* Attendance Panel */}
                        {showAttendance && (
                            <div style={{
                                marginTop: '1.5rem',
                                border: '1px solid #E2E8F0',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                background: '#FFFFFF'
                            }}>
                                <div style={{
                                    padding: '1rem',
                                    background: '#F7FAFC',
                                    borderBottom: '1px solid #E2E8F0',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#2D3748' }}>
                                        قائمة الطلاب الحاضرين
                                    </h3>
                                    <button
                                        onClick={handleSaveAttendance}
                                        disabled={loading}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 16px',
                                            borderRadius: '8px',
                                            background: '#38A169',
                                            color: '#FFF',
                                            border: 'none',
                                            fontWeight: 700,
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            opacity: loading ? 0.7 : 1
                                        }}
                                    >
                                        <Save size={16} />
                                        حفظ الكل
                                    </button>
                                </div>

                                <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '0.5rem' }}>
                                    {fetchingAttendance ? (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: '#A0AEC0' }}>جاري التحميل...</div>
                                    ) : students.length === 0 ? (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: '#A0AEC0' }}>لا يوجد طلاب مسجلين في هذا الفصل</div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {students.map((student) => (
                                                <div key={student.studentId} style={{
                                                    padding: '0.75rem',
                                                    border: '1px solid #EDF2F7',
                                                    borderRadius: '12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: '1rem'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '50%',
                                                            background: '#E2E8F0',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: '#4A5568',
                                                            fontWeight: 800,
                                                            fontSize: '0.75rem'
                                                        }}>
                                                            {student.studentName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2D3748' }}>{student.studentName}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#718096' }}>{student.studentNumber}</div>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        <StatusButton
                                                            active={student.attendanceStatus === 'present'}
                                                            color="#38A169"
                                                            icon={<CheckCircle2 size={14} />}
                                                            label="حاضر"
                                                            onClick={() => handleUpdateStudentStatus(student.studentId, 'present')}
                                                        />
                                                        <StatusButton
                                                            active={student.attendanceStatus === 'absent'}
                                                            color="#E53E3E"
                                                            icon={<XCircle size={14} />}
                                                            label="غائب"
                                                            onClick={() => handleUpdateStudentStatus(student.studentId, 'absent')}
                                                        />
                                                        <StatusButton
                                                            active={student.attendanceStatus === 'late'}
                                                            color="#DD6B20"
                                                            icon={<Clock3 size={14} />}
                                                            label="متأخر"
                                                            onClick={() => handleUpdateStudentStatus(student.studentId, 'late')}
                                                        />
                                                        <StatusButton
                                                            active={student.attendanceStatus === 'excused'}
                                                            color="#3182CE"
                                                            icon={<RotateCcw size={14} />}
                                                            label="معذور"
                                                            onClick={() => handleUpdateStudentStatus(student.studentId, 'excused')}
                                                        />
                                                        <StatusButton
                                                            active={student.attendanceStatus === 'not_studied'}
                                                            color="#718096"
                                                            icon={<MinusCircle size={14} />}
                                                            label="لم يدرسها"
                                                            onClick={() => handleUpdateStudentStatus(student.studentId, 'not_studied')}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="info-row">
                            <span className="info-label">
                                <User size={16} />
                                المحاضر:
                            </span>
                            <span className="info-value">
                                {lecture.instructor
                                    ? `${lecture.instructor.firstName} ${lecture.instructor.lastName}`
                                    : 'غير محدد'
                                }
                            </span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">
                                <Calendar size={16} />
                                التاريخ:
                            </span>
                            <span className="info-value">
                                {format(new Date(lecture.scheduledDate), 'EEEE، d MMMM yyyy', { locale: ar })}
                            </span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">
                                <Clock size={16} />
                                الوقت:
                            </span>
                            <span className="info-value" dir="ltr">
                                {format(new Date(lecture.scheduledStartTime), 'HH:mm')} - {format(new Date(lecture.scheduledEndTime), 'HH:mm')}
                            </span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">
                                <AlertCircle size={16} />
                                التسلسل:
                            </span>
                            <span className="info-value">
                                {lecture.sequenceNumber} / {lecture.unit?.totalLectures || '-'}
                            </span>
                        </div>
                        {canUndo && (
                            <div className="info-row">
                                <span className="info-label">
                                    <AlertCircle size={16} />
                                    الحالة:
                                </span>
                                <span className="info-value" style={{ color: isPostponed ? '#2C5282' : '#7C2D12' }}>
                                    {isPostponed ? 'مؤجلة' : 'ملغية'}
                                </span>
                            </div>
                        )}
                    </div>

                    {!canUndo && (
                        <>
                            {/* Reason Input */}
                            <div className="form-group">
                                <label htmlFor="lecture-reason" className="form-label">سبب التأجيل أو الإلغاء *</label>
                                <textarea
                                    id="lecture-reason"
                                    name="reason"
                                    className="input-premium"
                                    rows={3}
                                    placeholder="مثال: عطلة رسمية، مرض المحاضر، ظرف طارئ..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            {/* Action Info Boxes */}
                            <div className="action-info-grid">
                                <div className="action-info-box postpone-info">
                                    <h4>تأجيل المحاضرة</h4>
                                    <p>سيتم نقل المحاضرة لموعد المحاضرة التالية وإزاحة جميع المحاضرات اللاحقة</p>
                                </div>
                                <div className="action-info-box cancel-info">
                                    <h4>إلغاء المحاضرة</h4>
                                    <p>سيتم إلغاء المحاضرة دون تأثير على المحاضرات اللاحقة</p>
                                </div>
                            </div>
                        </>
                    )}

                    {canUndo && (
                        <div className="action-info-box" style={{ borderColor: '#48BB78', background: '#F0FFF4', color: '#22543D' }}>
                            <h4>استرجاع المحاضرة</h4>
                            <p>
                                {isPostponed
                                    ? 'سيتم حذف النسخة المؤجلة وإرجاع المحاضرة الأصلية وإعادة ترقيم المحاضرات'
                                    : 'سيتم إرجاع المحاضرة إلى حالتها الطبيعية'
                                }
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="modal-footer">
                    {canUndo ? (
                        <>
                            <button
                                className="btn-modal btn-undo"
                                onClick={handleUndo}
                                disabled={loading}
                            >
                                {loading && actionType === 'undo' ? 'جاري الاسترجاع...' : 'استرجاع المحاضرة'}
                            </button>
                            <button className="btn-modal btn-secondary" onClick={onClose} disabled={loading}>
                                إغلاق
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className="btn-modal btn-postpone"
                                onClick={() => handleAction('postpone')}
                                disabled={loading}
                            >
                                {loading && actionType === 'postpone' ? 'جاري التأجيل...' : 'تأجيل المحاضرة'}
                            </button>
                            <button
                                className="btn-modal btn-cancel-lecture"
                                onClick={() => handleAction('cancel')}
                                disabled={loading}
                            >
                                {loading && actionType === 'cancel' ? 'جاري الإلغاء...' : 'إلغاء المحاضرة'}
                            </button>
                            <button className="btn-modal btn-secondary" onClick={onClose} disabled={loading}>
                                إغلاق
                            </button>
                        </>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    padding: 1rem;
                }

                .modal-container.lecture-modal {
                    background: white;
                    border-radius: 20px;
                    max-width: 600px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    animation: modalSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem 2rem;
                    border-bottom: 1px solid #EDF2F7;
                }

                .modal-title {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: #1A202C;
                    margin: 0;
                }

                .modal-close-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    border: none;
                    background: #F7FAFC;
                    color: #718096;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .modal-close-btn:hover {
                    background: #EDF2F7;
                    color: #2D3748;
                }

                .modal-content {
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .lecture-info-card {
                    background: #F8FAFC;
                    border: 1px solid #E2E8F0;
                    border-radius: 12px;
                    padding: 1.25rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .info-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 1rem;
                }

                .info-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #718096;
                }

                .info-value {
                    font-size: 0.9375rem;
                    font-weight: 700;
                    color: #1A202C;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .form-label {
                    font-size: 0.875rem;
                    font-weight: 700;
                    color: #2D3748;
                }

                .input-premium {
                    width: 100%;
                    padding: 0.875rem 1rem;
                    border: 1px solid #E2E8F0;
                    border-radius: 12px;
                    background: #F8FAFC;
                    font-size: 0.9375rem;
                    font-family: inherit;
                    resize: vertical;
                    transition: all 0.2s;
                }

                .input-premium:focus {
                    outline: none;
                    border-color: #DD6B20;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(221, 107, 32, 0.1);
                }

                .input-premium:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .action-info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                @media (max-width: 640px) {
                    .action-info-grid {
                        grid-template-columns: 1fr;
                    }
                }

                .action-info-box {
                    padding: 1rem;
                    border-radius: 12px;
                    border: 2px solid;
                }

                .action-info-box h4 {
                    margin: 0 0 0.5rem;
                    font-size: 0.875rem;
                    font-weight: 800;
                }

                .action-info-box p {
                    margin: 0;
                    font-size: 0.75rem;
                    line-height: 1.4;
                }

                .postpone-info {
                    border-color: #BEE3F8;
                    background: #EBF8FF;
                    color: #2C5282;
                }

                .cancel-info {
                    border-color: #FBD38D;
                    background: #FFFAF0;
                    color: #7C2D12;
                }

                .modal-footer {
                    display: flex;
                    gap: 0.75rem;
                    padding: 1.5rem 2rem;
                    border-top: 1px solid #EDF2F7;
                    background: #F8FAFC;
                    border-radius: 0 0 20px 20px;
                }

                @media (max-width: 640px) {
                    .modal-footer {
                        flex-direction: column;
                    }
                }

                .btn-modal {
                    flex: 1;
                    padding: 0.875rem 1.25rem;
                    border-radius: 12px;
                    border: none;
                    font-weight: 700;
                    font-size: 0.9375rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }

                .btn-modal:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .btn-postpone {
                    background: #3182CE;
                    color: white;
                }

                .btn-postpone:hover:not(:disabled) {
                    background: #2C5282;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(49, 130, 206, 0.4);
                }

                .btn-cancel-lecture {
                    background: #92400E;
                    color: white;
                }

                .btn-cancel-lecture:hover:not(:disabled) {
                    background: #78350F;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(146, 64, 14, 0.4);
                }

                .btn-undo {
                    background: #48BB78;
                    color: white;
                }

                .btn-undo:hover:not(:disabled) {
                    background: #38A169;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4);
                }

                .btn-secondary {
                    background: transparent;
                    color: #718096;
                    border: 1px solid #E2E8F0;
                }

                .btn-secondary:hover:not(:disabled) {
                    background: #EDF2F7;
                    color: #2D3748;
                }
                `
            }} />
        </div>
    );
}

// Sub-component for attendance status buttons
function StatusButton({ active, color, icon, label, onClick }: {
    active: boolean,
    color: string,
    icon: React.ReactNode,
    label: string,
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            title={label}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '8px',
                border: active ? `2px solid ${color}` : '1px solid #E2E8F0',
                background: active ? `${color}15` : '#FFF',
                color: active ? color : '#718096',
                cursor: 'pointer',
                transition: 'all 0.2s',
                minWidth: '60px'
            }}
        >
            {icon}
            <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>{label}</span>
        </button>
    );
}
