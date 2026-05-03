// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import {
    Scale, Plus, Users, Edit2, FileText,
    TrendingUp, AlertTriangle, Award, MessageSquare,
    CheckCircle2, Printer, Trash2, Briefcase,
    ShieldAlert, Star, GraduationCap
} from 'lucide-react';
import { hrmsService } from '../services/hrms.service';
import { hrService } from '../services/hr.service';
import { Toast, ToastType } from '../components/Toast';
import {
    HzPageHeader, HzStat, HzStatsGrid, HzBtn,
    HzBadge, HzModal, HzInput, HzSelect, HzLoader, HzEmpty
} from '../layouts/Rapidos2026/components/RapidosUI';

/**
 * EMPLOYEE ACTIONS CENTER (Rapidos 2026)
 * Rewards, Penalties, Promotions & Complaints
 */

type ActionTab = 'awards' | 'warnings' | 'complaints' | 'promotions';

export default function HREmployeeActions() {
    const [activeTab, setActiveTab] = useState<ActionTab>('awards');
    const [data, setData] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

    const [formData, setFormData] = useState<any>({
        employeeId: '',
        awardType: '',
        warningBy: '',
        subject: '',
        complaintAgainst: '',
        date: new Date().toISOString().split('T')[0],
        gift: '',
        description: '',
        designation: '',
        promotionDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const empRes = await hrService.getEmployees();
            setEmployees(empRes.data || []);

            let res;
            if (activeTab === 'awards') res = await hrmsService.getAwards();
            else if (activeTab === 'warnings') res = await hrmsService.getWarnings();
            else if (activeTab === 'complaints') res = await hrmsService.getComplaints();

            if (res && res.success) setData(res.data || []);
            else setData([]);
        } catch (error) {
            setToast({ type: 'error', message: '❌ فشل تحميل البيانات' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        try {
            let res;
            if (activeTab === 'awards') res = await hrmsService.createAward(formData);
            else if (activeTab === 'warnings') res = await hrmsService.createWarning(formData);
            else if (activeTab === 'complaints') res = await hrmsService.createComplaint(formData);
            else if (activeTab === 'promotions') res = await hrmsService.processPromotion(formData);

            if (res && res.success) {
                setToast({ type: 'success', message: '✅ تم حفظ السجل بنجاح' });
                setShowModal(false);
                fetchData();
            }
        } catch (error) {
            setToast({ type: 'error', message: '❌ فشلت العملية البرمجية' });
        }
    };

    const stats = useMemo(() => ({
        total: data.length,
        distinctEmps: new Set(data.map(d => d.employeeId)).size,
        latest: data[0]?.date || data[0]?.promotionDate || '---'
    }), [data]);

    return (
        <div style={{ padding: '0 24px 24px' }}>
            {/* Header */}
            <HzPageHeader
                title="إجراءات الموظفين"
                subtitle="إدارة المكافآت، التنبيهات، والترقيات الوظيفية"
                icon={<ShieldAlert size={24} />}
                actions={
                    <>
                        <HzBtn variant="secondary" onClick={() => window.print()} icon={<Printer size={16} />}>طباعة التقرير</HzBtn>
                        <HzBtn variant="primary" onClick={() => setShowModal(true)} icon={<Plus size={16} />}>
                            تسجيل {activeTab === 'awards' ? 'مكافأة' : activeTab === 'warnings' ? 'إنذار' : activeTab === 'complaints' ? 'شكوى' : 'ترقية'}
                        </HzBtn>
                    </>
                }
            />

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                <HzBtn variant={activeTab === 'awards' ? 'primary' : 'ghost'} onClick={() => setActiveTab('awards')} icon={<Award size={16} />}>المكافآت والجوائز</HzBtn>
                <HzBtn variant={activeTab === 'warnings' ? 'danger' : 'ghost'} onClick={() => setActiveTab('warnings')} icon={<AlertTriangle size={16} />}>التنبيهات والإنذارات</HzBtn>
                <HzBtn variant={activeTab === 'complaints' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('complaints')} icon={<MessageSquare size={16} />}>الشكاوى الإدارية</HzBtn>
                <HzBtn variant={activeTab === 'promotions' ? 'neon' : 'ghost'} onClick={() => setActiveTab('promotions')} icon={<TrendingUp size={16} />}>الترقيات</HzBtn>
            </div>

            {/* Stats */}
            <HzStatsGrid>
                <HzStat icon={<Star size={20} />} value={stats.total} label="إجمالي السجلات" color={activeTab === 'awards' ? 'gold' : 'dim'} />
                <HzStat icon={<Users size={20} />} value={stats.distinctEmps} label="موظف معني" color="cyan" />
                <HzStat icon={<CheckCircle2 size={20} />} value={activeTab.toUpperCase()} label="القسم الحالي" color="plasma" />
            </HzStatsGrid>

            {/* Main Content */}
            <main className="hz-main-content">
                {loading ? <HzLoader /> : (
                    <div className="hz-table-wrap">
                        <table className="hz-table">
                            <thead>
                                <tr>
                                    <th>الموظف</th>
                                    <th>{activeTab === 'awards' ? 'نوع الجائزة' : activeTab === 'warnings' ? 'الموضوع' : activeTab === 'complaints' ? 'الموضوع' : 'المسمى الجديد'}</th>
                                    <th>التاريخ</th>
                                    <th className="hide-mobile">التفاصيل</th>
                                    <th className="text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map(item => (
                                    <tr key={item.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--hz-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: 'var(--hz-cyan)' }}>
                                                    {item.employee?.user?.firstName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '800' }}>{item.employee?.user?.firstName} {item.employee?.user?.lastName}</div>
                                                    <div className="hz-text-muted" style={{ fontSize: '0.7rem' }}>{item.employee?.employeeCode}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{activeTab === 'awards' ? item.awardType : item.subject || item.designation}</td>
                                        <td><HzBadge color="dim">{new Date(item.date || item.promotionDate).toLocaleDateString('ar-SA')}</HzBadge></td>
                                        <td className="hide-mobile">
                                            <div className="hz-text-muted" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {activeTab === 'awards' ? (item.gift || item.awardType) :
                                                    activeTab === 'complaints' ? (item.complainer?.user?.firstName ? `${item.complainer.user.firstName} ${item.complainer.user.lastName}` : 'إدارة') :
                                                        (item.description || '---')}
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <HzBtn variant="ghost" size="icon"><FileText size={14} /></HzBtn>
                                        </td>
                                    </tr>
                                ))}
                                {data.length === 0 && <tr><td colSpan={5}><HzEmpty title="لا توجد سجلات" /></td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Modal */}
            <HzModal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={`تسجيل ${activeTab === 'awards' ? 'مكافأة' : activeTab === 'warnings' ? 'إنذار' : activeTab === 'complaints' ? 'شكوى' : 'ترقية'}`}
                footer={
                    <>
                        <HzBtn variant="secondary" onClick={() => setShowModal(false)}>إلغاء</HzBtn>
                        <HzBtn variant="primary" onClick={() => handleSubmit()} style={{ marginRight: 'auto' }}>حفظ الإجراء الرسمي</HzBtn>
                    </>
                }
            >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                        <HzSelect
                            label="اختيار الموظف"
                            value={formData.employeeId}
                            onChange={v => setFormData({ ...formData, employeeId: v })}
                            options={[{ value: '', label: 'اختر موظفاً...' }, ...employees.map(e => ({ value: e.id, label: `${e.user.firstName} ${e.user.lastName} (${e.employeeCode})` }))]}
                        />
                    </div>

                    {activeTab === 'awards' && (
                        <>
                            <HzInput label="نوع المكافأة" value={formData.awardType} onChange={v => setFormData({ ...formData, awardType: v })} required />
                            <HzInput label="الهدية / القيمة" value={formData.gift} onChange={v => setFormData({ ...formData, gift: v })} />
                        </>
                    )}

                    {activeTab === 'warnings' && (
                        <>
                            <HzInput label="سبب الإنذار" value={formData.subject} onChange={v => setFormData({ ...formData, subject: v })} required />
                            <HzInput label="بواسطة" value={formData.warningBy} onChange={v => setFormData({ ...formData, warningBy: v })} />
                        </>
                    )}

                    {activeTab === 'complaints' && (
                        <>
                            <HzInput label="موضوع الشكوى" value={formData.subject} onChange={v => setFormData({ ...formData, subject: v })} required />
                            <div className="hz-form-group">
                                <label className="hz-label">الطرف الشاكي</label>
                                <HzSelect
                                    value={formData.complaintAgainst}
                                    onChange={v => setFormData({ ...formData, complaintAgainst: v })}
                                    options={[{ value: '', label: 'الإدارة' }, ...employees.map(e => ({ value: e.id, label: `${e.user.firstName} ${e.user.lastName}` }))]}
                                />
                            </div>
                        </>
                    )}

                    {activeTab === 'promotions' && (
                        <div style={{ gridColumn: 'span 2' }}>
                            <HzInput label="المسمى الوظيفي الجديد" value={formData.designation} onChange={v => setFormData({ ...formData, designation: v })} required />
                        </div>
                    )}

                    <div style={{ gridColumn: 'span 2' }}>
                        <HzInput label="تاريخ الإجراء" type="date" value={formData.date} onChange={v => setFormData({ ...formData, date: v, promotionDate: v })} />
                    </div>

                    <div style={{ gridColumn: 'span 2' }} className="hz-form-group">
                        <label className="hz-label">الوصف / ملاحظات إضافية</label>
                        <textarea
                            className="hz-input"
                            style={{ height: '80px', padding: '12px' }}
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
