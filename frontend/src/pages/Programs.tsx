// @ts-nocheck
import { useState, useEffect } from 'react';
import { academicService, Program } from '../services/academic.service';
import { settingsService, ProgramLevel, AwardingBody } from '../services/settings.service';
import { Toast, ToastType } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
    BookOpen,
    Grid,
    List,
    Plus,
    Search,
    Filter,
    Clock,
    ChevronLeft,
    Edit3,
    Trash2,
    Eye,
    Archive,
    Award,
    Users,
    BarChart2,
    Building2,
    GripVertical
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Item Component
const SortableUnitItem = ({ id, unit, isSelected, onToggle }: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className={`unit-option ${isSelected ? 'selected' : ''}`}>
            <div {...attributes} {...listeners} style={{ cursor: 'grab', marginLeft: '0.75rem', color: '#CBD5E0', display: 'flex', alignItems: 'center' }}>
                <GripVertical size={16} />
            </div>
            <div
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                onClick={() => onToggle(unit.id)}
            >
                <div className="unit-info" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#718096', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{unit.code}</span>
                    <strong style={{ fontSize: '0.9rem', color: '#2D3748' }}>{unit.nameAr}</strong>
                </div>
                <div
                    className="selection-indicator"
                    style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: isSelected ? '#38A169' : '#EDF2F7',
                        color: isSelected ? 'white' : '#A0AEC0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem', fontWeight: 'bold', transition: 'all 0.2s',
                        marginRight: '0.5rem'
                    }}
                >
                    {isSelected ? '✔' : '+'}
                </div>
            </div>
        </div>
    );
};

export default function Programs() {
    const settings = useSettingsStore((state) => state.settings);
    const activeTemplate = settings?.activeTemplate || 'legacy';

    const [programs, setPrograms] = useState<Program[]>([]);
    const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]);
    const [levels, setLevels] = useState<ProgramLevel[]>([]);
    const [awardingBodies, setAwardingBodies] = useState<AwardingBody[]>([]);
    const [loading, setLoading] = useState(true);
    const [allUnits, setAllUnits] = useState<any[]>([]);
    const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showDetails, setShowDetails] = useState<Program | null>(null);
    const [editingProgram, setEditingProgram] = useState<Program | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    // Search and Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState('');
    const [filterBody, setFilterBody] = useState('');
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [showHeader, setShowHeader] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    // Drag and Drop Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setSelectedUnits((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over!.id as string);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }


    // Toast and Confirm Dialog states
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        title: string;
        message: string;
        type: 'danger' | 'warning' | 'info';
        onConfirm: () => void;
    } | null>(null);

    const [formData, setFormData] = useState<any>({
        code: '',
        nameEn: '',
        nameAr: '',
        description: '',
        levelId: '',
        awardingBodyId: '',
        durationMonths: 12,
        totalUnits: undefined,
    });

    useEffect(() => {
        fetchAllData();

        const handleScroll = () => {
            if (window.innerWidth >= 768) {
                setShowHeader(true);
                return;
            }
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 60) {
                setShowHeader(false); // Scrolling down
            } else {
                setShowHeader(true); // Scrolling up
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    useEffect(() => {
        let filtered = [...programs];
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.nameAr.includes(searchTerm) ||
                p.nameEn.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (filterLevel) {
            filtered = filtered.filter(p => (p as any).levelId === filterLevel);
        }
        if (filterBody) {
            filtered = filtered.filter(p => (p as any).awardingBodyId === filterBody);
        }
        if (filterActive === 'active') {
            filtered = filtered.filter(p => p.isActive);
        } else if (filterActive === 'inactive') {
            filtered = filtered.filter(p => !p.isActive);
        }
        setFilteredPrograms(filtered);
    }, [programs, searchTerm, filterLevel, filterBody, filterActive]);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            console.log('🔄 Fetching Programs Data (Programs, Levels, Bodies, Units)...');

            const [programsRes, levelsRes, bodiesRes, unitsRes] = await Promise.all([
                academicService.getPrograms(),
                settingsService.getProgramLevels(true),
                settingsService.getAwardingBodies(true),
                academicService.getUnits(true)
            ]);

            console.log('📚 Programs Response:', programsRes);
            console.log('📶 Levels Response:', levelsRes);
            console.log('🏛️ Bodies Response:', bodiesRes);
            console.log('📦 Units Response:', unitsRes);

            if (programsRes.success && programsRes.data) {
                setPrograms(programsRes.data.programs || []);
            } else {
                console.warn('⚠️ Programs API failed or returned empty:', programsRes);
                setToast({ type: 'warning', message: '⚠️ لم يتم العثور على برامج' });
            }

            if (levelsRes.success && levelsRes.data && levelsRes.data.levels) {
                setLevels(levelsRes.data.levels);
            }

            if (bodiesRes.success && bodiesRes.data && bodiesRes.data.bodies) {
                setAwardingBodies(bodiesRes.data.bodies);
            }

            if (unitsRes.success && unitsRes.data && Array.isArray(unitsRes.data.units)) {
                setAllUnits(unitsRes.data.units);
            }

        } catch (error: any) {
            console.error('❌ Error loading data:', error);
            const msg = error.response?.data?.error?.message || error.message || 'Unknown error';
            setToast({ type: 'error', message: `❌ فشل تحميل بيانات البرامج: ${msg}` });
        } finally {
            setLoading(false);
        }
    };

    const fetchPrograms = async () => {
        try {
            const response = await academicService.getPrograms();
            if (response.data) setPrograms(response.data.programs || []);
        } catch (error) {
            console.error('Error fetching programs:', error);
        }
    };

    const fetchLevels = async () => {
        try {
            const response = await settingsService.getProgramLevels(true);
            if (response.data && response.data.levels) setLevels(response.data.levels);
        } catch (error) {
            console.error('Error fetching levels:', error);
        }
    };

    const fetchAwardingBodies = async () => {
        try {
            const response = await settingsService.getAwardingBodies(true);
            if (response.data && response.data.bodies) setAwardingBodies(response.data.bodies);
        } catch (error) {
            console.error('Error fetching awarding bodies:', error);
        }
    };

    const fetchUnits = async () => {
        try {
            const response = await academicService.getUnits(true);
            if (response.success && response.data && Array.isArray(response.data.units)) {
                setAllUnits(response.data.units);
            }
        } catch (error) {
            console.error('Error fetching units:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Front-end Validation
        if (formData.code.trim().length < 2) {
            setToast({ type: 'error', message: '❌ يجب أن يكون رمز البرنامج حرفين على الأقل' });
            return;
        }
        if (formData.nameAr.trim().length < 3) {
            setToast({ type: 'error', message: '❌ يجب أن يكون اسم البرنامج (عربي) 3 أحرف على الأقل' });
            return;
        }
        if (formData.nameEn.trim().length < 3) {
            setToast({ type: 'error', message: '❌ يجب أن يكون اسم البرنامج (إنجليزي) 3 أحرف على الأقل' });
            return;
        }
        if (formData.durationMonths < 1) {
            setToast({ type: 'error', message: '❌ يجب أن تكون المدة شهراً واحداً على الأقل' });
            return;
        }

        try {
            setLoading(true);
            const cleanData: any = {
                code: formData.code,
                nameAr: formData.nameAr,
                nameEn: formData.nameEn,
                description: formData.description || undefined,
                durationMonths: formData.durationMonths,
                totalUnits: selectedUnits.length > 0 ? selectedUnits.length : (formData.totalUnits || undefined),
                levelId: formData.levelId && formData.levelId.trim() !== '' ? formData.levelId : undefined,
                awardingBodyId: formData.awardingBodyId && formData.awardingBodyId.trim() !== '' ? formData.awardingBodyId : undefined,
                unitIds: selectedUnits.length > 0 ? selectedUnits : undefined,
            };

            if (editingProgram) {
                await academicService.updateProgram(editingProgram.id, cleanData);
                setToast({ type: 'success', message: '✅ تم تحديث البرنامج بنجاح' });
            } else {
                await academicService.createProgram(cleanData);
                setToast({ type: 'success', message: '✅ تم إضافة البرنامج بنجاح' });
            }

            setShowModal(false);
            resetForm();
            fetchPrograms();
        } catch (error: any) {
            console.error('Submit error:', error);

            // Detailed validation error handling
            let errorMsg = 'فشل في حفظ البرنامج';

            if (error.response?.data?.error) {
                const apiError = error.response.data.error;
                if (apiError.code === 'VALIDATION_ERROR' && apiError.details) {
                    // Map Zod errors to readable messages
                    const fieldMap: { [key: string]: string } = {
                        nameAr: 'الاسم العربي',
                        nameEn: 'الاسم الإنجليزي',
                        code: 'الرمز',
                        durationMonths: 'المدة',
                        totalUnits: 'عدد الوحدات'
                    };

                    const details = apiError.details.map((d: any) => {
                        const fieldName = fieldMap[d.path[0]] || d.path[0];
                        return `${fieldName}: ${d.message === 'String must contain at least 3 character(s)' ? 'يجب أن يكون 3 أحرف على الأقل' : d.message}`;
                    }).join(', ');

                    errorMsg = `خطأ في البيانات: ${details}`;
                } else {
                    errorMsg = apiError.message || errorMsg;
                }
            } else if (error.message) {
                errorMsg = error.message;
            }

            setToast({ type: 'error', message: `❌ ${errorMsg}` });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (program: Program) => {
        setEditingProgram(program);
        setFormData({
            code: program.code,
            nameEn: program.nameEn,
            nameAr: program.nameAr,
            description: program.description || '',
            levelId: (program as any).levelId || '',
            awardingBodyId: (program as any).awardingBodyId || '',
            durationMonths: program.durationMonths,
            totalUnits: program.totalUnits || undefined,
        });
        setSelectedUnits(program.programUnits?.map((pu: any) => pu.unitId) || []);
        setShowModal(true);
    };

    const handleDelete = async (program: Program) => {
        const classCount = program._count?.classes || 0;
        setConfirmDialog({
            title: 'حذف البرنامج',
            message: classCount > 0
                ? `⚠️ تنبيه! يحتوي على ${classCount} فصل. هل أنت متأكد؟`
                : `هل أنت متأكد من حذف "${program.nameAr}"؟`,
            type: classCount > 0 ? 'warning' : 'danger',
            onConfirm: async () => {
                setConfirmDialog(null);
                try {
                    setLoading(true);
                    await academicService.deleteProgram(program.id);
                    setToast({ type: 'success', message: '✅ تم الحذف بنجاح' });
                    fetchPrograms();
                } catch (error: any) {
                    setToast({ type: 'error', message: `❌ فشل الحذف` });
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    const resetForm = () => {
        setFormData({ code: '', nameEn: '', nameAr: '', description: '', levelId: '', awardingBodyId: '', durationMonths: 12, totalUnits: undefined });
        setSelectedUnits([]);
        setEditingProgram(null);
    };

    const getLevelName = (program: any) => {
        if (program.programLevel) return program.programLevel.nameAr;
        if (program.levelId) return levels.find(l => l.id === program.levelId)?.nameAr || '-';
        return '-';
    };

    const getAwardingBodyName = (program: any) => {
        if (program.awardingBody) return program.awardingBody.nameAr;
        if (program.awardingBodyId) return awardingBodies.find(b => b.id === program.awardingBodyId)?.nameAr || '-';
        return '-';
    };

    if (loading && programs.length === 0) {
        return activeTemplate === 'modern_global_2026' ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--mg26-surface-low)' }}>
                <ModernLoader />
            </div>
        ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F8FAFC' }}>
                <div className="next-gen-loader"></div>
            </div>
        );
    }

    if (activeTemplate === 'modern_global_2026') {
        return (
            <div className="mg26-root" style={{ background: 'var(--mg26-surface-low)', minHeight: '100vh', padding: 'var(--mg26-space-xl)' }}>
                {/* --- Modern Action Header --- */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--mg26-space-2xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mg26-space-lg)' }}>
                        <div style={{
                            width: '50px', height: '50px', borderRadius: '12px', background: 'var(--mg26-primary-soft)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mg26-primary)'
                        }}>
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--mg26-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>البرامج الأكاديمية</h2>
                            <p style={{ color: 'var(--mg26-text-secondary)', fontSize: '0.925rem', margin: '4px 0 0 0', fontWeight: '500' }}>إدارة وتطوير مسارات التعلم الأكاديمية</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--mg26-space-md)' }}>
                        <div style={{ display: 'flex', background: 'white', borderRadius: '10px', padding: '4px', border: '1px solid var(--mg26-border-strong)' }}>
                            <button
                                onClick={() => setViewMode('grid')}
                                style={{
                                    padding: '8px 12px', borderRadius: '8px', border: 'none',
                                    background: viewMode === 'grid' ? 'var(--mg26-primary-soft)' : 'transparent',
                                    color: viewMode === 'grid' ? 'var(--mg26-primary)' : 'var(--mg26-text-muted)',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                }}
                            >
                                <Grid size={18} />
                                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>شبكة</span>
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                style={{
                                    padding: '8px 12px', borderRadius: '8px', border: 'none',
                                    background: viewMode === 'table' ? 'var(--mg26-primary-soft)' : 'transparent',
                                    color: viewMode === 'table' ? 'var(--mg26-primary)' : 'var(--mg26-text-muted)',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                }}
                            >
                                <List size={18} />
                                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>جدول</span>
                            </button>
                        </div>
                        <ModernButton variant="primary" icon={<Plus size={18} />} onClick={() => { resetForm(); setShowModal(true); }}>برنامج جديد</ModernButton>
                    </div>
                </div>

                {/* --- Stats Row --- */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--mg26-space-xl)', marginBottom: 'var(--mg26-space-2xl)' }}>
                    <ModernStat label="إجمالي البرامج" value={programs.length} trend={{ value: programs.filter(p => p.isActive).length, direction: 'up' }} />
                    <ModernStat label="البرامج النشطة" value={programs.filter(p => p.isActive).length} />
                    <ModernStat label="إجمالي الوحدات" value={programs.reduce((acc, p) => acc + (p.totalUnits || 0), 0)} />
                    <ModernStat label="الجهات المانحة" value={awardingBodies.length} />
                </div>

                <main>
                    <ModernCard style={{ marginBottom: 'var(--mg26-space-xl)' }}>
                        <div style={{ display: 'flex', gap: 'var(--mg26-space-xl)', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                                <ModernFormGroup label="البحث السريع">
                                    <ModernInput
                                        placeholder="البحث بالاسم، الرمز أو الوصف..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </ModernFormGroup>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--mg26-space-md)' }}>
                                <div style={{ minWidth: '180px' }}>
                                    <ModernFormGroup label="المستوى">
                                        <select
                                            className="mg26-input"
                                            value={filterLevel}
                                            onChange={(e) => setFilterLevel(e.target.value)}
                                        >
                                            <option value="">كافة المستويات</option>
                                            {levels.map(l => <option key={l.id} value={l.id}>{l.nameAr}</option>)}
                                        </select>
                                    </ModernFormGroup>
                                </div>
                                <div style={{ minWidth: '180px' }}>
                                    <ModernFormGroup label="الحالة">
                                        <select
                                            className="mg26-input"
                                            value={filterActive}
                                            onChange={(e) => setFilterActive(e.target.value as any)}
                                        >
                                            <option value="all">كافة الحالات</option>
                                            <option value="active">نشط</option>
                                            <option value="inactive">غير نشط</option>
                                        </select>
                                    </ModernFormGroup>
                                </div>
                            </div>
                        </div>
                    </ModernCard>

                    {filteredPrograms.length === 0 ? (
                        <ModernCard style={{ textAlign: 'center', padding: 'var(--mg26-space-4xl)' }}>
                            <Archive size={48} color="var(--mg26-text-muted)" style={{ marginBottom: 'var(--mg26-space-lg)' }} />
                            <h3 style={{ color: 'var(--mg26-text-primary)', margin: 0 }}>لا توجد برامج مطابقة</h3>
                            <p style={{ color: 'var(--mg26-text-muted)' }}>جرب تغيير معايير البحث أو الفلترة</p>
                        </ModernCard>
                    ) : viewMode === 'grid' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 'var(--mg26-space-xl)' }}>
                            {filteredPrograms.map(program => (
                                <ModernCard key={program.id} className="interactive" onClick={() => setShowDetails(program)}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--mg26-space-lg)' }}>
                                        <span style={{
                                            fontSize: '0.75rem', fontWeight: '800', border: '1px solid var(--mg26-border-strong)',
                                            padding: '4px 10px', borderRadius: '6px', color: 'var(--mg26-text-secondary)', background: 'var(--mg26-surface-low)'
                                        }}>
                                            {program.code}
                                        </span>
                                        <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                                            <button onClick={() => handleEdit(program)} style={{ border: 'none', background: 'var(--mg26-surface-low)', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: 'var(--mg26-text-secondary)' }}><Edit3 size={16} /></button>
                                            <button onClick={() => handleDelete(program)} style={{ border: 'none', background: 'rgba(248, 40, 90, 0.05)', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: 'var(--mg26-error)' }}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 'var(--mg26-space-xl)' }}>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--mg26-text-primary)' }}>{program.nameAr}</h3>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--mg26-text-secondary)', margin: 0, fontWeight: '500' }}>{program.nameEn}</p>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: 'var(--mg26-space-lg)', background: 'var(--mg26-surface-low)', borderRadius: '12px' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--mg26-text-muted)', marginBottom: '4px', fontWeight: '600' }}>المدة</div>
                                            <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--mg26-text-primary)' }}>{program.durationMonths} ش</div>
                                        </div>
                                        <div style={{ textAlign: 'center', borderRight: '1px solid var(--mg26-border-subtle)', borderLeft: '1px solid var(--mg26-border-subtle)' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--mg26-text-muted)', marginBottom: '4px', fontWeight: '600' }}>الوحدات</div>
                                            <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--mg26-text-primary)' }}>{program.totalUnits || 0}</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--mg26-text-muted)', marginBottom: '4px', fontWeight: '600' }}>المستوى</div>
                                            <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--mg26-text-primary)' }}>{getLevelName(program).split(' ')[0]}</div>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: 'var(--mg26-space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800',
                                            background: program.isActive ? 'rgba(23, 198, 83, 0.1)' : 'rgba(153, 161, 183, 0.1)',
                                            color: program.isActive ? 'var(--mg26-success)' : 'var(--mg26-text-muted)'
                                        }}>
                                            {program.isActive ? 'نشط' : 'مؤرشف'}
                                        </span>
                                        <div style={{ color: 'var(--mg26-primary)', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                            التفاصيل <ChevronLeft size={16} />
                                        </div>
                                    </div>
                                </ModernCard>
                            ))}
                        </div>
                    ) : (
                        <div style={{ background: 'white', borderRadius: 'var(--mg26-radius-component)', overflow: 'hidden', boxShadow: 'var(--mg26-shadow-sm)', border: '1px solid var(--mg26-border-subtle)' }}>
                            <ModernTable headers={['الرمز', 'البرنامج الأكاديمي', 'المستوى', 'المدة', 'الوحدات', 'الحالة', 'الإجراءات']}>
                                {filteredPrograms.map(program => (
                                    <tr key={program.id}>
                                        <td><span style={{ fontWeight: '700', color: 'var(--mg26-text-primary)' }}>{program.code}</span></td>
                                        <td>
                                            <div style={{ fontWeight: '800', color: 'var(--mg26-text-primary)' }}>{program.nameAr}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--mg26-text-muted)' }}>{program.nameEn}</div>
                                        </td>
                                        <td><span style={{ fontWeight: '600' }}>{getLevelName(program)}</span></td>
                                        <td>{program.durationMonths} شهر</td>
                                        <td>{program.totalUnits || 0} وحدة</td>
                                        <td>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '800',
                                                background: program.isActive ? 'rgba(23, 198, 83, 0.1)' : 'rgba(153, 161, 183, 0.1)',
                                                color: program.isActive ? 'var(--mg26-success)' : 'var(--mg26-text-muted)'
                                            }}>
                                                {program.isActive ? 'نشط' : 'غير نشط'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => setShowDetails(program)} style={{ padding: '8px', border: 'none', background: 'var(--mg26-surface-low)', borderRadius: '8px', cursor: 'pointer', color: 'var(--mg26-primary)' }}><Eye size={16} /></button>
                                                <button onClick={() => handleEdit(program)} style={{ padding: '8px', border: 'none', background: 'var(--mg26-surface-low)', borderRadius: '8px', cursor: 'pointer', color: 'var(--mg26-text-secondary)' }}><Edit3 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </ModernTable>
                        </div>
                    )}
                </main>

                {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
                {confirmDialog && <ConfirmDialog title={confirmDialog.title} message={confirmDialog.message} type={confirmDialog.type} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog(null)} />}
            </div>
        );
    }

    return (
        <div className="next-gen-page-container">
            {/* --- Premium Floating Header --- */}
            <header className="glass-header" style={{ transform: showHeader ? 'translateY(0)' : 'translateY(-120%)' }}>
                <div className="container-wide header-content">
                    <div className="header-branding">
                        <div className="branding-icon orange">
                            <BookOpen size={24} strokeWidth={2.5} />
                        </div>
                        <div className="branding-text">
                            <h1>البرامج الأكاديمية</h1>
                            <p className="hide-on-mobile">إدارة وتطوير مسارات التعلم الأكاديمية</p>
                        </div>
                    </div>

                    <div className="header-actions">
                        <div className="view-switcher hide-on-mobile">
                            <button onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'active' : ''} title="عرض الشبكة">
                                <Grid size={18} strokeWidth={2.4} />
                            </button>
                            <button onClick={() => setViewMode('table')} className={viewMode === 'table' ? 'active' : ''} title="عرض الجدول">
                                <List size={18} strokeWidth={2.4} />
                            </button>
                        </div>
                        <div className="header-pills hide-on-mobile">
                            <span className="pill pill-green">نشط: {programs.filter(p => p.isActive).length}</span>
                        </div>
                        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-modern btn-orange-gradient hide-on-mobile">
                            <Plus size={20} strokeWidth={3} />
                            <span>برنامج جديد</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Floating Action Button */}
            <button
                className={"show-on-mobile fab-mobile flex items-center justify-center"}
                onClick={() => { resetForm(); setShowModal(true); }}
                aria-label="إضافة برنامج"
            >
                +
            </button>

            {/* --- Main Content --- */}
            <main className="container-wide main-content">
                {/* Desktop Search & Filters Toolbar */}
                <section className="filters-toolbar hide-on-mobile">
                    <div className="search-box-wrapper">
                        <span className="search-icon">
                            <Search size={18} strokeWidth={2.2} />
                        </span>
                        <input type="text" placeholder="البحث بالاسم، الرمز أو الوصف..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="divider-v"></div>
                    <div className="filters-group">
                        <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
                            <option value="">كافة المستويات</option>
                            {levels.map(l => <option key={l.id} value={l.id}>{l.nameAr}</option>)}
                        </select>
                        <select value={filterBody} onChange={(e) => setFilterBody(e.target.value)}>
                            <option value="">كافة الجهات</option>
                            {awardingBodies.map(b => <option key={b.id} value={b.id}>{b.nameAr}</option>)}
                        </select>
                        <select value={filterActive} onChange={(e) => setFilterActive(e.target.value as any)}>
                            <option value="all">كافة الحالات</option>
                            <option value="active">نشط</option>
                            <option value="inactive">غير نشط</option>
                        </select>
                    </div>
                </section>

                {/* Mobile Search Bar Only */}
                <section className="show-on-mobile mobile-search-area">
                    <div className="search-box-wrapper">
                        <input type="text" placeholder="بحث عن برنامج..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <button onClick={() => setShowMobileFilters(true)} className="btn-filter-toggle">
                            <Filter size={18} strokeWidth={2.2} />
                        </button>
                    </div>
                </section>

                {/* --- Stats Overview --- */}
                <div className="stats-grid">
                    <div className="stat-card-mini" style={{ borderRight: '3px solid #2C7A7B' }}>
                        <div className="stat-label">إجمالي البرامج</div>
                        <div className="stat-value">{programs.length}</div>
                    </div>
                    <div className="stat-card-mini" style={{ borderRight: '3px solid #38A169' }}>
                        <div className="stat-label">البرامج النشطة</div>
                        <div className="stat-value">{programs.filter(p => p.isActive).length}</div>
                    </div>
                    <div className="stat-card-mini" style={{ borderRight: '3px solid #3182CE' }}>
                        <div className="stat-label">إجمالي الوحدات</div>
                        <div className="stat-value">{programs.reduce((acc, p) => acc + (p.totalUnits || 0), 0)}</div>
                    </div>
                    <div className="stat-card-mini" style={{ borderRight: '3px solid #DD6B20' }}>
                        <div className="stat-label">غير نشط</div>
                        <div className="stat-value">{programs.filter(p => !p.isActive).length}</div>
                    </div>
                </div>

                {/* Data Display */}
                <div className={`content-transition-wrapper ${viewMode}`}>
                    {filteredPrograms.length === 0 ? (
                        <div className="empty-state-modern">
                            <div className="empty-icon">📂</div>
                            <h2>لا توجد نتائج مطابقة</h2>
                            <p>حاول تغيير معايير البحث أو إضافة برامج جديدة</p>
                            <button onClick={resetForm} className="btn-link">إضافة برنامج جديد</button>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div key="grid-view" className="programs-grid-2026 fade-in">
                            {filteredPrograms.map(program => (
                                <div key={program.id} className="next-gen-card fade-in">
                                    <div className="card-top">
                                        <span className="card-code">{program.code}</span>
                                        <div className="card-actions-mini">
                                            <button onClick={() => handleEdit(program)} title="تعديل"><Edit3 size={15} /></button>
                                            <button onClick={() => handleDelete(program)} className="danger" title="حذف"><Trash2 size={15} /></button>
                                        </div>
                                    </div>
                                    <div className="card-info">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                            <div className="program-avatar">
                                                <BookOpen size={20} strokeWidth={2.5} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h3 className="card-title">{program.nameAr}</h3>
                                                <p className="card-subtitle">{program.nameEn || program.code}</p>
                                            </div>
                                        </div>
                                        <div className="card-tags">
                                            {getLevelName(program) !== '-' && (
                                                <span className="tag-level">
                                                    <Award size={12} style={{ marginLeft: '4px' }} />
                                                    {getLevelName(program)}
                                                </span>
                                            )}
                                            {getAwardingBodyName(program) !== '-' && (
                                                <span className="tag-body">
                                                    <Building2 size={12} style={{ marginLeft: '4px' }} />
                                                    {getAwardingBodyName(program)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="card-stats-grid">
                                        <div className="stat-item">
                                            <span className="stat-val">{program.durationMonths}</span>
                                            <span className="stat-lbl">أشهر</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-val">{program.totalUnits || 0}</span>
                                            <span className="stat-lbl">وحدة</span>
                                        </div>
                                        <div className="stat-item highlight">
                                            <span className="stat-val">{program._count?.classes || 0}</span>
                                            <span className="stat-lbl">فصول</span>
                                        </div>
                                    </div>
                                    <div className="card-footer">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span className={`status-dot ${program.isActive ? 'active' : 'inactive'}`}></span>
                                            <span className="status-text" style={{ fontSize: '0.8125rem', fontWeight: 600, color: program.isActive ? '#38A169' : '#718096' }}>
                                                {program.isActive ? 'نشط' : 'غير نشط'}
                                            </span>
                                        </div>
                                        <button onClick={() => setShowDetails(program)} className="btn-details-link">
                                            التفاصيل <ChevronLeft size={14} style={{ marginRight: '4px' }} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div key="table-view" className="next-gen-table-container fade-in">
                            <table className="modern-data-table">
                                <thead>
                                    <tr>
                                        <th>الرمز</th>
                                        <th>الاسم</th>
                                        <th className="hide-on-mobile">المستوى</th>
                                        <th className="hide-on-mobile">الجهة</th>
                                        <th className="text-center">المدة</th>
                                        <th className="text-center">الوحدات</th>
                                        <th className="text-center">فصول</th>
                                        <th className="text-center">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPrograms.map(program => (
                                        <tr key={program.id}>
                                            <td className="w-100"><span className="code-pill">{program.code}</span></td>
                                            <td>
                                                <div className="table-primary-text">{program.nameAr}</div>
                                                <div className="table-secondary-text">{program.nameEn}</div>
                                            </td>
                                            <td className="hide-on-mobile">{getLevelName(program)}</td>
                                            <td className="hide-on-mobile">{getAwardingBodyName(program)}</td>
                                            <td className="text-center w-80">{program.durationMonths} شهر</td>
                                            <td className="text-center w-80">{program.totalUnits || 0}</td>
                                            <td className="text-center w-80"><span className="count-pill">{program._count?.classes || 0}</span></td>
                                            <td className="text-center w-120">
                                                <div className="table-row-actions">
                                                    <button onClick={() => setShowDetails(program)} className="view-btn"><Eye size={16} /></button>
                                                    <button onClick={() => handleEdit(program)} className="edit-btn"><Edit3 size={16} /></button>
                                                    <button onClick={() => handleDelete(program)} className="delete-btn"><Trash2 size={16} /></button>
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

            {/* --- Modals & Overlays --- */}
            {showModal && createPortal(
                <div className="modal-overlay">
                    <div className="modal-container premium-modal">
                        <div className="modal-header">
                            <div className="header-info">
                                <h2>{editingProgram ? 'تعديل البرنامج' : 'إضافة برنامج جديد'}</h2>
                                <p>يرجى إدخال تفاصيل البرنامج لضمان دقة البيانات</p>
                            </div>
                            <button className="btn-close-2026" onClick={() => { setShowModal(false); resetForm(); }}>✕</button>
                        </div>
                        <div className="modal-body-scroll">
                            <form onSubmit={handleSubmit} className="premium-form">
                                <h3 className="section-title">المعلومات الأساسية</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>رمز البرنامج *</label>
                                        <input className="input-premium" type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} required placeholder="مثال: CS-101" />
                                    </div>
                                    <div className="form-group">
                                        <label>المستوى *</label>
                                        <select className="input-premium" value={formData.levelId} onChange={e => setFormData({ ...formData, levelId: e.target.value })}>
                                            <option value="">اختر المستوى</option>
                                            {levels.map(l => <option key={l.id} value={l.id}>{l.nameAr}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>اسم البرنامج (عربي) *</label>
                                    <input className="input-premium" type="text" value={formData.nameAr} onChange={e => setFormData({ ...formData, nameAr: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>اسم البرنامج (إنجليزي) *</label>
                                    <input className="input-premium" type="text" value={formData.nameEn} onChange={e => setFormData({ ...formData, nameEn: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>الجهة المانحة</label>
                                    <select className="input-premium" value={formData.awardingBodyId} onChange={e => setFormData({ ...formData, awardingBodyId: e.target.value })}>
                                        <option value="">اختياري (شهادة داخلية)</option>
                                        {awardingBodies.map(b => <option key={b.id} value={b.id}>{b.nameAr}</option>)}
                                    </select>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>المدة الزمنية (بالأشهر) *</label>
                                        <div className="input-with-icon-end">
                                            <input className="input-premium" type="number" value={formData.durationMonths} onChange={e => setFormData({ ...formData, durationMonths: parseInt(e.target.value) || 0 })} required min="1" />
                                            <span>شهر</span>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>عدد الوحدات المتوقع</label>
                                        <input className="input-premium" type="number" value={formData.totalUnits || ''} onChange={e => setFormData({ ...formData, totalUnits: parseInt(e.target.value) || undefined })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>الوصف</label>
                                    <textarea className="input-premium" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="وصف مختصر للبرنامج..." />
                                </div>

                                <h3 className="section-title">الوحدات التدريبية</h3>
                                <div className="form-group">
                                    <label>اختر الوحدات (المختارة: {selectedUnits.length})</label>
                                    <div className="units-selection-box">
                                        {allUnits.length === 0 ? (
                                            <p className="empty-hint">لا توجد وحدات متاحة. يرجى إضافتها أولاً.</p>
                                        ) : (
                                            <DndContext
                                                sensors={sensors}
                                                collisionDetection={closestCenter}
                                                onDragEnd={handleDragEnd}
                                            >
                                                <SortableContext
                                                    items={allUnits.map(u => u.id)}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    {allUnits.map(unit => (
                                                        <SortableUnitItem
                                                            key={unit.id}
                                                            id={unit.id}
                                                            unit={unit}
                                                            isSelected={selectedUnits.includes(unit.id)}
                                                            onToggle={(id: any) => {
                                                                setSelectedUnits(prev =>
                                                                    prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
                                                                );
                                                            }}
                                                        />
                                                    ))}
                                                </SortableContext>
                                            </DndContext>
                                        )}
                                    </div>
                                </div>

                                <div className="modal-footer-premium">
                                    <button type="button" className="btn-secondary-premium" onClick={() => setShowModal(false)}>إلغاء</button>
                                    <button type="submit" className="btn-success-premium">{editingProgram ? 'حفظ التعديلات' : 'إنشاء البرنامج'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {showDetails && createPortal(
                <div className="modal-overlay" onClick={() => setShowDetails(null)}>
                    <div className="modal-container premium-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="header-info">
                                <h2>{showDetails.nameAr}</h2>
                                <p>{showDetails.nameEn}</p>
                            </div>
                            <button className="btn-close-2026" onClick={() => setShowDetails(null)}>✕</button>
                        </div>
                        <div className="modal-body-scroll">
                            <div className="premium-form">
                                <h3 className="section-title">نظرة عامة على البرنامج</h3>
                                <div className="details-stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div className="d-stat" style={{ background: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 2px 5px rgba(0,0,0,0.03)', textAlign: 'center' }}>
                                        <div style={{ width: '40px', height: '40px', background: '#F0FFF4', borderRadius: '50%', color: '#38A169', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                                            <BookOpen size={20} />
                                        </div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#718096', marginBottom: '4px', fontWeight: '600' }}>المقررات</label>
                                        <strong style={{ fontSize: '1.35rem', color: '#2D3748', display: 'block' }}>{showDetails.totalUnits || (showDetails.programUnits?.length || 0)}</strong>
                                    </div>
                                    <div className="d-stat" style={{ background: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 2px 5px rgba(0,0,0,0.03)', textAlign: 'center' }}>
                                        <div style={{ width: '40px', height: '40px', background: '#EBF8FF', borderRadius: '50%', color: '#3182CE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                                            <Users size={20} />
                                        </div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#718096', marginBottom: '4px', fontWeight: '600' }}>الفصـول</label>
                                        <strong style={{ fontSize: '1.35rem', color: '#2D3748', display: 'block' }}>{showDetails._count?.classes || 0}</strong>
                                    </div>
                                    <div className="d-stat" style={{ background: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 2px 5px rgba(0,0,0,0.03)', textAlign: 'center' }}>
                                        <div style={{ width: '40px', height: '40px', background: '#FAF5FF', borderRadius: '50%', color: '#805AD5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                                            <BarChart2 size={20} />
                                        </div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#718096', marginBottom: '4px', fontWeight: '600' }}>المستوى</label>
                                        <strong style={{ fontSize: '1.35rem', color: '#2D3748', display: 'block' }}>{getLevelName(showDetails)}</strong>
                                    </div>
                                    <div className="d-stat" style={{ background: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 2px 5px rgba(0,0,0,0.03)', textAlign: 'center' }}>
                                        <div style={{ width: '40px', height: '40px', background: '#FFFAF0', borderRadius: '50%', color: '#DD6B20', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                                            <Clock size={20} />
                                        </div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#718096', marginBottom: '4px', fontWeight: '600' }}>المدة</label>
                                        <strong style={{ fontSize: '1.35rem', color: '#2D3748', display: 'block' }}>{showDetails.durationMonths} شهر</strong>
                                    </div>
                                </div>

                                <h3 className="section-title">الجدول الزمني المقترح</h3>
                                <div className="timeline-visual" style={{ marginBottom: '1.5rem' }}>
                                    <div className="timeline-bar">
                                        <div className="timeline-progress" style={{ width: '100%' }}>
                                            <span className="timeline-label" style={{ padding: '0 10px', fontSize: '0.8rem', fontWeight: 'bold' }}>{showDetails.durationMonths} شهر</span>
                                        </div>
                                    </div>
                                    <div className="timeline-markers">
                                        <span>البداية</span>
                                        <span>المنتصف</span>
                                        <span>النهاية</span>
                                    </div>
                                </div>

                                <h3 className="section-title">الوحدات</h3>
                                <div className="assigned-units-list">
                                    {(!showDetails.programUnits || showDetails.programUnits.length === 0) ? (
                                        <p className="text-muted">لا توجد وحدات مرتبطة.</p>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                                            {showDetails.programUnits.map((pu: any, idx: number) => (
                                                <div key={pu.id} className="assigned-unit-row" style={{ padding: '0.75rem', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <span className="unit-idx" style={{ width: '28px', height: '28px', background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800', border: '1px solid #E2E8F0' }}>{idx + 1}</span>
                                                    <div className="unit-det" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <span style={{ fontSize: '0.8rem', color: '#718096', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{pu.unit?.code}</span>
                                                        <strong style={{ display: 'block', fontSize: '0.9rem', color: '#2D3748' }}>{pu.unit?.nameAr}</strong>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {showDetails.description && (
                                    <>
                                        <h3 className="section-title" style={{ marginTop: '1.5rem' }}>عن البرنامج</h3>
                                        <p style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #EDF2F7', fontSize: '0.925rem', lineHeight: '1.6', color: '#4A5568' }}>{showDetails.description}</p>
                                    </>
                                )}

                                <div className="modal-footer-premium" style={{ marginTop: '2rem', padding: '1.5rem 0 0 0', borderTop: '1px solid #EDF2F7', background: 'transparent' }}>
                                    <button onClick={() => setShowDetails(null)} className="btn-secondary-premium">إغلاق</button>
                                    <button onClick={() => {
                                        handleEdit(showDetails);
                                        setShowDetails(null);
                                    }} className="btn-primary-premium">تعديل البرنامج</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {confirmDialog && createPortal(
                <ConfirmDialog
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    type={confirmDialog.type}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={() => setConfirmDialog(null)}
                />,
                document.body
            )}
            {toast && createPortal(
                <Toast
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast(null)}
                />,
                document.body
            )}

            {/* --- Mobile Floating Action Button (FAB) --- */}
            <button
                onClick={() => { resetForm(); setShowModal(true); }}
                className="fab-mobile show-on-mobile"
                title="إضافة برنامج جديد"
            >
                +
            </button>

            {/* --- Global Styles --- */}
            <style dangerouslySetInnerHTML={{
                __html: `
                :root {
                    --orange-primary: #DD6B20;
                    --orange-light: #FEEBC8;
                    --orange-dark: #7B341E;
                    --primary: var(--orange-primary);
                    --primary-light: var(--orange-light);
                    --primary-dark: var(--orange-dark);
                    --accent: #3182CE;
                    --bg-page: #F8FAFC;
                    --surface: #FFFFFF;
                    --text-main: #1A202C;
                    --text-muted: #718096;
                    --glass-bg: rgba(255, 255, 255, 0.85);
                    --shadow-sm: 0 2px 4px rgba(0,0,0,0.05);
                    --shadow-md: 0 8px 24px rgba(149, 157, 165, 0.2);
                    --shadow-premium: 0 12px 30px rgba(0, 0, 0, 0.08);
                    --radius-lg: 16px;
                    --radius-md: 12px;
                }

                .next-gen-page-container {
                    font-family: 'Inter', 'Cairo', sans-serif;
                    color: var(--text-main);
                    direction: rtl;
                    /* Fix the container height to the viewport to prevent outer scroll */
                    height: calc(100vh - 130px);
                    background: var(--bg-page);
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    overflow: hidden !important; /* Lock the outer page scroll */
                }
                
                .container-wide {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 1.5rem;
                    width: 100%;
                }

                .main-content {
                    flex: 1;
                    overflow-y: auto !important; /* Scroll only the content area */
                    padding-bottom: 80px; /* Space for mobile nav if needed */
                    scrollbar-width: thin;
                    scrollbar-color: var(--primary-light) transparent;
                }
                
                @media (max-width: 768px) {
                    .next-gen-page-container {
                        height: calc(100vh - 72px) !important; /* Adjust for mobile footer/nav */
                    }
                    .container-wide { padding: 0 !important; }
                    .main-content { padding-bottom: 120px !important; }
                }

                .glass-header {
                    height: 70px;
                    top: 80px;
                    margin: 0.75rem;
                    border-radius: 20px;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    position: sticky;
                    z-index: 999;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.02);
                    background: var(--glass-bg);
                    backdrop-filter: blur(12px);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }

                .header-content {
                    display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 0 1.5rem;
                }
                .header-branding { display: flex; align-items: center; gap: 1rem; }
                .branding-icon.orange { 
                    width: 48px; height: 48px; background: #FFF5F5; color: #DD6B20; 
                    border-radius: 12px; display: flex; align-items: center; justify-content: center; 
                }
                .branding-text h1 { margin: 0; font-size: 1.25rem; font-weight: 800; color: var(--primary-dark); }
                .branding-text p { margin: 0; color: #718096; font-size: 0.8125rem; }

                .header-actions {
                    display: flex !important; flex-direction: row !important; align-items: center !important; gap: 1.5rem !important;
                }
                
                .btn-modern {
                    display: flex !important; flex-direction: row !important; align-items: center !important; gap: 0.75rem !important;
                    padding: 0.625rem 1.25rem !important; border-radius: var(--radius-md) !important; font-weight: 700 !important;
                    cursor: pointer !important; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important; border: none !important;
                }
                .btn-orange-gradient {
                    background: linear-gradient(135deg, var(--orange-primary) 0%, #ED8936 100%);
                    color: white; box-shadow: 0 4px 12px rgba(221, 107, 32, 0.3);
                }

                .view-switcher {
                    display: flex; background: #EDF2F7; padding: 4px; border-radius: 10px; gap: 4px;
                }
                .view-switcher button { 
                    width: 36px; height: 36px; border: none; background: transparent; border-radius: 8px; 
                    color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center;
                }
                .view-switcher button.active { background: white; color: var(--primary); box-shadow: var(--shadow-sm); }

                .stats-grid {
                    display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem; margin: 0.75rem 0;
                }
                .stat-card-mini {
                    background: white; padding: 1.5rem; border-radius: var(--radius-lg);
                    box-shadow: var(--shadow-sm); border: 1px solid #EDF2F7;
                    display: flex; align-items: center; justify-content: space-between;
                }

                .programs-grid-2026 {
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;
                }
                .next-gen-card {
                    background: var(--surface); border-radius: var(--radius-lg); padding: 1.5rem; border: 1px solid #EDF2F7;
                    transition: all 0.3s ease; position: relative; overflow: hidden;
                    display: flex; flex-direction: column; box-shadow: var(--shadow-sm);
                }
                .next-gen-card:hover { transform: translateY(-8px); border-color: var(--primary-light); }

                /* Modal Portaling Fix */
                .modal-overlay {
                    position: fixed !important;
                    inset: 0 !important; 
                    background: rgba(0,0,0,0.6) !important; 
                    backdrop-filter: blur(8px) !important;
                    display: flex !important; 
                    justify-content: center !important; 
                    align-items: center !important; 
                    z-index: 10000 !important;
                    padding: 1rem !important;
                }
                .premium-modal {
                    background: #fff; width: 100%; max-width: 800px;
                    border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
                    display: flex; flex-direction: column; max-height: 90vh;
                    animation: slideUp 0.3s ease-out;
                    overflow: hidden;
                    position: relative;
                }

                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

                @media (max-width: 768px) {
                    .glass-header { height: auto; top: 0; position: relative; }
                    .header-content { flex-direction: column; padding: 1rem; }
                    .fab-mobile {
                        position: fixed; bottom: 2rem; left: 2rem; width: 60px; height: 60px;
                        background: linear-gradient(135deg, var(--orange-primary) 0%, #ED8936 100%);
                        color: white !important; border: none; border-radius: 50%;
                        display: flex !important; align-items: center !important; justify-content: center !important;
                        box-shadow: 0 4px 20px rgba(221, 107, 32, 0.4); z-index: 2000;
                        font-size: 2rem;
                    }
                }
                `
            }} />
        </div >
    );
}
