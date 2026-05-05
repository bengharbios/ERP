import React, { useState } from 'react';
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
import {
    Layout, Type, Table, Image, Signature,
    Trash2, GripVertical, Settings, Save,
    Printer, Eye, Plus, FileText
} from 'lucide-react';
import './ReportBuilder.css';

interface ReportComponent {
    id: string;
    type: 'header' | 'text' | 'table' | 'image' | 'signature' | 'divider';
    content: any;
}

const COMPONENT_TYPES = [
    { type: 'header', label: 'ترويسة التقرير', icon: <Layout size={18} /> },
    { type: 'text', label: 'كتلة نصية', icon: <Type size={18} /> },
    { type: 'table', label: 'جدول بيانات', icon: <Table size={18} /> },
    { type: 'image', label: 'صورة / شعار', icon: <Image size={18} /> },
    { type: 'divider', label: 'فاصل خطي', icon: <FileText size={18} /> },
    { type: 'signature', label: 'منطقة التوقيع', icon: <Signature size={18} /> },
];

function SortableItem({ id, component, onRemove, onSelect, isActive }: any) {
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

    const renderContent = () => {
        switch (component.type) {
            case 'header':
                return (
                    <div className="rb-header-preview">
                        <div style={{ textAlign: 'right' }}>
                            <h3 style={{ margin: 0 }}>{component.content.titleAr || 'عنوان المؤسسة'}</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{component.content.subTitleAr || 'وصف فرعي للتقرير'}</p>
                        </div>
                        <div style={{ width: '60px', height: '60px', background: '#eee', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>LOGO</div>
                    </div>
                );
            case 'text':
                return <p style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>{component.content.text || 'هنا يكتب النص التوضيحي للتقرير أو الملاحظات العامة...'}</p>;
            case 'table':
                return (
                    <table className="rb-table-preview">
                        <thead>
                            <tr>
                                <th>المعيار</th>
                                <th>الدرجة</th>
                                <th>النتيجة</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>عينة من البيانات</td>
                                <td>--</td>
                                <td>--</td>
                            </tr>
                        </tbody>
                    </table>
                );
            case 'divider':
                return <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '10px 0' }} />;
            case 'signature':
                return (
                    <div className="rb-signature-preview">
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: '150px', borderBottom: '1px solid #333', marginBottom: '5px' }}></div>
                            <span style={{ fontSize: '0.8rem' }}>توقيع المدير</span>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: '150px', borderBottom: '1px solid #333', marginBottom: '5px' }}></div>
                            <span style={{ fontSize: '0.8rem' }}>ختم المؤسسة</span>
                        </div>
                    </div>
                );
            default:
                return <div>Component: {component.type}</div>;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`rb-canvas-component ${isActive ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); onSelect(component); }}
        >
            <div className="rb-comp-actions">
                <div className="rb-action-btn" {...attributes} {...listeners}><GripVertical size={12} /></div>
                <button className="rb-action-btn danger" onClick={() => onRemove(id)}><Trash2 size={12} /></button>
            </div>
            {renderContent()}
        </div>
    );
}

export default function ReportBuilder() {
    const [components, setComponents] = useState<ReportComponent[]>([
        { id: '1', type: 'header', content: { titleAr: 'معهد السلام للتدريب واللغات', subTitleAr: 'تقرير أكاديمي مفصل - نموذج 2026' } },
        { id: '2', type: 'divider', content: {} },
        { id: '3', type: 'text', content: { text: 'يحتوي هذا التقرير على تحليل شامل لأداء الطالب في الوحدة التدريبية المذكورة.' } },
        { id: '4', type: 'table', content: {} },
        { id: '5', type: 'signature', content: {} },
    ]);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setComponents((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const addComponent = (type: any) => {
        const newComp: ReportComponent = {
            id: Date.now().toString(),
            type,
            content: type === 'text' ? { text: 'نص جديد...' } : {}
        };
        setComponents([...components, newComp]);
        setSelectedId(newComp.id);
    };

    const removeComponent = (id: string) => {
        setComponents(components.filter(c => c.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const selectedComp = components.find(c => c.id === selectedId);

    const updateSelectedContent = (key: string, value: any) => {
        if (!selectedId) return;
        setComponents(components.map(c => 
            c.id === selectedId ? { ...c, content: { ...c.content, [key]: value } } : c
        ));
    };

    return (
        <div className="ag-root-2026">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--hz-text-bright)' }}>🛠️ مصمم قوالب التقارير</h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--hz-text-muted)' }}>خاصية السحب والإفلات (Beta)</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="hz-btn hz-btn-secondary hz-btn-sm"><Eye size={16} /> معاينة</button>
                    <button className="hz-btn hz-btn-primary hz-btn-sm"><Save size={16} /> حفظ القالب</button>
                    <button className="hz-btn hz-btn-neon hz-btn-sm" onClick={() => window.print()}><Printer size={16} /> طباعة مسودة</button>
                </div>
            </header>

            <div className="rb-container">
                {/* Available Components */}
                <aside className="rb-sidebar-left">
                    <div className="rb-section-title">العناصر المتاحة</div>
                    {COMPONENT_TYPES.map(comp => (
                        <div 
                            key={comp.type} 
                            className="rb-component-item"
                            onClick={() => addComponent(comp.type)}
                        >
                            {comp.icon}
                            <span className="rb-component-label">{comp.label}</span>
                            <Plus size={14} style={{ marginRight: 'auto', opacity: 0.5 }} />
                        </div>
                    ))}
                    <div style={{ marginTop: 'auto', padding: '15px', background: 'rgba(0, 136, 204, 0.05)', borderRadius: '12px' }}>
                        <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>قم بالضغط على العنصر لإضافته للتقرير، ثم اسحبه لترتيبه.</p>
                    </div>
                </aside>

                {/* Canvas Area */}
                <main className="rb-canvas-area" onClick={() => setSelectedId(null)}>
                    <div className="rb-paper">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={components.map(c => c.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="rb-sortable-list">
                                    {components.map((comp) => (
                                        <SortableItem
                                            key={comp.id}
                                            id={comp.id}
                                            component={comp}
                                            isActive={selectedId === comp.id}
                                            onRemove={removeComponent}
                                            onSelect={setSelectedId}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                </main>

                {/* Properties Panel */}
                <aside className="rb-sidebar-right">
                    <div className="rb-section-title">إعدادات العنصر</div>
                    {selectedComp ? (
                        <div className="rb-properties">
                            <div className="rb-prop-group">
                                <label className="rb-prop-label">نوع العنصر</label>
                                <span style={{ fontSize: '0.9rem', color: '#0088cc', fontWeight: 600 }}>{COMPONENT_TYPES.find(t => t.type === selectedComp.type)?.label}</span>
                            </div>

                            {selectedComp.type === 'header' && (
                                <>
                                    <div className="rb-prop-group">
                                        <label className="rb-prop-label">عنوان المؤسسة</label>
                                        <input 
                                            className="rb-prop-input" 
                                            value={selectedComp.content.titleAr || ''} 
                                            onChange={e => updateSelectedContent('titleAr', e.target.value)}
                                        />
                                    </div>
                                    <div className="rb-prop-group">
                                        <label className="rb-prop-label">العنوان الفرعي</label>
                                        <input 
                                            className="rb-prop-input" 
                                            value={selectedComp.content.subTitleAr || ''} 
                                            onChange={e => updateSelectedContent('subTitleAr', e.target.value)}
                                        />
                                    </div>
                                </>
                            )}

                            {selectedComp.type === 'text' && (
                                <div className="rb-prop-group">
                                    <label className="rb-prop-label">محتوى النص</label>
                                    <textarea 
                                        className="rb-prop-input" 
                                        style={{ height: '150px' }}
                                        value={selectedComp.content.text || ''} 
                                        onChange={e => updateSelectedContent('text', e.target.value)}
                                    />
                                </div>
                            )}

                            <div style={{ marginTop: '30px', padding: '15px', border: '1px solid #eee', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '0.8rem' }}>
                                    <Settings size={14} /> الخيارات المتقدمة (قريباً)
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', marginTop: '100px', color: '#94a3b8' }}>
                            <FileText size={48} style={{ opacity: 0.1, marginBottom: '20px' }} />
                            <p style={{ fontSize: '0.9rem' }}>اختر عنصراً من التقرير لتعديل خصائصه</p>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}
