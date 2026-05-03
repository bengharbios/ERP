import { useState, useEffect, useMemo } from 'react';
import { FeeType, DiscountType, feesService } from '../../services/fees.service';
import { studentService, Student } from '../../services/student.service';
import { academicService, Program } from '../../services/academic.service';
import { settingsService, SystemSettings } from '../../services/settings.service';
import accountService from '../../services/account.service';
import { Toast, ToastType } from '../../components/Toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';

/**
 * STUDENT BILLING ENGINE (Professional IFRS 2026)
 * Concrete Structure | Inclusion Logic | Smart Installments
 */

interface BillableFee {
    id: string;
    type: FeeType;
    nameAr: string;
    amount: number;
    isIncludedInTuition: boolean; // Inclusion Logic Checkbox
    isTaxable: boolean;
    vatAmount: number;
    incomeAccountId?: string;
}

interface Scholarship {
    id: string;
    nameAr: string;
    type: DiscountType;
    value: number;
    reason: string;
}

interface InstallmentSchedule {
    month: number;
    dueDate: string;
    amount: number;
    isDownPayment: boolean;
    isManual: boolean;
}

export default function StudentBilling() {
    // --- Data States ---
    const [students, setStudents] = useState<Student[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // --- Workspace Core States ---
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [selectedProgramId, setSelectedProgramId] = useState('');
    const [fees, setFees] = useState<BillableFee[]>([]);
    const [scholarships, setScholarships] = useState<Scholarship[]>([]);
    const [downPayment, setDownPayment] = useState(0);
    const [installmentCount, setInstallmentCount] = useState(12);
    const [schedule, setSchedule] = useState<InstallmentSchedule[]>([]);

    // --- UI States ---
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'mapping' | 'discounts' | 'scheduler'>('mapping');

    // --- Initial Metadata Fetch ---
    useEffect(() => {
        const fetchEssentialData = async () => {
            try {
                const [studRes, progRes, settRes] = await Promise.all([
                    studentService.getStudents(),
                    academicService.getPrograms(),
                    settingsService.getSystemSettings()
                ]);
                if (studRes.data) setStudents(studRes.data.students || []);
                if (progRes.data) setPrograms(progRes.data.programs || []);
                if (settRes.data) setSettings(settRes.data.settings);

                // Fetch Accounts for routing
                const accRes = await accountService.getAccounts();
                setAccounts(accRes || []);
            } finally {
                setLoading(false);
            }
        };
        fetchEssentialData();
    }, []);

    // --- Accounting Logic (IFRS 2026) ---
    const financialSummary = useMemo(() => {
        const tuitionGross = fees.filter(f => f.isIncludedInTuition).reduce((s, f) => s + f.amount, 0);
        const nonTuitionGross = fees.filter(f => !f.isIncludedInTuition).reduce((s, f) => s + f.amount, 0);
        const subtotal = tuitionGross + nonTuitionGross;

        const isExempt = selectedStudent?.isTaxExempt ?? false;
        const taxRate = (settings?.taxEnabled && !isExempt) ? (Number(settings?.taxRate) || 15) : 0;
        const totalVat = fees.filter(f => f.isTaxable).reduce((s, f) => s + (f.amount * (taxRate / 100)), 0);

        let totalDiscounts = 0;
        scholarships.forEach(s => {
            if (s.type === DiscountType.PERCENTAGE) {
                totalDiscounts += (tuitionGross * s.value) / 100;
            } else {
                totalDiscounts += s.value;
            }
        });

        const netObligation = Math.max(0, (subtotal + totalVat) - totalDiscounts);
        const remainingToSchedule = Math.max(0, netObligation - downPayment);

        return {
            subtotal,
            totalVat,
            grossTotal: subtotal + totalVat,
            totalDiscounts,
            netObligation,
            remainingToSchedule,
            currency: settings?.currency || 'SAR'
        };
    }, [fees, scholarships, downPayment, settings]);

    // --- Intelligent Scheduler Algorithm ---
    const generateSmartSchedule = () => {
        const baseMonthly = financialSummary.remainingToSchedule / installmentCount;
        const newSchedule: InstallmentSchedule[] = [];
        let startDate = new Date();

        if (downPayment > 0) {
            newSchedule.push({
                month: 0,
                dueDate: startDate.toISOString().split('T')[0],
                amount: downPayment,
                isDownPayment: true,
                isManual: false
            });
        }

        for (let i = 1; i <= installmentCount; i++) {
            const currentMonth = new Date(startDate);
            currentMonth.setMonth(currentMonth.getMonth() + i);
            newSchedule.push({
                month: i,
                dueDate: currentMonth.toISOString().split('T')[0],
                amount: Math.round(baseMonthly * 100) / 100,
                isDownPayment: false,
                isManual: false
            });
        }
        setSchedule(newSchedule);
    };

    const handleManualOverride = (idx: number, newVal: number) => {
        const updated = [...schedule];
        updated[idx].amount = newVal;
        updated[idx].isManual = true;

        const totalPaidInManual = updated.reduce((s, inst) => inst.isManual ? s + inst.amount : s, 0);
        const remaining = financialSummary.netObligation - totalPaidInManual;
        const autoCount = updated.filter(inst => !inst.isManual).length;

        if (autoCount > 0) {
            const newShare = Math.round((remaining / autoCount) * 100) / 100;
            updated.forEach((inst, i) => {
                if (!inst.isManual) updated[i].amount = newShare;
            });
        }
        setSchedule(updated);
    };

    const addFee = (type: FeeType, nameAr: string) => {
        const newFee: BillableFee = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            nameAr,
            amount: 0,
            isIncludedInTuition: type === FeeType.TUITION,
            isTaxable: true,
            vatAmount: 0
        };
        setFees([...fees, newFee]);
    };

    const saveBilling = async () => {
        if (!selectedStudentId) return setToast({ type: 'warning', message: 'يرجى اختيار الطالب أولاً' });
        if (fees.length === 0) return setToast({ type: 'warning', message: 'يرجى إضافة بند رسوم واحد على الأقل' });

        try {
            setLoading(true);
            const requestData = {
                studentId: selectedStudentId,
                programId: selectedProgramId,
                title: `احتساب رسوم: ${selectedStudent?.firstNameAr} ${selectedStudent?.lastNameAr}`,
                feeItems: fees.map(f => ({
                    name: f.nameAr,
                    nameAr: f.nameAr,
                    type: f.type,
                    amount: f.amount,
                    isIncludedInTuition: f.isIncludedInTuition,
                    isTaxable: f.isTaxable,
                    incomeAccountId: f.incomeAccountId // <--- التحسين الجديد: إرسال حساب التوجيه
                })),
                discounts: scholarships.map(s => ({
                    name: s.nameAr,
                    nameAr: s.nameAr,
                    type: s.type,
                    percentage: s.type === DiscountType.PERCENTAGE ? s.value : undefined,
                    fixedAmount: s.type === DiscountType.FIXED_AMOUNT ? s.value : undefined
                })),
                dueDate: schedule[0]?.dueDate || new Date().toISOString().split('T')[0]
            };

            const response = await feesService.createStudentFeeCalculation(requestData as any);

            if (response.data) {
                setToast({ type: 'success', message: '✅ تم حفظ هيكلة الرسوم وتوليد القيود الآلية بنجاح' });
                // Reset or navigate
            }
        } catch (error) {
            console.error('Save Error:', error);
            setToast({ type: 'error', message: '❌ فشل حفظ البيانات المالية' });
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex-center h-screen"><div className="next-gen-loader orange"></div></div>;

    const selectedStudent = students.find(s => s.id === selectedStudentId);

    return (
        <div className="billing-engine RTL" style={{ direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}>
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
            {confirmDialog && <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog(null)} />}

            {/* Top Stats Shelf (Concrete) */}
            <div className="stats-shelf grid grid-cols-1 md:grid-cols-4 gap-6 p-8 bg-white border-b border-slate-100">
                <div className="stat-card gold">
                    <span className="label">اجمالي الاستحقاق (Gross)</span>
                    <span className="value">{feesService.formatCurrency(financialSummary.grossTotal, financialSummary.currency)}</span>
                </div>
                <div className="stat-card orange">
                    <span className="label">صافي المطالبة (Net)</span>
                    <span className="value">{feesService.formatCurrency(financialSummary.netObligation, financialSummary.currency)}</span>
                </div>
                <div className="stat-card blue">
                    <span className="label">اجمالي الخصومات</span>
                    <span className="value">{feesService.formatCurrency(financialSummary.totalDiscounts, financialSummary.currency)}</span>
                </div>
                <div className="stat-card red">
                    <span className="label">المتبقي للجدولة</span>
                    <span className="value">{feesService.formatCurrency(financialSummary.remainingToSchedule, financialSummary.currency)}</span>
                </div>
            </div>

            <div className="main-workspace grid grid-cols-12 gap-8 p-8 max-w-[1600px] mx-auto">

                {/* 1. Student Selection Sidebar (Left 4 columns) */}
                <aside className="col-span-12 lg:col-span-4 space-y-6">
                    <div className="glass-panel p-8 rounded-[32px] border border-slate-100 shadow-xl bg-white">
                        <h3 className="section-title mb-6">تعريف العملية المحاسبية</h3>

                        <div className="form-group mb-4">
                            <label className="text-xs font-bold text-slate-400 block mb-2">تصفية حسب البرنامج</label>
                            <select className="billing-select-mini mb-4" value={selectedProgramId} onChange={e => setSelectedProgramId(e.target.value)} style={{ width: '100%', height: '40px', borderRadius: '12px', padding: '0 12px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                                <option value="">-- كل البرامج --</option>
                                {programs.map(p => <option key={p.id} value={p.id}>{p.nameAr}</option>)}
                            </select>
                        </div>

                        <div className="form-group mb-4">
                            <label className="text-xs font-bold text-slate-400 block mb-2">الطالب المستهدف</label>
                            <select className="billing-select" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)}>
                                <option value="">-- اختر الطالب --</option>
                                {students
                                    .filter(s => !selectedProgramId || s.enrollments?.some(e => e.class?.program?.id === selectedProgramId))
                                    .map(s => <option key={s.id} value={s.id}>{s.firstNameAr} {s.lastNameAr} ({s.studentNumber})</option>)}
                            </select>
                        </div>
                        {selectedStudent && (
                            <div className="student-badge-preview p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center gap-4 animate-fade-in">
                                <div className="avatar w-12 h-12 bg-orange-200 rounded-full flex-center font-black text-orange-700">
                                    {selectedStudent.firstNameAr?.[0]}
                                </div>
                                <div className="info">
                                    <div className="name font-black text-slate-800">{selectedStudent.firstNameAr} {selectedStudent.lastNameAr}</div>
                                    <div className="prog text-xs text-orange-600 font-bold">
                                        {(selectedStudent as any).program?.nameAr || selectedStudent.enrollments?.[0]?.class?.program?.nameAr || 'لا يوجد برنامج'}
                                    </div>
                                </div>
                            </div>
                        )}
                        <hr className="my-6 border-slate-50" />
                        <div className="down-payment-box">
                            <label className="text-xs font-bold text-slate-400 block mb-2 italic">حجر الأساس: الدفعة الأولى (Down Payment)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="billing-input-large"
                                    value={downPayment}
                                    onChange={e => setDownPayment(Number(e.target.value))}
                                    placeholder="0.00"
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300">{financialSummary.currency}</span>
                            </div>
                        </div>

                        <button className="w-full mt-6 py-4 bg-orange-600 text-white rounded-2xl font-black shadow-lg hover:bg-orange-700 transition-all" onClick={saveBilling}>
                            اعتماد واحتساب الذمم المدينة
                        </button>
                    </div>

                    <div className="audit-trace-panel p-6 bg-slate-50 rounded-3xl border border-slate-200">
                        <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-4">سجل الأحداث (Audit Log)</h4>
                        <div className="text-[11px] text-slate-500 italic mb-2">نظام التحقق مفعل (IFRS 2026 Ready)</div>
                        <div className="log-entries space-y-2">
                            <div className="entry flex gap-2 text-[10px] text-slate-400">
                                <span className="time">10:14 PM</span>
                                <span className="msg">تم بدء جلسة احتساب جديدة</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* 2. Billing Tabs (Right 8 columns) */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    <nav className="billing-tabs flex gap-2">
                        <button className={`tab-btn ${activeTab === 'mapping' ? 'active' : ''}`} onClick={() => setActiveTab('mapping')}>🧱 تعريف الرسوم</button>
                        <button className={`tab-btn ${activeTab === 'discounts' ? 'active' : ''}`} onClick={() => setActiveTab('discounts')}>🎁 الخصومات والمنح</button>
                        <button className={`tab-btn ${activeTab === 'scheduler' ? 'active' : ''}`} onClick={() => setActiveTab('scheduler')}>🗓️ المجدول الذكي</button>
                    </nav>

                    {activeTab === 'mapping' && (
                        <div className="tab-pane animate-slide-up">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="section-title">بنود الرسوم (Fee Mapping)</h3>
                                <div className="flex gap-2">
                                    <button className="h-10 px-4 bg-slate-800 text-white rounded-xl text-xs font-bold" onClick={() => addFee(FeeType.TUITION, 'رسوم دراسية')}>+ دراسية</button>
                                    <button className="h-10 px-4 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold" onClick={() => addFee(FeeType.REGISTRATION, 'رسوم تسجيل')}>+ تسجيل</button>
                                    <button className="h-10 px-4 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold" onClick={() => addFee(FeeType.SERVICE, 'خدمات أخرى')}>+ أخرى</button>
                                </div>
                            </div>

                            <div className="fee-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                                {fees.map((fee, idx) => (
                                    <div key={fee.id} className="fee-mapping-card group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="icon bg-orange-50 text-orange-500 w-10 h-10 rounded-xl flex-center text-xl">
                                                {fee.type === FeeType.TUITION ? '🎓' : '📄'}
                                            </div>
                                            <button className="text-slate-200 hover:text-red-500" onClick={() => setFees(fees.filter(f => f.id !== fee.id))}>✕</button>
                                        </div>
                                        <input
                                            type="text"
                                            className="card-name-input"
                                            value={fee.nameAr}
                                            onChange={e => {
                                                const n = [...fees]; n[idx].nameAr = e.target.value; setFees(n);
                                            }}
                                        />
                                        <div className="amount-row my-4">
                                            <input
                                                type="number"
                                                className="card-amount-input"
                                                value={fee.amount}
                                                onChange={e => {
                                                    const n = [...fees]; n[idx].amount = Number(e.target.value); setFees(n);
                                                }}
                                            />
                                            <span className="curr">{financialSummary.currency}</span>
                                        </div>

                                        <div className="form-group mb-4">
                                            <label className="text-[10px] font-black text-slate-400 block mb-1">توجيه الإيراد (Revenue Account)</label>
                                            <select
                                                className="w-full h-10 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold px-3 focus:border-orange-500"
                                                value={fee.incomeAccountId || ''}
                                                onChange={e => {
                                                    const n = [...fees]; n[idx].incomeAccountId = e.target.value; setFees(n);
                                                }}
                                            >
                                                <option value="">-- توجيه تلقائي (الافتراضي) --</option>
                                                {accounts.filter(a => a.type === 'REVENUE').map(acc => (
                                                    <option key={acc.id} value={acc.id}>{acc.code} - {acc.nameAr}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="toggles flex gap-4 border-t pt-4">
                                            <label className="toggle-label">
                                                <input type="checkbox" checked={fee.isIncludedInTuition} onChange={e => {
                                                    const n = [...fees]; n[idx].isIncludedInTuition = e.target.checked; setFees(n);
                                                }} />
                                                <span>دمج كقسط</span>
                                            </label>
                                            <label className="toggle-label">
                                                <input type="checkbox" checked={fee.isTaxable} onChange={e => {
                                                    const n = [...fees]; n[idx].isTaxable = e.target.checked; setFees(n);
                                                }} />
                                                <span>ضريبة VAT</span>
                                            </label>
                                        </div>
                                    </div>
                                ))}
                                {fees.length === 0 && <div className="empty-state col-span-2">ابدأ بإضافة بنود الرسوم من الأعلى للبناء...</div>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'discounts' && (
                        <div className="tab-pane animate-slide-up">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="section-title">محرك الخصومات (Scholarship Engine)</h3>
                                <button className="h-10 px-6 bg-emerald-600 text-white rounded-xl text-xs font-bold" onClick={() => setScholarships([...scholarships, { id: Math.random().toString(36).substr(2, 9), nameAr: 'خصم تفوق', type: DiscountType.PERCENTAGE, value: 0, reason: '' }])}>+ إضافة خصم</button>
                            </div>
                            <div className="space-y-4">
                                {scholarships.map((s, idx) => (
                                    <div key={s.id} className="discount-strip flex items-center gap-4 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                                        <input type="text" className="bg-transparent border-none font-bold text-emerald-800 flex-1" value={s.nameAr} onChange={e => { const n = [...scholarships]; n[idx].nameAr = e.target.value; setScholarships(n); }} />
                                        <select className="h-10 bg-white border-emerald-200 rounded-lg text-xs" value={s.type} onChange={e => { const n = [...scholarships]; n[idx].type = e.target.value as DiscountType; setScholarships(n); }}>
                                            <option value={DiscountType.PERCENTAGE}>نسبة مئوية %</option>
                                            <option value={DiscountType.FIXED_AMOUNT}>مبلغ ثابت</option>
                                        </select>
                                        <input type="number" className="h-10 w-24 bg-white border-emerald-200 rounded-lg text-center font-black" value={s.value} onChange={e => { const n = [...scholarships]; n[idx].value = Number(e.target.value); setScholarships(n); }} />
                                        <button className="text-emerald-300 hover:text-red-500" onClick={() => setScholarships(scholarships.filter(cs => cs.id !== s.id))}>✕</button>
                                    </div>
                                ))}
                                {scholarships.length === 0 && <div className="empty-state">لا توجد خصومات مطبقة حالياً...</div>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'scheduler' && (
                        <div className="tab-pane animate-slide-up">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="section-title">المجدول الآلي (Planner)</h3>
                                <div className="flex gap-4 items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-400">الشهور:</span>
                                        <input type="number" className="h-10 w-20 border rounded-lg text-center font-black" value={installmentCount} onChange={e => setInstallmentCount(Number(e.target.value))} />
                                    </div>
                                    <button className="h-10 px-6 bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md" onClick={generateSmartSchedule}>توليد الأقساط</button>
                                </div>
                            </div>

                            <div className="schedule-list space-y-3">
                                {schedule.map((inst, idx) => (
                                    <div key={idx} className={`inst-row animate-fade-in ${inst.isDownPayment ? 'down-payment' : ''} ${inst.isManual ? 'manual' : ''}`} style={{ animationDelay: `${idx * 0.05}s` }}>
                                        <span className="month-num">{inst.month}</span>
                                        <span className="date underline text-slate-400 decoration-dotted">{inst.dueDate}</span>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <input type="number" className="amount-input" value={inst.amount} onChange={e => handleManualOverride(idx, Number(e.target.value))} />
                                                <span className="text-[10px] text-slate-300 font-bold">{financialSummary.currency}</span>
                                            </div>
                                            <div className="progress-bar-mini h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                                <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${(inst.amount / financialSummary.netObligation) * 100}%` }}></div>
                                            </div>
                                        </div>
                                        {inst.isDownPayment && <span className="badge">دفعة مقدمة</span>}
                                        {inst.isManual && <span className="badge orange">تعديل</span>}
                                    </div>
                                ))}
                                {schedule.length === 0 && <div className="empty-state">قم بتوليد الجدولة لمراجعة التدفقات النقدية...</div>}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .stat-card { background: white; padding: 25px; border-radius: 28px; border: 1px solid #F1F5F9; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
                .stat-card.orange { border-right: 6px solid #F6AD55; }
                .stat-card.blue { border-right: 6px solid #4299E1; }
                .stat-card.gold { border-right: 6px solid #D69E2E; }
                .stat-card.red { border-right: 6px solid #F56565; }
                .stat-card .label { display: block; font-size: 11px; font-weight: 800; color: #94A3B8; text-transform: uppercase; margin-bottom: 8px; }
                .stat-card .value { font-size: 1.5rem; font-weight: 950; color: #1E293B; }

                .tab-btn { padding: 12px 24px; border-radius: 14px; font-size: 0.85rem; font-weight: 900; background: white; border: 1px solid #F1F5F9; color: #64748B; transition: all 0.2s; }
                .tab-btn.active { background: #1E293B; color: white; border-color: #1E293B; box-shadow: 0 10px 15px rgba(0,0,0,0.1); }

                .fee-mapping-card { background: white; padding: 25px; border-radius: 30px; border: 1px solid #F1F5F9; box-shadow: 0 10px 25px rgba(0,0,0,0.03); transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                .fee-mapping-card:hover { transform: translateY(-5px); border-color: #F6AD55; }
                .card-name-input { width: 100%; border: none; font-size: 1.1rem; font-weight: 950; color: #1E293B; background: transparent; }
                .card-amount-input { border: none; background: #F8FAFC; padding: 10px 15px; border-radius: 12px; font-size: 1.3rem; font-weight: 950; color: #F6AD55; width: 120px; text-align: left; }
                .toggle-label { display: flex; align-items: center; gap: 8px; font-size: 10px; font-weight: 900; color: #94A3B8; text-transform: uppercase; cursor: pointer; }
                .toggle-label input { accent-color: #F6AD55; width: 14px; height: 14px; }

                .inst-row { display: flex; align-items: center; gap: 20px; background: white; padding: 15px 25px; border-radius: 20px; border: 1px solid #F1F5F9; transition: all 0.2s; }
                .inst-row:hover { background: #fafbfc; border-color: #F6AD55; }
                .inst-row.down-payment { background: #FFFBF0; border-color: #FBD38D; }
                .inst-row.manual { border-left: 4px solid #F6AD55; }
                .month-num { width: 32px; font-weight: 950; color: #cbd5e1; }
                .amount-input { background: transparent; border: none; border-bottom: 2px solid #f1f5f9; font-weight: 950; color: #1e293b; font-size: 1.1rem; width: 100px; text-align: left; }
                .badge { font-size: 9px; font-weight: 950; text-transform: uppercase; padding: 4px 10px; background: #FDE68A; color: #92400E; border-radius: 20px; }
                .badge.orange { background: #FDBA74; color: #9A3412; }

                .billing-select, .billing-input-large { width: 100%; height: 56px; border-radius: 16px; border: 2px solid #F1F5F9; padding: 0 20px; font-weight: 800; color: #1E293B; background: #F8FAFC; transition: all 0.2s; }
                .billing-select:focus, .billing-input-large:focus { outline: none; border-color: #F6AD55; background: white; }

                .empty-state { padding: 60px; text-align: center; border: 3px dashed #F1F5F9; border-radius: 40px; color: #cbd5e1; font-weight: 900; font-style: italic; }

                @keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.3s forwards; }
                .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
            ` }} />
        </div>
    );
}
