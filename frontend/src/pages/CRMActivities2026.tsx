// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import {
    Settings, Plus, Edit2, Trash2, ChevronDown, ChevronUp,
    Activity, ListOrdered, Layers, X, GripVertical,
    Check, CheckCircle, ClipboardList, Calendar, AlertCircle, Phone, Mail, Users,
    MessageCircle, Video, FileText, Bell, Target, Zap, Heart,
    ShoppingCart, Briefcase, Coffee, Send, Mic, Camera, Globe, User
} from 'lucide-react';
import { activityTypeApi, activityPlanApi } from '../services/crm.service';
import { Toast, ToastType } from '../components/Toast';
import {
    HzBtn, HzModal, HzInput, HzLoader, HzEmpty
} from '../layouts/Rapidos2026/components/RapidosUI';
import './CRMActivities2026.css';

import './CRMActivities2026.css';

// ─── ACTIVITY ICON RESOLVER ───────────────────────────
const LUCIDE_ICON_MAP: Record<string, React.FC<any>> = {
    Phone, Mail, Users, ClipboardList, MessageCircle, Video, FileText,
    Bell, Target, Activity, Zap, Heart, ShoppingCart, Briefcase, Coffee,
    Send, Mic, Camera, Calendar, CheckCircle, Settings, Globe, User,
    // Common aliases
    'phone': Phone, 'mail': Mail, 'email': Mail, 'users': Users,
    'meeting': Users, 'call': Phone, 'whatsapp': MessageCircle,
    'clipboard': ClipboardList, 'follow': ClipboardList, 'task': ClipboardList,
};

function ActivityIcon({ icon, color, size = 16 }: { icon?: string; color?: string; size?: number | string }) {
    if (!icon) return <Activity size={size} color={color} />;

    // Check if it's a Font Awesome class (starts with fa- or fas)
    if (icon.startsWith('fa-') || icon.startsWith('fas ') || icon.startsWith('far ') || icon.startsWith('fab ')) {
        const isBrand = ['whatsapp', 'facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'tiktok', 'snapchat'].some(b => icon.toLowerCase().includes(b));
        const prefix = icon.startsWith('fa-') ? (isBrand ? 'fa-brands' : 'fas') : '';
        const fullClass = prefix ? `${prefix} ${icon}` : icon;
        return <i className={fullClass} style={{ color, fontSize: size }} />;
    }

    // Try Lucide icon map
    const IconComp = LUCIDE_ICON_MAP[icon] || LUCIDE_ICON_MAP[icon.toLowerCase()];
    if (IconComp) return <IconComp size={size} color={color} />;

    // Fallback if not found in map
    const fuzzyMatch = Object.keys(LUCIDE_ICON_MAP).find(k => k.toLowerCase() === icon.toLowerCase());
    if (fuzzyMatch) {
        const FuzzyComp = LUCIDE_ICON_MAP[fuzzyMatch];
        return <FuzzyComp size={size} color={color} />;
    }

    // Ultimate Fallback: just use the MessageCircle if it looks like whatsapp, etc.
    if (icon.toLowerCase().includes('whatsapp')) return <MessageCircle size={size} color={color} />;
    if (icon.toLowerCase().includes('call') || icon.toLowerCase().includes('phone')) return <Phone size={size} color={color} />;

    return <Activity size={size} color={color} />;
}

/* ══════════════════════════════════════════════════════════
   COMMON FA ICONS LIST for the icon picker
══════════════════════════════════════════════════════════ */
const FA_ICONS = [
    { cls: 'fa-phone', label: 'مكالمة' },
    { cls: 'fa-mobile-alt', label: 'موبايل' },
    { cls: 'fa-envelope', label: 'بريد' },
    { cls: 'fa-envelope-open', label: 'بريد مفتوح' },
    { cls: 'fa-video', label: 'اجتماع فيديو' },
    { cls: 'fa-users', label: 'اجتماع' },
    { cls: 'fa-calendar-check', label: 'حجز موعد' },
    { cls: 'fa-calendar-alt', label: 'تقويم' },
    { cls: 'fa-tasks', label: 'مهمة' },
    { cls: 'fa-check-circle', label: 'إتمام' },
    { cls: 'fa-clipboard-list', label: 'قائمة' },
    { cls: 'fa-file-alt', label: 'مستند' },
    { cls: 'fa-file-upload', label: 'رفع ملف' },
    { cls: 'fa-file-signature', label: 'توقيع' },
    { cls: 'fa-file-invoice', label: 'فاتورة' },
    { cls: 'fa-handshake', label: 'صفقة' },
    { cls: 'fa-hand-holding-usd', label: 'دفع' },
    { cls: 'fa-paper-plane', label: 'إرسال' },
    { cls: 'fa-comment-dots', label: 'رسالة' },
    { cls: 'fa-whatsapp', label: 'واتساب', fab: true },
    { cls: 'fa-bell', label: 'تنبيه' },
    { cls: 'fa-clock', label: 'متابعة' },
    { cls: 'fa-history', label: 'تاريخ' },
    { cls: 'fa-star', label: 'مميز' },
    { cls: 'fa-flag', label: 'علامة' },
    { cls: 'fa-map-marker-alt', label: 'موقع' },
    { cls: 'fa-bullseye', label: 'هدف' },
    { cls: 'fa-chart-line', label: 'تقرير' },
    { cls: 'fa-gift', label: 'عرض' },
    { cls: 'fa-graduation-cap', label: 'تدريب' },
];

const COLORS = [
    '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4',
    '#f97316', '#ef4444', '#ec4899', '#14b8a6', '#64748b'
];

const ACTIONS = [
    { value: 'none', label: 'لا شيء' },
    { value: 'email', label: 'إرسال بريد إلكتروني' },
    { value: 'phonecall', label: 'مكالمة هاتفية' },
    { value: 'meeting', label: 'جدولة اجتماع' },
    { value: 'todo', label: 'مهمة عامة' },
    { value: 'upload_document', label: 'رفع مستند' },
];

/* ══════════════════════════════════════════════════════════
   ICON PICKER COMPONENT
══════════════════════════════════════════════════════════ */
function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const filtered = FA_ICONS.filter(i => i.label.includes(search) || i.cls.includes(search));
    const selected = FA_ICONS.find(i => i.cls === value);

    return (
        <div className="icon-picker-wrap">
            <label className="hz-label">أيقونة النشاط</label>
            <button type="button" className="icon-picker-trigger" onClick={() => setOpen(!open)}>
                <i className={`fas ${value || 'fa-tasks'}`} />
                <span>{selected?.label || value || 'اختر أيقونة'}</span>
                <ChevronDown size={14} />
            </button>
            {open && (
                <div className="icon-picker-panel">
                    <input
                        className="icon-picker-search"
                        placeholder="بحث..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        autoFocus
                    />
                    <div className="icon-picker-grid">
                        {filtered.map(icon => (
                            <button
                                key={icon.cls}
                                type="button"
                                title={icon.label}
                                className={`icon-picker-item ${value === icon.cls ? 'active' : ''}`}
                                onClick={() => { onChange(icon.cls); setOpen(false); }}
                            >
                                <i className={`${icon.fab ? 'fab' : 'fas'} ${icon.cls}`} />
                                <span>{icon.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   ACTIVITY TYPE CARD
══════════════════════════════════════════════════════════ */
function ActivityTypeCard({ type, onEdit, onDelete }) {
    return (
        <div className="act-type-card">
            <div className="act-type-icon" style={{ background: type.color + '22', borderColor: type.color + '44' }}>
                <ActivityIcon icon={type.icon} color={type.color} size="1.4rem" />
            </div>
            <div className="act-type-body">
                <div className="act-type-name">{type.name}</div>
                <div className="act-type-meta">
                    {ACTIONS.find(a => a.value === type.action)?.label || 'لا شيء'}
                    {type.daysDelay > 0 && <span> · {type.daysDelay} يوم</span>}
                </div>
            </div>
            <div className="act-type-actions">
                <button className="act-icon-btn" onClick={() => onEdit(type)} title="تعديل">
                    <Edit2 size={14} />
                </button>
                <button className="act-icon-btn danger" onClick={() => onDelete(type.id)} title="حذف">
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   PLAN STEP ROW
══════════════════════════════════════════════════════════ */
function PlanStepRow({ step, types, onChange, onDelete, idx }) {
    return (
        <div className="plan-step-row">
            <div className="plan-step-seq">{idx + 1}</div>

            <select
                className="plan-step-select"
                value={step.activityTypeId}
                onChange={e => onChange({ ...step, activityTypeId: e.target.value })}
            >
                <option value="">اختر نوع النشاط</option>
                {types.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                ))}
            </select>

            <input
                className="plan-step-input"
                placeholder="ملاحظة / وصف..."
                value={step.summary || ''}
                onChange={e => onChange({ ...step, summary: e.target.value })}
            />

            <div className="plan-step-interval">
                <input
                    type="number"
                    className="plan-step-num"
                    value={step.interval}
                    min={0}
                    onChange={e => onChange({ ...step, interval: parseInt(e.target.value) || 0 })}
                />
                <select
                    className="plan-step-unit"
                    value={step.intervalUnit}
                    onChange={e => onChange({ ...step, intervalUnit: e.target.value })}
                >
                    <option value="days">يوم</option>
                    <option value="weeks">أسبوع</option>
                    <option value="months">شهر</option>
                </select>
                <select
                    className="plan-step-trigger"
                    value={step.trigger}
                    onChange={e => onChange({ ...step, trigger: e.target.value })}
                >
                    <option value="after">بعد الخطة</option>
                    <option value="before">قبل الخطة</option>
                </select>
            </div>

            <button className="plan-step-del" onClick={onDelete} title="حذف">
                <X size={14} />
            </button>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   PLAN CARD (expandable)
══════════════════════════════════════════════════════════ */
function PlanCard({ plan, types, onEdit, onDelete }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="act-plan-card">
            <div className="act-plan-header" onClick={() => setExpanded(!expanded)}>
                <div className="act-plan-left">
                    <div className="act-plan-icon">
                        <ListOrdered size={18} />
                    </div>
                    <div>
                        <div className="act-plan-name">{plan.name}</div>
                        <div className="act-plan-meta">{plan.steps?.length || 0} نشاط في الخطة</div>
                    </div>
                </div>
                <div className="act-plan-right">
                    <button className="act-icon-btn" onClick={e => { e.stopPropagation(); onEdit(plan); }} title="تعديل">
                        <Edit2 size={14} />
                    </button>
                    <button className="act-icon-btn danger" onClick={e => { e.stopPropagation(); onDelete(plan.id); }} title="حذف">
                        <Trash2 size={14} />
                    </button>
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </div>

            {expanded && plan.steps?.length > 0 && (
                <div className="act-plan-steps">
                    {plan.steps.map((step, i) => (
                        <div key={step.id} className="act-plan-step-view">
                            <div className="act-step-num">{i + 1}</div>
                            <div className="act-step-icon" style={{
                                background: (step.activityType?.color || '#06b6d4') + '22',
                                borderColor: (step.activityType?.color || '#06b6d4') + '44'
                            }}>
                                <ActivityIcon icon={step.activityType?.icon} color={step.activityType?.color || '#06b6d4'} size="1.2rem" />
                            </div>
                            <div className="act-step-body">
                                <div className="act-step-type">{step.activityType?.name || '—'}</div>
                                {step.summary && <div className="act-step-summary">{step.summary}</div>}
                            </div>
                            <div className="act-step-timing">
                                {step.interval > 0
                                    ? `${step.interval} ${step.intervalUnit === 'days' ? 'يوم' : step.intervalUnit === 'weeks' ? 'أسبوع' : 'شهر'} ${step.trigger === 'before' ? 'قبل' : 'بعد'} الخطة`
                                    : 'يوم الخطة'}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {expanded && (!plan.steps || plan.steps.length === 0) && (
                <div className="act-plan-empty">لا توجد أنشطة في هذه الخطة</div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function CRMActivities2026() {
    const [tab, setTab] = useState<'types' | 'plans'>('types');

    // ── Activity Types State
    const [actTypes, setActTypes] = useState([]);
    const [loadingTypes, setLoadingTypes] = useState(true);
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [editingType, setEditingType] = useState<any>(null);
    const [typeForm, setTypeForm] = useState({
        name: '', icon: 'fa-tasks', color: '#06b6d4',
        action: 'none', daysDelay: 0, description: ''
    });

    // ── Activity Plans State
    const [plans, setPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [planForm, setPlanForm] = useState({ name: '', description: '' });
    const [planSteps, setPlanSteps] = useState<any[]>([]);

    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

    useEffect(() => { fetchTypes(); fetchPlans(); }, []);

    const fetchTypes = async () => {
        setLoadingTypes(true);
        try {
            const res = await activityTypeApi.getAll();
            setActTypes(res.data || []);
        } catch { setToast({ type: 'error', message: '❌ فشل تحميل أنواع الأنشطة' }); }
        finally { setLoadingTypes(false); }
    };

    const fetchPlans = async () => {
        setLoadingPlans(true);
        try {
            const res = await activityPlanApi.getAll();
            setPlans(res.data || []);
        } catch { setToast({ type: 'error', message: '❌ فشل تحميل خطط الأنشطة' }); }
        finally { setLoadingPlans(false); }
    };

    // ── Type handlers
    const openAddType = () => {
        setEditingType(null);
        setTypeForm({ name: '', icon: 'fa-tasks', color: '#06b6d4', action: 'none', daysDelay: 0, description: '' });
        setShowTypeModal(true);
    };

    const openEditType = (t: any) => {
        setEditingType(t);
        setTypeForm({ name: t.name, icon: t.icon, color: t.color, action: t.action, daysDelay: t.daysDelay, description: t.description || '' });
        setShowTypeModal(true);
    };

    const saveType = async () => {
        if (!typeForm.name.trim()) return setToast({ type: 'error', message: '❗ الاسم مطلوب' });
        try {
            if (editingType) {
                await activityTypeApi.update(editingType.id, typeForm);
                setToast({ type: 'success', message: '✅ تم تحديث النوع بنجاح' });
            } else {
                await activityTypeApi.create(typeForm);
                setToast({ type: 'success', message: '✅ تم إضافة النوع بنجاح' });
            }
            setShowTypeModal(false);
            fetchTypes();
        } catch { setToast({ type: 'error', message: '❌ فشل حفظ النوع' }); }
    };

    const deleteType = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا النوع؟')) return;
        try {
            await activityTypeApi.delete(id);
            setToast({ type: 'success', message: '✅ تم حذف النوع' });
            fetchTypes();
        } catch { setToast({ type: 'error', message: '❌ فشل الحذف' }); }
    };

    // ── Plan handlers
    const openAddPlan = () => {
        setEditingPlan(null);
        setPlanForm({ name: '', description: '' });
        setPlanSteps([]);
        setShowPlanModal(true);
    };

    const openEditPlan = (p: any) => {
        setEditingPlan(p);
        setPlanForm({ name: p.name, description: p.description || '' });
        setPlanSteps((p.steps || []).map(s => ({
            activityTypeId: s.activityTypeId,
            summary: s.summary || '',
            assignment: s.assignment || 'ask',
            interval: s.interval,
            intervalUnit: s.intervalUnit,
            trigger: s.trigger,
            sequence: s.sequence
        })));
        setShowPlanModal(true);
    };

    const addStep = () => {
        setPlanSteps(prev => [...prev, {
            activityTypeId: actTypes[0]?.id || '',
            summary: '',
            assignment: 'ask',
            interval: 0,
            intervalUnit: 'days',
            trigger: 'after',
            sequence: prev.length + 1
        }]);
    };

    const updateStep = (idx: number, updated: any) => {
        setPlanSteps(prev => prev.map((s, i) => i === idx ? { ...s, ...updated } : s));
    };

    const removeStep = (idx: number) => {
        setPlanSteps(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, sequence: i + 1 })));
    };

    const savePlan = async () => {
        if (!planForm.name.trim()) return setToast({ type: 'error', message: '❗ اسم الخطة مطلوب' });
        try {
            const payload = {
                ...planForm,
                steps: planSteps.map((s, i) => ({ ...s, sequence: i + 1 }))
            };
            if (editingPlan) {
                await activityPlanApi.update(editingPlan.id, payload);
                setToast({ type: 'success', message: '✅ تم تحديث الخطة' });
            } else {
                await activityPlanApi.create(payload);
                setToast({ type: 'success', message: '✅ تم إنشاء الخطة' });
            }
            setShowPlanModal(false);
            fetchPlans();
        } catch { setToast({ type: 'error', message: '❌ فشل حفظ الخطة' }); }
    };

    const deletePlan = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه الخطة؟')) return;
        try {
            await activityPlanApi.delete(id);
            setToast({ type: 'success', message: '✅ تم حذف الخطة' });
            fetchPlans();
        } catch { setToast({ type: 'error', message: '❌ فشل الحذف' }); }
    };

    return (
        <div className="activities-page">
            {/* ── PAGE HEADER */}
            <div className="act-page-header">
                <div className="act-page-header-left">
                    <div className="act-page-icon"><Settings size={22} /></div>
                    <div>
                        <h1 className="act-page-title">إعدادات الأنشطة البيعية</h1>
                        <p className="act-page-sub">تعريف أنواع الأنشطة وخطط المتابعة التلقائية</p>
                    </div>
                </div>
                <div className="act-page-header-right">
                    {tab === 'types' && (
                        <HzBtn variant="primary" onClick={openAddType}>
                            <Plus size={16} /> نوع جديد
                        </HzBtn>
                    )}
                    {tab === 'plans' && (
                        <HzBtn variant="primary" onClick={openAddPlan}>
                            <Plus size={16} /> خطة جديدة
                        </HzBtn>
                    )}
                </div>
            </div>

            {/* ── TABS */}
            <div className="act-tabs">
                <button
                    className={`act-tab ${tab === 'types' ? 'active' : ''}`}
                    onClick={() => setTab('types')}
                >
                    <Activity size={16} />
                    أنواع الأنشطة
                    <span className="act-tab-count">{actTypes.length}</span>
                </button>
                <button
                    className={`act-tab ${tab === 'plans' ? 'active' : ''}`}
                    onClick={() => setTab('plans')}
                >
                    <ListOrdered size={16} />
                    خطط الأنشطة
                    <span className="act-tab-count">{plans.length}</span>
                </button>
            </div>

            {/* ── TYPES TAB */}
            {tab === 'types' && (
                <div className="act-content">
                    {loadingTypes ? (
                        <HzLoader />
                    ) : actTypes.length === 0 ? (
                        <HzEmpty
                            title="لا توجد أنواع أنشطة"
                            description="أضف أنواع الأنشطة كالمكالمات والاجتماعات والبريد الإلكتروني وغيرها"
                        />
                    ) : (
                        <div className="act-types-grid">
                            {actTypes.map(t => (
                                <ActivityTypeCard
                                    key={t.id}
                                    type={t}
                                    onEdit={openEditType}
                                    onDelete={deleteType}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── PLANS TAB */}
            {tab === 'plans' && (
                <div className="act-content">
                    {loadingPlans ? (
                        <HzLoader />
                    ) : plans.length === 0 ? (
                        <HzEmpty
                            title="لا توجد خطط أنشطة"
                            description="أنشئ خططاً لتسلسل الأنشطة التي تُطلق تلقائياً على الفرص"
                        />
                    ) : (
                        <div className="act-plans-list">
                            {plans.map(p => (
                                <PlanCard
                                    key={p.id}
                                    plan={p}
                                    types={actTypes}
                                    onEdit={openEditPlan}
                                    onDelete={deletePlan}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════
                MODAL: ADD/EDIT ACTIVITY TYPE
            ══════════════════════════════════════ */}
            <HzModal
                open={showTypeModal}
                onClose={() => setShowTypeModal(false)}
                title={editingType ? 'تعديل نوع النشاط' : 'إضافة نوع نشاط جديد'}
                icon={<Activity size={18} />}
                size="md"
                footer={
                    <>
                        <HzBtn variant="secondary" onClick={() => setShowTypeModal(false)}>تراجع</HzBtn>
                        <HzBtn variant="primary" onClick={saveType}>
                            <Check size={15} /> {editingType ? 'حفظ التعديلات' : 'إضافة النوع'}
                        </HzBtn>
                    </>
                }
            >
                <div className="type-form-grid">
                    <HzInput
                        label="اسم النشاط"
                        placeholder="مثال: مكالمة هاتفية، اجتماع..."
                        value={typeForm.name}
                        onChange={v => setTypeForm({ ...typeForm, name: v })}
                        required
                    />

                    <IconPicker value={typeForm.icon} onChange={v => setTypeForm({ ...typeForm, icon: v })} />

                    {/* Color picker */}
                    <div className="hz-form-group">
                        <label className="hz-label">لون النشاط</label>
                        <div className="color-picker-row">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`color-dot ${typeForm.color === c ? 'active' : ''}`}
                                    style={{ background: c }}
                                    onClick={() => setTypeForm({ ...typeForm, color: c })}
                                />
                            ))}
                            <input
                                type="color"
                                className="color-custom"
                                value={typeForm.color}
                                onChange={e => setTypeForm({ ...typeForm, color: e.target.value })}
                                title="لون مخصص"
                            />
                        </div>
                    </div>

                    {/* Action */}
                    <div className="hz-form-group">
                        <label className="hz-label">الإجراء التلقائي</label>
                        <select
                            className="hz-select"
                            value={typeForm.action}
                            onChange={e => setTypeForm({ ...typeForm, action: e.target.value })}
                        >
                            {ACTIONS.map(a => (
                                <option key={a.value} value={a.value}>{a.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Days delay */}
                    <div className="hz-form-group">
                        <label className="hz-label">تأخير افتراضي (أيام)</label>
                        <input
                            type="number"
                            className="hz-input"
                            min={0}
                            value={typeForm.daysDelay}
                            onChange={e => setTypeForm({ ...typeForm, daysDelay: parseInt(e.target.value) || 0 })}
                        />
                    </div>

                    {/* Preview */}
                    <div className="type-preview">
                        <div className="type-preview-icon" style={{ background: typeForm.color + '22', borderColor: typeForm.color + '55' }}>
                            <ActivityIcon icon={typeForm.icon} color={typeForm.color} size="1.5rem" />
                        </div>
                        <div>
                            <div className="type-preview-name">{typeForm.name || 'اسم النشاط'}</div>
                            <div className="type-preview-sub">{ACTIONS.find(a => a.value === typeForm.action)?.label}</div>
                        </div>
                    </div>
                </div>
            </HzModal>

            {/* ══════════════════════════════════════
                MODAL: ADD/EDIT ACTIVITY PLAN
            ══════════════════════════════════════ */}
            <HzModal
                open={showPlanModal}
                onClose={() => setShowPlanModal(false)}
                title={editingPlan ? 'تعديل خطة الأنشطة' : 'إنشاء خطة أنشطة جديدة'}
                icon={<ListOrdered size={18} />}
                size="lg"
                footer={
                    <>
                        <HzBtn variant="secondary" onClick={() => setShowPlanModal(false)}>تراجع</HzBtn>
                        <HzBtn variant="primary" onClick={savePlan}>
                            <Check size={15} /> {editingPlan ? 'حفظ التعديلات' : 'إنشاء الخطة'}
                        </HzBtn>
                    </>
                }
            >
                <div className="plan-form">
                    <div className="plan-form-header">
                        <HzInput
                            label="اسم الخطة"
                            placeholder="مثال: خطة متابعة العملاء الجدد"
                            value={planForm.name}
                            onChange={v => setPlanForm({ ...planForm, name: v })}
                            required
                        />
                        <HzInput
                            label="وصف الخطة (اختياري)"
                            placeholder="وصف موجز..."
                            value={planForm.description}
                            onChange={v => setPlanForm({ ...planForm, description: v })}
                        />
                    </div>

                    <div className="plan-steps-section">
                        <div className="plan-steps-title">
                            <ClipboardList size={16} />
                            <span>تسلسل الأنشطة ({planSteps.length})</span>
                        </div>

                        {planSteps.length > 0 && (
                            <div className="plan-steps-header-row">
                                <span style={{ width: 24 }}>#</span>
                                <span style={{ flex: 1 }}>نوع النشاط</span>
                                <span style={{ flex: 1 }}>الوصف</span>
                                <span style={{ flex: '0 0 280px' }}>التوقيت</span>
                                <span style={{ width: 28 }}></span>
                            </div>
                        )}

                        <div className="plan-steps-list">
                            {planSteps.map((step, idx) => (
                                <PlanStepRow
                                    key={idx}
                                    idx={idx}
                                    step={step}
                                    types={actTypes}
                                    onChange={updated => updateStep(idx, updated)}
                                    onDelete={() => removeStep(idx)}
                                />
                            ))}
                        </div>

                        <button type="button" className="plan-add-step" onClick={addStep}>
                            <Plus size={14} /> إضافة نشاط للخطة
                        </button>
                    </div>

                    {planSteps.length > 0 && (
                        <div className="plan-preview">
                            <Calendar size={14} />
                            <span>مثال: يوم الخطة = تاريخ الاجتماع المستهدف</span>
                        </div>
                    )}
                </div>
            </HzModal>

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        </div>
    );
}
