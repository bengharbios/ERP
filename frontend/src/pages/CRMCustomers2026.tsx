import React, { useState, useEffect, useRef } from 'react';
import {
    Users, Search, Filter, MoreVertical,
    Calendar, Phone, Mail, Globe,
    ArrowRightLeft, UserPlus, Check, X,
    ChevronDown, Download, Grid, List as ListIcon, RefreshCw, Archive
} from 'lucide-react';
import { leadApi, stageApi } from '../services/crm.service';
import { HzModal, HzBtn, HzInput, HzSelect, HzBadge } from '../components/HorizonUI';
import { Toast } from '../components/Toast';
import './CRMLeads2026.css'; // Reuse the same styles

const CRMCustomers2026: React.FC = () => {
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res = await leadApi.getAll({ type: 'customer' });
            setCustomers(res.data || []);
        } catch (err) {
            setToast({ type: 'error', message: '❌ فشل تحميل بيانات العملاء' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const filtered = customers.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    );

    return (
        <div className="crm-root" dir="rtl">
            {/* Toolbar */}
            <div className="crm-toolbar">
                <h2 className="crm-toolbar-title">
                    <Users size={22} /> {filtered.length} عميل مسجل
                </h2>
                <div className="crm-toolbar-sep" />

                <div className="crm-search-wrap">
                    <Search size={16} />
                    <input
                        className="crm-search"
                        placeholder="البحث بالاسم، رقم الهاتف..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="crm-toolbar-end">
                    <div className="crm-view-switch">
                        <button className={`crm-view-btn ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')}><Grid size={16} /></button>
                        <button className={`crm-view-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}><ListIcon size={16} /></button>
                    </div>
                </div>
            </div>

            <div className="crm-body">
                <div className="crm-main">
                    {loading ? (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--hz-text-muted)' }}>جاري التحميل...</div>
                    ) : (
                        view === 'grid' ? (
                            <div className="crm-kanban">
                                {filtered.map(c => (
                                    <div key={c.id} className="crm-card">
                                        <div className="crm-card-header">
                                            <div className="crm-avatar">{c.name?.charAt(0)}</div>
                                            <div className="crm-card-meta">
                                                <div className="crm-card-name">{c.name}</div>
                                                <div className="crm-card-sub">{c.contactName}</div>
                                            </div>
                                        </div>
                                        <div className="crm-card-contacts">
                                            <div className="crm-contact-row"><Phone size={13} /> {c.phone}</div>
                                            <div className="crm-contact-row"><Mail size={13} /> {c.emailFrom || '—'}</div>
                                            <div className="crm-contact-row"><Calendar size={13} /> تم التسجيل: {new Date(c.createdAt).toLocaleDateString('ar-EG')}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="crm-table-wrap">
                                <div className="crm-table-inner">
                                    <table className="crm-table">
                                        <thead>
                                            <tr>
                                                <th>الاسم</th>
                                                <th>جهة الاتصال</th>
                                                <th>الهاتف</th>
                                                <th>البريد الإلكتروني</th>
                                                <th>تاريخ التسجيل</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.map(c => (
                                                <tr key={c.id}>
                                                    <td>
                                                        <div className="crm-cell-name">
                                                            <div className="crm-cell-avatar">{c.name?.charAt(0)}</div>
                                                            <div className="crm-cell-name-text">{c.name}</div>
                                                        </div>
                                                    </td>
                                                    <td>{c.contactName}</td>
                                                    <td>{c.phone}</td>
                                                    <td>{c.emailFrom}</td>
                                                    <td>{new Date(c.createdAt).toLocaleDateString('ar-EG')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        </div>
    );
};

export default CRMCustomers2026;
