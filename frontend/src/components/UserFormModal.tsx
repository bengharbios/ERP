import React from 'react';
import { Role } from '../services/users.service';

interface UserFormModalProps {
    show: boolean;
    formData: any;
    roles: Role[];
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    onChange: (field: string, value: any) => void;
    isEditing?: boolean;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
    show,
    formData,
    roles,
    onClose,
    onSubmit,
    onChange,
    isEditing,
}) => {
    if (!show) return null;

    return (
        <div className="premium-modal-overlay" onClick={onClose} dir="rtl">
            <div className="premium-modal-content fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
                <div style={{ padding: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#1A202C', margin: 0 }}>
                                {isEditing ? '✨ تعديل بيانات المستخدم' : '✨ إضافة مستخدم جديد'}
                            </h2>
                            <p style={{ color: '#718096', margin: '6px 0 0 0', fontSize: '0.95rem' }}>
                                {isEditing ? 'تحديث المعلومات الشخصية والصلاحيات' : 'قم بإنشاء حساب جديد وتعيين الصلاحيات المناسبة'}
                            </p>
                        </div>
                        <button className="btn-close-2026" onClick={onClose}>✕</button>
                    </div>

                    <form onSubmit={onSubmit} className="modern-form-2026">
                        <div className="form-grid-2026">
                            <div className="form-group">
                                <label>اسم المستخدم</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => onChange('username', e.target.value)}
                                    placeholder="Username"
                                    required
                                    disabled={isEditing}
                                />
                            </div>

                            <div className="form-group">
                                <label>البريد الإلكتروني</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => onChange('email', e.target.value)}
                                    placeholder="example@mail.com"
                                    required
                                />
                            </div>

                            {!isEditing && (
                                <div className="form-group full-width">
                                    <label>كلمة المرور</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => onChange('password', e.target.value)}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label>الاسم الأول</label>
                                <input
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => onChange('firstName', e.target.value)}
                                    placeholder="First Name"
                                />
                            </div>

                            <div className="form-group">
                                <label>اسم العائلة</label>
                                <input
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => onChange('lastName', e.target.value)}
                                    placeholder="Last Name"
                                />
                            </div>

                            <div className="form-group">
                                <label>رقم الهاتف</label>
                                <input
                                    type="text"
                                    value={formData.phone || ''}
                                    onChange={(e) => onChange('phone', e.target.value)}
                                    placeholder="+971 50 123 4567"
                                />
                            </div>

                            <div className="form-group">
                                <label>حالة الحساب</label>
                                <select
                                    value={formData.isActive !== undefined ? (formData.isActive ? 'true' : 'false') : 'true'}
                                    onChange={(e) => onChange('isActive', e.target.value === 'true')}
                                >
                                    <option value="true">نشط (Active) ✅</option>
                                    <option value="false">غير نشط (Inactive) ❌</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>معرف حساب التليجرام (Telegram User ID)</label>
                                <input
                                    type="text"
                                    value={formData.telegramUserId || ''}
                                    onChange={(e) => onChange('telegramUserId', e.target.value)}
                                    placeholder="مثال: 12345678"
                                />
                            </div>

                            <div className="form-group">
                                <label>اسم مستخدم التليجرام (Telegram @Username)</label>
                                <input
                                    type="text"
                                    value={formData.telegramUsername || ''}
                                    onChange={(e) => onChange('telegramUsername', e.target.value)}
                                    placeholder="مثال: mohamed_saleh"
                                />
                            </div>

                            <div className="form-group full-width">
                                <label>تعيين دور أساسي (اختياري)</label>
                                <div className="role-assignment-box">
                                    <select
                                        value={formData.roleId || ''}
                                        onChange={(e) => onChange('roleId', e.target.value)}
                                    >
                                        <option value="">اختر دوراً...</option>
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>

                                    {formData.roleId && (
                                        <div className="scope-selection fade-in" style={{ marginTop: '1rem', padding: '1rem', background: '#F7FAFC', borderRadius: '12px' }}>
                                            <label style={{ fontSize: '0.8rem', color: '#4A5568' }}>نطاق الصلاحية (Scope)</label>
                                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                                <select
                                                    style={{ flex: 1 }}
                                                    value={formData.scopeType || 'global'}
                                                    onChange={(e) => onChange('scopeType', e.target.value)}
                                                >
                                                    <option value="global">عام (Global)</option>
                                                    <option value="branch">فرع (Branch)</option>
                                                    <option value="program">برنامج (Program)</option>
                                                    <option value="class">فصل (Class)</option>
                                                </select>
                                                {formData.scopeType && formData.scopeType !== 'global' && (
                                                    <input
                                                        style={{ flex: 2 }}
                                                        type="text"
                                                        placeholder="معرف النطاق (ID)..."
                                                        value={formData.scopeId || ''}
                                                        onChange={(e) => onChange('scopeId', e.target.value)}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="form-actions-2026" style={{ marginTop: '3rem', borderTop: '1px solid #EDF2F7', paddingTop: '2rem', display: 'flex', gap: '1rem' }}>
                            <button type="button" className="btn-secondary-large" onClick={onClose}>إلغاء</button>
                            <button type="submit" className="btn-primary-large orange">
                                {isEditing ? 'تحديث البيانات' : 'إنشاء المستخدم'}
                            </button>
                        </div>
                    </form>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .premium-modal-overlay {
                        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                        background: rgba(26, 32, 44, 0.85); backdrop-filter: blur(8px);
                        display: flex; align-items: center; justify-content: center; z-index: 2000;
                    }
                    .premium-modal-content {
                        background: white; border-radius: 32px; width: 90%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                    }
                    .fade-in { animation: fadeIn 0.4s ease-out; }
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

                    .btn-close-2026 {
                        width: 44px; height: 44px; border-radius: 12px; border: none; background: #F7FAFC;
                        color: #718096; font-size: 1.2rem; cursor: pointer; transition: all 0.2s;
                    }
                    .btn-close-2026:hover { background: #EDF2F7; color: #1A202C; transform: rotate(90deg); }

                    .form-grid-2026 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                    .form-group.full-width { grid-column: span 2; }
                    .form-group label { display: block; font-size: 0.9rem; font-weight: 800; color: #4A5568; margin-bottom: 0.8rem; }
                    .form-group input, .form-group select {
                        width: 100%; padding: 1rem 1.2rem; border-radius: 14px; border: 1.5px solid #E2E8F0;
                        font-size: 1rem; color: #2D3748; transition: all 0.2s; background: #FFF; outline: none;
                    }
                    .form-group input:focus, .form-group select:focus { border-color: #DD6B20; box-shadow: 0 0 0 4px rgba(221, 107, 32, 0.1); }
                    .form-group input:disabled { background: #F7FAFC; color: #A0AEC0; cursor: not-allowed; }

                    .btn-primary-large {
                        flex: 2; padding: 1.2rem; border-radius: 16px; font-weight: 900; font-size: 1.1rem;
                        border: none; cursor: pointer; transition: all 0.3s;
                    }
                    .btn-primary-large.orange {
                        background: linear-gradient(135deg, #DD6B20 0%, #ED8936 100%); color: white;
                        box-shadow: 0 10px 20px rgba(221, 107, 32, 0.2);
                    }
                    .btn-primary-large:hover { transform: translateY(-3px); filter: brightness(1.1); }
                    
                    .btn-secondary-large {
                        flex: 1; padding: 1.2rem; border-radius: 16px; font-weight: 800; font-size: 1.1rem;
                        border: 1.5px solid #E2E8F0; background: white; color: #4A5568; cursor: pointer; transition: all 0.2s;
                    }
                    .btn-secondary-large:hover { background: #F7FAFC; }
                `}} />
            </div>
        </div>
    );
};
