import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { hrService, Employee } from '../services/hr.service';
import { Toast, ToastType } from '../components/Toast';
import './Employees.css';

const EmployeeProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

    useEffect(() => {
        if (id) fetchEmployeeData(id);
    }, [id]);

    const fetchEmployeeData = async (empId: string) => {
        try {
            setLoading(true);
            const res = await hrService.getEmployeeById(empId);
            if (res.success) {
                setEmployee(res.data);
            }
        } catch (error: any) {
            console.error('Error fetching employee:', error);
            setToast({ type: 'error', message: '❌ فشل تحميل بيانات الموظف' });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-state-modern">
                <div className="spinner"></div>
                <p>جاري تحميل ملف الموظف...</p>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="empty-state-modern">
                <h2>الموظف غير موجود</h2>
                <button onClick={() => navigate('/employees')} className="btn-modern btn-primary">عودة للقائمة</button>
            </div>
        );
    }

    // Helper to format dates
    const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString('ar-SA') : '-';

    // Tabs Configuration
    const tabs = [
        { id: 'overview', label: 'نظرة عامة', icon: '📊' },
        { id: 'personal', label: 'البيانات الشخصية', icon: '👤' },
        { id: 'employment', label: 'التعاقد والوظيفة', icon: '💼' },
        { id: 'financial', label: 'المالية', icon: '💰' },
        { id: 'documents', label: 'المستندات', icon: '📎' },
        { id: 'assets', label: 'عهدة الأصول', icon: '💻' },
    ];

    return (
        <div className="next-gen-page-container">
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            {/* Header / Profile Card */}
            <div className="glass-header profile-header" style={{ height: 'auto', padding: '2rem', flexDirection: 'column', alignItems: 'flex-start', gap: '1.5rem' }}>
                <div className="profile-top-row" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div className="profile-identity" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div className="profile-avatar-large" style={{ width: '80px', height: '80px', borderRadius: '20px', background: '#EDF2F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                            {employee.user?.profilePicture ? <img src={employee.user.profilePicture} alt="" /> : (employee.user?.firstName?.[0] || 'U')}
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.8rem' }}>{employee.user?.firstName} {employee.user?.lastName}</h1>
                            <p style={{ margin: '0.5rem 0 0', color: '#718096', fontSize: '1.1rem' }}>{employee.jobTitleAr} • {employee.department?.nameAr}</p>
                            <div className="tags-row" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
                                <span className={`status-pill ${employee.status}`} style={{ fontSize: '0.9rem' }}>
                                    {employee.status === 'active' ? 'نشط' : employee.status === 'on_leave' ? 'في إجازة' : 'منتهي'}
                                </span>
                                <span className="code-pill">#{employee.employeeCode}</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-actions" style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={() => navigate('/employees')} className="btn-modern btn-outline">عودة للقائمة</button>
                        <button className="btn-modern btn-orange-gradient">تعديل البيانات ✎</button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="profile-tabs" style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid #E2E8F0', width: '100%', paddingBottom: '0.5rem' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            style={{
                                background: 'none', border: 'none', padding: '0.8rem 0',
                                borderBottom: activeTab === tab.id ? '3px solid #FF8C42' : '3px solid transparent',
                                color: activeTab === tab.id ? '#FF8C42' : '#718096',
                                fontWeight: activeTab === tab.id ? '800' : '600',
                                cursor: 'pointer', fontSize: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center'
                            }}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <main className="container-wide main-content" style={{ marginTop: '2rem' }}>

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="overview-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                        <div className="next-gen-card">
                            <h3 className="card-title">معلومات الاتصال</h3>
                            <div className="info-list" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <div className="info-item"><strong>📧 البريد:</strong> {employee.user?.email}</div>
                                <div className="info-item"><strong>📱 الهاتف:</strong> {employee.user?.phone || '-'}</div>
                                <div className="info-item"><strong>🕒 تاريخ التعاقد:</strong> {formatDate(employee.hiringDate)}</div>
                            </div>
                        </div>

                        <div className="next-gen-card">
                            <h3 className="card-title">إحصائيات الإجازات</h3>
                            <div style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {/* Mock Chart */}
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#38A169' }}>21</div>
                                    <div style={{ color: '#718096' }}>رصيد الإجازات (يوم)</div>
                                </div>
                            </div>
                        </div>

                        <div className="next-gen-card">
                            <h3 className="card-title">تنبيهات المستندات</h3>
                            {employee.documents?.some(d => d.expiryDate && new Date(d.expiryDate) < new Date()) ? (
                                <div style={{ color: '#E53E3E', fontWeight: 'bold' }}>⚠️ يوجد مستندات منتهية الصلاحية</div>
                            ) : (
                                <div style={{ color: '#38A169', fontWeight: 'bold' }}>✅ جميع المستندات سارية</div>
                            )}
                        </div>
                    </div>
                )}

                {/* PERSONAL TAB */}
                {activeTab === 'personal' && (
                    <div className="next-gen-card">
                        <h3 className="card-title mb-4">البيانات الشخصية التفصيلية</h3>
                        <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <h4 style={{ color: '#2D3748', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>الهوية والجنسية</h4>
                                <p><strong>الجنسية:</strong> {employee.nationality || '-'}</p>
                                <p><strong>رقم الهوية:</strong> {employee.nationalId || '-'}</p>
                                <p><strong>تاريخ انتهاء الهوية:</strong> {formatDate(employee.idExpiry)}</p>
                                <p><strong>رقم الجواز:</strong> {employee.passportNumber || '-'}</p>
                                <p><strong>تاريخ انتهاء الجواز:</strong> {formatDate(employee.passportExpiry)}</p>
                            </div>
                            <div>
                                <h4 style={{ color: '#2D3748', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>بيانات أخرى</h4>
                                <p><strong>تاريخ الميلاد:</strong> {formatDate(employee.dateOfBirth)}</p>
                                <p><strong>الحالة الاجتماعية:</strong> {employee.maritalStatus === 'single' ? 'أعزب' : 'متزوج'}</p>
                                <p><strong>الجنس:</strong> {employee.gender === 'male' ? 'ذكر' : 'أنثى'}</p>
                            </div>
                        </div>

                        <h3 className="card-title mt-4 mb-4">جهة الاتصال للطوارئ</h3>
                        <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <p><strong>الاسم:</strong> {employee.emergencyContactName || '-'}</p>
                            <p><strong>الرقم:</strong> {employee.emergencyContactPhone || '-'}</p>
                            <p><strong>الصلة:</strong> {employee.emergencyContactRelation || '-'}</p>
                        </div>
                    </div>
                )}

                {/* EMPLOYMENT TAB */}
                {activeTab === 'employment' && (
                    <div className="next-gen-card">
                        <h3 className="card-title mb-4">تفاصيل الوظيفة</h3>
                        <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <p><strong>المسمى الوظيفي (عربي):</strong> {employee.jobTitleAr}</p>
                            <p><strong>المسمى الوظيفي (إنجليزي):</strong> {employee.jobTitleEn || '-'}</p>
                            <p><strong>القسم:</strong> {employee.department?.nameAr}</p>
                            <p><strong>نوع العقد:</strong> {employee.contractType === 'full_time' ? 'دوام كامل' : employee.contractType}</p>
                            <p><strong>تاريخ التعيين:</strong> {formatDate(employee.hiringDate)}</p>
                            <p><strong>تاريخ المباشرة:</strong> {formatDate(employee.joiningDate)}</p>
                            <p><strong>فترة التجربة:</strong> {employee.probationPeriod} يوم</p>
                            <p><strong>فترة الإشعار:</strong> {employee.noticePeriod} يوم</p>
                        </div>
                    </div>
                )}

                {/* FINANCIAL TAB */}
                {activeTab === 'financial' && (
                    <div className="next-gen-card">
                        <h3 className="card-title mb-4">البيانات المالية</h3>
                        <div className="financial-summary" style={{ background: '#F7FAFC', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ color: '#718096', fontSize: '0.9rem' }}>الراتب الأساسي</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#2D3748' }}>{Number(employee.salary).toLocaleString()} {employee.currency}</div>
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ color: '#718096', fontSize: '0.9rem' }}>نظام الراتب</div>
                                    <div className="status-pill active">{employee.salaryType}</div>
                                </div>
                            </div>
                        </div>

                        <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <h4 style={{ color: '#2D3748', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>البدلات</h4>
                                <p><strong>بدل سكن:</strong> {Number(employee.housingAllowance).toLocaleString()}</p>
                                <p><strong>بدل نقل:</strong> {Number(employee.transportAllowance).toLocaleString()}</p>
                                <p><strong>بدلات أخرى:</strong> {Number(employee.otherAllowances).toLocaleString()}</p>
                            </div>
                            <div>
                                <h4 style={{ color: '#2D3748', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>البيانات البنكية</h4>
                                <p><strong>اسم البنك:</strong> {employee.bankName || '-'}</p>
                                <p><strong>IBAN:</strong> {employee.iban || '-'}</p>
                                <p><strong>SWIFT:</strong> {employee.swiftCode || '-'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* DOCUMENT TAB */}
                {activeTab === 'documents' && (
                    <div className="documents-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        {employee.documents && employee.documents.length > 0 ? employee.documents.map(doc => (
                            <div key={doc.id} className="next-gen-card doc-card" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📄</div>
                                <h4 style={{ margin: '0.5rem 0' }}>{doc.title}</h4>
                                <p style={{ color: '#718096', fontSize: '0.9rem' }}>{doc.docType}</p>
                                {doc.expiryDate && (
                                    <p style={{
                                        color: new Date(doc.expiryDate) < new Date() ? '#E53E3E' : '#38A169',
                                        fontSize: '0.85rem', fontWeight: 'bold'
                                    }}>
                                        ينتهي: {formatDate(doc.expiryDate)}
                                    </p>
                                )}
                                <div style={{ marginTop: '1rem' }}>
                                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="btn-link">معاينة</a>
                                </div>
                            </div>
                        )) : (
                            <div className="empty-state-modern" style={{ gridColumn: '1 / -1' }}>
                                <p>لا توجد مستندات مرفقة</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ASSETS TAB */}
                {activeTab === 'assets' && (
                    <div className="next-gen-card">
                        <h3 className="card-title">سجل العهد والأصول</h3>
                        <div className="next-gen-table-container">
                            <table className="modern-data-table">
                                <thead>
                                    <tr>
                                        <th>الأصل</th>
                                        <th>الفئة</th>
                                        <th>الرقم التسلسلي</th>
                                        <th>تاريخ الاستلام</th>
                                        <th>الحالة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employee.assets && employee.assets.length > 0 ? employee.assets.map(asset => (
                                        <tr key={asset.id}>
                                            <td>{asset.assetName}</td>
                                            <td>{asset.category}</td>
                                            <td>{asset.serialNumber || '-'}</td>
                                            <td>{formatDate(asset.assignmentDate)}</td>
                                            <td>
                                                <span className={`status-pill ${asset.status === 'assigned' ? 'active' : 'inactive'}`}>
                                                    {asset.status === 'assigned' ? 'في العهدة' : asset.status}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={5} className="text-center">لا توجد أصول مسجلة</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

export default EmployeeProfile;
