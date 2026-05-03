import React from 'react';
import { CreateClassInput } from '../services/class.service';
import {
    School, Layers, Calendar, Clock,
    Users, MapPin, Globe, Check, X,
    ShieldCheck, BookOpen,
    DoorOpen, Building
} from 'lucide-react';

interface ClassFormModalProps {
    show: boolean;
    formData: CreateClassInput;
    programs: any[];
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    onChange: (field: string, value: any) => void;
    toggleStudyDay: (day: string) => void;
    toggleUnit?: (unitId: string) => void;
    onUnitLectureChange?: (unitId: string, totalLectures: number) => void;
    onUnitInstructorChange?: (unitId: string, instructorId: string) => void;
    instructors?: any[];
    isEditing?: boolean;
}

const weekDays = [
    { en: 'Sunday', ar: 'الأحد' },
    { en: 'Monday', ar: 'الإثنين' },
    { en: 'Tuesday', ar: 'الثلاثاء' },
    { en: 'Wednesday', ar: 'الأربعاء' },
    { en: 'Thursday', ar: 'الخميس' },
    { en: 'Friday', ar: 'الجمعة' },
    { en: 'Saturday', ar: 'السبت' },
];

export const ClassFormModal: React.FC<ClassFormModalProps> = ({
    show,
    formData,
    programs,
    onClose,
    onSubmit,
    onChange,
    toggleStudyDay,
    toggleUnit,
    onUnitLectureChange,
    onUnitInstructorChange,
    instructors = [],
    isEditing,
}) => {
    if (!show) return null;

    return (
        <div className="ag-modal-overlay" onClick={onClose}>
            <div className="ag-modal" style={{ maxWidth: '900px' }} onClick={e => e.stopPropagation()}>
                {/* --- HEADER --- */}
                <div className="ag-modal-head">
                    <div className="ag-modal-title">
                        <div className="ag-avatar" style={{ background: 'linear-gradient(135deg, var(--hz-cyan), #0066FF)', width: '48px', height: '48px' }}>
                            <School size={24} color="#FFF" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'var(--hz-text-bright)' }}>
                                {isEditing ? 'تعديل بيانات الفصل' : 'إنشاء فصل دراسي جديد'}
                            </h3>
                            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--hz-text-muted)' }}>
                                التميز الأكاديمي يبدأ من تنظيم الفصول الدراسية
                            </p>
                        </div>
                    </div>
                    <button className="ag-btn-icon" onClick={onClose}><X size={20} /></button>
                </div>

                <form className="ag-modal-form" onSubmit={onSubmit}>
                    <div className="ag-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '24px' }}>

                        {/* 1. Basic Info */}
                        <div className="ag-section-title"><Layers size={16} /> البيانات الأساسية للتعريف</div>
                        <div className="ag-form-row cols-2" style={{ gap: '20px' }}>
                            <div className="ag-form-group">
                                <label className="ag-label">رمز الفصل الدراسي *</label>
                                <input
                                    required
                                    className="ag-input ltr"
                                    type="text"
                                    value={formData.code || ''}
                                    onChange={(e) => onChange('code', e.target.value)}
                                    placeholder="مثال: CS-2026-A"
                                />
                            </div>
                            <div className="ag-form-group">
                                <label className="ag-label">اسم الفصل الدراسي *</label>
                                <input
                                    required
                                    className="ag-input"
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={(e) => onChange('name', e.target.value)}
                                    placeholder="مثال: أساسيات الحاسب - المجموعة أ"
                                />
                            </div>
                        </div>

                        <div className="ag-form-group" style={{ marginTop: '16px' }}>
                            <label className="ag-label">البرنامج التعليمي المرتبط *</label>
                            <select
                                required
                                className="ag-select"
                                value={formData.programId}
                                onChange={(e) => onChange('programId', e.target.value)}
                            >
                                <option value="">-- اختر البرنامج الدراسي --</option>
                                {programs.map(p => (
                                    <option key={p.id} value={p.id}>{p.nameAr}</option>
                                ))}
                            </select>
                        </div>

                        {/* 2. Mode & Location */}
                        <div className="ag-section-title" style={{ marginTop: '24px' }}><MapPin size={16} /> النمط والمكان</div>
                        <div className="ag-form-row cols-2" style={{ gap: '20px' }}>
                            <div className="ag-form-group">
                                <label className="ag-label">نمط الدراسة</label>
                                <div style={{ display: 'flex', gap: '4px', background: 'var(--hz-surface-2)', padding: '4px', borderRadius: '10px' }}>
                                    {[
                                        { id: 'IN_PERSON', label: 'حضوري', icon: <Building size={14} /> },
                                        { id: 'ONLINE', label: 'أونلاين', icon: <Globe size={14} /> },
                                        { id: 'SELF_PACED', label: 'ذاتي', icon: <BookOpen size={14} /> }
                                    ].map(mode => (
                                        <button
                                            key={mode.id}
                                            type="button"
                                            className={formData.studyMode === mode.id ? 'active' : ''}
                                            onClick={() => onChange('studyMode', mode.id)}
                                            style={{
                                                flex: 1, padding: '8px', border: 'none', borderRadius: '7px',
                                                fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                background: formData.studyMode === mode.id ? 'var(--hz-cyan)' : 'transparent',
                                                color: formData.studyMode === mode.id ? '#000' : 'var(--hz-text-muted)',
                                                transition: 'all 0.2s',
                                                fontFamily: 'inherit'
                                            }}
                                        >
                                            {mode.icon} {mode.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="ag-form-group">
                                <label className="ag-label">لغة التدريس</label>
                                <select className="ag-input" value={formData.studyLanguage} onChange={(e) => onChange('studyLanguage', e.target.value)}>
                                    <option value="Arabic">اللغة العربية</option>
                                    <option value="English">English Language</option>
                                    <option value="Bilingual">ثنائية اللغة</option>
                                </select>
                            </div>
                        </div>

                        {formData.studyMode === 'IN_PERSON' && (
                            <div className="ag-form-row cols-2" style={{ marginTop: '16px', gap: '20px' }}>
                                <div className="ag-form-group">
                                    <label className="ag-label">رقم القاعة</label>
                                    <div style={{ position: 'relative' }}>
                                        <DoorOpen size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--hz-text-muted)' }} />
                                        <input className="ag-input" style={{ paddingRight: '40px' }} value={formData.classroom || ''} onChange={(e) => onChange('classroom', e.target.value)} placeholder="مثال: 102" />
                                    </div>
                                </div>
                                <div className="ag-form-group">
                                    <label className="ag-label">المبنى</label>
                                    <input className="ag-input" value={formData.building || ''} onChange={(e) => onChange('building', e.target.value)} placeholder="مثال: المبنى الرئيسي" />
                                </div>
                            </div>
                        )}

                        {formData.studyMode === 'ONLINE' && (
                            <div className="ag-form-group" style={{ marginTop: '16px' }}>
                                <label className="ag-label">رابط المحاضرات الافتراضي (Zoom/Teams)</label>
                                <input className="ag-input ltr" type="url" value={formData.defaultZoomLink || ''} onChange={(e) => onChange('defaultZoomLink', e.target.value)} placeholder="https://zoom.us/j/..." />
                            </div>
                        )}

                        {/* 3. Schedule & Duration */}
                        <div className="ag-section-title" style={{ marginTop: '24px' }}><Calendar size={16} /> الجدول الزمني</div>
                        <div className="ag-form-row cols-2" style={{ gap: '20px' }}>
                            <div className="ag-form-group">
                                <label className="ag-label">تاريخ البدء المتوقع *</label>
                                <input required className="ag-input" type="date" value={formData.startDate} onChange={(e) => onChange('startDate', e.target.value)} />
                            </div>
                            <div className="ag-form-group">
                                <label className="ag-label">المدة التقديرية (أشهر) *</label>
                                <input required className="ag-input" type="number" min="1" value={formData.durationMonths} onChange={(e) => onChange('durationMonths', parseInt(e.target.value))} />
                            </div>
                        </div>

                        {formData.studyMode !== 'SELF_PACED' && (
                            <>
                                <div className="ag-form-group" style={{ marginTop: '16px' }}>
                                    <label className="ag-label">أيام الدراسة الأسبوعية</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {weekDays.map(day => (
                                            <button
                                                key={day.en}
                                                type="button"
                                                onClick={() => toggleStudyDay(day.en)}
                                                style={{
                                                    padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--hz-border-soft)',
                                                    fontSize: '0.85rem', fontWeights: 700, cursor: 'pointer', transition: 'all 0.2s',
                                                    background: formData.studyDays?.includes(day.en) ? 'rgba(0, 212, 255, 0.1)' : 'var(--hz-surface-2)',
                                                    color: formData.studyDays?.includes(day.en) ? 'var(--hz-cyan)' : 'var(--hz-text-muted)',
                                                    borderColor: formData.studyDays?.includes(day.en) ? 'var(--hz-cyan)' : 'transparent',
                                                    fontFamily: 'inherit'
                                                }}
                                            >
                                                {day.ar}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="ag-form-row cols-2" style={{ marginTop: '16px', gap: '20px' }}>
                                    <div className="ag-form-group">
                                        <label className="ag-label">وقت بداية المحاضرة</label>
                                        <div style={{ position: 'relative' }}>
                                            <Clock size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--hz-text-muted)' }} />
                                            <input className="ag-input" style={{ paddingRight: '40px' }} type="time" value={formData.lectureStartTime || ''} onChange={(e) => onChange('lectureStartTime', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="ag-form-group">
                                        <label className="ag-label">وقت النهاية</label>
                                        <input className="ag-input" type="time" value={formData.lectureEndTime || ''} onChange={(e) => onChange('lectureEndTime', e.target.value)} />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="ag-form-group" style={{ marginTop: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <label className="ag-label">سعة الفصل القصوى (طلاب)</label>
                                <span style={{ color: 'var(--hz-cyan)', fontWeight: 900, fontSize: '0.9rem' }}>{formData.maxStudents} طالباً</span>
                            </div>
                            <input
                                type="range" min="5" max="150" step="5"
                                value={formData.maxStudents}
                                onChange={(e) => onChange('maxStudents', parseInt(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--hz-cyan)', height: '6px', cursor: 'pointer' }}
                            />
                        </div>

                        {/* 4. Units & Instructors */}
                        {formData.programId && (
                            <div style={{ marginTop: '32px' }}>
                                <div className="ag-section-title"><BookOpen size={16} /> الوحدات التعليمية وتوزيع المحاضرين</div>
                                <div style={{ background: 'var(--hz-surface-2)', borderRadius: '16px', padding: '12px', border: '1px solid var(--hz-border-soft)' }}>
                                    {(() => {
                                        const selectedProgram = programs.find(p => p.id === formData.programId);
                                        const units = selectedProgram?.programUnits?.map((pu: any) => pu.unit) || [];
                                        if (units.length === 0) return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--hz-text-dim)' }}>لا توجد وحدات تعليمية معرفة لهذا البرنامج</div>;

                                        return (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {units.map((unit: any) => {
                                                    const isSelected = formData.unitIds?.includes(unit.id);
                                                    const selection = formData.unitSelections?.find(us => us.unitId === unit.id);
                                                    const instructorId = formData.unitInstructors?.find(ui => ui.unitId === unit.id)?.instructorId || '';

                                                    return (
                                                        <div
                                                            key={unit.id}
                                                            onClick={() => toggleUnit && toggleUnit(unit.id)}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px',
                                                                background: isSelected ? 'rgba(255,255,255,0.03)' : 'transparent',
                                                                border: '1px solid',
                                                                borderColor: isSelected ? 'rgba(0, 212, 255, 0.2)' : 'transparent',
                                                                transition: 'all 0.2s', cursor: 'pointer'
                                                            }}
                                                        >
                                                            <div style={{
                                                                width: '24px', height: '24px', borderRadius: '6px', border: '2px solid var(--hz-border-soft)',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                background: isSelected ? 'var(--hz-cyan)' : 'transparent',
                                                                borderColor: isSelected ? 'var(--hz-cyan)' : 'var(--hz-border-soft)'
                                                            }}>
                                                                {isSelected && <Check size={14} color="#000" />}
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: isSelected ? 'var(--hz-text-bright)' : 'var(--hz-text-primary)' }}>{unit.nameAr}</div>
                                                                <div style={{ fontSize: '0.7rem', color: 'var(--hz-text-muted)' }}>{unit.code}</div>
                                                            </div>

                                                            {isSelected && (
                                                                <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--hz-void)', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--hz-border-soft)' }}>
                                                                        <input
                                                                            type="number"
                                                                            value={selection?.totalLectures || unit.totalLectures}
                                                                            onChange={e => onUnitLectureChange && onUnitLectureChange(unit.id, parseInt(e.target.value))}
                                                                            style={{ width: '40px', background: 'transparent', border: 'none', color: 'var(--hz-cyan)', fontWeight: 900, textAlign: 'center', outline: 'none' }}
                                                                        />
                                                                        <span style={{ fontSize: '0.65rem', color: 'var(--hz-text-muted)' }}>محاضرة</span>
                                                                    </div>
                                                                    <select
                                                                        className="ag-select"
                                                                        style={{ height: '32px', padding: '0 8px', fontSize: '0.75rem', width: '130px', border: instructorId ? '1px solid var(--hz-cyan)' : '1px solid var(--hz-border-soft)' }}
                                                                        value={instructorId}
                                                                        onChange={(e) => onUnitInstructorChange && onUnitInstructorChange(unit.id, e.target.value)}
                                                                    >
                                                                        <option value="">بدون محاضر</option>
                                                                        {instructors.map(inst => (
                                                                            <option key={inst.id} value={inst.id}>{inst.firstName} {inst.lastName}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="ag-modal-foot" style={{ padding: '16px 24px' }}>
                        <button type="button" className="ag-btn ag-btn-ghost" onClick={onClose}>إلغاء</button>
                        <button type="submit" className="ag-btn ag-btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--hz-cyan)', color: '#000' }}>
                            <ShieldCheck size={18} />
                            {isEditing ? 'حفظ التحديثات' : 'تأكيد إنشاء الفصل الدراسي'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
