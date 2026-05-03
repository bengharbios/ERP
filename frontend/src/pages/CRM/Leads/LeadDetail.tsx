import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { leadApi } from '../../../services/crm.service';
import { ArrowLeft, Phone, Mail, Calendar, CheckCircle, Users } from 'lucide-react';
import MergeWizard from '../Components/MergeWizard';

const LeadDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [lead, setLead] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showMergeWizard, setShowMergeWizard] = useState(false);

    useEffect(() => {
        if (id) fetchLead();
    }, [id]);

    const fetchLead = async () => {
        try {
            setLoading(true);
            const response = await leadApi.getById(id!);
            setLead(response.data);
        } catch (error) {
            console.error('Error fetching lead:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConvertToOpportunity = async () => {
        if (window.confirm('هل تريد تحويل هذا العميل المحتمل إلى فرصة؟')) {
            try {
                await leadApi.convertToOpportunity(id!);
                navigate('/crm/pipeline');
            } catch (error) {
                console.error('Error converting lead:', error);
            }
        }
    };

    if (loading) {
        return <div className="crm-loading"><div className="crm-spinner"></div></div>;
    }

    if (!lead) {
        return <div className="crm-card">العميل المحتمل غير موجود</div>;
    }

    return (
        <div className="crm-lead-detail">
            <div className="crm-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/crm/leads')} className="crm-btn crm-btn-secondary">
                        <ArrowLeft size={18} />
                    </button>
                    <h1>{lead.name}</h1>
                </div>
                <div className="crm-header-actions">
                    <button className="crm-btn crm-btn-primary" onClick={handleConvertToOpportunity}>
                        تحويل لفرصة
                    </button>
                </div>
            </div>

            {/* Duplicate Warning */}
            {lead.isDuplicate && lead.duplicates?.length > 0 && (
                <div className="duplicate-warning">
                    <div className="duplicate-warning-icon">⚠️</div>
                    <div className="duplicate-warning-content">
                        <h4>تحذير: يوجد {lead.duplicates.length} عميل محتمل مكرر!</h4>
                        <p>عملاء محتملون آخرون بنفس رقم الهاتف</p>
                    </div>
                    <button
                        className="crm-btn crm-btn-secondary"
                        onClick={() => setShowMergeWizard(true)}
                    >
                        دمج المكررات
                    </button>
                </div>
            )}

            {/* Main Info */}
            <div className="crm-grid">
                <div className="crm-card">
                    <h3 style={{ margin: '0 0 1rem 0' }}>معلومات الاتصال</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {lead.contactName && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Users size={16} color="#6b7280" />
                                <span>{lead.contactName}</span>
                            </div>
                        )}
                        {lead.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Phone size={16} color="#6b7280" />
                                <span>{lead.phone}</span>
                            </div>
                        )}
                        {lead.mobile && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Phone size={16} color="#6b7280" />
                                <span>{lead.mobile}</span>
                            </div>
                        )}
                        {lead.emailFrom && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Mail size={16} color="#6b7280" />
                                <span>{lead.emailFrom}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="crm-card">
                    <h3 style={{ margin: '0 0 1rem 0' }}>معلومات المبيعات</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>المسؤول:</span>
                            <div style={{ fontWeight: '600' }}>{lead.salesperson?.username || 'غير مُعيّن'}</div>
                        </div>
                        <div>
                            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>المرحلة:</span>
                            <div style={{ fontWeight: '600' }}>{lead.stage?.name || 'جديد'}</div>
                        </div>
                        {lead.expectedRevenue && (
                            <div>
                                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>القيمة المتوقعة:</span>
                                <div style={{ fontWeight: '600', color: '#10b981' }}>
                                    {Number(lead.expectedRevenue).toLocaleString()} AED
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Activities */}
            <div className="crm-card">
                <h3 style={{ margin: '0 0 1rem 0' }}>الأنشطة ({lead.activities?.length || 0})</h3>
                {lead.activities && lead.activities.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {lead.activities.map((activity: any) => (
                            <div
                                key={activity.id}
                                style={{
                                    padding: '0.75rem',
                                    background: '#f9fafb',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Calendar size={16} color="#6b7280" />
                                    <div>
                                        <div style={{ fontWeight: '600' }}>{activity.summary}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                            {new Date(activity.dateDeadline).toLocaleDateString('ar-AE')}
                                        </div>
                                    </div>
                                </div>
                                {activity.status === 'DONE' && (
                                    <CheckCircle size={18} color="#10b981" />
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
                        لا توجد أنشطة بعد
                    </div>
                )}
            </div>

            {/* Notes */}
            <div className="crm-card">
                <h3 style={{ margin: '0 0 1rem 0' }}>الملاحظات ({lead.notes?.length || 0})</h3>
                {lead.notes && lead.notes.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {lead.notes.map((note: any) => (
                            <div
                                key={note.id}
                                style={{
                                    padding: '0.75rem',
                                    background: '#f9fafb',
                                    borderRadius: '8px',
                                    borderLeft: note.type === 'system_log' ? '3px solid #f59e0b' : '3px solid #3b82f6'
                                }}
                            >
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                                    {note.user?.username} - {new Date(note.createdAt).toLocaleDateString('ar-AE')}
                                </div>
                                <div style={{ whiteSpace: 'pre-wrap' }}>{note.content}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
                        لا توجد ملاحظات بعد
                    </div>
                )}
            </div>

            {/* Merge Wizard */}
            {showMergeWizard && lead.duplicates && (
                <MergeWizard
                    masterLead={lead}
                    duplicates={lead.duplicates}
                    onClose={() => setShowMergeWizard(false)}
                    onSuccess={() => {
                        setShowMergeWizard(false);
                        fetchLead();
                    }}
                />
            )}
        </div>
    );
};

export default LeadDetail;
