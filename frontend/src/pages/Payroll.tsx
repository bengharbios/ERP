import React, { useState, useEffect } from 'react';
import { hrService, Payroll, Employee } from '../services/hr.service';
import { Toast, ToastType } from '../components/Toast';
import './Employees.css';
import './Payroll.css';

const PayrollPage: React.FC = () => {
    const [payrolls, setPayrolls] = useState<Payroll[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

    const [selectedEmployeeForProcess, setSelectedEmployeeForProcess] = useState<any>(null);

    const [activeStep, setActiveStep] = useState(1);
    const [processForm, setProcessForm] = useState({
        employeeId: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        basicSalary: 0,
        housingAllowance: 0,
        transportAllowance: 0,
        otherAllowances: 0,
        deductions: 0,
        commissionAmount: 0, // Calculated commission
        achievedTarget: 0,   // Input for calculation
        hoursWorked: 0,      // For Hourly Employees
        notes: ''
    });

    const steps = [
        { id: 1, label: 'اختيار الموظف', icon: '👤' },
        { id: 2, label: 'الاستحقاقات', icon: '💰' },
        { id: 3, label: 'الخصومات والأداء', icon: '📉' },
        { id: 4, label: 'المراجعة والحفظ', icon: '✅' }
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [payRes, empRes] = await Promise.all([
                hrService.getPayroll({ year: new Date().getFullYear() }),
                hrService.getEmployees()
            ]);
            if (payRes.success) setPayrolls(payRes.data || []);
            if (empRes.success) setEmployees(empRes.data || []);
        } catch (error) {
            console.error('Error fetching payroll data:', error);
            setToast({ type: 'error', message: '❌ فشل في تحميل بيانات الرواتب' });
        } finally {
            setLoading(false);
        }
    };

    const handleEmployeeChange = (empId: string) => {
        const emp = employees.find(e => e.id === empId) as any;
        if (emp) {
            setSelectedEmployeeForProcess(emp);

            const housing = Number(emp.housingAllowance) || 0;
            const transport = Number(emp.transportAllowance) || 0;
            const other = Number(emp.otherAllowances) || 0;
            const totalCalcDeductions = Number(emp.totalDeductions) || 0;

            let baseSalary = Number(emp.salary) || 0;
            if (emp.salaryType === 'HOURLY' || emp.salaryType === 'COMMISSION_ONLY') {
                baseSalary = 0;
            }

            setProcessForm(prev => ({
                ...prev,
                employeeId: empId,
                basicSalary: baseSalary,
                housingAllowance: housing,
                transportAllowance: transport,
                otherAllowances: other,
                deductions: totalCalcDeductions,
                commissionAmount: 0,
                achievedTarget: 0,
                hoursWorked: 0
            }));
        } else {
            setSelectedEmployeeForProcess(null);
        }
    };

    useEffect(() => {
        if (!selectedEmployeeForProcess) return;

        const emp = selectedEmployeeForProcess;
        let newBasicSalary = processForm.basicSalary;
        let newCommAmount = 0;

        if (emp.salaryType === 'HOURLY') {
            const hours = Number(processForm.hoursWorked || 0);
            const rate = Number(emp.hourlyRate || 0);
            const unit = Number(emp.hourlyUnit) > 0 ? Number(emp.hourlyUnit) : 1;
            newBasicSalary = (hours / unit) * rate;
        } else if (emp.salaryType === 'COMMISSION_ONLY') {
            newBasicSalary = 0;
        }

        const achieved = Number(processForm.achievedTarget || 0);

        if (emp.salaryType === 'SALARY_COMMISSION' || emp.salaryType === 'COMMISSION_ONLY') {
            if (emp.commissionTiers && emp.commissionTiers.length > 0) {
                const tiers = [...emp.commissionTiers].sort((a: any, b: any) => b.targetThreshold - a.targetThreshold);
                for (const tier of tiers) {
                    if (achieved >= Number(tier.targetThreshold)) {
                        newCommAmount = Number(tier.commissionAmount);
                        break;
                    }
                }
            }

            if (emp.commissionLogic === 'NEGATIVE') {
                const mainTarget = Number(emp.targetValue || 0);
                if (achieved < mainTarget) {
                    newCommAmount = 0;
                }
            }
        }

        if (emp.salaryType === 'HOURLY' && newBasicSalary !== processForm.basicSalary) {
            setProcessForm(prev => ({ ...prev, basicSalary: newBasicSalary }));
        }

        if (newCommAmount !== processForm.commissionAmount) {
            setProcessForm(prev => ({ ...prev, commissionAmount: newCommAmount }));
        }

    }, [processForm.hoursWorked, processForm.achievedTarget, selectedEmployeeForProcess]);

    const handleProcessSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const existing = payrolls.find(p =>
            p.employeeId === processForm.employeeId &&
            p.month === Number(processForm.month) &&
            p.year === Number(processForm.year)
        );

        if (existing) {
            const confirmed = window.confirm(`⚠️ هذا الموظف لديه مسير رواتب مسجل بالفعل لشهر ${processForm.month} / ${processForm.year}. هل تريد استبدال البيانات القديمة؟`);
            if (!confirmed) return;
        }

        try {
            // Log payload for debugging
            console.log('Final Payroll Payload:', processForm);

            const payload = {
                ...processForm,
                commission: processForm.commissionAmount
            };
            const res = await hrService.processPayroll(payload);

            if (res.success) {
                setToast({ type: 'success', message: '✅ تم معالجة الراتب بنجاح' });
                setShowProcessModal(false);
                setActiveStep(1);
                fetchData();
            } else {
                console.error('Process error:', res);
                setToast({ type: 'error', message: res.error?.message || '❌ فشل في معالجة الراتب' });
            }
        } catch (error: any) {
            console.error('Payroll error trace:', error);
            setToast({ type: 'error', message: error.response?.data?.error?.message || '❌ فشل في معالجة الراتب' });
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED' }).format(amount);
    };

    const totalNet = payrolls.reduce((acc, curr) => acc + Number(curr.netSalary), 0);
    const totalAllowancesValue = payrolls.reduce((acc, curr) =>
        acc + (Number(curr.housingAllowance) || 0) + (Number(curr.transportAllowance) || 0) + (Number(curr.otherAllowances) || 0), 0);

    const isHourly = selectedEmployeeForProcess?.salaryType === 'HOURLY';
    const isCommission = selectedEmployeeForProcess?.salaryType === 'SALARY_COMMISSION' || selectedEmployeeForProcess?.salaryType === 'COMMISSION_ONLY';
    const isNegativeLogic = selectedEmployeeForProcess?.commissionLogic === 'NEGATIVE';
    const minFloor = Number(selectedEmployeeForProcess?.minimumSalaryFloor || 0);
    const isCommissionOnly = selectedEmployeeForProcess?.salaryType === 'COMMISSION_ONLY';

    const currentNet = (processForm.basicSalary || 0) +
        (processForm.housingAllowance || 0) + (processForm.transportAllowance || 0) + (processForm.otherAllowances || 0) +
        (processForm.commissionAmount || 0) - (processForm.deductions || 0);
    const belowFloor = isNegativeLogic && minFloor > 0 && currentNet < minFloor;

    return (
        <div className="next-gen-page-container">
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            <header className="glass-header">
                <div className="container-wide header-content">
                    <div className="header-branding">
                        <div className="branding-icon orange">💳</div>
                        <div className="branding-text">
                            <h1>مسيرات الرواتب</h1>
                            <p className="hide-on-mobile">Payroll & Salary Distribution</p>
                        </div>
                    </div>

                    <div className="header-actions">
                        <button
                            className="btn-modern btn-outline"
                            onClick={() => alert('جاري إنشاء ملف الـ SIF لنظام حماية الأجور (WPS)...')}
                        >
                            <span style={{ fontSize: '1.2rem', marginLeft: '0.5rem' }}>📂</span>
                            <span>توليد ملف WPS</span>
                        </button>
                        <button onClick={() => { setShowProcessModal(true); setActiveStep(1); }} className="btn-modern btn-orange-gradient">
                            <span className="plus-icon">+</span>
                            <span className="hide-on-mobile">معالجة راتب جديد</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="container-wide main-content">
                <section className="stats-grid">
                    <div className="stat-card-mini">
                        <div className="stat-info">
                            <span className="stat-label">إجمالي المدفوعات</span>
                            <span className="stat-value" style={{ fontSize: '1.2rem' }}>{formatCurrency(totalNet)}</span>
                        </div>
                        <div className="stat-icon-bg blue">💰</div>
                    </div>
                    <div className="stat-card-mini">
                        <div className="stat-info">
                            <span className="stat-label">إجمالي البدلات</span>
                            <span className="stat-value" style={{ fontSize: '1.2rem' }}>{formatCurrency(totalAllowancesValue)}</span>
                        </div>
                        <div className="stat-icon-bg green">🎁</div>
                    </div>
                    <div className="stat-card-mini">
                        <div className="stat-info">
                            <span className="stat-label">عدد المسيرات</span>
                            <span className="stat-value">{payrolls.length}</span>
                        </div>
                        <div className="stat-icon-bg purple">📄</div>
                    </div>
                    <div className="stat-card-mini">
                        <div className="stat-info">
                            <span className="stat-label">حالة النظام</span>
                            <span className="stat-value" style={{ fontSize: '1rem' }}>جاهز (WPS)</span>
                        </div>
                        <div className="stat-icon-bg orange">🛡️</div>
                    </div>
                </section>

                <div className="content-transition-wrapper">
                    {loading ? (
                        <div className="loading-state-modern">
                            <div className="spinner"></div>
                            <p>جاري تحميل البيانات المالية...</p>
                        </div>
                    ) : (
                        <div className="next-gen-table-container">
                            <table className="modern-data-table">
                                <thead>
                                    <tr>
                                        <th>الموظف</th>
                                        <th className="text-center">الفترة</th>
                                        <th className="text-center">الأساسي</th>
                                        <th className="text-center">العمولة</th>
                                        <th className="text-center">البدلات</th>
                                        <th className="text-center">الاستقطاعات</th>
                                        <th className="text-center">الصافي</th>
                                        <th className="text-center">الحالة</th>
                                        <th className="text-center">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payrolls.map((pay: any) => (
                                        <tr key={pay.id}>
                                            <td>
                                                <div className="table-user-info">
                                                    <div className="user-avatar-small">👤</div>
                                                    <div>
                                                        <div className="table-primary-text">{pay.employee?.user?.firstName} {pay.employee?.user?.lastName}</div>
                                                        <div className="table-secondary-text">{pay.employee?.jobTitleAr || 'موظف'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <span className="code-pill">{pay.month} / {pay.year}</span>
                                            </td>
                                            <td className="text-center">{formatCurrency(pay.basicSalary)}</td>
                                            <td className="text-center" style={{ color: '#3182CE', fontWeight: 'bold' }}>{Number(pay.commission) > 0 ? `+${formatCurrency(pay.commission)}` : '-'}</td>
                                            <td className="text-center" style={{ color: '#38A169', fontWeight: 'bold' }}>+{(Number(pay.housingAllowance) + Number(pay.transportAllowance) + Number(pay.otherAllowances)).toLocaleString('en-US', { style: 'currency', currency: 'AED' })}</td>
                                            <td className="text-center" style={{ color: '#E53E3E', fontWeight: 'bold' }}>-{formatCurrency(pay.deductions)}</td>
                                            <td className="text-center">
                                                <div className="table-primary-text" style={{ color: '#DD6B20', fontWeight: 800 }}>
                                                    {formatCurrency(pay.netSalary)}
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <span className={`status-pill ${pay.status === 'paid' ? 'active' : 'warn'}`}>
                                                    {pay.status === 'paid' ? 'تم الدفع' : 'قيد المعالجة'}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <div className="table-row-actions">
                                                    <button onClick={() => setSelectedPayroll(pay)} className="edit-btn-icon" title="قسيمة الراتب">📄</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {payrolls.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="text-center" style={{ padding: '3rem' }}>
                                                لا توجد مسيرات رواتب مسجلة لهذا العام.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {showProcessModal && (
                <div className="modal-overlay" onClick={() => setShowProcessModal(false)}>
                    <div className="modal-content side-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px', borderRadius: '24px', padding: '0' }}>
                        <div className="modal-header" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #edf2f7' }}>
                            <div>
                                <h2>معالجة راتب مسير</h2>
                                <p style={{ color: '#718096', fontSize: '0.9rem' }}>إعداد مسير الرواتب لشهر {processForm.month} / {processForm.year}</p>
                            </div>
                            <button onClick={() => setShowProcessModal(false)} className="close-btn">×</button>
                        </div>

                        <div className="stepper-wrapper" style={{ padding: '2rem', background: '#f8fafc', borderBottom: '1px solid #edf2f7' }}>
                            {steps.map((step, index) => {
                                const isActive = step.id === activeStep;
                                const isCompleted = step.id < activeStep;
                                return (
                                    <div key={step.id} className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                                        onClick={() => { if (isCompleted || (processForm.employeeId && step.id < activeStep)) setActiveStep(step.id); }}>
                                        <div className="step-circle">
                                            {isCompleted ? '✓' : step.icon}
                                        </div>
                                        <span className="step-label">{step.label}</span>
                                        {index < steps.length - 1 && <div className="step-line"></div>}
                                    </div>
                                );
                            })}
                        </div>

                        <form onSubmit={handleProcessSubmit} className="modern-form" style={{ padding: '2rem' }}>

                            {activeStep === 1 && (
                                <div className="fade-in">
                                    <div className="form-group mb-4">
                                        <label style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', display: 'block' }}>اختر الموظف المراد معالجة راتبه</label>
                                        <select
                                            required
                                            className="filter-select full-width"
                                            style={{ height: '55px', fontSize: '1.1rem', border: '2px solid #ed8936' }}
                                            value={processForm.employeeId}
                                            onChange={e => { handleEmployeeChange(e.target.value); setActiveStep(2); }}
                                        >
                                            <option value="">-- اضغط هنا لاختيار الموظف --</option>
                                            {employees.map(e => <option key={e.id} value={e.id}>{e.user?.firstName} {e.user?.lastName} ({e.employeeCode})</option>)}
                                        </select>
                                    </div>
                                    <div className="form-grid-2">
                                        <div className="form-group">
                                            <label>شهر الاستحقاق</label>
                                            <input type="number" className="filter-select full-width" min="1" max="12" value={processForm.month} onChange={e => setProcessForm({ ...processForm, month: Number(e.target.value) })} required />
                                        </div>
                                        <div className="form-group">
                                            <label>السنة</label>
                                            <input type="number" className="filter-select full-width" value={processForm.year} onChange={e => setProcessForm({ ...processForm, year: Number(e.target.value) })} required />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeStep === 2 && (
                                <div className="fade-in">
                                    <h3 style={{ marginBottom: '1.5rem', color: '#2C7A7B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>💰 بند الاستحقاقات</h3>

                                    {isHourly && (
                                        <div className="form-group mb-4" style={{ background: '#E6FFFA', padding: '1.25rem', borderRadius: '15px', border: '1px solid #B2F5EA' }}>
                                            <label style={{ color: '#234E52', fontWeight: 800 }}>ساعات العمل المنفذة (Rate: {selectedEmployeeForProcess?.hourlyRate} AED)</label>
                                            <input
                                                type="number"
                                                className="filter-select full-width"
                                                style={{ height: '50px', fontSize: '1.2rem', fontWeight: 'bold' }}
                                                value={processForm.hoursWorked}
                                                onChange={e => setProcessForm({ ...processForm, hoursWorked: Number(e.target.value) })}
                                            />
                                        </div>
                                    )}

                                    <div className="form-grid-2">
                                        <div className="form-group">
                                            <label>{isHourly ? 'الراتب المعتمد (ساعات)' : 'الراتب الأساسي'}</label>
                                            <input
                                                type="number"
                                                className="filter-select full-width"
                                                value={processForm.basicSalary}
                                                onChange={e => setProcessForm({ ...processForm, basicSalary: Number(e.target.value) })}
                                                readOnly={isHourly || isCommissionOnly}
                                                style={(isHourly || isCommissionOnly) ? { background: '#f1f5f9' } : {}}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>بدل السكن</label>
                                            <input
                                                type="number"
                                                className="filter-select full-width"
                                                value={processForm.housingAllowance}
                                                onChange={e => setProcessForm({ ...processForm, housingAllowance: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>بدل المواصلات</label>
                                            <input
                                                type="number"
                                                className="filter-select full-width"
                                                value={processForm.transportAllowance}
                                                onChange={e => setProcessForm({ ...processForm, transportAllowance: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>بدلات أخرى</label>
                                            <input
                                                type="number"
                                                className="filter-select full-width"
                                                value={processForm.otherAllowances}
                                                onChange={e => setProcessForm({ ...processForm, otherAllowances: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeStep === 3 && (
                                <div className="fade-in">
                                    <h3 style={{ marginBottom: '1.5rem', color: '#C53030', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📉 الخصومات والأداء</h3>

                                    <div className="form-group mb-4">
                                        <label>إجمالي الخصومات (غياب/تأخير/أخرى)</label>
                                        <input
                                            type="number"
                                            className="filter-select full-width"
                                            style={{ color: '#C53030', fontWeight: 'bold' }}
                                            value={processForm.deductions}
                                            onChange={e => setProcessForm({ ...processForm, deductions: Number(e.target.value) })}
                                        />
                                    </div>

                                    {isCommission && (
                                        <div style={{ background: '#FFF7ED', padding: '1.5rem', borderRadius: '15px', border: '1px solid #FFEDD5' }}>
                                            <label style={{ fontWeight: 800, color: '#9C4221', display: 'block', marginBottom: '1rem' }}>
                                                هدف المبيعات/المعاملات المحقق 🎯
                                            </label>
                                            <div className="form-grid-2">
                                                <div className="form-group">
                                                    <label>الهدف المحقق</label>
                                                    <input
                                                        type="number"
                                                        className="filter-select full-width"
                                                        value={processForm.achievedTarget}
                                                        onChange={e => setProcessForm({ ...processForm, achievedTarget: Number(e.target.value) })}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>العمولة (تلقائي)</label>
                                                    <div style={{ background: 'white', padding: '0.75rem', borderRadius: '10px', fontWeight: 900, fontSize: '1.1rem', color: '#DD6B20', border: '1px solid #E2E8F0' }}>
                                                        {formatCurrency(processForm.commissionAmount)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeStep === 4 && (
                                <div className="fade-in">
                                    <div style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <span style={{ color: '#718096', fontSize: '0.85rem' }}>الموظف</span>
                                                <div style={{ fontWeight: 700 }}>{selectedEmployeeForProcess?.user?.firstName} {selectedEmployeeForProcess?.user?.lastName}</div>
                                            </div>
                                            <div>
                                                <span style={{ color: '#718096', fontSize: '0.85rem' }}>الفترة</span>
                                                <div style={{ fontWeight: 700 }}>{processForm.month} / {processForm.year}</div>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid #edf2f7', paddingTop: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span>إجمالي المستحقات والبدلات:</span>
                                                <span style={{ fontWeight: 700, color: '#38A169' }}>+{formatCurrency(processForm.basicSalary + processForm.housingAllowance + processForm.transportAllowance + processForm.otherAllowances)}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span>إجمالي العمولات:</span>
                                                <span style={{ fontWeight: 700, color: '#3182CE' }}>+{formatCurrency(processForm.commissionAmount)}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>إجمالي الخصومات:</span>
                                                <span style={{ fontWeight: 700, color: '#C53030' }}>-{formatCurrency(processForm.deductions)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="net-salary-preview" style={{ background: belowFloor ? '#FFF5F5' : 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)', padding: '1.5rem', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', border: belowFloor ? '2px solid #FC8181' : 'none' }}>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '0.9rem', color: '#9A3412' }}>صافي الراتب المستحق</span>
                                            <strong style={{ fontSize: '2.2rem', color: '#7C2D12' }}>{formatCurrency(currentNet)}</strong>
                                        </div>
                                        {belowFloor && <span style={{ background: '#C53030', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem' }}>أقل من الحد الأدنى!</span>}
                                    </div>

                                    <div className="form-group mt-4">
                                        <label>ملاحظات إضافية</label>
                                        <textarea
                                            className="filter-select full-width"
                                            rows={2}
                                            style={{ height: 'auto', padding: '10px' }}
                                            value={processForm.notes}
                                            onChange={e => setProcessForm({ ...processForm, notes: e.target.value })}
                                            placeholder="اكتب أي ملاحظات هنا..."
                                        ></textarea>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem', gap: '1rem' }}>
                                {activeStep > 1 && (
                                    <button type="button" className="btn-modern btn-outline" style={{ flex: 1 }} onClick={() => setActiveStep(activeStep - 1)}>
                                        السابق
                                    </button>
                                )}

                                {activeStep < 4 ? (
                                    <button
                                        type="button"
                                        className="btn-modern btn-orange-gradient"
                                        style={{ flex: 2 }}
                                        disabled={!processForm.employeeId}
                                        onClick={() => setActiveStep(activeStep + 1)}
                                    >
                                        المتابعة للمراجعة
                                    </button>
                                ) : (
                                    <button type="submit" className="btn-modern btn-orange-gradient" style={{ flex: 2 }}>
                                        📥 حفظ واعتماد المسير
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedPayroll && (
                <div className="modal-overlay" onClick={() => setSelectedPayroll(null)}>
                    <div className="modal-content side-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', padding: '2.5rem', borderRadius: '30px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📜</div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>قسيمة راتب إلكترونية</h2>
                            <p style={{ color: '#666' }}>الفترة: {selectedPayroll.month} / {selectedPayroll.year}</p>
                        </div>

                        <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '20px', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                <span style={{ color: '#777' }}>الموظف:</span>
                                <span style={{ fontWeight: 700 }}>{selectedPayroll.employee?.user?.firstName} {selectedPayroll.employee?.user?.lastName}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                <span style={{ color: '#777' }}>الرقم الوظيفي:</span>
                                <span style={{ fontWeight: 700 }}>{selectedPayroll.employee?.employeeCode}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                <span style={{ color: '#777' }}>المسمى الوظيفي:</span>
                                <span style={{ fontWeight: 700 }}>{selectedPayroll.employee?.jobTitleAr || '-'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#777' }}>القسم:</span>
                                <span style={{ fontWeight: 700 }}>{selectedPayroll.employee?.department?.nameAr || '-'}</span>
                            </div>
                        </div>

                        {(selectedPayroll.hoursWorked || selectedPayroll.achievedTarget) && (
                            <div style={{ background: '#FFF7ED', padding: '1rem', borderRadius: '15px', marginBottom: '1.5rem', border: '1px dashed #FDBA74', fontSize: '0.9rem' }}>
                                {selectedPayroll.hoursWorked && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>ساعات العمل المنفذة:</span>
                                        <span style={{ fontWeight: 700 }}>{Number(selectedPayroll.hoursWorked)} ساعة</span>
                                    </div>
                                )}
                                {selectedPayroll.achievedTarget && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>الهدف المحقق:</span>
                                        <span style={{ fontWeight: 700 }}>{Number(selectedPayroll.achievedTarget).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{ border: '1px solid #eee', borderRadius: '20px', overflow: 'hidden' }}>
                            <div style={{ padding: '0.9rem 1.2rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', background: '#fafafa' }}>
                                <span style={{ fontWeight: 700 }}>الراتب الأساسي</span>
                                <span style={{ fontWeight: 700 }}>{formatCurrency(selectedPayroll.basicSalary)}</span>
                            </div>
                            <div style={{ padding: '0.9rem 1.2rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', color: '#3182CE' }}>
                                <span>العمولة (+)</span>
                                <span style={{ fontWeight: 600 }}>{formatCurrency(selectedPayroll.commission)}</span>
                            </div>

                            <div style={{ background: '#F0FFF4', borderBottom: '1px solid #eee' }}>
                                <div style={{ padding: '0.6rem 1.2rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#38A169' }}>
                                    <span>بدل سكن (+)</span>
                                    <span>{formatCurrency(selectedPayroll.housingAllowance)}</span>
                                </div>
                                <div style={{ padding: '0.6rem 1.2rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#38A169' }}>
                                    <span>بدل مواصلات (+)</span>
                                    <span>{formatCurrency(selectedPayroll.transportAllowance)}</span>
                                </div>
                                <div style={{ padding: '0.6rem 1.2rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#38A169' }}>
                                    <span>بدلات أخرى (+)</span>
                                    <span>{formatCurrency(selectedPayroll.otherAllowances)}</span>
                                </div>
                            </div>

                            <div style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', color: '#E53E3E' }}>
                                <span>الاستقطاعات (-)</span>
                                <span style={{ fontWeight: 600 }}>{formatCurrency(selectedPayroll.deductions)}</span>
                            </div>
                            <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', background: '#FFF7ED', color: '#C2410C' }}>
                                <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>صافي الراتب المودع</span>
                                <span style={{ fontWeight: 900, fontSize: '1.2rem' }}>{formatCurrency(selectedPayroll.netSalary)}</span>
                            </div>
                        </div>

                        <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
                            <button className="btn-modern btn-orange-gradient" style={{ flex: 1, justifyContent: 'center' }} onClick={() => window.print()}>🖨️ طباعة القسيمة</button>
                            <button className="btn-modern btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setSelectedPayroll(null)}>إغلاق</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayrollPage;
