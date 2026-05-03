// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    Plus, Search, FileText, Trash2, Check,
    AlertCircle, Calendar, Download, Filter,
    SlidersHorizontal, X, RefreshCw, Bookmark,
    ArrowRightLeft, Hash, Info, ChevronDown
} from 'lucide-react';
import journalService, { JournalEntry, CreateJournalEntryData } from '../services/journal.service';
import accountService, { Account } from '../services/account.service';
import { useSettingsStore } from '../store/settingsStore';
import { Toast, ToastType } from '../components/Toast';
import './FinanceJournalEntries.css';

export default function FinanceJournalEntries() {
    // --- Data States ---
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

    // --- UI/Filter States ---
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // --- Modal States ---
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<CreateJournalEntryData>({
        date: new Date().toISOString().split('T')[0],
        description: '',
        reference: '',
        lines: [
            { accountId: '', description: '', debit: 0, credit: 0 },
            { accountId: '', description: '', debit: 0, credit: 0 }
        ]
    });

    const { settings } = useSettingsStore();

    // --- Load Data ---
    useEffect(() => {
        loadEntries();
        loadAccounts();
    }, []);

    const loadEntries = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (searchTerm) params.search = searchTerm;
            if (startDate) params.startDate = new Date(startDate).toISOString();
            if (endDate) params.endDate = new Date(endDate).toISOString();
            params.limit = 100;

            const result = await journalService.getJournalEntries(params);
            setEntries(result || []);
        } catch (error) {
            console.error('Error loading entries:', error);
            setToast({ type: 'error', message: '❌ فشل تحميل القيود اليومية' });
        } finally {
            setLoading(false);
        }
    };

    const loadAccounts = async () => {
        try {
            const result = await accountService.getAccounts({ isActive: true });
            setAccounts(result || []);
        } catch (error) {
            console.error('Error loading accounts:', error);
        }
    };

    // --- Form Logic ---
    const handleLineChange = (index: number, field: string, value: any) => {
        const newLines = [...formData.lines];
        newLines[index] = { ...newLines[index], [field]: value };

        if (field === 'debit' && Number(value) > 0) {
            newLines[index].credit = 0;
        } else if (field === 'credit' && Number(value) > 0) {
            newLines[index].debit = 0;
        }

        setFormData({ ...formData, lines: newLines });
    };

    const addLine = () => {
        setFormData({
            ...formData,
            lines: [...formData.lines, { accountId: '', description: '', debit: 0, credit: 0 }]
        });
    };

    const removeLine = (index: number) => {
        if (formData.lines.length <= 2) return;
        setFormData({
            ...formData,
            lines: formData.lines.filter((_, i) => i !== index)
        });
    };

    const totals = useMemo(() => {
        const dr = formData.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
        const cr = formData.lines.reduce((s, l) => s + Number(l.credit || 0), 0);
        return { dr, cr, balanced: Math.abs(dr - cr) < 0.01 };
    }, [formData.lines]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!totals.balanced) {
            setToast({ type: 'error', message: '⚠️ القيد غير متوازن' });
            return;
        }
        if (totals.dr === 0) {
            setToast({ type: 'error', message: '⚠️ لا يمكن حفظ قيد صفري' });
            return;
        }

        try {
            setIsSubmitting(true);
            const payload = {
                ...formData,
                date: new Date(formData.date).toISOString(),
                lines: formData.lines.map(l => ({
                    ...l,
                    debit: Number(l.debit),
                    credit: Number(l.credit)
                }))
            };
            await journalService.createJournalEntry(payload);
            setToast({ type: 'success', message: '✅ تم إنشاء القيد بنجاح' });
            setShowModal(false);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                description: '',
                reference: '',
                lines: [
                    { accountId: '', description: '', debit: 0, credit: 0 },
                    { accountId: '', description: '', debit: 0, credit: 0 }
                ]
            });
            loadEntries();
        } catch (err) {
            setToast({ type: 'error', message: '❌ فشل حفظ القيد' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePost = async (id: string) => {
        if (!window.confirm('هل تريد ترحيل هذه العملية فعلياً للحسابات؟')) return;
        try {
            await journalService.postJournalEntry(id);
            setToast({ type: 'success', message: '✅ تم ترحيل القيد بنجاح' });
            loadEntries();
        } catch (err) {
            setToast({ type: 'error', message: '❌ فشل ترحيل القيد' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف القيد؟')) return;
        try {
            await journalService.deleteJournalEntry(id);
            setToast({ type: 'success', message: '✅ تم الحذف بنجاح' });
            loadEntries();
        } catch (err) {
            setToast({ type: 'error', message: '❌ لا يمكن حذف القيد (ربما تم ترحيله)' });
        }
    };

    // --- Stats ---
    const entryStats = useMemo(() => {
        const total = entries.length;
        const posted = entries.filter(e => e.isPosted).length;
        const value = entries.reduce((s, e) => s + e.lines.reduce((lS, l) => lS + Number(l.debit), 0), 0);
        return { total, posted, draft: total - posted, value };
    }, [entries]);

    const formatCurr = (v: number) => {
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(v) + ' ' + (settings?.currency || 'AED');
    };

    const SidebarContent = () => (
        <>
            <div className="ag-sidebar-head">
                <span className="ag-sidebar-head-title">تصفية القيود</span>
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
                            placeholder="الرقم، البيان..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="ag-filter-group">
                    <span className="ag-filter-label">من تاريخ</span>
                    <input type="date" className="ag-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>

                <div className="ag-filter-group">
                    <span className="ag-filter-label">إلى تاريخ</span>
                    <input type="date" className="ag-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>

                <button className="ag-btn ag-btn-primary" style={{ marginTop: 'auto' }} onClick={loadEntries}>
                    <RefreshCw size={14} /> تحديث القائمة
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
                        <ArrowRightLeft size={20} /> القيود اليومية
                    </h1>
                    <div className="ag-mini-stats hide-mobile">
                        <div className="ag-stat-pill">
                            <span className="label">الإجمالي:</span>
                            <span className="val">{entryStats.total}</span>
                        </div>
                        <div className="ag-stat-pill">
                            <span className="label">القيمة:</span>
                            <span className="val highlight">{formatCurr(entryStats.value)}</span>
                        </div>
                    </div>
                </div>
                <div className="ag-header-right">
                    <button className="ag-btn-icon mobile-only" onClick={() => setShowMobileFilters(true)}>
                        <SlidersHorizontal size={16} />
                    </button>
                    <button className="ag-btn ag-btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={16} /> <span className="hide-mobile">إضافة قيد</span>
                    </button>
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

                <div className="ag-main">
                    {/* Stats Grid */}
                    <div className="ag-stats-grid">
                        <div className="ag-stat-card">
                            <div className="ag-stat-icon dr"> <Bookmark size={20} /> </div>
                            <div className="ag-stat-info">
                                <h3>{entryStats.posted}</h3>
                                <p>مرحلة (Posted)</p>
                            </div>
                        </div>
                        <div className="ag-stat-card">
                            <div className="ag-stat-icon cr"> <AlertCircle size={20} /> </div>
                            <div className="ag-stat-info">
                                <h3>{entryStats.draft}</h3>
                                <p>مسودة (Draft)</p>
                            </div>
                        </div>
                    </div>

                    <div className="ag-table-wrap">
                        <table className="ag-table">
                            <thead>
                                <tr>
                                    <th>رقم القيد</th>
                                    <th>التاريخ</th>
                                    <th>البيان / الوصف</th>
                                    <th className="text-center">القيمة</th>
                                    <th className="text-center">الحالة</th>
                                    <th className="text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="text-center">جاري التحميل...</td></tr>
                                ) : entries.length > 0 ? (
                                    entries.map(entry => {
                                        const entryTotal = entry.lines.reduce((s, l) => s + Number(l.debit), 0);
                                        return (
                                            <tr key={entry.id}>
                                                <td><span className="ag-id-badge">#{entry.entryNumber}</span></td>
                                                <td>
                                                    <div className="ag-date-cell">
                                                        <Calendar size={13} />
                                                        {new Date(entry.date).toLocaleDateString('ar-AE')}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="ag-desc-cell" title={entry.description}>
                                                        {entry.description}
                                                    </div>
                                                </td>
                                                <td className="text-center"><strong className="ag-val-text">{formatCurr(entryTotal)}</strong></td>
                                                <td className="text-center">
                                                    <span className={`ag-status-badge ${entry.isPosted ? 'posted' : 'draft'}`}>
                                                        {entry.isPosted ? 'مرحّل' : 'مسودة'}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <div className="ag-action-group">
                                                        {!entry.isPosted && (
                                                            <>
                                                                <button className="ag-mini-btn confirm" title="ترحيل" onClick={() => handlePost(entry.id)}>
                                                                    <Check size={14} />
                                                                </button>
                                                                <button className="ag-mini-btn delete" title="حذف" onClick={() => handleDelete(entry.id)}>
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </>
                                                        )}
                                                        <button className="ag-mini-btn" title="معاينة">
                                                            <Download size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    <tr><td colSpan={6} className="text-center">لا يوجد بيانات</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── MODAL ── */}
            {showModal && createPortal(
                <div className="ag-modal-overlay" onClick={() => !isSubmitting && setShowModal(false)}>
                    <div className="ag-modal" style={{ maxWidth: '900px' }} onClick={e => e.stopPropagation()}>
                        <div className="ag-modal-head">
                            <div className="ag-modal-title">
                                <div className="ag-avatar-icon"> <ArrowRightLeft size={20} /> </div>
                                <div>
                                    <h3>قيد يومية جديد</h3>
                                    <p>تسجيل عملية مالية مركبة (مدين / دائن)</p>
                                </div>
                            </div>
                            <button className="ag-close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="ag-modal-body">
                                <div className="ag-form-row cols-3">
                                    <div className="ag-form-group">
                                        <label>تاريخ القيد*</label>
                                        <input type="date" className="ag-input" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                                    </div>
                                    <div className="ag-form-group">
                                        <label>المرجع / السند</label>
                                        <div className="ag-input-icon">
                                            <Hash size={14} />
                                            <input type="text" className="ag-input" placeholder="Ref-001" value={formData.reference} onChange={e => setFormData({ ...formData, reference: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="ag-form-group">
                                        <label>دفتر اليومية</label>
                                        <select className="ag-input"><option>يومية عامة</option></select>
                                    </div>
                                </div>

                                <div className="ag-form-group" style={{ marginBottom: '24px' }}>
                                    <label>البيان العام (Description)*</label>
                                    <textarea className="ag-input" rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required placeholder="شرح القيد اليومي..." />
                                </div>

                                <div className="ag-lines-section">
                                    <div className="ag-section-header">
                                        <span>تفاصيل أسطر القيد</span>
                                        <div className={`ag-balance-indicator ${totals.balanced ? 'balanced' : 'unbalanced'}`}>
                                            {totals.balanced ? <Check size={12} /> : <Info size={12} />}
                                            {totals.balanced ? 'القيد متوازن' : 'القيد غير متوازن'}
                                        </div>
                                    </div>

                                    <div className="ag-lines-table-wrap">
                                        <table className="ag-lines-table">
                                            <thead>
                                                <tr>
                                                    <th>الحساب المالي</th>
                                                    <th>البيان (اختياري)</th>
                                                    <th style={{ width: 120 }}>مدين (Debit)</th>
                                                    <th style={{ width: 120 }}>دائن (Credit)</th>
                                                    <th style={{ width: 40 }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formData.lines.map((line, idx) => (
                                                    <tr key={idx}>
                                                        <td>
                                                            <select className="ag-select-mini" value={line.accountId} onChange={e => handleLineChange(idx, 'accountId', e.target.value)} required>
                                                                <option value="">اختر حساب...</option>
                                                                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.nameAr}</option>)}
                                                            </select>
                                                        </td>
                                                        <td><input className="ag-input-mini" placeholder="شرح السطر..." value={line.description} onChange={e => handleLineChange(idx, 'description', e.target.value)} /></td>
                                                        <td><input type="number" step="0.01" className="ag-input-mini text-center" value={line.debit} onChange={e => handleLineChange(idx, 'debit', e.target.value)} /></td>
                                                        <td><input type="number" step="0.01" className="ag-input-mini text-center" value={line.credit} onChange={e => handleLineChange(idx, 'credit', e.target.value)} /></td>
                                                        <td><button type="button" className="ag-row-del" onClick={() => removeLine(idx)}><Trash2 size={14} /></button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="ag-totals-row">
                                                    <td colSpan={2}>الإجمالي</td>
                                                    <td className="text-center">{totals.dr.toFixed(2)}</td>
                                                    <td className="text-center">{totals.cr.toFixed(2)}</td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                    <button type="button" className="ag-add-line" onClick={addLine}>
                                        <Plus size={14} /> إضافة سطر جديد
                                    </button>
                                </div>
                            </div>

                            <div className="ag-modal-footer">
                                <div className="ag-footer-info">
                                    {totals.dr !== totals.cr && (
                                        <span className="ag-diff">فرق التوازن: {(Math.abs(totals.dr - totals.cr)).toFixed(2)} {settings?.currency || 'AED'}</span>
                                    )}
                                </div>
                                <div className="ag-footer-btns">
                                    <button type="button" className="ag-btn ag-btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                                    <button type="submit" className="ag-btn ag-btn-primary" disabled={isSubmitting || !totals.balanced || totals.dr === 0}>
                                        {isSubmitting ? 'جاري الحفظ...' : 'حفظ القيد كمسودة'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
