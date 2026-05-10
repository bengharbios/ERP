import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import HorizonDashboard from './pages/HorizonDashboard';
import Programs from './pages/Programs';
import AcademicPrograms from './pages/AcademicPrograms';
import AcademicStudents from './pages/AcademicStudents';
import Units from './pages/Units';
import Classes from './pages/Classes';
import Students from './pages/Students';
import StudentFees from './pages/StudentFees';
import FinanceFees from './pages/FinanceFees';
import FinanceReceipts from './pages/FinanceReceipts';
import FinanceExpenses from './pages/FinanceExpenses';
import FinanceInvoices from './pages/FinanceInvoices';
import FinanceChartOfAccounts from './pages/FinanceChartOfAccounts';
import FinanceJournalEntries from './pages/FinanceJournalEntries';
import FinanceReports from './pages/FinanceReports';
import Schedule from './pages/Schedule';
import Attendance from './pages/Attendance';
import Assignments from './pages/Assignments';
import Reports from './pages/Reports';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Roles from './pages/Roles';
import Permissions from './pages/Permissions';
import Marketing from './pages/Marketing';
import WhatsAppTracker from './pages/WhatsAppTracker';
import Employees from './pages/Employees';
import HREmployees from './pages/HREmployees';
import EmployeeProfile from './pages/EmployeeProfile';
import Departments from './pages/Departments';
import HRDepartments from './pages/HRDepartments';
import StaffAttendance from './pages/StaffAttendance';
import HRStaffAttendance from './pages/HRStaffAttendance';
import AttendanceReports from './pages/AttendanceReports';
import HRSettings from './pages/HRSettings';
import HRSettings2026 from './pages/HRSettings2026';
import Payroll from './pages/Payroll';
import HRPayroll from './pages/HRPayroll';
import LeaveRequests from './pages/LeaveRequests';
import HRLeaveRequests from './pages/HRLeaveRequests';
import HRDashboard from './pages/HRDashboard';
import Recruitment from './pages/Recruitment';
import HRRecruitment from './pages/HRRecruitment';
import EmployeeActions from './pages/EmployeeActions';
import HREmployeeActions from './pages/HREmployeeActions';
import Communication from './pages/Communication';
import Shifts from './pages/Shifts';
import HRShifts from './pages/HRShifts';
import CRMDashboard2026 from './pages/CRMDashboard2026';
import CRMLeads2026 from './pages/CRMLeads2026';
import CRMPipeline2026 from './pages/CRMPipeline2026';
import CRMActivities2026 from './pages/CRMActivities2026';
import CRMTeams2026 from './pages/CRMTeams2026';
import CRMStages2026 from './pages/CRMStages2026';
import CRMCustomers2026 from './pages/CRMCustomers2026';
import CRM from './pages/CRM';
import Achievement from './pages/Achievement';
import AcademicAssessorAI from './pages/AcademicAssessorAI';
import ReportBuilder from './pages/ReportBuilder';
import ReceiptVouchers from './pages/finance/ReceiptVouchers';
import FinancialReports from './pages/finance/FinancialReports';
import ChartOfAccounts from './pages/ChartOfAccounts';
import JournalEntries from './pages/JournalEntries';
import FinancialSettings from './pages/finance/FinancialSettings';
import Invoices from './pages/finance/Invoices';
import BiometricDevices from './pages/BiometricDevices';
import AccountingGuide from './pages/AccountingGuide';
import { useSettingsStore } from './store/settingsStore';

import ProtectedRoute from './components/ProtectedRoute';

import LayoutProvider from './layouts/LayoutProvider';

// Switches Dashboard based on active template — auto, zero-config
function DashboardSwitcher() {
    const cachedTemplate = useSettingsStore((s) => s.cachedTemplate);
    if (cachedTemplate === 'rapidos_2026') return <HorizonDashboard />;
    return <Dashboard />;
}

// Programs page — Rapidos 2026 gets the new Horizon design
function ProgramsSwitcher() {
    const cachedTemplate = useSettingsStore((s) => s.cachedTemplate);
    if (cachedTemplate === 'rapidos_2026') return <AcademicPrograms />;
    return <Programs />;
}

// Students page — Rapidos 2026 gets the new Horizon design
function StudentsSwitcher() {
    const cachedTemplate = useSettingsStore((s) => s.cachedTemplate);
    if (cachedTemplate === 'rapidos_2026') return <AcademicStudents />;
    return <Students />;
}

// Fees page — Rapidos 2026 gets the new Horizon design
function FeesSwitcher() {
    const cachedTemplate = useSettingsStore((s) => s.cachedTemplate);
    if (cachedTemplate === 'rapidos_2026') return <FinanceFees />;
    return <StudentFees />;
}

// Receipt Vouchers page — Rapidos 2026 gets the new Horizon design
function ReceiptVouchersSwitcher() {
    const cachedTemplate = useSettingsStore((s) => s.cachedTemplate);
    if (cachedTemplate === 'rapidos_2026') return <FinanceReceipts />;
    return <ReceiptVouchers />;
}

// Expenses page — Rapidos 2026 gets the new Horizon design
function ExpensesSwitcher() {
    const cachedTemplate = useSettingsStore((s) => s.cachedTemplate);
    if (cachedTemplate === 'rapidos_2026') return <FinanceExpenses />;
    return <Expenses />;
}

// Invoices page — Rapidos 2026 gets the new Horizon design
function InvoicesSwitcher() {
    const cachedTemplate = useSettingsStore((s) => s.cachedTemplate);
    if (cachedTemplate === 'rapidos_2026') return <FinanceInvoices />;
    return <Invoices />;
}

// Chart of Accounts page — Rapidos 2026 gets the new Horizon design
function ChartOfAccountsSwitcher() {
    const cachedTemplate = useSettingsStore((s) => s.cachedTemplate);
    if (cachedTemplate === 'rapidos_2026') return <FinanceChartOfAccounts />;
    return <ChartOfAccounts />;
}

// Journal Entries page — Rapidos 2026 gets the new Horizon design
function JournalEntriesSwitcher() {
    const cachedTemplate = useSettingsStore((s) => s.cachedTemplate);
    if (cachedTemplate === 'rapidos_2026') return <FinanceJournalEntries />;
    return <JournalEntries />;
}

// Financial Reports page — Rapidos 2026 gets the new Horizon design
function FinancialReportsSwitcher() {
    const cachedTemplate = useSettingsStore((s) => s.cachedTemplate);
    if (cachedTemplate === 'rapidos_2026') return <FinanceReports />;
    return <FinancialReports />;
}

// Employees page — Rapidos 2026 gets the new Horizon design
function EmployeesSwitcher() {
    const cachedTemplate = useSettingsStore((s) => s.cachedTemplate);
    if (cachedTemplate === 'rapidos_2026') return <HREmployees />;
    return <Employees />;
}

// Departments page — Rapidos 2026 gets the new Horizon design
function DepartmentsSwitcher() {
    const cachedTemplate = useSettingsStore((s) => s.cachedTemplate);
    if (cachedTemplate === 'rapidos_2026') return <HRDepartments />;
    return <Departments />;
}

// Attendance page — Rapidos 2026 gets the new Horizon design
function AttendanceSwitcher() {
    const cachedTemplate = useSettingsStore((s) => s.cachedTemplate);
    if (cachedTemplate === 'rapidos_2026') return <HRStaffAttendance />;
    return <StaffAttendance />;
}

// Payroll page — Rapidos 2026 gets the new Horizon design
function PayrollSwitcher() {
    const cachedTemplate = useSettingsStore((s) => s.cachedTemplate);
    if (cachedTemplate === 'rapidos_2026') return <HRPayroll />;
    return <Payroll />;
}

// Leave Requests page — Rapidos 2026 gets the new Horizon design
function LeaveRequestsSwitcher() {
    const cachedTemplate = useSettingsStore((s) => s.cachedTemplate);
    if (cachedTemplate === 'rapidos_2026') return <HRLeaveRequests />;
    return <LeaveRequests />;
}

// Recruitment page — Rapidos 2026 gets the new Horizon design
function RecruitmentSwitcher() {
    const cachedTemplate = useSettingsStore((s) => s.cachedTemplate);
    if (cachedTemplate === 'rapidos_2026') return <HRRecruitment />;
    return <Recruitment />;
}

// Employee Actions page — Rapidos 2026 gets the new Horizon design
function EmployeeActionsSwitcher() {
    const cachedTemplate = useSettingsStore((s) => s.cachedTemplate);
    if (cachedTemplate === 'rapidos_2026') return <HREmployeeActions />;
    return <EmployeeActions />;
}

// Shifts page — Rapidos 2026 gets the new Horizon design
function ShiftsSwitcher() {
    const cachedTemplate = useSettingsStore((s) => s.cachedTemplate);
    if (cachedTemplate === 'rapidos_2026') return <HRShifts />;
    return <Shifts />;
}

// HR Settings page — Rapidos 2026 gets the new Horizon design
function HRSettingsSwitcher() {
    const cachedTemplate = useSettingsStore((s) => s.cachedTemplate);
    if (cachedTemplate === 'rapidos_2026') return <HRSettings2026 />;
    return <HRSettings />;
}

// CRM Switchers
function CRMDashboardSwitcher() {
    const cachedTemplate = useSettingsStore((s) => s.cachedTemplate);
    if (cachedTemplate === 'rapidos_2026') return <CRMDashboard2026 />;
    return <CRM />; // In classic, it handles sub-routes
}

// Layout wrapper for authenticated pages

function App() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const loadCurrentUserProfile = useAuthStore((state) => state.loadCurrentUserProfile);
    const fetchSettings = useSettingsStore((state) => state.fetchSettings);
    const theme = useSettingsStore((state) => state.theme);

    React.useEffect(() => {
        // Sync theme with document
        document.documentElement.setAttribute('data-theme', theme);

        if (isAuthenticated) {
            // Check if access token exists in localStorage
            const token = localStorage.getItem('accessToken');
            if (!token) {
                // State mismatch: Store says auth, but no token. Force logout.
                useAuthStore.getState().logout();
                return;
            }
            fetchSettings();
            loadCurrentUserProfile();
        }
    }, [isAuthenticated, fetchSettings, theme, loadCurrentUserProfile]);

    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                {/* Public Routes */}
                <Route
                    path="/login"
                    element={
                        isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
                    }
                />

                {/* Protected Routes */}
                <Route
                    path="/achievement"
                    element={
                        <ProtectedRoute>
                            <LayoutProvider>
                                <Achievement />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/academic-assessor-ai"
                    element={
                        <ProtectedRoute>
                            <LayoutProvider>
                                <AcademicAssessorAI />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/report-builder"
                    element={
                        <ProtectedRoute>
                            <LayoutProvider>
                                <ReportBuilder />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <LayoutProvider>
                                <DashboardSwitcher />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/programs"
                    element={
                        <ProtectedRoute requiredPermission="view_academic_programs">
                            <LayoutProvider>
                                <ProgramsSwitcher />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/units"
                    element={
                        <ProtectedRoute requiredPermission="view_academic_units">
                            <LayoutProvider>
                                <Units />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/classes"
                    element={
                        <ProtectedRoute requiredPermission="view_academic_classes">
                            <LayoutProvider>
                                <Classes />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/students"
                    element={
                        <ProtectedRoute requiredPermission="view_students">
                            <LayoutProvider>
                                <StudentsSwitcher />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/fees"
                    element={
                        <ProtectedRoute requiredPermission="view_finance_fees">
                            <LayoutProvider>
                                <FeesSwitcher />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/expenses"
                    element={
                        <ProtectedRoute requiredPermission="view_finance_expenses">
                            <LayoutProvider>
                                <ExpensesSwitcher />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/receipt-vouchers"
                    element={
                        <ProtectedRoute requiredPermission="view_finance_receipts">
                            <LayoutProvider>
                                <ReceiptVouchersSwitcher />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/financial-reports"
                    element={
                        <ProtectedRoute requiredPermission="view_financial_reports">
                            <LayoutProvider>
                                <FinancialReportsSwitcher />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/chart-of-accounts"
                    element={
                        <ProtectedRoute requiredPermission="view_chart_of_accounts">
                            <LayoutProvider>
                                <ChartOfAccountsSwitcher />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/journal-entries"
                    element={
                        <ProtectedRoute requiredPermission="view_journal_entries">
                            <LayoutProvider>
                                <JournalEntriesSwitcher />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/financial-settings"
                    element={
                        <ProtectedRoute requiredPermission="view_financial_settings">
                            <LayoutProvider>
                                <FinancialSettings />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/finance/invoices"
                    element={
                        <ProtectedRoute requiredPermission="view_finance_invoices">
                            <LayoutProvider>
                                <InvoicesSwitcher />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/accounting-guide"
                    element={
                        <ProtectedRoute requiredPermission="view_chart_of_accounts">
                            <LayoutProvider>
                                <AccountingGuide />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/whatsapp-tracker"
                    element={
                        <ProtectedRoute requiredPermission="view_sys_whatsapp">
                            <LayoutProvider>
                                <WhatsAppTracker />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/marketing"
                    element={
                        <ProtectedRoute requiredPermission="view_sys_marketing">
                            <LayoutProvider>
                                <Marketing />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/crm-customers"
                    element={
                        <ProtectedRoute requiredPermission="view_crm_customers">
                            <LayoutProvider>
                                <CRMCustomers2026 />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/crm-leads"
                    element={
                        <ProtectedRoute requiredPermission="view_crm_leads">
                            <LayoutProvider>
                                <CRMLeads2026 />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/crm-pipeline"
                    element={
                        <ProtectedRoute requiredPermission="view_crm_pipeline">
                            <LayoutProvider>
                                <CRMPipeline2026 />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/crm-activities"
                    element={
                        <ProtectedRoute requiredPermission="view_crm_activities">
                            <LayoutProvider>
                                <CRMActivities2026 />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/crm-teams"
                    element={
                        <ProtectedRoute requiredPermission="view_crm_teams">
                            <LayoutProvider>
                                <CRMTeams2026 />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/crm-stages"
                    element={
                        <ProtectedRoute requiredPermission="view_crm_stages">
                            <LayoutProvider>
                                <CRMStages2026 />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/crm/*"
                    element={
                        <ProtectedRoute requiredPermission="view_crm_dashboard|view_crm_leads|view_crm_pipeline|view_crm_activities|view_crm_teams|view_crm_stages|view_crm_customers">
                            <LayoutProvider>
                                <CRMDashboardSwitcher />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/schedule"
                    element={
                        <ProtectedRoute requiredPermission="view_academic_classes">
                            <LayoutProvider>
                                <Schedule />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/departments"
                    element={
                        <ProtectedRoute requiredPermission="view_hr_departments">
                            <LayoutProvider>
                                <DepartmentsSwitcher />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/employees"
                    element={
                        <ProtectedRoute requiredPermission="view_hr_employees">
                            <LayoutProvider>
                                <EmployeesSwitcher />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/employees/:id"
                    element={
                        <ProtectedRoute requiredPermission="view_hr_employees">
                            <LayoutProvider>
                                <EmployeeProfile />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/hr-dashboard"
                    element={
                        <ProtectedRoute requiredPermission="view_hr_employees">
                            <LayoutProvider>
                                <HRDashboard />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/recruitment"
                    element={
                        <ProtectedRoute requiredPermission="view_hr_recruitment">
                            <LayoutProvider>
                                <RecruitmentSwitcher />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/employee-actions"
                    element={
                        <ProtectedRoute requiredPermission="view_hr_employee_actions">
                            <LayoutProvider>
                                <EmployeeActionsSwitcher />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/communication"
                    element={
                        <ProtectedRoute requiredPermission="view_sys_settings">
                            <LayoutProvider>
                                <Communication />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/shifts"
                    element={
                        <ProtectedRoute requiredPermission="view_hr_shifts">
                            <LayoutProvider>
                                <ShiftsSwitcher />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/biometric-devices"
                    element={
                        <ProtectedRoute requiredPermission="view_biometric_devices">
                            <LayoutProvider>
                                <BiometricDevices />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/staff-attendance"
                    element={
                        <ProtectedRoute requiredPermission="view_hr_staff_attendance">
                            <LayoutProvider>
                                <AttendanceSwitcher />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/attendance-reports"
                    element={
                        <ProtectedRoute requiredPermission="view_hr_attendance_reports">
                            <LayoutProvider>
                                <AttendanceReports />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/hr-settings"
                    element={
                        <ProtectedRoute requiredPermission="view_hr_settings">
                            <LayoutProvider>
                                <HRSettingsSwitcher />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/payroll"
                    element={
                        <ProtectedRoute requiredPermission="view_hr_payroll">
                            <LayoutProvider>
                                <PayrollSwitcher />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/leaves"
                    element={
                        <ProtectedRoute requiredPermission="view_hr_leaves">
                            <LayoutProvider>
                                <LeaveRequestsSwitcher />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/attendance"
                    element={
                        <ProtectedRoute requiredPermission="view_attendance_lectures">
                            <LayoutProvider>
                                <Attendance />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/assignments"
                    element={
                        <ProtectedRoute requiredPermission="view_assignments">
                            <LayoutProvider>
                                <Assignments />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/reports"
                    element={
                        <ProtectedRoute requiredPermission="view_academic_reports">
                            <LayoutProvider>
                                <Reports />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/settings"
                    element={
                        <ProtectedRoute requiredPermission="view_sys_settings">
                            <LayoutProvider>
                                <Settings />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/users"
                    element={
                        <ProtectedRoute requiredPermission="view_sys_users">
                            <LayoutProvider>
                                <Users />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/roles"
                    element={
                        <ProtectedRoute requiredPermission="view_sys_roles">
                            <LayoutProvider>
                                <Roles />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/permissions"
                    element={
                        <ProtectedRoute requiredPermission="view_sys_roles">
                            <LayoutProvider>
                                <Permissions />
                            </LayoutProvider>
                        </ProtectedRoute>
                    }
                />




                {/* Default redirect */}
                <Route
                    path="/"
                    element={
                        <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
                    }
                />

                {/* 404 */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
