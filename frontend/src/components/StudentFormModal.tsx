import React, { useState, useEffect } from 'react';
import { CreateStudentInput } from '../services/student.service';
import { settingsService, SystemSettings } from '../services/settings.service';
import { COUNTRIES } from '../utils/countries';
import {
    User, GraduationCap, CreditCard, Banknote,
    Calendar, Eye, Check, X, Phone,
    Hash, ShieldCheck, ChevronLeft,
    Globe, Lock, Info
} from 'lucide-react';

interface StudentFormModalProps {
    show: boolean;
    onClose: () => void;
    onSubmit: (data: CreateStudentInput) => void;
    initialData: CreateStudentInput;
    isEditing: boolean;
    loading: boolean;
    programs?: any[];
    classes?: any[];
}

export default function StudentFormModal({
    show, onClose, onSubmit, initialData,
    isEditing, loading, programs = [], classes = [],
}: StudentFormModalProps) {
    const [formData, setFormData] = useState<CreateStudentInput>(initialData);
    const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
    const [activeTab, setActiveTab] = useState('main');

    useEffect(() => {
        const fetchSettings = async () => {
            const response = await settingsService.getSystemSettings();
            if (response.success && response.data) {
                setSystemSettings(response.data.settings);
            }
        };
        if (show) fetchSettings();
    }, [show]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                // Ensure defaults for logic
                includeRegistrationInInstallments: initialData.includeRegistrationInInstallments ?? true,
                isTaxExempt: initialData.isTaxExempt ?? false,
                discountType: initialData.discountType ?? 'fixed',
                gender: initialData.gender || 'male',
                status: initialData.status || 'active'
            });
        }
    }, [initialData]);

    const updateField = (field: keyof CreateStudentInput, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const sanitize = (val: any) => (val === '' || val === null ? undefined : val);

        const payload: CreateStudentInput = {
            ...formData,
            // Basic Info
            email: sanitize(formData.email),
            phone: sanitize(formData.phone),
            phone2: sanitize(formData.phone2),
            address: sanitize(formData.address),
            city: sanitize(formData.city),
            country: sanitize(formData.country),
            nationalId: sanitize(formData.nationalId),
            passportNumber: sanitize(formData.passportNumber),
            passportExpiryDate: sanitize(formData.passportExpiryDate),
            dateOfBirth: sanitize(formData.dateOfBirth),

            // Academic Info
            specialization: sanitize(formData.specialization),
            certificateName: sanitize(formData.certificateName),
            registrationNumberPearson: sanitize(formData.registrationNumberPearson),
            enrolmentNumberAlsalam: sanitize(formData.enrolmentNumberAlsalam),
            platformUsername: sanitize(formData.platformUsername),
            platformPassword: sanitize(formData.platformPassword),
            admissionDate: sanitize(formData.admissionDate) || sanitize(formData.enrollmentDate), // Map to both for backend
            enrollmentDate: sanitize(formData.enrollmentDate),
            registrationDateAlsalam: sanitize(formData.registrationDateAlsalam),

            // Financial Info
            tuitionFee: formData.tuitionFee ? Number(formData.tuitionFee) : undefined,
            registrationFee: formData.registrationFee ? Number(formData.registrationFee) : undefined,
            initialPayment: formData.initialPayment ? Number(formData.initialPayment) : undefined,
            installmentCount: formData.installmentCount ? parseInt(String(formData.installmentCount)) : undefined,
            discountValue: formData.discountValue ? Number(formData.discountValue) : undefined,
            includeRegistrationInInstallments: formData.includeRegistrationInInstallments,
            registrationFeeDate: sanitize(formData.registrationFeeDate),
            isTaxExempt: formData.isTaxExempt,
        };

        // Frontend Validation
        if (!formData.firstNameAr || formData.firstNameAr.trim().length < 2) {
            alert('❌ الاسم الأول (عربي) مطلوب ويجب أن يكون حرفين على الأقل');
            return;
        }
        if (!formData.lastNameAr || formData.lastNameAr.trim().length < 2) {
            alert('❌ الاسم الأخير (عربي) مطلوب ويجب أن يكون حرفين على الأقل');
            return;
        }
        if (!formData.firstNameEn || formData.firstNameEn.trim().length < 2) {
            alert('❌ الاسم الأول (إنجليزي) مطلوب ويجب أن يكون حرفين على الأقل');
            return;
        }
        if (!formData.lastNameEn || formData.lastNameEn.trim().length < 2) {
            alert('❌ الاسم الأخير (إنجليزي) مطلوب ويجب أن يكون حرفين على الأقل');
            return;
        }

        onSubmit(payload);
    };

    const tabs = [
        { id: 'main', label: 'الشخصية والاتصال', icon: <User size={16} /> },
        { id: 'academic', label: 'الأكاديمية والوثائق', icon: <GraduationCap size={16} /> },
        { id: 'finance', label: 'المالية والأقساط', icon: <CreditCard size={16} /> }
    ];

    if (!show) return null;

    // Financial Calculation Helpers (Matches Backend Logic)
    const calcSummary = () => {
        const t = Number(formData.tuitionFee) || 0;
        const r = Number(formData.registrationFee) || 0;
        const i = Number(formData.initialPayment) || 0;
        const dVal = Number(formData.discountValue) || 0;

        // 1. Discount only on Tuition
        const discount = formData.discountType === 'percentage' ? t * (dVal / 100) : dVal;
        const netTuition = Math.max(0, t - discount);

        // 2. Tax Calculation
        const isTaxEnabled = systemSettings?.taxEnabled || false;
        const isExempt = formData.isTaxExempt || false;
        const taxRate = (isTaxEnabled && !isExempt) ? (Number(systemSettings?.taxRate) || 15) / 100 : 0;

        const taxableAmount = netTuition + r;
        const taxAmount = taxableAmount * taxRate;
        const totalAmount = taxableAmount + taxAmount;
        const balance = Math.max(0, totalAmount - i);

        // Installment Details
        const includeReg = formData.includeRegistrationInInstallments !== false;
        const regTotalWithTax = r * (1 + taxRate);
        const tuitionTotalWithTax = netTuition * (1 + taxRate);

        const instCount = Number(formData.installmentCount) || 1;

        return {
            t, r, i, discount, taxAmount, totalAmount, balance,
            regTotalWithTax, tuitionTotalWithTax, includeReg, instCount
        };
    };

    const summary = calcSummary();

    return (
        <div className="ag-modal-overlay">
            <div className="ag-modal" style={{ maxWidth: '1000px' }}>
                {/* Header */}
                <div className="ag-modal-head">
                    <div className="ag-modal-title">
                        <User size={20} color="var(--hz-cyan)" />
                        <div>
                            <h3>{isEditing ? 'تعديل بيانات الطالب كاملة' : 'تسجيل طالب جديد'}</h3>
                        </div>
                    </div>
                    <button onClick={onClose} className="ag-btn-icon"><X size={20} /></button>
                </div>

                {/* Stepper */}
                <div className="ag-stepper">
                    {tabs.map((tab, idx) => {
                        const active = activeTab === tab.id;
                        const completed = tabs.findIndex(t => t.id === activeTab) > idx;
                        return (
                            <div key={tab.id} className={`ag-step ${active ? 'active' : ''} ${completed ? 'completed' : ''}`} onClick={() => setActiveTab(tab.id)}>
                                <div className="ag-step-icon">
                                    {completed ? <Check size={14} /> : tab.icon}
                                </div>
                                <span className="ag-step-label">{tab.label}</span>
                            </div>
                        );
                    })}
                </div>

                <form className="ag-modal-form" onSubmit={handleSubmit}>
                    <div className="ag-modal-body">

                        {/* 1. PERSONAL & CONTACT */}
                        {activeTab === 'main' && (
                            <div className="fade-in">
                                <div className="ag-section-title"><User size={16} /> الأسماء والبيانات الأساسية</div>
                                <div className="ag-form-row cols-4">
                                    <div className="ag-form-group">
                                        <label className="ag-label">الاسم الأول (عربي) *</label>
                                        <input required value={formData.firstNameAr} onChange={e => updateField('firstNameAr', e.target.value)} className="ag-input" />
                                    </div>
                                    <div className="ag-form-group">
                                        <label className="ag-label">الاسم الثاني</label>
                                        <input value={formData.secondNameAr || ''} onChange={e => updateField('secondNameAr', e.target.value)} className="ag-input" />
                                    </div>
                                    <div className="ag-form-group">
                                        <label className="ag-label">الاسم الثالث</label>
                                        <input value={formData.thirdNameAr || ''} onChange={e => updateField('thirdNameAr', e.target.value)} className="ag-input" />
                                    </div>
                                    <div className="ag-form-group">
                                        <label className="ag-label">العائلة (عربي) *</label>
                                        <input required value={formData.lastNameAr} onChange={e => updateField('lastNameAr', e.target.value)} className="ag-input" />
                                    </div>
                                </div>
                                <div className="ag-form-row cols-2">
                                    <div className="ag-form-group">
                                        <label className="ag-label">First Name (English) *</label>
                                        <input required value={formData.firstNameEn} onChange={e => updateField('firstNameEn', e.target.value)} className="ag-input ltr" />
                                    </div>
                                    <div className="ag-form-group">
                                        <label className="ag-label">Last Name (English) *</label>
                                        <input required value={formData.lastNameEn} onChange={e => updateField('lastNameEn', e.target.value)} className="ag-input ltr" />
                                    </div>
                                </div>

                                <div className="ag-section-title" style={{ marginTop: '20px' }}><Hash size={16} /> الهوية والميلاد</div>
                                <div className="ag-form-row cols-3">
                                    <div className="ag-form-group">
                                        <label className="ag-label">رقم الهوية / الإقامة</label>
                                        <input value={formData.nationalId || ''} onChange={e => updateField('nationalId', e.target.value)} className="ag-input" />
                                    </div>
                                    <div className="ag-form-group">
                                        <label className="ag-label">تاريخ الميلاد</label>
                                        <input type="date" value={formData.dateOfBirth ? (typeof formData.dateOfBirth === 'string' ? formData.dateOfBirth.split('T')[0] : (formData.dateOfBirth as any).toISOString().split('T')[0]) : ''} onChange={e => updateField('dateOfBirth', e.target.value)} className="ag-input" />
                                    </div>
                                    <div className="ag-form-row cols-2" style={{ gap: '10px', marginBottom: 0 }}>
                                        <div className="ag-form-group">
                                            <label className="ag-label">الجنس</label>
                                            <select value={formData.gender || 'male'} onChange={e => updateField('gender', e.target.value)} className="ag-input">
                                                <option value="male">ذكر</option>
                                                <option value="female">أنثى</option>
                                            </select>
                                        </div>
                                        <div className="ag-form-group">
                                            <label className="ag-label">الجنسية</label>
                                            <select value={formData.nationality || ''} onChange={e => updateField('nationality', e.target.value)} className="ag-input">
                                                <option value="">اختر الدولة</option>
                                                {COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="ag-section-title" style={{ marginTop: '20px' }}><Phone size={16} /> معلومات التواصل</div>
                                <div className="ag-form-row cols-3">
                                    <div className="ag-form-group">
                                        <label className="ag-label">رقم الجوال الأساسي *</label>
                                        <input required value={formData.phone || ''} onChange={e => updateField('phone', e.target.value)} className="ag-input ltr" />
                                    </div>
                                    <div className="ag-form-group">
                                        <label className="ag-label">رقم الجوال البديل</label>
                                        <input value={formData.phone2 || ''} onChange={e => updateField('phone2', e.target.value)} className="ag-input ltr" />
                                    </div>
                                    <div className="ag-form-group">
                                        <label className="ag-label">البريد الإلكتروني</label>
                                        <input type="email" value={formData.email || ''} onChange={e => updateField('email', e.target.value)} className="ag-input ltr" />
                                    </div>
                                </div>
                                <div className="ag-form-row cols-3" style={{ marginTop: '10px' }}>
                                    <div className="ag-form-group span-2">
                                        <label className="ag-label">العنوان بالتفصيل</label>
                                        <input value={formData.address || ''} onChange={e => updateField('address', e.target.value)} className="ag-input" />
                                    </div>
                                    <div className="ag-form-group">
                                        <label className="ag-label">المدينة</label>
                                        <input value={formData.city || ''} onChange={e => updateField('city', e.target.value)} className="ag-input" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. ACADEMIC & DOCUMENTS */}
                        {activeTab === 'academic' && (
                            <div className="fade-in">
                                <div className="ag-section-title"><GraduationCap size={16} /> التوزيع الأكاديمي</div>
                                <div className="ag-form-row cols-2">
                                    <div className="ag-form-group">
                                        <label className="ag-label">البرنامج التدريبي</label>
                                        <select value={formData.programId || ''} onChange={e => updateField('programId', e.target.value)} className="ag-input">
                                            <option value="">-- اختر البرنامج --</option>
                                            {programs.map((p: any) => <option key={p.id} value={p.id}>{p.nameAr}</option>)}
                                        </select>
                                    </div>
                                    <div className="ag-form-group">
                                        <label className="ag-label">الفصل الدراسي</label>
                                        <select value={formData.classId || ''} onChange={e => updateField('classId', e.target.value)} className="ag-input">
                                            <option value="">-- اختر الفصل الدراسي --</option>
                                            {classes.filter((c: any) => !formData.programId || c.programId === formData.programId).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="ag-form-row cols-3">
                                    <div className="ag-form-group">
                                        <label className="ag-label">تاريخ القبول *</label>
                                        <input type="date" required value={formData.enrollmentDate ? (typeof formData.enrollmentDate === 'string' ? formData.enrollmentDate.split('T')[0] : (formData.enrollmentDate as any).toISOString().split('T')[0]) : ''} onChange={e => updateField('enrollmentDate', e.target.value)} className="ag-input" />
                                    </div>
                                    <div className="ag-form-group">
                                        <label className="ag-label">تاريخ التسجيل بالسلام</label>
                                        <input type="date" value={formData.registrationDateAlsalam ? (typeof formData.registrationDateAlsalam === 'string' ? formData.registrationDateAlsalam.split('T')[0] : (formData.registrationDateAlsalam as any).toISOString().split('T')[0]) : ''} onChange={e => updateField('registrationDateAlsalam', e.target.value)} className="ag-input" />
                                    </div>
                                    <div className="ag-form-group">
                                        <label className="ag-label">الحالة الأكاديمية</label>
                                        <select value={formData.status || 'active'} onChange={e => updateField('status', e.target.value)} className="ag-input">
                                            <option value="active">نشط</option>
                                            <option value="inactive">غير نشط</option>
                                            <option value="graduated">خريج</option>
                                            <option value="withdrawn">منسحب</option>
                                            <option value="suspended">موقوف</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="ag-section-title" style={{ marginTop: '20px' }}><Globe size={16} /> أرقام التسجيل الخارجية</div>
                                <div className="ag-form-row cols-3">
                                    <div className="ag-form-group">
                                        <label className="ag-label">رقم بيرسون (Pearson ID)</label>
                                        <input value={formData.registrationNumberPearson || ''} onChange={e => updateField('registrationNumberPearson', e.target.value)} className="ag-input ltr" />
                                    </div>
                                    <div className="ag-form-group">
                                        <label className="ag-label">رقم القيد بمعهد السلام</label>
                                        <input value={formData.enrolmentNumberAlsalam || ''} onChange={e => updateField('enrolmentNumberAlsalam', e.target.value)} className="ag-input ltr" />
                                    </div>
                                    <div className="ag-form-group">
                                        <label className="ag-label">التخصص الدقيق</label>
                                        <input value={formData.specialization || ''} onChange={e => updateField('specialization', e.target.value)} className="ag-input" />
                                    </div>
                                </div>

                                <div className="ag-section-title" style={{ marginTop: '20px' }}><Lock size={16} /> بيانات الدخول للمنصات</div>
                                <div className="ag-form-row cols-2">
                                    <div className="ag-form-group">
                                        <label className="ag-label">اسم المستخدم (المنصة)</label>
                                        <input value={formData.platformUsername || ''} onChange={e => updateField('platformUsername', e.target.value)} className="ag-input ltr" placeholder="Username..." />
                                    </div>
                                    <div className="ag-form-group">
                                        <label className="ag-label">كلمة المرور (المنصة)</label>
                                        <input type="text" value={formData.platformPassword || ''} onChange={e => updateField('platformPassword', e.target.value)} className="ag-input ltr" placeholder="Password..." />
                                    </div>
                                </div>

                                <div className="ag-section-title" style={{ marginTop: '20px' }}><ShieldCheck size={16} /> وثائق السفر والطوارئ</div>
                                <div className="ag-form-row cols-3">
                                    <div className="ag-form-group">
                                        <label className="ag-label">رقم جواز السفر</label>
                                        <input value={formData.passportNumber || ''} onChange={e => updateField('passportNumber', e.target.value)} className="ag-input ltr" />
                                    </div>
                                    <div className="ag-form-group">
                                        <label className="ag-label">تاريخ انتهاء الجواز</label>
                                        <input type="date" value={formData.passportExpiryDate ? (typeof formData.passportExpiryDate === 'string' ? formData.passportExpiryDate.split('T')[0] : (formData.passportExpiryDate as any).toISOString().split('T')[0]) : ''} onChange={e => updateField('passportExpiryDate', e.target.value)} className="ag-input" />
                                    </div>
                                    <div className="ag-form-group">
                                        <label className="ag-label">تواصل الطوارئ</label>
                                        <input value={formData.emergencyContactName || ''} onChange={e => updateField('emergencyContactName', e.target.value)} className="ag-input" placeholder="اسم جهة الاتصال" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. FINANCE & INSTALLMENTS */}
                        {activeTab === 'finance' && (
                            <div className="fade-in">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <div className="ag-section-title" style={{ marginBottom: 0 }}><Banknote size={16} /> الرسوم المالية والخصومات</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--hz-surface-3)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--hz-border-soft)' }}>
                                        <input type="checkbox" id="taxEx" checked={formData.isTaxExempt || false} onChange={e => updateField('isTaxExempt', e.target.checked)} style={{ cursor: 'pointer' }} />
                                        <label htmlFor="taxEx" style={{ cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800, color: formData.isTaxExempt ? 'var(--hz-cyan)' : 'var(--hz-text-muted)' }}>معفى من الضريبة (VAT)</label>
                                    </div>
                                </div>

                                <div className="ag-form-row cols-3">
                                    <div className="ag-form-group">
                                        <label className="ag-label">الرسوم الدراسية</label>
                                        <div style={{ position: 'relative' }}>
                                            <input type="number" value={formData.tuitionFee || ''} onChange={e => updateField('tuitionFee', e.target.value)} className="ag-input" style={{ paddingLeft: '40px' }} />
                                            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--hz-text-muted)' }}>د.ل</span>
                                        </div>
                                    </div>
                                    <div className="ag-form-group">
                                        <label className="ag-label">رسوم التسجيل</label>
                                        <div style={{ position: 'relative' }}>
                                            <input type="number" value={formData.registrationFee || ''} onChange={e => updateField('registrationFee', e.target.value)} className="ag-input" style={{ paddingLeft: '40px' }} />
                                            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--hz-text-muted)' }}>د.ل</span>
                                        </div>
                                    </div>
                                    <div className="ag-form-group">
                                        <label className="ag-label">الدفعة المقدمة</label>
                                        <div style={{ position: 'relative' }}>
                                            <input type="number" value={formData.initialPayment || ''} onChange={e => updateField('initialPayment', e.target.value)} className="ag-input" style={{ paddingLeft: '40px' }} />
                                            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--hz-text-muted)' }}>د.ل</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="ag-form-row cols-2" style={{ marginTop: '10px' }}>
                                    <div className="ag-form-group">
                                        <label className="ag-label">خصم خاص (على الرسوم الدراسية)</label>
                                        <div style={{ display: 'flex', border: '1px solid var(--hz-border-soft)', borderRadius: '8px', overflow: 'hidden' }}>
                                            <select value={formData.discountType || 'fixed'} onChange={e => updateField('discountType', e.target.value)} className="ag-input" style={{ width: '100px', border: 'none', borderLeft: '1px solid var(--hz-border-soft)', borderRadius: 0, background: 'var(--hz-surface-3)' }}>
                                                <option value="fixed">مبلغ ثابت</option>
                                                <option value="percentage">نسبة %</option>
                                            </select>
                                            <input type="number" value={formData.discountValue || ''} onChange={e => updateField('discountValue', e.target.value)} className="ag-input" style={{ flex: 1, border: 'none', borderRadius: 0 }} placeholder="قيمة الخصم..." />
                                        </div>
                                    </div>
                                    <div className="ag-form-group">
                                        <label className="ag-label">تاريخ استحقاق رسوم التسجيل</label>
                                        <input type="date" value={formData.registrationFeeDate ? (typeof formData.registrationFeeDate === 'string' ? formData.registrationFeeDate.split('T')[0] : (formData.registrationFeeDate as any).toISOString().split('T')[0]) : ''} onChange={e => updateField('registrationFeeDate', e.target.value)} className="ag-input" />
                                    </div>
                                </div>

                                {/* Summary Strip */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1px', background: 'var(--hz-border-soft)', borderRadius: '12px', overflow: 'hidden', margin: '20px 0', border: '1px solid var(--hz-border-soft)' }}>
                                    {[
                                        { lbl: 'إجمالي الرسوم', val: summary.t + summary.r, sub: 'دراسة + تسجيل' },
                                        { lbl: 'إجمالي الخصم', val: summary.discount, color: '#FF4D4D' },
                                        { lbl: 'الضريبة', val: summary.taxAmount, sub: systemSettings?.taxEnabled && !formData.isTaxExempt ? `${systemSettings.taxRate}%` : 'معفى' },
                                        { lbl: 'الإجمالي الصافي', val: summary.totalAmount, weight: 900, color: 'var(--hz-cyan)' },
                                        { lbl: 'المتبقي لـ "الترحيل"', val: summary.balance, bg: 'var(--hz-surface-3)', weight: 900 }
                                    ].map((item, idx) => (
                                        <div key={idx} style={{ padding: '15px', background: item.bg || 'var(--hz-surface)', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--hz-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>{item.lbl}</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: item.weight || 700, color: item.color || 'var(--hz-text-bright)' }}>{item.val.toLocaleString()}<span style={{ fontSize: '0.6rem', marginRight: '4px' }}>د.ل</span></div>
                                            {item.sub && <div style={{ fontSize: '0.6rem', color: 'var(--hz-text-dim)', marginTop: '2px' }}>{item.sub}</div>}
                                        </div>
                                    ))}
                                </div>

                                <div className="ag-section-title"><Calendar size={16} /> جدولة الأقساط</div>
                                <div className="ag-form-row cols-2">
                                    <div className="ag-form-group">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <label className="ag-label">عدد الأقساط</label>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--hz-cyan)' }}>{summary.balance > 0 ? `القسط الشهري: ${(summary.tuitionTotalWithTax / summary.instCount).toFixed(2)}` : ''}</div>
                                        </div>
                                        <input type="number" min="1" max="60" value={formData.installmentCount || ''} onChange={e => updateField('installmentCount', e.target.value)} className="ag-input" placeholder="مثال: 6" />
                                    </div>
                                    <div className="ag-form-group">
                                        <label className="ag-label">تاريخ أول قسط دراسي</label>
                                        <input type="date" value={formData.firstInstallmentDate ? (typeof formData.firstInstallmentDate === 'string' ? formData.firstInstallmentDate.split('T')[0] : (formData.firstInstallmentDate as any).toISOString().split('T')[0]) : ''} onChange={e => updateField('firstInstallmentDate', e.target.value)} className="ag-input" />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', background: 'var(--hz-surface-2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--hz-border-soft)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <input type="checkbox" id="incReg" checked={formData.includeRegistrationInInstallments !== false} onChange={e => updateField('includeRegistrationInInstallments', e.target.checked)} style={{ cursor: 'pointer' }} />
                                        <label htmlFor="incReg" style={{ fontSize: '0.8rem', color: 'var(--hz-text-primary)', cursor: 'pointer', fontWeight: 700 }}>تضمين رسوم التسجيل في جدول الأقساط</label>
                                    </div>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--hz-text-muted)', marginRight: '26px', margin: 0 }}>
                                        {formData.includeRegistrationInInstallments !== false
                                            ? "سيتم دمج رسوم التسجيل مع الرسوم الدراسية وتقسيمها على عدد الشهور."
                                            : "سيتم إنشاء قسط منفصل (الرقم 0) لرسوم التسجيل وحدها."}
                                    </p>
                                </div>

                                {/* Installment Preview Table (Matches Backend Safe Logic) */}
                                {summary.balance > 0 && summary.instCount > 0 && (
                                    <div style={{ marginTop: '20px' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--hz-text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}><Eye size={14} /> معاينة لـ "منطق ترحيل الأقساط"</div>
                                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--hz-border-soft)', borderRadius: '10px' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                                <thead style={{ position: 'sticky', top: 0, background: 'var(--hz-surface-3)', zIndex: 1 }}>
                                                    <tr>
                                                        <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid var(--hz-border-soft)' }}>#</th>
                                                        <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid var(--hz-border-soft)' }}>تاريخ الاستحقاق</th>
                                                        <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid var(--hz-border-soft)' }}>المبلغ الصافي</th>
                                                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid var(--hz-border-soft)' }}>نوع القسط</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {/* If Separate Reg Fee */}
                                                    {!summary.includeReg && summary.r > 0 && (
                                                        <tr style={{ borderBottom: '1px solid var(--hz-border-subtle)', background: 'rgba(var(--hz-cyan-rgb), 0.05)' }}>
                                                            <td style={{ padding: '10px' }}>0</td>
                                                            <td style={{ padding: '10px' }}>{formData.registrationFeeDate ? new Date(formData.registrationFeeDate).toLocaleDateString('ar-LY') : 'اليوم'}</td>
                                                            <td style={{ padding: '10px', color: 'var(--hz-cyan)', fontWeight: 900 }}>{summary.regTotalWithTax.toLocaleString()} د.ل</td>
                                                            <td style={{ padding: '10px' }}>رسوم تسجيل</td>
                                                        </tr>
                                                    )}
                                                    {/* Tuition Installments */}
                                                    {Array.from({ length: summary.instCount }).map((_, idx) => {
                                                        const date = formData.firstInstallmentDate ? new Date(formData.firstInstallmentDate) : new Date();
                                                        date.setMonth(date.getMonth() + idx);
                                                        const amount = summary.includeReg
                                                            ? summary.totalAmount / summary.instCount
                                                            : summary.tuitionTotalWithTax / summary.instCount;
                                                        return (
                                                            <tr key={idx} style={{ borderBottom: '1px solid var(--hz-border-subtle)' }}>
                                                                <td style={{ padding: '10px' }}>{idx + 1}</td>
                                                                <td style={{ padding: '10px' }}>{date.toLocaleDateString('ar-LY')}</td>
                                                                <td style={{ padding: '10px', color: 'var(--hz-text-bright)', fontWeight: 700 }}>{amount.toLocaleString()} د.ل</td>
                                                                <td style={{ padding: '10px', color: 'var(--hz-text-muted)' }}>قسط دراسي</td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--hz-text-dim)', fontSize: '0.7rem' }}>
                                            <Info size={12} /> يتم ترحيل (خصم) الدفعة المقدمة ({summary.i.toLocaleString()} د.ل) تلقائياً من الأقساط الأولى عند الحفظ.
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                    <div className="ag-modal-foot">
                        <button type="button" onClick={onClose} className="ag-btn ag-btn-ghost">إلغاء</button>
                        {activeTab !== 'finance' ? (
                            <button type="button" onClick={() => {
                                const idx = tabs.findIndex(t => t.id === activeTab);
                                setActiveTab(tabs[idx + 1].id);
                            }} className="ag-btn ag-btn-primary">
                                التالي <ChevronLeft size={16} />
                            </button>
                        ) : (
                            <button type="submit" disabled={loading} className="ag-btn ag-btn-primary" style={{ background: 'var(--hz-cyan)', color: '#000' }}>
                                <ShieldCheck size={16} />
                                {loading ? 'جاري ترحيل البيانات...' : (isEditing ? 'حفظ التغييرات وترحيلها' : 'تسجيل وترحيل الطالب')}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
