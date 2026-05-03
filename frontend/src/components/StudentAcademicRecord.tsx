import React, { useEffect, useState } from 'react';
import { X, Loader2, AlertCircle, BookOpen, Award, Edit2, Save, Calendar, CheckCircle2, Clock, AlertTriangle, PlayCircle, MinusCircle } from 'lucide-react';
import { studentService } from '../services/student.service';
import './StudentAcademicRecord.css';

interface Props {
    studentId: string;
    isOpen: boolean;
    onClose: () => void;
    initialUnitId?: string;
}

const StudentAcademicRecord: React.FC<Props> = ({ studentId, isOpen, onClose, initialUnitId }) => {
    const [loading, setLoading] = useState(false);
    const [studentData, setStudentData] = useState<any>(null);
    const [academicRecord, setAcademicRecord] = useState<any>(null);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editStatus, setEditStatus] = useState('');
    const [editGrade, setEditGrade] = useState('');

    useEffect(() => {
        if (isOpen && studentId) {
            loadAllData();
        }
    }, [isOpen, studentId]);

    // Handle initial unit focus
    useEffect(() => {
        if (isOpen && initialUnitId && studentData) { // Wait for studentData at least
            // Slight delay to ensure render
            setTimeout(() => {
                const el = document.getElementById(`unit-${initialUnitId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.style.transition = 'box-shadow 0.5s';
                    el.style.boxShadow = '0 0 0 4px rgba(221, 107, 32, 0.4)';
                    setTimeout(() => el.style.boxShadow = '', 2000);
                }

                // Find record to edit
                let currentStatus = 'not_started';
                let currentGrade = '';

                let records: any[] = [];
                if (Array.isArray(academicRecord)) records = academicRecord;
                else if (academicRecord?.academicRecord) records = academicRecord.academicRecord;

                const record = records.find((r: any) => r.unitId === initialUnitId);
                if (record) {
                    currentStatus = record.status;
                    currentGrade = record.grade;
                }

                handleEdit(initialUnitId, currentStatus, currentGrade);
            }, 800);
        }
    }, [isOpen, initialUnitId, academicRecord, studentData]);

    const loadAllData = async () => {
        setLoading(true);
        setError('');
        try {
            // 1. جلب بيانات الطالب
            const studentResponse = await studentService.getStudent(studentId);
            const student = studentResponse.data?.data?.student || studentResponse.data?.student || studentResponse.data;
            setStudentData(student);

            // 2. جلب السجل الأكاديمي
            const programId = student?.enrollments?.[0]?.class?.program?.id;
            if (programId) {
                const academicResponse = await studentService.getAcademicRecord(studentId, programId);
                const academicData = academicResponse.data || academicResponse;
                console.log('🔍 RAW API Response:', academicData);

                // Check for various response formats including direct object with academicRecord
                if (academicData.success || academicData.data || Array.isArray(academicData) || academicData.academicRecord) {
                    console.log('📥 Processing Data based on format check...');

                    // Extract the array
                    const rawData = academicData.data || academicData;
                    // If rawData IS the array (unlikely but possible), use it. Else look for property.
                    let records = [];
                    if (Array.isArray(rawData)) {
                        records = rawData;
                    } else if (rawData.academicRecord) {
                        records = rawData.academicRecord;
                    } else if (rawData.data?.academicRecord) { // Triple nested?
                        records = rawData.data.academicRecord;
                    }

                    console.log(`💾 Extracted Records (Length: ${records?.length}):`, records);
                    if (records) setAcademicRecord(records);
                } else {
                    console.error('❌ Data check failed. Response format unknown:', academicData);
                }
            }
        } catch (err: any) {
            console.error('❌ خطأ:', err);
            setError(err.response?.data?.message || 'حدث خطأ أثناء التحميل');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (unitId: string, currentStatus: string, currentGrade: string) => {
        setEditingId(unitId);
        setEditStatus(currentStatus);
        setEditGrade(currentGrade || '');
    };

    const handleSave = async (unitId: string) => {
        try {
            console.log('📤 جاري حفظ التحديث:', { studentId, unitId, status: editStatus, grade: editGrade });
            const response = await studentService.updateUnitStatus(studentId, {
                unitId,
                status: editStatus,
                grade: editGrade ? editGrade : null as any // Send null to clear grade
            });
            console.log('✅ تم الحفظ بنجاح:', response);
            setEditingId(null);
            loadAllData();
        } catch (err: any) {
            console.error('❌ خطأ في الحفظ:', err);
            alert(err.response?.data?.message || 'فشل التحديث');
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditStatus('');
        setEditGrade('');
    };

    const getStatusInfo = (status: string) => {
        const info: Record<string, { label: string; bg: string; color: string; border: string; icon: any }> = {
            'completed': { label: 'مكتمل', bg: '#dcfce7', color: '#166534', border: '#86efac', icon: CheckCircle2 },
            'in_progress': { label: 'قيد الدراسة', bg: '#dbeafe', color: '#1e40af', border: '#93c5fd', icon: PlayCircle },
            'scheduled': { label: 'مسجل', bg: '#f3e8ff', color: '#7c3aed', border: '#d8b4fe', icon: Calendar },
            'missing': { label: 'فائت', bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', icon: AlertTriangle },
            'exempted': { label: 'معادلة', bg: '#fef3c7', color: '#854d0e', border: '#fde047', icon: Award },
            'not_started': { label: 'لم يبدأ', bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1', icon: MinusCircle }
        };
        return info[status] || info.not_started;
    };

    if (!isOpen) return null;

    // Data Preparation
    const studentName = studentData
        ? `${studentData.firstNameAr || ''} ${studentData.lastNameAr || ''}`.trim() || 'غير محدد'
        : 'غير محدد';
    const program = studentData?.enrollments?.[0]?.class?.program;
    const programName = program?.nameAr || 'غير محدد';
    const programCode = program?.code || '';
    const currentClass = studentData?.enrollments?.[0]?.class;
    const className = currentClass?.name || 'غير محدد';

    const programUnits = program?.programUnits || [];
    const unitsWithStatus = programUnits.map((programUnit: any) => {
        const unit = programUnit.unit;

        // Handle different academicRecord structures (Array or Object)
        let recordsArray: any[] = [];
        if (Array.isArray(academicRecord)) {
            recordsArray = academicRecord;
        } else if (academicRecord && Array.isArray(academicRecord.academicRecord)) {
            recordsArray = academicRecord.academicRecord;
        }

        const recordEntry = recordsArray.find((record: any) => record.unitId === unit.id);

        if (recordEntry) {
            console.log(`✅ Frontend: Found record for ${unit.code}: ${recordEntry.status}`);
        } else {
            console.log(`⚠️ Frontend: Missing record for ${unit.code} (${unit.id}) inside array of length ${recordsArray.length}`);
        }
        return {
            id: unit.id,
            code: unit.code,
            nameAr: unit.nameAr,
            nameEn: unit.nameEn,
            creditHours: unit.creditHours,
            isMandatory: programUnit.isMandatory,
            status: recordEntry?.status || 'not_started',
            grade: recordEntry?.grade || null,
            className: recordEntry?.className || null,
            isCurrent: recordEntry?.isCurrent || false
        };
    });

    const stats = {
        total: unitsWithStatus.length,
        completed: unitsWithStatus.filter((u: any) => u.status === 'completed' || u.status === 'exempted').length,
        inProgress: unitsWithStatus.filter((u: any) => u.status === 'in_progress' || u.status === 'scheduled').length,
        remaining: unitsWithStatus.filter((u: any) => u.status === 'missing' || u.status === 'not_started').length
    };

    return (
        <div className="academic-overlay">
            <div className="academic-modal">
                {/* Header */}
                <div className="modal-header">
                    <div className="header-info">
                        <BookOpen size={24} />
                        <div>
                            <h2>سجل الوحدات الدراسية</h2>
                            <p className="header-subtitle">{studentName} • {className}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="close-btn">
                        <X size={24} />
                    </button>
                </div>

                {/* Content - Two Column Layout */}
                <div className="academic-content">
                    {loading ? (
                        <div className="loading-state">
                            <Loader2 className="spin" size={48} />
                            <p>جاري تحميل البيانات...</p>
                        </div>
                    ) : error ? (
                        <div className="error-state">
                            <AlertCircle size={48} />
                            <p>{error}</p>
                            <button onClick={loadAllData} className="retry-btn">إعادة المحاولة</button>
                        </div>
                    ) : studentData ? (
                        <>
                            {/* Sidebar: Student Info & Stats */}
                            <div className="sidebar">
                                {/* Student Info Card */}
                                <div className="info-card">
                                    <div className="info-row">
                                        <div className="label">اسم الطالب</div>
                                        <div className="value name">{studentName}</div>
                                    </div>
                                    <div className="info-row">
                                        <div className="label">البرنامج</div>
                                        <div className="value">{programName}</div>
                                        <div className="sub-value">{programCode}</div>
                                    </div>
                                    <div className="info-row">
                                        <div className="label">الفصل الحالي</div>
                                        <div className="value">{className}</div>
                                    </div>
                                </div>

                                {/* Stats Grid (Vertical) */}
                                <div className="stats-vertical">
                                    <div className="stat-item">
                                        <div className="stat-icon total"><Award size={20} /></div>
                                        <div className="stat-details">
                                            <span className="stat-value">{stats.total}</span>
                                            <span className="stat-label">إجمالي الوحدات</span>
                                        </div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-icon completed"><CheckCircle2 size={20} /></div>
                                        <div className="stat-details">
                                            <span className="stat-value">{stats.completed}</span>
                                            <span className="stat-label">منجزة (مكتمل/معادلة)</span>
                                        </div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-icon progress"><PlayCircle size={20} /></div>
                                        <div className="stat-details">
                                            <span className="stat-value">{stats.inProgress}</span>
                                            <span className="stat-label">جارية (تدرس الآن)</span>
                                        </div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-icon remaining"><Clock size={20} /></div>
                                        <div className="stat-details">
                                            <span className="stat-value">{stats.remaining}</span>
                                            <span className="stat-label">متبقية</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Area: Units List */}
                            <div className="main-area">
                                <h3 className="section-title">
                                    قائمة الوحدات الدراسية
                                    <span className="badge">{unitsWithStatus.length}</span>
                                </h3>

                                <div className="units-list">
                                    {unitsWithStatus.map((unit: any) => {
                                        const statusInfo = getStatusInfo(unit.status);
                                        const StatusIcon = statusInfo.icon;
                                        const isEditing = editingId === unit.id;

                                        return (
                                            <div
                                                key={unit.id}
                                                id={`unit-${unit.id}`}
                                                className={`unit-card ${unit.status}`}
                                                style={{
                                                    backgroundColor: statusInfo.bg,
                                                    borderColor: statusInfo.border,
                                                    borderWidth: '1px',
                                                    borderStyle: 'solid'
                                                }}
                                            >
                                                {/* Right Side: Code & Info */}
                                                {/* Top Row: Info + Status Display */}
                                                <div className="unit-card-row">
                                                    <div className="unit-info">
                                                        <div className="unit-code">{unit.code}</div>
                                                        <div>
                                                            <div className="unit-name-ar">{unit.nameAr}</div>
                                                            <div className="unit-name-en">{unit.nameEn}</div>
                                                            <div className="unit-meta">
                                                                <span>{unit.creditHours} ساعة</span>
                                                                {unit.isMandatory && <span className="tag mandatory">إلزامية</span>}
                                                                {unit.isCurrent && unit.className && <span className="tag current">{unit.className}</span>}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Status & Edit Trigger */}
                                                    <div className="unit-status-section">
                                                        <div className="status-badge" style={{
                                                            background: statusInfo.bg,
                                                            color: statusInfo.color,
                                                            border: `1px solid ${statusInfo.border}`
                                                        }}>
                                                            <StatusIcon size={14} />
                                                            {statusInfo.label}
                                                        </div>

                                                        {unit.grade && <div className="grade-display">{unit.grade}</div>}

                                                        <button
                                                            onClick={() => isEditing ? handleCancel() : handleEdit(unit.id, unit.status, unit.grade)}
                                                            className={`btn-edit-toggle ${isEditing ? 'active' : ''}`}
                                                            title={isEditing ? 'إغلاق' : 'تعديل'}
                                                        >
                                                            {isEditing ? <X size={18} /> : <Edit2 size={18} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Expandable Edit Panel */}
                                                <div className={`unit-edit-panel ${isEditing ? 'open' : ''}`}>
                                                    <div className="edit-panel-content">
                                                        <div className="form-row">
                                                            <div className="form-group">
                                                                <label>الحالة الأكاديمية</label>
                                                                <select
                                                                    value={editStatus}
                                                                    onChange={(e) => setEditStatus(e.target.value)}
                                                                    className="edit-select"
                                                                >
                                                                    <option value="not_started">لم يبدأ</option>
                                                                    <option value="scheduled">مسجل</option>
                                                                    <option value="in_progress">قيد الدراسة</option>
                                                                    <option value="missing">فائت</option>
                                                                    <option value="completed">مكتمل</option>
                                                                    <option value="exempted">معادلة</option>
                                                                </select>
                                                            </div>
                                                            <div className="form-group">
                                                                <label>الدرجة (Grade)</label>
                                                                <input
                                                                    type="text"
                                                                    value={editGrade}
                                                                    onChange={(e) => setEditGrade(e.target.value)}
                                                                    placeholder="-"
                                                                    className="edit-input"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="action-row">
                                                            <button onClick={() => handleSave(unit.id)} className="btn-save-full">
                                                                <Save size={16} /> حفظ التغييرات
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default StudentAcademicRecord;
