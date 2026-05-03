import React, { useState, useEffect } from 'react';
import {
    Plus,
    X,
    Settings,
    Calendar,
    Lock,
    Building2,
    Save,
    Landmark,
    Hash,
    Percent
} from 'lucide-react';
import financialYearService, { FinancialYear, CreateFinancialYearData } from '../../services/financial-year.service';
import financialSettingsService, { FinancialSettings as IFinancialSettings } from '../../services/financial-settings.service';
import accountService, { Account } from '../../services/account.service';
import './FinancialSettings.css';

const FinancialSettings: React.FC = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);

    // Financial Years State
    const [years, setYears] = useState<FinancialYear[]>([]);
    const [showYearModal, setShowYearModal] = useState(false);
    const [yearFormData, setYearFormData] = useState<CreateFinancialYearData>({
        yearName: '',
        startDate: '',
        endDate: '',
        isCurrent: false
    });

    // Global Financial Settings State
    const [settings, setSettings] = useState<IFinancialSettings | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load in parallel but handle individual failures
            const results = await Promise.allSettled([
                financialYearService.getAllYears(),
                financialSettingsService.getSettings(),
                accountService.getAccounts()
            ]);

            if (results[0].status === 'fulfilled') setYears(results[0].value);
            else console.error('Failed to load years:', results[0].reason);

            if (results[1].status === 'fulfilled') setSettings(results[1].value);
            else console.error('Failed to load settings:', results[1].reason);

            if (results[2].status === 'fulfilled') setAccounts(results[2].value);
            else console.error('Failed to load accounts:', results[2].reason);

        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;

        try {
            setIsSaving(true);
            await financialSettingsService.updateSettings(settings);
            alert('تم تحديث الإعدادات بنجاح');
        } catch (error) {
            console.error(error);
            alert('فشل تحديث الإعدادات');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateYear = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await financialYearService.createFinancialYear(yearFormData);
            alert('تم إنشاء السنة المالية بنجاح');
            setShowYearModal(false);
            setYearFormData({ yearName: '', startDate: '', endDate: '', isCurrent: false });
            const updatedYears = await financialYearService.getAllYears();
            setYears(updatedYears);
        } catch (error: any) {
            console.error(error);
            alert('فشل إنشاء السنة المالية: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleCloseYear = async (id: string) => {
        if (!confirm('هل أنت متأكد من إغلاق السنة المالية؟ لا يمكن تعديل القيود بعد الإغلاق.')) return;
        try {
            await financialYearService.closeFinancialYear(id);
            const updatedYears = await financialYearService.getAllYears();
            setYears(updatedYears);
        } catch (error) {
            alert('فشل إغلاق السنة المالية');
        }
    };

    if (loading) {
        return (
            <div className="financial-settings-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>جاري تحميل الإعدادات...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="financial-settings-page">
            <div className="settings-header">
                <h1>
                    <div className="header-icon-wrapper">
                        <Settings size={28} />
                    </div>
                    <div>
                        <span className="title-ar">الإعدادات المالية</span>
                        <span className="title-en">Financial Settings</span>
                    </div>
                </h1>

                {activeTab !== 'years' && (
                    <button
                        className="btn-primary save-btn"
                        onClick={handleUpdateSettings}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <div className="spinner-small"></div>
                        ) : (
                            <>
                                <Save size={18} />
                                <span>حفظ التغييرات</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            <div className="settings-container">
                {/* Sidebar Nav */}
                <div className="settings-nav">
                    <button
                        className={`nav-item ${activeTab === 'general' ? 'active' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        <Building2 size={18} />
                        <span>البيانات العامة</span>
                    </button>

                    <button
                        className={`nav-item ${activeTab === 'years' ? 'active' : ''}`}
                        onClick={() => setActiveTab('years')}
                    >
                        <Calendar size={18} />
                        <span>السنوات المالية</span>
                    </button>

                    <button
                        className={`nav-item ${activeTab === 'taxes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('taxes')}
                    >
                        <Percent size={18} />
                        <span>الضرائب والعملة</span>
                    </button>

                    <button
                        className={`nav-item ${activeTab === 'bank' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bank')}
                    >
                        <Landmark size={18} />
                        <span>الحسابات البنكية</span>
                    </button>

                    <button
                        className={`nav-item ${activeTab === 'default-accounts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('default-accounts')}
                    >
                        <Hash size={18} />
                        <span>توجيه الحسابات</span>
                    </button>
                </div>

                {/* Content Area */}
                <div className="settings-content glass-effect">
                    {activeTab === 'general' && settings && (
                        <div className="settings-section">
                            <div className="section-header">
                                <Building2 size={24} />
                                <h3>بيانات المنشأة</h3>
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>اسم المنشأة (العربية) *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={settings.companyNameAr}
                                        onChange={e => setSettings({ ...settings, companyNameAr: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>اسم المنشأة (الإنجليزية) *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={settings.companyNameEn}
                                        onChange={e => setSettings({ ...settings, companyNameEn: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>الرقم الضريبي (TRN) *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="15 digits"
                                        maxLength={15}
                                        value={settings.trn}
                                        onChange={e => setSettings({ ...settings, trn: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>العملة الافتراضية</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={settings.currency}
                                        placeholder="AED"
                                        onChange={e => setSettings({ ...settings, currency: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'years' && (
                        <div className="financial-years-section">
                            <div className="section-header">
                                <Calendar size={24} />
                                <h3>إدارة السنوات المالية</h3>
                                <button className="btn-secondary" onClick={() => setShowYearModal(true)}>
                                    <Plus size={18} />
                                    إضافة سنة
                                </button>
                            </div>

                            <div className="table-responsive">
                                <table className="years-table">
                                    <thead>
                                        <tr>
                                            <th>اسم السنة</th>
                                            <th>البداية</th>
                                            <th>النهاية</th>
                                            <th>الحالة</th>
                                            <th>الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {years && years.map(year => (
                                            <tr key={year.id} className={year.isClosed ? 'row-closed' : ''}>
                                                <td className="font-bold">
                                                    {year.yearName}
                                                    {year.isCurrent && <span className="current-indicator">الحالية</span>}
                                                </td>
                                                <td>{new Date(year.startDate).toLocaleDateString('ar-AE')}</td>
                                                <td>{new Date(year.endDate).toLocaleDateString('ar-AE')}</td>
                                                <td>
                                                    <span className={`status-pill ${year.isClosed ? 'closed' : 'open'}`}>
                                                        {year.isClosed ? 'مغلقة' : 'مفتوحة'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {!year.isClosed && (
                                                        <button
                                                            className="action-icon lock"
                                                            onClick={() => handleCloseYear(year.id)}
                                                            title="إغلاق السنة"
                                                        >
                                                            <Lock size={18} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'taxes' && settings && (
                        <div className="settings-section">
                            <div className="section-header">
                                <Percent size={24} />
                                <h3>إعدادات الضرائب</h3>
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>نسبة ضريبة القيمة المضافة (%)</label>
                                    <div className="input-with-icon">
                                        <Percent size={18} className="icon" />
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={settings.vatRate}
                                            onChange={e => {
                                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                                setSettings({ ...settings, vatRate: val });
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>حساب الضريبة (COA)</label>
                                    <select
                                        className="form-control"
                                        value={settings.defaultVatAccountId || ''}
                                        onChange={e => setSettings({ ...settings, defaultVatAccountId: e.target.value })}
                                    >
                                        <option value="">اختر الحساب...</option>
                                        {accounts && accounts.filter(a => a.type === 'LIABILITY').map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.nameAr}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bank' && settings && (
                        <div className="settings-section">
                            <div className="section-header">
                                <Landmark size={24} />
                                <h3>البيانات البنكية الرئيسية</h3>
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>اسم البنك</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={settings.bankName || ''}
                                        onChange={e => setSettings({ ...settings, bankName: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>رقم الحساب (IBAN)</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={settings.iban || ''}
                                        onChange={e => setSettings({ ...settings, iban: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>رمز السويفت (SWIFT)</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={settings.swiftCode || ''}
                                        onChange={e => setSettings({ ...settings, swiftCode: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>عنوان البنك</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={settings.bankAddress || ''}
                                        onChange={e => setSettings({ ...settings, bankAddress: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'default-accounts' && settings && (
                        <div className="settings-section">
                            <div className="section-header">
                                <Hash size={24} />
                                <h3>توجيه الحسابات الافتراضي</h3>
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>حساب الصندوق الرئيسي</label>
                                    <select
                                        className="form-control"
                                        value={settings.defaultCashAccountId || ''}
                                        onChange={e => setSettings({ ...settings, defaultCashAccountId: e.target.value })}
                                    >
                                        <option value="">اختر الحساب...</option>
                                        {accounts && accounts.filter(a => a.type === 'ASSET').map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.nameAr}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>حساب البنك الرئيسي</label>
                                    <select
                                        className="form-control"
                                        value={settings.defaultBankAccountId || ''}
                                        onChange={e => setSettings({ ...settings, defaultBankAccountId: e.target.value })}
                                    >
                                        <option value="">اختر الحساب...</option>
                                        {accounts && accounts.filter(a => a.type === 'ASSET').map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.nameAr}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>حساب الإيرادات (الرسوم) الافتراضي</label>
                                    <select
                                        className="form-control"
                                        value={settings.defaultIncomeAccountId || ''}
                                        onChange={e => setSettings({ ...settings, defaultIncomeAccountId: e.target.value })}
                                    >
                                        <option value="">اختر الحساب...</option>
                                        {accounts && accounts.filter(a => a.type === 'REVENUE').map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.nameAr}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>حساب خصومات المبيعات</label>
                                    <select
                                        className="form-control"
                                        value={settings.defaultSalesDiscountAccountId || ''}
                                        onChange={e => setSettings({ ...settings, defaultSalesDiscountAccountId: e.target.value })}
                                    >
                                        <option value="">اختر الحساب...</option>
                                        {accounts && accounts.filter(a => a.type === 'EXPENSE' || a.type === 'REVENUE').map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.nameAr}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>حساب مصاريف الرواتب</label>
                                    <select
                                        className="form-control"
                                        value={settings.defaultPayrollExpenseAccountId || ''}
                                        onChange={e => setSettings({ ...settings, defaultPayrollExpenseAccountId: e.target.value })}
                                    >
                                        <option value="">اختر الحساب...</option>
                                        {accounts && accounts.filter(a => a.type === 'EXPENSE').map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.nameAr}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>حساب الرواتب المستحقة (التزام)</label>
                                    <select
                                        className="form-control"
                                        value={settings.defaultPayrollPayableAccountId || ''}
                                        onChange={e => setSettings({ ...settings, defaultPayrollPayableAccountId: e.target.value })}
                                    >
                                        <option value="">اختر الحساب...</option>
                                        {accounts && accounts.filter(a => a.type === 'LIABILITY').map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.nameAr}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>حساب ضريبة القيمة المضافة (VAT)</label>
                                    <select
                                        className="form-control"
                                        value={settings.defaultVatAccountId || ''}
                                        onChange={e => setSettings({ ...settings, defaultVatAccountId: e.target.value })}
                                    >
                                        <option value="">اختر الحساب...</option>
                                        {accounts && accounts.filter(a => a.type === 'LIABILITY').map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.nameAr}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="text-xs font-bold text-slate-400 block mb-2">حساب الدائنين / الموردين (PAYABLES)</label>
                                    <select
                                        className="form-control"
                                        value={settings.defaultSupplierPayableAccountId || ''}
                                        onChange={e => setSettings({ ...settings, defaultSupplierPayableAccountId: e.target.value })}
                                    >
                                        <option value="">اختر الحساب...</option>
                                        {accounts && accounts.filter(a => a.type === 'LIABILITY').map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.nameAr}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>حساب ذمم الطلاب (المدينين)</label>
                                    <select
                                        className="form-control"
                                        value={settings.defaultStudentReceivableAccountId || ''}
                                        onChange={e => setSettings({ ...settings, defaultStudentReceivableAccountId: e.target.value })}
                                    >
                                        <option value="">اختر الحساب...</option>
                                        {accounts && accounts.filter(a => a.type === 'ASSET').map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.nameAr}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>حساب معلقات تحويل البنك</label>
                                    <select
                                        className="form-control"
                                        value={settings.defaultBankSuspenseAccountId || ''}
                                        onChange={e => setSettings({ ...settings, defaultBankSuspenseAccountId: e.target.value })}
                                    >
                                        <option value="">اختر الحساب...</option>
                                        {accounts && accounts.filter(a => a.type === 'ASSET').map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.nameAr}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Year Modal */}
            {showYearModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-effect">
                        <div className="modal-header">
                            <h2>إضافة سنة مالية جديدة</h2>
                            <button className="close-btn" onClick={() => setShowYearModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateYear}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>اسم السنة (مثلاً 2026)</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        required
                                        value={yearFormData.yearName}
                                        onChange={e => setYearFormData({ ...yearFormData, yearName: e.target.value })}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>تاريخ البداية</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            required
                                            value={yearFormData.startDate}
                                            onChange={e => setYearFormData({ ...yearFormData, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>تاريخ النهاية</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            required
                                            value={yearFormData.endDate}
                                            onChange={e => setYearFormData({ ...yearFormData, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-check">
                                    <input
                                        type="checkbox"
                                        id="isCurrent"
                                        checked={yearFormData.isCurrent}
                                        onChange={e => setYearFormData({ ...yearFormData, isCurrent: e.target.checked })}
                                    />
                                    <label htmlFor="isCurrent">تعيين كـ "السنة المالية الحالية"</label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowYearModal(false)}>إلغاء</button>
                                <button type="submit" className="btn-primary">حفظ السنة</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialSettings;
