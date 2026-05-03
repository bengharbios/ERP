import React, { useState, useEffect } from 'react';
import { Department } from '../services/hr.service';
import { settingsService } from '../services/settings.service';

interface EmployeeFormModalProps {
    show: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData: any;
    isEditing: boolean;
    loading: boolean;
    departments: Department[];
    shifts: any[];
    users: any[];
}

export default function EmployeeFormModal({
    show,
    onClose,
    onSubmit,
    initialData,
    isEditing,
    loading,
    departments = [],
    shifts = [],
    users = [],
}: EmployeeFormModalProps) {
    const [formData, setFormData] = useState<any>(initialData);
    const [activeTab, setActiveTab] = useState('personal');

    useEffect(() => {
        const fetchSettings = async () => {
            await settingsService.getSystemSettings();
            // We don't need to store it in state if it's unused, but the fetch is good to keep if needed later
        };
        if (show) fetchSettings();
    }, [show]);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const updateField = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleCommissionTierChange = (index: number, field: string, value: any) => {
        const tiers = [...(formData.commissionTiers || [])];
        tiers[index] = { ...tiers[index], [field]: value };
        updateField('commissionTiers', tiers);
    };

    const addCommissionTier = () => {
        const tiers = [...(formData.commissionTiers || [])];
        const nextNum = (tiers.length || 0) + 1;
        tiers.push({ targetNumber: nextNum, targetThreshold: 0, commissionAmount: 0 });
        updateField('commissionTiers', tiers);
    };

    const removeCommissionTier = (index: number) => {
        const tiers = [...(formData.commissionTiers || [])];
        tiers.splice(index, 1);
        const renumbered = tiers.map((t, i) => ({ ...t, targetNumber: i + 1 }));
        updateField('commissionTiers', renumbered);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const steps = [
        { id: 'personal', label: 'البيانات الشخصية والأساسية', icon: '👤' },
        { id: 'job', label: 'التفاصيل الوظيفية والتعاقد', icon: '💼' },
        { id: 'finance', label: 'الرواتب والعمولات', icon: '💰' },
        { id: 'docs', label: 'المستندات والأصول', icon: '📎' }
    ];

    const handleNext = () => {
        const currentIndex = steps.findIndex(s => s.id === activeTab);
        if (currentIndex < steps.length - 1) setActiveTab(steps[currentIndex + 1].id);
    };

    const handleBack = () => {
        const currentIndex = steps.findIndex(s => s.id === activeTab);
        if (currentIndex > 0) setActiveTab(steps[currentIndex - 1].id);
    };

    if (!show) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container premium-modal">
                <div className="modal-header">
                    <div className="header-content">
                        <h2>{isEditing ? 'تعديل بيانات موظف' : 'إضافة موظف جديد'}</h2>
                        <p>يرجى تعبئة سجل الموظف بدقة</p>
                    </div>
                    <button onClick={onClose} className="close-btn">×</button>
                </div>

                <div className="stepper-wrapper">
                    {steps.map((step, index) => {
                        const currentIndex = steps.findIndex(s => s.id === activeTab);
                        const isActive = step.id === activeTab;
                        const isCompleted = index < currentIndex;

                        return (
                            <div
                                key={step.id}
                                className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                                onClick={() => setActiveTab(step.id)}
                            >
                                <div className="step-circle">{isCompleted ? '✓' : step.icon}</div>
                                <span className="step-label">{step.label}</span>
                                {index < steps.length - 1 && <div className="step-line"></div>}
                            </div>
                        );
                    })}
                </div>

                <div className="modal-body-scroll">
                    <form onSubmit={handleSubmit} className="premium-form">

                        {/* PERSONAL INFO */}
                        {activeTab === 'personal' && (
                            <div className="step-content fade-in">
                                <h3 className="section-title">البيانات الشخصية</h3>
                                <div className="form-grid-responsive">
                                    <div className="form-group">
                                        <label>المستخدم المرتبط *</label>
                                        <select
                                            required
                                            disabled={isEditing}
                                            value={formData.userId}
                                            onChange={e => updateField('userId', e.target.value)}
                                            className="input-premium"
                                        >
                                            <option value="">-- اختر المستخدم --</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                                            ))}
                                            {isEditing && formData.user && (
                                                <option value={formData.userId}>{formData.user.firstName} {formData.user.lastName}</option>
                                            )}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>كود الموظف *</label>
                                        <input
                                            required
                                            value={formData.employeeCode}
                                            onChange={e => updateField('employeeCode', e.target.value)}
                                            className="input-premium"
                                            placeholder="EMP-001"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>رقم البصمة (جهاز Hikvision)</label>
                                        <input
                                            value={formData.biometricId || ''}
                                            onChange={e => updateField('biometricId', e.target.value)}
                                            className="input-premium"
                                            placeholder="مثلاً: 101"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>الجنسية</label>
                                        <input
                                            value={formData.nationality}
                                            onChange={e => updateField('nationality', e.target.value)}
                                            className="input-premium"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>الجنس</label>
                                        <select
                                            value={formData.gender || 'male'}
                                            onChange={e => updateField('gender', e.target.value)}
                                            className="input-premium"
                                        >
                                            <option value="male">ذكر</option>
                                            <option value="female">أنثى</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>تاريخ الميلاد</label>
                                        <input
                                            type="date"
                                            value={formData.dateOfBirth}
                                            onChange={e => updateField('dateOfBirth', e.target.value)}
                                            className="input-premium"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>الحالة الاجتماعية</label>
                                        <select
                                            value={formData.maritalStatus || 'single'}
                                            onChange={e => updateField('maritalStatus', e.target.value)}
                                            className="input-premium"
                                        >
                                            <option value="single">أعزب</option>
                                            <option value="married">متزوج</option>
                                            <option value="divorced">مطلق</option>
                                            <option value="widowed">أرمل</option>
                                        </select>
                                    </div>
                                </div>

                                <h3 className="section-title mt-2">بيانات الهوية</h3>
                                <div className="form-grid-responsive">
                                    <div className="form-group">
                                        <label>رقم الهوية الوطنية</label>
                                        <input
                                            value={formData.nationalId}
                                            onChange={e => updateField('nationalId', e.target.value)}
                                            className="input-premium"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>تاريخ انتهاء الهوية</label>
                                        <input
                                            type="date"
                                            value={formData.idExpiry}
                                            onChange={e => updateField('idExpiry', e.target.value)}
                                            className="input-premium"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>رقم جواز السفر</label>
                                        <input
                                            value={formData.passportNumber}
                                            onChange={e => updateField('passportNumber', e.target.value)}
                                            className="input-premium"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>انتهاء جواز السفر</label>
                                        <input
                                            type="date"
                                            value={formData.passportExpiry}
                                            onChange={e => updateField('passportExpiry', e.target.value)}
                                            className="input-premium"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* JOB DETAILS */}
                        {activeTab === 'job' && (
                            <div className="step-content fade-in">
                                <h3 className="section-title">التفاصيل الوظيفية</h3>
                                <div className="form-grid-responsive">
                                    <div className="form-group">
                                        <label>القسم *</label>
                                        <select
                                            required
                                            value={formData.departmentId}
                                            onChange={e => updateField('departmentId', e.target.value)}
                                            className="input-premium"
                                        >
                                            <option value="">-- اختر القسم --</option>
                                            {departments.map(d => (
                                                <option key={d.id} value={d.id}>{d.nameAr}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>المناوبة (الدوام) *</label>
                                        <select
                                            required
                                            value={formData.shiftId || ''}
                                            onChange={e => updateField('shiftId', e.target.value)}
                                            className="input-premium"
                                        >
                                            <option value="">-- اختر المناوبة --</option>
                                            {shifts.map(s => (
                                                <option key={s.id} value={s.id}>{s.nameAr} ({s.startTime} - {s.endTime})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>المسمى الوظيفي (Ar) *</label>
                                        <input
                                            required
                                            value={formData.jobTitleAr}
                                            onChange={e => updateField('jobTitleAr', e.target.value)}
                                            className="input-premium"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>المسمى الوظيفي (En)</label>
                                        <input
                                            value={formData.jobTitleEn}
                                            onChange={e => updateField('jobTitleEn', e.target.value)}
                                            className="input-premium"
                                            style={{ direction: 'ltr' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>نوع العقد</label>
                                        <select
                                            value={formData.contractType || 'full_time'}
                                            onChange={e => updateField('contractType', e.target.value)}
                                            className="input-premium"
                                        >
                                            <option value="full_time">دوام كامل</option>
                                            <option value="part_time">دوام جزئي</option>
                                            <option value="contractor">متعاقد</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>تاريخ التعيين</label>
                                        <input
                                            type="date"
                                            value={formData.hiringDate}
                                            onChange={e => updateField('hiringDate', e.target.value)}
                                            className="input-premium"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>تاريخ المباشرة</label>
                                        <input
                                            type="date"
                                            value={formData.joiningDate}
                                            onChange={e => updateField('joiningDate', e.target.value)}
                                            className="input-premium"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>حالة الموظف (المعايير العالمية)</label>
                                        <select
                                            value={formData.status || 'active'}
                                            onChange={e => updateField('status', e.target.value)}
                                            className="input-premium"
                                        >
                                            <option value="active">نشط (على رأس العمل)</option>
                                            <option value="resigned">مستقيل</option>
                                            <option value="terminated">مفصول / نهاية عقد</option>
                                            <option value="deceased">متوفى</option>
                                            <option value="suspended">موقوف عن العمل</option>
                                            <option value="inactive">غير نشط (ملغى)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>تاريخ تغير الحالة</label>
                                        <input
                                            type="date"
                                            value={formData.statusChangeDate}
                                            onChange={e => updateField('statusChangeDate', e.target.value)}
                                            className="input-premium"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>آخر يوم عمل (تاريخ التوقف)</label>
                                        <input
                                            type="date"
                                            value={formData.lastWorkingDate}
                                            onChange={e => updateField('lastWorkingDate', e.target.value)}
                                            className="input-premium"
                                        />
                                    </div>
                                </div>

                                <h3 className="section-title mt-2">بيانات الاتصال للطوارئ</h3>
                                <div className="form-grid-responsive">
                                    <div className="form-group">
                                        <label>اسم جهة الاتصال</label>
                                        <input
                                            value={formData.emergencyContactName}
                                            onChange={e => updateField('emergencyContactName', e.target.value)}
                                            className="input-premium"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>رقم الهاتف</label>
                                        <input
                                            value={formData.emergencyContactPhone}
                                            onChange={e => updateField('emergencyContactPhone', e.target.value)}
                                            className="input-premium"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>صلة القرابة</label>
                                        <input
                                            value={formData.emergencyContactRelation}
                                            onChange={e => updateField('emergencyContactRelation', e.target.value)}
                                            className="input-premium"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* FINANCE & COMMISSION */}
                        {activeTab === 'finance' && (
                            <div className="step-content fade-in">
                                <h3 className="section-title">إعدادات الراتب والمالية</h3>
                                <div className="form-grid-responsive">
                                    <div className="form-group">
                                        <label>نظام الراتب</label>
                                        <select
                                            value={formData.salaryType || 'FIXED'}
                                            onChange={e => {
                                                const newType = e.target.value;
                                                updateField('salaryType', newType);
                                                // Reset salary if type is Commission Only or Hourly
                                                if (newType === 'COMMISSION_ONLY' || newType === 'HOURLY') {
                                                    updateField('salary', 0);
                                                }
                                            }}
                                            className="input-premium"
                                        >
                                            <option value="FIXED">راتب ثابت</option>
                                            <option value="SALARY_COMMISSION">تمويل + عمولة</option>
                                            <option value="COMMISSION_ONLY">عمولة فقط</option>
                                            <option value="HOURLY">بنظام الساعة</option>
                                        </select>
                                    </div>

                                    {/* HOURLY RATE INPUT */}
                                    {formData.salaryType === 'HOURLY' && (
                                        <div className="form-group" style={{ background: '#E6FFFA', padding: '10px', borderRadius: '8px', border: '1px solid #B2F5EA' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                <div>
                                                    <label style={{ color: '#2C7A7B', fontWeight: 'bold' }}>سعر الوحدة (Rate)</label>
                                                    <input
                                                        type="number"
                                                        value={formData.hourlyRate || 0}
                                                        onChange={e => updateField('hourlyRate', Number(e.target.value))}
                                                        className="input-premium"
                                                        placeholder="المبلغ..."
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ color: '#2C7A7B', fontWeight: 'bold' }}>لكل (عدد ساعات)</label>
                                                    <input
                                                        type="number"
                                                        value={formData.hourlyUnit || 1}
                                                        onChange={e => updateField('hourlyUnit', Number(e.target.value))}
                                                        className="input-premium"
                                                        placeholder="1 = ساعة واحدة"
                                                        min="1"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <small style={{ display: 'block', marginTop: '5px', color: '#285E61' }}>
                                                مثال: {formData.hourlyRate || 0} لكل {formData.hourlyUnit || 1} ساعة.
                                            </small>
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label>{formData.salaryType === 'HOURLY' ? 'إجمالي الراتب (تقديري)' : 'الراتب الأساسي'}</label>
                                        <input
                                            type="number"
                                            value={formData.salary}
                                            onChange={e => updateField('salary', Number(e.target.value))}
                                            className="input-premium"
                                            disabled={formData.salaryType === 'HOURLY' || formData.salaryType === 'COMMISSION_ONLY'}
                                            placeholder={formData.salaryType === 'HOURLY' ? 'يتم حسابه عند المعالجة' : 'الراتب الشهري'}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>بدل السكن</label>
                                        <input
                                            type="number"
                                            value={formData.housingAllowance}
                                            onChange={e => updateField('housingAllowance', Number(e.target.value))}
                                            className="input-premium"
                                            disabled={formData.salaryType === 'COMMISSION_ONLY'}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>بدل المواصلات</label>
                                        <input
                                            type="number"
                                            value={formData.transportAllowance}
                                            onChange={e => updateField('transportAllowance', Number(e.target.value))}
                                            className="input-premium"
                                            disabled={formData.salaryType === 'COMMISSION_ONLY'}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>بدلات أخرى</label>
                                        <input
                                            type="number"
                                            value={formData.otherAllowances}
                                            onChange={e => updateField('otherAllowances', Number(e.target.value))}
                                            className="input-premium"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>إجمالي الاستقطاعات</label>
                                        <input
                                            type="number"
                                            value={formData.totalDeductions}
                                            onChange={e => updateField('totalDeductions', Number(e.target.value))}
                                            className="input-premium"
                                        />
                                    </div>
                                </div>

                                {(formData.salaryType === 'SALARY_COMMISSION' || formData.salaryType === 'COMMISSION_ONLY') && (
                                    <>
                                        <h3 className="section-title mt-2">نظام العمولات والمستهدف</h3>
                                        <div className="form-grid-responsive">
                                            <div className="form-group">
                                                <label>نوع الترجيت (المستهدف)</label>
                                                <select
                                                    value={formData.targetType || 'TRANSACTIONS'}
                                                    onChange={e => updateField('targetType', e.target.value)}
                                                    className="input-premium"
                                                >
                                                    <option value="TRANSACTIONS">عدد المعاملات (طلاب)</option>
                                                    <option value="AMOUNT">إجمالي المبالغ</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>منطق العمولة</label>
                                                <select
                                                    value={formData.commissionLogic || 'POSITIVE'}
                                                    onChange={e => updateField('commissionLogic', e.target.value)}
                                                    className="input-premium"
                                                >
                                                    <option value="POSITIVE">إيجابي (عمولة فوق الراتب)</option>
                                                    <option value="NEGATIVE">سلبي (خصم من الراتب إذا لم يتم الترجيت)</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>المستهدف (الرقم الكلي)</label>
                                                <input
                                                    type="number"
                                                    value={formData.targetValue}
                                                    onChange={e => updateField('targetValue', Number(e.target.value))}
                                                    className="input-premium"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>الحد الأدنى للراتب (Floor)</label>
                                                <input
                                                    type="number"
                                                    value={formData.minimumSalaryFloor}
                                                    onChange={e => updateField('minimumSalaryFloor', Number(e.target.value))}
                                                    className="input-premium"
                                                    placeholder="في حالة المنطق السلبي"
                                                />
                                            </div>
                                        </div>

                                        <div className="commission-tiers-section mt-1">
                                            <div className="flex-between">
                                                <label className="section-subtitle">شرائح العمولات</label>
                                                <button type="button" onClick={addCommissionTier} className="btn-add-mini">+ إضافة شريحة</button>
                                            </div>
                                            <div className="tiers-grid">
                                                {(formData.commissionTiers || []).map((tier: any, index: number) => (
                                                    <div key={index} className="tier-row card-premium-mini">
                                                        <span className="tier-num">#{tier.targetNumber}</span>
                                                        <div className="form-group">
                                                            <label>العتبة (Threshold)</label>
                                                            <input
                                                                type="number"
                                                                value={tier.targetThreshold}
                                                                onChange={e => handleCommissionTierChange(index, 'targetThreshold', Number(e.target.value))}
                                                                className="input-mini"
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>مبلغ العمولة</label>
                                                            <input
                                                                type="number"
                                                                value={tier.commissionAmount}
                                                                onChange={e => handleCommissionTierChange(index, 'commissionAmount', Number(e.target.value))}
                                                                className="input-mini"
                                                            />
                                                        </div>
                                                        <button type="button" onClick={() => removeCommissionTier(index)} className="btn-remove-mini">×</button>
                                                    </div>
                                                ))}
                                                {(formData.commissionTiers?.length || 0) === 0 && (
                                                    <p className="empty-hint text-center">لم يتم تحديد شرائح عمولات (سيتم استخدام عمولة عامة إذا وجدت)</p>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* DOCUMENTS & ASSETS */}
                        {activeTab === 'docs' && (
                            <div className="step-content fade-in">
                                <h3 className="section-title">المستندات والأصول</h3>
                                <div className="alert-info-premium mb-2">
                                    <span className="icon">ℹ️</span>
                                    <p>يمكنك حالياً إضافة بيانات المستندات والأصول، وسيتم تفعيل رفع الملفات الفعلي في الإصدار القادم.</p>
                                </div>

                                <div className="flex-between mb-1">
                                    <h4 className="section-subtitle">المستندات القانونية</h4>
                                    <button type="button" onClick={() => updateField('documents', [...(formData.documents || []), { title: '', docType: 'identity', expiryDate: '' }])} className="btn-add-mini">+ مستند جديد</button>
                                </div>
                                <div className="docs-list">
                                    {(formData.documents || []).map((doc: any, idx: number) => (
                                        <div key={idx} className="doc-item card-premium-mini">
                                            <div className="form-grid-compact">
                                                <input placeholder="عنوان المستند" value={doc.title} onChange={e => {
                                                    const docs = [...formData.documents];
                                                    docs[idx].title = e.target.value;
                                                    updateField('documents', docs);
                                                }} className="input-mini" />
                                                <select value={doc.docType} onChange={e => {
                                                    const docs = [...formData.documents];
                                                    docs[idx].docType = e.target.value;
                                                    updateField('documents', docs);
                                                }} className="input-mini">
                                                    <option value="identity">هوية</option>
                                                    <option value="passport">جواز سفر</option>
                                                    <option value="contract">عقد عمل</option>
                                                    <option value="viz">فيزا / إقامة</option>
                                                </select>
                                                <input type="date" value={doc.expiryDate} onChange={e => {
                                                    const docs = [...formData.documents];
                                                    docs[idx].expiryDate = e.target.value;
                                                    updateField('documents', docs);
                                                }} className="input-mini" />
                                            </div>
                                            <button type="button" onClick={() => {
                                                const docs = [...formData.documents]; docs.splice(idx, 1); updateField('documents', docs);
                                            }} className="btn-remove-mini">×</button>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex-between mt-2 mb-1">
                                    <h4 className="section-subtitle">الأصول العينية (Assets)</h4>
                                    <button type="button" onClick={() => updateField('assets', [...(formData.assets || []), { assetName: '', category: 'electronics', status: 'assigned', assignmentDate: new Date().toISOString().split('T')[0] }])} className="btn-add-mini">+ أصل جديد</button>
                                </div>
                                <div className="assets-list">
                                    {(formData.assets || []).map((asset: any, idx: number) => (
                                        <div key={idx} className="asset-item card-premium-mini">
                                            <div className="form-grid-compact">
                                                <input placeholder="اسم الأصل" value={asset.assetName} onChange={e => {
                                                    const assets = [...formData.assets]; assets[idx].assetName = e.target.value; updateField('assets', assets);
                                                }} className="input-mini" />
                                                <select value={asset.status} onChange={e => {
                                                    const assets = [...formData.assets]; assets[idx].status = e.target.value; updateField('assets', assets);
                                                }} className="input-mini">
                                                    <option value="assigned">مسلم</option>
                                                    <option value="returned">مسترجع</option>
                                                    <option value="damaged">تالف</option>
                                                </select>
                                                <input type="date" value={asset.assignmentDate} onChange={e => {
                                                    const assets = [...formData.assets]; assets[idx].assignmentDate = e.target.value; updateField('assets', assets);
                                                }} className="input-mini" />
                                            </div>
                                            <button type="button" onClick={() => {
                                                const assets = [...formData.assets]; assets.splice(idx, 1); updateField('assets', assets);
                                            }} className="btn-remove-mini">×</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="modal-footer-premium">
                            <button type="button" onClick={activeTab === 'personal' ? onClose : handleBack} className="btn-secondary-premium">
                                {activeTab === 'personal' ? 'إلغاء' : 'السابق'}
                            </button>
                            {activeTab !== 'docs' ? (
                                <button type="button" onClick={handleNext} className="btn-primary-premium">التالي</button>
                            ) : (
                                <button type="submit" className="btn-success-premium" disabled={loading}>
                                    {loading ? 'جاري الحفظ...' : 'حفظ بيانات الموظف'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
                .modal-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
                    display: flex; justify-content: center; align-items: center; z-index: 99999;
                    padding: 1rem;
                }
                .premium-modal {
                    background: #fff; width: 100%; max-width: 950px;
                    border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
                    display: flex; flex-direction: column; max-height: 95vh;
                    animation: slideUp 0.3s ease-out;
                    overflow: hidden;
                }
                .modal-header {
                    padding: 1.5rem 2rem; border-bottom: 1px solid #EDF2F7;
                    display: flex; justify-content: space-between; align-items: flex-start;
                    background: #FAFAFA;
                }
                .header-content h2 { margin: 0; font-size: 1.5rem; font-weight: 800; color: #1a202c; }
                .header-content p { margin: 0.25rem 0 0; color: #718096; font-size: 0.9rem; }
                .close-btn { background: none; border: none; font-size: 2rem; color: #A0AEC0; cursor: pointer; line-height: 0.5; }
                .close-btn:hover { color: #E53E3E; }

                .stepper-wrapper {
                    display: flex; padding: 1.5rem 2rem; background: #fff; border-bottom: 1px solid #EDF2F7;
                    justify-content: space-between; position: relative;
                }
                .step-item {
                    display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
                    position: relative; z-index: 2; cursor: pointer; flex: 1;
                }
                .step-circle {
                    width: 36px; height: 36px; border-radius: 50%; background: #EDF2F7;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1.1rem; color: #A0AEC0; transition: all 0.3s;
                    border: 2px solid #fff; box-shadow: 0 0 0 2px #EDF2F7;
                }
                .step-item.active .step-circle {
                    background: #DD6B20; color: #fff; box-shadow: 0 0 0 2px #DD6B20;
                }
                .step-item.completed .step-circle {
                    background: #38A169; color: #fff; box-shadow: 0 0 0 2px #38A169;
                }
                .step-label { font-size: 0.75rem; font-weight: 700; color: #A0AEC0; white-space: nowrap; }
                .step-item.active .step-label { color: #DD6B20; }
                .step-line {
                    position: absolute; top: 18px; left: -50%; width: 100%; height: 2px;
                    background: #EDF2F7; z-index: -1;
                }
                .step-item:first-child .step-line { display: none; }
                .step-item.completed .step-line, .step-item.active .step-line { background: #38A169; }

                .modal-body-scroll {
                    overflow-y: auto; padding: 2rem; flex: 1;
                }
                .section-title {
                    font-size: 1.1rem; font-weight: 800; color: #2D3748;
                    margin-bottom: 1.5rem; padding-bottom: 0.5rem;
                    border-bottom: 2px solid #EDF2F7; position: relative;
                }
                .section-title::after {
                    content: ''; position: absolute; bottom: -2px; right: 0;
                    width: 60px; height: 2px; background: #DD6B20;
                }
                .mt-2 { margin-top: 2rem; }
                .form-grid-responsive {
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 1.25rem;
                }
                .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
                .form-group label { font-size: 0.85rem; font-weight: 700; color: #4A5568; }
                .input-premium {
                    height: 44px; padding: 0 1rem; border-radius: 10px;
                    border: 1.5px solid #E2E8F0; background: #F8FAFC;
                    font-size: 0.95rem; transition: all 0.2s;
                }
                .input-premium:focus {
                    outline: none; border-color: #DD6B20; background: #fff;
                    box-shadow: 0 0 0 3px rgba(221, 107, 32, 0.1);
                }
                select.input-premium { appearance: none; background-image: url("data:image/svg+xml,..."); }
                
                .card-premium-mini {
                    background: #F8FAFC; border: 1px solid #EDF2F7; padding: 1rem;
                    border-radius: 12px; margin-bottom: 0.75rem;
                }
                .flex-between { display: flex; justify-content: space-between; align-items: center; }
                .btn-add-mini {
                    background: #DD6B20; color: #fff; border: none; padding: 0.4rem 1rem;
                    border-radius: 8px; font-weight: 700; font-size: 0.8rem; cursor: pointer;
                }
                .input-mini {
                    height: 38px; border-radius: 8px; border: 1px solid #E2E8F0;
                    padding: 0 0.75rem; font-size: 0.85rem;
                }
                .tier-row { display: grid; grid-template-columns: auto 1fr 1fr auto; gap: 1rem; align-items: center; }
                .btn-remove-mini {
                    background: #FED7D7; color: #C53030; border: none; width: 30px; height: 30px;
                    border-radius: 50%; cursor: pointer; font-weight: 800;
                }

                .modal-footer-premium {
                    display: flex; justify-content: space-between; padding: 1.5rem 2rem;
                    background: #FAFAFA; border-top: 1px solid #EDF2F7; gap: 1rem;
                }
                .btn-secondary-premium {
                    padding: 0.75rem 2rem; border-radius: 10px; background: #EDF2F7;
                    color: #4A5568; font-weight: 700; border: none; cursor: pointer;
                }
                .btn-primary-premium {
                    padding: 0.75rem 2.5rem; border-radius: 10px;
                    background: linear-gradient(135deg, #DD6B20 0%, #ED8936 100%);
                    color: #fff; font-weight: 700; border: none; cursor: pointer;
                    box-shadow: 0 4px 6px rgba(221, 107, 32, 0.2);
                }
                .btn-success-premium {
                    padding: 0.75rem 2.5rem; border-radius: 10px;
                    background: linear-gradient(135deg, #38A169 0%, #48BB78 100%);
                    color: #fff; font-weight: 700; border: none; cursor: pointer;
                    box-shadow: 0 4px 6px rgba(56, 161, 105, 0.2);
                }

                .alert-info-premium {
                    background: #EBF8FF; color: #2C5282; padding: 1rem;
                    border-radius: 12px; display: flex; gap: 1rem; align-items: center;
                    border: 1px solid #BEE3F8;
                }
                .section-subtitle { font-size: 0.95rem; font-weight: 800; color: #4A5568; margin-bottom: 0.5rem; display: block; }
                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
