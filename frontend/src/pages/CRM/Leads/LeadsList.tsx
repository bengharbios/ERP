import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leadApi } from '../../../services/crm.service';
import { Plus, Search, Filter, AlertTriangle, Eye, Trash2 } from 'lucide-react';
import LeadForm from './LeadForm';

interface Lead {
    id: string;
    name: string;
    contactName?: string;
    phone?: string;
    mobile?: string;
    emailFrom?: string;
    expectedRevenue?: number;
    isDuplicate: boolean;
    duplicateCount: number;
    activityPulse: string;
    stage?: { name: string };
    salesperson?: { username: string };
}

const LeadsList: React.FC = () => {
    const navigate = useNavigate();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [filterDuplicates, setFilterDuplicates] = useState(false);

    useEffect(() => {
        fetchLeads();
    }, [filterDuplicates]);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const filters: any = { type: 'lead' };
            if (filterDuplicates) filters.isDuplicate = true;

            const response = await leadApi.getAll(filters);
            setLeads(response.data);
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLeads = leads.filter(lead =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone?.includes(searchTerm) ||
        lead.mobile?.includes(searchTerm) ||
        lead.emailFrom?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا العميل المحتمل؟')) {
            try {
                await leadApi.delete(id);
                fetchLeads();
            } catch (error) {
                console.error('Error deleting lead:', error);
            }
        }
    };

    if (loading) {
        return (
            <div className="crm-loading">
                <div className="crm-spinner"></div>
            </div>
        );
    }

    return (
        <div className="crm-leads-list">
            <div className="crm-header">
                <h1>👥 العملاء المحتملون</h1>
                <div className="crm-header-actions">
                    <button
                        className="crm-btn crm-btn-primary"
                        onClick={() => setShowForm(true)}
                    >
                        <Plus size={18} />
                        <span>عميل محتمل جديد</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="crm-card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                        <Search
                            size={18}
                            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
                        />
                        <input
                            type="text"
                            className="crm-form-input"
                            placeholder="بحث في العملاء المحتملين..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '2.5rem' }}
                        />
                    </div>

                    <button
                        className={`crm-btn ${filterDuplicates ? 'crm-btn-primary' : 'crm-btn-secondary'}`}
                        onClick={() => setFilterDuplicates(!filterDuplicates)}
                    >
                        <Filter size={18} />
                        <span>{filterDuplicates ? 'عرض الكل' : 'المكررات فقط'}</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="crm-card">
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f97316' }}>{leads.length}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>إجمالي العملاء</div>
                </div>
                <div className="crm-card">
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ef4444' }}>
                        {leads.filter(l => l.isDuplicate).length}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>مكررات محتملة</div>
                </div>
                <div className="crm-card">
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
                        {leads.filter(l => l.activityPulse !== 'none').length}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>لديهم أنشطة</div>
                </div>
            </div>

            {/* Leads List */}
            <div className="crm-list">
                <div className="crm-list-header" style={{ gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr 120px' }}>
                    <div>الاسم</div>
                    <div>جهة الاتصال</div>
                    <div>الهاتف</div>
                    <div>المسؤول</div>
                    <div>الحالة</div>
                    <div>إجراءات</div>
                </div>

                {filteredLeads.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                        {searchTerm ? 'لا توجد نتائج' : 'لا يوجد عملاء محتملون بعد'}
                    </div>
                ) : (
                    filteredLeads.map(lead => (
                        <div
                            key={lead.id}
                            className={`crm-list-item ${lead.isDuplicate ? 'duplicate-row' : ''}`}
                            style={{
                                gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr 120px',
                                background: lead.isDuplicate ? '#fef3c7' : undefined
                            }}
                        >
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {lead.isDuplicate && <AlertTriangle size={16} color="#f59e0b" />}
                                    <strong style={{ cursor: 'pointer' }} onClick={() => navigate(`/crm/leads/${lead.id}`)}>
                                        {lead.name}
                                    </strong>
                                </div>
                                {lead.isDuplicate && (
                                    <span style={{ fontSize: '0.75rem', color: '#92400e' }}>
                                        {lead.duplicateCount} مكرر محتمل
                                    </span>
                                )}
                            </div>

                            <div>{lead.contactName || '-'}</div>

                            <div>
                                {lead.phone || lead.mobile || '-'}
                                {lead.emailFrom && (
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{lead.emailFrom}</div>
                                )}
                            </div>

                            <div>{lead.salesperson?.username || 'غير مُعيّن'}</div>

                            <div>
                                {lead.activityPulse !== 'none' && (
                                    <span className={`activity-pulse ${lead.activityPulse}`}></span>
                                )}
                                <span style={{ marginRight: '0.5rem', fontSize: '0.875rem' }}>
                                    {lead.stage?.name || 'جديد'}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => navigate(`/crm/leads/${lead.id}`)}
                                    style={{ padding: '0.25rem 0.5rem', background: '#dbeafe', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    title="عرض"
                                >
                                    <Eye size={16} color="#2563eb" />
                                </button>
                                <button
                                    onClick={() => handleDelete(lead.id)}
                                    style={{ padding: '0.25rem 0.5rem', background: '#fee2e2', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    title="حذف"
                                >
                                    <Trash2 size={16} color="#ef4444" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Lead Form Modal */}
            {showForm && (
                <LeadForm
                    onClose={() => setShowForm(false)}
                    onSuccess={() => {
                        setShowForm(false);
                        fetchLeads();
                    }}
                />
            )}
        </div>
    );
};

export default LeadsList;
