import React, { useState, useEffect } from 'react';
import './WhatsAppTracker.css';
import {
    MessageSquare,
    UserPlus,
    Users,
    Zap,
    AlertCircle,
    Clock,
    CheckCircle2,
    RefreshCcw,
    Smartphone,
    MoreVertical,
    Search,
    Filter,
    ArrowUpRight,
    Sparkles
} from 'lucide-react';

interface WhatsAppActivity {
    id: string;
    activityType: string;
    metadata: {
        message: string;
        intent?: 'pricing' | 'booking' | 'inquiry' | 'objection' | 'support' | 'greeting' | 'general';
        sentiment?: 'positive' | 'neutral' | 'negative';
        scoreChange?: number;
        newScore?: number;
        summary?: string;
        suggestedAction?: string;
    };
    timestamp: string;
    lead: {
        firstName: string;
        lastName: string;
        phone: string;
        interestScore?: number;
    };
}

interface WhatsAppLead {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    interestScore: number;
    aiFollowUpNotes: string;
    status: string;
}

interface WhatsAppStats {
    totalMessages: number;
    newLeads: number;
    conversionProbability: number;
    intentDistribution: { tag: string; count: number }[];
    recentActivities: WhatsAppActivity[];
    topLeads: WhatsAppLead[];
}

import { QRCodeCanvas } from 'qrcode.react';
import { apiClient } from '../services/api';

const WhatsAppTracker: React.FC = () => {
    const [status, setStatus] = useState<{
        isReady: boolean;
        isConnected: boolean;
        connectionState?: 'DISCONNECTED' | 'INITIALIZING' | 'AUTHENTICATING' | 'READY';
        qrCode: string | null
    } | null>(null);
    const [stats, setStats] = useState<WhatsAppStats | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);
    const [showQrModal, setShowQrModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'live' | 'leads' | 'analytics'>('live');

    const fetchInitialData = async () => {
        try {
            const statusRes = await apiClient.get('/marketing/whatsapp/status');
            const statsRes = await apiClient.get('/marketing/whatsapp/stats');

            if (statusRes.success) {
                setStatus(statusRes.data);

                // Auto-close modal if ready
                if (statusRes.data.isReady && showQrModal) {
                    setTimeout(() => setShowQrModal(false), 2500);
                }
            }
            if (statsRes.success) setStats(statsRes.data);
        } catch (error) {
            console.error('Failed to fetch WhatsApp tracker data:', error);
        } finally {
            setIsInitialLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
        const interval = setInterval(fetchInitialData, 3000); // More responsive polling
        return () => clearInterval(interval);
    }, [showQrModal]);

    const handleLinkDevice = async () => {
        try {
            setIsConnecting(true);
            const res = await apiClient.post('/marketing/whatsapp/connect');
            if (res.success) {
                setShowQrModal(true);
            }
        } catch (error) {
            console.error('Failed to start WhatsApp connection:', error);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleLogout = async () => {
        if (!window.confirm('Are you sure you want to disconnect this WhatsApp account?')) return;
        try {
            const res = await apiClient.post('/marketing/whatsapp/logout');
            if (res.success) {
                fetchInitialData();
            }
        } catch (error) {
            console.error('Failed to logout WhatsApp:', error);
        }
    };

    const getPriorityIcon = (score: number) => {
        if (score >= 85) return <Zap className="icon-critical animate-pulse" />;
        if (score >= 60) return <ArrowUpRight className="icon-high" />;
        return <MessageSquare className="icon-normal" />;
    };

    const getSentimentEmoji = (sentiment?: string) => {
        switch (sentiment) {
            case 'positive': return '😊';
            case 'negative': return '😟';
            default: return '😐';
        }
    };

    const getPriorityClass = (score: number) => {
        if (score >= 85) return 'priority-critical';
        if (score >= 60) return 'priority-high';
        return 'priority-normal';
    };

    return (
        <div className="next-gen-page-container orange-theme marketing-page-2026 whatsapp-tracker-2026">
            {/* --- Premium Floating Header --- */}
            <header className="glass-header">
                <div className="container-wide header-content">
                    <div className="header-branding">
                        <div className="branding-icon orange">💬</div>
                        <div className="branding-text">
                            <h1>رادار واتساب الذكي 2026</h1>
                            <p className="hide-on-mobile">تحليل العملاء والرد التلقائي بالذكاء الاصطناعي</p>
                        </div>
                    </div>

                    <div className="header-actions">
                        <div className="system-status">
                            <span className={`status-pill ${status?.isReady ? 'online' : 'offline'}`}>
                                <div className="pulse"></div>
                                {status?.isReady ? 'متصل' : 'غير متصل'}
                            </span>
                        </div>
                        <button className="btn-primary-2026" onClick={fetchInitialData}>
                            <RefreshCcw size={18} /> تحديث البيانات
                        </button>
                    </div>
                </div>
            </header>

            <div className="container-wide">
                {/* QR Modal */}
                {showQrModal && (
                    <div className="qr-modal-overlay">
                        <div className="qr-modal-content animate-slide-up">
                            <button className="close-btn" onClick={() => setShowQrModal(false)}>✕</button>
                            <h2>ربط جهاز واتساب جديد</h2>
                            <p>1. افتح تطبيق واتساب على هاتفك</p>
                            <p>2. اضغط على القائمة أو الإعدادات واختر "الأجهزة المرتبطة"</p>
                            <p>3. وجه كاميرا هاتفك إلى هذه الشاشة لمسح الرمز بصرياً</p>

                            <div className="qr-container">
                                {status?.qrCode && !status.isReady ? (
                                    <QRCodeCanvas value={status.qrCode} size={256} level="H" />
                                ) : status?.isReady ? (
                                    <div className="qr-success">
                                        <div className="success-animation">
                                            <CheckCircle2 size={80} className="text-green pulse" />
                                        </div>
                                        <p className="text-xl font-bold">تم الربط بنجاح!</p>
                                        <p className="text-muted">جاري إغلاق النافذة وتحميل البيانات...</p>
                                    </div>
                                ) : status?.connectionState === 'AUTHENTICATING' ? (
                                    <div className="qr-placeholder">
                                        <div className="spinner"></div>
                                        <p>تم المسح! جاري التحقق من الجلسة...</p>
                                        <p className="text-sm">يرجى الانتظار بينما نقوم بمزامنة بياناتك.</p>
                                    </div>
                                ) : (
                                    <div className="qr-placeholder">
                                        <div className="spinner"></div>
                                        <p>{status?.connectionState === 'INITIALIZING' ? 'جاري تشغيل المحرك...' : 'جاري إنشاء الرمز...'}</p>
                                    </div>
                                )}
                            </div>

                            <div className="qr-status">
                                {status?.isReady ? (
                                    <span className="text-green">✅ تم ربط الجهاز بنجاح!</span>
                                ) : status?.connectionState === 'AUTHENTICATING' ? (
                                    <span className="text-blue">🔄 جاري التحقق من واتساب...</span>
                                ) : status?.qrCode ? (
                                    <span className="text-muted">تم استلام الرمز. يرجى المسح الآن.</span>
                                ) : (
                                    <span className="text-muted">جاري تحضير اتصال آمن...</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Device Management Bar */}
                <div className="tracker-action-bar glass-panel animate-fade-in">
                    <div className="action-info">
                        <Smartphone size={20} className="text-orange" />
                        <div>
                            <h4>إدارة الجهاز المتصل</h4>
                            <p>{status?.isReady ? 'جهازك مرتبط ونشط حالياً' : 'لم يتم ربط أي جهاز بعد'}</p>
                        </div>
                    </div>
                    <div className="action-buttons">
                        {status?.isReady ? (
                            <button className="btn-secondary-outline-2026" onClick={handleLogout}>
                                <RefreshCcw size={16} /> قطع الاتصال بالجهاز
                            </button>
                        ) : (
                            <button className="btn-primary-2026" onClick={handleLinkDevice} disabled={isConnecting}>
                                {isConnecting ? <RefreshCcw className="animate-spin" size={18} /> : <Smartphone size={18} />}
                                {isConnecting ? 'جاري البدء...' : 'ربط جهاز جديد'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="stats-grid-2026">
                    <div className="stat-card-2026">
                        <div className="stat-icon orange"><MessageSquare /></div>
                        <div className="stat-data">
                            <h3>{stats?.totalMessages || 0}</h3>
                            <span>رسائل اليوم</span>
                        </div>
                        <div className="stat-trend trend-up">+12%</div>
                    </div>
                    <div className="stat-card-2026">
                        <div className="stat-icon orange"><UserPlus /></div>
                        <div className="stat-data">
                            <h3>{stats?.newLeads || 0}</h3>
                            <span>عملاء محققون</span>
                        </div>
                        <div className="stat-trend trend-up">+5%</div>
                    </div>
                    <div className="stat-card-2026">
                        <div className="stat-icon orange"><Zap /></div>
                        <div className="stat-data">
                            <h3>{stats?.conversionProbability || '74'}% <Sparkles size={16} className="text-orange animate-pulse" style={{ display: 'inline' }} /></h3>
                            <span>احتمالية التحويل الذكي</span>
                        </div>
                        <div className="stat-trend trend-up">عالٍ</div>
                    </div>
                    <div className="stat-card-2026">
                        <div className="stat-icon orange"><Clock /></div>
                        <div className="stat-data">
                            <h3>4.2m</h3>
                            <span>سرعة الرد</span>
                        </div>
                        <div className="stat-trend trend-down">-1.5m</div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="tracker-main">
                    {/* Left Sidebar - Navigation & Filters */}
                    <div className="tracker-sidebar">
                        <div className="nav-group">
                            <button
                                className={`nav-item ${activeTab === 'live' ? 'active' : ''}`}
                                onClick={() => setActiveTab('live')}
                            >
                                <MessageSquare size={18} /> سجل النشاط المباشر
                            </button>
                            <button
                                className={`nav-item ${activeTab === 'leads' ? 'active' : ''}`}
                                onClick={() => setActiveTab('leads')}
                            >
                                <Users size={18} /> قائمة العملاء (Leads)
                            </button>
                            <button
                                className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
                                onClick={() => setActiveTab('analytics')}
                            >
                                <Zap size={18} /> توصيات الذكاء الاصطناعي
                            </button>
                        </div>

                        <div className="sidebar-divider"></div>

                        <div className="search-box">
                            <Search size={16} />
                            <input type="text" placeholder="بحث في المحادثات..." />
                        </div>

                        <div className="filter-group">
                            <label>تصفية حسب أهمية العميل</label>
                            <div className="filter-options">
                                <span className="filter-chip active">الكل</span>
                                <span className="filter-chip">المهتمين جداً</span>
                                <span className="filter-chip">التسعير</span>
                            </div>
                        </div>
                    </div>

                    {/* Feed Content */}
                    <div className="feed-content">
                        <div className="feed-header">
                            <h2>{activeTab === 'live' ? 'النشاط المباشر' : 'تحليل ذكاء العملاء'}</h2>
                            <div className="feed-controls">
                                <button className="btn-icon"><Filter size={18} /></button>
                                <button className="btn-icon"><MoreVertical size={18} /></button>
                            </div>
                        </div>

                        {isInitialLoading ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <p>جاري تحليل تدفق رسائل واتساب المباشرة...</p>
                            </div>
                        ) : (
                            activeTab === 'live' ? (
                                <div className="activity-list">
                                    {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                                        stats.recentActivities.map((activity) => (
                                            <div key={activity.id} className="activity-item">
                                                <div className="activity-main">
                                                    <div className={`priority-indicator ${getPriorityClass(activity.metadata.newScore || 0)}`}>
                                                        {getPriorityIcon(activity.metadata.newScore || 0)}
                                                    </div>
                                                    <div className="activity-details">
                                                        <div className="lead-meta">
                                                            <span className="lead-name">{activity.lead.firstName} {activity.lead.lastName}</span>
                                                            <span className="lead-sentiment" title="Sentiment Analysis">
                                                                {getSentimentEmoji(activity.metadata.sentiment)}
                                                            </span>
                                                            <span className="lead-phone">{activity.lead.phone}</span>
                                                            <span className="activity-time">{new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <div className="message-bubble">
                                                            <p>{activity.metadata.message}</p>
                                                        </div>

                                                        {activity.metadata.summary && (
                                                            <div className="ai-insight-bubble">
                                                                <div className="ai-header">
                                                                    <Sparkles size={14} />
                                                                    <span>تحليل الذكاء الاصطناعي</span>
                                                                </div>
                                                                <p className="ai-text">{activity.metadata.summary}</p>
                                                                <div className="ai-suggested-action">
                                                                    <strong>الإجراء المقترح:</strong> {activity.metadata.suggestedAction || 'متابعة سريعة'}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="intent-tags">
                                                            {activity.metadata.intent && (
                                                                <span className={`intent-badge ${activity.metadata.intent}`}>
                                                                    {activity.metadata.intent.replace('_', ' ')}
                                                                </span>
                                                            )}
                                                            {((activity.metadata as any).score || (activity.metadata as any).newScore) && (
                                                                <div className="score-viz">
                                                                    <div className="score-bar">
                                                                        <div
                                                                            className="score-fill"
                                                                            style={{
                                                                                width: `${(activity.metadata as any).score || (activity.metadata as any).newScore}%`,
                                                                                height: '100%',
                                                                                background: 'linear-gradient(90deg, #f97316, #ea580c)'
                                                                            }}
                                                                        ></div>
                                                                    </div>
                                                                    <span className="score-text">قوة الاهتمام: {(activity.metadata as any).score || (activity.metadata as any).newScore}%</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="activity-actions">
                                                    <button className="btn-action">السجل</button>
                                                    <button className="btn-primary-sm">رد سريع <ArrowUpRight size={14} /></button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-state">
                                            <MessageSquare size={48} className="muted" />
                                            <h3>لا يوجد نشاط بعد</h3>
                                            <p>امسح رمز QR لبدء تتبع المحادثات بشكل ذكي.</p>
                                        </div>
                                    )}
                                </div>
                            ) : activeTab === 'leads' ? (
                                <div className="leads-intelligence-grid">
                                    {stats?.topLeads && stats.topLeads.length > 0 ? (
                                        stats.topLeads.map(lead => (
                                            <div key={lead.id} className="intelligence-card glass-panel">
                                                <div className="lead-header">
                                                    <div className="lead-info">
                                                        <h4>{lead.firstName} {lead.lastName}</h4>
                                                        <span className="lead-phone">{lead.phone}</span>
                                                    </div>
                                                    <div className="lead-score-badge">
                                                        <Zap size={14} fill="#f97316" color="#f97316" />
                                                        <span>درجة الاهتمام {lead.interestScore}%</span>
                                                    </div>
                                                </div>

                                                {lead.aiFollowUpNotes && (
                                                    <div className="ai-analysis-box">
                                                        <div className="ai-label">
                                                            <Sparkles size={14} />
                                                            <span>ملف العميل واستراتيجية المتابعة</span>
                                                        </div>
                                                        <p>{lead.aiFollowUpNotes}</p>
                                                    </div>
                                                )}

                                                <div className="lead-actions">
                                                    <button className="btn-primary-small">متابعة الآن</button>
                                                    <button className="btn-secondary-small">الملف الشخصي</button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-state">
                                            <AlertCircle size={40} />
                                            <p>لم يتم اكتشاف عملاء مهتمين جداً بعد. استمر في التفاعل!</p>
                                        </div>
                                    )}
                                </div>
                            ) : null
                        )}
                    </div>

                    {/* Right Sidebar - Intelligent Insights */}
                    <div className="tracker-insights glass-panel">
                        <div className="insights-header">
                            <h3>لوحة تحكم الذكاء الاصطناعي</h3>
                            <span className="live-indicator"><span className="pulse"></span> مباشر</span>
                        </div>

                        <div className="insight-card highlight">
                            <div className="insight-header">
                                <CheckCircle2 size={16} className="text-green" />
                                <span>توصية النظام الذكية</span>
                            </div>
                            <p><strong>تحسين المتابعة</strong>: العملاء الذين يسألون عن "التسعير" تزيد فرص تحويلهم بـ 3 أضعاف إذا تم الرد خلال أقل من 15 دقيقة.</p>
                            <button className="btn-text">مراجعة الاستراتيجية ←</button>
                        </div>

                        <div className="insight-card">
                            <div className="insight-header">
                                <AlertCircle size={16} className="text-orange" />
                                <span>احتمالية تحويل العميل</span>
                            </div>
                            <div className="probability-viz">
                                <div className="prob-label">
                                    <span>رحلة اهتمام عالية</span>
                                    <span>{stats?.conversionProbability || 74}%</span>
                                </div>
                                <div className="prob-bar-container">
                                    <div className="prob-bar" style={{ width: `${stats?.conversionProbability || 74}%` }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="insight-card">
                            <div className="insight-header">
                                <Zap size={16} className="text-purple" />
                                <span>تحليل التوجهات الحالية</span>
                            </div>
                            <div className="cloud-tags">
                                {stats?.intentDistribution?.map(intent => (
                                    <span key={intent.tag} className="tag">{intent.tag} ({intent.count})</span>
                                )) || [
                                        <span key="p" className="tag">التسعير (45)</span>,
                                        <span key="d" className="tag">التسجيل (12)</span>,
                                        <span key="s" className="tag">الدعم (8)</span>
                                    ]}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WhatsAppTracker;
