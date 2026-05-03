import React, { useState, useEffect } from 'react';
import { leadApi, stageApi } from '../../../services/crm.service';
import { X } from 'lucide-react';

interface LeadFormProps {
    leadId?: string;
    onClose: () => void;
    onSuccess: () => void;
}

const LeadForm: React.FC<LeadFormProps> = ({ leadId, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        contactName: '',
        emailFrom: '',
        phone: '',
        mobile: '',
        expectedRevenue: '',
        probability: '10',
        stageId: '',
        teamId: '',
        type: 'lead'
    });
    const [stages, setStages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [duplicates, setDuplicates] = useState<any[]>([]);
    const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

    useEffect(() => {
        fetchStages();
        if (leadId) {
            fetchLead();
        }
    }, [leadId]);

    const fetchStages = async () => {
        try {
            const response = await stageApi.getAll();
            setStages(response.data);
            if (response.data.length > 0 && !formData.stageId) {
                setFormData(prev => ({ ...prev, stageId: response.data[0].id }));
            }
        } catch (error) {
            console.error('Error fetching stages:', error);
        }
    };

    const fetchLead = async () => {
        if (!leadId) return;
        try {
            const response = await leadApi.getById(leadId);
            const lead = response.data;
            setFormData({
                name: lead.name || '',
                contactName: lead.contactName || '',
                emailFrom: lead.emailFrom || '',
                phone: lead.phone || '',
                mobile: lead.mobile || '',
                expectedRevenue: lead.expectedRevenue?.toString() || '',
                probability: lead.probability?.toString() || '10',
                stageId: lead.stageId || '',
                teamId: lead.teamId || '',
                type: lead.type || 'lead'
            });

            if (lead.duplicates && lead.duplicates.length > 0) {
                setDuplicates(lead.duplicates);
                setShowDuplicateWarning(true);
            }
        } catch (error) {
            console.error('Error fetching lead:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);

            const data = {
                ...formData,
                expectedRevenue: formData.expectedRevenue ? parseFloat(formData.expectedRevenue) : undefined,
                probability: parseFloat(formData.probability)
            };

            if (leadId) {
                await leadApi.update(leadId, data);
            } else {
                const response = await leadApi.create(data);

                // Check for duplicates after creation
                if (response.data.duplicates && response.data.duplicates.length > 0) {
                    setDuplicates(response.data.duplicates);
                    setShowDuplicateWarning(true);
                    return; // Don't close yet, show warning first
                }
            }

            onSuccess();
        } catch (error: any) {
            console.error('Error saving lead:', error);
            alert(error.response?.data?.error || 'حدث خطأ أثناء الحفظ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="crm-modal-overlay" onClick={onClose}>
            <div className="crm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                <div className="crm-modal-header">
                    <h2>{leadId ? 'تعديل عميل محتمل' : 'عميل محتمل جديد'}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="crm-modal-body">
                        {/* Duplicate Warning */}
                        {showDuplicateWarning && duplicates.length > 0 && (
                            <div className="duplicate-warning">
                                <div className="duplicate-warning-icon">⚠️</div>
                                <div className="duplicate-warning-content">
                                    <h4>تنبيه: تم اكتشاف {duplicates.length} عميل محتمل مكرر!</h4>
                                    <p>يوجد عملاء محتملون آخرون بنفس رقم الهاتف</p>
                                    <ul style={{ margin: '0.5rem 0 0 0', paddingRight: '1.5rem' }}>
                                        {duplicates.map((dup: any) => (
                                            <li key={dup.id} style={{ fontSize: '0.875rem' }}>
                                                {dup.name} - {dup.phone || dup.mobile}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Basic Info */}
                        <div className="crm-form-group">
                            <label className="crm-form-label">العنوان / اسم الفرصة *</label>
                            <input
                                type="text"
                                className="crm-form-input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="مثال: استفسار عن خدمات التسويق"
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="crm-form-group">
                                <label className="crm-form-label">اسم جهة الاتصال</label>
                                <input
                                    type="text"
                                    className="crm-form-input"
                                    value={formData.contactName}
                                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                    placeholder="محمد أحمد"
                                />
                            </div>

                            <div className="crm-form-group">
                                <label className="crm-form-label">البريد الإلكتروني</label>
                                <input
                                    type="email"
                                    className="crm-form-input"
                                    value={formData.emailFrom}
                                    onChange={(e) => setFormData({ ...formData, emailFrom: e.target.value })}
                                    placeholder="info@example.com"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="crm-form-group">
                                <label className="crm-form-label">الهاتف</label>
                                <input
                                    type="text"
                                    className="crm-form-input"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="04-1234567"
                                />
                            </div>

                            <div className="crm-form-group">
                                <label className="crm-form-label">الجوال</label>
                                <input
                                    type="text"
                                    className="crm-form-input"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                    placeholder="050-1234567"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="crm-form-group">
                                <label className="crm-form-label">الإيرادات المتوقعة (AED)</label>
                                <input
                                    type="number"
                                    className="crm-form-input"
                                    value={formData.expectedRevenue}
                                    onChange={(e) => setFormData({ ...formData, expectedRevenue: e.target.value })}
                                    placeholder="50000"
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="crm-form-group">
                                <label className="crm-form-label">المرحلة</label>
                                <select
                                    className="crm-form-select"
                                    value={formData.stageId}
                                    onChange={(e) => setFormData({ ...formData, stageId: e.target.value })}
                                >
                                    <option value="">اختر المرحلة</option>
                                    {stages.map(stage => (
                                        <option key={stage.id} value={stage.id}>
                                            {stage.name} ({stage.probability}%)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="crm-modal-footer">
                        <button type="button" className="crm-btn crm-btn-secondary" onClick={onClose}>
                            إلغاء
                        </button>
                        <button type="submit" className="crm-btn crm-btn-primary" disabled={loading}>
                            {loading ? 'جاري الحفظ...' : 'حفظ'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LeadForm;
