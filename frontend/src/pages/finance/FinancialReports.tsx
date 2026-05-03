import React, { useState } from 'react';
import {
    PieChart,
    Download,
    TrendingUp,
    Wallet,
    Activity,
    Calendar,
    Filter
} from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { ModernCard, ModernStat, ModernTable, ModernButton, ModernInput, ModernFormGroup } from '../../layouts/ModernGlobal2026/components/ModernUI';

const FinancialReports: React.FC = () => {
    const { settings } = useSettingsStore();
    const [reportType, setReportType] = useState<'trial_balance' | 'income_statement' | 'vat_report'>('income_statement');

    // Mock data for display
    const incomeData = {
        totalRevenue: 450000,
        totalExpenses: 120000,
        totalPayroll: 180000,
        netProfit: 150000
    };

    const vatData = {
        outputVat: 22500, // 5% of 450000
        inputVat: 6000,   // 5% of 120000
        payableVat: 16500
    };

    return (
        <div style={{ padding: 'var(--mg26-space-2xl)' }}>
            {/* 1. Specialized Action Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--mg26-space-2xl)' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--mg26-text-main)', margin: 0 }}>التقارير المالية الاستراتيجية</h2>
                    <p style={{ color: 'var(--mg26-text-muted)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>تحليل الأداء المالي، الرقابة الضريبية، والميزانية العمومية</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--mg26-space-md)' }}>
                    <ModernButton variant="outline" icon={<Download size={16} />}>تصدير PDF</ModernButton>
                    <ModernButton variant="primary" icon={<Filter size={16} />}>تحديث البيانات</ModernButton>
                </div>
            </div>

            {/* 2. Strategic Tabs Selection */}
            <div style={{ display: 'flex', gap: 'var(--mg26-space-md)', marginBottom: 'var(--mg26-space-2xl)' }}>
                {[
                    { id: 'income_statement', label: 'قائمة الدخل (P&L)', icon: <TrendingUp size={18} /> },
                    { id: 'trial_balance', label: 'ميزان المراجعة', icon: <Wallet size={18} /> },
                    { id: 'vat_report', label: 'تقرير ضريبة القيمة المضافة', icon: <Activity size={18} /> }
                ].map((tab) => (
                    <ModernButton
                        key={tab.id}
                        variant={reportType === tab.id ? 'primary' : 'outline'}
                        onClick={() => setReportType(tab.id as any)}
                        icon={tab.icon}
                    >
                        {tab.label}
                    </ModernButton>
                ))}
            </div>

            {/* 3. Filters Panel */}
            <ModernCard style={{ marginBottom: 'var(--mg26-space-2xl)' }}>
                <div style={{ display: 'flex', gap: 'var(--mg26-space-2xl)', alignItems: 'flex-end' }}>
                    <ModernFormGroup label="من تاريخ">
                        <ModernInput type="date" />
                    </ModernFormGroup>
                    <ModernFormGroup label="إلى تاريخ">
                        <ModernInput type="date" />
                    </ModernFormGroup>
                    <div style={{ paddingBottom: 'var(--mg26-space-xl)' }}>
                        <ModernButton variant="secondary">تطبيق التصفية</ModernButton>
                    </div>
                </div>
            </ModernCard>

            {/* 4. Report Analytics Canvas */}
            <div className="animate-fade-in">
                {reportType === 'income_statement' && (
                    <>
                        <div className="mg26-stat-grid">
                            <ModernCard>
                                <ModernStat label="إجمالي الإيرادات" value={`${incomeData.totalRevenue.toLocaleString()} ${settings?.currency || 'AED'}`} trend={{ value: '12%', direction: 'up' }} />
                            </ModernCard>
                            <ModernCard>
                                <ModernStat label="إجمالي المصاريف" value={`${(incomeData.totalExpenses + incomeData.totalPayroll).toLocaleString()} ${settings?.currency || 'AED'}`} trend={{ value: '5%', direction: 'down' }} />
                            </ModernCard>
                            <ModernCard>
                                <ModernStat label="صافي الربح" value={`${incomeData.netProfit.toLocaleString()} ${settings?.currency || 'AED'}`} trend={{ value: '8%', direction: 'up' }} />
                            </ModernCard>
                        </div>

                        <ModernCard title="تحليل قائمة الدخل">
                            <ModernTable headers={['البند المالي', `المبلغ (${settings?.currency || 'AED'})`]}>
                                <tr style={{ backgroundColor: 'rgba(0,0,0,0.01)', fontWeight: '700' }}><td colSpan={2}>الإيرادات التشغيلية</td></tr>
                                <tr><td>رسوم التسجيل والدراسة</td><td className="text-left">{incomeData.totalRevenue.toLocaleString()}</td></tr>
                                <tr style={{ fontWeight: '800', color: 'var(--mg26-primary)' }}><td>إجمالي الإيرادات (أ)</td><td className="text-left">{incomeData.totalRevenue.toLocaleString()}</td></tr>

                                <tr style={{ backgroundColor: 'rgba(0,0,0,0.01)', fontWeight: '700' }}><td colSpan={2}>المصاريف التشغيلية</td></tr>
                                <tr><td>إجمالي الرواتب والبدلات</td><td className="text-left">{incomeData.totalPayroll.toLocaleString()}</td></tr>
                                <tr><td>إيجارات ومرافق</td><td className="text-left">45,000</td></tr>
                                <tr><td>تسويق وإعلانات</td><td className="text-left">25,000</td></tr>
                                <tr style={{ fontWeight: '800', color: 'var(--mg26-error)' }}><td>إجمالي المصاريف (ب)</td><td className="text-left">{(incomeData.totalExpenses + incomeData.totalPayroll).toLocaleString()}</td></tr>

                                <tr style={{ backgroundColor: 'var(--mg26-primary-soft)', color: 'var(--mg26-primary)', fontWeight: '900', fontSize: '1.1rem' }}>
                                    <td>صافي الربح / الخسارة (أ - ب)</td>
                                    <td className="text-left">{incomeData.netProfit.toLocaleString()}</td>
                                </tr>
                            </ModernTable>
                        </ModernCard>
                    </>
                )}

                {reportType === 'vat_report' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mg26-space-2xl)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mg26-space-2xl)' }}>
                            <ModernCard title="بيانات TRN">
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--mg26-text-muted)' }}>الرقم الضريبي:</span>
                                    <strong style={{ color: 'var(--mg26-primary)' }}>{settings?.trn || '100XXXXXXXXXXXX'}</strong>
                                </div>
                            </ModernCard>
                            <ModernCard title="الفترة الضريبية">
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--mg26-text-muted)' }}>الفترة الحالية:</span>
                                    <strong>الربع الأول 2026</strong>
                                </div>
                            </ModernCard>
                        </div>

                        <div className="mg26-stat-grid">
                            <ModernCard><ModernStat label="ضريبة المخرجات" value={vatData.outputVat.toLocaleString()} /></ModernCard>
                            <ModernCard><ModernStat label="ضريبة المدخلات" value={vatData.inputVat.toLocaleString()} /></ModernCard>
                            <ModernCard style={{ borderColor: 'var(--mg26-primary)', background: 'var(--mg26-primary-soft)' }}>
                                <ModernStat label="صافي الضريبة واجبة السداد" value={vatData.payableVat.toLocaleString()} />
                            </ModernCard>
                        </div>
                    </div>
                )}

                {reportType === 'trial_balance' && (
                    <ModernCard title="ميزان المراجعة">
                        <ModernTable headers={['كود الحساب', 'اسم الحساب', 'مدين (Debit)', 'دائن (Credit)']}>
                            <tr><td>1101</td><td>النقدية بالصندوق</td><td className="text-left">45,000</td><td className="text-left">0</td></tr>
                            <tr><td>1102</td><td>بنك دبي الإسلامي</td><td className="text-left">850,000</td><td className="text-left">0</td></tr>
                            <tr><td>1201</td><td>ذمم الطلاب المدينين</td><td className="text-left">120,000</td><td className="text-left">0</td></tr>
                            <tr><td>4101</td><td>إيرادات الرسوم الدراسية</td><td className="text-left">0</td><td className="text-left">450,000</td></tr>
                        </ModernTable>
                    </ModernCard>
                )}
            </div>
        </div>
    );
};

export default FinancialReports;
