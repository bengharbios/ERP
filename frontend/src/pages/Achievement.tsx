import React, { useState, useEffect, useMemo } from 'react';
import {
    Search,
    Filter,
    RefreshCw,
    BarChart2,
    Grid,
    List,
    Plus,
    FileDown
} from 'lucide-react';
import { academicService, Class } from '../services/academic.service';
import StudentAcademicRecord from '../components/StudentAcademicRecord';

const Achievement: React.FC = () => {
    // Basic States
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [showHeader, setShowHeader] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [loading, setLoading] = useState(false);

    // Data States
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [classData, setClassData] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [academicRecordStudentId, setAcademicRecordStudentId] = useState<string | null>(null);
    const [academicRecordInitialUnitId, setAcademicRecordInitialUnitId] = useState<string | null>(null);

    useEffect(() => {
        fetchClasses();
        const handleScroll = () => {
            if (window.innerWidth >= 768) {
                setShowHeader(true);
                return;
            }
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 60) {
                setShowHeader(false);
            } else {
                setShowHeader(true);
            }
            setLastScrollY(currentScrollY);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    useEffect(() => {
        if (selectedClassId) {
            fetchClassProgress(selectedClassId);
        }
    }, [selectedClassId]);

    const fetchClasses = async () => {
        try {
            const response = await academicService.getClasses('active');
            if (response.success && response.data) {
                setClasses(response.data.classes || []);
                if (response.data.classes && response.data.classes.length > 0) {
                    setSelectedClassId(response.data.classes[0].id);
                }
            }
        } catch (err) {
            console.error('Failed to fetch classes');
        }
    };

    const fetchClassProgress = async (id: string) => {
        setLoading(true);
        try {
            const response = await academicService.getClassById(id);
            const studentsResponse = await academicService.getClassStudents(id);

            if (response.success && response.data && studentsResponse.success && studentsResponse.data) {
                setClassData({
                    ...response.data.class,
                    students: studentsResponse.data.students
                });
            }
        } catch (err) {
            console.error('Failed to fetch progress data');
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        if (!selectedClassId) return;
        try {
            setLoading(true);
            const res = await academicService.syncClassProgress(selectedClassId);
            if (res.success) {
                fetchClassProgress(selectedClassId);
            }
        } catch (err) {
            alert('فشلت عملية المزامنة');
        } finally {
            setLoading(false);
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed': return 'مكتمل';
            case 'in_progress': return 'قائم';
            case 'skipped': return 'مفقود';
            default: return 'لم يبدأ';
        }
    };

    const filteredStudents = useMemo(() => {
        if (!classData?.students) return [];
        return classData.students.filter((s: any) =>
            s.firstNameEn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.firstNameAr?.includes(searchTerm) ||
            s.studentNumber?.includes(searchTerm)
        );
    }, [classData, searchTerm]);

    const stats = useMemo(() => {
        if (!classData?.students || !classData?.program?.programUnits) return { completed: 0, active: 0, missing: 0, pending: 0 };

        const totalStudents = classData.students.length;
        const totalUnits = classData.program.programUnits.length;
        // Calculate status counts based on student progress
        // This is tricky for a matrix. Let's count "Completed Units" vs "Total Units" for the whole class

        let completedUnitsCount = 0;
        let activeUnitsCount = 0;
        let missingUnitsCount = 0;

        classData.students.forEach((s: any) => {
            const progressList = s.studentEnrollments?.find((e: any) => e.classId === selectedClassId)?.studentUnitProgress || [];
            progressList.forEach((p: any) => {
                if (p.status === 'completed' || p.status === 'exempted') completedUnitsCount++;
                else if (p.status === 'in_progress') activeUnitsCount++;
                else if (p.status === 'skipped' || p.status === 'missing') missingUnitsCount++;
            });
        });

        const totalPossibleUnits = totalStudents * totalUnits;
        const pendingUnitsCount = totalPossibleUnits - completedUnitsCount - activeUnitsCount - missingUnitsCount;

        return {
            completed: completedUnitsCount,
            active: activeUnitsCount,
            missing: missingUnitsCount,
            pending: pendingUnitsCount > 0 ? pendingUnitsCount : 0
        };
    }, [classData, selectedClassId]);

    return (
        <div className="next-gen-page-container fade-in">
            {/* --- 1. Premium Floating Header (Abdelkader Template) --- */}
            <header className="glass-header" style={{
                top: showHeader ? '80px' : '0',
                transform: showHeader ? 'translateY(0)' : 'translateY(-10px)',
                transition: 'all 0.3s ease-in-out'
            }}>
                <div className="container-wide header-content">
                    <div className="header-branding">
                        <div className="branding-icon orange">
                            <BarChart2 size={24} strokeWidth={2.5} />
                        </div>
                        <div className="branding-text">
                            <h1>الإنجاز الأكاديمي</h1>
                            <p className="hide-on-mobile">متابعة صفوف ومصفوفات الإنجاز للوحدات</p>
                        </div>
                    </div>

                    <div className="header-actions">
                        <div className="view-switcher hide-on-mobile">
                            <button onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'active' : ''}>
                                <Grid size={18} strokeWidth={2.4} />
                            </button>
                            <button onClick={() => setViewMode('table')} className={viewMode === 'table' ? 'active' : ''}>
                                <List size={18} strokeWidth={2.4} />
                            </button>
                        </div>
                        <div className="header-pills hide-on-mobile">
                            <span className="pill pill-green">إنجاز: %85</span>
                        </div>
                        <div className="header-excel-actions hide-on-mobile">
                            <button className="btn-modern btn-outline" title="تصدير التقارير">
                                <FileDown size={18} strokeWidth={2.2} />
                                <span className="hide-on-mobile">تصدير</span>
                            </button>
                            <button onClick={handleSync} className="btn-modern btn-outline" title="تحديث البيانات">
                                <RefreshCw size={18} strokeWidth={2.2} className={loading ? 'spin' : ''} />
                                <span className="hide-on-mobile">تحديث</span>
                            </button>
                        </div>
                        <button className="btn-modern btn-orange-gradient hide-on-mobile">
                            <Plus size={18} strokeWidth={2.8} />
                            <span className="hide-on-mobile">سجل جديد</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* --- Main Content --- */}
            <main className="container-wide main-content">
                {/* --- 2. Filters Toolbar (Abdelkader Template - RTL ALIGNED) --- */}
                <section className="filters-toolbar hide-on-mobile">
                    {/* Search on Right (JSX 1st) */}
                    <div className="search-box-wrapper">
                        <span className="search-icon">
                            <Search size={18} strokeWidth={2.2} />
                        </span>
                        <input
                            type="text"
                            placeholder="البحث باسم الطالب أو الرقم التعريفي..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="divider-v"></div>

                    {/* Filters on Left (JSX 2nd) */}
                    <div className="filters-group">
                        <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                            ))}
                        </select>
                        <div className="date-input-wrapper">
                            <Filter size={18} strokeWidth={2.2} />
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>تصفية متقدمة</span>
                        </div>
                    </div>
                </section>

                {/* Mobile Area */}
                <section className="show-on-mobile mobile-search-area">
                    <div className="search-box-wrapper">
                        <input
                            type="text"
                            placeholder="بحث عن طالب..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button onClick={() => setShowMobileFilters(true)} className="btn-filter-toggle">
                            <Filter size={18} strokeWidth={2.2} />
                        </button>
                    </div>
                </section>

                {/* --- 3. Stats Grid (Abdelkader Template - Label Right, Value Left) --- */}
                <div className="stats-grid">
                    <div className="stat-card-mini" style={{ borderRight: '3px solid #38A169' }}>
                        <div className="stat-label">مكتمل</div>
                        <div className="stat-value">{stats.completed}</div>
                    </div>
                    <div className="stat-card-mini" style={{ borderRight: '3px solid #3182CE' }}>
                        <div className="stat-label">قائم الآن</div>
                        <div className="stat-value">{stats.active}</div>
                    </div>
                    <div className="stat-card-mini" style={{ borderRight: '3px solid #DD6B20' }}>
                        <div className="stat-label">مفقود</div>
                        <div className="stat-value">{stats.missing}</div>
                    </div>
                    <div className="stat-card-mini" style={{ borderRight: '3px solid #A0AEC0' }}>
                        <div className="stat-label">لم يبدأ</div>
                        <div className="stat-value">{stats.pending}</div>
                    </div>
                </div>

                {/* --- 4. Matrix Board (Data Display) --- */}
                {/* --- 4. Content Area (Grid vs Table) --- */}
                <div className={`content-transition-wrapper ${viewMode}`}>
                    {loading && !classData ? (
                        <div style={{ padding: '8rem', display: 'flex', justifyContent: 'center' }}>
                            <div className="next-gen-loader"></div>
                        </div>
                    ) : !classData ? (
                        <div className="empty-state-modern">
                            <div className="empty-icon">📊</div>
                            <h2>لا توجد بيانات متاحة</h2>
                            <p>يرجى اختيار فصل دراسي لعرض مصفوفة الإنجاز</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div key="grid-view" className="programs-grid-2026">
                            {filteredStudents.map((student: any) => {
                                const totalUnits = classData.program?.programUnits?.length || 0;
                                const studentProgress = student.studentEnrollments?.find((e: any) => e.classId === selectedClassId)?.studentUnitProgress || [];
                                const completedUnits = studentProgress.filter((p: any) => p.status === 'completed' || p.status === 'exempted').length;
                                const progressPercent = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;

                                return (
                                    <div key={student.id} className="next-gen-card" onClick={() => setAcademicRecordStudentId(student.id)} style={{ cursor: 'pointer' }}>
                                        <div className="card-top">
                                            <span className="card-code">{student.studentNumber}</span>
                                            <div className="card-actions-mini">
                                                <button title="فتح السجل الأكاديمي" style={{ color: '#3182CE' }}><List size={18} /></button>
                                            </div>
                                        </div>
                                        <div className="card-info">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                                <div className="student-avatar">{student.gender === 'female' ? '👩' : '👨'}</div>
                                                <div style={{ flex: 1 }}>
                                                    <h3 className="card-title">{student.firstNameAr} {student.lastNameAr}</h3>
                                                    <p className="card-subtitle">{student.firstNameEn} {student.lastNameEn}</p>
                                                </div>
                                            </div>

                                            <div style={{ marginTop: '1.25rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem', color: '#718096', fontWeight: 700 }}>
                                                    <span>مستوى الإنجاز</span>
                                                    <span>{progressPercent}%</span>
                                                </div>
                                                <div style={{ height: '8px', background: '#EDF2F7', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${progressPercent}%`, height: '100%', background: progressPercent >= 100 ? '#38A169' : 'linear-gradient(90deg, #DD6B20, #ED8936)', transition: 'width 0.5s', borderRadius: '4px' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card-stats-grid">
                                            <div className="stat-item highlight">
                                                <span className="stat-lbl">المنجزة</span>
                                                <span className="stat-val" style={{ color: '#38A169' }}>{completedUnits}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-lbl">المتبقية</span>
                                                <span className="stat-val">{totalUnits - completedUnits}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-lbl">المعدل</span>
                                                <span className="stat-val">-</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div key="table-view" className="next-gen-table-container">
                            <div style={{ overflowX: 'auto' }}>
                                <table className="modern-data-table matrix-table">
                                    <thead>
                                        <tr>
                                            <th className="sticky-col">بيانات الطالب</th>
                                            {classData.program?.programUnits?.map((pu: any) => (
                                                <th key={pu.unit.id} style={{ textAlign: 'center', minWidth: '140px' }}>
                                                    <div className="th-code">{pu.unit.code}</div>
                                                    <div className="th-name">{pu.unit.nameAr}</div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStudents.map((student: any) => (
                                            <tr key={student.id}>
                                                <td
                                                    className="sticky-col student-cell"
                                                    onClick={() => setAcademicRecordStudentId(student.id)}
                                                    style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                                                    title="فتح السجل الأكاديمي"
                                                >
                                                    <div className="table-primary-text" style={{ color: '#2B6CB0', textDecoration: 'underline', textUnderlineOffset: '4px' }}>
                                                        {student.firstNameAr} {student.lastNameAr}
                                                    </div>
                                                    <div className="table-secondary-text">{student.studentNumber}</div>
                                                </td>
                                                {classData.program?.programUnits?.map((pu: any) => {
                                                    const progress = student.studentEnrollments?.find((e: any) => e.classId === selectedClassId)?.studentUnitProgress?.find((p: any) => p.unitId === pu.unit.id);
                                                    const status = progress?.status || 'not_started';

                                                    return (
                                                        <td
                                                            key={pu.unit.id}
                                                            style={{ textAlign: 'center', cursor: 'pointer' }}
                                                            onClick={() => {
                                                                setAcademicRecordStudentId(student.id);
                                                                setAcademicRecordInitialUnitId(pu.unit.id);
                                                            }}
                                                            title="تحديث حالة الوحدة"
                                                        >
                                                            <div className={`status-pill ${status} hover-scale`}>
                                                                {getStatusLabel(status)}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* --- Mobile Filters Drawer --- */}
            {showMobileFilters && (
                <div className="drawer-overlay" onClick={() => setShowMobileFilters(false)}>
                    <div className="drawer-content" onClick={e => e.stopPropagation()}>
                        <div className="drawer-header">
                            <h2>⚙️ الفصول الدراسية</h2>
                            <button onClick={() => setShowMobileFilters(false)}>×</button>
                        </div>
                        <div className="drawer-body">
                            <div className="drawer-section">
                                <label>الفصل الدراسي</label>
                                <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="drawer-footer">
                            <button onClick={() => { setSearchTerm(''); setShowMobileFilters(false); }} className="btn-reset">
                                إعادة تعيين
                            </button>
                            <button onClick={() => setShowMobileFilters(false)} className="btn-apply">تطبيق</button>
                        </div>
                    </div>
                </div>
            )}

            <button className="fab-mobile show-on-mobile" onClick={() => { }}>+</button>

            {/* Student Academic Record Modal - Linked for Live Updates */}
            <StudentAcademicRecord
                studentId={academicRecordStudentId || ''}
                isOpen={!!academicRecordStudentId}
                initialUnitId={academicRecordInitialUnitId || undefined}
                onClose={() => {
                    setAcademicRecordStudentId(null);
                    setAcademicRecordInitialUnitId(null);
                    // Refresh data to reflect changes
                    if (selectedClassId) fetchClassProgress(selectedClassId);
                }}
            />

            {/* ABDELKADER TEMPLATE DESIGN SYSTEM */}
            <style dangerouslySetInnerHTML={{
                __html: `
                :root {
                    --orange-primary: #DD6B20;
                    --orange-light: #FEEBC8;
                    --orange-dark: #7B341E;
                    --radius-md: 12px;
                    --radius-lg: 20px;
                    --glass-bg: rgba(255, 255, 255, 0.85);
                    --bg-page: #F8FAFC;
                    --text-main: #1A202C;
                }

                .next-gen-page-container { font-family: 'Inter', 'Cairo', sans-serif; color: var(--text-main); direction: rtl; min-height: 100vh; background: var(--bg-page); }
                .container-wide { max-width: 1400px; margin: 0 auto; padding: 0 1.5rem; }
                
                .glass-header { position: sticky; top: 80px; z-index: 1000; background: var(--glass-bg); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(226, 232, 240, 0.6); height: 80px; display: flex; align-items: center; transition: all 0.3s ease; }
                .header-content { display: flex; justify-content: space-between; align-items: center; width: 100%; }
                .header-branding { display: flex; align-items: center; gap: 1rem; }
                .branding-icon.orange { width: 48px; height: 48px; background: #FFF5F5; color: #DD6B20; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
                .branding-text h1 { font-size: 1.25rem; font-weight: 800; margin: 0; color: #1A202C; }
                .branding-text p { margin: 0; font-size: 0.8125rem; color: #718096; }

                .header-actions { display: flex !important; flex-direction: row !important; align-items: center !important; gap: 1rem !important; }
                .btn-modern {
                    display: flex !important; align-items: center !important; gap: 0.75rem !important;
                    padding: 0.625rem 1.25rem !important; border-radius: 12px !important;
                    font-weight: 700 !important; cursor: pointer !important; transition: all 0.2s;
                    border: none !important; white-space: nowrap !important;
                }
                .btn-orange-gradient { background: linear-gradient(135deg, #DD6B20 0%, #ED8936 100%); color: white; box-shadow: 0 4px 12px rgba(221, 107, 32, 0.3); }
                .btn-outline { background: transparent; border: 1px solid #E2E8F0 !important; color: #1A202C; }

                .view-switcher { display: flex !important; background: #EDF2F7; padding: 4px; border-radius: 10px; gap: 4px; }
                .view-switcher button { width: 36px; height: 36px; border: none; background: transparent; border-radius: 8px; cursor: pointer; color: #718096; display: flex; align-items: center; justify-content: center; }
                .view-switcher button.active { background: white; color: #DD6B20; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
                .pill { padding: 0.4rem 1rem; border-radius: 10px; font-weight: 700; font-size: 0.85rem; }
                .pill-green { background: #C6F6D5; color: #22543D; }

                .filters-toolbar { background: white; padding: 1rem 1.5rem; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 1.5rem !important; border: 1px solid rgba(226, 232, 240, 0.5); margin-top: 0.75rem; }
                .search-box-wrapper { flex: 1; position: relative; display: flex !important; align-items: center !important; }
                .search-box-wrapper input { width: 100%; height: 48px; padding: 0 3rem 0 1rem; border: 1px solid #E2E8F0; border-radius: 12px; background: #F8FAFC; outline: none; transition: all 0.2s; }
                .search-icon { position: absolute; right: 1rem; color: #718096; display: flex; align-items: center; }
                .divider-v { width: 1px; height: 32px; background: #E2E8F0; margin: 0 0.5rem; }
                .filters-group { display: flex !important; gap: 1rem !important; align-items: center !important; }
                .filters-group select, .date-input-wrapper { height: 48px; border-radius: 12px; border: 1px solid #E2E8F0; background: #F8FAFC; padding: 0 1rem; font-weight: 600; }
                
                .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; margin: 0.75rem 0; }
                .stat-card-mini { background: white; padding: 1.5rem; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #EDF2F7; display: flex; align-items: center; justify-content: space-between; }
                .stat-label { font-size: 0.75rem; color: #718096; font-weight: 800; text-transform: uppercase; }
                .stat-value { font-size: 2rem; font-weight: 800; color: #1A202C; }

                /* NEXT-GEN CARDS */
                .programs-grid-2026 { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; animation: fadeIn 0.4s ease-out; margin-top: 1rem; }
                .next-gen-card { background: white; border-radius: 20px; padding: 1.5rem; border: 1px solid #EDF2F7; transition: all 0.3s; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); display: flex; flex-direction: column; }
                .next-gen-card:hover { transform: translateY(-8px); box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08); border-color: #FEEBC8; }
                .card-top { display: flex; justify-content: space-between; margin-bottom: 1.25rem; }
                .card-code { font-size: 0.75rem; font-weight: 800; color: #7B341E; background: #FEEBC8; padding: 0.25rem 0.75rem; border-radius: 20px; }
                .card-actions-mini { display: flex; gap: 0.5rem; }
                .card-actions-mini button { background: transparent; border: none; cursor: pointer; color: #718096; transition: color 0.2s; }
                .card-actions-mini button:hover { color: #DD6B20; }
                .student-avatar { width: 40px; height: 40px; border-radius: 50%; background: #FEEBC8; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; }
                .card-title { font-size: 1.125rem; font-weight: 800; color: #1A202C; margin: 0 0 0.25rem 0; }
                .card-subtitle { font-size: 0.8125rem; color: #718096; margin: 0; }
                .card-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; padding: 1rem; background: #F8FAFC; border-radius: 12px; margin-top: auto; }
                .stat-item { display: flex; flex-direction: column; align-items: center; }
                .stat-val { font-size: 1.125rem; font-weight: 800; color: #1A202C; }
                .stat-lbl { font-size: 0.625rem; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; }
                .stat-item.highlight .stat-val { color: #DD6B20; }

                .next-gen-table-container { background: white; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #EDF2F7; margin-top: 1rem; }
                .modern-data-table { width: 100%; border-collapse: separate; border-spacing: 0; }
                .modern-data-table th { background: #F8FAFC; padding: 1.25rem 1rem; text-align: center; font-weight: 800; border-bottom: 2px solid #EDF2F7; }
                .modern-data-table td { padding: 1rem; border-bottom: 1px solid #F1F5F9; }
                
                .sticky-col { position: sticky; right: 0; background: #fff !important; z-index: 10; border-left: 3px solid #E2E8F0 !important; box-shadow: 2px 0 5px rgba(0,0,0,0.02); min-width: 200px; text-align: right !important; }
                .th-code { font-size: 0.7rem; color: #718096; margin-bottom: 4px; }
                .th-name { font-size: 0.85rem; font-weight: 800; }
                .table-primary-text { font-weight: 800; color: #1A202C; font-size: 0.95rem; }
                .table-secondary-text { font-size: 0.75rem; color: #718096; }

                .status-pill { padding: 0.4rem 0.8rem; border-radius: 10px; font-size: 0.75rem; font-weight: 800; display: inline-block; min-width: 85px; transition: all 0.2s; }
                .status-pill.completed { background: #F0FFF4; color: #2F855A; border: 1px solid #C6F6D5; }
                .status-pill.in_progress { background: #EBF8FF; color: #2B6CB0; border: 1px solid #BEE3F8; }
                .status-pill.skipped { background: #FFFAF0; color: #C05621; border: 1px solid #FEEBC8; }
                .status-pill.not_started { background: #F7FAFC; color: #CBD5E0; border: 1px solid #E2E8F0; }

                .empty-state-modern { padding: 6rem 2rem; text-align: center; }
                .empty-icon { font-size: 3.5rem; margin-bottom: 1rem; display: block; }
                
                .drawer-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); z-index: 3000; display: flex; justify-content: flex-start; animation: fadeIn 0.3s ease; }
                .drawer-content { width: 85%; max-width: 320px; background: white; height: 100%; padding: 2.5rem 1.5rem; display: flex; flex-direction: column; box-shadow: -10px 0 40px rgba(0,0,0,0.15); animation: slideInRTL 0.4s cubic-bezier(0.16, 1, 0.3, 1); border-left: 1px solid rgba(226, 232, 240, 0.8); }
                @keyframes slideInRTL { from { transform: translateX(100%); } to { transform: translateX(0); } }
                .drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; padding-bottom: 1.25rem; border-bottom: 1px solid #F1F5F9; }
                .drawer-header h2 { font-size: 1.25rem; font-weight: 800; display: flex; align-items: center; gap: 0.75rem; }
                .drawer-header button { background: #F8FAFC; border: none; width: 36px; height: 36px; border-radius: 50%; font-size: 1.25rem; color: #718096; }
                .drawer-section { margin-bottom: 2rem; }
                .drawer-section label { display: block; font-size: 0.75rem; font-weight: 800; color: #DD6B20; text-transform: uppercase; margin-bottom: 1rem; }
                .drawer-section select { width: 100%; height: 52px; padding: 0 1rem; border: 2px solid #EDF2F7; border-radius: 14px; font-weight: 600; }
                .drawer-footer { margin-top: auto; display: flex; flex-direction: column; gap: 0.75rem; }
                .btn-reset { height: 50px; background: #F1F5F9; border: none; border-radius: 14px; color: #718096; font-weight: 700; }
                .btn-apply { height: 52px; color: white; border: none; border-radius: 14px; font-weight: 700; background: linear-gradient(135deg, var(--orange-primary) 0%, #ED8936 100%); }

                /* MOBILE RESPONSIVE - HIDDEN ON DESKTOP */
                .mobile-search-area { display: none !important; }
                .show-on-mobile { display: none !important; }

                @media (max-width: 768px) {
                    .hide-on-mobile { display: none !important; }
                    .show-on-mobile { display: block !important; }
                    .mobile-search-area { display: block !important; background: white; padding: 1.25rem 0.75rem; border-radius: 20px; margin: 0.5rem 0.75rem 0.75rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
                    .mobile-search-area .search-box-wrapper { display: flex !important; gap: 8px !important; align-items: center !important; }
                    .mobile-search-area input { flex: 1; height: 44px; border: 1px solid #E2E8F0; border-radius: 12px; padding: 0 1rem; background: #F8FAFC; outline: none; }
                    .btn-filter-toggle { width: 44px; height: 44px; border: 1.5px solid #E2E8F0; border-radius: 12px; background: white; display: flex; align-items: center; justify-content: center; }
                    
                    .glass-header { height: 70px; top: 80px; margin: 0.5rem 0.75rem; border-radius: 20px; display: flex !important; align-items: center !important; justify-content: center !important; }
                    .header-content { display: block !important; text-align: center !important; padding: 0 !important; width: 100% !important; }
                    .header-branding { display: inline-flex !important; flex-direction: row !important; align-items: center !important; justify-content: center !important; gap: 0.75rem !important; }
                    .branding-icon.orange { width: 34px !important; height: 34px !important; display: flex !important; align-items: center !important; justify-content: center !important; }
                    .branding-text { display: flex !important; flex-direction: column !important; text-align: right !important; }
                    .branding-text h1 { font-size: 1.1rem !important; margin: 0 !important; padding: 0 !important; line-height: 1.3 !important; }
                    .branding-text p { display: none !important; }
                    .branding-text p.hide-on-mobile { display: none !important; }
                    
                    /* CONTENT FONT SCALING (GLOBAL MOBILE STANDARDS) */
                    .mobile-search-area input { font-size: 0.85rem !important; height: 42px !important; }
                    .table-primary-text { font-size: 0.8rem !important; }
                    .table-secondary-text { font-size: 0.7rem !important; }
                    .status-pill { font-size: 0.7rem !important; padding: 0.35rem 0.65rem !important; min-width: 75px !important; }
                    .th-name { font-size: 0.75rem !important; }
                    .sticky-col { min-width: 150px !important; }

                    .stats-grid { grid-template-columns: repeat(2, 1fr); margin: 0 0.75rem 1rem; gap: 0.65rem; }
                    .stat-card-mini { padding: 0.85rem; flex-direction: row-reverse !important; justify-content: space-between !important; border-radius: 14px; }
                    .stat-value { font-size: 1.15rem !important; }
                    .stat-label { font-size: 0.65rem !important; }
                    .fab-mobile { 
                        position: fixed; bottom: 2rem; left: 1.5rem; width: 64px; height: 64px; 
                        background: linear-gradient(135deg, #DD6B20 0%, #ED8936 100%); 
                        color: white !important; border: none; border-radius: 50%; 
                        display: flex !important; align-items: center !important; justify-content: center !important; 
                        box-shadow: 0 8px 16px rgba(221, 107, 32, 0.4); 
                        z-index: 1001; font-size: 2.8rem; font-weight: 300; line-height: 0; padding-bottom: 12px;
                    }
                }

                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .next-gen-loader { width: 48px; height: 48px; border: 4px solid #FEEBC8; border-top-color: #DD6B20; border-radius: 50%; animation: spin 0.8s linear infinite; }
            ` }} />
        </div>
    );
};

export default Achievement;
