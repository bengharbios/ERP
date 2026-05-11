// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
    UserPlus, Plus, Search, Filter, LayoutGrid, List, Download,
    Check, Columns, Phone, Mail, AlertTriangle, ChevronDown,
    Star, ArrowRightLeft, Edit2, Trash2, X, Globe, User,
    Settings, RefreshCw, Copy, CheckCircle, Tag, SlidersHorizontal, Users,
    TrendingUp, TrendingDown
} from 'lucide-react';
import { leadApi, stageApi } from '../services/crm.service';
import { hrService } from '../services/hr.service';
import { academicService } from '../services/academic.service';
import { Toast } from '../components/Toast';
import { useAuthStore } from '../store/authStore';
import { HzModal, HzBtn, HzLoader, HzEmpty } from '../layouts/Rapidos2026/components/RapidosUI';
import './CRMLeads2026.css';

/* ─── COUNTRY DATA ──────────────────────────────── */
const COUNTRIES = [
    { code: 'AE', name: 'الإمارات', flag: '🇦🇪', dial: '+971' },
    { code: 'SA', name: 'السعودية', flag: '🇸🇦', dial: '+966' },
    { code: 'KW', name: 'الكويت', flag: '🇰🇼', dial: '+965' },
    { code: 'QA', name: 'قطر', flag: '🇶🇦', dial: '+974' },
    { code: 'BH', name: 'البحرين', flag: '🇧🇭', dial: '+973' },
    { code: 'OM', name: 'عُمان', flag: '🇴🇲', dial: '+968' },
    { code: 'EG', name: 'مصر', flag: '🇪🇬', dial: '+20' },
    { code: 'JO', name: 'الأردن', flag: '🇯🇴', dial: '+962' },
    { code: 'LB', name: 'لبنان', flag: '🇱🇧', dial: '+961' },
    { code: 'IQ', name: 'العراق', flag: '🇮🇶', dial: '+964' },
    { code: 'SY', name: 'سوريا', flag: '🇸🇾', dial: '+963' },
    { code: 'YE', name: 'اليمن', flag: '🇾🇪', dial: '+967' },
    { code: 'MA', name: 'المغرب', flag: '🇲🇦', dial: '+212' },
    { code: 'TN', name: 'تونس', flag: '🇹🇳', dial: '+216' },
    { code: 'DZ', name: 'الجزائر', flag: '🇩🇿', dial: '+213' },
    { code: 'LY', name: 'ليبيا', flag: '🇱🇾', dial: '+218' },
    { code: 'PK', name: 'باكستان', flag: '🇵🇰', dial: '+92' },
    { code: 'IN', name: 'الهند', flag: '🇮🇳', dial: '+91' },
    { code: 'GB', name: 'بريطانيا', flag: '🇬🇧', dial: '+44' },
    { code: 'US', name: 'أمريكا', flag: '🇺🇸', dial: '+1' },
];

/* ─── PHONE INPUT COMPONENT ────────────────────── */
function PhoneInput({ value, countryCode, onValueChange, onCountryChange }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef(null);
    const country = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];
    const filtered = COUNTRIES.filter(c =>
        c.name.includes(search) || c.dial.includes(search) || c.code.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="crm-phone-wrap" ref={ref} style={{ position: 'relative' }}>
            <input
                className="crm-phone-input"
                type="tel"
                placeholder="5XXXXXXXX"
                value={value}
                onChange={e => onValueChange(e.target.value.replace(/^0+/, ''))}
                dir="ltr"
            />
            <button type="button" className="crm-country-btn" onClick={() => setOpen(!open)}>
                <span className="crm-flag">{country.flag}</span>
                <span className="crm-dialcode">{country.dial}</span>
                <ChevronDown size={12} />
            </button>
            {open && (
                <div className="crm-country-dropdown" style={{ zIndex: 9999 }}>
                    <div className="crm-country-search">
                        <input autoFocus placeholder="ابحث عن الدولة..." value={search}
                            onChange={e => setSearch(e.target.value)} />
                    </div>
                    {filtered.map(c => (
                        <div key={c.code} className="crm-country-option"
                            onClick={() => { onCountryChange(c.code); setOpen(false); setSearch(''); }}>
                            <span style={{ fontSize: '1.1rem' }}>{c.flag}</span>
                            <span>{c.name}</span>
                            <span className="crm-country-option-code">{c.dial}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─── PRIORITY STARS ────────────────────────────── */
function PriorityStars({ value, onChange = null, size = 14 }) {
    const n = parseInt(value) || 1;
    return (
        <div className="crm-priority-stars">
            {[1, 2, 3].map(i => (
                <span key={i} className={`crm-star ${i <= n ? 'filled' : ''}`}
                    style={{ cursor: onChange ? 'pointer' : 'default', fontSize: size }}
                    onClick={() => onChange && onChange(String(i))}>★</span>
            ))}
        </div>
    );
}

/* ─── COLUMN DEFINITIONS ────────────────────────── */
const ALL_COLUMNS = [
    { key: 'name', label: 'اسم العميل', always: true },
    { key: 'phone', label: 'الهاتف' },
    { key: 'emailFrom', label: 'البريد الإلكتروني' },
    { key: 'stage', label: 'المرحلة' },
    { key: 'salesperson', label: 'مسؤول المبيعات' },
    { key: 'source', label: 'المصدر' },
    { key: 'priority', label: 'الأولوية' },
    { key: 'score', label: 'النقاط' },
    { key: 'program', label: 'البرنامج' },
    { key: 'createdAt', label: 'تاريخ الإضافة' },
    { key: 'nationality', label: 'الجنسية' },
    { key: 'emirate', label: 'الإمارة' },
    { key: 'interestedDiploma', label: 'الدبلوم المهتم به' },
    { key: 'levelOfInterest', label: 'درجة الاهتمام' },
    { key: 'isDuplicate', label: 'مكرر' },
];

const DEFAULT_VISIBLE = ['name', 'phone', 'emailFrom', 'stage', 'salesperson', 'source', 'priority', 'createdAt'];

const SOURCES = ['WhatsApp', 'Facebook', 'Instagram', 'Call', 'Walk-in', 'Website', 'Referral', 'Email'];

const emptyForm = () => ({
    name: '', contactName: '', emailFrom: '', phone: '', mobile: '',
    countryCode: 'AE', mobileCountryCode: 'AE',
    website: '', source: 'WhatsApp', priority: '1',
    salespersonId: '', teamId: '', programId: '', notes: '',
    expectedRevenue: '', dateDeadline: '',
    nationality: '', emirate: '', interestedDiploma: '', levelOfInterest: 0,
    customFields: {} as Record<string, string>,
});

/* ─── MAIN COMPONENT ────────────────────────────── */
export default function CRMLeads2026() {
    const [leads, setLeads] = useState([]);
    const [stages, setStages] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user: currentUser } = useAuthStore();

    // UI
    const [viewMode, setViewMode] = useState<'kanban' | 'table'>('table');
    const [showSidebar, setShowSidebar] = useState(window.innerWidth > 900);
    const [showColPanel, setShowColPanel] = useState(false);
    const [visibleCols, setVisibleCols] = useState<string[]>(DEFAULT_VISIBLE);
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

    // Filters
    const [search, setSearch] = useState('');
    const [filterSource, setFilterSource] = useState('');
    const [filterStage, setFilterStage] = useState('');
    const [filterSalesp, setFilterSalesp] = useState('');
    const [filterProgram, setFilterProgram] = useState('');
    const [filterDup, setFilterDup] = useState(false);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState(emptyForm());
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [dupWarning, setDupWarning] = useState<any[]>([]);
    const [dupChecking, setDupChecking] = useState(false);
    const [showMyNotesOnly, setShowMyNotesOnly] = useState(false);

    // Custom fields manager
    const [showCfManager, setShowCfManager] = useState(false);
    const [customFieldDefs, setCustomFieldDefs] = useState<{ key: string; label: string; type: string }[]>(
        () => JSON.parse(localStorage.getItem('crm_custom_fields') || '[]')
    );
    const [newCfLabel, setNewCfLabel] = useState('');
    const [newCfType, setNewCfType] = useState('text');

    // Convert modal
    const [showConvert, setShowConvert] = useState(false);
    const [convertLead, setConvertLead] = useState<any>(null);
    const [convertStageId, setConvertStageId] = useState('');
    const [convertSalesperson, setConvertSalesperson] = useState('');
    const [convertFormData, setConvertFormData] = useState({
        name: '', contactName: '', phone: '', emailFrom: '',
        expectedRevenue: 0, probability: 20,
        dateDeadline: '', // Expected closing date
        sourceId: '',     // Source
        notes: ''         // Additional notes
    });
    const [convertDups, setConvertDups] = useState<any[]>([]);
    const [convertDupLoading, setConvertDupLoading] = useState(false);
    const [partnerMode, setPartnerMode] = useState<'create' | 'link'>('create');
    const [selectedPartnerId, setSelectedPartnerId] = useState('');

    // Google Sheets Sync States
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [sheetUrl, setSheetUrl] = useState(() => localStorage.getItem('crm_sync_sheet_url') || '');
    const [sheetRange, setSheetRange] = useState(() => localStorage.getItem('crm_sync_sheet_range') || 'Sheet1!A:Z');
    const [syncing, setSyncing] = useState(false);
    const [syncSummary, setSyncSummary] = useState<any>(null);
    const [syncProgress, setSyncProgress] = useState<string | null>(null);

    const handleSyncGoogleSheets = async () => {
        if (!sheetUrl.trim()) {
            setToast({ type: 'error', message: '⚠️ يرجى إدخال رابط ملف Google Sheet أولاً.' });
            return;
        }

        setSyncing(true);
        setSyncSummary(null);
        setSyncProgress(null);
        localStorage.setItem('crm_sync_sheet_url', sheetUrl.trim());
        localStorage.setItem('crm_sync_sheet_range', sheetRange.trim());

        let totalProcessed = 0;
        let createdCount = 0;
        let duplicateCount = 0;
        let errors: string[] = [];

        const runBatch = async () => {
            try {
                const res = await leadApi.syncGoogleSheets({
                    spreadsheetUrl: sheetUrl.trim(),
                    range: sheetRange.trim()
                });

                if (res.success) {
                    const s = res.summary;
                    totalProcessed = s.totalProcessed; // Cumulative as server always starts counting from row 1
                    createdCount += s.createdCount;
                    duplicateCount += s.duplicateCount;
                    if (s.errors && s.errors.length > 0) {
                        errors = [...errors, ...s.errors];
                    }

                    // Set cumulative summary
                    setSyncSummary({
                        totalProcessed,
                        createdCount,
                        duplicateCount,
                        errors: errors.slice(0, 150)
                    });

                    if (res.reachedBatchLimit) {
                        setSyncProgress(`📥 تم معالجة ${totalProcessed} سطر بنجاح. جاري استكمال بقية العملاء تلقائياً لمنع تعليق السيرفر...`);
                        setTimeout(runBatch, 1000); // 1s cooldown between database batch writes
                    } else {
                        setSyncProgress(null);
                        setToast({ type: 'success', message: '✅ اكتملت المزامنة لجميع العملاء والأسطر بنجاح!' });
                        setSyncing(false);
                        fetchAll();
                    }
                } else {
                    setSyncProgress(null);
                    setToast({ type: 'error', message: `❌ فشل: ${res.message}` });
                    setSyncing(false);
                    fetchAll();
                }
            } catch (err: any) {
                setSyncProgress(null);
                setToast({ type: 'error', message: `❌ فشل المزامنة: ${err?.response?.data?.error?.message || err.message}` });
                setSyncing(false);
                fetchAll();
            }
        };

        await runBatch();
    };

    const dupTimerRef = useRef<any>(null);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [leadsRes, stagesRes, empRes, progRes] = await Promise.all([
                leadApi.getAll({ type: 'lead' }),
                stageApi.getAll(),
                hrService.getEmployees(),
                academicService.getPrograms(),
            ]);
            setLeads(leadsRes.data || []);
            setStages(stagesRes.data || []);
            setEmployees(empRes.data || []);
            setPrograms(progRes.data?.programs || []);
        } catch { setToast({ type: 'error', message: '❌ فشل تحميل البيانات' }); }
        finally { setLoading(false); }
    };

    /* ── DUPLICATE CHECK (debounced) ── */
    const checkDuplicates = useCallback(async (phone: string, email: string, currentId?: string) => {
        if (!phone && !email) { setDupWarning([]); return; }
        setDupChecking(true);
        try {
            const res = await leadApi.getAll({});
            const all: any[] = res.data || [];
            const country = COUNTRIES.find(c => c.code === formData.countryCode);
            const fullPhone = country ? `${country.dial}${phone}` : phone;
            const dups = all.filter(l => {
                if (l.id === currentId) return false;
                const lPhone = (l.phone || '').replace(/\D/g, '').replace(/^0+/, '');
                const fPhone = fullPhone.replace(/\D/g, '').replace(/^0+/, '');
                const phoneMatch = phone && lPhone && (lPhone.endsWith(phone) || fPhone === lPhone);
                const emailMatch = email && l.emailFrom && l.emailFrom.toLowerCase() === email.toLowerCase();
                return phoneMatch || emailMatch;
            });
            setDupWarning(dups);
        } catch { /* silent */ }
        finally { setDupChecking(false); }
    }, [formData.countryCode]);

    const triggerDupCheck = (phone: string, email: string) => {
        clearTimeout(dupTimerRef.current);
        dupTimerRef.current = setTimeout(() => checkDuplicates(phone, email, editingId || undefined), 600);
    };

    /* ── FORM FIELD CHANGE ── */
    const setField = (key: string, val: any) => {
        setFormData(p => {
            const next = { ...p, [key]: val };
            if (key === 'phone' || key === 'emailFrom') triggerDupCheck(
                key === 'phone' ? val : next.phone,
                key === 'emailFrom' ? val : next.emailFrom
            );
            return next;
        });
        if (formErrors[key]) setFormErrors(p => ({ ...p, [key]: '' }));
    };

    /* ── VALIDATION ── */
    const validate = () => {
        const e: Record<string, string> = {};
        if (!formData.name?.trim()) e.name = 'اسم العميل مطلوب';
        if (!formData.phone?.trim()) e.phone = 'رقم الهاتف مطلوب';
        setFormErrors(e);
        return !Object.keys(e).length;
    };

    /* ── OPEN MODAL ── */
    const openModal = (lead?: any) => {
        setFormErrors({}); setDupWarning([]);
        if (lead) {
            setEditingId(lead.id);
            const sourceNote = (lead.notes || []).find((n: any) => n.content?.startsWith('📌'));
            const src = sourceNote?.content?.replace('📌 مصدر العميل: ', '') || 'WhatsApp';
            setFormData({
                ...emptyForm(),
                name: lead.name || '',
                contactName: lead.contactName || '',
                emailFrom: lead.emailFrom || '',
                phone: lead.phone || '',
                mobile: lead.mobile || '',
                countryCode: 'AE',
                mobileCountryCode: 'AE',
                website: lead.website || '',
                source: src,
                priority: lead.priority || '1',
                salespersonId: lead.salespersonId || '',
                programId: '',
                expectedRevenue: lead.expectedRevenue?.toString() || '',
                dateDeadline: lead.dateDeadline ? lead.dateDeadline.split('T')[0] : '',
                nationality: lead.nationality || '',
                emirate: lead.emirate || '',
                interestedDiploma: lead.interestedDiploma || '',
                levelOfInterest: lead.levelOfInterest || 0,
                customFields: (lead.customFields as any) || {},
                notes: '',
            });
        } else {
            setEditingId(null);
            setFormData(emptyForm());
        }
        setShowModal(true);
    };

    /* ── SUBMIT ── */
    const handleSubmit = async () => {
        if (!validate()) return;
        const country = COUNTRIES.find(c => c.code === formData.countryCode);
        const fullPhone = formData.phone ? `${country?.dial || ''}${formData.phone}` : '';
        try {
            const payload = {
                name: formData.name,
                contactName: formData.contactName,
                emailFrom: formData.emailFrom,
                phone: fullPhone,
                mobile: formData.mobile,
                website: formData.website,
                priority: formData.priority,
                salespersonId: formData.salespersonId || undefined,
                expectedRevenue: formData.expectedRevenue ? parseFloat(formData.expectedRevenue) : undefined,
                dateDeadline: formData.dateDeadline ? new Date(formData.dateDeadline).toISOString() : undefined,
                source: formData.source,
                programId: formData.programId,
                notes: formData.notes,
                nationality: formData.nationality,
                emirate: formData.emirate,
                interestedDiploma: formData.interestedDiploma,
                levelOfInterest: formData.levelOfInterest,
                customFields: formData.customFields,
                type: 'lead',
            };
            const res = editingId ? await leadApi.update(editingId, payload) : await leadApi.create(payload);
            if (res.data) {
                setToast({ type: 'success', message: editingId ? '✅ تم تحديث العميل' : '✅ تم إضافة العميل' });
                setShowModal(false);
                fetchAll();
            }
        } catch (err: any) {
            setToast({ type: 'error', message: `❌ ${err?.response?.data?.error?.message || 'فشل الحفظ'}` });
        }
    };

    /* ── DELETE ── */
    const handleDelete = async (id: string) => {
        try {
            await leadApi.delete(id);
            setToast({ type: 'success', message: '🗑️ تم الحذف' });
            fetchAll();
        } catch { setToast({ type: 'error', message: '❌ فشل الحذف' }); }
    };

    /* ── CONVERT ── */
    const openConvert = (lead: any, e: any) => {
        e.stopPropagation();
        setConvertLead(lead);
        setConvertStageId(stages[0]?.id || ''); // Default to first stage
        setConvertSalesperson(lead.salespersonId || '');

        const sourceNote = (lead.notes || []).find((n: any) => n.content?.startsWith('📌'));
        const src = sourceNote?.content?.replace('📌 مصدر العميل: ', '') || '';

        setConvertFormData({
            name: lead.name || '',
            contactName: lead.contactName || '',
            emailFrom: lead.emailFrom || '',
            phone: lead.phone || '',
            expectedRevenue: lead.expectedRevenue || 0,
            probability: 20, // Default probability
            dateDeadline: lead.dateDeadline ? lead.dateDeadline.split('T')[0] : '',
            sourceId: src, // Assuming source is a string, not an ID
            notes: (lead.notes || []).map((n: any) => n.content).join('\n') || '', // Combine all notes
        });
        setConvertDups([]);
        setPartnerMode('create');
        setSelectedPartnerId('');
        setShowConvert(true);

        // Run initial duplicate check
        handleConvertDupCheck(lead.phone || '', lead.emailFrom || '', lead.id);
    };

    const handleConvertDupCheck = async (phone: string, email: string, leadId: string) => {
        if (!phone && !email) return;
        setConvertDupLoading(true);
        try {
            // We use the specialized endpoint if possible, but leadApi.getAll works too.
            // Let's assume we have checkDuplicates in leadApi (based on previous knowledge)
            const res = await leadApi.checkDuplicates(leadId);
            const dups = res.data || [];
            setConvertDups(dups);
            if (dups.some((d: any) => d.type === 'customer')) {
                setPartnerMode('link');
                setSelectedPartnerId(dups.find((d: any) => d.type === 'customer')?.id || '');
            }
        } catch { /* ignore */ }
        finally { setConvertDupLoading(false); }
    };

    const handleConvertAction = async () => {
        if (!convertLead) return;
        setLoading(true);
        try {
            const payload = {
                ...convertFormData,
                salespersonId: convertSalesperson || null,
                stageId: convertStageId || null, // Use convertStageId
                dateDeadline: convertFormData.dateDeadline || undefined,
                expectedRevenue: convertFormData.expectedRevenue || undefined,
                probability: convertFormData.probability,
                sourceId: convertFormData.sourceId, // Correctly use sourceId
                notes: convertFormData.notes,
            };

            if (convertLead) {
                await leadApi.convertToOpportunity(convertLead.id, payload);
                setToast({ type: 'success', message: '🚀 تمت العملية بنجاح! تم تسجيل العميل وإنشاء فرصة المبيعات.' });
            }
            setShowConvert(false);
            fetchAll();
        } catch (err: any) {
            setToast({ type: 'error', message: `❌ فشل إتمام عملية التحويل: ${err?.response?.data?.error?.message || ''}` });
        } finally {
            setLoading(false);
        }
    };

    /* ── CUSTOM FIELDS ── */
    const saveCf = () => {
        if (!newCfLabel.trim()) return;
        const def = { key: `cf_${Date.now()}`, label: newCfLabel.trim(), type: newCfType };
        const next = [...customFieldDefs, def];
        setCustomFieldDefs(next);
        localStorage.setItem('crm_custom_fields', JSON.stringify(next));
        setNewCfLabel(''); setNewCfType('text');
    };
    const removeCf = (key: string) => {
        const next = customFieldDefs.filter(f => f.key !== key);
        setCustomFieldDefs(next);
        localStorage.setItem('crm_custom_fields', JSON.stringify(next));
    };

    /* ── COLUMN TOGGLE ── */
    const toggleCol = (key: string) => {
        setVisibleCols(p => p.includes(key) ? p.filter(k => k !== key) : [...p, key]);
    };

    /* ── FILTER ── */
    const filtered = useMemo(() => leads.filter((l: any) => {
        const hay = `${l.name} ${l.phone} ${l.emailFrom} ${l.contactName}`.toLowerCase();
        if (search && !hay.includes(search.toLowerCase())) return false;

        // Search in sourceId field (or fall back to notes for older records)
        if (filterSource) {
            const src = l.sourceId || l.source; // Check direct fields first
            if (src) {
                if (src !== filterSource) return false;
            } else {
                // Fallback to extraction from notes for legacy data
                const srcNote = l.notes?.find((n: any) => n.content?.startsWith('📌'));
                const noteSrc = srcNote?.content?.replace('📌 مصدر العميل: ', '') || '';
                if (noteSrc !== filterSource) return false;
            }
        }

        if (filterStage && l.stageId !== filterStage) return false;
        if (filterSalesp && l.salespersonId !== filterSalesp) return false;
        if (filterProgram && l.programId !== filterProgram) return false;
        if (filterDup && !l.isDuplicate) return false;
        return true;
    }), [leads, search, filterSource, filterStage, filterSalesp, filterProgram, filterDup]);

    /* ── SORTING ── */
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
        key: 'createdAt',
        direction: 'desc'
    });

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const sortedAndFiltered = useMemo(() => {
        const result = [...filtered];
        if (sortConfig) {
            result.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];
                
                // Handle special fields
                if (sortConfig.key === 'stage') {
                    aVal = a.stage?.name || '';
                    bVal = b.stage?.name || '';
                } else if (sortConfig.key === 'salesperson') {
                    aVal = a.salesperson?.username || '';
                    bVal = b.salesperson?.username || '';
                } else if (sortConfig.key === 'source') {
                    aVal = a.sourceId || a.source || '';
                    bVal = b.sourceId || b.source || '';
                }

                if (aVal === undefined || aVal === null) return 1;
                if (bVal === undefined || bVal === null) return -1;

                if (sortConfig.key === 'createdAt') {
                    const d1 = new Date(aVal).getTime();
                    const d2 = new Date(bVal).getTime();
                    return sortConfig.direction === 'asc' ? d1 - d2 : d2 - d1;
                }

                if (typeof aVal === 'string') {
                    return sortConfig.direction === 'asc' 
                        ? aVal.localeCompare(bVal) 
                        : bVal.localeCompare(aVal);
                }

                return sortConfig.direction === 'asc' 
                    ? (aVal > bVal ? 1 : -1) 
                    : (bVal > aVal ? 1 : -1);
            });
        }
        return result;
    }, [filtered, sortConfig]);

    /* ── LAZY SCROLL PAGINATION ── */
    const [visibleCount, setVisibleCount] = useState(100);

    // Reset visible count when filters or search changes
    useEffect(() => {
        setVisibleCount(100);
    }, [search, filterSource, filterStage, filterSalesp, filterProgram, filterDup]);

    const displayedLeads = useMemo(() => {
        return sortedAndFiltered.slice(0, visibleCount);
    }, [sortedAndFiltered, visibleCount]);

    /* ── STATS ── */
    const stats = useMemo(() => ({
        total: leads.length,
        dups: leads.filter((l: any) => l.isDuplicate).length,
        new: leads.filter((l: any) => !l.stageId).length,
    }), [leads]);

    const empOptions = employees.filter((e: any) => e.userId).map((e: any) => ({
        id: e.userId,
        label: `${e.user?.firstName || ''} ${e.user?.lastName || ''}`.trim() || e.employeeCode,
    }));

    const getSalespName = (lead: any) => lead.salesperson?.username || '—';
    const getStage = (lead: any) => lead.stage?.name || '—';

    /* ── RENDER CELL ── */
    const renderCell = (col: string, lead: any) => {
        switch (col) {
            case 'phone': return <span dir="ltr">{lead.phone || '—'}</span>;
            case 'emailFrom': return <span style={{ fontSize: '0.78rem', color: 'var(--hz-text-muted)' }}>{lead.emailFrom || '—'}</span>;
            case 'stage': return <span style={{ background: 'var(--hz-surface-3)', borderRadius: 6, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}>{getStage(lead)}</span>;
            case 'salesperson': return <span>{getSalespName(lead)}</span>;
            case 'source': {
                const src = lead.sourceId || lead.source;
                if (src) return <span className="crm-tag crm-tag-source">{src}</span>;
                const srcNote = lead.notes?.find((n: any) => n.content?.startsWith('📌'));
                const noteSrc = srcNote?.content?.replace('📌 مصدر العميل: ', '') || '—';
                return <span>{noteSrc}</span>;
            }
            case 'priority': return <PriorityStars value={lead.priority} />;
            case 'score': return <span className="crm-tag crm-tag-score">⭐ {lead.score}</span>;
            case 'program': return <span style={{ fontSize: '0.78rem' }}>—</span>;
            case 'createdAt': return <span style={{ fontSize: '0.75rem', color: 'var(--hz-text-muted)', fontWeight: 'bold' }}>{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('ar-AE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>;
            case 'isDuplicate': return lead.isDuplicate ? <span className="crm-dup-tag"><AlertTriangle size={10} /> مكرر</span> : <span style={{ color: 'var(--hz-text-muted)', fontSize: '0.7rem' }}>—</span>;
            case 'nationality': return <span>{lead.nationality || '—'}</span>;
            case 'emirate': return <span>{lead.emirate || '—'}</span>;
            case 'interestedDiploma': return <span style={{ fontSize: '0.78rem' }}>{lead.interestedDiploma || '—'}</span>;
            case 'levelOfInterest': return <span className="crm-tag" style={{ background: 'var(--hz-orange-soft)', color: 'var(--hz-orange)' }}>{lead.levelOfInterest}/10</span>;
            default: return '—';
        }
    };

    const ToolbarActions = () => (
        <>
            <div style={{ position: 'relative' }}>
                <button className={`crm-icon-btn ${showColPanel ? 'active' : ''}`} title="الأعمدة" onClick={() => setShowColPanel(!showColPanel)}>
                    <Columns size={15} />
                </button>
                {showColPanel && (
                    window.innerWidth > 900 ? (
                        <div className="crm-col-panel">
                            <div className="crm-col-panel-head">الأعمدة الظاهرة</div>
                            <div className="crm-col-panel-list">
                                {ALL_COLUMNS.filter(c => !c.always).map(col => (
                                    <div key={col.key} className="crm-col-item" onClick={() => toggleCol(col.key)}>
                                        <div className={`crm-col-check ${visibleCols.includes(col.key) ? 'on' : ''}`}>
                                            {visibleCols.includes(col.key) && <Check size={10} />}
                                        </div>
                                        {col.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <HzModal open={true} title="الأعمدة الظاهرة" onClose={() => setShowColPanel(false)} icon={<Columns size={20} color="var(--hz-cyan)" />}>
                            <div className="crm-selection-box mobile">
                                {ALL_COLUMNS.filter(c => !c.always).map(col => (
                                    <div key={col.key} className={`crm-selection-item ${visibleCols.includes(col.key) ? 'selected' : ''}`} onClick={() => toggleCol(col.key)}>
                                        <div className="crm-selection-check">
                                            {visibleCols.includes(col.key) && <Check size={12} />}
                                        </div>
                                        <span className="crm-selection-text">{col.label}</span>
                                    </div>
                                ))}
                            </div>
                        </HzModal>
                    )
                )}
            </div>
            <button className={`crm-icon-btn ${showCfManager ? 'active' : ''}`} title="الحقول المخصصة" onClick={() => setShowCfManager(!showCfManager)}>
                <Settings size={15} />
            </button>
            {showCfManager && window.innerWidth <= 900 && (
                <HzModal open={true} title="مدير الحقول المخصصة" onClose={() => setShowCfManager(false)} icon={<Settings size={20} color="var(--hz-cyan)" />}>
                    <div className="crm-selection-box mobile">
                        {customFieldDefs.length === 0 ? (
                            <div className="hz-empty" style={{ padding: '20px' }}>
                                <p>لا توجد حقول مخصصة حالياً</p>
                            </div>
                        ) : (
                            customFieldDefs.map(f => (
                                <div key={f.key} className="crm-selection-item sticky-action">
                                    <div className="crm-selection-text">
                                        <span style={{ display: 'block', fontWeight: 800, color: 'var(--hz-text-bright)' }}>{f.label}</span>
                                        <small style={{ color: 'var(--hz-text-muted)', fontSize: '0.7rem' }}>
                                            نوع الحقل: {f.type === 'text' ? 'نص' : f.type === 'number' ? 'رقم' : 'تاريخ'}
                                        </small>
                                    </div>
                                    <button className="crm-cf-del-btn" onClick={() => removeCf(f.key)} title="حذف">
                                        <Trash2 size={13} color="var(--hz-red)" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="crm-cf-modal-add">
                        <div className="crm-cf-add-grid">
                            <input
                                className="crm-sidebar-input"
                                placeholder="اسم الحقل..."
                                value={newCfLabel}
                                onChange={(e) => setNewCfLabel(e.target.value)}
                            />
                            <select
                                className="crm-sidebar-input"
                                value={newCfType}
                                onChange={(e) => setNewCfType(e.target.value as any)}
                            >
                                <option value="text">نص</option>
                                <option value="number">رقم</option>
                                <option value="date">تاريخ</option>
                            </select>
                            <button className="crm-icon-btn active" onClick={saveCf}>
                                <Plus size={13} color="var(--hz-green)" />
                            </button>
                        </div>
                    </div>
                </HzModal>
            )}
            <button className="crm-icon-btn" onClick={fetchAll} title="تحديث">
                <RefreshCw size={15} />
            </button>
            <div className="crm-view-switch">
                <button className={`crm-view-btn ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => setViewMode('kanban')}><LayoutGrid size={15} /></button>
                <button className={`crm-view-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}><List size={15} /></button>
            </div>
        </>
    );

    /* ── JSX ── */
    return (
        <div style={{ padding: '0 20px 20px' }}>
            <div className="crm-root">

                {/* ── TOOLBAR ── */}
                <div className="crm-toolbar">
                    <h1 className="crm-toolbar-title">
                        <UserPlus size={19} />
                        <span className="crm-toolbar-title-text visible-mobile">العملاء المحتملون</span>
                    </h1>

                    <div className="crm-toolbar-actions-mobile-top">
                        <button className="crm-icon-btn" onClick={() => { setSyncSummary(null); setShowSyncModal(true); }} title="مزامنة Google Sheets" style={{ background: 'rgba(15, 157, 88, 0.15)', color: '#0F9D58', marginLeft: 6 }}>
                            <Download size={18} />
                        </button>
                        <button className="crm-add-btn mini" onClick={() => openModal()} title="إضافة عميل">
                            <Plus size={18} />
                        </button>
                        <button className={`crm-icon-btn ${showSidebar ? 'active' : ''}`} onClick={() => setShowSidebar(!showSidebar)} title="الفلاتر">
                            <SlidersHorizontal size={18} />
                        </button>
                    </div>

                    <div className="crm-stats-row hide-on-mobile">
                        <div className="crm-stat-pill">الكل <b>{stats.total}</b></div>
                        {stats.dups > 0 && <div className="crm-stat-pill" style={{ color: '#FF6B6B' }}>مكرر <b>{stats.dups}</b></div>}
                    </div>

                        <div className="crm-toolbar-end">
                            {/* Desktop Actions */}
                            <div className="crm-toolbar-actions-desktop">
                                <ToolbarActions />
                                <button className={`crm-icon-btn ${showSidebar ? 'active' : ''}`} onClick={() => setShowSidebar(!showSidebar)} title="الفلاتر">
                                    <SlidersHorizontal size={15} />
                                </button>
                            </div>

                            <button className="crm-sync-sheets-btn" onClick={() => { setSyncSummary(null); setShowSyncModal(true); }} style={{
                                background: 'linear-gradient(135deg, #0F9D58, #0B8043)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 10,
                                padding: '8px 16px',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                marginRight: 8,
                                boxShadow: '0 4px 12px rgba(15, 157, 88, 0.2)',
                                transition: 'all 0.2s ease-in-out'
                            }}>
                                <Download size={15} /> مزامنة Google Sheets
                            </button>

                            <button className="crm-add-btn" onClick={() => openModal()}>
                                <Plus size={16} /> عميل جديد
                            </button>
                        </div>
                </div>

                {/* ── MOBILE TOOLBAR ── */}
                <div className="crm-mobile-header">
                    <div className="crm-mobile-search-row">
                        <div className="crm-mobile-search-wrap">
                            <Search size={14} />
                            <input className="crm-mobile-search" placeholder="بحث باسم العميل، الهاتف..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                    </div>
                    <div className="crm-mobile-actions-row">
                        <ToolbarActions />
                    </div>
                </div>

                {/* ── BODY ── */}
                <div className="crm-body">

                    {/* SIDEBAR OVERLAY (Mobile) */}
                    <div className={`ag-sidebar-overlay ${showSidebar ? 'show' : ''}`} onClick={() => setShowSidebar(false)} />

                    {/* SIDEBAR (Premium ag-style) */}
                    <aside className={`ag-sidebar ${showSidebar ? 'show' : 'hide'}`}>
                        <div className="ag-sidebar-head">
                            <span className="ag-sidebar-head-title">تصفية النتائج</span>
                            <button className="ag-sidebar-head-close" onClick={() => setShowSidebar(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="ag-sidebar-pane">
                            {/* Search Group */}
                            <div className="ag-filter-group">
                                <label className="ag-filter-label">بحث سريع</label>
                                <div className="ag-search">
                                    <Search size={14} />
                                    <input
                                        placeholder="الاسم، الهاتف، البريد..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="ag-divider" />

                            {/* Salesperson Group */}
                            <div className="ag-filter-group">
                                <label className="ag-filter-label">مسؤول المبيعات</label>
                                <select className="ag-select" value={filterSalesp} onChange={e => setFilterSalesp(e.target.value)}>
                                    <option value="">كل الموظفين</option>
                                    {empOptions.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
                                </select>
                            </div>

                            {/* Stage Group */}
                            <div className="ag-filter-group">
                                <label className="ag-filter-label">المرحلة</label>
                                <select className="ag-select" value={filterStage} onChange={e => setFilterStage(e.target.value)}>
                                    <option value="">كل المراحل</option>
                                    {stages.map((s: any) => <option key={s.id} value={s.id}>{s.nameAr || s.name}</option>)}
                                </select>
                            </div>

                            {/* Source Group */}
                            <div className="ag-filter-group">
                                <label className="ag-filter-label">مصدر العميل</label>
                                <select className="ag-select" value={filterSource} onChange={e => setFilterSource(e.target.value)}>
                                    <option value="">كل المصادر</option>
                                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            {/* Program Group */}
                            <div className="ag-filter-group">
                                <label className="ag-filter-label">البرنامج العلمي</label>
                                <select className="ag-select" value={filterProgram} onChange={e => setFilterProgram(e.target.value)}>
                                    <option value="">كل البرامج</option>
                                    {programs.map((p: any) => (
                                        <option key={p.id} value={p.id}>{p.nameAr}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="ag-divider" />

                            {/* Duplicate Filter */}
                            <div className="ag-filter-group">
                                <label className="ag-filter-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                                    <input
                                        type="checkbox"
                                        checked={filterDup}
                                        onChange={e => setFilterDup(e.target.checked)}
                                        style={{ width: 14, height: 14, cursor: 'pointer' }}
                                    />
                                    <span>إظهار المكررات فقط</span>
                                </label>
                            </div>

                            {/* Custom Fields Manager (Desktop Inline) */}
                            {showCfManager && window.innerWidth > 900 && (
                                <>
                                    <div className="ag-divider" />
                                    <div className="ag-filter-group">
                                        <label className="ag-filter-label">الحقول المخصصة</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {customFieldDefs.map(f => (
                                                <div key={f.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--hz-text-secondary)', background: 'var(--hz-surface-2)', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--hz-border-soft)' }}>
                                                    <span>{f.label}</span>
                                                    <button onClick={() => removeCf(f.key)} style={{ background: 'none', border: 'none', color: 'var(--hz-coral)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                                            <input
                                                className="ag-select"
                                                style={{ flex: 1, padding: '7px 8px' }}
                                                placeholder="اسم الحقل"
                                                value={newCfLabel}
                                                onChange={e => setNewCfLabel(e.target.value)}
                                            />
                                            <select className="ag-select" style={{ width: 70, padding: '7px 4px' }} value={newCfType} onChange={e => setNewCfType(e.target.value)}>
                                                <option value="text">نص</option>
                                                <option value="number">رقم</option>
                                                <option value="date">تاريخ</option>
                                            </select>
                                        </div>
                                        <button
                                            className="ag-btn"
                                            style={{
                                                background: 'var(--hz-orange)',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: 8,
                                                padding: '8px',
                                                marginTop: 4,
                                                cursor: 'pointer',
                                                fontWeight: 800,
                                                fontSize: '0.75rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 6
                                            }}
                                            onClick={saveCf}
                                        >
                                            <Plus size={14} /> إضافة حقل مخصص
                                        </button>
                                    </div>
                                </>
                            )}

                            <div style={{ marginTop: 'auto', paddingTop: 10 }}>
                                <button
                                    className="ag-btn ag-btn-ghost"
                                    style={{
                                        width: '100%',
                                        justifyContent: 'center',
                                        fontSize: '0.8rem',
                                        color: 'var(--hz-text-muted)',
                                        border: '1px dashed var(--hz-border-soft)',
                                        padding: '10px',
                                        borderRadius: 8,
                                        background: 'none',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                        setSearch('');
                                        setFilterSource('');
                                        setFilterStage('');
                                        setFilterSalesp('');
                                        setFilterProgram('');
                                        setFilterDup(false);
                                    }}
                                >
                                    مسح كل الفلاتر
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* MAIN */}
                    <main className="crm-main" onClick={() => setShowColPanel(false)}>
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><HzLoader /></div>
                        ) : filtered.length === 0 ? (
                            <div className="crm-empty">
                                <div className="crm-empty-icon"><UserPlus size={36} /></div>
                                <h3>لا يوجد عملاء محتملون</h3>
                                <p>أضف أول عميل محتمل بالضغط على "عميل جديد"</p>
                            </div>
                        ) : viewMode === 'table' ? (
                            /* ── TABLE ── */
                            <div className="crm-table-wrap">
                                <div className="crm-table-inner">
                                    <table className="crm-table">
                                        <thead>
                                            <tr>
                                                <th 
                                                    onClick={() => handleSort('name')} 
                                                    style={{ cursor: 'pointer', userSelect: 'none', transition: 'background-color 0.2s' }}
                                                    title="اضغط للترتيب حسب الاسم"
                                                >
                                                    العميل {sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                                                </th>
                                                {ALL_COLUMNS.filter(c => !c.always && visibleCols.includes(c.key)).map(c => (
                                                    <th 
                                                        key={c.key} 
                                                        onClick={() => handleSort(c.key)}
                                                        style={{ cursor: 'pointer', userSelect: 'none', transition: 'background-color 0.2s' }}
                                                        title={`اضغط للترتيب حسب ${c.label}`}
                                                    >
                                                        {c.label} {sortConfig?.key === c.key ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                                                    </th>
                                                ))}
                                                <th style={{ textAlign: 'center' }}>إجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {displayedLeads.map((lead: any, index: number) => (
                                                <tr key={lead.id} className={lead.isDuplicate ? 'crm-dup-row' : ''} onClick={() => openModal(lead)}>
                                                    <td>
                                                        <div className="crm-cell-name">
                                                            <span style={{ fontSize: '0.82rem', color: 'var(--hz-text-muted)', fontWeight: 800, minWidth: 28, display: 'inline-block', textAlign: 'center', marginLeft: 6 }}>
                                                                #{index + 1}
                                                            </span>
                                                            <div className="crm-cell-avatar">{lead.name?.charAt(0)?.toUpperCase() || '؟'}</div>
                                                            <div>
                                                                <div className="crm-cell-name-text">
                                                                    {lead.isDuplicate && (
                                                                        <span className="crm-dup-tag animate-pulse" style={{ marginLeft: 6, background: '#FF6B00', color: '#fff', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 'bold' }}>
                                                                            🔥 مكرر {lead.duplicateCount ? `${lead.duplicateCount} مرات` : ''}
                                                                        </span>
                                                                    )}
                                                                    {lead.name}
                                                                </div>
                                                                {lead.contactName && <div style={{ fontSize: '0.72rem', color: 'var(--hz-text-muted)' }}>{lead.contactName}</div>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {ALL_COLUMNS.filter(c => !c.always && visibleCols.includes(c.key)).map(c => (
                                                        <td key={c.key}>{renderCell(c.key, lead)}</td>
                                                    ))}
                                                    <td style={{ textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'center', gap: 5 }} onClick={e => e.stopPropagation()}>
                                                            <button className="ag-btn-icon" title="تحويل لفرصة" onClick={e => openConvert(lead, e)}><ArrowRightLeft size={13} /></button>
                                                            <button className="ag-btn-icon" title="حذف" style={{ color: '#FF4D4D', borderColor: 'rgba(255,77,77,.25)' }} onClick={() => handleDelete(lead.id)}><Trash2 size={13} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {sortedAndFiltered.length > visibleCount && (
                                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px', background: 'var(--hz-surface-2)', borderTop: '1px solid var(--hz-border-soft)', borderRadius: '0 0 12px 12px' }}>
                                        <button 
                                            className="ag-btn" 
                                            style={{
                                                background: 'linear-gradient(135deg, var(--hz-primary), #4d88ff)',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: 10,
                                                padding: '10px 24px',
                                                fontWeight: 800,
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                boxShadow: '0 4px 12px rgba(0, 102, 255, 0.2)'
                                            }}
                                            onClick={() => setVisibleCount(p => p + 150)}
                                        >
                                            <Plus size={14} /> عرض المزيد من العملاء ({sortedAndFiltered.length - visibleCount} عملاء متبقين)
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* ── KANBAN ── */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
                                <div className="crm-kanban">
                                    {displayedLeads.map((lead: any, index: number) => {
                                        const srcNote = lead.notes?.find((n: any) => n.content?.startsWith('📌'));
                                        const src = srcNote?.content?.replace('📌 مصدر العميل: ', '') || '';
                                        return (
                                            <div key={lead.id} className="crm-card" onClick={() => openModal(lead)}>
                                                <span style={{ position: 'absolute', top: 12, left: 12, fontSize: '0.72rem', color: 'var(--hz-text-muted)', fontWeight: 800 }}>
                                                    #{index + 1}
                                                </span>
                                                {lead.isDuplicate && (
                                                    <div className="crm-card-dup-badge" style={{ background: '#FF6B00', color: '#fff', fontSize: '0.68rem', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                        🔥 مكرر {lead.duplicateCount ? `${lead.duplicateCount} مرات` : ''}
                                                    </div>
                                                )}
                                                <div className="crm-card-header">
                                                    <div className="crm-avatar">{lead.name?.charAt(0)?.toUpperCase() || '؟'}</div>
                                                    <div className="crm-card-meta">
                                                        <div className="crm-card-name">{lead.name}</div>
                                                        {lead.contactName && <div className="crm-card-sub">{lead.contactName}</div>}
                                                    </div>
                                                    <PriorityStars value={lead.priority} size={13} />
                                                </div>

                                                <div className="crm-card-contacts">
                                                    {lead.phone && <div className="crm-contact-row"><Phone size={12} /><span dir="ltr">{lead.phone}</span></div>}
                                                    {lead.emailFrom && <div className="crm-contact-row"><Mail size={12} /><span>{lead.emailFrom}</span></div>}
                                                </div>

                                                <div className="crm-card-tags">
                                                    {src && <span className="crm-tag crm-tag-source">{src}</span>}
                                                    {lead.stage && <span className="crm-tag crm-tag-stage">{lead.stage.name}</span>}
                                                    <span className="crm-tag crm-tag-score">⭐ {lead.score}</span>
                                                </div>

                                                <div className="crm-card-footer">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'var(--hz-text-muted)', flex: 1 }}>
                                                        <User size={11} /> {getSalespName(lead)}
                                                    </div>
                                                    <button className="ag-btn-icon" style={{ width: 30, height: 30 }} onClick={e => { e.stopPropagation(); openConvert(lead, e); }} title="تحويل">
                                                        <ArrowRightLeft size={13} />
                                                    </button>
                                                    <button className="ag-btn-icon" style={{ width: 30, height: 30, color: '#FF4D4D', borderColor: 'rgba(255,77,77,.25)' }} onClick={e => { e.stopPropagation(); handleDelete(lead.id); }}>
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {sortedAndFiltered.length > visibleCount && (
                                    <div style={{ display: 'flex', justifyContent: 'center', padding: '15px 0' }}>
                                        <button 
                                            className="ag-btn" 
                                            style={{
                                                background: 'linear-gradient(135deg, var(--hz-primary), #4d88ff)',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: 10,
                                                padding: '12px 30px',
                                                fontWeight: 800,
                                                fontSize: '0.88rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                boxShadow: '0 4px 15px rgba(0, 102, 255, 0.25)'
                                            }}
                                            onClick={() => setVisibleCount(p => p + 100)}
                                        >
                                            <Plus size={14} /> عرض المزيد من العملاء ({sortedAndFiltered.length - visibleCount} عملاء متبقين)
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* ══ ADD/EDIT MODAL ══ */}
            <HzModal open={showModal} onClose={() => setShowModal(false)}
                size="md"
                icon={<Settings size={18} />}
                title={editingId ? 'تعديل بيانات العميل' : 'إضافة عميل محتمل جديد'}
                footer={<>
                    <HzBtn variant="secondary" onClick={() => setShowModal(false)}>تراجع</HzBtn>
                    <HzBtn variant="primary" onClick={handleSubmit} style={{ marginRight: 'auto' }}>
                        <CheckCircle size={15} /> {editingId ? 'حفظ التعديلات' : 'إضافة العميل'}
                    </HzBtn>
                </>}
            >
                {/* Duplicate Warning */}
                {dupWarning.length > 0 && (
                    <div className="crm-dup-alert" style={{ marginBottom: 20 }}>
                        <AlertTriangle size={18} />
                        <span>
                            تحذير: يوجد {dupWarning.length} عميل مشابه بنفس الهاتف أو الإيميل —{' '}
                            {dupWarning.map((d, i) => <a key={d.id} onClick={() => { setShowModal(false); openModal(d); }}>{d.name}</a>).reduce((a, b) => [a, ', ', b] as any)}
                        </span>
                    </div>
                )}

                {editingId && (
                    <div className="crm-dates-badges-row" style={{ display: 'flex', gap: 15, marginBottom: 20, background: 'var(--hz-bg-soft)', padding: '10px 15px', borderRadius: 8, border: '1px solid var(--hz-border-soft)' }}>
                        <div style={{ flex: 1, fontSize: '0.78rem', color: 'var(--hz-text-muted)' }}>
                            <span>📅 تاريخ أول تواصل: </span>
                            <strong style={{ color: 'var(--hz-text-main)' }}>
                                {(() => {
                                    const lObj = leads.find((l: any) => l.id === editingId) as any;
                                    const d = lObj?.firstMessageDate || lObj?.createdAt;
                                    return d ? new Date(d).toLocaleDateString('ar-AE', { day: 'numeric', month: 'short', year: 'numeric' }) : 'غير متوفر';
                                })()}
                            </strong>
                        </div>
                        <div style={{ flex: 1, fontSize: '0.78rem', color: 'var(--hz-text-muted)' }}>
                            <span>🔄 تاريخ آخر تنشيط: </span>
                            <strong style={{ color: 'var(--hz-text-main)' }}>
                                {(() => {
                                    const lObj = leads.find((l: any) => l.id === editingId) as any;
                                    const d = lObj?.updatedAt;
                                    return d ? new Date(d).toLocaleDateString('ar-AE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'غير متوفر';
                                })()}
                            </strong>
                        </div>
                    </div>
                )}

                <div className="hz-form-row">
                    <div className="hz-form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="hz-label">اسم الشركة / الفرصة <span className="crm-field-required">*</span></label>
                        <input className="hz-input" placeholder="مثال: شركة النخيل التعليمية" value={formData.name} onChange={e => setField('name', e.target.value)} />
                        {formErrors.name && <div className="crm-field-error">{formErrors.name}</div>}
                    </div>
                </div>

                <div className="hz-form-row cols-2">
                    <div className="hz-form-group">
                        <label className="hz-label">اسم جهة الاتصال</label>
                        <input className="hz-input" placeholder="الاسم الكامل" value={formData.contactName} onChange={e => setField('contactName', e.target.value)} />
                    </div>
                    <div className="hz-form-group">
                        <label className="hz-label">الموقع الإلكتروني</label>
                        <input className="hz-input" placeholder="https://..." value={formData.website} onChange={e => setField('website', e.target.value)} dir="ltr" />
                    </div>
                </div>

                <div className="hz-form-row cols-2">
                    <div className="hz-form-group">
                        <label className="hz-label">رقم الهاتف <span className="crm-field-required">*</span></label>
                        <PhoneInput
                            value={formData.phone}
                            countryCode={formData.countryCode}
                            onValueChange={v => setField('phone', v)}
                            onCountryChange={v => setFormData(p => ({ ...p, countryCode: v }))}
                        />
                        {formErrors.phone && <div className="crm-field-error">{formErrors.phone}</div>}
                    </div>
                    <div className="hz-form-group">
                        <label className="hz-label">رقم الجوال (اختياري)</label>
                        <PhoneInput
                            value={formData.mobile}
                            countryCode={formData.mobileCountryCode}
                            onValueChange={v => setField('mobile', v)}
                            onCountryChange={v => setFormData(p => ({ ...p, mobileCountryCode: v }))}
                        />
                    </div>
                </div>

                <div className="hz-form-row cols-2">
                    <div className="hz-form-group">
                        <label className="hz-label">البريد الإلكتروني</label>
                        <input className="hz-input" type="email" placeholder="example@domain.com" value={formData.emailFrom} onChange={e => setField('emailFrom', e.target.value)} dir="ltr" />
                    </div>
                    <div className="hz-form-group">
                        <label className="hz-label">الدبلوم المهتم به</label>
                        <input className="hz-input" placeholder="مثال: إدارة أعمال" value={formData.interestedDiploma} onChange={e => setField('interestedDiploma', e.target.value)} />
                    </div>
                </div>

                <div className="hz-form-row cols-3">
                    <div className="hz-form-group">
                        <label className="hz-label">الجنسية</label>
                        <input className="hz-input" placeholder="مثال: الإمارات" value={formData.nationality} onChange={e => setField('nationality', e.target.value)} />
                    </div>
                    <div className="hz-form-group">
                        <label className="hz-label">الإمارة</label>
                        <input className="hz-input" placeholder="مثال: أبوظبي" value={formData.emirate} onChange={e => setField('emirate', e.target.value)} />
                    </div>
                    <div className="hz-form-group">
                        <label className="hz-label">درجة الاهتمام (1-10)</label>
                        <input className="hz-input" type="number" min="0" max="10" placeholder="7" value={formData.levelOfInterest} onChange={e => setField('levelOfInterest', parseInt(e.target.value) || 0)} />
                    </div>
                </div>

                <div className="hz-form-row cols-3">
                    <div className="hz-form-group">
                        <label className="hz-label">مصدر العميل</label>
                        <select className="hz-input" value={formData.source} onChange={e => setField('source', e.target.value)}>
                            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="hz-form-group">
                        <label className="hz-label">البرنامج المهتم به</label>
                        <select className="hz-input" value={formData.programId} onChange={e => setField('programId', e.target.value)}>
                            <option value="">غير محدد</option>
                            {programs.map((p: any) => <option key={p.id} value={p.id}>{p.nameAr}</option>)}
                        </select>
                    </div>
                    <div className="hz-form-group">
                        <label className="hz-label">مسؤول المبيعات</label>
                        <select className="hz-input" value={formData.salespersonId} onChange={e => setField('salespersonId', e.target.value)}>
                            <option value="">اختر...</option>
                            {empOptions.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
                        </select>
                    </div>
                </div>

                <div className="hz-form-row cols-3">
                    <div className="hz-form-group">
                        <label className="hz-label">الأولوية</label>
                        <div className="crm-priority-row" style={{ marginTop: 6 }}>
                            {[1, 2, 3].map(i => (
                                <button key={i} type="button" className={`crm-star-btn ${parseInt(formData.priority) >= i ? 'on' : ''}`}
                                    onClick={() => setField('priority', String(i))}>★</button>
                            ))}
                            <span style={{ fontSize: '0.75rem', color: 'var(--hz-text-muted)', marginRight: 8 }}>
                                {formData.priority === '1' ? 'عادي' : formData.priority === '2' ? 'مهم' : 'عاجل'}
                            </span>
                        </div>
                    </div>
                    <div className="hz-form-group">
                        <label className="hz-label">الإيراد المتوقع</label>
                        <input className="hz-input" type="number" placeholder="0.00" value={formData.expectedRevenue} onChange={e => setField('expectedRevenue', e.target.value)} dir="ltr" />
                    </div>
                    <div className="hz-form-group">
                        <label className="hz-label">الموعد النهائي</label>
                        <input className="hz-input" type="date" value={formData.dateDeadline} onChange={e => setField('dateDeadline', e.target.value)} />
                    </div>
                </div>

                <div className="hz-form-row">
                    <div className="hz-form-group">
                        <label className="hz-label">ملاحظات جديدة</label>
                        <textarea className="hz-input" placeholder="أدخل أي ملاحظة إضافية جديدة لحفظها في السجل..." value={formData.notes} onChange={e => setField('notes', e.target.value)} />
                    </div>
                </div>

                {editingId && (
                    <div className="crm-notes-timeline-section" style={{ marginTop: 20, borderTop: '1px solid var(--hz-border-soft)', paddingTop: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--hz-text-main)', margin: 0 }}>📜 سجل الملاحظات السابقة</h4>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--hz-text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                                <input type="checkbox" checked={showMyNotesOnly} onChange={e => setShowMyNotesOnly(e.target.checked)} />
                                إظهار ملاحظاتي فقط
                            </label>
                        </div>

                        {(() => {
                            const editingLeadObj = leads.find((l: any) => l.id === editingId) as any;
                            const leadNotes = editingLeadObj?.notes || [];
                            const visibleNotes = showMyNotesOnly && currentUser
                                ? leadNotes.filter((n: any) => n.userId === currentUser.id)
                                : leadNotes;

                            if (visibleNotes.length === 0) {
                                return (
                                    <div style={{ padding: '15px', textAlign: 'center', color: 'var(--hz-text-muted)', background: 'var(--hz-bg-soft)', borderRadius: 8, fontSize: '0.8rem' }}>
                                        لا توجد ملاحظات مسجلة تطابق التصفية.
                                    </div>
                                );
                            }

                            return (
                                <div className="crm-timeline-list" style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 200, overflowY: 'auto', paddingRight: 4 }}>
                                    {visibleNotes.map((note: any) => (
                                        <div key={note.id} style={{ background: 'var(--hz-bg-soft)', padding: 12, borderRadius: 8, borderRight: '3px solid var(--hz-primary)', fontSize: '0.8rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: 'var(--hz-text-muted)', fontSize: '0.72rem' }}>
                                                <span style={{ fontWeight: 'bold', color: 'var(--hz-primary)' }}>✍️ {note.user?.username || 'النظام'}</span>
                                                <span>{new Date(note.createdAt).toLocaleDateString('ar-AE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p style={{ margin: 0, whiteSpace: 'pre-line', color: 'var(--hz-text-main)', lineHeight: '1.4' }}>{note.content}</p>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {customFieldDefs.length > 0 && (
                    <div className="hz-form-row cols-2" style={{ marginTop: 24, borderTop: '1px dashed var(--hz-border-soft)', paddingTop: 24 }}>
                        {customFieldDefs.map(f => (
                            <div key={f.key} className="hz-form-group">
                                <label className="hz-label">{f.label}</label>
                                <input
                                    className="hz-input"
                                    type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                                    value={formData.customFields[f.key] || ''}
                                    onChange={e => setField('customFields', { ...formData.customFields, [f.key]: e.target.value })}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </HzModal>

            {/* ══ CONVERT MODAL ══ */}
            <HzModal open={showConvert} onClose={() => setShowConvert(false)}
                size="lg"
                icon={<ArrowRightLeft size={18} />}
                title="تحويل لعميل وفرصة"
                footer={<>
                    <HzBtn variant="secondary" onClick={() => setShowConvert(false)}>تراجع</HzBtn>
                    <HzBtn variant="primary" onClick={handleConvertAction} style={{ marginRight: 'auto' }}>
                        <Check size={16} /> تحويل الآن
                    </HzBtn>
                </>}
            >
                {convertLead && convertFormData && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '0 24px 24px 24px' }}>
                        <div style={{ marginTop: '24px' }}>
                            <div className="crm-alert crm-alert-info" style={{ marginBottom: '20px', borderRadius: '10px' }}>
                                <TrendingUp size={16} /> سيتم تسجيل هذا العميل في قاعدة بيانات العملاء وإنشاء فرصة مبيعات جديدة له في نفس الوقت.
                            </div>

                            {/* SECTION 1: LEAD DATA */}
                            <div className="crm-form-section" style={{ marginTop: '24px' }}>
                                <div className="crm-form-section-header">
                                    <User size={16} /> بيانات العميل الأساسية
                                </div>

                                {convertDups.length > 0 && (
                                    <div className="crm-alert crm-alert-warning" style={{ marginBottom: '16px', border: '1px solid #fbd38d' }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>⚠️ تنبيه تكرار:</div>
                                        <div>وجدنا {convertDups.length} سجلات مطابقة في النظام بنفس بيانات التواصل.</div>

                                        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <input type="radio" checked={partnerMode === 'create'} onChange={() => setPartnerMode('create')} />
                                                <span>إنشاء سجل عميل جديد (غير موصى به عند التطابق)</span>
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <input type="radio" checked={partnerMode === 'link'} onChange={() => setPartnerMode('link')} />
                                                <span>ربط الفرصة بسجل عميل موجود مسبقاً:</span>
                                            </label>

                                            {partnerMode === 'link' && (
                                                <select
                                                    className="hz-input"
                                                    style={{ marginTop: '4px' }}
                                                    value={selectedPartnerId}
                                                    onChange={e => setSelectedPartnerId(e.target.value)}
                                                >
                                                    <option value="">-- اختر العميل المطابق --</option>
                                                    {convertDups.map(d => (
                                                        <option key={d.id} value={d.id}>
                                                            [{d.type === 'customer' ? 'عميل' : 'عميل محتمل'}] {d.name} ({d.phone || d.emailFrom})
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="hz-form-row cols-2">
                                    <div className="hz-form-group">
                                        <label className="hz-label">اسم العميل / الشركة</label>
                                        <input className="hz-input" value={convertFormData.name} onChange={e => setConvertFormData({ ...convertFormData, name: e.target.value })} />
                                    </div>
                                    <div className="hz-form-group">
                                        <label className="hz-label">اسم الشخص المسؤول (الجهة)</label>
                                        <input className="hz-input" value={convertFormData.contactName} onChange={e => setConvertFormData({ ...convertFormData, contactName: e.target.value })} />
                                    </div>
                                </div>
                                <div className="hz-form-row cols-2">
                                    <div className="hz-form-group">
                                        <label className="hz-label">رقم الهاتف</label>
                                        <input
                                            className="hz-input"
                                            value={convertFormData.phone}
                                            onChange={e => setConvertFormData({ ...convertFormData, phone: e.target.value })}
                                            onBlur={() => handleConvertDupCheck(convertFormData.phone, convertFormData.emailFrom, convertLead.id)}
                                            dir="ltr"
                                        />
                                    </div>
                                    <div className="hz-form-group">
                                        <label className="hz-label">البريد الإلكتروني</label>
                                        <input
                                            className="hz-input"
                                            value={convertFormData.emailFrom}
                                            onChange={e => setConvertFormData({ ...convertFormData, emailFrom: e.target.value })}
                                            onBlur={() => handleConvertDupCheck(convertFormData.phone, convertFormData.emailFrom, convertLead.id)}
                                            dir="ltr"
                                        />
                                    </div>
                                </div>
                                <div className="hz-form-row">
                                    <div className="hz-form-group">
                                        <label className="hz-label">مصدر العميل</label>
                                        <select className="hz-input" value={convertFormData.sourceId} onChange={e => setConvertFormData({ ...convertFormData, sourceId: e.target.value })}>
                                            <option value="">-- اختر المصدر --</option>
                                            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: OPPORTUNITY DETAILS */}
                            <div className="crm-form-section" style={{ marginTop: '24px' }}>
                                <div className="crm-form-section-header">
                                    <TrendingUp size={16} /> تفاصيل فرصة المبيعات
                                </div>
                                <div className="hz-form-row cols-2">
                                    <div className="hz-form-group">
                                        <label className="hz-label">المرحلة الحالية</label>
                                        <select className="hz-input" value={convertStageId} onChange={e => setConvertStageId(e.target.value)}>
                                            <option value="">-- اختر المرحلة --</option>
                                            {stages.filter(s => s.probability > 0).map(s => (
                                                <option key={s.id} value={s.id}>{s.nameAr || s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="hz-form-group">
                                        <label className="hz-label">مسؤول المبيعات</label>
                                        <select className="hz-input" value={convertSalesperson} onChange={e => setConvertSalesperson(e.target.value)}>
                                            <option value="">-- اختر المسؤول --</option>
                                            {empOptions.map(s => (
                                                <option key={s.id} value={s.id}>{s.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="hz-form-row cols-2">
                                    <div className="hz-form-group">
                                        <label className="hz-label">الإيراد المتوقع (ر.س)</label>
                                        <input type="number" className="hz-input" value={convertFormData.expectedRevenue} onChange={e => setConvertFormData({ ...convertFormData, expectedRevenue: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                    <div className="hz-form-group">
                                        <label className="hz-label">تاريخ الإغلاق المتوقع</label>
                                        <input type="date" className="hz-input" value={convertFormData.dateDeadline} onChange={e => setConvertFormData({ ...convertFormData, dateDeadline: e.target.value })} />
                                    </div>
                                </div>
                                <div className="hz-form-row cols-1">
                                    <div className="hz-form-group">
                                        <label className="hz-label">ملاحظات الفرصة</label>
                                        <textarea
                                            className="hz-input"
                                            style={{ minHeight: '80px', paddingTop: '10px' }}
                                            placeholder="اكتب أي ملاحظات إتالسجل بخصوص هذه الفرصة..."
                                            value={convertFormData.notes}
                                            onChange={e => setConvertFormData({ ...convertFormData, notes: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{
                            background: 'rgba(0, 212, 255, 0.03)',
                            border: '1px solid rgba(0, 212, 255, 0.1)',
                            borderRadius: 14,
                            padding: '15px 20px',
                            fontSize: '0.85rem',
                            color: 'var(--hz-text-secondary)',
                            lineHeight: 1.6
                        }}>
                            <strong style={{ color: 'var(--hz-cyan)', display: 'block', marginBottom: 4 }}>✨ ملاحظة ذكية:</strong>
                            سيتم نقل كافة الملاحظات والأنشطة السابقة إلى لوحة أنابيب المبيعات لمتابعة عملية التفاوض، كما سيتم تسجيل العميل في قاعدة البيانات الدائمة لسهولة الوصول إليه لاحقاً.
                        </div>
                    </div>
                )}
            </HzModal>

            {/* ── GOOGLE SHEETS SYNC MODAL ── */}
            <HzModal
                open={showSyncModal}
                title="مزامنة واستيراد العملاء من Google Sheet"
                onClose={() => { if (!syncing) setShowSyncModal(false); }}
                icon={<Download size={22} color="var(--hz-green)" />}
                width={650}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Instructions */}
                    <div style={{
                        background: 'rgba(15, 157, 88, 0.05)',
                        border: '1px solid rgba(15, 157, 88, 0.15)',
                        borderRadius: 14,
                        padding: '15px 20px',
                        fontSize: '0.85rem',
                        color: 'var(--hz-text-secondary)',
                        lineHeight: 1.6
                    }}>
                        <strong style={{ color: '#0F9D58', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <CheckCircle size={16} /> تفعيل الربط في 3 ثوانٍ:
                        </strong>
                        1. قم بمشاركة ملف الـ Google Sheet الخاص بك مع هذا البريد الإلكتروني (بصلاحية عارض <b>Viewer</b>):
                        <div style={{
                            background: 'var(--hz-surface-3)',
                            padding: '8px 12px',
                            borderRadius: 8,
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            color: 'var(--hz-text-bright)',
                            margin: '8px 0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            border: '1px solid var(--hz-border-soft)'
                        }}>
                            <span>kader-sync@kader-erp-sync.iam.gserviceaccount.com</span>
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText('kader-sync@kader-erp-sync.iam.gserviceaccount.com');
                                    setToast({ type: 'success', message: '📋 تم نسخ البريد بنجاح!' });
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#0F9D58',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '0.75rem',
                                    padding: 0
                                }}
                            >
                                نسخ البريد
                            </button>
                        </div>
                        2. ضع رابط الشيت بالأسفل واضغط <b>مزامنة</b>. سيقوم النظام بسحب العملاء ومطابقتهم وحظر التكرار تلقائياً!
                    </div>

                    {/* Inputs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div className="hz-form-group">
                            <label className="hz-label" style={{ fontWeight: 800 }}>رابط ملف الـ Google Sheet (أو معرف الجدول ID)</label>
                            <input 
                                className="hz-input" 
                                style={{ direction: 'ltr', fontSize: '0.9rem' }}
                                placeholder="https://docs.google.com/spreadsheets/d/..." 
                                value={sheetUrl} 
                                onChange={e => setSheetUrl(e.target.value)}
                                disabled={syncing}
                            />
                        </div>
                        <div className="hz-form-group">
                            <label className="hz-label" style={{ fontWeight: 800 }}>نطاق البحث (Range)</label>
                            <input 
                                className="hz-input" 
                                style={{ direction: 'ltr', fontSize: '0.9rem', width: '200px' }}
                                placeholder="Sheet1!A:Z" 
                                value={sheetRange} 
                                onChange={e => setSheetRange(e.target.value)}
                                disabled={syncing}
                            />
                        </div>
                    </div>

                    {/* Loading State */}
                    {syncing && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 0', textAlign: 'center' }}>
                            <HzLoader size={40} color="var(--hz-green)" />
                            <span style={{ fontSize: '0.88rem', color: 'var(--hz-text-secondary)', fontWeight: 'bold', maxWidth: '500px', lineHeight: '1.5' }}>
                                {syncProgress || 'جاري سحب البيانات ومطابقة الأرقام وحساب المكررات... يرجى الانتظار'}
                            </span>
                        </div>
                    )}

                    {/* Summary Result */}
                    {syncSummary && (
                        <div style={{
                            background: 'var(--hz-surface-2)',
                            border: '1px solid var(--hz-border-soft)',
                            borderRadius: 14,
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 15
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--hz-text-bright)', borderBottom: '1px solid var(--hz-border-soft)', paddingBottom: 10 }}>📊 ملخص عملية المزامنة:</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                <div style={{ background: 'var(--hz-surface-3)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--hz-text-muted)', marginBottom: 4 }}>إجمالي الأسطر</span>
                                    <strong style={{ fontSize: '1.4rem', color: 'var(--hz-cyan)' }}>{syncSummary.totalProcessed}</strong>
                                </div>
                                <div style={{ background: 'var(--hz-surface-3)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--hz-text-muted)', marginBottom: 4 }}>عملاء جدد</span>
                                    <strong style={{ fontSize: '1.4rem', color: 'var(--hz-green)' }}>{syncSummary.createdCount}</strong>
                                </div>
                                <div style={{ background: 'var(--hz-surface-3)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--hz-text-muted)', marginBottom: 4 }}>مكررات تم رصدها</span>
                                    <strong style={{ fontSize: '1.4rem', color: 'var(--hz-orange)' }}>{syncSummary.duplicateCount}</strong>
                                </div>
                            </div>

                            {syncSummary.errors && syncSummary.errors.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--hz-coral)', fontWeight: 'bold' }}>⚠️ ملاحظات وتنبيهات:</span>
                                    <div style={{
                                        maxHeight: '120px',
                                        overflowY: 'auto',
                                        background: 'var(--hz-surface-3)',
                                        padding: '10px 15px',
                                        borderRadius: 8,
                                        fontSize: '0.78rem',
                                        color: 'var(--hz-text-secondary)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 4,
                                        border: '1px solid var(--hz-border-soft)'
                                    }}>
                                        {syncSummary.errors.map((err: string, idx: number) => (
                                            <div key={idx}>• {err}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--hz-border-soft)', paddingTop: 15 }}>
                        <HzBtn variant="secondary" onClick={() => setShowSyncModal(false)} disabled={syncing}>
                            إغلاق
                        </HzBtn>
                        <button
                            onClick={handleSyncGoogleSheets}
                            disabled={syncing}
                            style={{
                                background: syncing ? 'var(--hz-surface-3)' : 'linear-gradient(135deg, #0F9D58, #0B8043)',
                                color: syncing ? 'var(--hz-text-muted)' : '#fff',
                                border: 'none',
                                borderRadius: 10,
                                padding: '10px 24px',
                                fontWeight: 800,
                                fontSize: '0.9rem',
                                cursor: syncing ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                boxShadow: syncing ? 'none' : '0 4px 12px rgba(15, 157, 88, 0.25)',
                                transition: 'all 0.2s ease-in-out'
                            }}
                        >
                            <RefreshCw size={16} className={syncing ? 'hz-spin' : ''} />
                            {syncing ? 'جاري المزامنة...' : 'مزامنة سريعة الآن'}
                        </button>
                    </div>
                </div>
            </HzModal>

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        </div >
    );
}
