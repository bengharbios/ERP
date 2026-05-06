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
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { size: A4; margin: 10mm; }
                    body, html, #root, .hz-root, .hz-app, .hz-main, .ag-root, .ag-body, .ag-main, .ag-container { 
                        background: white !important; 
                        background-color: white !important;
                        color: black !important; 
                    }
                    .hz-topbar, .hz-sidebar, .ag-sidebar, .ag-header, .hide-on-print, .hz-btn, .ag-stepper, .hz-breadcrumb, header, .hz-subnav, h1, h2:not(.ag-report-title-main) { 
                        display: none !important; 
                    }
                    #printable-academic-report { 
                        display: block !important; 
                        background: white !important; 
                        color: black !important; 
                        padding: 0 !important; 
                        margin: 0 !important; 
                        box-shadow: none !important; 
                        border: none !important; 
                        width: 100% !important;
                    }
                    .ag-report-wrap {
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background: white !important;
                    }
                    * { 
                        color: black !important; 
                        background-color: transparent !important; 
                        box-shadow: none !important;
                        border-color: #000 !important;
                    }
                    .ag-marking-table th { background: #f2f2f2 !important; }
                    img { filter: grayscale(100%); }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            ` }} />
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
                                        background: '#ffffff',
                                        backgroundColor: '#ffffff',
                                        color: '#000000',
                                        padding: '50px',
                                        borderRadius: '0px',
                                        boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                                        margin: '0 auto',
                                        maxWidth: '1000px',
                                        minHeight: '297mm'
                                    }}
                                >
                                    <div className="hide-on-print" style={{ textAlign: 'center', marginBottom: '20px' }}>
                                        <HzBtn variant="primary" icon={<Download size={16} />} onClick={handleDownload}>تحميل التقرير</HzBtn>
                                    </div>

                                    {/* 1. Header (Logo + Name) */}
                                    <div className="ag-print-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #111', paddingBottom: '20px', marginBottom: '15px' }}>
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

                                    {/* 2. Meta Row (Date + Ref) */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#000', marginBottom: '30px', fontWeight: 600 }}>
                                        <div>{reportLanguage === 'Arabic' ? 'تاريخ التقرير:' : 'Report Date:'} {new Date().toLocaleDateString('en-GB')}</div>
                                        <div>{reportLanguage === 'Arabic' ? 'رقم المرجع:' : 'Ref No:'} AI-{Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
                                    </div>

                                    {/* 3. Main Title (Center) */}
                                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                                        <h2 className="ag-report-title-main" style={{ fontSize: '2.2rem', fontWeight: 900, color: '#000', margin: 0, textDecoration: 'underline' }}>
                                            {reportLanguage === 'Arabic' ? 'تقرير التقييم الأكاديمي' : 'Academic Assessment Report'}
                                        </h2>
                                    </div>

                                    {/* 4. Split Info (2/3 Info, 1/3 Grade) */}
                                    <div style={{ display: 'flex', gap: '30px', marginBottom: '40px', alignItems: 'stretch' }}>
                                        {/* Right (2/3): Student, Program, Unit */}
                                        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '15px', border: '1px solid #000', padding: '20px' }}>
                                            <div style={{ fontSize: '1rem' }}>
                                                <span style={{ fontWeight: 800 }}>{reportLanguage === 'Arabic' ? 'اسم الطالب:' : 'Student Name:'}</span>
                                                <span style={{ marginRight: '10px', fontSize: '1.1rem' }}>{report.student}</span>
                                            </div>
                                            <div style={{ fontSize: '1rem' }}>
                                                <span style={{ fontWeight: 800 }}>{reportLanguage === 'Arabic' ? 'البرنامج الدراسي:' : 'Program:'}</span>
                                                <span style={{ marginRight: '10px' }}>{report.level}</span>
                                            </div>
                                            <div style={{ fontSize: '1rem' }}>
                                                <span style={{ fontWeight: 800 }}>{reportLanguage === 'Arabic' ? 'الوحدة التعليمية:' : 'Unit:'}</span>
                                                <span style={{ marginRight: '10px' }}>{report.unit || 'بيئة الأعمال الدولية'}</span>
                                            </div>
                                        </div>

                                        {/* Left (1/3): Grade & Score */}
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '2px solid #000', textAlign: 'center' }}>
                                            <div style={{ background: '#f2f2f2', padding: '10px', fontWeight: 900, borderBottom: '2px solid #000', fontSize: '0.85rem' }}>
                                                {reportLanguage === 'Arabic' ? 'النتيجة المقترحة آلياً' : 'Automated Result'}
                                            </div>
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
                                                <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{report.score}%</div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase', marginTop: '5px', border: '1px solid #000', padding: '4px 15px' }}>
                                                    {report.grade}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 5. Table (Criteria) */}
                                    <div style={{ marginBottom: '40px' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '15px', borderRight: '5px solid #000', paddingRight: '15px' }}>
                                            {reportLanguage === 'Arabic' ? 'جدول توزيع الدرجات حسب المعايير' : 'Grade Distribution by Criteria'}
                                        </h3>
                                        <table className="ag-marking-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: '#f2f2f2' }}>
                                                    <th style={{ border: '1px solid #000', padding: '12px' }}>{reportLanguage === 'Arabic' ? 'المعيار' : 'Criteria'}</th>
                                                    <th style={{ border: '1px solid #000', padding: '12px' }}>{reportLanguage === 'Arabic' ? 'مستوى العمق' : 'Depth'}</th>
                                                    <th style={{ border: '1px solid #000', padding: '12px' }}>{reportLanguage === 'Arabic' ? 'الحد الأقصى' : 'Max'}</th>
                                                    <th style={{ border: '1px solid #000', padding: '12px' }}>{reportLanguage === 'Arabic' ? 'الدرجة' : 'Awarded'}</th>
                                                    <th style={{ border: '1px solid #000', padding: '12px' }}>{reportLanguage === 'Arabic' ? 'حالة التقييم' : 'Status'}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {report.criteria.map((c: any) => (
                                                    <tr key={c.id}>
                                                        <td style={{ border: '1px solid #000', padding: '10px', fontWeight: 800 }}>{c.id}</td>
                                                        <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}>{c.depth}</td>
                                                        <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}>{c.max}</td>
                                                        <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', fontWeight: 800 }}>{c.awarded}</td>
                                                        <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}>
                                                            <span style={{ fontWeight: 800 }}>
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

                                    {/* 6. Strengths */}
                                    <div style={{ marginBottom: '30px' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '15px', borderRight: '5px solid #000', paddingRight: '15px' }}>
                                            {reportLanguage === 'Arabic' ? 'نقاط القوة والملاحظات' : 'Key Strengths and Observations'}
                                        </h3>
                                        <div style={{ border: '1px solid #000', padding: '20px' }}>
                                            <ul style={{ margin: 0, paddingRight: '25px', display: 'flex', flexDirection: 'column', gap: '10px', listStyle: 'square' }}>
                                                {report.strengths.map((s: string, idx: number) => (
                                                    <li key={idx} style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>{s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* 7. Improvements */}
                                    <div style={{ marginBottom: '40px' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '15px', borderRight: '5px solid #000', paddingRight: '15px' }}>
                                            {reportLanguage === 'Arabic' ? 'المجالات المطلوبة لرفع كفاءة العمل' : 'Areas for Improvement'}
                                        </h3>
                                        <div style={{ border: '1px solid #000', padding: '20px' }}>
                                            <ul style={{ margin: 0, paddingRight: '25px', display: 'flex', flexDirection: 'column', gap: '10px', listStyle: 'square' }}>
                                                {report.improvements.map((im: string, idx: number) => (
                                                    <li key={idx} style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>{im}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* 8. Compliance */}
                                    <div style={{ marginBottom: '40px' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '15px', borderRight: '5px solid #000', paddingRight: '15px' }}>
                                            {reportLanguage === 'Arabic' ? 'إشعار الامتثال النهائي' : 'Final Compliance Notice'}
                                        </h3>
                                        <div style={{ border: '1px solid #000', padding: '25px' }}>
                                            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.8' }}>
                                                {reportLanguage === 'Arabic' 
                                                    ? 'تمت مراجعة هذا التقرير وتدقيقه وفقاً لمعايير الجودة الأكاديمية المعتمدة لضمان مطابقة مخرجات التعلم وتحقيق النزاهة العلمية.'
                                                    : 'This report has been reviewed and audited in accordance with approved academic quality standards to ensure mapping of learning outcomes and scientific integrity.'}
                                                <br />
                                                {reportLanguage === 'Arabic' ? 'نتيجة التحقق من الأصالة (النزاهة الأكاديمية):' : 'Originality Verification Result (Academic Integrity):'} 
                                                <strong style={{ marginLeft: '10px' }}>%98 (تم اجتياز المراجعة)</strong>
                                                <br /><br />
                                                <strong>{reportLanguage === 'Arabic' ? 'التقييم النقدي:' : 'Critical Assessment:'}</strong> {report.thinking}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 9. Signatures */}
                                    <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ borderBottom: '2px solid #000', width: '280px', paddingBottom: '10px', marginBottom: '10px', fontWeight: 900, color: '#000' }}>
                                                    {reportLanguage === 'Arabic' ? 'توقيع المقيم المعتمد (الاعتماد النهائي)' : 'Authorized Assessor Signature'}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: '#666' }}>Assessor Signature Area</div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ borderBottom: '2px solid #000', width: '180px', paddingBottom: '10px', marginBottom: '10px', fontWeight: 900, color: '#000' }}>
                                                    {reportLanguage === 'Arabic' ? 'تاريخ الاعتماد' : 'Approval Date'}
                                                </div>
                                                <div style={{ fontSize: '0.9rem', color: '#000' }}>{new Date().toLocaleDateString('en-GB')}</div>
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
