// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    Search, FileText, Eye, Printer,
    CheckCircle2, AlertCircle, X, SlidersHorizontal,
    RefreshCw, Calendar, User, DollarSign,
    ShieldCheck, Download, Filter,
    ArrowLeftRight, FileStack
} from 'lucide-react';
import invoiceService, { Invoice } from '../services/invoice.service';
import financialSettingsService, { FinancialSettings } from '../services/financial-settings.service';
import { useSettingsStore } from '../store/settingsStore';
import { Toast, ToastType } from '../components/Toast';
import './FinanceInvoices.css';

export default function FinanceInvoices() {
    // --- Data States ---
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [finSettings, setFinSettings] = useState<FinancialSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

    // --- UI/Filter States ---
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // --- Modal States ---
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    const { settings } = useSettingsStore();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [invRes, setRes] = await Promise.all([
                invoiceService.getAllInvoices(),
                financialSettingsService.getSettings()
            ]);
            setInvoices(invRes || []);
            setFinSettings(setRes);
        } catch (error) {
            console.error('Failed to load invoices:', error);
            setToast({ type: 'error', message: '❌ فشل تحميل بيانات الفواتير' });
        } finally {
            setLoading(false);
        }
    };

    // --- Logic ---
    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PAID': return 'مدفوعة';
            case 'ISSUED': return 'مرحلة';
            case 'OVERDUE': return 'متأخرة';
            default: return 'مسودة';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return '#10B981';
            case 'ISSUED': return '#3B82F6';
            case 'OVERDUE': return '#EF4444';
            default: return '#6B7280';
        }
    };

    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const studentName = inv.student ? `${inv.student.firstNameAr} ${inv.student.lastNameAr}`.toLowerCase() : '';
            const matchesSearch = !searchTerm ||
                inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                studentName.includes(searchTerm.toLowerCase()) ||
                inv.student?.studentNumber?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [invoices, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        return {
            total: invoices.length,
            paid: invoices.filter(i => i.status === 'PAID').length,
            overdue: invoices.filter(i => i.status === 'OVERDUE').length,
            totalAmount: invoices.reduce((sum, i) => sum + Number(i.totalAmount), 0)
        };
    }, [invoices]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount) + ' ' + (settings?.currency || 'AED');
    };

    const SidebarContent = () => (
        <>
            <div className="ag-sidebar-head">
                <span className="ag-sidebar-head-title">الفلاتر والأدوات</span>
                <button className="ag-sidebar-head-close" onClick={() => setShowMobileFilters(false)}>
                    <X size={18} />
                </button>
            </div>
            <div className="ag-sidebar-pane">
                <div className="ag-filter-group">
                    <span className="ag-filter-label">البحث السريع</span>
                    <div className="ag-search">
                        <Search size={14} />
                        <input
                            type="text"
                            placeholder="رقم الفاتورة، اسم الطالب..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="ag-filter-group">
                    <span className="ag-filter-label">حالة الفاتورة</span>
                    <select className="ag-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="ALL">كل الحالات</option>
                        <option value="ISSUED">مرحلة (Issued)</option>
                        <option value="PAID">مدفوعة (Paid)</option>
                        <option value="OVERDUE">متأخرة (Overdue)</option>
                        <option value="DRAFT">مسودة (Draft)</option>
                    </select>
                </div>

                <div className="ag-divider" />

                <button className="ag-btn ag-btn-ghost" style={{ width: '100%', marginTop: 'auto' }} onClick={loadData}>
                    <RefreshCw size={14} /> تحديث البيانات
                </button>
            </div>
        </>
    );

    return (
        <div className="ag-root">
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            {/* ── HEADER ── */}
            <div className="ag-header">
                <div className="ag-header-left">
                    <h1 className="ag-title">
                        <span className="hide-mobile"><FileStack size={20} /></span> الفواتير الضريبية
                    </h1>
                    <div className="ag-mini-stats hide-mobile">
                        <div className="ag-stat-pill">
                            <span>الإجمالي All-Time:</span>
                            <span className="ag-stat-val">{formatCurrency(stats.totalAmount)}</span>
                        </div>
                        <div className="ag-stat-pill" style={{ borderColor: 'var(--hz-orange)' }}>
                            <span style={{ color: 'var(--hz-orange)' }}>المصدر:</span>
                            <span className="ag-stat-val">{stats.total}</span>
                        </div>
                    </div>
                </div>
                <div className="ag-header-right">
                    <button className="ag-btn-icon hide-mobile" title="تصدير" onClick={() => console.log('Export')}>
                        <Download size={16} />
                    </button>
                    <button className="ag-btn-icon mobile-only" title="تصفية" onClick={() => setShowMobileFilters(true)}>
                        <SlidersHorizontal size={16} />
                    </button>
                    <div className="hide-mobile">
                        <div className="stat-quick-info">
                            <span className="badge-paid">{stats.paid} مدفوع</span>
                            <span className="badge-overdue">{stats.overdue} متأخر</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── BODY ── */}
            <div className="ag-body">
                {/* Mobile Sidebar Overlay */}
                <div className={`ag-sidebar-overlay ${showMobileFilters ? 'show' : ''}`} onClick={() => setShowMobileFilters(false)} />

                {/* Sidebar */}
                <div className={`ag-sidebar ${showMobileFilters ? 'show' : ''}`}>
                    <SidebarContent />
                </div>

                {/* Main Content */}
                <div className="ag-main">
                    <div className="ag-table-wrap">
                        <table className="ag-table">
                            <thead>
                                <tr>
                                    <th>رقم الفاتورة</th>
                                    <th>الطالب</th>
                                    <th>التاريخ</th>
                                    <th>الإجمالي (+ض)</th>
                                    <th>الضريبة</th>
                                    <th>الحالة</th>
                                    <th className="text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} className="text-center" style={{ padding: '60px' }}>جاري التحميل...</td></tr>
                                ) : filteredInvoices.length > 0 ? (
                                    filteredInvoices.map(inv => (
                                        <tr key={inv.id}>
                                            <td>
                                                <div className="ag-id-pill">#{inv.invoiceNumber}</div>
                                            </td>
                                            <td>
                                                {inv.student ? (
                                                    <div className="ag-student-cell">
                                                        <div className="ag-student-name">{inv.student.firstNameAr} {inv.student.lastNameAr}</div>
                                                        <div className="ag-student-id">{inv.student.studentNumber}</div>
                                                    </div>
                                                ) : '---'}
                                            </td>
                                            <td>
                                                <div className="ag-date-cell">
                                                    <Calendar size={14} />
                                                    {new Date(inv.date).toLocaleDateString('ar-AE')}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="ag-amount-badge">
                                                    {formatCurrency(Number(inv.totalAmount))}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="ag-vat-info">
                                                    {formatCurrency(Number(inv.vatAmount))}
                                                    <small>({inv.vatRateSnapshot}%)</small>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`ag-status-badge`} style={{
                                                    background: `${getStatusColor(inv.status)}15`,
                                                    color: getStatusColor(inv.status),
                                                    border: `1px solid ${getStatusColor(inv.status)}30`
                                                }}>
                                                    {getStatusLabel(inv.status)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="ag-table-actions">
                                                    <button className="ag-action-btn view" title="معاينة" onClick={() => { setSelectedInvoice(inv); setShowViewModal(true); }}>
                                                        <Eye size={16} />
                                                    </button>
                                                    <button className="ag-action-btn print" title="طباعة" onClick={() => { setSelectedInvoice(inv); setTimeout(() => window.print(), 100); }}>
                                                        <Printer size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7}>
                                            <div className="ag-empty">
                                                <FileText size={40} opacity={0.2} />
                                                <p>لا توجد فواتير مطابقة لخيارات البحث</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── MODALS ── */}

            {/* View Invoice Modal */}
            {showViewModal && selectedInvoice && createPortal(
                <div className="ag-modal-overlay" onClick={() => setShowViewModal(false)}>
                    <div className="ag-modal" style={{ maxWidth: '900px' }} onClick={e => e.stopPropagation()}>
                        <div className="ag-modal-head no-print">
                            <div className="ag-modal-title">
                                <div className="ag-avatar" style={{ background: 'var(--hz-surface-3)', width: '40px', height: '40px' }}>
                                    <FileText size={20} color="var(--hz-orange)" />
                                </div>
                                <div>
                                    <h3>معاينة الفاتورة الضريبية</h3>
                                    <p>مراجعة تفاصيل الفاتورة والامتثال لضريبة القيمة المضافة</p>
                                </div>
                            </div>
                            <div className="ag-modal-actions">
                                <button className="ag-btn ag-btn-ghost" onClick={() => window.print()}>
                                    <Printer size={16} /> طباعة
                                </button>
                                <button className="ag-btn-icon" onClick={() => setShowViewModal(false)}><X size={20} /></button>
                            </div>
                        </div>
                        <div className="ag-modal-body">
                            <div className="ag-invoice-paper" id="printable-invoice">
                                <div className="ag-inv-header">
                                    <div className="ag-inv-branding">
                                        <h2>{finSettings?.companyNameAr || settings?.instituteNameAr || 'معهد العلم للتطوير'}</h2>
                                        <p className="en-name">{finSettings?.companyNameEn || 'Science Development Institute'}</p>
                                        <div className="trn-badge">الرقم الضريبي TRN: {selectedInvoice.trnSnapshot || finSettings?.trn || '---'}</div>
                                    </div>
                                    <div className="ag-inv-label-box">
                                        <h1>فاتورة ضريبية</h1>
                                        <div className="en-label">TAX INVOICE</div>
                                        <div className="inv-meta">
                                            <div className="meta-item">
                                                <span>رقم الفاتورة / No:</span>
                                                <strong>{selectedInvoice.invoiceNumber}</strong>
                                            </div>
                                            <div className="meta-item">
                                                <span>التاريخ / Date:</span>
                                                <strong>{new Date(selectedInvoice.date).toLocaleDateString('ar-AE')}</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="ag-inv-billing">
                                    <div className="billing-block">
                                        <h4 className="block-title">العميل / Bill To</h4>
                                        <div className="client-info">
                                            <div className="client-name">{selectedInvoice.student?.firstNameAr} {selectedInvoice.student?.lastNameAr}</div>
                                            <div className="client-name-en">{selectedInvoice.student?.firstNameEn} {selectedInvoice.student?.lastNameEn}</div>
                                            <div className="client-meta">رقم الطالب: {selectedInvoice.student?.studentNumber}</div>
                                        </div>
                                    </div>
                                    <div className="billing-block text-left">
                                        <h4 className="block-title">تفاصيل المؤسسة</h4>
                                        <div className="inst-info">
                                            <div>{settings?.instituteAddress || '---'}</div>
                                            <div>{settings?.institutePhone || '---'}</div>
                                            <div>{settings?.instituteEmail || '---'}</div>
                                        </div>
                                    </div>
                                </div>

                                <table className="ag-inv-items">
                                    <thead>
                                        <tr>
                                            <th>الوصف / Description</th>
                                            <th className="center">الكمية</th>
                                            <th className="center">السعر</th>
                                            <th className="center">الضريبة</th>
                                            <th className="left">الإجمالي</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedInvoice.items.map(item => (
                                            <tr key={item.id}>
                                                <td>{item.description}</td>
                                                <td className="center">{item.quantity}</td>
                                                <td className="center">{Number(item.unitPrice).toLocaleString()}</td>
                                                <td className="center">{Number(item.vatAmount).toLocaleString()}</td>
                                                <td className="left strong">{Number(item.totalAmount).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="ag-inv-totals">
                                    <div className="totals-wrap">
                                        <div className="total-row">
                                            <span>Subtotal / المجموع الفرعي</span>
                                            <span>{Number(selectedInvoice.subtotal).toLocaleString()} {settings?.currency || 'AED'}</span>
                                        </div>
                                        <div className="total-row">
                                            <span>VAT ({selectedInvoice.vatRateSnapshot}%) / الضريبة</span>
                                            <span>{Number(selectedInvoice.vatAmount).toLocaleString()} {settings?.currency || 'AED'}</span>
                                        </div>
                                        <div className="total-row grand">
                                            <span>Total / الإجمالي</span>
                                            <span>{Number(selectedInvoice.totalAmount).toLocaleString()} {settings?.currency || 'AED'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="ag-inv-footer">
                                    <div className="payment-guide">
                                        <h5>تعليمات الدفع / Payment info</h5>
                                        <div className="guide-content">
                                            <div>البنك: {finSettings?.bankName || '---'}</div>
                                            <div>رقم الآيبان: {finSettings?.iban || '---'}</div>
                                            <div>كود السويفت: {finSettings?.swiftCode || '---'}</div>
                                        </div>
                                    </div>
                                    <div className="official-note">
                                        هذه فاتورة إلكترونية صريحة من النظام ولا تتطلب ختماً أو توقيعاً.
                                        <br />
                                        Electronic invoice generated via system, no signature required.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
