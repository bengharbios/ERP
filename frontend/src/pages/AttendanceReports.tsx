import React, { useState, useEffect } from 'react';
import { hrService, Employee, StaffAttendance, Department } from '../services/hr.service';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import './AttendanceReports.css';

const AttendanceReports = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [attendanceData, setAttendanceData] = useState<StaffAttendance[]>([]);
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState({
        employeeId: '',
        departmentId: '',
        projectId: '', // New placeholder for future project tracking
        shiftType: '', // Morning/Evening/Flexible
        contractType: '', // Full-time/Part-time/Contract
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        preset: 'month'
    });

    useEffect(() => {
        fetchInitialData();
        fetchAnalytics();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [empRes, deptRes] = await Promise.all([
                hrService.getEmployees(),
                hrService.getDepartments()
            ]);
            setEmployees(empRes.data || []);
            setDepartments(deptRes.data || []);
        } catch (err) {
            console.error('Initial fetch error:', err);
        }
    };

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await hrService.getAttendance({
                employeeId: filters.employeeId,
                departmentId: filters.departmentId,
                startDate: filters.startDate,
                endDate: filters.endDate
            });
            if (res.success) {
                let filtered = res.data || [];
                // Frontend secondary filtering for simulation (Shift/Contract)
                if (filters.shiftType) {
                    filtered = filtered.filter((a: any) => a.employee?.shift?.id === filters.shiftType);
                }
                if (filters.contractType) {
                    filtered = filtered.filter((a: any) => a.employee?.contractType === filters.contractType);
                }
                setAttendanceData(filtered);
            }
        } catch (err) {
            console.error('Analytics fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    // --- DRILL-DOWN LOGIC ---
    const handleKPIClick = (id: string) => {
        if (id === 'late') {
            const lateOnly = attendanceData.filter(a => a.status === 'late');
            console.log('Drilling down to Late employees:', lateOnly);
            // In a real app, this would update the table view or open a modal
        } else if (id === 'absent') {
            const absentOnly = attendanceData.filter(a => a.status === 'absent');
            console.log('Drilling down to Absent employees:', absentOnly);
        }
    };

    // --- ANALYTICS CALCULATIONS ---
    // --- ANALYTICS CALCULATIONS ---
    const totalWorkingDays = new Set(attendanceData.map(a => a.date)).size;
    const presentDays = attendanceData.filter(a => a.status !== 'absent').length;
    const attendanceRate = totalWorkingDays > 0 ? ((presentDays / totalWorkingDays) * 100).toFixed(1) : '0';

    const totalLateMinutes = attendanceData.reduce((acc, curr) => {
        if (curr.status === 'late' && curr.notes?.includes('التأخير:')) {
            const match = curr.notes.match(/التأخير: (\d+)د/);
            return acc + (match ? parseInt(match[1]) : 0);
        }
        return acc;
    }, 0);

    // --- CALCULATE ADDITIONAL KPIS (2026 STANDARD) ---
    const totalActualWorkMinutes = attendanceData.reduce((a, b) => a + (b.totalWorkMinutes || 0), 0);
    const totalPlannedMinutes = attendanceData.length * 8 * 60; // Simulation: 8 hours per shift
    const overtimeMinutes = Math.max(0, totalActualWorkMinutes - totalPlannedMinutes);
    const unjustifiedAbsences = attendanceData.filter(a => a.status === 'absent' && !a.notes?.includes('مبرر')).length;

    const kpis = [
        { id: 'rate', label: 'معدل الحضور', value: `${attendanceRate}%`, icon: '📈', color: '#3b82f6', trend: '+2.1%', trendDir: 'positive' },
        { id: 'hours', label: 'ساعات العمل الفعلية', value: `${(totalActualWorkMinutes / 60).toFixed(0)}س`, icon: '⏱️', color: '#f59e0b', trend: `مقابل ${(totalPlannedMinutes / 60).toFixed(0)}س`, trendDir: 'neutral' },
        { id: 'overtime', label: 'الساعات الإضافية', value: `${(overtimeMinutes / 60).toFixed(1)}س`, icon: '⚡', color: '#8b5cf6', trend: 'Overtime', trendDir: 'positive' },
        { id: 'late', label: 'متوسط التأخير اليومي', value: `${attendanceData.length > 0 ? (totalLateMinutes / attendanceData.length).toFixed(1) : 0}د`, icon: '🏃', color: '#ef4444', trend: 'Delay Avg', trendDir: 'negative' },
        { id: 'absent', label: 'غياب غير مبرر', value: unjustifiedAbsences, icon: '🚫', color: '#64748b', trend: 'Unjustified', trendDir: 'negative' },
    ];

    // Chart Data Preparation
    const trendData = attendanceData.reduce((acc: any[], curr) => {
        const date = new Date(curr.date).toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', numberingSystem: 'latn' });
        const existing = acc.find(a => a.name === date);
        if (existing) {
            existing.work += (curr.totalWorkMinutes || 0) / 60;
            existing.count += 1;
        } else {
            acc.push({ name: date, work: (curr.totalWorkMinutes || 0) / 60, count: 1 });
        }
        return acc;
    }, []).slice(-15);

    const pieData = [
        { name: 'حاضر', value: attendanceData.filter(a => a.status === 'present').length, color: '#10b981' },
        { name: 'متأخر', value: attendanceData.filter(a => a.status === 'late').length, color: '#f59e0b' },
        { name: 'غائب', value: attendanceData.filter(a => a.status === 'absent').length, color: '#ef4444' },
    ];

    // Departmental Comparison Data
    const deptComparisonData = departments.map(d => {
        const deptAttendance = attendanceData.filter(a => a.employee?.departmentId === d.id);
        const rate = deptAttendance.length > 0
            ? (deptAttendance.filter(a => a.status !== 'absent').length / deptAttendance.length) * 100
            : 0;
        return { name: d.nameAr, rate: Math.round(rate) };
    });

    // Heatmap Simulation Data (Concentration of Delays by Day of Week)
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const heatmapData = days.map((day, idx) => {
        const dayAttendance = attendanceData.filter(a => new Date(a.date).getDay() === idx);
        const avgDelay = dayAttendance.length > 0
            ? dayAttendance.reduce((acc, curr) => {
                const match = curr.notes?.match(/التأخير: (\d+)/);
                return acc + (match ? parseInt(match[1]) : 0);
            }, 0) / dayAttendance.length
            : 0;
        return { day, intensity: avgDelay };
    });

    return (
        <div className="next-gen-page-container">
            <header className="glass-header">
                <div className="header-content">
                    <div className="header-branding">
                        <div className="branding-icon">💹</div>
                        <div className="branding-text">
                            <h1>التحليلات الاستراتيجية للحضور</h1>
                            <p>Strategic Attendance Intelligence Dossier</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="btn-modern btn-outline" style={{ color: '#1e293b', borderColor: '#e2e8f0' }} onClick={() => window.print()}>🖨️ تصدير التقرير</button>
                    </div>
                </div>
            </header>

            <main className="main-content" style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 2rem' }}>
                {/* --- QUALITY ALERTS (2026 STANDARD) --- */}
                <div className="quality-alerts-ribbon">
                    {!loading && Number(attendanceRate) < 90 && (
                        <div className="quality-alert low-attendance">
                            <span className="alert-badge">⚠️ تنبيه</span>
                            <span>معدل الحضور العام منخفض (%{attendanceRate}). يتطلب تدخل إداري.</span>
                        </div>
                    )}
                    {!loading && totalLateMinutes > 100 && (
                        <div className="quality-alert high-delay">
                            <span className="alert-badge">🚩 تأخير مرتفع</span>
                            <span>إجمالي دقائق التأخير ({totalLateMinutes}د) تجاوز العتبة المسموحة.</span>
                        </div>
                    )}
                </div>

                {/* --- KPI RIBBON (TOP IMPACT) --- */}
                <div className="kpi-ribbon">
                    {kpis.map((kpi, i) => (
                        <div
                            key={i}
                            className={`kpi-card ${kpi.id}`}
                            onClick={() => handleKPIClick(kpi.id)}
                        >
                            <div className="kpi-info">
                                <span className="kpi-label">{kpi.label}</span>
                                <span className="kpi-value">{kpi.value}</span>
                                <span className={`kpi-trend ${kpi.trendDir}`}>{kpi.trend}</span>
                            </div>
                            <div className="kpi-icon-wrapper" style={{ background: `${kpi.color}15`, color: kpi.color }}>
                                {kpi.icon}
                            </div>
                        </div>
                    ))}
                </div>

                {/* --- PREMIUM FILTER BAR --- */}
                <div className="analytics-filter-bar">
                    <div className="filter-group">
                        <span className="filter-label">النطاق الزمني</span>
                        <select
                            className="filter-control"
                            value={filters.preset}
                            onChange={(e) => {
                                const val = e.target.value;
                                let start = new Date();
                                if (val === 'week') start.setDate(start.getDate() - 7);
                                else if (val === 'month') start.setMonth(start.getMonth() - 1);
                                else if (val === 'quarter') start.setMonth(start.getMonth() - 3);
                                setFilters({ ...filters, preset: val, startDate: start.toISOString().split('T')[0] });
                            }}
                        >
                            <option value="week">آخر 7 أيام</option>
                            <option value="month">الشهر الحالي</option>
                            <option value="quarter">الربع السنوي</option>
                            <option value="custom">نطاق مخصص</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <span className="filter-label">من تاريخ</span>
                        <input type="date" className="filter-control" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
                    </div>

                    <div className="filter-group">
                        <span className="filter-label">إلى تاريخ</span>
                        <input type="date" className="filter-control" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
                    </div>

                    <div className="filter-group">
                        <span className="filter-label">القسم</span>
                        <select className="filter-control" value={filters.departmentId} onChange={e => setFilters({ ...filters, departmentId: e.target.value })}>
                            <option value="">كل الأقسام</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <span className="filter-label">الموظف</span>
                        <select className="filter-control" value={filters.employeeId} onChange={e => setFilters({ ...filters, employeeId: e.target.value })}>
                            <option value="">كل الموظفين</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.user?.firstName} {e.user?.lastName}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <span className="filter-label">نوع الدوام</span>
                        <select className="filter-control" value={filters.shiftType} onChange={e => setFilters({ ...filters, shiftType: e.target.value })}>
                            <option value="">الكل</option>
                            <option value="morning">صباحي</option>
                            <option value="evening">مسائي</option>
                            <option value="flexible">مرن</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <span className="filter-label">فئة التوظيف</span>
                        <select className="filter-control" value={filters.contractType} onChange={e => setFilters({ ...filters, contractType: e.target.value })}>
                            <option value="">الكل</option>
                            <option value="FULL_TIME">دوام كامل</option>
                            <option value="PART_TIME">دوام جزئي</option>
                            <option value="CONTRACT">عقود</option>
                        </select>
                    </div>

                    <button className="btn-modern btn-orange-gradient" onClick={fetchAnalytics}>
                        {loading ? '...' : '⚡ تحديث البيانات'}
                    </button>
                </div>

                {attendanceData.length === 0 && !loading ? (
                    <div className="empty-analytics-canvas">
                        <div className="pulse-icon">📡</div>
                        <h2>لا توجد بيانات تحليلية متاحة</h2>
                        <p>يرجى تغيير فلاتر البحث أو التأكد من مزامنة أجهزة البصمة.</p>
                    </div>
                ) : (
                    <>
                        {/* --- VISUAL GRID --- */}
                        <div className="analytics-visual-grid">
                            <div className="chart-card">
                                <div className="chart-header">
                                    <h3>📊 اتجاهات ساعات العمل</h3>
                                </div>
                                <div className="chart-container">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={trendData}>
                                            <defs>
                                                <linearGradient id="colorWork" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                            <Area type="monotone" dataKey="work" name="ساعات العمل" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorWork)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="chart-card">
                                <div className="chart-header">
                                    <h3>🎯 توزيع الحالات</h3>
                                </div>
                                <div className="chart-container">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                innerRadius={80}
                                                outerRadius={120}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                                    {pieData.map(d => (
                                        <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700 }}>
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }}></div>
                                            {d.name}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="chart-card">
                                <div className="chart-header">
                                    <h3>🏢 كفاءة الأقسام (% الحضور)</h3>
                                </div>
                                <div className="chart-container" style={{ height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={deptComparisonData} layout="vertical">
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#1e293b', fontWeight: 700 }} width={100} />
                                            <Tooltip cursor={{ fill: '#f8fafc' }} />
                                            <Bar dataKey="rate" name="معدل الحضور" radius={[0, 10, 10, 0]}>
                                                {deptComparisonData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.rate > 90 ? '#10b981' : entry.rate > 70 ? '#f59e0b' : '#ef4444'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="chart-card">
                                <div className="chart-header">
                                    <h3>🔥 تركّز التأخيرات (Heatmap)</h3>
                                </div>
                                <div className="heatmap-grid">
                                    {heatmapData.map((data, i) => (
                                        <div key={i} className="heatmap-day-column">
                                            <span className="heatmap-day-label">{data.day}</span>
                                            <div
                                                className="heatmap-cell-visual"
                                                style={{
                                                    background: `rgba(239, 68, 68, ${Math.min(1, data.intensity / 60)})`,
                                                    boxShadow: data.intensity > 15 ? '0 0 15px rgba(239, 68, 68, 0.3)' : 'none'
                                                }}
                                                title={`متوسط التأخير: ${Math.round(data.intensity)} د`}
                                            >
                                                {data.intensity > 0 ? `${Math.round(data.intensity)}د` : '✅'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '1.5rem', textAlign: 'center' }}>
                                    * تدرج اللون الأحمر يشير إلى كثافة متوسط التأخير بالدقائق لكل يوم من الأسبوع.
                                </p>
                            </div>
                        </div>

                        {/* --- DETAILED TABLE --- */}
                        <div className="chart-card" style={{ padding: '0' }}>
                            <div className="chart-header" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9' }}>
                                <h3>📜 السجل التفصيلي المفلتر</h3>
                            </div>
                            <div className="next-gen-table-container" style={{ padding: '0 1rem' }}>
                                <table className="modern-data-table">
                                    <thead>
                                        <tr style={{ color: '#64748b', fontSize: '0.85rem' }}>
                                            <th className="pr-8">التاريخ</th>
                                            <th>الموظف</th>
                                            <th>الحضور</th>
                                            <th>ساعات العمل</th>
                                            <th className="text-center">الحالة</th>
                                            <th>الملاحظات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendanceData.map(att => (
                                            <tr key={att.id} className="modern-row" style={{ background: 'transparent', boxShadow: 'none', borderBottom: '1px solid #f8fafc' }}>
                                                <td className="pr-8 font-bold">{new Date(att.date).toLocaleDateString('ar-EG', { numberingSystem: 'latn' })}</td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{ width: 32, height: 32, background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                                                            {att.employee?.user?.firstName?.charAt(0)}
                                                        </div>
                                                        <span style={{ fontWeight: 700 }}>{att.employee?.user?.firstName} {att.employee?.user?.lastName}</span>
                                                    </div>
                                                </td>
                                                <td style={{ fontSize: '0.85rem' }}>
                                                    <div>⬇️ {att.checkIn ? new Date(att.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}</div>
                                                    <div>⬆️ {att.checkOut ? new Date(att.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'نشط'}</div>
                                                </td>
                                                <td className="text-center">
                                                    <span className="code-pill">
                                                        {att.totalWorkMinutes ? `${Math.floor(att.totalWorkMinutes / 60)}س ${att.totalWorkMinutes % 60}د` : '0د'}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <span className={`status-pill ${att.status}`}>{att.status === 'present' ? 'حاضر' : att.status === 'late' ? 'متأخر' : 'غائب'}</span>
                                                </td>
                                                <td className="table-secondary-text" style={{ fontSize: '0.75rem', opacity: 0.7 }}>{att.notes || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </main >
        </div >
    );
};

export default AttendanceReports;
