import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    FileText,
    Trash2,
    Check,
    AlertCircle,
    Calendar,
    Download
} from 'lucide-react';
import journalService, { JournalEntry, CreateJournalEntryData } from '../services/journal.service';
import accountService, { Account } from '../services/account.service';
import './JournalEntries.css';

const JournalEntries: React.FC = () => {
    // State
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState<Account[]>([]);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Modal State
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

    // Load Data
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
            // لضمان جلب كل القيود سواء كانت مرحلة أو مسودة
            params.limit = 50;

            const result = await journalService.getJournalEntries(params);
            setEntries(result || []);
        } catch (error) {
            console.error('Error loading entries:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAccounts = async () => {
        try {
            const result = await accountService.getAccounts({ isActive: true });
            setAccounts(result);
        } catch (error) {
            console.error('Error loading accounts:', error);
        }
    };

    // Form Handlers
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
        if (formData.lines.length <= 2) {
            alert('يجب أن يحتوي القيد على سطرين على الأقل');
            return;
        }
        const newLines = formData.lines.filter((_, i) => i !== index);
        setFormData({ ...formData, lines: newLines });
    };

    const calculateTotals = () => {
        const totalDebit = formData.lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
        const totalCredit = formData.lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
        return { totalDebit, totalCredit, isBalanced: Math.abs(totalDebit - totalCredit) < 0.01 };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { totalDebit, totalCredit, isBalanced } = calculateTotals();

        if (!isBalanced) {
            alert(`القيد غير متوازن! الفرق: ${Math.abs(totalDebit - totalCredit).toFixed(2)}`);
            return;
        }

        if (totalDebit === 0) {
            alert('لا يمكن حفظ قيد صفري القيمة');
            return;
        }

        try {
            setIsSubmitting(true);
            const payload = {
                ...formData,
                date: new Date(formData.date).toISOString(),
                lines: formData.lines.map(line => ({
                    ...line,
                    description: line.description || formData.description,
                    debit: Number(line.debit),
                    credit: Number(line.credit)
                }))
            };

            await journalService.createJournalEntry(payload);
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
        } catch (error: any) {
            console.error('Error creating entry:', error);
            alert(error.response?.data?.error || 'فشل إنشاء القيد');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePost = async (id: string) => {
        if (!confirm('هل تأكيد ترحيل القيد؟ لا يمكن التراجع عن هذه العملية.')) return;
        try {
            await journalService.postJournalEntry(id);
            loadEntries();
        } catch (error: any) {
            console.error('Error posting entry:', error);
            alert('فشل ترحيل القيد');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا القيد؟')) return;
        try {
            await journalService.deleteJournalEntry(id);
            loadEntries();
        } catch (error: any) {
            console.error('Error deleting entry:', error);
            alert('فشل حذف القيد (قد يكون مرحّلاً)');
        }
    };

    // Stats
    const totalEntries = entries.length;
    const postedEntries = entries.filter(e => e.isPosted).length;
    const totalValue = entries.reduce((sum, e) => {
        const entryTotal = e.lines.reduce((s, l) => s + Number(l.debit), 0);
        return sum + entryTotal;
    }, 0);

    const { totalDebit, totalCredit, isBalanced } = calculateTotals();

    return (
        <div className="next-gen-page-container">
            {/* --- Premium Floating Header --- */}
            <header className="glass-header">
                <div className="container-wide header-content">
                    <div className="header-branding">
                        <div className="branding-icon orange">
                            <FileText size={28} strokeWidth={2.5} />
                        </div>
                        <div className="branding-text">
                            <h1>القيود اليومية</h1>
                            <p>تسجيل ومعالجة العمليات المالية</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="btn-modern btn-orange-gradient" onClick={() => setShowModal(true)}>
                            <Plus size={18} strokeWidth={2.8} />
                            <span>إضافة قيد جديد</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="container-wide main-content">
                {/* Desktop Search & Filters Toolbar */}
                <section className="filters-toolbar hide-on-mobile">
                    <div className="search-box-wrapper">
                        <span className="search-icon">
                            <Search size={18} strokeWidth={2.2} />
                        </span>
                        <input
                            type="text"
                            placeholder="بحث برقم القيد أو الوصف..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="divider-v"></div>
                    <div className="filters-group">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={{
                                height: '52px',
                                padding: '0 1.25rem',
                                border: '1.5px solid #EDF2F7',
                                borderRadius: '14px',
                                background: '#F8FAFC',
                                fontFamily: 'inherit',
                                fontSize: '0.9rem'
                            }}
                        />
                        <span style={{ color: '#718096', fontSize: '0.875rem' }}>إلى</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={{
                                height: '52px',
                                padding: '0 1.25rem',
                                border: '1.5px solid #EDF2F7',
                                borderRadius: '14px',
                                background: '#F8FAFC',
                                fontFamily: 'inherit',
                                fontSize: '0.9rem'
                            }}
                        />
                        <button className="btn-modern btn-orange-gradient" onClick={loadEntries} style={{ padding: '0 1.5rem', height: '52px' }}>
                            تطبيق
                        </button>
                    </div>
                </section>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card-mini" style={{ borderRight: '3px solid #2C7A7B' }}>
                        <div className="stat-label">إجمالي القيود</div>
                        <div className="stat-value">{totalEntries}</div>
                    </div>
                    <div className="stat-card-mini" style={{ borderRight: '3px solid #38A169' }}>
                        <div className="stat-label">مرحّلة (Posted)</div>
                        <div className="stat-value">{postedEntries}</div>
                    </div>
                    <div className="stat-card-mini" style={{ borderRight: '3px solid #DD6B20' }}>
                        <div className="stat-label">مسودة (Draft)</div>
                        <div className="stat-value">{totalEntries - postedEntries}</div>
                    </div>
                    <div className="stat-card-mini" style={{ borderRight: '3px solid #3182CE' }}>
                        <div className="stat-label">إجمالي القيمة</div>
                        <div className="stat-value">{totalValue.toLocaleString()} د.إ</div>
                    </div>
                </div>

                {/* Table */}
                <div className="next-gen-table-container">
                    <table className="modern-data-table">
                        <thead>
                            <tr>
                                <th>رقم القيد</th>
                                <th>دفتر اليومية</th>
                                <th>التاريخ</th>
                                <th>الوصف</th>
                                <th className="text-center">القيمة</th>
                                <th className="text-center">الحالة</th>
                                <th className="text-left">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center">جاري التحميل...</td>
                                </tr>
                            ) : entries.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center">لا توجد قيود مطابقة</td>
                                </tr>
                            ) : (
                                entries.map((entry) => {
                                    const total = entry.lines.reduce((s, l) => s + Number(l.debit), 0);
                                    return (
                                        <tr key={entry.id}>
                                            <td>
                                                <strong style={{ color: 'var(--orange-primary)' }}>{entry.entryNumber}</strong>
                                            </td>
                                            <td>
                                                {entry.journal ? (
                                                    <span className={`journal-badge ${(entry.journal as any).type.toLowerCase()}`}>
                                                        {(entry.journal as any).nameAr}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted small">عملية عامة</span>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Calendar size={14} color="#64748B" />
                                                    <span>{new Date(entry.date).toLocaleDateString('ar-AE')}</span>
                                                </div>
                                            </td>
                                            <td style={{ maxWidth: '300px' }}>{entry.description}</td>
                                            <td className="text-center">
                                                <strong style={{ fontSize: '1.1rem' }}>{total.toLocaleString()}</strong>
                                                <span style={{ fontSize: '0.75rem', color: '#64748B', marginRight: '4px' }}>د.إ</span>
                                            </td>
                                            <td className="text-center">
                                                <span className={`status-pill ${entry.isPosted ? 'posted' : 'draft'}`}>
                                                    {entry.isPosted ? <Check size={12} /> : <AlertCircle size={12} />}
                                                    {entry.isPosted ? 'مرحّل' : 'مسودة'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="table-actions-2026">
                                                    {!entry.isPosted && (
                                                        <>
                                                            <button
                                                                className="btn-icon-2026 confirm"
                                                                onClick={() => handlePost(entry.id)}
                                                                title="ترحيل"
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                            <button
                                                                className="btn-icon-2026 delete"
                                                                onClick={() => handleDelete(entry.id)}
                                                                title="حذف"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button className="btn-icon-2026" title="طباعة">
                                                        <Download size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Modal */}
            {showModal && (
                <div className="premium-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="premium-modal-container" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="premium-modal-header">
                            <div className="header-content">
                                <h2>إضافة قيد يومية جديد</h2>
                                <p>يرجى التأكد من توازن القيد (المدين = الدائن)</p>
                            </div>
                            <button className="premium-close-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="premium-modal-body">
                                <div className="form-grid-2">
                                    <div className="form-group-2026">
                                        <label>التاريخ *</label>
                                        <input
                                            type="date"
                                            className="input-premium"
                                            required
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group-2026">
                                        <label>المرجع (رقم مستند خارجي)</label>
                                        <input
                                            type="text"
                                            className="input-premium"
                                            value={formData.reference || ''}
                                            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                            placeholder="Ref-123"
                                        />
                                    </div>
                                </div>

                                <div className="form-group-2026" style={{ marginTop: '1rem' }}>
                                    <label>الوصف العام للقيد *</label>
                                    <textarea
                                        className="input-premium"
                                        required
                                        rows={2}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="شرح موجز للعملية المالية..."
                                    />
                                </div>

                                <div className="lines-section" style={{ marginTop: '2rem' }}>
                                    <div className="premium-section-title">أطر القيد</div>
                                    <table className="lines-edit-table">
                                        <thead>
                                            <tr>
                                                <th>الحساب</th>
                                                <th>البيان</th>
                                                <th style={{ width: '100px' }}>مدين</th>
                                                <th style={{ width: '100px' }}>دائن</th>
                                                <th style={{ width: '40px' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.lines.map((line, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <select
                                                            className="modern-select"
                                                            required
                                                            value={line.accountId}
                                                            onChange={(e) => handleLineChange(index, 'accountId', e.target.value)}
                                                        >
                                                            <option value="">اختر الحساب...</option>
                                                            {accounts.map(acc => (
                                                                <option key={acc.id} value={acc.id}>
                                                                    {acc.code} - {acc.nameAr}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            className="input-premium"
                                                            value={line.description || ''}
                                                            onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                                                            placeholder="اختياري..."
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="input-premium"
                                                            value={line.debit}
                                                            onChange={(e) => handleLineChange(index, 'debit', e.target.value)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="input-premium"
                                                            value={line.credit}
                                                            onChange={(e) => handleLineChange(index, 'credit', e.target.value)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="delete-line-btn"
                                                            onClick={() => removeLine(index)}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="totals-row-2026">
                                                <td colSpan={2}>الإجمالي</td>
                                                <td className={isBalanced ? 'positive' : 'negative'}>{totalDebit}</td>
                                                <td className={isBalanced ? 'positive' : 'negative'}>{totalCredit}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                    <button type="button" className="btn-outline-2026" onClick={addLine} style={{ marginTop: '1rem' }}>
                                        <Plus size={16} /> إضافة سطر جديد
                                    </button>
                                </div>
                            </div>

                            <div className="premium-modal-footer">
                                <button
                                    type="button"
                                    className="premium-footer-btn secondary"
                                    onClick={() => setShowModal(false)}
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="premium-footer-btn primary"
                                    disabled={isSubmitting || !isBalanced || totalDebit === 0}
                                >
                                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ القيد (مسودة)'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JournalEntries;
