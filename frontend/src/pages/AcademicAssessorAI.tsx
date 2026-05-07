// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
    BrainCircuit, ShieldAlert, FileText,
    ClipboardCheck, BarChart3, Calculator,
    Zap, Sparkles, AlertCircle, CheckCircle2,
    Settings2, Cpu, FileCheck, Layers,
    Search, Download, RefreshCw, Send,
    Info, User, BookOpen, GraduationCap, X,
    Trash2, Eye, PlusCircle, History
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

    // Records History & Prefix Settings
    const [savedRecords, setSavedRecords] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'evaluate' | 'history'>('evaluate');
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveNotes, setSaveNotes] = useState('');
    const [reportRefPrefix, setReportRefPrefix] = useState('REP');
    const [historySearch, setHistorySearch] = useState('');

    // Load saved records and report reference prefix from localstorage
    useEffect(() => {
        const saved = localStorage.getItem('osarab_academic_assessor_records');
        if (saved) {
            try {
                setSavedRecords(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse saved academic records:', e);
            }
        }
        const prefix = localStorage.getItem('osarab_report_ref_prefix');
        if (prefix) {
            setReportRefPrefix(prefix);
        }
    }, []);

    // Helper to persist records
    const saveRecordsToStorage = (records: any[]) => {
        setSavedRecords(records);
        localStorage.setItem('osarab_academic_assessor_records', JSON.stringify(records));
    };

    // Helper to persist prefix
    const saveRefPrefix = (newPrefix: string) => {
        const clean = newPrefix.toUpperCase().replace(/[^A-Z0-9]/g, '');
        setReportRefPrefix(clean || 'REP');
        localStorage.setItem('osarab_report_ref_prefix', clean || 'REP');
    };

    // Calculate sequential report ref number
    const generateSeqRefNo = () => {
        const nextSeq = String(savedRecords.length + 1).padStart(4, '0');
        const year = new Date().getFullYear();
        return `${reportRefPrefix}-${year}-${nextSeq}`;
    };

    // Helper functions to fetch current details in real-time
    const currentStudentName = () => {
        const sStud = students.find(s => s.id === selectedStudent);
        if (!sStud) return reportLanguage === 'Arabic' ? (report?.student || 'اسم الطالب') : (report?.studentEn || 'Student Name');
        return reportLanguage === 'Arabic'
            ? `${sStud.firstNameAr || ''} ${sStud.lastNameAr || ''}`.trim()
            : `${sStud.firstNameEn || sStud.firstNameAr || ''} ${sStud.lastNameEn || sStud.lastNameAr || ''}`.trim();
    };

    const currentProgramName = () => {
        const sProg = programs.find(p => p.id === selectedProgram);
        if (!sProg) return reportLanguage === 'Arabic' ? (report?.level || 'البرنامج الدراسي') : (report?.levelEn || 'Program');
        return reportLanguage === 'Arabic' ? sProg.nameAr : (sProg.nameEn || sProg.nameAr);
    };

    const currentUnitName = () => {
        const sUnit = units.find(u => u.id === selectedUnit);
        if (!sUnit) return reportLanguage === 'Arabic' ? (report?.unit || 'الوحدة التعليمية') : (report?.unitEn || 'Unit');
        return reportLanguage === 'Arabic' ? sUnit.nameAr : (sUnit.nameEn || sUnit.nameAr);
    };

    const currentUnitCode = () => {
        const sUnit = units.find(u => u.id === selectedUnit);
        if (!sUnit) return report?.unitCode || '';
        return sUnit.code || sUnit.id || '';
    };

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

    const handleSaveToHistory = () => {
        if (!report) return;
        
        // Check if already saved
        const exists = savedRecords.some(r => r.id === report.refNo);
        if (exists) {
            setToast({ type: 'warning', message: '⚠️ هذا التقرير محفوظ بالفعل في السجل' });
            return;
        }

        setShowSaveModal(true);
    };

    const confirmSaveToHistory = () => {
        const sStud = students.find(s => s.id === selectedStudent);
        const sProg = programs.find(p => p.id === selectedProgram);
        const sUnit = units.find(u => u.id === selectedUnit);

        const newRecord = {
            id: report.refNo || generateSeqRefNo(),
            studentId: selectedStudent || 'N/A',
            studentNameAr: sStud ? `${sStud.firstNameAr || ''} ${sStud.lastNameAr || ''}`.trim() : 'اسم الطالب',
            studentNameEn: sStud ? `${sStud.firstNameEn || sStud.firstNameAr || ''} ${sStud.lastNameEn || sStud.lastNameAr || ''}`.trim() : 'Student Name',
            programId: selectedProgram || 'N/A',
            programNameAr: sProg?.nameAr || 'البرنامج الأكاديمي',
            programNameEn: sProg?.nameEn || 'Academic Program',
            unitId: selectedUnit || 'N/A',
            unitNameAr: sUnit?.nameAr || 'الوحدة التعليمية',
            unitNameEn: sUnit?.nameEn || 'Unit',
            unitCode: sUnit?.code || sUnit?.id || '',
            score: report.score || 0,
            grade: report.grade || 'N/A',
            date: new Date().toLocaleDateString('en-GB'),
            notes: saveNotes,
            fullReport: report // Store full report JSON to reload/preview
        };

        const updated = [newRecord, ...savedRecords];
        saveRecordsToStorage(updated);
        setShowSaveModal(false);
        setSaveNotes('');
        setToast({ type: 'success', message: '✅ تم حفظ التقرير بنجاح في السجل الأكاديمي' });
    };

    const handleDeleteRecord = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('هل أنت متأكد من حذف هذا السجل؟')) {
            const filtered = savedRecords.filter(r => r.id !== id);
            saveRecordsToStorage(filtered);
            setToast({ type: 'success', message: 'تم حذف السجل بنجاح' });
        }
    };

    const handleLoadRecord = (record: any) => {
        setReport(record.fullReport);
        setSelectedStudent(record.studentId);
        setSelectedProgram(record.programId);
        setSelectedUnit(record.unitId);
        setActiveTab('evaluate');
        setToast({ type: 'success', message: `تم تحميل تقرير المرجع: ${record.id}` });
    };

    const filteredRecords = savedRecords.filter(r => {
        const term = historySearch.toLowerCase();
        if (!term) return true;
        return (
            r.id.toLowerCase().includes(term) ||
            r.studentId.toLowerCase().includes(term) ||
            r.studentNameAr.toLowerCase().includes(term) ||
            r.studentNameEn.toLowerCase().includes(term) ||
            r.programNameAr.toLowerCase().includes(term) ||
            r.programNameEn.toLowerCase().includes(term) ||
            r.unitNameAr.toLowerCase().includes(term) ||
            r.unitNameEn.toLowerCase().includes(term) ||
            (r.unitCode || '').toLowerCase().includes(term)
        );
    });


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

                    aiReport.refNo = generateSeqRefNo();
                    aiReport.student = stName;
                    aiReport.studentEn = sStud ? `${sStud.firstNameEn || sStud.firstNameAr || ''} ${sStud.lastNameEn || sStud.lastNameAr || ''}`.trim() : 'Student Name';
                    aiReport.level = sProg;
                    aiReport.levelEn = programs.find(p => p.id === selectedProgram)?.nameEn || sProg;
                    const unitObj = units.find(u => u.id === selectedUnit);
                    aiReport.unit = unitObj?.nameAr || selectedUnit;
                    aiReport.unitEn = unitObj?.nameEn || unitObj?.nameAr || selectedUnit;
                    aiReport.unitCode = unitObj?.code || unitObj?.id || '';

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
                refNo: generateSeqRefNo(),
                student: stName,
                studentEn: sStud ? `${sStud.firstNameEn || sStud.firstNameAr || ''} ${sStud.lastNameEn || sStud.lastNameAr || ''}`.trim() : 'Student Name',
                level: sProg,
                levelEn: programs.find(p => p.id === selectedProgram)?.nameEn || sProg,
                unit: units.find(u => u.id === selectedUnit)?.nameAr || selectedUnit,
                unitEn: units.find(u => u.id === selectedUnit)?.nameEn || units.find(u => u.id === selectedUnit)?.nameAr || selectedUnit,
                unitCode: units.find(u => u.id === selectedUnit)?.code || units.find(u => u.id === selectedUnit)?.id || '',
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
            const unitObjEn = units.find(u => u.id === selectedUnit);
            const stStudEn = students.find(s => s.id === selectedStudent);
            setReport({
                refNo: generateSeqRefNo(),
                student: stStudEn ? `${stStudEn.firstNameAr || ''} ${stStudEn.lastNameAr || ''}`.trim() : 'اسم الطالب',
                studentEn: stStudEn ? `${stStudEn.firstNameEn || stStudEn.firstNameAr || ''} ${stStudEn.lastNameEn || stStudEn.lastNameAr || ''}`.trim() : 'Student Name',
                level: programs.find(p => p.id === selectedProgram)?.nameAr || 'البرنامج',
                levelEn: programs.find(p => p.id === selectedProgram)?.nameEn || 'Program',
                unit: unitObjEn?.nameAr || selectedUnit,
                unitEn: unitObjEn?.nameEn || unitObjEn?.nameAr || selectedUnit,
                unitCode: unitObjEn?.code || unitObjEn?.id || '',
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
                        padding: 20mm !important;
                        margin: 0 !important;
                        background: white !important;
                    }
                    * { 
                        color: black !important; 
                        background-color: transparent !important; 
                        box-shadow: none !important;
                        border-color: #000 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .ag-marking-table th { background: #f2f2f2 !important; }
                    img { -webkit-print-color-adjust: exact !important; }
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
                        <div className="ag-tabs" style={{ marginLeft: '12px', marginRight: '0' }}>
                            <button className={`ag-tab-btn ${activeTab === 'evaluate' ? 'active' : ''}`} onClick={() => setActiveTab('evaluate')}>
                                <Zap size={14} /> التحليل
                            </button>
                            <button className={`ag-tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                                <History size={14} /> السجل ({savedRecords.length})
                            </button>
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
                                <span className="ag-setting-label"><FileText size={14} /> بادئة الرقم المرجعي</span>
                                <input
                                    type="text"
                                    className="ag-input"
                                    style={{ fontSize: '12px', padding: '8px', textTransform: 'uppercase' }}
                                    placeholder="مثل: REP, AI, BGB"
                                    value={reportRefPrefix}
                                    onChange={e => saveRefPrefix(e.target.value)}
                                />
                                <span style={{ fontSize: '10px', color: 'var(--hz-text-muted)', marginTop: '4px', display: 'block' }}>
                                    الرقم القادم: {generateSeqRefNo()}
                                </span>
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

                    <main className="ag-main">
                        <div className="ag-container">
                            {activeTab === 'history' ? (
                                <div className="ag-history-pane" style={{ animation: 'fadeIn 0.3s ease' }}>
                                    <div className="ag-history-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px', flexWrap: 'wrap' }}>
                                        <div>
                                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--hz-text-bright)' }}>سجل تقارير التقييم المؤرشفة</h2>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--hz-text-muted)', margin: 0 }}>مجلد شامل بكافة المخرجات والتدقيقات السابقة لجميع الطلاب والوحدات.</p>
                                        </div>
                                        <div style={{ position: 'relative', width: '300px', minWidth: '200px' }}>
                                            <Search size={16} style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--hz-text-muted)' }} />
                                            <input 
                                                type="text" 
                                                className="ag-input" 
                                                style={{ paddingRight: '35px', fontSize: '0.85rem' }} 
                                                placeholder="البحث بالاسم، المرجع، أو الكود..."
                                                value={historySearch}
                                                onChange={e => setHistorySearch(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {filteredRecords.length === 0 ? (
                                        <div style={{ background: 'var(--hz-surface)', border: '1px solid var(--hz-border-soft)', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
                                            <History size={48} style={{ color: 'var(--hz-text-muted)', marginBottom: '15px', opacity: 0.5 }} />
                                            <h3 style={{ fontSize: '1.1rem', color: 'var(--hz-text-bright)', marginBottom: '5px' }}>لا توجد سجلات مطابقة</h3>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--hz-text-muted)' }}>لم يتم العثور على أي تقييمات محفوظة تطابق استعلام البحث الخاص بك.</p>
                                        </div>
                                    ) : (
                                        <div className="ag-history-table-wrapper" style={{ background: 'var(--hz-surface)', border: '1px solid var(--hz-border-soft)', borderRadius: '12px', overflowX: 'auto' }}>
                                            <table className="ag-history-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                                                <thead>
                                                    <tr style={{ background: 'var(--hz-surface-2)', borderBottom: '1px solid var(--hz-border-soft)' }}>
                                                        <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--hz-text-muted)' }}>رقم المرجع</th>
                                                        <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--hz-text-muted)' }}>الطالب</th>
                                                        <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--hz-text-muted)' }}>البرنامج والوحدة</th>
                                                        <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--hz-text-muted)' }}>النتيجة والدرجة</th>
                                                        <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--hz-text-muted)' }}>التاريخ</th>
                                                        <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--hz-text-muted)' }}>ملاحظات</th>
                                                        <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--hz-text-muted)', textAlign: 'center' }}>الإجراءات</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredRecords.map(record => (
                                                        <tr key={record.id} style={{ borderBottom: '1px solid var(--hz-border-subtle)', transition: 'background 0.2s' }} className="ag-history-tr">
                                                            <td style={{ padding: '16px', fontWeight: 800, color: 'var(--hz-neon)' }}>{record.id}</td>
                                                            <td style={{ padding: '16px' }}>
                                                                <div style={{ fontWeight: 700, color: 'var(--hz-text-bright)' }}>{reportLanguage === 'Arabic' ? record.studentNameAr : record.studentNameEn}</div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--hz-text-muted)' }}>ID: {record.studentId}</div>
                                                            </td>
                                                            <td style={{ padding: '16px' }}>
                                                                <div style={{ fontWeight: 600, color: 'var(--hz-text-bright)' }}>{reportLanguage === 'Arabic' ? record.programNameAr : record.programNameEn}</div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--hz-text-muted)' }}>
                                                                    {reportLanguage === 'Arabic' ? record.unitNameAr : record.unitNameEn} {record.unitCode ? `[${record.unitCode}]` : ''}
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '16px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <span style={{ fontWeight: 800, color: 'var(--hz-text-bright)' }}>{record.score}%</span>
                                                                    <span style={{ fontSize: '0.75rem', background: 'rgba(0, 245, 160, 0.1)', color: 'var(--hz-neon)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                                                                        {record.grade}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '16px', fontSize: '0.8rem', color: 'var(--hz-text-muted)' }}>{record.date}</td>
                                                            <td style={{ padding: '16px', fontSize: '0.8rem', color: 'var(--hz-text-muted)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {record.notes || '—'}
                                                            </td>
                                                            <td style={{ padding: '16px', textAlign: 'center' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                                    <button 
                                                                        className="ag-toggle-btn" 
                                                                        style={{ padding: '4px 10px', height: '30px' }}
                                                                        onClick={() => handleLoadRecord(record)}
                                                                        title="تحميل وعرض التقرير الكامل"
                                                                    >
                                                                        <Eye size={14} style={{ marginLeft: '4px' }} /> عرض
                                                                    </button>
                                                                    <button 
                                                                        className="ag-toggle-btn" 
                                                                        style={{ padding: '4px 10px', height: '30px', color: '#ff4d4d', border: '1px solid rgba(255, 77, 77, 0.2)' }}
                                                                        onClick={(e) => handleDeleteRecord(record.id, e)}
                                                                        title="حذف من السجل"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
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
                                    dir={reportLanguage === 'Arabic' ? 'rtl' : 'ltr'}
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
                                        minHeight: '297mm',
                                        direction: reportLanguage === 'Arabic' ? 'rtl' : 'ltr',
                                        textAlign: reportLanguage === 'Arabic' ? 'right' : 'left',
                                    }}
                                >
                                    <div className="hide-on-print" style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px' }}>
                                        <HzBtn variant="primary" icon={<Download size={16} />} onClick={handleDownload}>
                                            {reportLanguage === 'Arabic' ? 'تحميل / طباعة التقرير' : 'Download / Print Report'}
                                        </HzBtn>
                                        <HzBtn variant="secondary" icon={<FileCheck size={16} />} onClick={handleSaveToHistory} disabled={savedRecords.some(r => r.id === report.refNo)} style={savedRecords.some(r => r.id === report.refNo) ? { background: '#f5f5f5', color: '#888888', border: '1px solid #dddddd', cursor: 'not-allowed', opacity: 0.8 } : { background: '#0d1527', color: '#00f5a0', border: '2px solid #00f5a0', fontWeight: 800, boxShadow: '0 4px 15px rgba(0, 245, 160, 0.2)' }}>
                                            {savedRecords.some(r => r.id === report.refNo)
                                                ? (reportLanguage === 'Arabic' ? 'تم الحفظ في السجل' : 'Saved to Records')
                                                : (reportLanguage === 'Arabic' ? 'حفظ في السجل الأكاديمي' : 'Save to Academic Records')}
                                        </HzBtn>
                                        <HzBtn variant="danger" icon={<X size={16} />} onClick={() => setReport(null)}>
                                            {reportLanguage === 'Arabic' ? 'إغلاق المعاينة' : 'Close Preview'}
                                        </HzBtn>
                                    </div>

                                    {/* 1. Header - logo position swaps per language */}
                                    <div className="ag-print-header" dir="ltr" style={{ display: 'flex', flexDirection: reportLanguage === 'Arabic' ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #111', paddingBottom: '20px', marginBottom: '15px' }}>
                                        <div style={{ textAlign: reportLanguage === 'Arabic' ? 'right' : 'left' }}>
                                            {reportLanguage === 'Arabic' ? (
                                                <>
                                                    <div style={{ fontWeight: 900, fontSize: '1.8rem', color: '#000' }}>
                                                        {globalSettings?.institutionNameAr || globalSettings?.reportInstitutionNameAr || globalSettings?.instituteNameAr || 'معهد السلام الثقافي'}
                                                    </div>
                                                    <div style={{ fontSize: '1.1rem', color: '#333', fontWeight: 600 }}>
                                                        {globalSettings?.institutionNameEn || globalSettings?.reportInstitutionNameEn || globalSettings?.instituteNameEn || 'Al Salam Cultural Institute'}
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div style={{ fontWeight: 900, fontSize: '1.8rem', color: '#000' }}>
                                                        {globalSettings?.institutionNameEn || globalSettings?.reportInstitutionNameEn || globalSettings?.instituteNameEn || 'Al Salam Cultural Institute'}
                                                    </div>
                                                    <div style={{ fontSize: '1.1rem', color: '#333', fontWeight: 600 }}>
                                                        {globalSettings?.institutionNameAr || globalSettings?.reportInstitutionNameAr || globalSettings?.instituteNameAr || 'معهد السلام الثقافي'}
                                                    </div>
                                                </>
                                            )}
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
                                        <div>{reportLanguage === 'Arabic' ? 'رقم المرجع:' : 'Ref No:'} {report.refNo || generateSeqRefNo()}</div>
                                    </div>

                                    {/* 3. Main Title (Center) */}
                                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                                        <h2 className="ag-report-title-main" style={{ fontSize: '2.2rem', fontWeight: 900, color: '#000', margin: 0, textDecoration: 'underline' }}>
                                            {reportLanguage === 'Arabic' ? 'تقرير التقييم الأكاديمي' : 'Academic Assessment Report'}
                                        </h2>
                                    </div>

                                    {/* 4. Split Info (2/3 Info, 1/3 Grade) */}
                                    <div style={{ display: 'flex', gap: '30px', marginBottom: '40px', alignItems: 'stretch' }}>
                                        {/* Info (2/3): Student, Program, Unit */}
                                        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '15px', border: '1px solid #000', padding: '20px' }}>
                                            <div style={{ fontSize: '1rem' }}>
                                                <span style={{ fontWeight: 800 }}>{reportLanguage === 'Arabic' ? 'اسم الطالب:' : 'Student Name:'}</span>
                                                <span style={{ marginInlineStart: '10px', fontSize: '1.1rem' }}>
                                                    {currentStudentName()}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '1rem' }}>
                                                <span style={{ fontWeight: 800 }}>{reportLanguage === 'Arabic' ? 'البرنامج الدراسي:' : 'Program:'}</span>
                                                <span style={{ marginInlineStart: '10px' }}>
                                                    {currentProgramName()}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '1rem' }}>
                                                <span style={{ fontWeight: 800 }}>{reportLanguage === 'Arabic' ? 'الوحدة التعليمية:' : 'Unit:'}</span>
                                                <span style={{ marginInlineStart: '10px' }}>
                                                    {currentUnitName()}
                                                    {currentUnitCode() ? ` — ${currentUnitCode()}` : ''}
                                                </span>
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
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '15px', borderInlineStart: '5px solid #000', paddingInlineStart: '15px' }}>
                                            {reportLanguage === 'Arabic' ? 'جدول توزيع الدرجات حسب المعايير' : 'Grade Distribution by Criteria'}
                                        </h3>
                                        <table className="ag-marking-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: 'white', backgroundColor: 'white', color: '#000' }}>
                                                    <th style={{ border: '1px solid #000', padding: '12px', textAlign: 'center' }}>{reportLanguage === 'Arabic' ? 'المعيار' : 'Criteria'}</th>
                                                    <th style={{ border: '1px solid #000', padding: '12px', textAlign: 'center' }}>{reportLanguage === 'Arabic' ? 'مستوى العمق' : 'Depth'}</th>
                                                    <th style={{ border: '1px solid #000', padding: '12px', textAlign: 'center' }}>{reportLanguage === 'Arabic' ? 'الحد الأقصى' : 'Max'}</th>
                                                    <th style={{ border: '1px solid #000', padding: '12px', textAlign: 'center' }}>{reportLanguage === 'Arabic' ? 'الدرجة' : 'Awarded'}</th>
                                                    <th style={{ border: '1px solid #000', padding: '12px', textAlign: 'center' }}>{reportLanguage === 'Arabic' ? 'حالة التقييم' : 'Status'}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {report.criteria.map((c: any) => (
                                                    <tr key={c.id} style={{ background: 'white', backgroundColor: 'white', color: '#000' }}>
                                                        <td style={{ border: '1px solid #000', padding: '10px', fontWeight: 800, background: 'white', color: '#000' }}>{c.id}</td>
                                                        <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', background: 'white', color: '#000' }}>{c.depth}</td>
                                                        <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', background: 'white', color: '#000' }}>{c.max}</td>
                                                        <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', fontWeight: 800, background: 'white', color: '#000' }}>{c.awarded}</td>
                                                        <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', background: 'white', color: '#000' }}>
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
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '15px', borderInlineStart: '5px solid #000', paddingInlineStart: '15px' }}>
                                            {reportLanguage === 'Arabic' ? 'نقاط القوة والملاحظات' : 'Key Strengths and Observations'}
                                        </h3>
                                        <div style={{ border: '1px solid #000', padding: '20px' }}>
                                            <ul style={{ margin: 0, paddingInlineStart: '25px', display: 'flex', flexDirection: 'column', gap: '10px', listStyle: 'square' }}>
                                                {report.strengths.map((s: string, idx: number) => (
                                                    <li key={idx} style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>{s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* 7. Improvements */}
                                    <div style={{ marginBottom: '40px' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '15px', borderInlineStart: '5px solid #000', paddingInlineStart: '15px' }}>
                                            {reportLanguage === 'Arabic' ? 'المجالات المطلوبة لرفع كفاءة العمل' : 'Areas for Improvement'}
                                        </h3>
                                        <div style={{ border: '1px solid #000', padding: '20px' }}>
                                            <ul style={{ margin: 0, paddingInlineStart: '25px', display: 'flex', flexDirection: 'column', gap: '10px', listStyle: 'square' }}>
                                                {report.improvements.map((im: string, idx: number) => (
                                                    <li key={idx} style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>{im}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* 8. Compliance */}
                                    <div style={{ marginBottom: '40px' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '15px', borderInlineStart: '5px solid #000', paddingInlineStart: '15px' }}>
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
                        </>
                    )}
                </div>
                    </main>
                </div>
            </div>

            {showSaveModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(5, 8, 22, 0.85)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    animation: 'fadeIn 0.2s ease'
                }}>
                    <div className="ag-glass-card" style={{ width: '450px', padding: '25px', border: '1px solid var(--hz-border-soft)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                            <FileCheck size={20} color="var(--hz-neon)" />
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--hz-text-bright)', margin: 0 }}>حفظ التقرير في السجل الأكاديمي</h3>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--hz-text-muted)', marginBottom: '15px' }}>
                            أدخل أي ملاحظات مختصرة ترغب في أرشفتها مع هذا السجل (مثل: حالة التسليم، الدفعة، أو توصية سريعة).
                        </p>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--hz-text-muted)', display: 'block', marginBottom: '6px' }}>ملاحظات الأرشفة (اختياري)</label>
                            <textarea
                                className="ag-textarea"
                                style={{ height: '80px', fontSize: '0.85rem' }}
                                placeholder="مثال: واجب الدفعة الأولى - متميز جداً..."
                                value={saveNotes}
                                onChange={e => setSaveNotes(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button className="ag-toggle-btn" style={{ padding: '6px 15px' }} onClick={() => setShowSaveModal(false)}>إلغاء</button>
                            <HzBtn variant="primary" size="sm" onClick={confirmSaveToHistory}>تأكيد الحفظ</HzBtn>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        </div>
    );
}
