// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable,
    rectIntersection,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    LayoutGrid, TrendingUp, Plus, Search, RefreshCw, X, SlidersHorizontal, List,
    Archive, Trophy, Frown, CheckCircle, UserPlus, ArrowRightLeft, User, Phone, Globe,
    Settings, DollarSign, Filter, ChevronDown, MoreVertical, Star,
    Calendar, Clock, CheckCheck, AlarmClock, Mail, Users, ClipboardList,
    MessageCircle, Video, FileText, Bell, Target, Activity, Zap, Heart,
    ShoppingCart, Briefcase, Coffee, Send, Mic, Camera, Eye, Edit2
} from 'lucide-react';
import { leadApi, stageApi, activityApi, activityTypeApi } from '../services/crm.service';
import { hrService } from '../services/hr.service';
import { academicService } from '../services/academic.service';
import { Toast, ToastType } from '../components/Toast';
import { HzModal, HzBtn, HzLoader } from '../layouts/Rapidos2026/components/RapidosUI';
import './CRMPipeline2026.css';

/**
 * CRM PIPELINE - PREMIUM KANBAN 2026
 */

const SOURCES = ['إعلان فيسبوك', 'واتساب', 'مكالمة هاتفيّة', 'زيارة الفرع', 'توصية عميل', 'موقع إلكتروني', 'تيك توك', 'سناب شات'];

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

function ActivityIcon({ icon, color, size = 16 }: { icon?: string; color?: string; size?: number }) {
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
    // Maybe the user typed 'Whatsapp' instead of 'WhatsApp'. Let's try one more fuzzy match
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

/* ─── SORTABLE CARD COMPONENT ──────────────────── */
function OpportunityCard({ opp, isOverlay = false, onClick, onEdit, onArchive }) {
    const sortable = useSortable({ id: opp.id, disabled: isOverlay });
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;

    // Local State for toggle view
    const [showContactFirst, setShowContactFirst] = useState(false);

    const style = {
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        transition,
    };

    // Determine status for effects
    const isWon = opp.stage?.isWon;
    const isLost = opp.stage?.isLost;

    let statusClass = '';
    if (isWon) statusClass = 'opp-card-won';
    if (isLost) statusClass = 'opp-card-lost';

    const cardClass = `opp-card ${isDragging ? 'opp-card-dragging' : ''} ${isOverlay ? 'opp-drag-overlay' : ''} ${statusClass}`;

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cardClass}>
            {isWon && <div className="opp-fireworks" />}

            <div className="opp-card-head" onClick={(e) => { if (isDragging) return; onClick && onClick(e); }} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="opp-card-name" style={{ textDecoration: isLost ? 'line-through' : 'none', opacity: isLost ? 0.6 : 1, fontSize: '0.85rem' }}>
                        {showContactFirst ? (opp.contactName || opp.name) : opp.name}
                    </div>
                    {/* Secondary Name / Phone */}
                    <div style={{ fontSize: '0.7rem', color: 'var(--hz-text-muted)', marginTop: 2 }}>
                        {!showContactFirst && opp.contactName && <span>👤 {opp.contactName}</span>}
                        {showContactFirst && opp.name !== opp.contactName && <span>💼 {opp.name}</span>}
                        {opp.phone && <span style={{ marginRight: 8 }}>📞 {opp.phone}</span>}
                    </div>
                    {/* CRM Custom Info Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                        {opp.isDuplicate && (
                            <span style={{ 
                                background: 'rgba(250, 204, 21, 0.1)', 
                                color: '#facc15', 
                                border: '1px solid rgba(250, 204, 21, 0.3)',
                                fontSize: '0.62rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                fontWeight: 800
                            }}>
                                ⚠️ مكرر ({opp.duplicateCount})
                            </span>
                        )}
                        {opp.nationality && (
                            <span style={{ 
                                background: 'var(--hz-surface-3)', 
                                color: 'var(--hz-text-secondary)', 
                                border: '1px solid var(--hz-border-soft)',
                                fontSize: '0.62rem',
                                padding: '2px 6px',
                                borderRadius: '4px'
                            }}>
                                🌍 {opp.nationality}
                            </span>
                        )}
                        {opp.emirate && (
                            <span style={{ 
                                background: 'var(--hz-surface-3)', 
                                color: 'var(--hz-text-secondary)', 
                                border: '1px solid var(--hz-border-soft)',
                                fontSize: '0.62rem',
                                padding: '2px 6px',
                                borderRadius: '4px'
                            }}>
                                📍 {opp.emirate}
                            </span>
                        )}
                        {opp.interestedDiploma && (
                            <span style={{ 
                                background: 'var(--hz-surface-3)', 
                                color: 'var(--hz-text-secondary)', 
                                border: '1px solid var(--hz-border-soft)',
                                fontSize: '0.62rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                maxWidth: '140px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }} title={opp.interestedDiploma}>
                                🎓 {opp.interestedDiploma}
                            </span>
                        )}
                        {opp.levelOfInterest !== undefined && opp.levelOfInterest !== null && (
                            <span style={{ 
                                background: 'rgba(255, 77, 106, 0.08)', 
                                color: 'var(--hz-coral)', 
                                border: '1px solid rgba(255, 77, 106, 0.2)',
                                fontSize: '0.62rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 800
                            }}>
                                🔥 {opp.levelOfInterest}/10
                            </span>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 3, opacity: isLost ? 0.3 : 0.8 }}>
                    {[1, 2, 3].map(i => (
                        <Star key={i} size={10}
                            fill={i <= (parseInt(opp.priority) || 1) ? "var(--hz-primary)" : "none"}
                            stroke={i <= (parseInt(opp.priority) || 1) ? "var(--hz-primary)" : "var(--hz-border-soft)"}
                            style={{ filter: i <= (parseInt(opp.priority) || 1) ? 'drop-shadow(0 0 2px var(--hz-primary))' : 'none' }}
                        />
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 12, cursor: 'pointer' }} onClick={(e) => { if (isDragging) return; onClick && onClick(e); }}>
                <div style={{ display: 'flex', flexDirection: 'column', opacity: isLost ? 0.5 : 1 }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--hz-text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>المبلغ المتوقع</span>
                    <div className="opp-card-rev">
                        {Number(opp.expectedRevenue || 0).toLocaleString()} <span style={{ fontSize: '0.65rem', opacity: 0.6, fontWeight: 700 }}>SAR</span>
                    </div>
                </div>
                {opp.probability && (
                    <div className={`ag-card-badge ${isWon ? 'opp-badge-won' : isLost ? 'opp-badge-lost' : 'opp-badge-active'}`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                        {opp.probability}%
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, borderTop: '1px solid var(--hz-border-soft)', paddingTop: 10, opacity: isLost ? 0.5 : 1 }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {/* Action 1: Details & Summary */}
                    <button className="opp-card-btn" onClick={(e) => { e.stopPropagation(); onClick && onClick(e); }} title="تفاصيل كاملة">
                        <Eye size={12} />
                    </button>
                    {/* Action 2: Edit Form */}
                    <button className="opp-card-btn" onClick={(e) => { e.stopPropagation(); onEdit && onEdit(opp); }} title="تعديل سريع">
                        <Edit2 size={12} />
                    </button>
                    {/* Action 3: Archive (Soft Delete) */}
                    <button className="opp-card-btn danger" onClick={(e) => { e.stopPropagation(); onArchive && onArchive(opp); }} title="أرشفة / حذف">
                        <Archive size={12} />
                    </button>
                    {/* Action 4: Toggle Title */}
                    <button className="opp-card-btn" onClick={(e) => { e.stopPropagation(); setShowContactFirst(!showContactFirst); }} title="تبديل العنوان (الفرصة / العميل)">
                        <RefreshCw size={12} />
                    </button>
                </div>

                {/* Next Activity Icon */}
                {opp.nextActivity && !isWon && !isLost && (
                    <div title={new Date(opp.nextActivity.dateDeadline).toLocaleDateString('ar')}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 24, height: 24, borderRadius: 6,
                            background: opp.activityPulse === 'overdue' ? 'rgba(255, 77, 106, 0.1)' :
                                opp.activityPulse === 'today' ? 'rgba(250, 204, 21, 0.1)' :
                                    'rgba(56, 189, 248, 0.1)',
                            border: `1px solid ${opp.activityPulse === 'overdue' ? 'rgba(255, 77, 106, 0.3)' :
                                opp.activityPulse === 'today' ? 'rgba(250, 204, 21, 0.3)' :
                                    'rgba(56, 189, 248, 0.3)'
                                }`
                        }}>
                        <ActivityIcon
                            icon={opp.nextActivity.type?.icon}
                            size={12}
                            color={
                                opp.activityPulse === 'overdue' ? 'var(--hz-coral)' :
                                    opp.activityPulse === 'today' ? '#facc15' :
                                        'var(--hz-neon)'
                            }
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── COLUMN COMPONENT ─────────────────────────── */
function KanbanColumn({ id, title, opportunities, totalRevenue, onAdd, onCardClick, isFolded, onToggleFold, hideHeader = false }) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div ref={setNodeRef} className={`opp-column ${isOver ? 'over' : ''} ${isFolded ? 'folded' : ''}`}>
            {/* Header: only shown if not folded and not hidden */}
            {!hideHeader && !isFolded && (
                <div className="opp-col-header">
                    <div onClick={onToggleFold} style={{ cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="ag-avatar" style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--hz-surface-2)' }}>
                            <Archive size={16} color="var(--hz-text-muted)" />
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div className="opp-col-title" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{title}</div>
                            <div className="opp-col-meta">
                                {opportunities.length} فرصة • <span style={{ color: 'var(--hz-primary)', fontWeight: 700 }}>{totalRevenue.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    <button className="ag-btn-icon" style={{ width: 28, height: 28 }} onClick={() => onAdd && onAdd(id)}>
                        <Plus size={14} />
                    </button>
                </div>
            )}

            {/* Folded content */}
            {isFolded && (
                <div className="opp-folded-content" onClick={onToggleFold} style={{ cursor: 'pointer' }}>
                    <div className="opp-col-title-vertical">{title}</div>
                    <div className="opp-folded-count">
                        {opportunities.length}
                    </div>
                </div>
            )}

            {/* Cards list: hidden when folded */}
            <div className={`opp-cards-list ${isFolded ? 'hidden' : ''}`}>
                <SortableContext items={opportunities.map(o => o.id)} strategy={verticalListSortingStrategy}>
                    {opportunities.map(opp => (
                        <OpportunityCard
                            key={opp.id}
                            opp={opp}
                            onClick={() => onCardClick && onCardClick(opp, 'details')}
                            onEdit={(o) => onCardClick && onCardClick(o, 'edit')}
                            onArchive={(o) => onCardClick && onCardClick(o, 'archive')}
                        />
                    ))}
                </SortableContext>
                {!isFolded && opportunities.length === 0 && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 10px', opacity: 0.2 }}>
                        <TrendingUp size={32} />
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── MAIN COMPONENT ────────────────────────────── */
export default function CRMPipeline2026() {
    const navigate = useNavigate();
    const boardRef = React.useRef<HTMLDivElement>(null);
    const [opportunities, setOpportunities] = useState([]);
    const [stages, setStages] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [winOverlay, setWinOverlay] = useState(false);
    const [lossOverlay, setLossOverlay] = useState(false);
    const [foldedStages, setFoldedStages] = useState<string[]>([]);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        expectedRevenue: '',
        probability: '50',
        stageId: '',
        priority: '1',
        salespersonId: '',
        contactName: '',
        phone: '',
        mobile: '',
        emailFrom: '',
        nationality: '',
        emirate: '',
        interestedDiploma: '',
        levelOfInterest: '0',
    });

    // Detail Panel state
    const [selectedOpp, setSelectedOpp] = useState<any>(null);
    const [showDetailPanel, setShowDetailPanel] = useState(false);
    const [detailTab, setDetailTab] = useState<'details' | 'activities'>('details');
    const [detailForm, setDetailForm] = useState<any>({});
    const [oppActivities, setOppActivities] = useState<any[]>([]);
    const [actTypes, setActTypes] = useState<any[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [actForm, setActForm] = useState({ activityTypeId: '', summary: '', dateDeadline: '' });
    const [savingDetail, setSavingDetail] = useState(false);

    // Done Activity Modal State
    const [doneModalOpen, setDoneModalOpen] = useState(false);
    const [doneActId, setDoneActId] = useState<string | null>(null);
    const [doneForm, setDoneForm] = useState({ note: '', nextStageId: '', isClosed: false });

    const [groupBy, setGroupBy] = useState<'salesperson' | null>(null);
    const [foldedGroups, setFoldedGroups] = useState<string[]>([]);
    const [showSidebar, setShowSidebar] = useState(false);

    // Filter states
    const [search, setSearch] = useState('');
    const [filterSource, setFilterSource] = useState('');
    const [filterSalesp, setFilterSalesp] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const STAGE_PROBABILITIES: Record<string, string> = {
        'New': '10',
        'Qualification': '30',
        'Proposition': '70',
        'Negotiation': '90',
        'Won': '100'
    };

    useEffect(() => { fetchAll(); fetchActTypes(); }, []);

    const fetchActTypes = async () => {
        try { const r = await activityTypeApi.getAll(); setActTypes(r.data || []); } catch { }
    };

    const openDetailPanel = async (opp: any) => {
        setSelectedOpp(opp);
        setDetailForm({
            name: opp.name || '',
            expectedRevenue: opp.expectedRevenue?.toString() || '',
            probability: opp.probability?.toString() || '50',
            stageId: opp.stageId || '',
            priority: opp.priority || '1',
            salespersonId: opp.salespersonId || '',
            
            // Custom CRM fields
            contactName: opp.contactName || '',
            phone: opp.phone || '',
            mobile: opp.mobile || '',
            emailFrom: opp.emailFrom || '',
            nationality: opp.nationality || '',
            emirate: opp.emirate || '',
            interestedDiploma: opp.interestedDiploma || '',
            levelOfInterest: opp.levelOfInterest?.toString() || '0',
        });
        setDetailTab('details');
        setActForm({ activityTypeId: actTypes[0]?.id || '', summary: '', dateDeadline: '' });
        setShowDetailPanel(true);
        // Fetch activities
        setLoadingActivities(true);
        try {
            const r = await activityApi.getByLead(opp.id);
            setOppActivities(r.data || []);
        } catch { } finally { setLoadingActivities(false); }
    };

    const saveDetail = async () => {
        if (!selectedOpp) return;
        setSavingDetail(true);
        try {
            const payload = {
                ...detailForm,
                expectedRevenue: detailForm.expectedRevenue ? parseFloat(detailForm.expectedRevenue) : 0,
                probability: parseInt(detailForm.probability) || 0,
                levelOfInterest: parseInt(detailForm.levelOfInterest) || 0,
            };
            const res = await leadApi.update(selectedOpp.id, payload);
            if (res.data) {
                setToast({ type: 'success', message: '✅ تم تحديث الفرصة' });
                fetchAll();
                setSelectedOpp({ ...selectedOpp, ...payload });
            }
        } catch { setToast({ type: 'error', message: '❌ فشل الحفظ' }); }
        finally { setSavingDetail(false); }
    };

    const addActivity = async () => {
        if (!selectedOpp || !actForm.activityTypeId) return;
        try {
            await activityApi.create({
                resId: selectedOpp.id,
                activityTypeId: actForm.activityTypeId,
                summary: actForm.summary,
                dateDeadline: actForm.dateDeadline ? new Date(actForm.dateDeadline).toISOString() : new Date().toISOString(),
                status: 'PLANNED',
            });
            setActForm({ activityTypeId: actTypes[0]?.id || '', summary: '', dateDeadline: '' });
            setToast({ type: 'success', message: '✅ تم إضافة النشاط' });
            const r = await activityApi.getByLead(selectedOpp.id);
            setOppActivities(r.data || []);
        } catch { setToast({ type: 'error', message: '❌ فشل إضافة النشاط' }); }
    };

    const markActivityDonePrompt = (actId: string) => {
        setDoneActId(actId);
        setDoneForm({ note: '', nextStageId: '', isClosed: false });
        setDoneModalOpen(true);
    };

    const confirmMarkDone = async () => {
        if (!doneActId || !selectedOpp) return;
        try {
            await activityApi.markDone(doneActId, doneForm);
            setDoneModalOpen(false);
            setToast({ type: 'success', message: '✅ تم إنجاز النشاط' });

            // Refresh detailed activities
            const r = await activityApi.getByLead(selectedOpp.id);
            setOppActivities(r.data || []);

            // If stage changed or closed, we must refresh kanban
            if (doneForm.nextStageId || doneForm.isClosed) {
                fetchAll();
                if (doneForm.isClosed) {
                    setShowDetailPanel(false);
                    setSelectedOpp(null);
                } else {
                    setSelectedOpp(prev => ({ ...prev, stageId: doneForm.nextStageId }));
                }
            }
        } catch { setToast({ type: 'error', message: '❌ فشل إنجاز النشاط' }); }
    };

    const openModal = (opp?: any, stageId?: string) => {
        if (opp) {
            setEditingId(opp.id);
            setFormData({
                name: opp.name || '',
                expectedRevenue: opp.expectedRevenue?.toString() || '',
                probability: opp.probability?.toString() || '50',
                stageId: opp.stageId || '',
                priority: opp.priority || '1',
                salespersonId: opp.salespersonId || '',
                contactName: opp.contactName || '',
                phone: opp.phone || '',
                mobile: opp.mobile || '',
                emailFrom: opp.emailFrom || '',
                nationality: opp.nationality || '',
                emirate: opp.emirate || '',
                interestedDiploma: opp.interestedDiploma || '',
                levelOfInterest: opp.levelOfInterest?.toString() || '0',
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                expectedRevenue: '',
                probability: STAGE_PROBABILITIES[stages.find(s => s.id === stageId)?.name || ''] || '10',
                stageId: stageId || (stages[0]?.id || ''),
                priority: '1',
                salespersonId: '',
                contactName: '',
                phone: '',
                mobile: '',
                emailFrom: '',
                nationality: '',
                emirate: '',
                interestedDiploma: '',
                levelOfInterest: '0',
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async () => {
        try {
            const payload = {
                ...formData,
                expectedRevenue: formData.expectedRevenue ? parseFloat(formData.expectedRevenue) : 0,
                probability: parseInt(formData.probability) || 0,
                levelOfInterest: parseInt(formData.levelOfInterest) || 0,
                type: 'opportunity'
            };

            const res = editingId ? await leadApi.update(editingId, payload) : await leadApi.create(payload);
            if (res.data) {
                setToast({ type: 'success', message: editingId ? '✅ تم تحديث الفرصة' : '✅ تم إنشاء الفرصة' });
                setShowModal(false);
                fetchAll();
            }
        } catch { setToast({ type: 'error', message: '❌ فشل الحفظ' }); }
    };

    async function archiveOpp(opp: any) {
        if (!confirm('هل أنت متأكد من أرشفة هذه الفرصة؟ ستبقى البيانات محفوظة ولن تُحذف نهائياً.')) return;
        try {
            await leadApi.update(opp.id, { active: false });
            setToast({ type: 'success', message: '✅ تمت أرشفة الفرصة بنجاح' });
            fetchAll();
        } catch {
            setToast({ type: 'error', message: '❌ فشل أرشفة الفرصة' });
        }
    }

    function handleCardClick(opp: any, action?: 'details' | 'edit' | 'archive') {
        if (action === 'edit') {
            openModal(opp, opp.stageId);
        } else if (action === 'archive') {
            archiveOpp(opp);
        } else {
            openDetailPanel(opp);
        }
    }

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [oppsRes, stagesRes, empRes, progRes] = await Promise.all([
                leadApi.getAll({ type: 'opportunity' }),
                stageApi.getAll(),
                hrService.getEmployees(),
                academicService.getPrograms()
            ]);
            setOpportunities(oppsRes.data || []);
            const sortedStages = stagesRes.data.sort((a, b) => a.sequence - b.sequence) || [];
            setStages(sortedStages);
            setFoldedStages(sortedStages.filter(s => s.isFolded).map(s => s.id));
            setEmployees(empRes.data || []);
            setPrograms(progRes.data?.programs || []);
        } catch { setToast({ type: 'error', message: '❌ فشل تحميل البيانات' }); }
        finally { setLoading(false); }
    };

    const toggleFold = (stageId: string) => {
        setFoldedStages(prev => prev.includes(stageId) ? prev.filter(id => id !== stageId) : [...prev, stageId]);
    };

    // ─── DRAG TO SCROLL LOGIC ───
    useEffect(() => {
        const slider = boardRef.current;
        if (!slider) return;

        let isDown = false;
        let startX: number;
        let scrollLeft: number;

        const onMouseDown = (e: MouseEvent) => {
            // If clicking a card, let dnd-kit handle it
            if ((e.target as HTMLElement).closest('.opp-card')) return;

            isDown = true;
            slider.classList.add('grabbing-board');
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        };

        const onMouseLeave = () => {
            isDown = false;
            slider.classList.remove('grabbing-board');
        };

        const onMouseUp = () => {
            isDown = false;
            slider.classList.remove('grabbing-board');
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 1.5; // speed
            slider.scrollLeft = scrollLeft - walk;
        };

        slider.addEventListener('mousedown', onMouseDown);
        slider.addEventListener('mouseleave', onMouseLeave);
        slider.addEventListener('mouseup', onMouseUp);
        slider.addEventListener('mousemove', onMouseMove);

        return () => {
            slider.removeEventListener('mousedown', onMouseDown);
            slider.removeEventListener('mouseleave', onMouseLeave);
            slider.removeEventListener('mouseup', onMouseUp);
            slider.removeEventListener('mousemove', onMouseMove);
        };
    }, []);

    const filteredOpportunities = useMemo(() => {
        // Only include opportunities that belong to one of our fetched stages
        const stageIds = stages.map(s => s.id);

        return opportunities.filter((opp: any) => {
            if (!stageIds.includes(opp.stageId)) return false;

            const h = `${opp.name} ${opp.phone}`.toLowerCase();
            if (search && !h.includes(search.toLowerCase())) return false;
            if (filterSalesp && opp.salespersonId !== filterSalesp) return false;
            return true;
        });
    }, [opportunities, search, filterSalesp, stages]);

    const groups = useMemo(() => {
        if (!groupBy) {
            return [{ id: 'all', title: 'كافة البيانات', opportunities: filteredOpportunities }];
        }

        if (groupBy === 'salesperson') {
            const map: Record<string, any[]> = {};
            filteredOpportunities.forEach(o => {
                const key = o.salespersonId || 'unassigned';
                if (!map[key]) map[key] = [];
                map[key].push(o);
            });

            return [
                ...employees.map(e => ({
                    id: e.userId || e.id,
                    title: `${e.user?.firstName || ''} ${e.user?.lastName || ''}`.trim() || e.employeeCode,
                    opportunities: map[e.userId || e.id] || []
                })),
                { id: 'unassigned', title: 'غير مسند', opportunities: map['unassigned'] || [] }
            ].filter(g => g.opportunities.length > 0);
        }
        return [];
    }, [filteredOpportunities, groupBy, employees]);

    const activeOpp = useMemo(() => opportunities.find(o => o.id === activeId), [activeId, opportunities]);

    const handleDragStart = (event) => { setActiveId(event.active.id); };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const leadId = active.id;
        const overId = over.id;

        let newStageId = overId;
        const isColumn = stages.some(s => s.id === overId);
        if (!isColumn) {
            const targetOpp = filteredOpportunities.find(o => o.id === overId);
            newStageId = targetOpp?.stageId;
        }

        const sourceOpp = opportunities.find(o => o.id === leadId);
        if (sourceOpp && sourceOpp.stageId !== newStageId) {
            const targetStage = stages.find(s => s.id === newStageId);
            const newProb = targetStage?.probability ?? sourceOpp.probability;

            // Trigger effects
            if (targetStage?.isWon) {
                setWinOverlay(true);
                setTimeout(() => setWinOverlay(false), 3000);
            } else if (targetStage?.isLost) {
                setLossOverlay(true);
                setTimeout(() => setLossOverlay(false), 3000);
            }

            setOpportunities(prev => prev.map(o => o.id === leadId ? { ...o, stageId: newStageId, probability: newProb, stage: targetStage } : o));
            try {
                await leadApi.update(leadId, { stageId: newStageId, probability: newProb });
                setToast({ type: 'success', message: '✅ تم تحديث المرحلة والاحتمالية' });
            } catch {
                setToast({ type: 'error', message: '❌ فشل التحديث' });
                fetchAll();
            }
        }
    };

    const totalVal = useMemo(() =>
        filteredOpportunities.reduce((acc, curr) => acc + (Number(curr.expectedRevenue) || 0), 0)
        , [filteredOpportunities]);

    const stats = useMemo(() => ({
        total: filteredOpportunities.length,
        revenue: totalVal.toLocaleString()
    }), [filteredOpportunities, totalVal]);


    const SidebarContent = () => (
        <>
            <div className="ag-sidebar-head">
                <span className="ag-sidebar-head-title">تصفية النتائج</span>
                <button className="ag-sidebar-head-close" onClick={() => setShowSidebar(false)}>
                    <X size={18} />
                </button>
            </div>
            <div className="ag-sidebar-pane">
                <div className="ag-filter-group">
                    <span className="ag-filter-label">البحث عن عميل</span>
                    <div className="ag-search">
                        <Search size={14} />
                        <input
                            type="text"
                            placeholder="بحث باسم العميل..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="ag-divider" />

                <div className="ag-filter-group">
                    <span className="ag-filter-label">مسؤول المبيعات</span>
                    <select className="ag-select" value={filterSalesp} onChange={(e) => setFilterSalesp(e.target.value)}>
                        <option value="">كل الموظفين</option>
                        {employees.map((e: any) => (
                            <option key={e.userId} value={e.userId}>{`${e.user?.firstName || ''} ${e.user?.lastName || ''}`.trim() || e.employeeCode}</option>
                        ))}
                    </select>
                </div>

                <div className="ag-filter-group">
                    <span className="ag-filter-label">طريقة التجميع</span>
                    <select className="ag-select" value={groupBy || ''} onChange={(e) => setGroupBy(e.target.value as any || null)}>
                        <option value="">أفقي فقط (بدون تجميع)</option>
                        <option value="salesperson">حسب المسؤول (رأسي)</option>
                    </select>
                </div>

                <button className="ag-btn ag-btn-ghost" style={{ width: '100%', marginTop: 'auto' }} onClick={() => { setSearch(''); setFilterSalesp(''); setGroupBy(null); }}>
                    <RefreshCw size={14} /> مسح التصفية
                </button>
            </div>
        </>
    );

    return (
        <div className="ag-root">
            {/* ── HEADER ── */}
            <header className="ag-header">
                <div className="ag-header-left">
                    <h1 className="ag-title">
                        <TrendingUp size={20} />
                        خط الأنابيب
                    </h1>
                    <div className="ag-mini-stats hide-mobile" style={{ marginRight: 20, paddingRight: 20, borderRight: '1px solid var(--hz-border-soft)' }}>
                        <div className="ag-stat-pill">
                            <span className="ag-stat-val">{stats.total}</span>
                            فرصة
                        </div>
                        <div className="ag-stat-pill">
                            <span className="ag-stat-val">{stats.revenue}</span>
                            ج.م
                        </div>
                    </div>
                </div>

                <div className="ag-header-right">
                    <button className="ag-btn-icon hide-mobile" title="تحديث" onClick={fetchAll}>
                        <RefreshCw size={16} />
                    </button>
                    <button className={`ag-btn-icon ${showSidebar ? 'active' : ''}`} title="تصفية" onClick={() => setShowSidebar(!showSidebar)}>
                        <SlidersHorizontal size={16} />
                    </button>
                    <button className="ag-btn ag-btn-primary" onClick={() => openModal()}>
                        <Plus size={16} />
                        <span className="hide-mobile">فرصة جديدة</span>
                    </button>
                </div>
            </header>

            {/* ── BODY ── */}
            <div className="ag-body">
                {/* Mobile Sidebar Overlay */}
                <div className={`ag-sidebar-overlay ${showSidebar ? 'show' : ''}`} onClick={() => setShowSidebar(false)} />

                {/* Sidebar */}
                <div className={`ag-sidebar ${showSidebar ? 'show' : 'hide'}`}>
                    <SidebarContent />
                </div>

                {/* Main Content */}
                <main className="ag-main">
                    <div className="opp-kanban-board" ref={boardRef}>
                        {loading && opportunities.length === 0 ? (
                            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: 100 }}><HzLoader /></div>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={rectIntersection}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                            >
                                {/* MASTER COLUMN HEADERS (only if grouped) */}
                                {groupBy && (
                                    <div className="opp-master-headers">
                                        {stages.map(stage => {
                                            const isFolded = foldedStages.includes(stage.id);
                                            const oppsInStage = filteredOpportunities.filter(o => o.stageId === stage.id);
                                            const total = oppsInStage.reduce((acc, curr) => acc + (Number(curr.expectedRevenue) || 0), 0);
                                            return (
                                                <div key={stage.id} className={`opp-master-col ${isFolded ? 'folded' : ''}`}>
                                                    {!isFolded ? (
                                                        <div className="opp-col-header" style={{ border: 'none' }}>
                                                            <div onClick={() => toggleFold(stage.id)} style={{ cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                <div className="ag-avatar" style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--hz-surface-2)' }}>
                                                                    <Archive size={16} color="var(--hz-text-muted)" />
                                                                </div>
                                                                <div style={{ overflow: 'hidden' }}>
                                                                    <div className="opp-col-title" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{stage.nameAr || stage.name}</div>
                                                                    <div className="opp-col-meta">
                                                                        {oppsInStage.length} فرصة • {total.toLocaleString()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button className="ag-btn-icon" style={{ width: 28, height: 28 }} onClick={() => openModal(null, stage.id)}>
                                                                <Plus size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="opp-folded-content" onClick={() => toggleFold(stage.id)} style={{ cursor: 'pointer', border: 'none' }}>
                                                            <div className="opp-col-title-vertical">{stage.nameAr || stage.name}</div>
                                                            <div className="opp-folded-count">
                                                                {oppsInStage.length}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {groups.map(group => (
                                    <div key={group.id} className={`opp-swimlane ${foldedGroups.includes(group.id) ? 'folded' : ''}`}>
                                        <div className="opp-swimlane-header" onClick={() => setFoldedGroups(prev => prev.includes(group.id) ? prev.filter(gid => gid !== group.id) : [...prev, group.id])}>
                                            <div className="opp-swimlane-title">
                                                {groupBy === 'salesperson' ? <User size={14} /> : <LayoutGrid size={14} />}
                                                {group.title}
                                                <span className="opp-swimlane-badge">{group.opportunities.length}</span>
                                            </div>
                                            <div className="opp-swimlane-line" />
                                        </div>
                                        <div className="opp-swimlane-body">
                                            <SortableContext items={group.opportunities.map(o => o.id)} strategy={verticalListSortingStrategy}>
                                                {stages.map(stage => (
                                                    <KanbanColumn
                                                        key={stage.id}
                                                        id={stage.id}
                                                        title={stage.nameAr || stage.name}
                                                        isFolded={foldedStages.includes(stage.id)}
                                                        onToggleFold={() => toggleFold(stage.id)}
                                                        hideHeader={!!groupBy}
                                                        opportunities={group.opportunities.filter(opp => opp.stageId === stage.id)}
                                                        totalRevenue={group.opportunities.filter(opp => opp.stageId === stage.id).reduce((acc, curr) => acc + (Number(curr.expectedRevenue) || 0), 0)}
                                                        onAdd={(sid) => openModal(null, sid)}
                                                        onCardClick={handleCardClick}
                                                    />
                                                ))}
                                            </SortableContext>
                                        </div>
                                    </div>
                                ))}

                                <DragOverlay dropAnimation={null}>
                                    {activeId && activeOpp ? (
                                        <div style={{ width: 300, cursor: 'grabbing' }}>
                                            <OpportunityCard
                                                opp={activeOpp}
                                                isOverlay={true}
                                                style={{
                                                    transform: 'rotate(2deg)',
                                                    cursor: 'grabbing'
                                                }}
                                            />
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        )}
                    </div>
                </main>
            </div>

            {/* ══ ADD MODAL ══ */}
            <HzModal open={showModal} onClose={() => setShowModal(false)}
                size="md"
                icon={<Settings size={18} />}
                title={editingId ? 'تعديل الفرصة' : 'إضافة فرصة جديدة'}
                footer={<>
                    <HzBtn variant="secondary" onClick={() => setShowModal(false)}>تراجع</HzBtn>
                    <HzBtn variant="primary" onClick={handleSubmit} style={{ marginRight: 'auto' }}>
                        {editingId ? 'حفظ التغييرات' : 'إنشاء الفرصة'}
                    </HzBtn>
                </>}
            >
                <div className="hz-form-row">
                    <div className="hz-form-group">
                        <label className="hz-label">اسم الفرصة / العميل</label>
                        <input className="hz-input" placeholder="مثال: شركة النخيل" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                </div>
                <div className="hz-form-row cols-2">
                    <div className="hz-form-group">
                        <label className="hz-label">الاسم الكامل للمخاطب</label>
                        <input className="hz-input" placeholder="اسم المخاطب" value={formData.contactName} onChange={e => setFormData({ ...formData, contactName: e.target.value })} />
                    </div>
                    <div className="hz-form-group">
                        <label className="hz-label">رقم الهاتف</label>
                        <input className="hz-input" placeholder="رقم الهاتف" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                </div>
                <div className="hz-form-row cols-2">
                    <div className="hz-form-group">
                        <label className="hz-label">الجنسية</label>
                        <input className="hz-input" placeholder="مثال: الإمارات" value={formData.nationality} onChange={e => setFormData({ ...formData, nationality: e.target.value })} />
                    </div>
                    <div className="hz-form-group">
                        <label className="hz-label">الإمارة</label>
                        <input className="hz-input" placeholder="مثال: أبوظبي" value={formData.emirate} onChange={e => setFormData({ ...formData, emirate: e.target.value })} />
                    </div>
                </div>
                <div className="hz-form-row cols-2">
                    <div className="hz-form-group">
                        <label className="hz-label">الدبلوم المهتم به</label>
                        <input className="hz-input" placeholder="إدارة أعمال" value={formData.interestedDiploma} onChange={e => setFormData({ ...formData, interestedDiploma: e.target.value })} />
                    </div>
                    <div className="hz-form-group">
                        <label className="hz-label">درجة الاهتمام (0-10)</label>
                        <input className="hz-input" type="number" min="0" max="10" value={formData.levelOfInterest} onChange={e => setFormData({ ...formData, levelOfInterest: e.target.value })} />
                    </div>
                </div>
                <div className="hz-form-row cols-2">
                    <div className="hz-form-group">
                        <label className="hz-label">الإيرادات المتوقعة</label>
                        <div style={{ position: 'relative' }}>
                            <input className="hz-input" placeholder="0.00" type="number" style={{ paddingLeft: 45 }} value={formData.expectedRevenue} onChange={e => setFormData({ ...formData, expectedRevenue: e.target.value })} />
                            <DollarSign size={14} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                        </div>
                    </div>
                    <div className="hz-form-group">
                        <label className="hz-label">الاحتمالية (%)</label>
                        <input className="hz-input" type="number" value={formData.probability} onChange={e => setFormData({ ...formData, probability: e.target.value })} />
                    </div>
                </div>
                <div className="hz-form-row cols-2">
                    <div className="hz-form-group">
                        <label className="hz-label">المرحلة الحالية</label>
                        <select className="hz-input" value={formData.stageId} onChange={e => setFormData({ ...formData, stageId: e.target.value })}>
                            {stages.map(s => <option key={s.id} value={s.id}>{s.nameAr || s.name}</option>)}
                        </select>
                    </div>
                    <div className="hz-form-group">
                        <label className="hz-label">مسؤول المبيعات</label>
                        <select className="hz-input" value={formData.salespersonId} onChange={e => setFormData({ ...formData, salespersonId: e.target.value })}>
                            <option value="">اختر...</option>
                            {employees.map((e: any) => (
                                <option key={e.userId} value={e.userId}>{`${e.user?.firstName || ''} ${e.user?.lastName || ''}`.trim() || e.employeeCode}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </HzModal>

            {/* ══ OPPORTUNITY DETAIL PANEL ══ */}
            {showDetailPanel && (
                <div className="opp-detail-overlay" onClick={() => setShowDetailPanel(false)} />
            )}
            <div className={`opp-detail-panel ${showDetailPanel ? 'open' : ''}`}>
                {selectedOpp && (
                    <>
                        {/* Panel Header */}
                        <div className="odp-header">
                            <div className="odp-header-info">
                                <div className="odp-title">{selectedOpp.name}</div>
                                <div className="odp-stage">{selectedOpp.stage?.nameAr || selectedOpp.stage?.name || '—'}</div>
                            </div>
                            <button className="odp-close" onClick={() => setShowDetailPanel(false)}><X size={18} /></button>
                        </div>

                        {/* Tabs */}
                        <div className="odp-tabs">
                            <button className={`odp-tab ${detailTab === 'details' ? 'active' : ''}`} onClick={() => setDetailTab('details')}>
                                <Settings size={14} /> التفاصيل
                            </button>
                            <button className={`odp-tab ${detailTab === 'activities' ? 'active' : ''}`} onClick={() => setDetailTab('activities')}>
                                <Calendar size={14} /> الأنشطة
                                {oppActivities.length > 0 && <span className="odp-tab-badge">{oppActivities.length}</span>}
                            </button>
                        </div>

                        <div className="odp-body">
                            {/* ── DETAILS TAB ── */}
                            {detailTab === 'details' && (
                                <div className="odp-details-form">
                                    {/* Duplicate Warning Indicator */}
                                    {selectedOpp.isDuplicate && (
                                        <div style={{
                                            background: 'rgba(250, 204, 21, 0.12)',
                                            border: '1px solid rgba(250, 204, 21, 0.4)',
                                            borderRadius: '8px',
                                            padding: '12px',
                                            fontSize: '0.8rem',
                                            color: '#facc15',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 4,
                                            marginBottom: 10
                                        }}>
                                            <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span>⚠️ هذا العميل مكرر واستفسر سابقاً!</span>
                                            </div>
                                            <div style={{ opacity: 0.9, fontSize: '0.72rem' }}>
                                                🔄 عدد مرات التكرار: {selectedOpp.duplicateCount} مرات
                                            </div>
                                            {selectedOpp.createdAt && (
                                                <div style={{ opacity: 0.9, fontSize: '0.72rem' }}>
                                                    📅 أول تواصل: {new Date(selectedOpp.createdAt).toLocaleDateString('ar-EG')}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Section 1: Contact Details */}
                                    <div style={{ borderBottom: '1px solid var(--hz-border-soft)', paddingBottom: 12, marginBottom: 4 }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--hz-primary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>👤 بيانات الاتصال للعميل</div>
                                        
                                        <div className="hz-form-group" style={{ marginBottom: 10 }}>
                                            <label className="hz-label">الاسم الكامل للمخاطب</label>
                                            <input className="hz-input" value={detailForm.contactName || ''} onChange={e => setDetailForm({ ...detailForm, contactName: e.target.value })} placeholder="الاسم الكامل للعميل" />
                                        </div>
                                        <div className="hz-form-row cols-2" style={{ marginBottom: 10 }}>
                                            <div className="hz-form-group">
                                                <label className="hz-label">رقم الهاتف</label>
                                                <input className="hz-input" value={detailForm.phone || ''} onChange={e => setDetailForm({ ...detailForm, phone: e.target.value })} placeholder="مثال: 971..." />
                                            </div>
                                            <div className="hz-form-group">
                                                <label className="hz-label">رقم الجوال</label>
                                                <input className="hz-input" value={detailForm.mobile || ''} onChange={e => setDetailForm({ ...detailForm, mobile: e.target.value })} placeholder="رقم الجوال الإضافي" />
                                            </div>
                                        </div>
                                        <div className="hz-form-group" style={{ marginBottom: 10 }}>
                                            <label className="hz-label">البريد الإلكتروني</label>
                                            <input className="hz-input" type="email" value={detailForm.emailFrom || ''} onChange={e => setDetailForm({ ...detailForm, emailFrom: e.target.value })} placeholder="example@mail.com" />
                                        </div>
                                    </div>

                                    {/* Section 2: Specialized CRM Data */}
                                    <div style={{ borderBottom: '1px solid var(--hz-border-soft)', paddingBottom: 12, marginBottom: 4 }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--hz-primary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>🌍 بيانات العميل المتخصصة</div>
                                        
                                        <div className="hz-form-row cols-2" style={{ marginBottom: 10 }}>
                                            <div className="hz-form-group">
                                                <label className="hz-label">الجنسية</label>
                                                <input className="hz-input" value={detailForm.nationality || ''} onChange={e => setDetailForm({ ...detailForm, nationality: e.target.value })} placeholder="مثال: الإمارات" />
                                            </div>
                                            <div className="hz-form-group">
                                                <label className="hz-label">الإمارة</label>
                                                <input className="hz-input" value={detailForm.emirate || ''} onChange={e => setDetailForm({ ...detailForm, emirate: e.target.value })} placeholder="مثال: أبوظبي" />
                                            </div>
                                        </div>
                                        <div className="hz-form-group" style={{ marginBottom: 10 }}>
                                            <label className="hz-label">الدبلوم المهتم به</label>
                                            <input className="hz-input" value={detailForm.interestedDiploma || ''} onChange={e => setDetailForm({ ...detailForm, interestedDiploma: e.target.value })} placeholder="مثال: إدارة أعمال" />
                                        </div>
                                        <div className="hz-form-group" style={{ marginBottom: 10 }}>
                                            <label className="hz-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>درجة الاهتمام</span>
                                                <span style={{ fontWeight: 900, color: parseInt(detailForm.levelOfInterest) >= 7 ? 'var(--hz-coral)' : 'var(--hz-neon)' }}>🔥 {detailForm.levelOfInterest || '0'}/10</span>
                                            </label>
                                            <input className="hz-input" type="range" min="0" max="10" value={detailForm.levelOfInterest || '0'} onChange={e => setDetailForm({ ...detailForm, levelOfInterest: e.target.value })} style={{ padding: '0px', height: '6px', background: 'var(--hz-border-soft)' }} />
                                        </div>
                                    </div>

                                    {/* Section 3: Opportunity Details */}
                                    <div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--hz-primary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>💼 بيانات فرصة المبيعات</div>
                                        
                                        <div className="hz-form-group" style={{ marginBottom: 10 }}>
                                            <label className="hz-label">اسم الفرصة</label>
                                            <input className="hz-input" value={detailForm.name} onChange={e => setDetailForm({ ...detailForm, name: e.target.value })} />
                                        </div>
                                        <div className="hz-form-row cols-2" style={{ marginBottom: 10 }}>
                                            <div className="hz-form-group">
                                                <label className="hz-label">الإيرادات المتوقعة</label>
                                                <input className="hz-input" type="number" value={detailForm.expectedRevenue} onChange={e => setDetailForm({ ...detailForm, expectedRevenue: e.target.value })} />
                                            </div>
                                            <div className="hz-form-group">
                                                <label className="hz-label">الاحتمالية (%)</label>
                                                <input className="hz-input" type="number" min={0} max={100} value={detailForm.probability} onChange={e => setDetailForm({ ...detailForm, probability: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="hz-form-group" style={{ marginBottom: 10 }}>
                                            <label className="hz-label">المرحلة</label>
                                            <select className="hz-input" value={detailForm.stageId} onChange={e => setDetailForm({ ...detailForm, stageId: e.target.value })}>
                                                {stages.map(s => <option key={s.id} value={s.id}>{s.nameAr || s.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="hz-form-group" style={{ marginBottom: 10 }}>
                                            <label className="hz-label">مسؤول المبيعات</label>
                                            <select className="hz-input" value={detailForm.salespersonId} onChange={e => setDetailForm({ ...detailForm, salespersonId: e.target.value })}>
                                                <option value="">اختر...</option>
                                                {employees.map((e: any) => (
                                                    <option key={e.userId} value={e.userId}>{`${e.user?.firstName || ''} ${e.user?.lastName || ''}`.trim()}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="hz-form-group" style={{ marginBottom: 10 }}>
                                            <label className="hz-label">الأولوية</label>
                                            <select className="hz-input" value={detailForm.priority} onChange={e => setDetailForm({ ...detailForm, priority: e.target.value })}>
                                                <option value="1">عادية</option>
                                                <option value="2">مهمة</option>
                                                <option value="3">عاجلة</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <HzBtn variant="primary" onClick={saveDetail} style={{ width: '100%', marginTop: 8 }}>
                                        {savingDetail ? '...' : '💾 حفظ التغييرات'}
                                    </HzBtn>
                                </div>
                            )}

                            {/* ── ACTIVITIES TAB ── */}
                            {detailTab === 'activities' && (
                                <div className="odp-activities">
                                    {/* Add Activity Form */}
                                    <div className="odp-act-form">
                                        <div className="odp-act-form-title">إضافة نشاط جديد</div>
                                        <select className="hz-input" value={actForm.activityTypeId} onChange={e => setActForm({ ...actForm, activityTypeId: e.target.value })}>
                                            <option value="">اختر نوع النشاط...</option>
                                            {actTypes.map(t => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name}
                                                </option>
                                            ))}
                                        </select>
                                        <input className="hz-input" placeholder="وصف / ملاحظة..." value={actForm.summary} onChange={e => setActForm({ ...actForm, summary: e.target.value })} />
                                        <div className="hz-form-row cols-2" style={{ gap: 8 }}>
                                            <input className="hz-input" type="date" value={actForm.dateDeadline} onChange={e => setActForm({ ...actForm, dateDeadline: e.target.value })} />
                                            <HzBtn variant="primary" onClick={addActivity}><Plus size={14} /> إضافة</HzBtn>
                                        </div>
                                    </div>

                                    {/* Activities List */}
                                    {loadingActivities ? (
                                        <div style={{ textAlign: 'center', padding: 20, color: 'var(--hz-text-muted)' }}>جارٍ التحميل...</div>
                                    ) : oppActivities.length === 0 ? (
                                        <div className="odp-act-empty"><Calendar size={28} /><span>لا توجد أنشطة بعد</span></div>
                                    ) : (
                                        <div className="odp-act-list">
                                            {oppActivities.map((act: any) => {
                                                const isDone = act.status === 'DONE';
                                                const isOverdue = !isDone && act.calculatedStatus === 'overdue';
                                                const typeColor = act.type?.color || '#06b6d4';
                                                return (
                                                    <div key={act.id} className={`odp-act-item ${isDone ? 'done' : ''} ${isOverdue ? 'overdue' : ''}`}>
                                                        <div className="odp-act-icon" style={{ background: typeColor + '22', borderColor: typeColor + '44' }}>
                                                            <ActivityIcon icon={act.type?.icon} color={typeColor} size={16} />
                                                        </div>
                                                        <div className="odp-act-body">
                                                            <div className="odp-act-type">{act.type?.name || '—'}</div>
                                                            {act.summary && <div className="odp-act-summary">{act.summary}</div>}
                                                            <div className="odp-act-date">
                                                                {isOverdue ? <AlarmClock size={11} /> : <Clock size={11} />}
                                                                {act.dateDeadline ? new Date(act.dateDeadline).toLocaleDateString('ar') : '—'}
                                                            </div>
                                                        </div>
                                                        {!isDone && (
                                                            <button className="odp-act-done" onClick={() => markActivityDonePrompt(act.id)} title="تم">
                                                                <CheckCheck size={14} />
                                                            </button>
                                                        )}
                                                        {isDone && <span className="odp-act-done-badge">✓</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* ── EFFECTS ── */}
            {winOverlay && (
                <div className="crm-effect-overlay win">
                    <div className="effect-content">
                        <div className="effect-icon">🏆</div>
                        <h2>تهانينا! صفقة ناجحة</h2>
                        <div className="confetti-container">
                            {[...Array(20)].map((_, i) => <div key={i} className="confetti-piece" />)}
                        </div>
                    </div>
                </div>
            )}

            {lossOverlay && (
                <div className="crm-effect-overlay loss">
                    <div className="effect-content">
                        <div className="effect-icon">😢</div>
                        <h2>لا تحزن لا تزال الطريق أمامك</h2>
                    </div>
                </div>
            )}

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            {/* ── DONE ACTIVITY MODAL ── */}
            <HzModal
                open={doneModalOpen}
                onClose={() => setDoneModalOpen(false)}
                title="إنجاز النشاط وتحديث الفرصة"
                icon={<CheckCheck size={18} />}
                size="md"
                footer={
                    <>
                        <HzBtn variant="secondary" onClick={() => setDoneModalOpen(false)}>إلغاء</HzBtn>
                        <HzBtn variant="primary" onClick={confirmMarkDone}>
                            <CheckCheck size={15} /> تأكيد الإنجاز
                        </HzBtn>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="hz-form-group">
                        <label className="hz-label">ملاحظات الإنجاز (اختياري)</label>
                        <textarea
                            className="hz-input"
                            style={{ minHeight: 80, resize: 'vertical' }}
                            placeholder="ما الذي حدث في هذا النشاط؟..."
                            value={doneForm.note}
                            onChange={(e) => setDoneForm({ ...doneForm, note: e.target.value })}
                        />
                    </div>

                    <div className="hz-form-group">
                        <label className="hz-label">نقل الفرصة إلى مرحلة جديدة (اختياري)</label>
                        <select
                            className="hz-input"
                            value={doneForm.nextStageId}
                            onChange={(e) => setDoneForm({ ...doneForm, nextStageId: e.target.value, isClosed: false })}
                        >
                            <option value="">-- البقاء في نفس المرحلة --</option>
                            {stages.map(s => (
                                <option key={s.id} value={s.id}>{s.nameAr || s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <input
                            type="checkbox"
                            checked={doneForm.isClosed}
                            onChange={(e) => setDoneForm({ ...doneForm, isClosed: e.target.checked, nextStageId: e.target.checked ? '' : doneForm.nextStageId })}
                            id="close-opp-check"
                            style={{ width: 16, height: 16, cursor: 'pointer' }}
                        />
                        <label htmlFor="close-opp-check" style={{ fontSize: '0.85rem', color: 'var(--hz-coral)', cursor: 'pointer', fontWeight: 600 }}>وضع علامة كخاسرة لعدم وجود استجابة</label>
                    </div>
                </div>
            </HzModal>
        </div>
    );
}
