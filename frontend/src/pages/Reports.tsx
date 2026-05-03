import React, { useEffect, useState } from 'react';
import {
    Users,
    BookOpen,
    Activity,
    TrendingUp,
    AlertTriangle,
    Trophy,
    Download,
    Filter,
    Search,
    ChevronRight,
    LayoutDashboard,
    FileText,
    Layers,
    User,
    ClipboardList,
    Clock
} from 'lucide-react';
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ReferenceLine
} from 'recharts';
import { reportsService, DashboardSummary } from '../services/reports.service';
import './Reports.css';

const StudentDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;
    const borderColor = payload.category === 'star' ? '#FFD700' : (payload.category === 'at_risk' ? '#FF4D4D' : '#3498DB');
    return (
        <g transform={`translate(${cx - 12},${cy - 12})`}>
            <circle cx="12" cy="12" r="12" fill="white" stroke={borderColor} strokeWidth="1.5" />
            <defs><clipPath id={`clip-${payload.id}`}><circle cx="12" cy="12" r="11" /></clipPath></defs>
            {payload.photo ? (
                <image xlinkHref={payload.photo} width="24" height="24" clipPath={`url(#clip-${payload.id})`} preserveAspectRatio="xMidYMid slice" />
            ) : (
                <g clipPath={`url(#clip-${payload.id})`}>
                    <rect width="24" height="24" fill="#f1f5f9" />
                    <text x="12" y="15" textAnchor="middle" fontSize="8" fill="#999" fontWeight="bold">{payload.name?.charAt(0)}</text>
                </g>
            )}
        </g>
    );
};

const Reports: React.FC = () => {
    const [data, setData] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'dashboard' | 'students' | 'classes' | 'programs' | 'attendance'>('dashboard');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await reportsService.getDashboardSummary();
            if (response && response.success) {
                setData(response.data);
            }
        } catch (error) {
            console.error('Master Reporting Engine Crash:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="reports-loading-container">
            <div className="loading-spinner"></div>
            <p>جاري توليد التقارير التفصيلية 2026...</p>
        </div>
    );

    if (!data) return (
        <div className="error-state">
            <AlertTriangle size={48} />
            <h2>تعذر الوصول للتقارير الاستراتيجية</h2>
            <button onClick={loadData} className="btn-modern">إعادة المحاولة</button>
        </div>
    );

    return (
        <div className="reports-page animate-fade-in">
            {/* Header with Advanced Navigation */}
            <header className="reports-master-header">
                <div className="header-top">
                    <div className="header-title">
                        <TrendingUp className="text-orange" />
                        <div>
                            <h1>مركز التقارير الأكاديمية الشامل</h1>
                            <p>تحميل وتحليل أدق تفاصيل المعهد - إصدار 2026</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="btn-export"><Download size={16} /> تصدير التقرير الشامل</button>
                    </div>
                </div>

                <nav className="reports-sub-nav">
                    <button className={activeSection === 'dashboard' ? 'active' : ''} onClick={() => setActiveSection('dashboard')}>
                        <LayoutDashboard size={18} /> لوحة التحكم
                    </button>
                    <button className={activeSection === 'students' ? 'active' : ''} onClick={() => setActiveSection('students')}>
                        <Users size={18} /> تقارير الطلاب
                    </button>
                    <button className={activeSection === 'classes' ? 'active' : ''} onClick={() => setActiveSection('classes')}>
                        <BookOpen size={18} /> تقارير الفصول
                    </button>
                    <button className={activeSection === 'programs' ? 'active' : ''} onClick={() => setActiveSection('programs')}>
                        <Layers size={18} /> تقارير البرامج
                    </button>
                    <button className={activeSection === 'attendance' ? 'active' : ''} onClick={() => setActiveSection('attendance')}>
                        <ClipboardList size={18} /> تقارير الغياب
                    </button>
                </nav>
            </header>

            {/* View 1: Strategic Dashboard */}
            {activeSection === 'dashboard' && (
                <div className="dashboard-content animate-fade-in">
                    <div className="dashboard-stats-grid">
                        <div className="stat-card shadow-sm">
                            <Users className="i-orange" />
                            <div className="stat-info">
                                <span>إجمالي الطلاب</span>
                                <strong>{data.summary.totalStudents}</strong>
                            </div>
                        </div>
                        <div className="stat-card shadow-sm">
                            <Activity className="i-blue" />
                            <div className="stat-info">
                                <span>معدل الحضور</span>
                                <strong>{data.summary.avgAttendance}%</strong>
                            </div>
                        </div>
                        <div className="stat-card shadow-sm">
                            <TrendingUp className="i-green" />
                            <div className="stat-info">
                                <span>متوسط الأداء</span>
                                <strong>{data.summary.avgPerformance}%</strong>
                            </div>
                        </div>
                        <div className="stat-card shadow-sm">
                            <AlertTriangle className="i-red" />
                            <div className="stat-info">
                                <span>تنبيهات المخاطر</span>
                                <strong>{data.statisticalInsights.riskDensity}%</strong>
                            </div>
                        </div>
                    </div>

                    <div className="matrix-card">
                        <div className="card-header-simple">
                            <h3>المصفوفة الاستراتيجية (الحضور vs الأداء)</h3>
                            <p>رؤية بصرية لتوزيع الطلاب الفعلي</p>
                        </div>
                        <div className="chart-wrapper" style={{ height: '500px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis type="number" dataKey="attendance" name="الحضور" unit="%" domain={[0, 100]} stroke="#94a3b8" />
                                    <YAxis type="number" dataKey="grades" name="النتائج" unit="%" domain={[0, 100]} stroke="#94a3b8" />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                    <ReferenceLine x={75} stroke="#FF4D4D" strokeDasharray="3 3" />
                                    <ReferenceLine y={data.summary.avgPerformance} stroke="#2196F3" strokeDasharray="3 3" />
                                    <Scatter name="Students" data={data.matrix} shape={<StudentDot />} />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* View 2: Granular Students Detailed Report */}
            {activeSection === 'students' && (
                <div className="report-container animate-fade-in">
                    <div className="report-header-actions">
                        <div className="search-bar">
                            <Search size={18} />
                            <input type="text" placeholder="ابحث باسم الطالب أو البرنامج..." onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <button className="btn-filter"><Filter size={16} /> تصفية متقدمة</button>
                    </div>
                    <div className="table-wrapper glass-table">
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>اسم الطالب</th>
                                    <th>البرنامج الدراسي</th>
                                    <th>الفصل</th>
                                    <th>متوسط الحضور</th>
                                    <th>المعدل التراكمي</th>
                                    <th>إنجاز الوحدات</th>
                                    <th>حالة المخاطر</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.reports.students
                                    .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.program?.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map((student, i) => (
                                        <tr key={i}>
                                            <td><strong>{student.name}</strong></td>
                                            <td>{student.program}</td>
                                            <td>{student.className}</td>
                                            <td>
                                                <div className="mini-progress-box">
                                                    <div className="bar"><div className="fill" style={{ width: `${student.attendance}%`, background: student.attendance < 75 ? '#ef4444' : '#22c55e' }}></div></div>
                                                    <span>{student.attendance}%</span>
                                                </div>
                                            </td>
                                            <td><strong>{student.avgGrade}%</strong></td>
                                            <td><span className="unit-badge">{student.unitsCompleted} / {student.unitsTotal}</span></td>
                                            <td><span className={`status-pill ${student.avgGrade < 65 || student.attendance < 75 ? 'danger' : 'success'}`}>{student.avgGrade < 65 || student.attendance < 75 ? 'خطر' : 'آمن'}</span></td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* View 3: Attendance & Absence Detailed Report */}
            {activeSection === 'attendance' && (
                <div className="report-container animate-fade-in">
                    <div className="report-header-actions">
                        <div className="search-bar">
                            <Search size={18} />
                            <input type="text" placeholder="بحث في سجلات الغياب..." onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <button className="btn-filter"><Clock size={16} /> سجلات اليوم</button>
                    </div>
                    <div className="table-wrapper">
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>اسم الطالب</th>
                                    <th>البرنامج</th>
                                    <th>عدد مرات الغياب</th>
                                    <th>نسبة الحضور الحالية</th>
                                    <th>تأثير الغياب على الدرجات</th>
                                    <th>الإجراء المطلوب</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.reports.students
                                    .filter(s => s.absent > 0)
                                    .sort((a, b) => b.absent - a.absent)
                                    .map((student, i) => (
                                        <tr key={i}>
                                            <td>{student.name}</td>
                                            <td>{student.program}</td>
                                            <td><span className="text-red font-bold">{student.absent} غياب</span></td>
                                            <td>{student.attendance}%</td>
                                            <td>{student.avgGrade < 70 ? 'تأثير سلبي مرتفع' : 'تأثير محدود'}</td>
                                            <td><button className="btn-action-small">استدعاء ولي أمر</button></td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* View 4: Classes Detailed Report */}
            {activeSection === 'classes' && (
                <div className="report-container-grid animate-fade-in">
                    {data.reports.classes.map((cls, i) => (
                        <div key={i} className="class-detail-card">
                            <div className="card-top">
                                <div>
                                    <h3>{cls.name}</h3>
                                    <p className="sub">{cls.program}</p>
                                </div>
                                <span className="status-indicator active">نشط</span>
                            </div>
                            <div className="card-stats">
                                <div className="c-stat"><span>الطلاب</span><strong>{cls.studentCount}</strong></div>
                                <div className="c-stat"><span>المحاضرات</span><strong>{cls.lectureCount}</strong></div>
                                <div className="c-stat"><span>الحـضور</span><strong className="text-blue">{cls.avgAttendance}%</strong></div>
                            </div>
                            <button className="btn-full-report">عرض سجل الفصل بالكامل</button>
                        </div>
                    ))}
                </div>
            )}

            {/* View 5: Programs Detailed Report */}
            {activeSection === 'programs' && (
                <div className="report-container-grid animate-fade-in">
                    {data.reports.programs.map((prog, i) => (
                        <div key={i} className="program-master-card">
                            <div className="prog-top">
                                <Layers className="text-orange" size={28} />
                                <div>
                                    <h3>{prog.name}</h3>
                                    <p>كود: {prog.id.substring(0, 8)}</p>
                                </div>
                            </div>
                            <div className="prog-info">
                                <div className="p-item"><span>عدد الوحدات الدراسية:</span> <strong>{prog.unitsCount} وحدة</strong></div>
                                <div className="p-item"><span>إجمالي الفصول:</span> <strong>{prog.classesCount} فصل</strong></div>
                                <div className="p-item"><span>إجمالي الطلاب:</span> <strong>{prog.studentsCount} طالب</strong></div>
                            </div>
                            <div className="prog-completion">
                                <div className="label-row"><span>جاهزية المنهج</span> <span>{prog.completionRate}%</span></div>
                                <div className="progress-bar"><div className="fill" style={{ width: `${prog.completionRate}%` }}></div></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Reports;
