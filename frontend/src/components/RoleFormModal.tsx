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

const resourceTranslations: Record<string, string> = {
    users: 'الموظفين والمستخدمين 👥',
    roles: 'الأدوار والوظائف 🔑',
    permissions: 'الصلاحيات الأمنية 🛡️',
    academic: 'البرامج الأكاديمية 🎓',
    students: 'شؤون الطلاب والجيل 👨‍🎓',
    attendance: 'دفتر الحضور والغياب 📅',
    assignments: 'الواجبات والمهام 📝',
    settings: 'إعدادات النظام العامة ⚙️',
    accounts: 'دليل الحسابات والميزانية 💰',
    journal_entries: 'القيود اليومية 📊',
    receipts: 'سندات الصرف والقبض 💳',
    fees: 'الرسوم والاشتراكات 💵',
    crm: 'إدارة العملاء والمبيعات CRM 📈',
};

// Sort permissions to display in a fixed logical order: view, read, create, update, delete, manage
const actionOrder = ['view', 'read', 'create', 'update', 'delete', 'manage'];
const sortPermissions = (perms: Permission[]) => {
    return [...perms].sort((a, b) => {
        const idxA = actionOrder.indexOf(a.action.toLowerCase());
        const idxB = actionOrder.indexOf(b.action.toLowerCase());
        const valA = idxA === -1 ? 99 : idxA;
        const valB = idxB === -1 ? 99 : idxB;
        return valA - valB;
    });
};

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
            <div className="premium-modal-content rbac-glass-modal fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', width: '95%' }}>
                <div style={{ padding: '2.25rem' }}>
                    
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div>
                            <h2 style={{ 
                                fontSize: '1.65rem', 
                                fontWeight: '900', 
                                background: 'linear-gradient(135deg, #FFFFFF 0%, #A0AEC0 100%)', 
                                WebkitBackgroundClip: 'text', 
                                WebkitTextFillColor: 'transparent', 
                                margin: 0 
                            }}>
                                {isEditing ? '✨ تعديل بيانات الدور المالي والأكاديمي' : '✨ إنشاء دور وظيفي جديد'}
                            </h2>
                            <p style={{ color: '#A0AEC0', margin: '6px 0 0 0', fontSize: '0.88rem' }}>
                                {isEditing ? 'تحديث مسمى الدور الوظيفي والموارد والتحكم في صلاحيات العرض والإجراءات' : 'قم بتعريف مسمى وظيفي جديد وتخصيص صلاحياته العملياتية للمعهد'}
                            </p>
                        </div>
                        <button className="btn-close-2026-custom" onClick={onClose}>✕</button>
                    </div>

                    <form onSubmit={onSubmit} className="modern-form-2026">
                        
                        {/* Two Column Layout for Inputs */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>
                            <div className="form-group-custom">
                                <label className="custom-label">اسم الدور الوظيفي (Role Name)</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => onChange('name', e.target.value)}
                                    placeholder="مثال: مسؤول مبيعات وتسويق"
                                    required
                                    disabled={formData.isSystemRole}
                                    className="custom-input-dark"
                                />
                                {formData.isSystemRole && (
                                    <p style={{ fontSize: '0.72rem', color: '#FC8181', marginTop: '4px', fontWeight: 'bold' }}>
                                        ⚠️ هذا دور نظام أساسي ومحمي لا يمكن تعديل اسمه
                                    </p>
                                )}
                            </div>

                            <div className="form-group-custom">
                                <label className="custom-label">الوصف الوظيفي والمسؤوليات</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => onChange('description', e.target.value)}
                                    placeholder="مثال: إدارة المبيعات وتلقي تقارير التليجرام والتواصل"
                                    className="custom-input-dark"
                                />
                            </div>
                        </div>

                        {/* Permission Matrix */}
                        <div className="form-group-custom" style={{ display: 'flex', flexDirection: 'column' }}>
                            <label className="custom-label" style={{ marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                🛡️ مصفوفة توزيع صلاحيات العرض والعمليات (Permission Matrix)
                            </label>

                            <div className="permissions-matrix-container-custom">
                                {Object.entries(groupedPermissions).map(([resource, permissions]) => {
                                    const translatedName = resourceTranslations[resource] || resource;
                                    const sortedPerms = sortPermissions(permissions);

                                    return (
                                        <div key={resource} className="matrix-row-custom">
                                            <div className="resource-label-custom">
                                                <span className="resource-icon-bullet"></span>
                                                {translatedName}
                                            </div>
                                            <div className="permissions-pills-custom">
                                                {sortedPerms.map(perm => {
                                                    const isChecked = formData.permissionIds?.includes(perm.id);
                                                    return (
                                                        <label key={perm.id} className={`perm-selection-pill-custom ${isChecked ? 'active' : ''} ${perm.action.toLowerCase()}`}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => onTogglePermission(perm.id)}
                                                                style={{ display: 'none' }}
                                                            />
                                                            <span className="pill-dot-custom"></span>
                                                            <span className="pill-action-custom">
                                                                {perm.action.toUpperCase()}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Actions Footer */}
                        <div style={{ 
                            marginTop: '2.5rem', 
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)', 
                            paddingTop: '1.5rem', 
                            display: 'flex', 
                            justifyContent: 'flex-end', 
                            gap: '1rem' 
                        }}>
                            <button type="button" className="btn-cancel-custom" onClick={onClose}>إلغاء</button>
                            <button type="submit" className="btn-submit-custom">
                                {isEditing ? 'حفظ الصلاحيات والأدوار ✨' : 'إنشاء الدور الجديد 🚀'}
                            </button>
                        </div>
                    </form>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    /* Premium Dark Glassmorphic Theme Variables & Classes */
                    .rbac-glass-modal {
                        background: #111622 !important;
                        border: 1px solid rgba(255, 255, 255, 0.08) !important;
                        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5) !important;
                        border-radius: 24px !important;
                        color: #E2E8F0 !important;
                    }
                    
                    .btn-close-2026-custom {
                        background: rgba(255, 255, 255, 0.03);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        color: #A0AEC0;
                        width: 36px;
                        height: 36px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        font-size: 0.9rem;
                        transition: all 0.2s ease;
                    }
                    .btn-close-2026-custom:hover {
                        background: rgba(239, 68, 68, 0.15);
                        border-color: rgba(239, 68, 68, 0.3);
                        color: #EF4444;
                        transform: rotate(90deg);
                    }

                    .custom-label {
                        font-size: 0.88rem;
                        font-weight: 800;
                        color: #CBD5E0;
                        margin-bottom: 0.5rem;
                        display: block;
                    }

                    .custom-input-dark {
                        background: rgba(255, 255, 255, 0.02) !important;
                        border: 1px solid rgba(255, 255, 255, 0.08) !important;
                        color: #FFFFFF !important;
                        border-radius: 12px !important;
                        padding: 12px 16px !important;
                        font-size: 0.9rem !important;
                        width: 100% !important;
                        outline: none !important;
                        transition: all 0.3s ease !important;
                    }
                    .custom-input-dark:focus {
                        border-color: #DD6B20 !important;
                        background: rgba(255, 255, 255, 0.04) !important;
                        box-shadow: 0 0 12px rgba(221, 107, 32, 0.15) !important;
                    }

                    /* Permissions matrix box */
                    .permissions-matrix-container-custom {
                        display: flex;
                        flex-direction: column;
                        gap: 0.85rem;
                        max-height: 380px;
                        overflow-y: auto;
                        padding: 1.25rem;
                        background: rgba(10, 14, 23, 0.6) !important;
                        border-radius: 18px !important;
                        border: 1px solid rgba(255, 255, 255, 0.05) !important;
                    }
                    
                    /* Custom Scrollbar for Matrix */
                    .permissions-matrix-container-custom::-webkit-scrollbar {
                        width: 6px;
                    }
                    .permissions-matrix-container-custom::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .permissions-matrix-container-custom::-webkit-scrollbar-thumb {
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 10px;
                    }

                    .matrix-row-custom {
                        display: flex;
                        align-items: center;
                        gap: 1.5rem;
                        padding: 0.75rem 1.25rem;
                        background: rgba(255, 255, 255, 0.02);
                        border-radius: 12px;
                        border: 1px solid rgba(255, 255, 255, 0.03);
                        transition: all 0.25s ease;
                    }
                    .matrix-row-custom:hover {
                        background: rgba(255, 255, 255, 0.04);
                        border-color: rgba(221, 107, 32, 0.15);
                    }

                    .resource-label-custom {
                        width: 210px;
                        font-weight: 800;
                        color: #E2E8F0;
                        font-size: 0.85rem;
                        display: flex;
                        align-items: center;
                        gap: 0.65rem;
                    }
                    
                    .resource-icon-bullet {
                        width: 6px;
                        height: 6px;
                        border-radius: 50%;
                        background: #DD6B20;
                        box-shadow: 0 0 6px #DD6B20;
                    }

                    .permissions-pills-custom {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 0.5rem;
                        flex: 1;
                    }

                    .perm-selection-pill-custom {
                        display: flex;
                        align-items: center;
                        gap: 0.4rem;
                        padding: 5px 11px;
                        background: rgba(255, 255, 255, 0.01);
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 0.7rem;
                        font-weight: 800;
                        color: #718096;
                        transition: all 0.2s;
                        border: 1px solid rgba(255, 255, 255, 0.05);
                        user-select: none;
                    }
                    .perm-selection-pill-custom:hover {
                        border-color: rgba(255, 255, 255, 0.2);
                        color: #CBD5E0;
                        background: rgba(255, 255, 255, 0.03);
                    }

                    /* Action Specific Colors when active */
                    .perm-selection-pill-custom.active {
                        box-shadow: 0 0 10px rgba(255, 255, 255, 0.05);
                    }

                    /* 1. VIEW ACTION (Purple) - Represents Section/Page Visibility */
                    .perm-selection-pill-custom.view.active {
                        background: rgba(159, 122, 234, 0.12) !important;
                        border-color: #9F7AEA !important;
                        color: #D6BCFA !important;
                    }

                    /* 2. READ ACTION (Teal) */
                    .perm-selection-pill-custom.read.active {
                        background: rgba(56, 178, 172, 0.12) !important;
                        border-color: #38B2AC !important;
                        color: #81E6D9 !important;
                    }

                    /* 3. CREATE ACTION (Green) */
                    .perm-selection-pill-custom.create.active {
                        background: rgba(72, 187, 120, 0.12) !important;
                        border-color: #48BB78 !important;
                        color: #9AE6B4 !important;
                    }

                    /* 4. UPDATE ACTION (Yellow/Orange) */
                    .perm-selection-pill-custom.update.active {
                        background: rgba(236, 201, 75, 0.1) !important;
                        border-color: #ECC94B !important;
                        color: #FEEBC8 !important;
                    }

                    /* 5. DELETE ACTION (Red) */
                    .perm-selection-pill-custom.delete.active {
                        background: rgba(245, 101, 101, 0.12) !important;
                        border-color: #F56565 !important;
                        color: #FEB2B2 !important;
                    }

                    /* 6. MANAGE ACTION (Blue) */
                    .perm-selection-pill-custom.manage.active {
                        background: rgba(66, 153, 225, 0.12) !important;
                        border-color: #4299E1 !important;
                        color: #90CDF4 !important;
                    }

                    .pill-dot-custom {
                        width: 6px;
                        height: 6px;
                        border-radius: 50%;
                        background: rgba(255, 255, 255, 0.15);
                        transition: all 0.2s;
                    }
                    .perm-selection-pill-custom.active .pill-dot-custom {
                        background: currentColor;
                        box-shadow: 0 0 6px currentColor;
                    }

                    /* Footer Buttons */
                    .btn-cancel-custom {
                        background: rgba(255, 255, 255, 0.03);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        color: #CBD5E0;
                        border-radius: 12px;
                        padding: 10px 22px;
                        font-weight: 700;
                        font-size: 0.9rem;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .btn-cancel-custom:hover {
                        background: rgba(255, 255, 255, 0.08);
                        color: white;
                    }

                    .btn-submit-custom {
                        background: linear-gradient(135deg, #DD6B20 0%, #C05621 100%);
                        border: none;
                        color: white;
                        border-radius: 12px;
                        padding: 10px 24px;
                        font-weight: 800;
                        font-size: 0.9rem;
                        cursor: pointer;
                        transition: all 0.2s;
                        box-shadow: 0 4px 15px rgba(221, 107, 32, 0.25);
                    }
                    .btn-submit-custom:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 6px 20px rgba(221, 107, 32, 0.35);
                    }
                `}} />
            </div>
        </div>
    );
};
