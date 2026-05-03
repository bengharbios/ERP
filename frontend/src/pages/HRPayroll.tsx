// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import {
    CreditCard, Search, Plus, Filter,
    X, Users, Edit, FileText, Download,
    Printer, Trash2, CheckCircle2, AlertCircle,
    ChevronRight, ChevronLeft, Wallet, TrendingUp,
    ShieldCheck, Calendar, DollarSign
} from 'lucide-react';
import { hrService, Payroll, Employee } from '../services/hr.service';
import { useSettingsStore } from '../store/settingsStore';
import { Toast, ToastType } from '../components/Toast';
import './HRPayroll.css';

/**
 * SMART PAYROLL MANAGEMENT (Rapidos 2026)
 * WPS Support & SIF Generation
 */

export default function HRPayroll() {
    const [payrolls, setPayrolls] = useState<Payroll[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    // --- Modals ---
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [showSlipModal, setShowSlipModal] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
    const [activeStep, setActiveStep] = useState(1);

    // --- Form State ---
    const [form, setForm] = useState({
        employeeId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(),
        basicSalary: 0, housingAllowance: 0, transportAllowance: 0,
        otherAllowances: 0, deductions: 0, commission: 0, notes: ''
    });

    // --- Toast ---
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [payRes, empRes] = await Promise.all([
                hrService.getPayroll({ year: new Date().getFullYear() }),
                hrService.getEmployees()
            ]);
            setPayrolls(payRes.data || []);
            setEmployees(empRes.data || []);
        } catch (error) {
            setToast({ type: 'error', message: '❌ فشل في تحميل البيانات' });
        } finally {
            setLoading(false);
        }
    };

    const handleEmployeeChange = (id: string) => {
        const emp = employees.find(e => e.id === id);
        if (emp) {
            setForm({
                ...form,
                employeeId: id,
                basicSalary: Number(emp.salary) || 0,
                housingAllowance: Number(emp.housingAllowance) || 0,
                transportAllowance: Number(emp.transportAllowance) || 0,
                otherAllowances: Number(emp.otherAllowances) || 0,
                deductions: Number(emp.totalDeductions) || 0,
            });
            setActiveStep(2);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await hrService.processPayroll(form);
            if (res.success) {
                setToast({ type: 'success', message: '✅ تم اعتماد المسير بنجاح' });
                setShowProcessModal(false);
                fetchData();
            }
        } catch (error) {
            setToast({ type: 'error', message: '❌ فشل في حفظ المسير' });
        }
    };

    const stats = useMemo(() => {
        const totalNet = payrolls.reduce((acc, p) => acc + Number(p.netSalary), 0);
        return {
            totalNet,
            count: payrolls.length,
            allowances: payrolls.reduce((acc, p) => acc + (Number(p.housingAllowance) + Number(p.transportAllowance) + Number(p.otherAllowances)), 0)
        };
    }, [payrolls]);

    const formatAED = (val: number) => new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(val);

    return (
        <div className="pr-root" style={{ height: 'calc(100vh - 160px)' }}>
            <div className="pr-header">
                <div className="pr-title">
                    <CreditCard size={20} /> مسيرات الرواتب والمالية
                </div>
                <div className="pr-actions" style={{ display: 'flex', gap: '12px' }}>
                    <button className="ag-btn ag-btn-ghost hide-mobile" onClick={() => alert('WPS Exporting...')}>
                        <FileText size={16} /> تصدير ملف SIF
                    </button>
                    <button className="ag-btn ag-btn-primary" onClick={() => { setShowProcessModal(true); setActiveStep(1); }}>
                        <Plus size={16} /> معالجة راتب
                    </button>
                </div>
            </div>

            <div className="pr-stats hide-mobile">
                <div className="pr-stat-card">
                    <span className="pr-stat-label">إجمالي المدفوعات</span>
                    <span className="pr-stat-val" style={{ color: '#00F5A0' }}>{formatAED(stats.totalNet)}</span>
                    <TrendingUp size={24} style={{ position: 'absolute', left: '20px', bottom: '20px', opacity: 0.1 }} />
                </div>
                <div className="pr-stat-card">
                    <span className="pr-stat-label">إجمالي البدلات</span>
                    <span className="pr-stat-val" style={{ color: '#38A169' }}>{formatAED(stats.allowances)}</span>
                </div>
                <div className="pr-stat-card">
                    <span className="pr-stat-label">المسيرات المعتمدة</span>
                    <span className="pr-stat-val">{stats.count}</span>
                </div>
                <div className="pr-stat-card">
                    <span className="pr-stat-label">نظام حماية الأجور</span>
                    <span className="pr-stat-val" style={{ fontSize: '1rem', color: '#DD6B20' }}>WPS Enabled ✓</span>
                </div>
            </div>

            <main className="pr-main">
                <div className="pr-table-wrap">
                    <table className="pr-table">
                        <thead>
                            <tr>
                                <th>الموظف</th>
                                <th>الفترة</th>
                                <th>الأساسي</th>
                                <th>البدلات</th>
                                <th>الخصومات</th>
                                <th>الصافي</th>
                                <th>الحالة</th>
                                <th>إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payrolls.map(pay => (
                                <tr key={pay.id} className="pr-row">
                                    <td data-label="الموظف">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--hz-surface-2)', display: 'flex', alignItems: 'center', justifyCenter: 'center', color: '#DD6B20', fontWeight: '900' }}>
                                                {pay.employee?.user?.firstName?.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '800', color: 'var(--hz-text-bright)' }}>{pay.employee?.user?.firstName} {pay.employee?.user?.lastName}</div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--hz-text-muted)' }}>{pay.employee?.jobTitleAr}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td data-label="الفترة">
                                        <span style={{ fontWeight: '700' }}>{pay.month} / {pay.year}</span>
                                    </td>
                                    <td data-label="الأساسي">{formatAED(pay.basicSalary)}</td>
                                    <td data-label="البدلات" className="val-positive">+{formatAED(Number(pay.housingAllowance) + Number(pay.transportAllowance) + Number(pay.otherAllowances))}</td>
                                    <td data-label="الخصومات" className="val-negative">-{formatAED(pay.deductions)}</td>
                                    <td data-label="الصافي" className="val-net">{formatAED(pay.netSalary)}</td>
                                    <td data-label="الحالة">
                                        <span className={`ag-status present`}>تم الاعتماد</span>
                                    </td>
                                    <td data-label="إجراءات">
                                        <button className="ag-btn-icon" onClick={() => { setSelectedPayroll(pay); setShowSlipModal(true); }}>
                                            <FileText size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* --- PROCESS MODAL (THABAT AL-FORM) --- */}
            {showProcessModal && (
                <div className="ag-modal-overlay">
                    <div className="ag-modal" style={{ maxWidth: '650px' }}>
                        <div className="ag-modal-head">
                            <h2 style={{ fontSize: '1.1rem', fontWeight: '900' }}>معالجة مسير جديد</h2>
                            <button className="ag-btn-icon" onClick={() => setShowProcessModal(false)}><X size={20} /></button>
                        </div>

                        <div className="pr-stepper">
                            <div className={`pr-step ${activeStep === 1 ? 'active' : activeStep > 1 ? 'done' : ''}`}>
                                <div className="pr-step-circle">1</div>
                                <span className="pr-step-label">الموظف</span>
                            </div>
                            <div className={`pr-step ${activeStep === 2 ? 'active' : activeStep > 2 ? 'done' : ''}`}>
                                <div className="pr-step-circle">2</div>
                                <span className="pr-step-label">المالية</span>
                            </div>
                            <div className={`pr-step ${activeStep === 3 ? 'active' : ''}`}>
                                <div className="pr-step-circle">3</div>
                                <span className="pr-step-label">المراجعة</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="ag-modal-body">
                                {activeStep === 1 && (
                                    <div className="pr-input-group">
                                        <label className="pr-label">اختر الموظف</label>
                                        <select className="pr-select" required value={form.employeeId} onChange={e => handleEmployeeChange(e.target.value)}>
                                            <option value="">بحث عن موظف...</option>
                                            {employees.map(e => <option key={e.id} value={e.id}>{e.user?.firstName} {e.user?.lastName}</option>)}
                                        </select>
                                        <div className="pr-form-grid" style={{ marginTop: '16px' }}>
                                            <div className="pr-input-group">
                                                <label className="pr-label">الشهر</label>
                                                <input type="number" className="pr-input" value={form.month} onChange={e => setForm({ ...form, month: Number(e.target.value) })} />
                                            </div>
                                            <div className="pr-input-group">
                                                <label className="pr-label">السنة</label>
                                                <input type="number" className="pr-input" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeStep === 2 && (
                                    <div className="pr-form-grid">
                                        <div className="pr-input-group">
                                            <label className="pr-label">الراتب الأساسي</label>
                                            <input type="number" className="pr-input" value={form.basicSalary} onChange={e => setForm({ ...form, basicSalary: Number(e.target.value) })} />
                                        </div>
                                        <div className="pr-input-group">
                                            <label className="pr-label">بدل السكن</label>
                                            <input type="number" className="pr-input" value={form.housingAllowance} onChange={e => setForm({ ...form, housingAllowance: Number(e.target.value) })} />
                                        </div>
                                        <div className="pr-input-group">
                                            <label className="pr-label">بدل المواصلات</label>
                                            <input type="number" className="pr-input" value={form.transportAllowance} onChange={e => setForm({ ...form, transportAllowance: Number(e.target.value) })} />
                                        </div>
                                        <div className="pr-input-group">
                                            <label className="pr-label">الخصومات</label>
                                            <input type="number" className="pr-input" style={{ color: '#FF4D6A' }} value={form.deductions} onChange={e => setForm({ ...form, deductions: Number(e.target.value) })} />
                                        </div>
                                    </div>
                                )}

                                {activeStep === 3 && (
                                    <div style={{ background: 'rgba(221, 107, 32, 0.05)', padding: '24px', borderRadius: '16px', border: '1px dashed #DD6B20' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <span style={{ color: 'var(--hz-text-muted)' }}>إجمالي الاستحقاقات:</span>
                                            <span style={{ fontWeight: '800', color: '#00F5A0' }}>+{formatAED(form.basicSalary + form.housingAllowance + form.transportAllowance)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <span style={{ color: 'var(--hz-text-muted)' }}>إجمالي الخصومات:</span>
                                            <span style={{ fontWeight: '800', color: '#FF4D6A' }}>-{formatAED(form.deductions)}</span>
                                        </div>
                                        <div style={{ borderTop: '1px solid var(--hz-border-soft)', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: '900', color: 'var(--hz-text-bright)' }}>الصافي المستحق:</span>
                                            <span style={{ fontWeight: '900', color: '#DD6B20', fontSize: '1.4rem' }}>{formatAED((form.basicSalary + form.housingAllowance + form.transportAllowance) - form.deductions)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="ag-modal-foot">
                                {activeStep > 1 && <button type="button" className="ag-btn ag-btn-ghost" onClick={() => setActiveStep(activeStep - 1)}>السابق</button>}
                                {activeStep < 3 ? (
                                    <button type="button" className="ag-btn ag-btn-primary" onClick={() => setActiveStep(activeStep + 1)}>المتابعة</button>
                                ) : (
                                    <button type="submit" className="ag-btn ag-btn-primary">حفظ واعتماد المسير</button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showSlipModal && selectedPayroll && (
                <div className="ag-modal-overlay">
                    <div className="ag-modal" style={{ maxWidth: '450px' }}>
                        <div className="ag-modal-head">
                            <h2 style={{ fontSize: '1rem', fontWeight: '900' }}>قسيمة راتب رقم #{selectedPayroll.id.slice(0, 8)}</h2>
                            <button className="ag-btn-icon" onClick={() => setShowSlipModal(false)}><X size={20} /></button>
                        </div>
                        <div className="ag-modal-body">
                            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(221, 107, 32, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#DD6B20', marginBottom: '12px' }}>
                                    <Wallet size={32} />
                                </div>
                                <h3 style={{ fontSize: '1.2rem', color: 'var(--hz-text-bright)' }}>{formatAED(Number(selectedPayroll.netSalary))}</h3>
                                <p style={{ fontSize: '0.7rem', color: 'var(--hz-text-muted)' }}>صافي الراتب لشهر {selectedPayroll.month} / {selectedPayroll.year}</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                    <span>الراتب الأساسي</span>
                                    <span style={{ fontWeight: '700' }}>{formatAED(Number(selectedPayroll.basicSalary))}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                    <span>البدلات</span>
                                    <span style={{ fontWeight: '700', color: '#38A169' }}>+{formatAED(Number(selectedPayroll.housingAllowance) + Number(selectedPayroll.transportAllowance))}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                    <span>الاستقطاعات</span>
                                    <span style={{ fontWeight: '700', color: '#FF4D6A' }}>-{formatAED(Number(selectedPayroll.deductions))}</span>
                                </div>
                            </div>
                        </div>
                        <div className="ag-modal-foot">
                            <button className="ag-btn ag-btn-primary" style={{ width: '100%' }} onClick={() => window.print()}>
                                <Printer size={16} /> طباعة القسيمة
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        </div>
    );
}
