import React, { useState } from 'react';
import { leadApi } from '../../../services/crm.service';
import { X, ArrowRight } from 'lucide-react';

interface MergeWizardProps {
    masterLead: any;
    duplicates: any[];
    onClose: () => void;
    onSuccess: () => void;
}

const MergeWizard: React.FC<MergeWizardProps> = ({ masterLead, duplicates, onClose, onSuccess }) => {
    const [selectedMaster, setSelectedMaster] = useState(masterLead.id);
    const [mergeOptions, setMergeOptions] = useState({
        mergeNotes: true,
        mergeActivities: true,
        archiveDuplicates: true,
        useMaxRevenue: true
    });
    const [loading, setLoading] = useState(false);

    const allLeads = [masterLead, ...duplicates];

    const handleMerge = async () => {
        try {
            setLoading(true);

            const duplicateIds = allLeads
                .filter(l => l.id !== selectedMaster)
                .map(l => l.id);

            await leadApi.merge({
                masterLeadId: selectedMaster,
                duplicateLeadIds: duplicateIds,
                mergeOptions
            });

            onSuccess();
        } catch (error) {
            console.error('Error merging leads:', error);
            alert('حدث خطأ أثناء الدمج');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="crm-modal-overlay" onClick={onClose}>
            <div className="crm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
                <div className="crm-modal-header">
                    <h2>دمج العملاء المحتملين المكررين</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div className="crm-modal-body">
                    {/* Master Selection */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ margin: '0 0 0.75rem 0' }}>اختر السجل الرئيسي (سيتم الاحتفاظ به):</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {allLeads.map(lead => (
                                <label
                                    key={lead.id}
                                    style={{
                                        padding: '0.75rem',
                                        background: selectedMaster === lead.id ? '#fef3c7' : '#f9fafb',
                                        border: `2px solid ${selectedMaster === lead.id ? '#f97316' : '#e5e7eb'}`,
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem'
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="master"
                                        value={lead.id}
                                        checked={selectedMaster === lead.id}
                                        onChange={(e) => setSelectedMaster(e.target.value)}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600' }}>
                                            {lead.name} {lead.id === masterLead.id && <span style={{ color: '#f97316' }}>⭐</span>}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                            {lead.phone || lead.mobile} • {lead.emailFrom || 'لا يوجد بريد'}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                            تاريخ الإنشاء: {new Date(lead.createdAt).toLocaleDateString('ar-AE')}
                                        </div>
                                    </div>
                                    {lead.expectedRevenue && (
                                        <div style={{ fontWeight: '700', color: '#10b981' }}>
                                            {Number(lead.expectedRevenue).toLocaleString()} AED
                                        </div>
                                    )}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Comparison Table */}
                    <div style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
                        <h4 style={{ margin: '0 0 0.75rem 0' }}>مقارنة البيانات:</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb' }}>
                                    <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>
                                        الحقل
                                    </th>
                                    {allLeads.map(lead => (
                                        <th
                                            key={lead.id}
                                            style={{
                                                padding: '0.5rem',
                                                textAlign: 'center',
                                                borderBottom: '2px solid #e5e7eb',
                                                background: selectedMaster === lead.id ? '#fef3c7' : undefined
                                            }}
                                        >
                                            {lead.name.substring(0, 20)}...
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {['contactName', 'phone', 'mobile', 'emailFrom', 'expectedRevenue'].map(field => (
                                    <tr key={field}>
                                        <td style={{ padding: '0.5rem', fontWeight: '600', borderBottom: '1px solid #f3f4f6' }}>
                                            {field === 'contactName' && 'جهة الاتصال'}
                                            {field === 'phone' && 'الهاتف'}
                                            {field === 'mobile' && 'الجوال'}
                                            {field === 'emailFrom' && 'البريد'}
                                            {field === 'expectedRevenue' && 'القيمة المتوقعة'}
                                        </td>
                                        {allLeads.map(lead => (
                                            <td
                                                key={lead.id}
                                                style={{
                                                    padding: '0.5rem',
                                                    textAlign: 'center',
                                                    borderBottom: '1px solid #f3f4f6',
                                                    background: selectedMaster === lead.id ? '#fef3c7' : undefined
                                                }}
                                            >
                                                {field === 'expectedRevenue' && lead[field]
                                                    ? `${Number(lead[field]).toLocaleString()} AED`
                                                    : (lead[field] || '-')
                                                }
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Merge Options */}
                    <div>
                        <h4 style={{ margin: '0 0 0.75rem 0' }}>خيارات الدمج:</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={mergeOptions.mergeNotes}
                                    onChange={(e) => setMergeOptions({ ...mergeOptions, mergeNotes: e.target.checked })}
                                />
                                <span>دمج الملاحظات والوصف</span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={mergeOptions.mergeActivities}
                                    onChange={(e) => setMergeOptions({ ...mergeOptions, mergeActivities: e.target.checked })}
                                />
                                <span>دمج الأنشطة المخططة</span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={mergeOptions.useMaxRevenue}
                                    onChange={(e) => setMergeOptions({ ...mergeOptions, useMaxRevenue: e.target.checked })}
                                />
                                <span>استخدام أعلى قيمة متوقعة</span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={mergeOptions.archiveDuplicates}
                                    onChange={(e) => setMergeOptions({ ...mergeOptions, archiveDuplicates: e.target.checked })}
                                />
                                <span>أرشفة السجلات المدمجة (بدلاً من الحذف)</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="crm-modal-footer">
                    <button type="button" className="crm-btn crm-btn-secondary" onClick={onClose}>
                        إلغاء
                    </button>
                    <button
                        type="button"
                        className="crm-btn crm-btn-primary"
                        onClick={handleMerge}
                        disabled={loading}
                    >
                        {loading ? 'جاري الدمج...' : 'دمج الآن'}
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MergeWizard;
