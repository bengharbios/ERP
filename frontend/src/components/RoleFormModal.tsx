import React from 'react';
import { Permission } from '../services/users.service';

interface RoleFormModalProps {
    show: boolean;
    formData: any;
    groupedPermissions: Record<string, Permission[]>;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    onChange: (field: string, value: any) => void;
    onTogglePermission: (permissionId: string) => void;
    isEditing?: boolean;
}

export const RoleFormModal: React.FC<RoleFormModalProps> = ({
    show,
    formData,
    groupedPermissions,
    onClose,
    onSubmit,
    onChange,
    onTogglePermission,
    isEditing,
}) => {
    if (!show) return null;

    return (
        <div className="premium-modal-overlay" onClick={onClose} dir="rtl">
            <div className="premium-modal-content fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px' }}>
                <div style={{ padding: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#1A202C', margin: 0 }}>
                                {isEditing ? '✨ تعديل بيانات الدور' : '✨ إنشاء دور جديد'}
                            </h2>
                            <p style={{ color: '#718096', margin: '6px 0 0 0', fontSize: '0.95rem' }}>
                                {isEditing ? 'تحديث مسمى الدور ووصفه وصلاحياته' : 'قم بتعريف مسمى وظيفي جديد وتخصيص صلاحياته العملياتية'}
                            </p>
                        </div>
                        <button className="btn-close-2026" onClick={onClose}>✕</button>
                    </div>

                    <form onSubmit={onSubmit} className="modern-form-2026">
                        <div className="form-grid-2026">
                            <div className="form-group">
                                <label>اسم الدور (Role Name)</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => onChange('name', e.target.value)}
                                    placeholder="مثال: مدير أكاديمي"
                                    required
                                    disabled={formData.isSystemRole}
                                />
                                {formData.isSystemRole && <p style={{ fontSize: '0.75rem', color: '#E53E3E', marginTop: '4px' }}>أدوار النظام الأساسية لا يمكن تغيير اسمها</p>}
                            </div>

                            <div className="form-group">
                                <label>وصف الدور</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => onChange('description', e.target.value)}
                                    placeholder="وصف مختصر لمسؤوليات هذا الدور"
                                />
                            </div>

                            <div className="form-group full-width">
                                <label style={{ marginBottom: '1.5rem', display: 'block' }}>مصفوفة الصلاحيات (Permission Matrix)</label>

                                <div className="permissions-matrix-container">
                                    {Object.entries(groupedPermissions).map(([resource, permissions]) => (
                                        <div key={resource} className="matrix-row">
                                            <div className="resource-label">{resource}</div>
                                            <div className="permissions-pills">
                                                {permissions.map(perm => {
                                                    const isChecked = formData.permissionIds?.includes(perm.id);
                                                    return (
                                                        <label key={perm.id} className={`perm-selection-pill ${isChecked ? 'active' : ''} ${perm.action.toLowerCase()}`}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => onTogglePermission(perm.id)}
                                                                style={{ display: 'none' }}
                                                            />
                                                            <span className="pill-dot"></span>
                                                            <span className="pill-action">{perm.action}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="form-actions-2026" style={{ marginTop: '3rem', borderTop: '1px solid #EDF2F7', paddingTop: '2rem', display: 'flex', gap: '1rem' }}>
                            <button type="button" className="btn-secondary-large" onClick={onClose}>إلغاء</button>
                            <button type="submit" className="btn-primary-large orange">
                                {isEditing ? 'حفظ التغييرات' : 'إنشاء الدور'}
                            </button>
                        </div>
                    </form>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .permissions-matrix-container {
                        display: flex; flex-direction: column; gap: 1rem;
                        max-height: 400px; overflow-y: auto; padding: 1rem;
                        background: #F8FAFC; border-radius: 20px; border: 1.5px solid #EDF2F7;
                    }
                    .matrix-row {
                        display: flex; align-items: center; gap: 1.5rem; padding: 0.8rem;
                        background: white; border-radius: 12px; border: 1px solid #E2E8F0;
                    }
                    .resource-label {
                        width: 120px; font-weight: 900; color: #2D3748; font-size: 0.85rem;
                        text-transform: uppercase; letter-spacing: 0.5px;
                    }
                    .permissions-pills { display: flex; flex-wrap: wrap; gap: 0.6rem; flex: 1; }
                    
                    .perm-selection-pill {
                        display: flex; align-items: center; gap: 0.5rem; padding: 6px 12px;
                        background: #F7FAFC; border-radius: 10px; cursor: pointer;
                        font-size: 0.75rem; font-weight: 800; color: #718096;
                        transition: all 0.2s; border: 1px solid #E2E8F0;
                        user-select: none;
                    }
                    .perm-selection-pill:hover { border-color: #DD6B20; color: #1A202C; }
                    .perm-selection-pill.active { background: #FFF9F5; border-color: #DD6B20; color: #DD6B20; }
                    
                    .perm-selection-pill.read.active { background: #E6FFFA; border-color: #38B2AC; color: #2C7A7B; }
                    .perm-selection-pill.create.active { background: #F0FFF4; border-color: #48BB78; color: #2F855A; }
                    .perm-selection-pill.update.active { background: #FFFBE6; border-color: #ECC94B; color: #B7791F; }
                    .perm-selection-pill.delete.active { background: #FFF5F5; border-color: #F56565; color: #C53030; }

                    .pill-dot { width: 8px; height: 8px; border-radius: 50%; background: #E2E8F0; transition: all 0.2s; }
                    .perm-selection-pill.active .pill-dot { background: currentColor; box-shadow: 0 0 8px currentColor; }
                `}} />
            </div>
        </div>
    );
};
