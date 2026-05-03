import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { hrService, Employee, Department } from '../services/hr.service';
import { hrmsService } from '../services/hrms.service';
import userService from '../services/users.service';
import { Toast, ToastType } from '../components/Toast';
import EmployeeFormModal from '../components/EmployeeFormModal';
import './Employees.css';

export default function Employees() {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [shifts, setShifts] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    // Search and Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Toast states
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

    const initialFormState = {
        userId: '',
        departmentId: '',
        employeeCode: '',
        jobTitleAr: '',
        jobTitleEn: '',
        hiringDate: '',
        joiningDate: '',
        salary: 0,
        housingAllowance: 0,
        transportAllowance: 0,
        otherAllowances: 0,
        totalDeductions: 0,
        contractType: 'full_time',
        salaryType: 'FIXED',
        targetType: 'TRANSACTIONS',
        targetValue: 0,
        commissionRate: 0,
        isCommissionPercentage: false,
        hourlyRate: 0,
        hourlyUnit: 1,
        nationality: '',
        gender: 'male',
        dateOfBirth: '',
        maritalStatus: 'single',
        passportNumber: '',
        passportExpiry: '',
        nationalId: '',
        idExpiry: '',
        visaNumber: '',
        visaExpiry: '',
        laborCardNumber: '',
        laborCardExpiry: '',
        bankName: '',
        iban: '',
        swiftCode: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelation: '',
        commissionTiers: [],
        documents: [],
        assets: [],
        performances: [],
        trainings: [],
        commissionLogic: 'POSITIVE',
        minimumSalaryFloor: 0,
        status: 'active',
        statusChangeDate: '',
        lastWorkingDate: ''
    };

    const [employeeFormData, setEmployeeFormData] = useState<any>(initialFormState);
    const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let filtered = [...employees];
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(e =>
                e.employeeCode.toLowerCase().includes(lowerSearch) ||
                (e.user?.firstName || '').toLowerCase().includes(lowerSearch) ||
                (e.user?.lastName || '').toLowerCase().includes(lowerSearch) ||
                (e.jobTitleAr || '').toLowerCase().includes(lowerSearch)
            );
        }
        if (filterDept) {
            filtered = filtered.filter(e => e.departmentId === filterDept);
        }
        if (filterStatus !== 'all') {
            filtered = filtered.filter(e => e.status === filterStatus);
        }
        setFilteredEmployees(filtered);
    }, [searchTerm, filterDept, filterStatus, employees]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [empRes, deptRes, userRes, shiftRes] = await Promise.all([
                hrService.getEmployees(),
                hrService.getDepartments(),
                userService.getUsers(),
                hrmsService.getShifts()
            ]);

            if (empRes?.success && Array.isArray(empRes.data)) {
                setEmployees(empRes.data);
            }
            if (deptRes?.success && Array.isArray(deptRes.data)) {
                setDepartments(deptRes.data);
            }
            if (shiftRes?.success && Array.isArray(shiftRes.data)) {
                setShifts(shiftRes.data);
            }
            if (userRes?.success) {
                const usersList = userRes.data?.users || userRes.data || [];
                // Only show users who are NOT yet employees when creating
                setUsers(Array.isArray(usersList) ? usersList : []);
            }
        } catch (error: any) {
            console.error('Error loading employees:', error);
            setToast({ type: 'error', message: '❌ فشل في تحميل البيانات' });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (employee: any) => {
        setEditingEmployeeId(employee.id);
        const formatD = (d: any) => d ? new Date(d).toISOString().split('T')[0] : '';
        setEmployeeFormData({
            ...employee,
            hiringDate: formatD(employee.hiringDate),
            joiningDate: formatD(employee.joiningDate),
            dateOfBirth: formatD(employee.dateOfBirth),
            passportExpiry: formatD(employee.passportExpiry),
            idExpiry: formatD(employee.idExpiry),
            visaExpiry: formatD(employee.visaExpiry),
            laborCardExpiry: formatD(employee.laborCardExpiry),
            statusChangeDate: formatD(employee.statusChangeDate),
            lastWorkingDate: formatD(employee.lastWorkingDate),
            documents: employee.documents?.map((d: any) => ({ ...d, expiryDate: formatD(d.expiryDate) })) || [],
            assets: employee.assets?.map((a: any) => ({ ...a, assignmentDate: formatD(a.assignmentDate) })) || [],
            performances: employee.performances?.map((p: any) => ({ ...p, reviewDate: formatD(p.reviewDate) })) || [],
            trainings: employee.trainings?.map((t: any) => ({ ...t, completionDate: formatD(t.completionDate) })) || [],
        });
        setShowEmployeeModal(true);
    };

    const handleEmployeeSubmit = async (data: any) => {
        try {
            setLoading(true);
            const res = editingEmployeeId
                ? await hrService.updateEmployee(editingEmployeeId, data)
                : await hrService.createEmployee(data);

            if (res.success) {
                setToast({ type: 'success', message: editingEmployeeId ? '✅ تم تحديث بيانات الموظف' : '✅ تم إضافة الموظف بنجاح' });
                setShowEmployeeModal(false);
                fetchData();
            }
        } catch (error: any) {
            setToast({ type: 'error', message: `❌ ${error.response?.data?.error?.message || 'فشل في الحفظ'}` });
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        total: employees.length,
        active: employees.filter(e => e.status === 'active').length,
        onLeave: employees.filter(e => e.status === 'on_leave').length,
        departments: departments.length
    };

    return (
        <div className="next-gen-page-container">
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            <header className="glass-header">
                <div className="container-wide header-content">
                    <div className="header-branding">
                        <div className="branding-icon orange">👥</div>
                        <div className="branding-text">
                            <h1>الموارد البشرية</h1>
                            <p className="hide-on-mobile">Human Resources Management</p>
                        </div>
                    </div>

                    <div className="header-actions">
                        <div className="view-switcher hide-on-mobile">
                            <button onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'active' : ''}>▦</button>
                            <button onClick={() => setViewMode('table')} className={viewMode === 'table' ? 'active' : ''}>☰</button>
                        </div>
                        <button onClick={() => navigate('/departments')} className="btn-modern btn-outline hide-on-mobile">
                            إدارة الأقسام
                        </button>
                        <button onClick={() => {
                            setEditingEmployeeId(null);
                            setEmployeeFormData(initialFormState);
                            setShowEmployeeModal(true);
                        }} className="btn-modern btn-orange-gradient">
                            <span className="plus-icon">+</span>
                            <span className="hide-on-mobile">إضافة موظف</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="container-wide main-content">
                <section className="stats-grid">
                    <div className="stat-card-mini">
                        <div className="stat-info">
                            <span className="stat-label">إجمالي الموظفين</span>
                            <span className="stat-value">{stats.total}</span>
                        </div>
                        <div className="stat-icon-bg blue">👤</div>
                    </div>
                    <div className="stat-card-mini">
                        <div className="stat-info">
                            <span className="stat-label">على رأس العمل</span>
                            <span className="stat-value">{stats.active}</span>
                        </div>
                        <div className="stat-icon-bg green">✅</div>
                    </div>
                    <div className="stat-card-mini">
                        <div className="stat-info">
                            <span className="stat-label">في إجازة</span>
                            <span className="stat-value">{stats.onLeave}</span>
                        </div>
                        <div className="stat-icon-bg orange">🏖️</div>
                    </div>
                    <div className="stat-card-mini">
                        <div className="stat-info">
                            <span className="stat-label">الأقسام</span>
                            <span className="stat-value">{stats.departments}</span>
                        </div>
                        <div className="stat-icon-bg purple">🏢</div>
                    </div>
                </section>

                <section className="filters-toolbar">
                    <div className="search-box-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="البحث بالاسم، الكود، أو المسمى..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filters-group">
                        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="filter-select">
                            <option value="">كافة الأقسام</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
                        </select>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
                            <option value="all">الحالة: الكل</option>
                            <option value="active">نشط</option>
                            <option value="on_leave">في إجازة</option>
                        </select>
                    </div>
                </section>

                <div className="content-transition-wrapper">
                    {loading && employees.length === 0 ? (
                        <div className="loading-state-modern">
                            <div className="spinner"></div>
                            <p>جاري تحميل سجلات الموظفين...</p>
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="empty-state-modern">
                            <div className="empty-icon">📂</div>
                            <h2>لا توجد نتائج</h2>
                            <p>لم يتم العثور على موظفين يطابقون معايير البحث.</p>
                            <button onClick={() => { setSearchTerm(''); setFilterDept(''); setFilterStatus('all'); }} className="btn-link">إعادة ضبط المرشحات</button>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="programs-grid-2026">
                            {filteredEmployees.map(emp => (
                                <div key={emp.id} className="next-gen-card">
                                    <div className="card-top">
                                        <div className="emp-avatar-container">
                                            {emp.user?.profilePicture ? (
                                                <img src={emp.user.profilePicture} alt="" className="emp-img" />
                                            ) : (
                                                <div className="avatar-placeholder">{emp.user?.firstName?.[0] || 'E'}</div>
                                            )}
                                            <span className={`status-badge-mini ${emp.status}`}></span>
                                        </div>
                                        <div className="card-actions-mini">
                                            <button onClick={() => handleEdit(emp)} title="تعديل">✎</button>
                                        </div>
                                    </div>

                                    <div className="card-info">
                                        <h3 className="card-title">{emp.user?.firstName} {emp.user?.lastName}</h3>
                                        <p className="card-subtitle">{emp.jobTitleAr || 'موظف'}</p>

                                        <div className="card-tags">
                                            <span className="tag-pill">🏢 {emp.department?.nameAr || 'غير محدد'}</span>
                                            <span className="tag-pill code">🆔 {emp.employeeCode}</span>
                                        </div>
                                    </div>

                                    <div className="card-stats-grid">
                                        <div className="stat-item">
                                            <span className="stat-val">{Number(emp.salary).toLocaleString()}</span>
                                            <span className="stat-lbl">الراتب</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-val">{emp.contractType === 'full_time' ? 'كامل' : 'جزئي'}</span>
                                            <span className="stat-lbl">العقد</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-val status-color">
                                                {emp.status === 'active' ? 'نشط' :
                                                    emp.status === 'resigned' ? 'مستقيل' :
                                                        emp.status === 'terminated' ? 'مفصول' :
                                                            emp.status === 'deceased' ? 'متوفى' :
                                                                emp.status === 'suspended' ? 'موقوف' : 'غير نشط'}
                                            </span>
                                            <span className="stat-lbl">الحالة</span>
                                        </div>
                                    </div>

                                    <div className="card-footer">
                                        <button className="btn-full-profile" onClick={() => navigate(`/employees/${emp.id}`)}>📂 عرض الملف الشامل</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="next-gen-table-container">
                            <table className="modern-data-table">
                                <thead>
                                    <tr>
                                        <th>الموظف</th>
                                        <th>القسم</th>
                                        <th>المسمى الوظيفي</th>
                                        <th className="text-center">كود الموظف</th>
                                        <th className="text-center">الحالة</th>
                                        <th className="text-center">الراتب</th>
                                        <th className="text-center">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEmployees.map(emp => (
                                        <tr key={emp.id}>
                                            <td>
                                                <div className="table-user-info">
                                                    <div className="user-avatar-small">
                                                        {emp.user?.profilePicture ? <img src={emp.user.profilePicture} alt="" /> : (emp.user?.firstName?.[0] || 'E')}
                                                    </div>
                                                    <div>
                                                        <div className="table-primary-text">{emp.user?.firstName} {emp.user?.lastName}</div>
                                                        <div className="table-secondary-text">{emp.user?.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{emp.department?.nameAr || '-'}</td>
                                            <td>{emp.jobTitleAr || '-'}</td>
                                            <td className="text-center">
                                                <span className="code-pill">{emp.employeeCode}</span>
                                            </td>
                                            <td className="text-center">
                                                <span className={`status-pill ${emp.status}`}>
                                                    {emp.status === 'active' ? 'نشط' :
                                                        emp.status === 'resigned' ? 'مستقيل' :
                                                            emp.status === 'terminated' ? 'مفصول' :
                                                                emp.status === 'deceased' ? 'متوفى' :
                                                                    emp.status === 'suspended' ? 'موقوف' : 'غير نشط'}
                                                </span>
                                            </td>
                                            <td className="text-center font-bold">
                                                {Number(emp.salary).toLocaleString()} SAR
                                            </td>
                                            <td className="text-center">
                                                <div className="table-row-actions">
                                                    <button onClick={() => navigate(`/employees/${emp.id}`)} className="edit-btn-icon" title="عرض الملف">📂</button>
                                                    <button onClick={() => handleEdit(emp)} className="edit-btn-icon" title="تعديل">✎</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {showEmployeeModal && (
                <EmployeeFormModal
                    show={showEmployeeModal}
                    onClose={() => setShowEmployeeModal(false)}
                    onSubmit={handleEmployeeSubmit}
                    initialData={employeeFormData}
                    isEditing={!!editingEmployeeId}
                    loading={loading}
                    departments={departments}
                    shifts={shifts}
                    users={users}
                />
            )}
        </div>
    );
}
