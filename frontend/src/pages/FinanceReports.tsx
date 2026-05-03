// @ts-nocheck
import React, { useState, useMemo } from 'react';
import {
    BarChart3,
    Download,
    TrendingUp,
    Wallet,
    Activity,
    Calendar,
    Filter,
    FileText,
    TrendingDown,
    ArrowRightLeft,
    ChevronDown,
    X,
    SlidersHorizontal,
    Printer,
    Table as TableIcon,
    ShieldCheck
} from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import './FinanceReports.css';

/**
 * PREMIUM FINANCE REPORTS (Rapidos 2026)
 * Strategic Financial Analysis Engine
 */

export default function FinanceReports() {
    const { settings } = useSettingsStore();
    const [reportType, setReportType] = useState<'trial_balance' | 'income_statement' | 'vat_report'>('income_statement');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Mock data for display (Same as original but structure for rendering)
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

    const currency = settings?.currency || 'AED';

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(val) + ' ' + currency;
    };

    const SidebarContent = () => (
        <>
            <div className="ag-sidebar-head">
                <span className="ag-sidebar-head-title">تصفية التقارير</span>
                <button className="mobile-only ag-btn-icon" onClick={() => setShowMobileFilters(false)}>
                    <X size={18} />
                </button>
            </div>
            <div className="ag-sidebar-pane">
                <div className="ag-filter-group">
                    <span className="ag-filter-label">نوع التقرير</span>
                    <select
                        className="ag-select"
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value as any)}
                    >
                        <option value="income_statement">قائمة الدخل (P&L)</option>
                        <option value="trial_balance">ميزان المراجعة</option>
                        <option value="vat_report">تقرير ضريبة القيمة المضافة</option>
                    </select>
                </div>

                <div className="ag-filter-group">
                    <span className="ag-filter-label">من تاريخ</span>
                    <input
                        type="date"
                        className="ag-input"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                    />
                </div>

                <div className="ag-filter-group">
                    <span className="ag-filter-label">إلى تاريخ</span>
                    <input
                        type="date"
                        className="ag-input"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                    />
                </div>

                <button className="ag-btn ag-btn-primary" style={{ marginTop: 'auto', width: '100%', justifyContent: 'center' }}>
                    تحديث التقرير
                </button>
            </div>
        </>
    );

    return (
        <div className="ag-root">
            {/* ── HEADER ── */}
            <div className="ag-header">
                <div className="ag-header-left">
                    <h1 className="ag-title">
                        <BarChart3 size={20} /> التقارير المالية
                    </h1>
                </div>
                <div className="ag-header-right">
                    <button className="ag-btn-icon hide-mobile" title="طباعة">
                        <Printer size={16} />
                    </button>
                    <button className="ag-btn ag-btn-ghost hide-mobile">
                        <Download size={16} /> تصدير PDF
                    </button>
                    <button className="ag-btn-icon mobile-only" onClick={() => setShowMobileFilters(true)}>
                        <SlidersHorizontal size={16} />
                    </button>
                </div>
            </div>

            <div className="ag-body">
                {/* Mobile Filter Overlay */}
                <div className={`ag-sidebar-overlay ${showMobileFilters ? 'show' : ''}`} onClick={() => setShowMobileFilters(false)} />

                {/* Sidebar */}
                <aside className={`ag-sidebar ${showMobileFilters ? 'show' : ''}`}>
                    <SidebarContent />
                </aside>

                {/* Main Content Area */}
                <main className="ag-main">

                    {/* View Modes Selection (Tactical Tabs) */}
                    <div className="ag-tabs">
                        <button
                            className={`ag-tab-btn ${reportType === 'income_statement' ? 'active' : ''}`}
                            onClick={() => setReportType('income_statement')}
                        >
                            <TrendingUp size={16} /> <span className="hide-mobile">قائمة الدخل</span>
                        </button>
                        <button
                            className={`ag-tab-btn ${reportType === 'trial_balance' ? 'active' : ''}`}
                            onClick={() => setReportType('trial_balance')}
                        >
                            <Wallet size={16} /> <span className="hide-mobile">ميزان المراجعة</span>
                        </button>
                        <button
                            className={`ag-tab-btn ${reportType === 'vat_report' ? 'active' : ''}`}
                            onClick={() => setReportType('vat_report')}
                        >
                            <Activity size={16} /> <span className="hide-mobile">التقرير الضريبي</span>
                        </button>
                    </div>

                    {/* Stats Summary Grid */}
                    <div className="ag-stats-grid">
                        {reportType === 'income_statement' && (
                            <>
                                <div className="ag-stat-card">
                                    <div className="ag-stat-icon revenue"><TrendingUp size={24} /></div>
                                    <div className="ag-stat-info">
                                        <h3>{formatCurrency(incomeData.totalRevenue)}</h3>
                                        <p>إجمالي الإيرادات</p>
                                    </div>
                                </div>
                                <div className="ag-stat-card">
                                    <div className="ag-stat-icon expense"><TrendingDown size={24} /></div>
                                    <div className="ag-stat-info">
                                        <h3>{formatCurrency(incomeData.totalExpenses + incomeData.totalPayroll)}</h3>
                                        <p>إجمالي المصاريف</p>
                                    </div>
                                </div>
                                <div className="ag-stat-card">
                                    <div className="ag-stat-icon profit"><FileText size={24} /></div>
                                    <div className="ag-stat-info">
                                        <h3>{formatCurrency(incomeData.netProfit)}</h3>
                                        <p>صافي الرباح</p>
                                    </div>
                                </div>
                            </>
                        )}

                        {reportType === 'vat_report' && (
                            <>
                                <div className="ag-stat-card">
                                    <div className="ag-stat-icon revenue"><Activity size={24} /></div>
                                    <div className="ag-stat-info">
                                        <h3>{formatCurrency(vatData.outputVat)}</h3>
                                        <p>ضريبة المخرجات</p>
                                    </div>
                                </div>
                                <div className="ag-stat-card">
                                    <div className="ag-stat-icon expense"><Activity size={24} /></div>
                                    <div className="ag-stat-info">
                                        <h3>{formatCurrency(vatData.inputVat)}</h3>
                                        <p>ضريبة المدخلات</p>
                                    </div>
                                </div>
                                <div className="ag-stat-card">
                                    <div className="ag-stat-icon profit"><ShieldCheck size={24} /></div>
                                    <div className="ag-stat-info">
                                        <h3>{formatCurrency(vatData.payableVat)}</h3>
                                        <p>صافي الضريبة المستحقة</p>
                                    </div>
                                </div>
                            </>
                        )}

                        {reportType === 'trial_balance' && (
                            <>
                                <div className="ag-stat-card">
                                    <div className="ag-stat-icon"><ArrowRightLeft size={24} color="#3B82F6" /></div>
                                    <div className="ag-stat-info">
                                        <h3>4 الحسابات</h3>
                                        <p>إجمالي الحسابات المتحركة</p>
                                    </div>
                                </div>
                                <div className="ag-stat-card">
                                    <div className="ag-stat-icon"><TableIcon size={24} color="#10B981" /></div>
                                    <div className="ag-stat-info">
                                        <h3>{formatCurrency(1015000)}</h3>
                                        <p>إجمالي الأرصدة المدينة</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Main Section Content */}
                    <div className="ag-report-section">
                        <div className="ag-section-head">
                            <span className="ag-section-title">
                                {reportType === 'income_statement' && 'تفاصيل قائمة الدخل والنمو النقدي'}
                                {reportType === 'trial_balance' && 'كشف أرصدة ميزان المراجعة العمومي'}
                                {reportType === 'vat_report' && 'الإقرارات الضريبية والبيانات المرجعية'}
                            </span>
                            <div className="ag-header-right">
                                <button className="ag-btn-icon"><Printer size={14} /></button>
                                <button className="ag-btn-icon"><Download size={14} /></button>
                            </div>
                        </div>

                        {reportType === 'vat_report' && (
                            <div className="ag-vat-grid">
                                <div className="ag-info-box">
                                    <span className="ag-info-label">الرقم الضريبي للمنشأة TRN:</span>
                                    <span className="ag-info-val">{settings?.trn || '100XXXXXXXXXXXX'}</span>
                                </div>
                                <div className="ag-info-box">
                                    <span className="ag-info-label">المرحلة الضريبية الحالية:</span>
                                    <span className="ag-info-val">الربع الأول 2026</span>
                                </div>
                            </div>
                        )}

                        <div className="ag-table-wrap">
                            <table className="ag-table">
                                {reportType === 'income_statement' && (
                                    <>
                                        <thead>
                                            <tr>
                                                <th>البند المحاسبي</th>
                                                <th>المستوى الأصلي</th>
                                                <th className="text-left">القيمة ({currency})</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="ag-row-group">
                                                <td colSpan={3}>إيرادات التشغيل الأكاديمية</td>
                                            </tr>
                                            <tr>
                                                <td>رسوم التسجيل والدراسة للمواد</td>
                                                <td>Direct Sales</td>
                                                <td className="text-left">{incomeData.totalRevenue.toLocaleString()}</td>
                                            </tr>
                                            <tr className="ag-row-total">
                                                <td>إجمالي الإيرادات (Gross Revenue)</td>
                                                <td>-</td>
                                                <td className="text-left">{incomeData.totalRevenue.toLocaleString()}</td>
                                            </tr>
                                            <tr className="ag-row-group">
                                                <td colSpan={3}>المصاريف التشغيلية والإدارية</td>
                                            </tr>
                                            <tr>
                                                <td>إجمالي الرواتب والبدلات</td>
                                                <td>HR Cost</td>
                                                <td className="text-left">{incomeData.totalPayroll.toLocaleString()}</td>
                                            </tr>
                                            <tr>
                                                <td>إيجارات المكاتب والمرافق الخدمية</td>
                                                <td>Fixed Costs</td>
                                                <td className="text-left">45,000</td>
                                            </tr>
                                            <tr>
                                                <td>حملات تسويقية وإعلانات رقمية</td>
                                                <td>Variable Costs</td>
                                                <td className="text-left">25,000</td>
                                            </tr>
                                            <tr className="ag-row-total" style={{ color: '#EF4444' }}>
                                                <td>إجمالي المصاريف (Total OpEx)</td>
                                                <td>-</td>
                                                <td className="text-left">{(incomeData.totalExpenses + incomeData.totalPayroll).toLocaleString()}</td>
                                            </tr>
                                            <tr className="ag-row-grand">
                                                <td>صافي الربح / الخسارة (Net Operating Income)</td>
                                                <td>Result</td>
                                                <td className="text-left">{formatCurrency(incomeData.netProfit)}</td>
                                            </tr>
                                        </tbody>
                                    </>
                                )}

                                {reportType === 'trial_balance' && (
                                    <>
                                        <thead>
                                            <tr>
                                                <th>كود الحساب</th>
                                                <th>اسم الحساب المالي</th>
                                                <th className="text-center">مدين (Debit)</th>
                                                <th className="text-center">دائن (Credit)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>1101</td>
                                                <td>النقدية بالمعهد (Main Safe)</td>
                                                <td className="text-center">45,000</td>
                                                <td className="text-center">0</td>
                                            </tr>
                                            <tr>
                                                <td>1102</td>
                                                <td>الحساب البنكي (DIB Bank)</td>
                                                <td className="text-center">850,000</td>
                                                <td className="text-center">0</td>
                                            </tr>
                                            <tr>
                                                <td>1201</td>
                                                <td>ذمم الطلاب المدينين</td>
                                                <td className="text-center">120,000</td>
                                                <td className="text-center">0</td>
                                            </tr>
                                            <tr>
                                                <td>4101</td>
                                                <td>إيرادات الرسوم الدراسية المحصلة</td>
                                                <td className="text-center">0</td>
                                                <td className="text-center">450,000</td>
                                            </tr>
                                            <tr className="ag-row-grand">
                                                <td colSpan={2}>إجمالي أرصدة ميزان المراجعة</td>
                                                <td className="text-center">{formatCurrency(1015000)}</td>
                                                <td className="text-center">{formatCurrency(450000)}</td>
                                            </tr>
                                        </tbody>
                                    </>
                                )}

                                {reportType === 'vat_report' && (
                                    <>
                                        <thead>
                                            <tr>
                                                <th>نوع العملية</th>
                                                <th>الوصف الضريبي</th>
                                                <th className="text-left">قيمة الضريبة ({currency})</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>ضريبة المخرجات (Output VAT)</td>
                                                <td>ضريبة على مبيعات الدورات والخدمات (5%)</td>
                                                <td className="text-left">{vatData.outputVat.toLocaleString()}</td>
                                            </tr>
                                            <tr>
                                                <td>ضريبة المدخلات (Input VAT)</td>
                                                <td>ضريبة على المشتريات والمصاريف المستردة</td>
                                                <td className="text-left">{vatData.inputVat.toLocaleString()}</td>
                                            </tr>
                                            <tr className="ag-row-grand">
                                                <td>صافي الضريبة واجبة السداد</td>
                                                <td>Tax Liability</td>
                                                <td className="text-left">{formatCurrency(vatData.payableVat)}</td>
                                            </tr>
                                        </tbody>
                                    </>
                                )}
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
