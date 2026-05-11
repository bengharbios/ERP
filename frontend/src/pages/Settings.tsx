import { useState, useEffect } from 'react';
import { settingsService, AwardingBodyConfig, UpdateSystemSettingsRequest } from '../services/settings.service';
import { databaseService } from '../services/database.service';
import accountService from '../services/account.service';
import { Toast, ToastType } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useSettingsStore } from '../store/settingsStore';
import { COUNTRIES } from '../utils/countries';

export default function Settings() {
    const { settings, fetchSettings, updateSettings } = useSettingsStore();
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Search and Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    // Form state
    const [formData, setFormData] = useState<UpdateSystemSettingsRequest>({});

    // Modal states
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [showAwardingModal, setShowAwardingModal] = useState(false);
    const [editingAwarding, setEditingAwarding] = useState<any | null>(null);
    const [awardingFormData, setAwardingFormData] = useState<any>({
        code: '',
        nameAr: '',
        nameEn: '',
        description: '',
        website: '',
        isActive: true
    });

    const [showLevelModal, setShowLevelModal] = useState(false);
    const [editingLevel, setEditingLevel] = useState<any | null>(null);
    const [levelFormData, setLevelFormData] = useState<any>({
        nameAr: '',
        nameEn: '',
        order: 0,
        isActive: true
    });

    const [levels, setLevels] = useState<any[]>([]);
    const [awardingBodiesList, setAwardingBodiesList] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);

    // Network Sharing State
    const [networkInfo, setNetworkInfo] = useState<{ ips: string[], port: number } | null>(null);
    const [fetchingNetwork, setFetchingNetwork] = useState(false);

    // Telegram CRM configurations state
    const [telegramCrmConfig, setTelegramCrmConfig] = useState<any>({
        noAnswerButtonEnabled: true,
        noAnswerNote: '🚨 تم الاتصال ولم يرد على المكالمة.',
        noAnswerInterest: 0,
        followUpButtonEnabled: true,
        callQueueEnabled: true,
        callQueueLimit: 5,
        remindersEnabled: true
    });

    // Toast and Confirm Dialog states
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        title: string;
        message: string;
        type: 'danger' | 'warning' | 'info';
        onConfirm: () => void;
    } | null>(null);

    const fetchTelegramCrmConfig = async () => {
        try {
            const res = await settingsService.getTelegramCrmConfig();
            if (res.data) setTelegramCrmConfig(res.data);
        } catch (error) {
            console.error('Error fetching Telegram CRM config:', error);
        }
    };

    useEffect(() => {
        if (settings) {
            setFormData(settings);
            setLoading(false);
        } else {
            setLoading(true);
            fetchSettings().finally(() => setLoading(false));
        }
        fetchAwardingBodies();
        fetchLevels();
        fetchAccounts();
        fetchTelegramCrmConfig();
    }, [settings, fetchSettings]);

    const fetchAccounts = async () => {
        try {
            const res = await accountService.getAccounts();
            setAccounts(res || []);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    const fetchAwardingBodies = async () => {
        try {
            const res = await settingsService.getAwardingBodies();
            if (res.data && res.data.bodies) setAwardingBodiesList(res.data.bodies);
        } catch (error) {
            console.error('Error fetching awarding bodies:', error);
        }
    };

    const fetchLevels = async () => {
        try {
            const res = await settingsService.getProgramLevels();
            if (res.data && res.data.levels) setLevels(res.data.levels);
        } catch (error) {
            console.error('Error fetching levels:', error);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const saveData = { ...formData };
            if (!saveData.instituteName) {
                saveData.instituteName = saveData.instituteNameEn || 'Institute';
            }
            updateField('awardingBodies', []); // Clear legacy JSON data if it exists
            await updateSettings(saveData as any);
            await settingsService.updateTelegramCrmConfig(telegramCrmConfig);
            setToast({ type: 'success', message: '✅ تم حفظ الإعدادات بنجاح' });
            setSelectedSection(null);
        } catch (error: any) {
            const errorMsg = error.response?.data?.error?.message || 'فشل في حفظ الإعدادات';
            setToast({ type: 'error', message: `❌ ${errorMsg}` });
        } finally {
            setLoading(false);
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddAwarding = () => {
        setEditingAwarding(null);
        setAwardingFormData({
            id: '',
            name: '',
            nameAr: '',
            nameEn: '',
            code: '',
            isActive: true,
            registrationPrefix: ''
        });
        setShowAwardingModal(true);
    };

    const handleEditAwarding = (awarding: AwardingBodyConfig) => {
        setEditingAwarding(awarding);
        setAwardingFormData(awarding);
        setShowAwardingModal(true);
    };

    const handleSaveAwarding = async () => {
        try {
            setLoading(true);
            if (editingAwarding) {
                await settingsService.updateAwardingBody(editingAwarding.id, awardingFormData);
            } else {
                await settingsService.createAwardingBody(awardingFormData);
            }
            setShowAwardingModal(false);
            fetchAwardingBodies();
            setToast({ type: 'success', message: '✅ تم حفظ الجهة بنجاح' });
        } catch (error: any) {
            const msg = error.response?.data?.error?.message || 'فشل في حفظ الجهة';
            setToast({ type: 'error', message: `❌ ${msg}` });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAwarding = (awarding: any) => {
        const count = awarding._count?.programs || 0;
        setConfirmDialog({
            title: 'حذف الجهة المانحة',
            message: count > 0
                ? `⚠️ هذه الجهة مرتبطة بـ ${count} برنامج. هل أنت متأكد من الحذف؟`
                : `هل أنت متأكد من حذف \"${awarding.nameAr || awarding.nameEn}\"؟`,
            type: count > 0 ? 'warning' : 'danger',
            onConfirm: async () => {
                try {
                    setLoading(true);
                    await settingsService.deleteAwardingBody(awarding.id);
                    setToast({ type: 'success', message: '✅ تم الحذف بنجاح' });
                    fetchAwardingBodies();
                } catch (error) {
                    setToast({ type: 'error', message: '❌ فشل في الحذف' });
                } finally {
                    setLoading(false);
                    setConfirmDialog(null);
                }
            }
        });
    };

    const handleAddLevel = () => {
        setEditingLevel(null);
        setLevelFormData({ nameAr: '', nameEn: '', order: levels.length + 1, isActive: true });
        setShowLevelModal(true);
    };

    const handleEditLevel = (level: any) => {
        setEditingLevel(level);
        setLevelFormData(level);
        setShowLevelModal(true);
    };

    const handleSaveLevel = async () => {
        try {
            setLoading(true);
            if (editingLevel) {
                await settingsService.updateProgramLevel(editingLevel.id, levelFormData);
            } else {
                await settingsService.createProgramLevel(levelFormData);
            }
            setShowLevelModal(false);
            fetchLevels();
            setToast({ type: 'success', message: '✅ تم حفظ المستوى بنجاح' });
        } catch (error: any) {
            const msg = error.response?.data?.error?.message || 'فشل في حفظ المستوى';
            setToast({ type: 'error', message: `❌ ${msg}` });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLevel = (level: any) => {
        const count = level._count?.programs || 0;
        setConfirmDialog({
            title: 'حذف المستوى الأكاديمي',
            message: count > 0
                ? `⚠️ هذا المستوى مرتبط بـ ${count} برنامج. هل أنت متأكد من الحذف؟`
                : `هل أنت متأكد من حذف \"${level.nameAr || level.nameEn}\"؟`,
            type: count > 0 ? 'warning' : 'danger',
            onConfirm: async () => {
                try {
                    setLoading(true);
                    await settingsService.deleteProgramLevel(level.id);
                    setToast({ type: 'success', message: '✅ تم الحذف بنجاح' });
                    fetchLevels();
                } catch (error) {
                    setToast({ type: 'error', message: '❌ فشل في الحذف' });
                } finally {
                    setLoading(false);
                    setConfirmDialog(null);
                }
            }
        });
    };

    const fetchNetworkInfo = async () => {
        try {
            setFetchingNetwork(true);
            const res = await settingsService.getNetworkInfo();
            if (res.data) setNetworkInfo(res.data);
        } catch (error) {
            console.error('Error fetching network info:', error);
        } finally {
            setFetchingNetwork(false);
        }
    };

    const handleOpenNetworkSharing = () => {
        setSelectedSection('network');
        if (!networkInfo) fetchNetworkInfo();
    };

    const awardingBodies = awardingBodiesList;

    // Settings cards configuration
    const settingsCards = [
        {
            id: 'institute',
            code: 'معهد',
            icon: '🏢',
            title: 'معلومات المعهد',
            subtitle: 'الاسم والعنوان والتواصل',
            stats: [
                { value: formData.instituteNameAr ? '✓' : '×', label: 'الاسم' },
                { value: formData.instituteEmail ? '✓' : '×', label: 'البريد', highlight: true }
            ]
        },
        {
            id: 'awarding',
            code: 'جهات',
            icon: '🎓',
            title: 'الجهات المانحة',
            subtitle: 'إدارة الجهات الأكاديمية',
            stats: [
                { value: awardingBodiesList.length, label: 'جهة' },
                { value: awardingBodiesList.filter(b => b.isActive).length, label: 'نشط', highlight: true }
            ]
        },
        {
            id: 'levels',
            code: 'مستويات',
            icon: '📊',
            title: 'المستويات الأكاديمية',
            subtitle: 'إدارة مستويات البرامج',
            stats: [
                { value: levels.length, label: 'مستوى' },
                { value: levels.filter(l => l.isActive).length, label: 'نشط', highlight: true }
            ]
        },
        {
            id: 'system',
            code: 'نظام',
            icon: '⚙️',
            title: 'إعدادات النظام',
            subtitle: 'اللغة والمنطقة الزمنية',
            stats: [
                { value: formData.defaultLanguage?.toUpperCase() || 'AR', label: 'اللغة' },
                { value: formData.country || 'SA', label: 'الدولة', highlight: true }
            ]
        },
        {
            id: 'academic',
            code: 'أكاديمي',
            icon: '📚',
            title: 'الإعدادات الأكاديمية',
            subtitle: 'النجاح والحضور',
            stats: [
                { value: `${formData.gradePassingPercentage || 50}%`, label: 'نجاح' },
                { value: `${formData.attendanceThreshold || 75}%`, label: 'حضور', highlight: true }
            ]
        },
        {
            id: 'registration',
            code: 'تسجيل',
            icon: '📝',
            title: 'إعدادات التسجيل',
            subtitle: 'أرقام الطلاب والبادئات',
            stats: [
                { value: formData.studentNumberPrefix || 'STU', label: 'البادئة' },
                { value: formData.autoGenerateStudentNumber ? '✓' : '×', label: 'تلقائي', highlight: true }
            ]
        },
        {
            id: 'finance',
            code: 'مالية',
            icon: '💰',
            title: 'الإعدادات المالية',
            subtitle: 'الغرامات، الخصومات والعملة',
            stats: [
                { value: `${formData.lateFeeAmount || 0} ${formData.currency || 'SAR'}`, label: 'غرامة' },
                { value: `${formData.fullPaymentDiscountPercentage || 0}%`, label: 'خصم سداد', highlight: true }
            ]
        },
        {
            id: 'integrations',
            code: 'تكاملات',
            icon: '🔌',
            title: 'التكاملات الخارجية',
            subtitle: 'البريد والرسائل',
            stats: [
                { value: formData.emailEnabled ? '✓' : '×', label: 'بريد' },
                { value: formData.smsEnabled ? '✓' : '×', label: 'SMS', highlight: true }
            ]
        },
        {
            id: 'ai_hub',
            code: 'ذكاء',
            icon: '🧠',
            title: 'مركز الذكاء الاصطناعي',
            subtitle: 'تفعيل المحركات الخارجية والـ API',
            stats: [
                { value: formData.externalAiEnabled ? 'نشط' : 'قيد الإيقاف', label: 'الحالة' },
                { value: formData.externalAiProvider?.toUpperCase() || 'OPENAI', label: 'المحرك', highlight: true }
            ]
        },
        {
            id: 'telegram',
            code: 'تليجرام',
            icon: '🤖',
            title: 'إعدادات بوت تليجرام',
            subtitle: 'مفتاح الربط وتفعيل الويب هوك',
            stats: [
                { value: formData.telegramBotEnabled ? 'نشط' : 'معطل', label: 'الحالة' },
                { value: formData.telegramBotToken ? '✓ متصل' : '× غير متصل', label: 'الربط', highlight: true }
            ]
        },
        {
            id: 'database',
            code: 'صيانة',
            icon: '💾',
            title: 'قاعدة البيانات والصيانة',
            subtitle: 'نسخ احتياطي، استعادة، وتصفير البيانات',
            stats: [
                { value: 'JSON', label: 'تنسيق' },
                { value: 'Admin', label: 'صلاحية', highlight: true }
            ]
        },
        {
            id: 'network',
            code: 'مشاركة',
            icon: '🌐',
            title: 'مشاركة النظام (الشبكة)',
            subtitle: 'الدخول من أجهزة أخرى في نفس المكان',
            stats: [
                { value: networkInfo?.ips[0]?.split('.').slice(-1)[0] || '?', label: 'IP' },
                { value: 'متوفر', label: 'الحالة', highlight: true }
            ],
            onClick: handleOpenNetworkSharing
        },
        {
            id: 'appearance',
            code: 'مظهر',
            icon: '🎨',
            title: 'المظهر والقوالب',
            subtitle: 'تخصيص الواجهة واختيار القالب',
            stats: [
                { value: formData.activeTemplate === 'modern' ? 'Modern' : 'Legacy', label: 'القالب الحالي' },
                { value: '2026', label: 'المعيار', highlight: true }
            ]
        },
        {
            id: 'reports',
            code: 'تقارير',
            icon: '📄',
            title: 'إعدادات التقارير',
            subtitle: 'تخصيص الهوية والخطوط والطباعة',
            stats: [
                { value: formData.reportFont || 'Tajawal', label: 'الخط' },
                { value: formData.reportWatermarkType === 'none' ? 'لا يوجد' : 'نشط', label: 'العلامة', highlight: true }
            ]
        }
    ];

    // Filter cards based on search and category
    const filteredCards = settingsCards.filter(card => {
        if (searchTerm && !card.title.includes(searchTerm) && !card.subtitle.includes(searchTerm)) {
            return false;
        }
        if (filterCategory && card.id !== filterCategory) {
            return false;
        }
        return true;
    });

    if (loading && !settings) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F8FAFC' }}>
                <div className="next-gen-loader orange"></div>
            </div>
        );
    }

    return (
        <div className="next-gen-page-container orange-theme">
            {/* --- Premium Floating Header --- */}
            <header className="glass-header">
                <div className="container-wide header-content">
                    <div className="header-branding">
                        <div className="branding-icon orange">⚙️</div>
                        <div className="branding-text">
                            <h1>إعدادات النظام</h1>
                            <p className="hide-on-mobile">تحكم في كافة خصائص وتفضيلات المؤسسة</p>
                        </div>
                    </div>

                    <div className="header-actions">
                        <div className="view-switcher hide-on-mobile">
                            <button onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'active' : ''}>▦</button>
                            <button onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'active' : ''}>☰</button>
                        </div>
                        <div className="header-pills hide-on-mobile">
                            <span className="pill pill-orange">الجهات: {awardingBodies.length}</span>
                        </div>
                        <button onClick={handleSave} className="btn-modern btn-orange-gradient" disabled={loading}>
                            <span className="plus-icon">{loading ? '⏳' : '💾'}</span>
                            <span className="hide-on-mobile">{loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* --- Main Content --- */}
            <main className="container-wide main-content">
                {/* Desktop Search & Filters Toolbar */}
                <section className="filters-toolbar hide-on-mobile">
                    <div className="search-box-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="البحث في الإعدادات..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filters-group">
                        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                            <option value="">كافة الأقسام</option>
                            <option value="institute">المعهد</option>
                            <option value="awarding">الجهات المانحة</option>
                            <option value="levels">المستويات</option>
                            <option value="academic">أكاديمي</option>
                            <option value="system">النظام</option>
                            <option value="registration">التسجيل</option>
                            <option value="finance">المالية</option>
                            <option value="integrations">التكاملات</option>
                        </select>
                        <div className="divider-v"></div>
                        <div className="stats-mini-pills">
                            <span className="pill-outline">الأقسام: {filteredCards.length}</span>
                        </div>
                    </div>
                </section>

                {/* Data Display */}
                <div className="content-transition-wrapper">
                    {filteredCards.length === 0 ? (
                        <div className="empty-state-modern">
                            <div className="empty-icon">📂</div>
                            <h2>لا توجد إعدادات مطابقة</h2>
                            <button onClick={() => { setSearchTerm(''); setFilterCategory(''); }} className="btn-link">إعادة ضبط الفلاتر</button>
                        </div>
                    ) : (
                        <div className="programs-grid-2026">
                            {filteredCards.map(card => (
                                <div
                                    key={card.id}
                                    className="next-gen-card orange settings-card"
                                    onClick={card.onClick || (() => setSelectedSection(card.id))}
                                >
                                    <div className="card-top">
                                        <span className="card-code orange">{card.code}</span>
                                        <div className="settings-icon">{card.icon}</div>
                                    </div>
                                    <div className="card-info">
                                        <h3 className="card-title">{card.title}</h3>
                                        <p className="card-subtitle">{card.subtitle}</p>
                                    </div>
                                    <div className="card-stats-grid">
                                        {card.stats.map((stat, idx) => (
                                            <div key={idx} className={`stat-item ${stat.highlight ? 'highlight-orange' : ''}`}>
                                                <span className="stat-val">{stat.value}</span>
                                                <span className="stat-lbl">{stat.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* --- Modals for Each Section --- */}
            {selectedSection === 'institute' && (
                <div className="modal-overlay-2026" onClick={() => setSelectedSection(null)}>
                    <div className="modal-content-2026 large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>🏢 معلومات المعهد</h2>
                            <button className="close-modal" onClick={() => setSelectedSection(null)}>×</button>
                        </div>
                        <div className="modal-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>اسم المعهد (عربي) *</label>
                                    <input
                                        type="text"
                                        value={formData.instituteNameAr || ''}
                                        onChange={e => updateField('instituteNameAr', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>اسم المعهد (إنجليزي) *</label>
                                    <input
                                        type="text"
                                        value={formData.instituteNameEn || ''}
                                        onChange={e => updateField('instituteNameEn', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>البريد الإلكتروني *</label>
                                <input
                                    type="email"
                                    value={formData.instituteEmail || ''}
                                    onChange={e => updateField('instituteEmail', e.target.value)}
                                />
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>الهاتف</label>
                                    <input
                                        type="text"
                                        value={formData.institutePhone || ''}
                                        onChange={e => updateField('institutePhone', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>الموقع الإلكتروني</label>
                                    <input
                                        type="text"
                                        value={formData.instituteWebsite || ''}
                                        onChange={e => updateField('instituteWebsite', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>العنوان</label>
                                <textarea
                                    value={formData.instituteAddress || ''}
                                    onChange={e => updateField('instituteAddress', e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="form-actions-footer">
                            <button type="button" className="btn-cancel" onClick={() => setSelectedSection(null)}>إلغاء</button>
                            <button type="button" className="btn-save orange" onClick={handleSave}>حفظ التعديلات</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedSection === 'appearance' && (
                <div className="modal-overlay-2026" onClick={() => setSelectedSection(null)}>
                    <div className="modal-content-2026 large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>🎨 المظهر والقوالب</h2>
                            <button className="close-modal" onClick={() => setSelectedSection(null)}>×</button>
                        </div>
                        <div className="modal-form">
                            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                                اختر نمط التصميم الذي تفضله للنظام. يمكنك التبديل بين القوالب في أي وقت دون التأثير على البيانات.
                            </p>

                            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                {/* Legacy Template Choice */}
                                <div
                                    className={`next-gen-card settings-card ${formData.activeTemplate === 'legacy' ? 'active-border-orange' : ''}`}
                                    onClick={() => updateField('activeTemplate', 'legacy')}
                                    style={{
                                        cursor: 'pointer',
                                        padding: '1.5rem',
                                        border: formData.activeTemplate === 'legacy' ? '2px solid #FF6B00' : '2px solid transparent',
                                        background: formData.activeTemplate === 'legacy' ? '#FFF9F5' : 'white',
                                        transition: 'all 0.3s ease',
                                        borderRadius: '16px',
                                        boxShadow: formData.activeTemplate === 'legacy' ? '0 10px 25px rgba(255,107,0,0.1)' : 'none'
                                    }}
                                >
                                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏛️</div>
                                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#1E293B' }}>Legacy Template (الكلاسيكي)</h3>
                                    <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: '1.5', margin: 0 }}>
                                        التصميم التقليدي المستقر. يتم الحفاظ عليه كخيار للتوافق وسهولة الاستخدام الكلاسيكية.
                                    </p>
                                    {formData.activeTemplate === 'legacy' && (
                                        <div style={{ marginTop: '1.25rem', color: '#FF6B00', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span>✓</span> القالب النشط حالياً
                                        </div>
                                    )}
                                </div>

                                {/* Modern Global 2026 Choice */}
                                <div
                                    className={`next-gen-card settings-card ${formData.activeTemplate === 'modern_global_2026' ? 'active-border-orange' : ''}`}
                                    onClick={() => updateField('activeTemplate', 'modern_global_2026')}
                                    style={{
                                        cursor: 'pointer',
                                        padding: '1.5rem',
                                        border: formData.activeTemplate === 'modern_global_2026' ? '2px solid #FF6B00' : '2px solid transparent',
                                        background: formData.activeTemplate === 'modern_global_2026' ? '#FFF9F5' : 'white',
                                        transition: 'all 0.3s ease',
                                        borderRadius: '16px',
                                        boxShadow: formData.activeTemplate === 'modern_global_2026' ? '0 10px 25px rgba(255,107,0,0.1)' : 'none',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🌐</div>
                                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#1E293B' }}>Modern Global Template 2026</h3>
                                    <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: '1.5', margin: 0 }}>
                                        المعيار العالمي الجديد. واجهة مبنية على البيانات (Page-driven) مع قائمة جانبية Zen وهيكل يدعم العمل الاحترافي.
                                    </p>
                                    <div style={{ marginTop: '0.75rem' }}>
                                        <span style={{
                                            background: '#FF6B00',
                                            color: 'white',
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '0.7rem',
                                            fontWeight: '800'
                                        }}>تصميم 2026 المعتمد</span>
                                    </div>
                                    {formData.activeTemplate === 'modern_global_2026' && (
                                        <div style={{ marginTop: '1.25rem', color: '#FF6B00', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span>✓</span> القالب النشط حالياً
                                        </div>
                                    )}
                                </div>

                                {/* Rapidos 2026 Choice */}
                                <div
                                    onClick={() => updateField('activeTemplate', 'rapidos_2026')}
                                    style={{
                                        cursor: 'pointer',
                                        padding: '1.5rem',
                                        border: formData.activeTemplate === 'rapidos_2026' ? '2px solid #2AABEE' : '2px solid #E2E8F0',
                                        background: formData.activeTemplate === 'rapidos_2026' ? '#F0FAFF' : 'white',
                                        transition: 'all 0.3s ease',
                                        borderRadius: '16px',
                                        boxShadow: formData.activeTemplate === 'rapidos_2026' ? '0 10px 25px rgba(42,171,238,0.15)' : 'none',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚡</div>
                                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#1E293B' }}>Rapidos 2026</h3>
                                    <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: '1.5', margin: 0 }}>
                                        قالب خارق مستوحى من تيليجرام 2026. تصميم مبتكر بقائمة جانبية داكنة, رأس شفاف زجاجي, وتجربة مستخدم رائعة على الكمبيوتر والجوال.
                                    </p>
                                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{ background: '#2AABEE', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800' }}>Telegram Style</span>
                                        <span style={{ background: '#171F2E', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800' }}>Dark Sidebar</span>
                                        <span style={{ background: '#17C950', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800' }}>جديد</span>
                                    </div>
                                    {formData.activeTemplate === 'rapidos_2026' && (
                                        <div style={{ marginTop: '1.25rem', color: '#2AABEE', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span>✓</span> القالب النشط حالياً
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{
                                marginTop: '2.5rem',
                                padding: '1.25rem',
                                background: '#F0F9FF',
                                borderRadius: '14px',
                                border: '1px solid #BAE6FD',
                                fontSize: '0.9rem',
                                color: '#0369A1',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '1rem'
                            }}>
                                <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
                                <div>
                                    <strong>ملاحظة هامة:</strong> سيتم تطبيق التغيير على كافة المستخدمين بمجرد الضغط على زر الحفظ. تم تصميم القالب العالمي الجديد لرفع كفاءة اتخاذ القرار وسرعة الوصول للمعلومات.
                                </div>
                            </div>
                        </div>
                        <div className="form-actions-footer">
                            <button type="button" className="btn-cancel" onClick={() => setSelectedSection(null)}>إلغاء</button>
                            <button type="button" className="btn-save orange" onClick={handleSave}>حفظ وتطبيق القالب</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedSection === 'awarding' && (
                <div className="modal-overlay-2026" onClick={() => setSelectedSection(null)}>
                    <div className="modal-content-2026 xl" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>🎓 الجهات المانحة</h2>
                            <button className="close-modal" onClick={() => setSelectedSection(null)}>×</button>
                        </div>
                        <div className="modal-body-scroll">
                            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>قائمة الجهات المانحة</h3>
                                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>إدارة الجهات المانحة للشهادات الأكاديمية</p>
                                </div>
                                <button className="btn-modern btn-orange-gradient" onClick={handleAddAwarding}>
                                    <span>+</span>
                                    <span>إضافة جهة</span>
                                </button>
                            </div>

                            {awardingBodies.length === 0 ? (
                                <div className="empty-state-modern">
                                    <div className="empty-icon">🎓</div>
                                    <h2>لا توجد جهات مانحة</h2>
                                    <p>قم بإضافة جهة مانحة جديدة</p>
                                </div>
                            ) : (
                                <div className="awarding-bodies-grid">
                                    {/* Institution Default Row */}
                                    <div className="awarding-body-card default-institution">
                                        <div className="card-top">
                                            <span className="card-code orange">MAIN</span>
                                            <div className="card-actions-mini">
                                                <span className="badge-default">افتراضي</span>
                                            </div>
                                        </div>
                                        <h4>{formData.instituteNameAr || 'المؤسسة التعليمية'}</h4>
                                        <p className="body-subtitle">Institution Certificate</p>
                                        <div className="body-status">
                                            <span className="status-active">✓ نشط (دائم)</span>
                                        </div>
                                    </div>

                                    {awardingBodies.map(body => (
                                        <div key={body.id} className="awarding-body-card">
                                            <div className="card-top">
                                                <span className="card-code orange">{body.code || 'BOD'}</span>
                                                <div className="card-actions-mini">
                                                    <button onClick={() => handleEditAwarding(body)}>✎</button>
                                                    <button onClick={() => handleDeleteAwarding(body)} className="danger">×</button>
                                                </div>
                                            </div>
                                            <h4>{body.nameAr}</h4>
                                            <p className="body-subtitle">{body.nameEn}</p>
                                            <div className="body-status">
                                                <span className={body.isActive ? 'status-active' : 'status-inactive'}>
                                                    {body.isActive ? '✓ نشط' : '× غير نشط'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="form-actions-footer">
                            <button type="button" className="btn-cancel" onClick={() => setSelectedSection(null)}>إغلاق</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedSection === 'levels' && (
                <div className="modal-overlay-2026" onClick={() => setSelectedSection(null)}>
                    <div className="modal-content-2026 xl" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📊 المستويات الأكاديمية</h2>
                            <button className="close-modal" onClick={() => setSelectedSection(null)}>×</button>
                        </div>
                        <div className="modal-body-scroll">
                            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>قائمة المستويات</h3>
                                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>تصنيف البرامج حسب المستوى الدراسي</p>
                                </div>
                                <button className="btn-modern btn-orange-gradient" onClick={handleAddLevel}>
                                    <span>+</span>
                                    <span>إضافة مستوى</span>
                                </button>
                            </div>

                            {levels.length === 0 ? (
                                <div className="empty-state-modern">
                                    <div className="empty-icon">📊</div>
                                    <h2>لا توجد مستويات</h2>
                                    <p>قم بإضافة مستوى أكاديمي جديد (مثال: دبلوم، بكالوريوس)</p>
                                </div>
                            ) : (
                                <div className="awarding-bodies-grid">
                                    {levels.map(level => (
                                        <div key={level.id} className="awarding-body-card">
                                            <div className="card-top">
                                                <span className="card-code orange">LVL {level.order}</span>
                                                <div className="card-actions-mini">
                                                    <button onClick={() => handleEditLevel(level)}>✎</button>
                                                    <button onClick={() => handleDeleteLevel(level)} className="danger">×</button>
                                                </div>
                                            </div>
                                            <h4>{level.nameAr}</h4>
                                            <p className="body-subtitle">{level.nameEn}</p>
                                            <div className="body-status">
                                                <span className={level.isActive ? 'status-active' : 'status-inactive'}>
                                                    {level.isActive ? '✓ نشط' : '× غير نشط'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="form-actions-footer">
                            <button type="button" className="btn-cancel" onClick={() => setSelectedSection(null)}>إغلاق</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedSection === 'system' && (
                <div className="modal-overlay-2026" onClick={() => setSelectedSection(null)}>
                    <div className="modal-content-2026 large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>⚙️ إعدادات النظام</h2>
                            <button className="close-modal" onClick={() => setSelectedSection(null)}>×</button>
                        </div>
                        <div className="modal-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>اللغة الافتراضية *</label>
                                    <select
                                        value={formData.defaultLanguage || 'ar'}
                                        onChange={e => updateField('defaultLanguage', e.target.value)}
                                    >
                                        <option value="ar">العربية</option>
                                        <option value="en">English</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>الدولة الافتراضية *</label>
                                    <select
                                        value={formData.country || 'SA'}
                                        onChange={e => updateField('country', e.target.value)}
                                    >
                                        {COUNTRIES.map(c => (
                                            <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>المنطقة الزمنية *</label>
                                    <select
                                        value={formData.timezone || 'Asia/Riyadh'}
                                        onChange={e => updateField('timezone', e.target.value)}
                                    >
                                        <option value="Asia/Riyadh">الرياض (GMT+3)</option>
                                        <option value="Asia/Dubai">دبي (GMT+4)</option>
                                        <option value="Africa/Cairo">القاهرة (GMT+2)</option>
                                        <option value="Asia/Kuwait">الكويت (GMT+3)</option>
                                        <option value="Asia/Qatar">الدوحة (GMT+3)</option>
                                        <option value="Asia/Bahrain">المنامة (GMT+3)</option>
                                        <option value="Asia/Muscat">مسقط (GMT+4)</option>
                                        <option value="Asia/Amman">عمان (GMT+3)</option>
                                        <option value="Asia/Beirut">بيروت (GMT+2)</option>
                                        <option value="Asia/Damascus">دمشق (GMT+3)</option>
                                        <option value="Asia/Baghdad">بغداد (GMT+3)</option>
                                        <option value="Asia/Gaza">غزة/القدس (GMT+2)</option>
                                        <option value="Africa/Khartoum">الخرطوم (GMT+2)</option>
                                        <option value="Africa/Tripoli">طرابلس (GMT+2)</option>
                                        <option value="Africa/Tunis">تونس (GMT+1)</option>
                                        <option value="Africa/Algiers">الجزائر (GMT+1)</option>
                                        <option value="Africa/Casablanca">الدار البيضاء (GMT+1)</option>
                                        <option value="Africa/Nouakchott">نواكشوط (GMT+0)</option>
                                        <option value="Africa/Djibouti">جيبوتي (GMT+3)</option>
                                        <option value="Africa/Mogadishu">مقديشو (GMT+3)</option>
                                        <option value="Europe/London">لندن (GMT+0)</option>
                                        <option value="Europe/Paris">باريس (GMT+1)</option>
                                        <option value="America/New_York">نيويورك (GMT-5)</option>
                                        <option value="Asia/Tokyo">طوكيو (GMT+9)</option>
                                        <option value="UTC">توقيت عالمي (UTC)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>العملة الافتراضية *</label>
                                    <select
                                        value={formData.currency || 'SAR'}
                                        onChange={e => updateField('currency', e.target.value)}
                                    >
                                        <option value="SAR">ريال سعودي (SAR)</option>
                                        <option value="AED">درهم إماراتي (AED)</option>
                                        <option value="KWD">دينار كويتي (KWD)</option>
                                        <option value="QAR">ريال قطري (QAR)</option>
                                        <option value="BHD">دينار بحريني (BHD)</option>
                                        <option value="OMR">ريال عماني (OMR)</option>
                                        <option value="JOD">دينار أردني (JOD)</option>
                                        <option value="EGP">جنيه مصري (EGP)</option>
                                        <option value="LBP">ليرة لبنانية (LBP)</option>
                                        <option value="SYP">ليرة سورية (SYP)</option>
                                        <option value="IQD">دينار عراقي (IQD)</option>
                                        <option value="ILS">شيكل فلسطيني (ILS)</option>
                                        <option value="LYD">دينار ليبي (LYD)</option>
                                        <option value="TND">دينار تونسي (TND)</option>
                                        <option value="DZD">دينار جزائري (DZD)</option>
                                        <option value="MAD">درهم مغربي (MAD)</option>
                                        <option value="SDG">جنيه سوداني (SDG)</option>
                                        <option value="YER">ريال يمني (YER)</option>
                                        <option value="USD">دولار أمريكي (USD)</option>
                                        <option value="EUR">يورو (EUR)</option>
                                        <option value="GBP">جنيه إسترليني (GBP)</option>
                                        <option value="TRY">ليرة تركية (TRY)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>تنسيق التاريخ *</label>
                                    <select
                                        value={formData.dateFormat || 'DD/MM/YYYY'}
                                        onChange={e => updateField('dateFormat', e.target.value)}
                                    >
                                        <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2026)</option>
                                        <option value="DD-MM-YYYY">DD-MM-YYYY (31-12-2026)</option>
                                        <option value="YYYY/MM/DD">YYYY/MM/DD (2026/12/31)</option>
                                        <option value="YYYY-MM-DD">YYYY-MM-DD (2026-12-31)</option>
                                        <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2026)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label>شريط الأخبار والتنبيهات المتحرك (يظهر أعلى كافة الشاشات)</label>
                                <textarea
                                    value={formData.announcementTicker || ''}
                                    onChange={e => updateField('announcementTicker', e.target.value)}
                                    placeholder="اكتب التنبيه هنا لعرضه في شريط متحرك، اتركه فارغاً للإخفاء"
                                    rows={2}
                                />
                            </div>
                        </div>
                        <div className="form-actions-footer">
                            <button type="button" className="btn-cancel" onClick={() => setSelectedSection(null)}>إلغاء</button>
                            <button type="button" className="btn-save orange" onClick={handleSave}>حفظ التعديلات</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedSection === 'academic' && (
                <div className="modal-overlay-2026" onClick={() => setSelectedSection(null)}>
                    <div className="modal-content-2026 large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📚 الإعدادات الأكاديمية</h2>
                            <button className="close-modal" onClick={() => setSelectedSection(null)}>×</button>
                        </div>
                        <div className="modal-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>نسبة النجاح (%) *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.gradePassingPercentage || 50}
                                        onChange={e => updateField('gradePassingPercentage', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>نسبة الحضور المطلوبة (%) *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.attendanceThreshold || 75}
                                        onChange={e => updateField('attendanceThreshold', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>السنة الأكاديمية الافتراضية</label>
                                <input
                                    type="text"
                                    value={formData.defaultAcademicYear || ''}
                                    onChange={e => updateField('defaultAcademicYear', e.target.value)}
                                    placeholder="2024-2025"
                                />
                            </div>
                        </div>
                        <div className="form-actions-footer">
                            <button type="button" className="btn-cancel" onClick={() => setSelectedSection(null)}>إلغاء</button>
                            <button type="button" className="btn-save orange" onClick={handleSave}>حفظ التعديلات</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedSection === 'registration' && (
                <div className="modal-overlay-2026" onClick={() => setSelectedSection(null)}>
                    <div className="modal-content-2026 large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📝 إعدادات التسجيل</h2>
                            <button className="close-modal" onClick={() => setSelectedSection(null)}>×</button>
                        </div>
                        <div className="modal-form">
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.autoGenerateStudentNumber || false}
                                        onChange={e => updateField('autoGenerateStudentNumber', e.target.checked)}
                                    />
                                    <span>توليد أرقام الطلاب تلقائياً</span>
                                </label>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>بادئة رقم الطالب</label>
                                    <input
                                        type="text"
                                        value={formData.studentNumberPrefix || ''}
                                        onChange={e => updateField('studentNumberPrefix', e.target.value)}
                                        placeholder="STU"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>طول رقم الطالب</label>
                                    <input
                                        type="number"
                                        min="4"
                                        max="10"
                                        value={(formData as any).studentNumberLength || 6}
                                        onChange={e => updateField('studentNumberLength', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="form-actions-footer">
                            <button type="button" className="btn-cancel" onClick={() => setSelectedSection(null)}>إلغاء</button>
                            <button type="button" className="btn-save orange" onClick={handleSave}>حفظ التعديلات</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedSection === 'network' && (
                <div className="modal-overlay-2026" onClick={() => setSelectedSection(null)}>
                    <div className="modal-content-2026 large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>🌐 مشاركة النظام عبر الشبكة Local Network</h2>
                            <button className="close-modal" onClick={() => setSelectedSection(null)}>×</button>
                        </div>
                        <div className="modal-body-scroll" style={{ padding: '2rem' }}>
                            {fetchingNetwork ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem' }}>
                                    <div className="next-gen-loader orange"></div>
                                    <p>جاري فحص اتصال الشبكة...</p>
                                </div>
                            ) : (
                                <div className="network-sharing-content">
                                    <div className="info-box-premium orange" style={{ marginBottom: '2rem' }}>
                                        <div className="info-icon">💡</div>
                                        <div className="info-text">
                                            <h3>كيف تتصفح المشروع من جهاز آخر؟</h3>
                                            <p>يمكنك الدخول إلى هذا النظام من أي جهاز (هاتف، تابلت، أو لابتوب) موجود معك في نفس المكان، بشرط أن يكون متصلاً بنفس شبكة الواي فاي (WiFi).</p>
                                        </div>
                                    </div>

                                    <div className="qr-access-section" style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <div className="ip-info-display" style={{ flex: 1, minWidth: '280px' }}>
                                            <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>عناوين الوصول المتوفرة:</h4>
                                            {networkInfo?.ips.map((ip, idx) => (
                                                <div key={idx} className="access-link-card" style={{
                                                    background: '#fff',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '12px',
                                                    padding: '1rem',
                                                    marginBottom: '1rem',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <div style={{ direction: 'ltr', fontWeight: '800', fontSize: '1.2rem', color: 'var(--orange-primary)' }}>
                                                        http://{ip}:{window.location.port || 5173}
                                                    </div>
                                                    <button
                                                        className="btn-copy-mini"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(`http://${ip}:${window.location.port || 5173}`);
                                                            setToast({ type: 'success', message: 'تم نسخ الرابط' });
                                                        }}
                                                        style={{ background: '#f1f5f9', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}
                                                    >
                                                        📋 نسخ
                                                    </button>
                                                </div>
                                            ))}
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                                * استخدم الرابط الموضح أعلاه في متصفح الجهاز الآخر.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="network-instructions" style={{ marginTop: '2.5rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                                        <h4 style={{ marginBottom: '1rem' }}>خطوات الربط:</h4>
                                        <ul style={{ paddingRight: '1.5rem', lineHeight: '1.8' }}>
                                            <li>تأكد أن هذا الجهاز (الخادم) والجهاز الآخر متصلان بنفس الـ **WiFi**.</li>
                                            <li>افتح متصفح الويب (Chrome, Safari, etc.) في الجهاز الآخر.</li>
                                            <li>اكتب الرابط الموضح بالأعلى في شريط العنوان واضغط دخول.</li>
                                            <li>إذا لم يعمل الرابط، تأكد من إعدادات الجدار الناري (Firewall) في هذا الجهاز للسماح بالاتصال.</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="form-actions-footer">
                            <button type="button" className="btn-cancel" onClick={() => setSelectedSection(null)}>إغلاق</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedSection === 'finance' && (
                <div className="modal-overlay-2026" onClick={() => setSelectedSection(null)}>
                    <div className="modal-content-2026 large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>💰 الإعدادات المالية</h2>
                            <button className="close-modal" onClick={() => setSelectedSection(null)}>×</button>
                        </div>
                        <div className="modal-form">
                            <h3 className="section-subtitle">بيانات التسجيل والضريبة (UAE Standard)</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>رقم التسجيل الضريبي (TRN)</label>
                                    <input
                                        type="text"
                                        maxLength={15}
                                        placeholder="100xxxxxxxxxxxx"
                                        value={formData.trn || ''}
                                        onChange={e => updateField('trn', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>نسبة الضريبة الافتراضية (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.taxRate || 5}
                                        onChange={e => updateField('taxRate', parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>

                            <h3 className="section-subtitle">الحساب البنكي الرئيسي والخزينة</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>اسم البنك</label>
                                    <input
                                        type="text"
                                        placeholder="مثلاً: بنك دبي الإسلامي"
                                        value={formData.bankName || ''}
                                        onChange={e => updateField('bankName', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>اسم صاحب الحساب</label>
                                    <input
                                        type="text"
                                        value={formData.bankAccountName || ''}
                                        onChange={e => updateField('bankAccountName', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>رقم الحساب الدولي (IBAN)</label>
                                <input
                                    type="text"
                                    placeholder="AE..."
                                    value={formData.bankIban || ''}
                                    onChange={e => updateField('bankIban', e.target.value)}
                                />
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>رمز السويفت (SWIFT)</label>
                                    <input
                                        type="text"
                                        value={formData.bankSwift || ''}
                                        onChange={e => updateField('bankSwift', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>عملة الحساب</label>
                                    <select
                                        value={formData.bankCurrency || 'AED'}
                                        onChange={e => updateField('bankCurrency', e.target.value)}
                                    >
                                        <option value="AED">درهم إماراتي (AED)</option>
                                        <option value="SAR">ريال سعودي (SAR)</option>
                                        <option value="USD">دولار أمريكي (USD)</option>
                                    </select>
                                </div>
                            </div>

                            <h3 className="section-subtitle">سياسة الغرامات والخصومات</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>غرامة التأخير ({formData.currency || 'AED'})</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.lateFeeAmount || 0}
                                        onChange={e => updateField('lateFeeAmount', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>فترة السماح (أيام)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.lateFeeGraceDays || 0}
                                        onChange={e => updateField('lateFeeGraceDays', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>خصم السداد الكامل (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.fullPaymentDiscountPercentage || 0}
                                        onChange={e => updateField('fullPaymentDiscountPercentage', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>خصم السداد الكامل الثابت</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.fullPaymentDiscountAmount || 0}
                                        onChange={e => updateField('fullPaymentDiscountAmount', parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.taxEnabled || false}
                                        onChange={e => updateField('taxEnabled', e.target.checked)}
                                    />
                                    <span>تفعيل نظام الضرائب في الفواتير والمصاريف</span>
                                </label>
                            </div>

                            <h3 className="section-subtitle" style={{ marginTop: '2rem', color: 'var(--orange-primary)' }}>توجيه الحسابات الافتراضي (Advanced Routing)</h3>
                            <div className="info-box-premium orange" style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                                <div className="info-icon">🎯</div>
                                <div className="info-text">
                                    هذه الحسابات تستخدم كـ "خيار بديل" (Fallback) في حال لم يتم تحديد حساب خاص لكل رسم مالي بشكل يدوي.
                                </div>
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>حساب الإيرادات الافتراضي</label>
                                    <select value={formData.defaultIncomeAccountId || ''} onChange={e => updateField('defaultIncomeAccountId', e.target.value)}>
                                        <option value="">اختر الحساب...</option>
                                        {accounts.filter(a => a.type === 'REVENUE').map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.nameAr}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>حساب خصومات المبيعات</label>
                                    <select value={formData.defaultSalesDiscountAccountId || ''} onChange={e => updateField('defaultSalesDiscountAccountId', e.target.value)}>
                                        <option value="">اختر الحساب...</option>
                                        {accounts.filter(a => a.type === 'EXPENSE' || a.type === 'REVENUE').map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.nameAr}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>حساب مصاريف الرواتب</label>
                                    <select value={formData.defaultPayrollExpenseAccountId || ''} onChange={e => updateField('defaultPayrollExpenseAccountId', e.target.value)}>
                                        <option value="">اختر الحساب...</option>
                                        {accounts.filter(a => a.type === 'EXPENSE').map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.nameAr}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>حساب الرواتب المستحقة (التزام)</label>
                                    <select value={formData.defaultPayrollPayableAccountId || ''} onChange={e => updateField('defaultPayrollPayableAccountId', e.target.value)}>
                                        <option value="">اختر الحساب...</option>
                                        {accounts.filter(a => a.type === 'LIABILITY').map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.nameAr}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>حساب الدائنين / الموردين (Payables)</label>
                                    <select value={formData.defaultSupplierPayableAccountId || ''} onChange={e => updateField('defaultSupplierPayableAccountId', e.target.value)}>
                                        <option value="">اختر الحساب...</option>
                                        {accounts.filter(a => a.type === 'LIABILITY').map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.nameAr}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>حساب ذمم الطلاب (Receivables)</label>
                                    <select value={formData.defaultStudentReceivableAccountId || ''} onChange={e => updateField('defaultStudentReceivableAccountId', e.target.value)}>
                                        <option value="">اختر الحساب...</option>
                                        {accounts.filter(a => a.type === 'ASSET').map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.nameAr}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>حساب ضريبة القيمة المضافة</label>
                                    <select value={formData.defaultVatAccountId || ''} onChange={e => updateField('defaultVatAccountId', e.target.value)}>
                                        <option value="">اختر الحساب...</option>
                                        {accounts.filter(a => a.type === 'LIABILITY' || a.type === 'ASSET').map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.nameAr}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="form-actions-footer">
                            <button type="button" className="btn-cancel" onClick={() => setSelectedSection(null)}>إلغاء</button>
                            <button type="button" className="btn-save orange" onClick={handleSave}>حفظ التعديلات</button>
                        </div>
                    </div>
                </div>
            )}
            {showAwardingModal && (
                <div className="modal-overlay-2026" onClick={() => setShowAwardingModal(false)}>
                    <div className="modal-content-2026" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingAwarding ? 'تعديل جهة مانحة' : 'إضافة جهة مانحة'}</h2>
                            <button className="close-modal" onClick={() => setShowAwardingModal(false)}>×</button>
                        </div>
                        <div className="modal-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>رمز الجهة</label>
                                    <input type="text" value={awardingFormData.code || ''} onChange={e => setAwardingFormData({ ...awardingFormData, code: e.target.value })} placeholder="مثلاً: PEARSON" />
                                </div>
                                <div className="form-group">
                                    <label>الحالة</label>
                                    <select value={awardingFormData.isActive ? 'true' : 'false'} onChange={e => setAwardingFormData({ ...awardingFormData, isActive: e.target.value === 'true' })}>
                                        <option value="true">نشط</option>
                                        <option value="false">غير نشط</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>الاسم بالعربية *</label>
                                <input type="text" value={awardingFormData.nameAr || ''} onChange={e => setAwardingFormData({ ...awardingFormData, nameAr: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>الاسم بالإنجليزية *</label>
                                <input type="text" value={awardingFormData.nameEn || ''} onChange={e => setAwardingFormData({ ...awardingFormData, nameEn: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>الموقع الإلكتروني</label>
                                <input type="url" value={awardingFormData.website || ''} onChange={e => setAwardingFormData({ ...awardingFormData, website: e.target.value })} placeholder="https://..." />
                            </div>
                        </div>
                        <div className="form-actions-footer">
                            <button type="button" className="btn-cancel" onClick={() => setShowAwardingModal(false)}>إلغاء</button>
                            <button type="button" className="btn-save orange" onClick={handleSaveAwarding}>حفظ الجهة</button>
                        </div>
                    </div>
                </div>
            )}

            {showLevelModal && (
                <div className="modal-overlay-2026" onClick={() => setShowLevelModal(false)}>
                    <div className="modal-content-2026" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingLevel ? 'تعديل مستوى أكاديمي' : 'إضافة مستوى جديد'}</h2>
                            <button className="close-modal" onClick={() => setShowLevelModal(false)}>×</button>
                        </div>
                        <div className="modal-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>الترتيب</label>
                                    <input type="number" value={levelFormData.order || 0} onChange={e => setLevelFormData({ ...levelFormData, order: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div className="form-group">
                                    <label>الحالة</label>
                                    <select value={levelFormData.isActive ? 'true' : 'false'} onChange={e => setLevelFormData({ ...levelFormData, isActive: e.target.value === 'true' })}>
                                        <option value="true">نشط</option>
                                        <option value="false">غير نشط</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>الاسم بالعربية *</label>
                                <input type="text" value={levelFormData.nameAr || ''} onChange={e => setLevelFormData({ ...levelFormData, nameAr: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>الاسم بالإنجليزية *</label>
                                <input type="text" value={levelFormData.nameEn || ''} onChange={e => setLevelFormData({ ...levelFormData, nameEn: e.target.value })} required />
                            </div>
                        </div>
                        <div className="form-actions-footer">
                            <button type="button" className="btn-cancel" onClick={() => setShowLevelModal(false)}>إلغاء</button>
                            <button type="button" className="btn-save orange" onClick={handleSaveLevel}>حفظ المستوى</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedSection === 'integrations' && (
                <div className="modal-overlay-2026" onClick={() => setSelectedSection(null)}>
                    <div className="modal-content-2026 large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>🔌 التكاملات الخارجية</h2>
                            <button className="close-modal" onClick={() => setSelectedSection(null)}>×</button>
                        </div>
                        <div className="modal-form">
                            <div className="integration-section">
                                <h3>📧 البريد الإلكتروني</h3>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.emailEnabled || false}
                                            onChange={e => updateField('emailEnabled', e.target.checked)}
                                        />
                                        <span>تفعيل البريد الإلكتروني</span>
                                    </label>
                                </div>
                                {formData.emailEnabled && (
                                    <>
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>خادم SMTP</label>
                                                <input
                                                    type="text"
                                                    value={formData.smtpHost || ''}
                                                    onChange={e => updateField('smtpHost', e.target.value)}
                                                    placeholder="smtp.gmail.com"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>منفذ SMTP</label>
                                                <input
                                                    type="number"
                                                    value={formData.smtpPort || 587}
                                                    onChange={e => updateField('smtpPort', parseInt(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>اسم المستخدم</label>
                                                <input
                                                    type="text"
                                                    value={formData.smtpUsername || ''}
                                                    onChange={e => updateField('smtpUsername', e.target.value)}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>كلمة المرور</label>
                                                <input
                                                    type="password"
                                                    value={formData.smtpPassword || ''}
                                                    onChange={e => updateField('smtpPassword', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="integration-section">
                                <h3>📱 الرسائل النصية (SMS)</h3>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.smsEnabled || false}
                                            onChange={e => updateField('smsEnabled', e.target.checked)}
                                        />
                                        <span>تفعيل الرسائل النصية</span>
                                    </label>
                                </div>
                                {formData.smsEnabled && (
                                    <div className="form-group">
                                        <label>مفتاح API</label>
                                        <input
                                            type="password"
                                            value={formData.smsApiKey || ''}
                                            onChange={e => updateField('smsApiKey', e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="form-actions-footer">
                            <button type="button" className="btn-cancel" onClick={() => setSelectedSection(null)}>إلغاء</button>
                            <button type="button" className="btn-save orange" onClick={handleSave}>حفظ التعديلات</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedSection === 'ai_hub' && (
                <div className="modal-overlay-2026" onClick={() => setSelectedSection(null)}>
                    <div className="modal-content-2026 large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>🧠 مركز الذكاء الاصطناعي</h2>
                            <button className="close-modal" onClick={() => setSelectedSection(null)}>×</button>
                        </div>
                        <div className="modal-form">
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.externalAiEnabled || false}
                                        onChange={e => updateField('externalAiEnabled', e.target.checked)}
                                    />
                                    <span style={{ fontWeight: 600 }}>تفعيل الذكاء الاصطناعي الخارجي (Deep Reasoning)</span>
                                </label>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginRight: '1.8rem' }}>
                                    عند التفعيل، سيقوم النظام باستخدام محركات عالمية لتحليل المحادثات المعقدة التي تتجاوز قدرة المحرك المحلي.
                                </p>
                            </div>

                            <div className={`form-grid ${!formData.externalAiEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div className="form-group">
                                    <label>مزود الخدمة (Provider)</label>
                                    <select
                                        value={formData.externalAiProvider || 'openai'}
                                        onChange={e => updateField('externalAiProvider', e.target.value)}
                                        disabled={!formData.externalAiEnabled}
                                    >
                                        <option value="openai">OpenAI (GPT-4o)</option>
                                        <option value="gemini">Google Gemini Pro</option>
                                        <option value="anthropic">Anthropic (Claude)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>مفتاح الواجهة (API Key)</label>
                                    <input
                                        type="password"
                                        value={formData.externalAiApiKey || ''}
                                        onChange={e => updateField('externalAiApiKey', e.target.value)}
                                        placeholder="sk-..."
                                        disabled={!formData.externalAiEnabled}
                                    />
                                </div>
                            </div>

                            <div className="ai-status-notice orange" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255, 107, 0, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 107, 0, 0.1)' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0 }}>
                                    <strong>💡 ملاحظة:</strong> النظام سيستمر في استخدام المحرك المحلي المجاني للمهام البسيطة والترحيب لتوفير التكاليف، وسيلجأ للمحرك الخارجي فقط عند الحاجة لـ "تفكير أعمق".
                                </p>
                            </div>
                        </div>
                        <div className="form-actions-footer">
                            <button type="button" className="btn-cancel" onClick={() => setSelectedSection(null)}>إلغاء</button>
                            <button type="button" className="btn-save orange" onClick={handleSave}>حفظ التعديلات</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedSection === 'telegram' && (
                <div className="modal-overlay-2026" onClick={() => setSelectedSection(null)}>
                    <div className="modal-content-2026 large" style={{ maxWidth: '900px', width: '95%' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header" style={{ background: 'linear-gradient(135deg, #0088cc 0%, #006699 100%)', color: 'white' }}>
                            <h2>🤖 إعدادات بوت تليجرام الذكي المتكامل CRM</h2>
                            <button className="close-modal" style={{ color: 'white' }} onClick={() => setSelectedSection(null)}>×</button>
                        </div>
                        <div className="modal-body-scroll" style={{ padding: '2rem' }}>
                            <div className="info-box-premium" style={{ background: '#f0fafe', border: '1px solid #b3e5fc', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>🎯</span>
                                <div>
                                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#01579b', fontSize: '1rem' }}>التحكم الذكي وتجربة المستخدم الاستثنائية</h3>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#0277bd', lineHeight: '1.6' }}>
                                        هذه اللوحة تمكنكم من تخصيص سلوك البوت بالكامل. يمكنك تفعيل ميزات الاتصالات المتقدمة، تعيين ردود تلقائية مسبقة لحالات "لم يرد"، وتعيين حجم طابور المتابعة اليومي لزيادة إنتاجية فريق المبيعات.
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', flexWrap: 'wrap' }} className="form-grid-double-column">
                                {/* Left Column: Connection & API Keys */}
                                <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '1.5rem' }} className="column-connection">
                                    <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', borderBottom: '2px solid #0088cc', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>🔑</span> ربط البوت والمفاتيح (Multi-Bot)
                                    </h3>

                                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.telegramBotEnabled || false}
                                                onChange={e => updateField('telegramBotEnabled', e.target.checked)}
                                            />
                                            <span>تفعيل ربط بوت مخصص</span>
                                        </label>
                                    </div>

                                    <div className={!formData.telegramBotEnabled ? 'opacity-50 pointer-events-none' : ''}>
                                        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                            <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem' }}>معرف البوت (Bot Username)</label>
                                            <input
                                                type="text"
                                                value={formData.telegramBotUsername || ''}
                                                onChange={e => updateField('telegramBotUsername', e.target.value)}
                                                placeholder="@my_custom_crm_bot"
                                                disabled={!formData.telegramBotEnabled}
                                                dir="ltr"
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}
                                            />
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                            <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem' }}>مفتاح البوت (Bot Token)</label>
                                            <input
                                                type="password"
                                                value={formData.telegramBotToken || ''}
                                                onChange={e => updateField('telegramBotToken', e.target.value)}
                                                placeholder="123456789:ABCdef..."
                                                disabled={!formData.telegramBotEnabled}
                                                dir="ltr"
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', fontSize: '0.8rem', color: '#475569', border: '1px solid #e2e8f0', marginTop: '1.5rem' }}>
                                        <strong>💡 تفعيل الويب هوك التلقائي:</strong><br/>
                                        بمجرد النقر على حفظ، يتم ربط الـ Webhook مع سيرفرات تليجرام تلقائيًا ليعمل البوت فورًا!
                                    </div>
                                </div>

                                {/* Right Column: Advanced CRM Bot Automation Logic */}
                                <div className="column-logic">
                                    <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', borderBottom: '2px solid #FF6B00', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>⚙️</span> المنطق التفاعلي المؤتمت للبيانات
                                    </h3>

                                    {/* No-Answer Toggles */}
                                    <div style={{ background: '#fff9f5', border: '1px solid #ffe8d6', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem' }}>
                                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                                                <input
                                                    type="checkbox"
                                                    checked={telegramCrmConfig.noAnswerButtonEnabled}
                                                    onChange={e => setTelegramCrmConfig({ ...telegramCrmConfig, noAnswerButtonEnabled: e.target.checked })}
                                                />
                                                <span style={{ color: '#c2410c' }}>📴 تفعيل زر (لم يرد) السريع</span>
                                            </label>
                                        </div>
                                        
                                        {telegramCrmConfig.noAnswerButtonEnabled && (
                                            <>
                                                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>النص التلقائي المسجل كملاحظة:</label>
                                                    <input
                                                        type="text"
                                                        value={telegramCrmConfig.noAnswerNote}
                                                        onChange={e => setTelegramCrmConfig({ ...telegramCrmConfig, noAnswerNote: e.target.value })}
                                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #f97316' }}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>درجة الاهتمام الجديدة عند الضغط (0 - 10):</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="10"
                                                        value={telegramCrmConfig.noAnswerInterest}
                                                        onChange={e => setTelegramCrmConfig({ ...telegramCrmConfig, noAnswerInterest: parseInt(e.target.value) || 0 })}
                                                        style={{ width: '80px', padding: '0.5rem', borderRadius: '8px', border: '1px solid #f97316', textAlign: 'center' }}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Follow-Up Quick Action */}
                                    <div className="form-group" style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                                            <input
                                                type="checkbox"
                                                checked={telegramCrmConfig.followUpButtonEnabled}
                                                onChange={e => setTelegramCrmConfig({ ...telegramCrmConfig, followUpButtonEnabled: e.target.checked })}
                                            />
                                            <span>📅 تفعيل زر (جدولة متابعة) تفاعلي</span>
                                        </label>
                                        <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.25rem 0 0 1.5rem' }}>
                                            يتيح للمندوب جدولة مكالمة لاحقة بنقرة واحدة (غداً، بعد يومين، أو تحديد موعد مخصص).
                                        </p>
                                    </div>

                                    {/* Call Queue Setting */}
                                    <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '12px', padding: '1rem' }}>
                                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                                                <input
                                                    type="checkbox"
                                                    checked={telegramCrmConfig.callQueueEnabled}
                                                    onChange={e => setTelegramCrmConfig({ ...telegramCrmConfig, callQueueEnabled: e.target.checked })}
                                                />
                                                <span style={{ color: '#15803d' }}>📞 تفعيل نظام طابور الاتصالات اليومي</span>
                                            </label>
                                        </div>

                                        {telegramCrmConfig.callQueueEnabled && (
                                            <div className="form-group" style={{ marginRight: '1.5rem' }}>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>الحد الأقصى للاتصالات المعروضة يومياً لكل موظف:</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="100"
                                                    value={telegramCrmConfig.callQueueLimit}
                                                    onChange={e => setTelegramCrmConfig({ ...telegramCrmConfig, callQueueLimit: parseInt(e.target.value) || 5 })}
                                                    style={{ width: '80px', padding: '0.5rem', borderRadius: '8px', border: '1px solid #22c55e', textAlign: 'center' }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="form-actions-footer">
                            <button type="button" className="btn-cancel" onClick={() => setSelectedSection(null)}>إلغاء</button>
                            <button type="button" className="btn-save orange" onClick={handleSave}>حفظ الإعدادات بالكامل</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Awarding Body Add/Edit Modal */}
            {showAwardingModal && (
                <div className="modal-overlay-2026" onClick={() => setShowAwardingModal(false)}>
                    <div className="modal-content-2026" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingAwarding ? 'تعديل الجهة المانحة' : 'إضافة جهة مانحة جديدة'}</h2>
                            <button className="close-modal" onClick={() => setShowAwardingModal(false)}>×</button>
                        </div>
                        <div className="modal-form">
                            <div className="form-group">
                                <label>الرمز *</label>
                                <input
                                    type="text"
                                    value={awardingFormData.code}
                                    onChange={e => setAwardingFormData({ ...awardingFormData, code: e.target.value })}
                                    placeholder="INST01"
                                />
                            </div>
                            <div className="form-group">
                                <label>الاسم (عربي) *</label>
                                <input
                                    type="text"
                                    value={awardingFormData.nameAr}
                                    onChange={e => setAwardingFormData({ ...awardingFormData, nameAr: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>الاسم (إنجليزي) *</label>
                                <input
                                    type="text"
                                    value={awardingFormData.nameEn}
                                    onChange={e => setAwardingFormData({ ...awardingFormData, nameEn: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>بادئة التسجيل</label>
                                <input
                                    type="text"
                                    value={awardingFormData.registrationPrefix || ''}
                                    onChange={e => setAwardingFormData({ ...awardingFormData, registrationPrefix: e.target.value })}
                                    placeholder="AB-"
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={awardingFormData.isActive}
                                        onChange={e => setAwardingFormData({ ...awardingFormData, isActive: e.target.checked })}
                                    />
                                    <span>الحالة: نشط</span>
                                </label>
                            </div>
                        </div>
                        <div className="form-actions-footer">
                            <button type="button" className="btn-cancel" onClick={() => setShowAwardingModal(false)}>إلغاء</button>
                            <button type="button" className="btn-save orange" onClick={handleSaveAwarding}>
                                {editingAwarding ? 'حفظ التعديلات' : 'إضافة الجهة'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
            {confirmDialog && (
                <ConfirmDialog
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    type={confirmDialog.type}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={() => setConfirmDialog(null)}
                />
            )}

            {selectedSection === 'database' && (
                <div className="modal-overlay-2026" onClick={() => setSelectedSection(null)}>
                    <div className="modal-content-2026 large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>💾 قاعدة البيانات والصيانة</h2>
                            <button className="close-modal" onClick={() => setSelectedSection(null)}>×</button>
                        </div>
                        <div className="modal-body-scroll">
                            <div className="integration-section">
                                <h3>📤 تصدير النسخة الاحتياطية</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                    قم بتحميل نسخة كاملة من بيانات المعهد (الطلبة والبرامج والمالية) بصيغة JSON.
                                </p>
                                <button
                                    className="btn-modern btn-orange-gradient"
                                    onClick={async () => {
                                        try {
                                            const res = await databaseService.exportDatabase();
                                            const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
                                            a.click();
                                            setToast({ type: 'success', message: '✅ تم تصدير النسخة بنجاح' });
                                        } catch (error) {
                                            setToast({ type: 'error', message: '❌ فشل التصدير' });
                                        }
                                    }}
                                >
                                    📥 تصدير الآن
                                </button>
                            </div>

                            <div className="integration-section">
                                <h3>📥 استيراد النسخة الاحتياطية</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                    قم برفع ملف JSON سابق لاستعادة البيانات. ⚠️ تنبيه: سيتم تحديث البيانات الموجودة.
                                </p>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = async (ev) => {
                                            try {
                                                const data = JSON.parse(ev.target?.result as string);
                                                await databaseService.importDatabase(data);
                                                setToast({ type: 'success', message: '✅ تمت الاستعادة بنجاح' });
                                            } catch (error) {
                                                setToast({ type: 'error', message: '❌ فشل الاستيراد' });
                                            }
                                        };
                                        reader.readAsText(file);
                                    }}
                                    style={{ display: 'none' }}
                                    id="import-backup"
                                />
                                <label htmlFor="import-backup" className="btn-modern pill-outline" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                                    📤 اختر الملف للاستيراد
                                </label>
                            </div>

                            <div className="integration-section" style={{ border: '1px solid #FED7D7', background: '#FFF5F5' }}>
                                <h3 style={{ color: '#C53030' }}>⚠️ منطقة الخطر</h3>
                                <p style={{ fontSize: '0.85rem', color: '#742A2A', marginBottom: '1rem' }}>
                                    إجراءات حساسة تؤثر على استقرار النظام والبيانات.
                                </p>
                                <button
                                    className="btn-modern"
                                    style={{ background: '#C53030', color: 'white' }}
                                    onClick={() => {
                                        setConfirmDialog({
                                            title: 'تشغيل البيانات التجريبية',
                                            message: '⚠️ سيتم إعادة تعيين القواعد وإضافة بيانات وهمية للاختبار. هل تريد المتابعة؟',
                                            type: 'danger',
                                            onConfirm: async () => {
                                                try {
                                                    setLoading(true);
                                                    await databaseService.seedDemoData();
                                                    setToast({ type: 'success', message: '✅ تم تشغيل الـ Seed بنجاح' });
                                                    setConfirmDialog(null);
                                                    window.location.reload();
                                                } catch (error) {
                                                    setToast({ type: 'error', message: '❌ فشل تشغيل الـ Seed' });
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }
                                        });
                                    }}
                                >
                                    🌱 تشغيل البيانات التجريبية (Demo Data)
                                </button>
                            </div>
                        </div>
                        <div className="form-actions-footer">
                            <button type="button" className="btn-cancel" onClick={() => setSelectedSection(null)}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedSection === 'reports' && (
                <div className="modal-overlay-2026" onClick={() => setSelectedSection(null)}>
                    <div className="modal-content-2026 large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📄 إعدادات التقارير والهوية</h2>
                            <button className="close-modal" onClick={() => setSelectedSection(null)}>×</button>
                        </div>
                        <div className="modal-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>اسم المؤسسة في التقارير (عربي)</label>
                                    <input
                                        type="text"
                                        value={formData.reportInstitutionNameAr || ''}
                                        onChange={e => updateField('reportInstitutionNameAr', e.target.value)}
                                        placeholder="مثلاً: معهد الإبداع للتدريب"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>اسم المؤسسة في التقارير (إنجليزي)</label>
                                    <input
                                        type="text"
                                        value={formData.reportInstitutionNameEn || ''}
                                        onChange={e => updateField('reportInstitutionNameEn', e.target.value)}
                                        placeholder="Example: Creativity Training Institute"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>رابط الشعار (URL)</label>
                                <input
                                    type="text"
                                    value={formData.reportLogo || ''}
                                    onChange={e => updateField('reportLogo', e.target.value)}
                                    placeholder="https://example.com/logo.png"
                                />
                                <p className="help-text" style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>يُفضل استخدام رابط لصورة PNG بخلفية شفافة.</p>
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>نوع العلامة المائية</label>
                                    <select
                                        value={formData.reportWatermarkType || 'none'}
                                        onChange={e => updateField('reportWatermarkType', e.target.value)}
                                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                    >
                                        <option value="none">لا يوجد</option>
                                        <option value="text">نصية</option>
                                        <option value="image">صورة</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>خط التقارير</label>
                                    <select
                                        value={formData.reportFont || 'Tajawal'}
                                        onChange={e => updateField('reportFont', e.target.value)}
                                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                    >
                                        <option value="Tajawal">Tajawal (عصري)</option>
                                        <option value="Cairo">Cairo (كلاسيكي)</option>
                                        <option value="Almarai">Almarai (رسمي)</option>
                                        <option value="Inter">Inter (إنجليزي فقط)</option>
                                    </select>
                                </div>
                            </div>

                            {formData.reportWatermarkType === 'text' && (
                                <div className="form-group">
                                    <label>نص العلامة المائية</label>
                                    <input
                                        type="text"
                                        value={formData.reportWatermarkText || ''}
                                        onChange={e => updateField('reportWatermarkText', e.target.value)}
                                        placeholder="مثلاً: نسخة أصلية - معتمد"
                                    />
                                </div>
                            )}

                            {formData.reportWatermarkType === 'image' && (
                                <div className="form-group">
                                    <label>رابط صورة العلامة المائية</label>
                                    <input
                                        type="text"
                                        value={formData.reportWatermarkImage || ''}
                                        onChange={e => updateField('reportWatermarkImage', e.target.value)}
                                        placeholder="https://example.com/watermark.png"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="form-actions-footer">
                            <button type="button" className="btn-cancel" onClick={() => setSelectedSection(null)}>إلغاء</button>
                            <button type="button" className="btn-save orange" onClick={handleSave}>حفظ إعدادات التقارير</button>
                        </div>
                    </div>
                </div>
            )}


            {/* --- Copy CSS from Units.tsx with minor additions --- */}
            <style dangerouslySetInnerHTML={{
                __html: `
                :root {
                    --orange-primary: #DD6B20;
                    --orange-light: #FEEBC8;
                    --orange-dark: #7B341E;
                    --primary: var(--orange-primary);
                    --primary-light: var(--orange-light);
                    --primary-dark: var(--orange-dark);
                    --accent: #3182CE;
                    --bg-page: #F8FAFC;
                    --surface: #FFFFFF;
                    --text-main: #1A202C;
                    --text-muted: #718096;
                    --glass-bg: rgba(255, 255, 255, 0.85);
                    --shadow-sm: 0 2px 4px rgba(0,0,0,0.05);
                    --shadow-premium: 0 12px 30px rgba(0, 0, 0, 0.08);
                    --radius-lg: 16px;
                    --radius-md: 12px;
                }

                *, *::before, *::after {
                    box-sizing: border-box;
                }

                html, body {
                    margin: 0;
                    padding: 0;
                    overflow-x: hidden;
                    width: 100%;
                }

                .next-gen-page-container {
                    font-family: 'Inter', 'Cairo', sans-serif;
                    color: var(--text-main);
                    direction: rtl;
                    min-height: 100vh;
                    background: var(--bg-page);
                    overflow-x: hidden;
                }

                .container-wide { 
                    max-width: 1400px; 
                    margin: 0 auto; 
                    padding: 0 1.5rem;
                    width: 100%;
                    box-sizing: border-box;
                }

                /* GLASS HEADER */
                .glass-header {
                    position: sticky;
                    top: 0;
                    z-index: 900;
                    background: var(--glass-bg);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border-bottom: 1px solid rgba(226, 232, 240, 0.6);
                    height: 80px;
                    display: flex;
                    align-items: center;
                }

                .header-content { display: flex; justify-content: space-between; align-items: center; width: 100%; }
                .header-branding { display: flex; align-items: center; gap: 1rem; }

                .branding-icon.orange {
                    font-size: 1.75rem;
                    background: var(--orange-light);
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 14px;
                }

                .branding-text h1 { font-size: 1.25rem; font-weight: 800; margin: 0; color: var(--orange-dark); }
                .branding-text p { margin: 0; font-size: 0.8125rem; color: var(--text-muted); }

                .header-actions { display: flex; align-items: center; gap: 1.5rem; }

                .btn-modern {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.625rem 1.25rem;
                    border-radius: var(--radius-md);
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }

                .btn-orange-gradient {
                    background: linear-gradient(135deg, var(--orange-primary) 0%, #ED8936 100%);
                    color: white;
                    box-shadow: 0 4px 12px rgba(221, 107, 32, 0.3);
                }

                .btn-orange-gradient:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(221, 107, 32, 0.4); }
                .btn-orange-gradient:disabled { opacity: 0.6; cursor: not-allowed; }

                .pill-orange { background: var(--orange-light); color: var(--orange-primary); font-size: 0.75rem; font-weight: 800; padding: 0.5rem 1rem; border-radius: 20px; }

                /* VIEW SWITCHER */
                .view-switcher { display: flex; background: #EDF2F7; padding: 4px; border-radius: 10px; }
                .view-switcher button { width: 36px; height: 36px; border: none; background: transparent; border-radius: 8px; cursor: pointer; color: var(--text-muted); font-size: 1rem; transition: all 0.2s; }
                .view-switcher button.active { background: white; color: var(--orange-primary); box-shadow: var(--shadow-sm); }

                /* FILTERS TOOLBAR */
                .filters-toolbar {
                    margin-top: 2rem;
                    background: white;
                    padding: 1rem 1.5rem;
                    border-radius: var(--radius-lg);
                    box-shadow: var(--shadow-premium);
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    border: 1px solid rgba(226, 232, 240, 0.5);
                }

                .search-box-wrapper { flex: 1; position: relative; display: flex; align-items: center; }
                .search-icon { position: absolute; right: 1rem; color: var(--text-muted); }
                .search-box-wrapper input {
                    width: 100%;
                    height: 48px;
                    padding: 0 3rem 0 1rem;
                    border: 1px solid #E2E8F0;
                    border-radius: var(--radius-md);
                    background: #F8FAFC;
                    font-size: 0.9375rem;
                }

                .search-box-wrapper input:focus { border-color: var(--orange-primary); background: white; outline: none; box-shadow: 0 0 0 3px rgba(221, 107, 32, 0.1); }

                .filters-group { display: flex; gap: 1rem; align-items: center; }
                .filters-group select { height: 48px; padding: 0 1rem; border: 1px solid #E2E8F0; border-radius: var(--radius-md); background: #F8FAFC; color: var(--text-main); font-weight: 600; cursor: pointer; }
                .divider-v { width: 1px; height: 30px; background: #E2E8F0; }
                .pill-outline { border: 1px solid var(--orange-light); color: var(--orange-dark); font-size: 0.75rem; font-weight: 700; padding: 0.5rem 1rem; border-radius: 20px; background: rgba(254, 235, 200, 0.3); }

                /* NEXT-GEN CARDS */
                .main-content { margin-top: 2rem; margin-bottom: 3rem; }
                .programs-grid-2026 { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); 
                    gap: 1.5rem; 
                    margin-top: 2rem;
                    animation: fadeIn 0.4s ease-out;
                }

                .next-gen-card {
                    background: var(--surface);
                    border-radius: var(--radius-lg);
                    padding: 1.5rem;
                    border: 1px solid #EDF2F7;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1);
                    display: flex;
                    flex-direction: column;
                    box-shadow: var(--shadow-sm);
                }

                .next-gen-card:hover { transform: translateY(-8px); box-shadow: var(--shadow-premium); border-color: var(--orange-light); }
                .settings-card { cursor: pointer; }

                .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }

                .card-code.orange { 
                    background: var(--orange-light); 
                    color: var(--orange-primary); 
                    font-size: 0.75rem; 
                    font-weight: 800; 
                    padding: 0.25rem 0.75rem; 
                    border-radius: 20px; 
                }

                .settings-icon { 
                    font-size: 1.75rem; 
                    opacity: 0.4; 
                    transition: all 0.3s; 
                }

                .next-gen-card:hover .settings-icon { 
                    opacity: 1; 
                    transform: scale(1.1) rotate(5deg); 
                }

                .card-actions-mini { display: flex; gap: 0.5rem; }
                .card-actions-mini button { 
                    background: transparent; 
                    border: none; 
                    font-size: 1.1rem; 
                    cursor: pointer; 
                    color: var(--text-muted); 
                    transition: color 0.2s; 
                    padding: 0.25rem 0.5rem;
                }
                .card-actions-mini button:hover { color: var(--orange-primary); }
                .card-actions-mini button.danger:hover { color: #E53E3E; }

                .card-info { margin-bottom: 1rem; }
                .card-title { font-size: 1.125rem; font-weight: 800; color: var(--text-main); margin: 0 0 0.25rem 0; }
                .card-subtitle { font-size: 0.8125rem; color: var(--text-muted); margin: 0; }

                .card-stats-grid { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 0.75rem; 
                    padding: 1rem; 
                    background: #F8FAFC; 
                    border-radius: var(--radius-md); 
                    margin-top: auto; 
                }
                .stat-item { display: flex; flex-direction: column; align-items: center; }
                .stat-val { font-size: 1.125rem; font-weight: 800; color: var(--text-main); }
                .stat-lbl { font-size: 0.625rem; color: var(--text-muted); text-transform: uppercase; }
                .highlight-orange .stat-val { color: var(--orange-primary); }

                /* MODAL 2026 */
                .modal-overlay-2026 { 
                    position: fixed; 
                    inset: 0; 
                    background: rgba(15, 23, 42, 0.4); 
                    backdrop-filter: blur(8px); 
                    z-index: 2000; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    padding: 1.5rem; 
                }
                
                .modal-content-2026 { 
                    background: white; 
                    width: 100%; 
                    max-width: 650px; 
                    border-radius: 24px; 
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); 
                    padding: 2rem; 
                    max-height: 90vh; 
                    overflow-y: auto; 
                }

                .modal-content-2026.large { max-width: 800px; }
                .modal-content-2026.xl { max-width: 1000px; }

                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #F1F5F9; }
                .modal-header h2 { font-size: 1.5rem; font-weight: 900; margin: 0; color: var(--orange-dark); }
                .close-modal { 
                    background: #F8FAFC; 
                    border: none; 
                    width: 36px; 
                    height: 36px; 
                    border-radius: 50%; 
                    font-size: 1.5rem; 
                    color: var(--text-muted); 
                    cursor: pointer; 
                    transition: all 0.2s; 
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    line-height: 1;
                }
                .close-modal:hover { background: #fee2e2; color: #ef4444; transform: rotate(90deg); }

                .modal-form { margin-bottom: 1.5rem; }
                .modal-form label { display: block; font-size: 0.875rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--text-main); }
                .modal-form input, .modal-form select, .modal-form textarea { 
                    width: 100%; 
                    padding: 0.75rem 1rem; 
                    border: 1px solid #E2E8F0; 
                    border-radius: 12px; 
                    background: #F8FAFC; 
                    font-size: 1rem; 
                    transition: all 0.2s;
                }
                .modal-form input:focus, .modal-form select:focus, .modal-form textarea:focus { 
                    border-color: var(--orange-primary); 
                    background: white; 
                    outline: none; 
                    box-shadow: 0 0 0 3px rgba(221, 107, 32, 0.1); 
                }

                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
                .form-group { margin-bottom: 1.5rem; }

                .form-actions-footer { 
                    display: flex; 
                    gap: 1rem; 
                    justify-content: flex-end; 
                    padding-top: 1.5rem; 
                    border-top: 1px solid #F1F5F9; 
                }
                
                .btn-cancel { 
                    padding: 0.75rem 1.5rem; 
                    background: #F1F5F9; 
                    border: none; 
                    border-radius: 12px; 
                    font-weight: 700; 
                    color: var(--text-muted); 
                    cursor: pointer; 
                    transition: all 0.2s; 
                }
                .btn-cancel:hover { background: #E2E8F0; color: var(--text-main); }

                .btn-save.orange { 
                    padding: 0.75rem 1.5rem; 
                    background: linear-gradient(135deg, var(--orange-primary) 0%, #ED8936 100%); 
                    color: white; 
                    border: none; 
                    border-radius: 12px; 
                    font-weight: 700; 
                    cursor: pointer; 
                    transition: all 0.2s;
                    box-shadow: 0 4px 12px rgba(221, 107, 32, 0.2);
                }
                .btn-save.orange:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(221, 107, 32, 0.3); }

                /* Awarding Bodies Grid in Modal */
                .modal-body-scroll { max-height: 500px; overflow-y: auto; margin-bottom: 1.5rem; padding-right: 0.5rem; }
                .awarding-bodies-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; }
                .awarding-body-card { 
                    background: #F8FAFC; 
                    border: 1px solid #E2E8F0; 
                    border-radius: 12px; 
                    padding: 1rem; 
                    transition: all 0.2s;
                }
                .awarding-body-card:hover { border-color: var(--orange-light); box-shadow: var(--shadow-sm); }
                .awarding-body-card h4 { margin: 0.5rem 0 0.25rem 0; font-size: 1rem; font-weight: 700; color: var(--text-main); }
                .body-subtitle { font-size: 0.75rem; color: var(--text-muted); margin: 0 0 0.75rem 0; }
                .body-status { margin-top: 0.75rem; }
                .status-active { color: #059669; background: #D1FAE5; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
                .status-inactive { color: #DC2626; background: #FEE2E2; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }

                /* Integration Sections */
                .integration-section { 
                    background: #F8FAFC; 
                    border: 1px solid #E2E8F0; 
                    border-radius: 12px; 
                    padding: 1.5rem; 
                    margin-bottom: 1.5rem; 
                }
                .integration-section h3 { 
                    margin: 0 0 1rem 0; 
                    font-size: 1.125rem; 
                    font-weight: 700; 
                    color: var(--orange-dark); 
                }

                /* EMPTY STATE */
                .empty-state-modern { 
                    text-align: center; 
                    padding: 5rem 2rem; 
                    background: #f8fafc; 
                    border-radius: 24px; 
                    border: 2px dashed #e2e8f0; 
                    margin-top: 2rem;
                }
                .empty-icon { font-size: 4rem; margin-bottom: 1.5rem; opacity: 0.5; }
                .empty-state-modern h2 { font-size: 1.5rem; font-weight: 900; color: var(--text-main); margin-bottom: 0.5rem; }
                .empty-state-modern p { color: var(--text-muted); font-weight: 600; margin: 0.5rem 0; }
                .btn-link { 
                    background: transparent; 
                    border: none; 
                    color: var(--orange-primary); 
                    font-weight: 700; 
                    cursor: pointer; 
                    text-decoration: underline; 
                    margin-top: 1rem;
                }

                /* LOADER */
                .next-gen-loader.orange { 
                    border: 4px solid #f3f3f3; 
                    border-top: 4px solid var(--orange-primary); 
                    border-radius: 50%; 
                    width: 50px; 
                    height: 50px; 
                    animation: spin 1s linear infinite; 
                }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                @media (max-width: 768px) {
                    .glass-header { height: auto; padding: 1rem 0; }
                    .glass-header h1 { font-size: 1.1rem; }
                    .header-content { flex-direction: column; gap: 1rem; align-items: flex-start; }
                    .header-actions { width: 100%; justify-content: space-between; }
                    .programs-grid-2026 { grid-template-columns: 1fr; }
                    .hide-on-mobile { display: none !important; }
                    .form-grid { grid-template-columns: 1fr; }
                    .awarding-bodies-grid { grid-template-columns: 1fr; }
                    .modal-content-2026 { max-width: 100%; max-height: 95vh; }
                }
            ` }} />
        </div>
    );
}
