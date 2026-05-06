// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
    BrainCircuit, ShieldAlert, FileText,
    ClipboardCheck, BarChart3, Calculator,
    Zap, Sparkles, AlertCircle, CheckCircle2,
    Settings2, Cpu, FileCheck, Layers,
    Search, Download, RefreshCw, Send,
    Info, User, BookOpen, GraduationCap, X
} from 'lucide-react';
import { Toast, ToastType } from '../components/Toast';
import {
    HzBtn, HzBadge, HzLoader, HzEmpty, HzInput, HzSelect
} from '../layouts/Rapidos2026/components/RapidosUI';
import { academicService } from '../services/academic.service';
import { studentService } from '../services/student.service';
import { settingsService, SystemSettings } from '../services/settings.service';

import './AcademicAssessorAI.css';

/**
 * ACADEMIC ASSESSOR AI (Assessor Decision AI)
 * Automated Academic Draft Assessor based on Rapidos 2026 Design.
 */
export default function AcademicAssessorAI() {
    const [loading, setLoading] = useState(false);
    const [processingStep, setProcessingStep] = useState(0);
    const [assignment, setAssignment] = useState('');
    const [rubric, setRubric] = useState('');
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

    // Dynamic Data
    const [programs, setPrograms] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const [selectedProgram, setSelectedProgram] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');
    const [globalSettings, setGlobalSettings] = useState<SystemSettings | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoadingData(true);
        try {
            // Fetch core academic data
            const [progRes, uRes, stRes] = await Promise.all([
                academicService.getPrograms(),
                academicService.getUnits(),
                studentService.getStudents()
            ]);

            setPrograms(progRes.data?.programs || []);
            setUnits(uRes.data?.units || []);
            setStudents(stRes.data?.students || []);

            // Fetch settings separately to not block academic data if it fails
            try {
                const settingsRes = await settingsService.getSettings();
                if (settingsRes.success && settingsRes.data?.settings) {
                    setGlobalSettings(settingsRes.data.settings);
                }
            } catch (settingsErr) {
                console.error('Failed to load global settings:', settingsErr);
            }

        } catch (err) {
            console.error('Error loading academic data:', err);
            setToast({ type: 'error', message: 'فشل في تحميل البيانات الأساسية' });
        } finally {
            setLoadingData(false);
        }
    };

    // Settings States
    const [engineMode, setEngineMode] = useState('Professional API');
    const [apiKeyStore, setApiKeyStore] = useState('');
    const [evalMode, setEvalMode] = useState('Strict');
    const [reportLanguage, setReportLanguage] = useState<'Arabic' | 'English'>('Arabic');
    const [options, setOptions] = useState({
        moodle: true,
        integrity: true,
        critical: true
    });

    const [report, setReport] = useState<any>(null);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [isTestingKey, setIsTestingKey] = useState(false);

    // Initialize API Key from LocalStorage
    useEffect(() => {
        const savedKey = localStorage.getItem('osarab_gemini_api_key');
        if (savedKey) setApiKeyStore(savedKey);

        const savedMode = localStorage.getItem('osarab_ai_engine_mode');
        if (savedMode) setEngineMode(savedMode);
    }, []);

    // Save API Key and Engine Mode when changed
    useEffect(() => {
        if (apiKeyStore) localStorage.setItem('osarab_gemini_api_key', apiKeyStore);
        if (engineMode) localStorage.setItem('osarab_ai_engine_mode', engineMode);
    }, [apiKeyStore, engineMode]);

    const steps = [
        { id: 1, label: 'استخراج الأدلة', icon: <FileText size={18} /> },
        { id: 2, label: 'مطابقة المعايير', icon: <Layers size={18} /> },
        { id: 3, label: 'تحليل العمق', icon: <BarChart3 size={18} /> },
        { id: 4, label: 'توزيع الدرجات', icon: <Calculator size={18} /> },
        { id: 5, label: 'التصنيف النهائي', icon: <GraduationCap size={18} /> }
    ];

    const handleRunAssessment = () => {
        if (!selectedProgram || !selectedUnit || !selectedStudent) {
            setToast({ type: 'error', message: '⚠️ برجاء تحديد البرنامج والوحدة والطالب أولاً' });
            return;
        }

        if (!assignment || !rubric) {
            setToast({ type: 'error', message: '⚠️ برجاء إدخال الواجب والروبريك (Rubric) قبل البدء' });
            return;
        }

        // Pre-evaluation Validation Mock
        if (assignment.length < 30) {
            setToast({ type: 'error', message: '⚠ Submission does not match the Rubric. No evidence addressing Learning Outcomes was identified. Please verify assignment content.' });
            return;
        }

        setLoading(true);
        setProcessingStep(1);
        setReport(null);

        if (engineMode === 'Professional API' && !apiKeyStore && !import.meta.env.VITE_GEMINI_API_KEY) {
            setToast({ type: 'error', message: '⚠️ برجاء توفير API Key للذكاء الاصطناعي' });
            setLoading(false);
            return;
        }

        // Simulate AI Processing Sequence Steps visually
        let step = 1;
        const interval = setInterval(() => {
            if (step < 5) {
                step++;
                setProcessingStep(step);
            }
        }, 1200);

        if (engineMode === 'Professional API') {
            academicService.analyzeAssignment({
                assignment,
                rubric,
                options: {
                    evalMode,
                    language: reportLanguage,
                    moodle: options.moodle,
                    integrity: options.integrity,
                    critical: options.critical
                },
                apiKey: apiKeyStore || import.meta.env.VITE_GEMINI_API_KEY
            }).then(res => {
                clearInterval(interval);
                setProcessingStep(5);
                setTimeout(() => {
                    const aiReport = res.data.report;
                    // Inject details into AI report
                    const sProg = programs.find(p => p.id === selectedProgram)?.nameAr || "البرنامج المحدد";
                    const sUnit = units.find(u => u.id === selectedUnit)?.nameAr || selectedUnit;
                    const sStud = students.find(s => s.id === selectedStudent);
                    const stName = sStud ? `${sStud.firstNameAr || ''} ${sStud.lastNameAr || ''}` : "اسم الطالب";

                    aiReport.student = stName;
                    aiReport.level = sProg;
                    aiReport.unit = sUnit;

                    setReport(aiReport);
                    setLoading(false);
                }, 1000);
            }).catch(err => {
                clearInterval(interval);
                setLoading(false);
                const msg = err.response?.data?.error?.message || 'حدث خطأ في الاتصال بالخادم';
                setToast({ type: 'error', message: `⚠️ ${msg}` });
                console.error(err);
            });
        } else {
            // Free mode (Mock)
            setTimeout(() => {
                clearInterval(interval);
                setProcessingStep(5);
                setTimeout(() => {
                    generateReport();
                    setLoading(false);
                }, 500);
            }, 6000);
        }
    };

    const generateReport = () => {
        // Find names for mock report
        const sProg = programs.find(p => p.id === selectedProgram)?.nameAr || "البرنامج المحدد";
        const sUnit = units.find(u => u.id === selectedUnit)?.nameAr || selectedUnit;
        const sStud = students.find(s => s.id === selectedStudent);
        const stName = sStud ? `${sStud.firstNameAr || ''} ${sStud.lastNameAr || ''}` : "اسم الطالب";

        // Mock data based on the requested prompt structure
        if (reportLanguage === 'Arabic') {
            setReport({
                student: stName,
                level: sProg,
                unit: sUnit,
                outcome: "تم تقييم المهام بنجاح عبر النظام التجريبي",
                score: 85,
                grade: "امتياز",
                criteria: [
                    { id: "P1", max: 20, awarded: 18, status: "محقق", depth: "تحليلي", desc: "أظهر الطالب فهماً ممتازاً للمتغيرات والأنواع البرمجية." },
                    { id: "P2", max: 20, awarded: 16, status: "محقق", depth: "تحليلي", desc: "بنية منطقية متماسكة في كتابة الكود." },
                    { id: "M1", max: 30, awarded: 28, status: "محقق", depth: "تحليلي", desc: "تحليل نقدي ممتاز لاستخدام الحلقات التكرارية." },
                    { id: "D1", max: 30, awarded: 23, status: "محقق", depth: "تحليلي", desc: "تقييم مفصل لتقنيات التحسين." }
                ],
                strengths: [
                    "هيكل أكاديمي منظم وواضح",
                    "توثيق جيد للمراجع العلمية",
                    "تسلسل منطقي في طرح الأفكار"
                ],
                improvements: [
                    "يحتاج إلى تعزيز التحليل النقدي في التوصيات",
                    "التأكد من مطابقة كافة معايير التنسيق المطلوبة"
                ],
                integrity: "نتيجة فحص الأصالة 98% (تم اجتياز المراجعة)",
                thinking: "أظهر الطالب مهارات تحليلية جيدة في مناقشة النتائج."
            });
        } else {
            setReport({
                student: stName,
                level: sProg,
                unit: sUnit,
                outcome: "Tasks assessed successfully via Mock System",
                score: 85,
                grade: "Distinction",
                criteria: [
                    { id: "P1", max: 20, awarded: 18, status: "Achieved", depth: "Analytical", desc: "Showed clear understanding of variables and types." },
                    { id: "P2", max: 20, awarded: 16, status: "Achieved", depth: "Analytical", desc: "Coherent logical structure in code." },
                    { id: "M1", max: 30, awarded: 28, status: "Achieved", depth: "Analytical", desc: "Excellent critical analysis of loops." },
                    { id: "D1", max: 30, awarded: 23, status: "Achieved", depth: "Analytical", desc: "Detailed evaluation of optimization techniques." }
                ],
                strengths: ["Strong analytical depth", "Excellent referencing", "Detailed justification"],
                improvements: ["More critical evaluation needed in D1", "Minor formatting tweaks"],
                integrity: "98% Originality Score (AI passed)",
                thinking: "Demonstrated high levels of Bloom's Taxonomy."
            });
        }
    };

    const handleDownload = () => {
        if (!report) return;
        window.print();
    };

    const handleTestKey = async () => {
        if (!apiKeyStore) {
            setToast({ type: 'warning', message: 'يرجى إدخال مفتاح API أولاً' });
            return;
        }
        setIsTestingKey(true);
        try {
            // Using a very small request to test connectivity
            const res = await academicService.analyzeAssignment({
                assignment: "Ping",
                rubric: "Respond with JSON status ok",
                options: { evalMode: 'Moderate', moodle: false, integrity: false, critical: false },
                apiKey: apiKeyStore
            });
            if (res.success) {
                setToast({ type: 'success', message: '✅ المفتاح يعمل بشكل صحيح واستجاب المحرك!' });
            } else {
                setToast({ type: 'error', message: '❌ فشل الاختبار: ' + (res.error?.message || 'خطأ غير معروف') });
            }
        } catch (err: any) {
            setToast({ type: 'error', message: '❌ خطأ في الاتصال: ' + (err.message || 'المفتاح غير صالح') });
        } finally {
            setIsTestingKey(false);
        }
    };

    return (
        <div style={{ padding: '0 24px 24px' }}>
            <div className="ag-root">
                {/* ── HEADER ── */}
                <header className="ag-header">
                    <div className="ag-header-left">
                        <h1 className="ag-title">
                            <BrainCircuit size={22} className="ag-icon-neon" /> <span>المقيّم الذكي</span>
                        </h1>
                        <div className="ag-ai-status hide-on-mobile">
                            <span className="ag-pulse"></span>
                            المحرك العصبي نشط
                        </div>
                    </div>

                    <div className="ag-header-right">
                        <div className="ag-tabs hide-on-mobile" style={{ marginLeft: '12px', marginRight: '0' }}>
                            <button className="ag-tab-btn active">التحليل</button>
                            <button className="ag-tab-btn">السجل</button>
                        </div>
                        <div className="ag-header-actions">
                            <button
                                className="ag-mobile-filter-btn"
                                onClick={() => setShowMobileSidebar(true)}
                            >
                                <Settings2 size={20} />
                            </button>
                            <HzBtn variant="primary" size="sm" onClick={() => window.location.reload()} className="ag-reset-btn">
                                <RefreshCw size={14} /> <span className="hide-on-mobile">إعادة الضبط</span>
                            </HzBtn>
                        </div>
                    </div>
                </header>

                <div className="ag-body">
                    {/* ── MOBILE OVERLAY ── */}
                    <div className={`ag-mobile-overlay ${showMobileSidebar ? 'active' : ''}`} onClick={() => setShowMobileSidebar(false)}></div>

                    {/* ── SIDEBAR (SETTINGS) ── */}
                    <aside className={`ag-sidebar ${showMobileSidebar ? 'active' : ''}`}>
                        <div className="ag-sidebar-head">
                            <span className="ag-sidebar-head-title">إعدادات المحرك</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Settings2 size={16} className="hide-on-mobile" />
                                <button
                                    className="ag-sidebar-close-btn"
                                    onClick={() => setShowMobileSidebar(false)}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="ag-sidebar-pane">
                            <div className="ag-setting-group">
                                <span className="ag-setting-label"><Cpu size={14} /> وضع المعالجة</span>
                                <div className="ag-toggle-group">
                                    <button className={`ag-toggle-btn ${engineMode === 'Professional API' ? 'active' : ''}`} onClick={() => setEngineMode('Professional API')}>Gemini Pro</button>
                                    <button className={`ag-toggle-btn ${engineMode === 'OpenRouter' ? 'active' : ''}`} onClick={() => setEngineMode('OpenRouter')}>OpenRouter Free</button>
                                    <button className={`ag-toggle-btn ${engineMode === 'Free' ? 'active' : ''}`} onClick={() => setEngineMode('Free')}>تجريبي (Mock)</button>
                                </div>
                                <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                                    <input
                                        type="password"
                                        className="ag-input"
                                        style={{ flex: 1, fontSize: '11px', padding: '6px' }}
                                        placeholder={engineMode === 'OpenRouter' ? "مفتاح OpenRouter (sk-or-...)" : "مفتاح Gemini API"}
                                        value={apiKeyStore}
                                        onChange={e => setApiKeyStore(e.target.value)}
                                    />
                                    <button 
                                        className="ag-toggle-btn" 
                                        style={{ padding: '0 10px', fontSize: '10px', height: '30px' }}
                                        onClick={handleTestKey}
                                        disabled={isTestingKey}
                                    >
                                        {isTestingKey ? '...' : 'فحص'}
                                    </button>
                                </div>
                            </div>

                            <div className="ag-setting-group">
                                <span className="ag-setting-label"><Layers size={14} /> لغة التقرير</span>
                                <div className="ag-toggle-group">
                                    <button className={`ag-toggle-btn ${reportLanguage === 'Arabic' ? 'active' : ''}`} onClick={() => setReportLanguage('Arabic')}>العربية</button>
                                    <button className={`ag-toggle-btn ${reportLanguage === 'English' ? 'active' : ''}`} onClick={() => setReportLanguage('English')}>English</button>
                                </div>
                            </div>

                            <div className="ag-setting-group">
                                <span className="ag-setting-label"><ShieldAlert size={14} /> حساسية التقييم</span>
                                <div className="ag-toggle-group">
                                    <button className={`ag-toggle-btn ${evalMode === 'Moderate' ? 'active' : ''}`} onClick={() => setEvalMode('Moderate')}>متوسطة</button>
                                    <button className={`ag-toggle-btn ${evalMode === 'Strict' ? 'active' : ''}`} onClick={() => setEvalMode('Strict')}>صارمة</button>
                                </div>
                            </div>

                            <div className="ag-setting-group" style={{ marginTop: '10px' }}>
                                <span className="ag-setting-label"><FileCheck size={14} /> خيارات المخرجات</span>
                                <div className="ag-checkbox-group">
                                    <span style={{ fontSize: '0.8rem' }}>ملاحظات المنصة (Moodle)</span>
                                    <input type="checkbox" checked={options.moodle} onChange={(e) => setOptions({ ...options, moodle: e.target.checked })} />
                                </div>
                                <div className="ag-checkbox-group">
                                    <span style={{ fontSize: '0.8rem' }}>مراجعة النزاهة الأكاديمية</span>
                                    <input type="checkbox" checked={options.integrity} onChange={(e) => setOptions({ ...options, integrity: e.target.checked })} />
                                </div>
                                <div className="ag-checkbox-group">
                                    <span style={{ fontSize: '0.8rem' }}>تحليل التفكير النقدي</span>
                                    <input type="checkbox" checked={options.critical} onChange={(e) => setOptions({ ...options, critical: e.target.checked })} />
                                </div>
                            </div>

                            <div style={{ marginTop: '20px', width: '100%' }}>
                                <HzBtn 
                                    variant="primary" 
                                    style={{ width: '100%', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                                    disabled={loading} 
                                    onClick={handleRunAssessment}
                                >
                                    <Sparkles size={16} style={{ marginLeft: '10px' }} /> {loading ? 'جاري المعالجة...' : 'ابدأ التقييم الآلي'}
                                </HzBtn>
                            </div>
                        </div>
                    </aside>

                    {/* ── MAIN CONTENT ── */}
                    <main className="ag-main">
                        <div className="ag-container">
                            {!report && !loading && (
                                <>
                                    <div className="ag-glass-card" style={{ padding: '20px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                                            <HzSelect
                                                label="برنامج التأهيل"
                                                value={selectedProgram}
                                                onChange={v => setSelectedProgram(v)}
                                                options={[{ value: '', label: 'اختر البرنامج...' }, ...programs.map(p => ({ value: p.id, label: p.nameAr || p.nameEn }))]}
                                            />
                                            <HzSelect
                                                label="وحدة التقييم"
                                                value={selectedUnit}
                                                onChange={v => setSelectedUnit(v)}
                                                options={[{ value: '', label: 'اختر الوحدة...' }, ...units.map(u => ({ value: u.id, label: `[${u.code}] ${u.nameAr || u.nameEn}` }))]}
                                            />
                                            <HzSelect
                                                label="الطالب المسجل"
                                                value={selectedStudent}
                                                onChange={v => setSelectedStudent(v)}
                                                options={[{ value: '', label: 'اختر الطالب...' }, ...students.map(s => ({ value: s.id, label: `${s.firstNameAr || s.firstNameEn} ${s.lastNameAr || s.lastNameEn}` }))]}
                                            />
                                        </div>
                                    </div>

                                    <div className="ag-input-grid">
                                        <div className="ag-glass-card">
                                            <div className="ag-card-title"><BookOpen size={18} color="var(--hz-neon)" /> إجابة الطالب (الواجب)</div>
                                            <p className="ag-card-desc">الصق عمل الطالب هنا (يدعم محتوى الوورد أو PDF عن طريق النسخ واللصق).</p>
                                            <textarea
                                                className="ag-textarea"
                                                placeholder="الصق محتوى الواجب أو الإجابة هنا..."
                                                value={assignment}
                                                onChange={(e) => setAssignment(e.target.value)}
                                            />
                                        </div>
                                        <div className="ag-glass-card">
                                            <div className="ag-card-title"><ClipboardCheck size={18} color="var(--hz-neon)" /> مقياس التقييم (Rubric)</div>
                                            <p className="ag-card-desc">مطلوب: معايير الوحدة والأوصاف المرتبطة بكل مستوى أو درجة.</p>
                                            <textarea
                                                className="ag-textarea"
                                                placeholder="الصق نموذج الإجابة أو الـ Rubric هنا..."
                                                value={rubric}
                                                onChange={(e) => setRubric(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px', background: 'rgba(0, 245, 160, 0.05)', borderRadius: '12px', border: '1px solid rgba(0, 245, 160, 0.2)' }}>
                                        <Info size={20} color="var(--hz-neon)" />
                                        <span style={{ fontSize: '0.9rem', color: 'var(--hz-text-bright)' }}>
                                            <strong>ملاحظة:</strong> هذا التقييم مسودة آلية. يبقى القرار النهائي دائمًا للمصرح الأكاديمي أو المقيّم البشري للمحاذاة والمراجعة النهائية.
                                        </span>
                                    </div>
                                </>
                            )}

                            {loading && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '50px', marginTop: '60px' }}>
                                    <div className="ag-stepper">
                                        {steps.map((s, idx) => (
                                            <div key={s.id} className={`ag-step ${processingStep === s.id ? 'active' : processingStep > s.id ? 'done' : ''}`}>
                                                <div className="ag-step-icon">{processingStep > s.id ? <CheckCircle2 size={24} /> : s.icon}</div>
                                                <span className="ag-step-label">{s.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'inline-block', marginBottom: '20px' }}>
                                            <HzLoader />
                                        </div>
                                        <h3 style={{ fontSize: '1.2rem', color: 'var(--hz-text-bright)' }}>جاري معالجة الإجابة وفقاً للمعايير...</h3>
                                        <p style={{ color: 'var(--hz-text-muted)' }}>نقوم بتعيين المخرجات التعليمية مع دلالات ومعايير الـ Rubric بأقصى دقة.</p>
                                    </div>
                                </div>
                            )}
                            {report && (
                                <div 
                                        id="printable-academic-report"
                                        className="ag-report-wrap" 
                                        style={{ 
                                            fontFamily: globalSettings?.reportFont || 'Tajawal',
                                            '--report-watermark-text': `"${globalSettings?.reportWatermarkText || 'CREATIVITY ERP - SMART ASSESSOR'}"`,
                                            '--report-watermark-display': globalSettings?.reportWatermarkType === 'none' ? 'none' : 'block',
                                            background: 'white',
                                            color: 'black',
                                            padding: '40px',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        {/* Professional Header for Print Only */}
                                        <div className="ag-print-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #111', paddingBottom: '20px', marginBottom: '30px' }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 900, fontSize: '1.8rem', color: '#000' }}>
                                                    {globalSettings?.institutionNameAr || globalSettings?.reportInstitutionNameAr || globalSettings?.instituteNameAr || 'معهد السلام الثقافي'}
                                                </div>
                                                <div style={{ fontSize: '1.1rem', color: '#333', fontWeight: 600 }}>
                                                    {globalSettings?.institutionNameEn || globalSettings?.reportInstitutionNameEn || globalSettings?.instituteNameEn || 'Al Salam Cultural Institute'}
                                                </div>
                                            </div>
                                            {globalSettings?.reportLogo && (
                                                <img 
                                                    src={globalSettings.reportLogo} 
                                                    alt="Logo" 
                                                    style={{ height: '100px', width: 'auto' }} 
                                                />
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666', marginBottom: '10px' }}>
                                            <div>{reportLanguage === 'Arabic' ? 'تاريخ التقرير:' : 'Report Date:'} {new Date().toLocaleDateString('en-GB')}</div>
                                            <div>{reportLanguage === 'Arabic' ? 'رقم المرجع:' : 'Ref No:'} AI-{Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
                                        </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <HzBadge color="neon" style={{ marginBottom: '10px' }}>مسودة معتمدة آلياً</HzBadge>
                                            <h2 className="ag-report-title-main" style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--hz-text-bright)' }}>
                                                {reportLanguage === 'Arabic' ? 'تقرير التقييم الأكاديمي' : 'Academic Assessment Report'}
                                            </h2>
                                            <div style={{ display: 'flex', gap: '24px', marginTop: '16px' }}>
                                                <div style={{ fontSize: '0.8rem' }}><span style={{ color: 'var(--hz-text-muted)' }}>{reportLanguage === 'Arabic' ? 'الطالب:' : 'Student:'}</span> <strong style={{ color: 'var(--hz-neon)' }}>{report.student}</strong></div>
                                                <div style={{ fontSize: '0.8rem' }}><span style={{ color: 'var(--hz-text-muted)' }}>{reportLanguage === 'Arabic' ? 'البرنامج:' : 'Program:'}</span> <strong style={{ color: 'var(--hz-text-bright)' }}>{report.level}</strong></div>
                                                <div style={{ fontSize: '0.8rem' }}><span style={{ color: 'var(--hz-text-muted)' }}>{reportLanguage === 'Arabic' ? 'الوحدة:' : 'Unit:'}</span> <strong style={{ color: 'var(--hz-text-bright)' }}>{report.unit}</strong></div>
                                            </div>
                                        </div>
                                        <div className="hide-on-print">
                                            <HzBtn variant="primary" icon={<Download size={16} />} onClick={handleDownload}>تحميل التقرير</HzBtn>
                                        </div>
                                    </div>

                                    <div className="ag-marking-section">
                                        <h3 className="ag-report-subtitle">
                                            {reportLanguage === 'Arabic' ? 'جدول توزيع الدرجات حسب المعايير' : 'Grading Distribution by Criteria'}
                                        </h3>
                                        <table className="ag-marking-table">
                                            <thead>
                                                <tr>
                                                    <th>{reportLanguage === 'Arabic' ? 'المعيار' : 'Criteria'}</th>
                                                    <th>{reportLanguage === 'Arabic' ? 'مستوى العمق' : 'Depth'}</th>
                                                    <th>{reportLanguage === 'Arabic' ? 'الحد الأقصى' : 'Max'}</th>
                                                    <th>{reportLanguage === 'Arabic' ? 'الدرجة' : 'Awarded'}</th>
                                                    <th>{reportLanguage === 'Arabic' ? 'حالة التقييم' : 'Status'}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {report.criteria.map((c: any) => (
                                                    <tr key={c.id} style={{ background: 'white' }}>
                                                        <td style={{ fontWeight: 800, color: '#111' }}>{c.id}</td>
                                                        <td style={{ color: '#444' }}>{c.depth}</td>
                                                        <td style={{ color: '#444' }}>{c.max}</td>
                                                        <td style={{ fontWeight: 800, color: '#000' }}>{c.awarded}</td>
                                                        <td>
                                                            <span className={`ag-grade-pill ${c.status === 'Achieved' ? 'achieved' : 'not-achieved'}`}>
                                                                {reportLanguage === 'Arabic' 
                                                                    ? (c.status === 'Achieved' ? 'محقق' : 'غير محقق')
                                                                    : c.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="ag-grade-box" style={{ background: 'white', border: '2px solid #000', borderRadius: '0' }}>
                                        <div className="ag-grade-primary">
                                            <span style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', fontWeight: 800 }}>
                                                {reportLanguage === 'Arabic' ? 'النسبة المقترحة آلياً' : 'Automated Suggested Score'}
                                            </span>
                                            <div className="ag-grade-val" style={{ color: '#000' }}>{report.score}%</div>
                                        </div>
                                        <div className={`ag-grade-pill ${report.grade.toLowerCase()}`} style={{ border: '1px solid #000', color: '#000', background: 'white' }}>
                                            {report.grade}
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                        <div className="ag-report-section">
                                            <h3 className="ag-report-subtitle">
                                                {reportLanguage === 'Arabic' ? 'النقاط أو القوة الرئيسية والملاحظات' : 'Key Strengths and Observations'}
                                            </h3>
                                            <ul style={{ paddingRight: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {report.strengths.map((s: string, idx: number) => (
                                                    <li key={idx} style={{ fontSize: '0.85rem' }}>• {s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="ag-report-section">
                                            <h3 className="ag-report-subtitle" style={{ color: 'var(--hz-gold)', borderColor: 'var(--hz-gold)' }}>
                                                {reportLanguage === 'Arabic' ? 'المجالات المطلوبة لرفع كفاءة العمل' : 'Required Areas for Improvement'}
                                            </h3>
                                            <ul style={{ paddingRight: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {report.improvements.map((s: string, idx: number) => (
                                                    <li key={idx} style={{ fontSize: '0.85rem' }}>• {s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="ag-report-section" style={{ borderTop: '1px solid var(--hz-border-subtle)', paddingTop: '30px', marginTop: '30px' }}>
                                        <h3 className="ag-report-subtitle" style={{ color: 'var(--hz-text-bright)', borderColor: 'var(--hz-text-bright)' }}>
                                            {reportLanguage === 'Arabic' ? 'إشعار الامتثال النهائي' : 'Final Compliance Notice'}
                                        </h3>
                                        <div style={{ padding: '24px', background: 'transparent', borderRadius: '16px', border: '1px solid #eee' }}>
                                            <p style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--hz-text-secondary)' }}>
                                                تمت مراجعة هذا التقرير وتدقيقه وفقاً لمعايير الجودة الأكاديمية المعتمدة لضمان مطابقة مخرجات التعلم وتحقيق النزاهة العلمية.
                                                نتيجة التحقق من الأصالة (النزاهة الأكاديمية): <strong>{report.integrity}</strong>.
                                                <br /><br />
                                                <strong>التقييم النقدي:</strong> {report.thinking}
                                            </p>
                                            <div style={{ marginTop: '30px', borderTop: '1px solid var(--hz-border-soft)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ borderBottom: '1px solid var(--hz-text-bright)', width: '250px', paddingBottom: '10px', fontSize: '0.7rem' }}>
                                                    {reportLanguage === 'Arabic' ? 'توقيع المقيم المعتمد (الاعتماد النهائي)' : 'Authorized Assessor Signature (Final Approval)'}
                                                </div>
                                                <div style={{ borderBottom: '1px solid var(--hz-text-bright)', width: '150px', paddingBottom: '10px', fontSize: '0.7rem' }}>
                                                    {reportLanguage === 'Arabic' ? 'تاريخ الاعتماد' : 'Approval Date'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        </div>
    );
}
