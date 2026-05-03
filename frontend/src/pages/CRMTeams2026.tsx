// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import {
    Users, Plus, Search, Filter,
    ShieldCheck, UserCheck, Star,
    TrendingUp, Target, Award,
    Edit2, Trash2, Mail, Phone,
    SlidersHorizontal, Eye
} from 'lucide-react';
import { teamApi } from '../services/crm.service';
import { hrService } from '../services/hr.service';
import { Toast, ToastType } from '../components/Toast';
import {
    HzPageHeader, HzStat, HzStatsGrid, HzBtn,
    HzBadge, HzModal, HzInput, HzSelect, HzLoader, HzEmpty, HzCard
} from '../layouts/Rapidos2026/components/RapidosUI';

import './CRMTeams2026.css';

/**
 * TEAM CARD COMPONENT
 */
function TeamCard({ team, onEdit }) {
    const leader = team.teamLeader?.user;
    const initials = leader ? `${leader.firstName?.charAt(0)}${leader.lastName?.charAt(0)}` : '?';

    return (
        <div className="team-card">
            <div className="team-card-header">
                <div className="team-card-icon">
                    <Users size={22} />
                </div>
                <button className="act-icon-btn" onClick={() => onEdit(team)}>
                    <Edit2 size={14} />
                </button>
            </div>

            <div>
                <h3 className="team-card-name">{team.name}</h3>
                <p className="team-card-desc">{team.description || 'لا يوجد وصف متاح لهذا الفريق حالياً'}</p>
            </div>

            <div className="team-leader-pill">
                <div className="team-leader-avatar">
                    {initials}
                </div>
                <div className="team-leader-info">
                    <span className="team-leader-label">قائد الفريق</span>
                    <span className="team-leader-name">{leader ? `${leader.firstName} ${leader.lastName}` : 'غير معين'}</span>
                </div>
            </div>

            <div className="team-stats-row">
                <div className="team-stat-item">
                    <span className="team-stat-lbl">الأعضاء</span>
                    <span className="team-stat-val">{team._count?.members || 0}</span>
                </div>
                <div className="team-stat-item">
                    <span className="team-stat-lbl">المستهدف</span>
                    <span className="team-stat-val" style={{ color: 'var(--hz-orange)' }}>
                        {(team.targetAmount || 0).toLocaleString()}
                        <span style={{ fontSize: '0.6rem', paddingRight: '4px' }}>ر.س</span>
                    </span>
                </div>
            </div>

            <div className="team-card-footer">
                <div className="team-members-avatars">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="team-member-dot">👤</div>
                    ))}
                    {team._count?.members > 3 && (
                        <div className="team-member-more">+{team._count.members - 3}</div>
                    )}
                </div>
                <HzBtn variant="ghost" size="sm" onClick={() => { }}>
                    <TrendingUp size={14} /> الأداء
                </HzBtn>
            </div>
        </div>
    );
}

export default function CRMTeams2026() {
    const [teams, setTeams] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [tab, setTab] = useState('all'); // 'all', 'performance'
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        teamLeaderId: '',
        targetAmount: 0,
        description: ''
    });

    useEffect(() => {
        fetchData();
        loadEmployees();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await teamApi.getAll();
            setTeams(res.data || []);
        } catch (error) {
            setToast({ type: 'error', message: '❌ فشل تحميل الفرق' });
        } finally {
            setLoading(false);
        }
    };

    const loadEmployees = async () => {
        try {
            const res = await hrService.getEmployees();
            setEmployees(res.data || []);
        } catch (error) { }
    };

    const handleSubmit = async (e?) => {
        if (e) e.preventDefault();
        try {
            const res = editingId
                ? await teamApi.update(editingId, formData)
                : await teamApi.create(formData);

            if (res.data) {
                setToast({ type: 'success', message: '✅ تم حفظ بيانات الفريق' });
                setShowModal(false);
                fetchData();
            }
        } catch (error) {
            setToast({ type: 'error', message: '❌ فشل حفظ البيانات' });
        }
    };

    const openAdd = () => {
        setEditingId(null);
        setFormData({ name: '', teamLeaderId: '', targetAmount: 0, description: '' });
        setShowModal(true);
    };

    const openEdit = (team) => {
        setEditingId(team.id);
        setFormData({
            name: team.name,
            teamLeaderId: team.teamLeaderId || '',
            targetAmount: team.targetAmount || 0,
            description: team.description || ''
        });
        setShowModal(true);
    };

    return (
        <div className="teams-page">
            {/* ── PAGE HEADER */}
            <div className="teams-page-header">
                <div className="teams-page-header-left">
                    <div className="teams-page-icon"><Users size={22} /></div>
                    <div>
                        <h1 className="teams-page-title">إدارة فرق المبيعات</h1>
                        <p className="teams-page-sub">تنظيم المناديب، تعيين القادة، ومتابعة المستهدفات المالية</p>
                    </div>
                </div>
                <div className="teams-page-header-right">
                    <HzBtn variant="primary" onClick={openAdd}>
                        <Plus size={16} /> فريق جديد
                    </HzBtn>
                </div>
            </div>

            {/* ── TABS */}
            <div className="teams-tabs">
                <button
                    className={`teams-tab ${tab === 'all' ? 'active' : ''}`}
                    onClick={() => setTab('all')}
                >
                    <Users size={16} />
                    جميع الفرق
                    <span className="teams-tab-count">{teams.length}</span>
                </button>
                <button
                    className={`teams-tab ${tab === 'performance' ? 'active' : ''}`}
                    onClick={() => setTab('performance')}
                >
                    <Target size={16} />
                    تحليل الأداء
                </button>
            </div>

            {/* ── CONTENT */}
            <div className="teams-content">
                {loading ? (
                    <HzLoader />
                ) : teams.length === 0 ? (
                    <HzEmpty
                        title="لا توجد فرق مبيعات"
                        description="ابدأ بإنشاء فريق المبيعات الأول وتعيين قائد للفريق"
                    />
                ) : (
                    <div className="teams-grid">
                        {teams.map(team => (
                            <TeamCard
                                key={team.id}
                                team={team}
                                onEdit={openEdit}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── MODAL: ADD/EDIT TEAM */}
            <HzModal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editingId ? 'تعديل بيانات الفريق' : 'إنشاء فريق مبيعات جديد'}
                icon={<Users size={18} />}
                size="md"
                footer={
                    <>
                        <HzBtn variant="secondary" onClick={() => setShowModal(false)}>تراجع</HzBtn>
                        <HzBtn variant="primary" onClick={() => handleSubmit()}>
                            <ShieldCheck size={15} /> {editingId ? 'حفظ التغييرات' : 'إنشاء الفريق'}
                        </HzBtn>
                    </>
                }
            >
                <div className="team-form-grid">
                    <div style={{ gridColumn: 'span 2' }}>
                        <HzInput
                            label="اسم الفريق"
                            placeholder="مثال: فريق المبيعات الغربية"
                            value={formData.name}
                            onChange={v => setFormData({ ...formData, name: v })}
                            required
                        />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <HzSelect
                            label="قائد الفريق"
                            value={formData.teamLeaderId}
                            onChange={v => setFormData({ ...formData, teamLeaderId: v })}
                            options={[
                                { value: '', label: 'اختر قائداً للفريق...' },
                                ...employees.map(e => ({ value: e.id, label: `${e.user?.firstName} ${e.user?.lastName}` }))
                            ]}
                        />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <HzInput
                            label="المستهدف المالي الشهري"
                            type="number"
                            value={String(formData.targetAmount)}
                            onChange={v => setFormData({ ...formData, targetAmount: parseFloat(v) || 0 })}
                            icon={<Award size={14} />}
                        />
                    </div>

                    <div style={{ gridColumn: 'span 2' }} className="hz-form-group">
                        <label className="hz-label">الوصف والأهداف</label>
                        <textarea
                            className="hz-input"
                            style={{ height: '80px', paddingTop: '10px' }}
                            placeholder="أدخل وصفاً موجزاً للفريق أو أهدافه الرئيسية..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </div>
            </HzModal>

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        </div>
    );
}
