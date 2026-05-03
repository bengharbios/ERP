// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    Users, UserCircle, Search, Plus, Filter,
    LayoutGrid, List, SlidersHorizontal, X,
    Briefcase, Building2, Clock, Calendar,
    CreditCard, MoreVertical, Edit, Trash2,
    Eye, Download, Printer, Phone, Mail,
    MapPin, ShieldCheck, ChevronDown
} from 'lucide-react';
import { hrService, Employee, Department } from '../services/hr.service';
import userService from '../services/users.service';
import { useSettingsStore } from '../store/settingsStore';
import EmployeeFormModal from '../components/EmployeeFormModal';
import './HREmployees.css';

/**
 * PREMIUM HR SECTOR (Rapidos 2026)
 * Design Alignment: AcademicStudents.tsx / FinancialReports.tsx
 */

export default function HREmployees() {
    const { settings } = useSettingsStore();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [shifts, setShifts] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // --- View & Filter States ---
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // --- Modals ---
    const [showModal, setShowModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [modalLoading, setModalLoading] = useState(false);

    const initialFormState = {
        userId: '', departmentId: '', employeeCode: '',
        jobTitleAr: '', jobTitleEn: '', hiringDate: '', joiningDate: '',
        salary: 0, housingAllowance: 0, transportAllowance: 0,
        otherAllowances: 0, totalDeductions: 0, contractType: 'full_time',
        salaryType: 'FIXED', targetType: 'TRANSACTIONS', targetValue: 0,
        commissionRate: 0, isCommissionPercentage: false,
        hourlyRate: 0, hourlyUnit: 1, nationality: '',
        gender: 'male', dateOfBirth: '', maritalStatus: 'single',
        passportNumber: '', passportExpiry: '', nationalId: '',
        idExpiry: '', visaNumber: '', visaExpiry: '',
        laborCardNumber: '', laborCardExpiry: '', bankName: '',
        iban: '', swiftCode: '', emergencyContactName: '',
        emergencyContactPhone: '', emergencyContactRelation: '',
        commissionTiers: [], documents: [], assets: [],
        performances: [], trainings: [], commissionLogic: 'POSITIVE',
        minimumSalaryFloor: 0, status: 'active', statusChangeDate: '',
        lastWorkingDate: ''
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [empRes, deptRes, userRes] = await Promise.all([
                hrService.getEmployees(),
                hrService.getDepartments(),
                userService.getUsers()
            ]);

            // Fix: Correctly access data structure based on backend response
            const empList = Array.isArray(empRes?.data) ? empRes.data : (empRes?.data?.employees || []);
            const deptList = Array.isArray(deptRes?.data) ? deptRes.data : (deptRes?.data?.departments || []);
            const userList = userRes?.data?.users || userRes?.data || [];

            setEmployees(empList);
            setDepartments(deptList);
            setUsers(Array.isArray(userList) ? userList : []);

            // Fetch shifts separately
            const { hrmsService } = await import('../services/hrms.service');
            const shiftRes = await hrmsService.getShifts();
            const shiftList = Array.isArray(shiftRes?.data) ? shiftRes.data : (shiftRes?.data?.shifts || []);
            setShifts(shiftList);

        } catch (error) {
            console.error('Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = useMemo(() => {
        return employees.filter(e => {
            const nameMatch = (e.user?.firstName + ' ' + e.user?.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());
            const deptMatch = !filterDept || e.departmentId === filterDept;
            const statusMatch = filterStatus === 'all' || e.status === filterStatus;
            return nameMatch && deptMatch && statusMatch;
        });
    }, [employees, searchTerm, filterDept, filterStatus]);

    const handleAdd = () => {
        setSelectedEmployee(null);
        setFormData(initialFormState);
        setShowModal(true);
    };

    const handleEdit = (emp: Employee) => {
        setSelectedEmployee(emp);
        setFormData({ ...initialFormState, ...emp });
        setShowModal(true);
    };

    const handleSubmit = async (data: any) => {
        setModalLoading(true);
        try {
            if (selectedEmployee) {
                await hrService.updateEmployee(selectedEmployee.id, data);
            } else {
                await hrService.createEmployee(data);
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Save Error:', error);
        } finally {
            setModalLoading(false);
        }
    };

    const SidebarContent = () => (
        <>
            <div className="ag-sidebar-head">
                <span className="ag-sidebar-head-title">تصفية الموظفين</span>
                <button className="mobile-only ag-btn-icon" onClick={() => setShowMobileFilters(false)}>
                    <X size={18} />
                </button>
            </div>
            <div className="ag-sidebar-pane">
                <div className="ag-filter-group">
                    <span className="ag-filter-label">البحث السريع</span>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--hz-text-muted)' }} />
                        <input
                            type="text"
                            className="ag-input"
                            placeholder="اسم الموظف أو الكود..."
                            style={{ paddingLeft: '34px' }}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="ag-filter-group">
                    <span className="ag-filter-label">القسم والوحدة</span>
                    <select className="ag-select" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                        <option value="">جميع الأقسام</option>
                        {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.nameAr}</option>
                        ))}
                    </select>
                </div>

                <div className="ag-filter-group">
                    <span className="ag-filter-label">حالة الموظف</span>
                    <select className="ag-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="all">الكل</option>
                        <option value="active">نشط</option>
                        <option value="resigned">مستقيل</option>
                        <option value="terminated">نهاية عقد</option>
                    </select>
                </div>

                <button className="ag-btn ag-btn-primary" style={{ marginTop: 'auto', width: '100%' }} onClick={handleAdd}>
                    <Plus size={16} /> إضافة موظف جديد
                </button>
            </div>
        </>
    );

    return (
        <div className="ag-root">
            {/* ── HEADER ── */}
            <div className="ag-header">
                <div className="ag-header-left">
                    <h1 className="ag-title">
                        <UserCircle size={20} /> ملفات الموظفين
                    </h1>
                    <div className="ag-mini-stats hide-mobile">
                        <div className="ag-stat-pill">
                            <span>النشطين</span>
                            <span className="ag-stat-val">{employees.filter(e => e.status === 'active').length}</span>
                        </div>
                        <div className="ag-stat-pill">
                            <span>الإجمالي</span>
                            <span className="ag-stat-val">{employees.length}</span>
                        </div>
                    </div>
                </div>
                <div className="ag-header-right">
                    <div className="ag-tabs" style={{ marginBottom: 0, padding: '4px' }}>
                        <button className={`ag-tab-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
                            <LayoutGrid size={16} />
                        </button>
                        <button className={`ag-tab-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>
                            <List size={16} />
                        </button>
                    </div>
                    <button className="ag-btn ag-btn-ghost hide-mobile">
                        <Download size={16} /> تصدير
                    </button>
                    <button className="ag-btn-icon mobile-only" onClick={() => setShowMobileFilters(true)}>
                        <SlidersHorizontal size={16} />
                    </button>
                </div>
            </div>

            <div className="ag-body">
                {/* Mobile Overlay */}
                <div className={`ag-sidebar-overlay ${showMobileFilters ? 'show' : ''}`} onClick={() => setShowMobileFilters(false)} />

                {/* Sidebar */}
                <aside className={`ag-sidebar ${showMobileFilters ? 'show' : ''}`}>
                    <SidebarContent />
                </aside>

                {/* Main Content */}
                <main className="ag-main">
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                            <div className="loading-spinner"></div>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="ag-grid">
                            {filteredEmployees.map(emp => (
                                <div key={emp.id} className="ag-card">
                                    <div className="ag-card-head">
                                        <div className="ag-avatar">
                                            {emp.user?.firstName?.charAt(0) || 'E'}
                                        </div>
                                        <span className={`ag-status ${emp.status}`}>
                                            {emp.status === 'active' ? 'نشط' : 'غير نشط'}
                                        </span>
                                    </div>
                                    <div className="ag-info">
                                        <div className="ag-name">{emp.user?.firstName} {emp.user?.lastName}</div>
                                        <div className="ag-job">{emp.jobTitleAr}</div>
                                    </div>
                                    <div className="ag-details">
                                        <div className="ag-detail-item">
                                            <span className="ag-detail-label">القسم</span>
                                            <span className="ag-detail-val">{emp.department?.nameAr || '---'}</span>
                                        </div>
                                        <div className="ag-detail-item">
                                            <span className="ag-detail-label">الكود</span>
                                            <span className="ag-detail-val">{emp.employeeCode}</span>
                                        </div>
                                        <div className="ag-detail-item">
                                            <span className="ag-detail-label">تاريخ التعيين</span>
                                            <span className="ag-detail-val">{emp.hiringDate || '---'}</span>
                                        </div>
                                        <div className="ag-detail-item">
                                            <span className="ag-detail-label">الراتب</span>
                                            <span className="ag-detail-val">{emp.salary?.toLocaleString()} AED</span>
                                        </div>
                                    </div>
                                    <div className="ag-card-foot">
                                        <button className="ag-btn ag-btn-primary" style={{ flex: 1 }} onClick={() => handleEdit(emp)}>
                                            <Edit size={14} /> تعديل الملف
                                        </button>
                                        <button className="ag-btn-icon">
                                            <Eye size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="ag-table-wrap">
                            <table className="ag-table">
                                <thead>
                                    <tr>
                                        <th>الموظف</th>
                                        <th>القسم</th>
                                        <th>المسمى الوظيفي</th>
                                        <th>الكود</th>
                                        <th>الحالة</th>
                                        <th>إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEmployees.map(emp => (
                                        <tr key={emp.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--hz-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: 'var(--hz-plasma)' }}>
                                                        {emp.user?.firstName?.charAt(0)}
                                                    </div>
                                                    <span style={{ fontWeight: '700', color: 'var(--hz-text-bright)' }}>{emp.user?.firstName} {emp.user?.lastName}</span>
                                                </div>
                                            </td>
                                            <td>{emp.department?.nameAr}</td>
                                            <td>{emp.jobTitleAr}</td>
                                            <td><code style={{ background: 'var(--hz-surface-2)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>{emp.employeeCode}</code></td>
                                            <td>
                                                <span className={`ag-status ${emp.status}`} style={{ fontSize: '0.6rem' }}>
                                                    {emp.status === 'active' ? 'نشط' : 'غير نشط'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="ag-btn-icon" onClick={() => handleEdit(emp)}><Edit size={14} /></button>
                                                    <button className="ag-btn-icon"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>
            </div>

            {/* --- MODAL (THABAT AL-FORM) --- */}
            {showModal && (
                <EmployeeFormModal
                    show={showModal}
                    onClose={() => setShowModal(false)}
                    onSubmit={handleSubmit}
                    initialData={formData}
                    isEditing={!!selectedEmployee}
                    loading={modalLoading}
                    departments={departments}
                    shifts={shifts}
                    users={users}
                />
            )}
        </div>
    );
}

const LoadingSpinner = () => (
    <div className="loading-spinner">
        <style>{`
            .loading-spinner {
                width: 40px; height: 40px; border: 3px solid var(--hz-border-soft);
                border-top-color: var(--hz-plasma); border-radius: 50%;
                animation: spin 0.8s linear infinite;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
    </div>
);
