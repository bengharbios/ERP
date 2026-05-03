import React, { useState, useEffect } from 'react';
import {
    FileText,
    Printer,
    Eye,
    CheckCircle2,
    AlertCircle,
    X
} from 'lucide-react';
import invoiceService, { Invoice } from '../../services/invoice.service';
import financialSettingsService, { FinancialSettings } from '../../services/financial-settings.service';
import './Invoices.css';

const Invoices: React.FC = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [settings, setSettings] = useState<FinancialSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Modals
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [invRes, setRes] = await Promise.all([
                invoiceService.getAllInvoices(),
                financialSettingsService.getSettings()
            ]);
            setInvoices(invRes);
            setSettings(setRes);
        } catch (error) {
            console.error('Failed to load invoices:', error);
        } finally {
            setLoading(false);
        }
    };


    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (inv.student && (inv.student.firstNameAr + ' ' + inv.student.lastNameAr).includes(searchTerm));
        const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PAID': return 'مدفوعة';
            case 'ISSUED': return 'مرحلة';
            case 'OVERDUE': return 'متأخرة';
            default: return 'مسودة';
        }
    };

    if (loading) return <div className="flex-center h-full"><div className="next-gen-loader orange"></div></div>;

    return (
        <div className="invoices-page">
            <div className="page-header-standard">
                <div className="header-info">
                    <h1>سجل الفواتير الضريبية</h1>
                    <p>أرشيف الفواتير الصادرة والامتثال الضريبي (VAT)</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="invoices-stats">
                <div className="stat-invoice-card issued">
                    <div className="icon-box"><FileText size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-label">إجمالي المصدر</span>
                        <span className="stat-value">{invoices.length}</span>
                    </div>
                </div>
                <div className="stat-invoice-card paid">
                    <div className="icon-box"><CheckCircle2 size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-label">المحصلة</span>
                        <span className="stat-value">{invoices.filter(i => i.status === 'PAID').length}</span>
                    </div>
                </div>
                <div className="stat-invoice-card overdue">
                    <div className="icon-box"><AlertCircle size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-label">الفواتير المستحقة</span>
                        <span className="stat-value">{invoices.filter(i => i.status === 'OVERDUE').length}</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="invoices-filters">
                <div className="filter-group">
                    <label>البحث</label>
                    <div className="relative">
                        <input
                            type="text"
                            className="filter-input w-full"
                            placeholder="رقم الفاتورة، اسم الطالب..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="filter-group">
                    <label>الحالة</label>
                    <select
                        className="filter-input"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">الكل</option>
                        <option value="ISSUED">مرحلة</option>
                        <option value="PAID">مدفوعة</option>
                        <option value="OVERDUE">متأخرة</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="invoices-table-container">
                <table className="invoices-table">
                    <thead>
                        <tr>
                            <th>رقم الفاتورة</th>
                            <th>الطالب</th>
                            <th>التاريخ</th>
                            <th>المبلغ الإجمالي</th>
                            <th>الضريبة</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInvoices.map(inv => (
                            <tr key={inv.id}>
                                <td className="invoice-number">{inv.invoiceNumber}</td>
                                <td>
                                    {inv.student ? (
                                        <div className="student-info">
                                            <div>{inv.student.firstNameAr} {inv.student.lastNameAr}</div>
                                            <div className="text-xs text-slate-400">{inv.student.studentNumber}</div>
                                        </div>
                                    ) : '---'}
                                </td>
                                <td>{new Date(inv.date).toLocaleDateString('ar-AE')}</td>
                                <td>{Number(inv.totalAmount).toLocaleString()} {settings?.currency || 'AED'}</td>
                                <td>{Number(inv.vatAmount).toLocaleString()} {settings?.currency || 'AED'}</td>
                                <td>
                                    <span className={`status-pill ${inv.status.toLowerCase()}`}>
                                        {getStatusLabel(inv.status)}
                                    </span>
                                </td>
                                <td>
                                    <div className="flex gap-2">
                                        <button
                                            className="action-icon-btn"
                                            title="عرض"
                                            onClick={() => {
                                                setSelectedInvoice(inv);
                                                setShowViewModal(true);
                                            }}
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button className="action-icon-btn" title="طباعة" onClick={() => {
                                            setSelectedInvoice(inv);
                                            setTimeout(() => window.print(), 100);
                                        }}>
                                            <Printer size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>


            {/* View Modal (Tax Invoice Document) */}
            {showViewModal && selectedInvoice && (
                <div className="modal-overlay">
                    <div className="modal-content glass-effect invoice-modal-content">
                        <div className="modal-header no-print">
                            <h2>معاينة الفاتورة</h2>
                            <div className="flex gap-2">
                                <button className="btn-secondary" onClick={() => window.print()}>
                                    <Printer size={18} />
                                    <span>طباعة</span>
                                </button>
                                <button className="close-btn" onClick={() => setShowViewModal(false)}>
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="invoice-document" id="printable-invoice">
                            <div className="invoice-header">
                                <div className="company-brand">
                                    <h2>{settings?.companyNameAr || 'معهد العلم للتطوير'}</h2>
                                    <span className="brand-en">{settings?.companyNameEn || 'Science Development Institute'}</span>
                                    <div className="text-xs text-slate-500 mt-2">
                                        TRN: {selectedInvoice.trnSnapshot || settings?.trn || '---'}
                                    </div>
                                </div>
                                <div className="invoice-label">
                                    <h1>فاتورة ضريبية</h1>
                                    <div className="text-sm font-bold text-slate-500 text-left">TAX INVOICE</div>
                                    <div className="mt-4 text-left">
                                        <div className="text-xs text-slate-400">رقم الفاتورة / Invoice No</div>
                                        <div className="text-lg font-black">{selectedInvoice.invoiceNumber}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="invoice-details-grid">
                                <div className="detail-block">
                                    <h4>إلى / Bill To</h4>
                                    <div className="font-bold text-lg">
                                        {selectedInvoice.student?.firstNameAr} {selectedInvoice.student?.lastNameAr}
                                    </div>
                                    <div className="text-slate-500">
                                        {selectedInvoice.student?.firstNameEn} {selectedInvoice.student?.lastNameEn}
                                    </div>
                                    <div className="text-sm mt-1">ID: {selectedInvoice.student?.studentNumber}</div>
                                </div>
                                <div className="detail-block text-left">
                                    <h4>التاريخ / Date</h4>
                                    <div className="font-bold">{new Date(selectedInvoice.date).toLocaleDateString('ar-AE')}</div>
                                    <div className="text-slate-500">{new Date(selectedInvoice.date).toLocaleDateString('en-GB')}</div>
                                </div>
                            </div>

                            <table className="invoice-items-table">
                                <thead>
                                    <tr>
                                        <th>الوصف / Description</th>
                                        <th className="text-center">الكمية / Qty</th>
                                        <th className="text-center">السعر / Price</th>
                                        <th className="text-center">الضريبة / VAT</th>
                                        <th className="text-left">الإجمالي / Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedInvoice.items.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.description}</td>
                                            <td className="text-center">{item.quantity}</td>
                                            <td className="text-center">{Number(item.unitPrice).toLocaleString()}</td>
                                            <td className="text-center">{Number(item.vatAmount).toLocaleString()}</td>
                                            <td className="text-left font-bold">{Number(item.totalAmount).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="invoice-totals">
                                <div className="totals-box">
                                    <div className="total-row">
                                        <span>Subtotal / المجموع الفرعي</span>
                                        <span>{Number(selectedInvoice.subtotal).toLocaleString()} {settings?.currency || 'AED'}</span>
                                    </div>
                                    <div className="total-row">
                                        <span>VAT ({selectedInvoice.vatRateSnapshot}%) / الضريبة</span>
                                        <span>{Number(selectedInvoice.vatAmount).toLocaleString()} {settings?.currency || 'AED'}</span>
                                    </div>
                                    <div className="total-row grand-total">
                                        <span>Total / الإجمالي</span>
                                        <span>{Number(selectedInvoice.totalAmount).toLocaleString()} {settings?.currency || 'AED'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="invoice-footer-info">
                                <div className="bank-info-box">
                                    <h5>معلومات الدفع / Payment Info</h5>
                                    <div className="bank-details">
                                        <div>Bank: {settings?.bankName || '---'}</div>
                                        <div>IBAN: {settings?.iban || '---'}</div>
                                        <div>SWIFT: {settings?.swiftCode || '---'}</div>
                                    </div>
                                </div>
                                <div className="footer-remarks text-xs text-slate-400 leading-relaxed italic">
                                    * هذه فاتورة أصلية ولا تحتاج لختم أو توقيع.
                                    <br />
                                    This is an computer generated document and does not require signature.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Invoices;
