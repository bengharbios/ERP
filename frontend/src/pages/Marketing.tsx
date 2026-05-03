// @ts-nocheck
import { useState, useEffect } from 'react';
import {
    marketingService,
    MarketingCampaign,
    MarketingLead,
    MarketingAudience,
    CampaignStatus,
    CampaignType,
    AudienceType,
    LeadStatus
} from '../services/marketing.service';
import './Marketing.css';

/**
 * MARKETING & CAMPAIGNS MODULE (Professional ERP 2026)
 * Strict Alignment with StudentFees "Next Gen" Design System
 */

export default function Marketing() {
    // --- Data States ---
    const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
    const [leads, setLeads] = useState<MarketingLead[]>([]);
    const [audiences, setAudiences] = useState<MarketingAudience[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // --- Filter & View States ---
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState<CampaignStatus | 'all'>('all');

    // --- Advanced Analytics States ---
    const [activeTab, setActiveTab] = useState<'campaigns' | 'funnel' | 'leads' | 'roi' | 'abtest'>('campaigns');
    const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
    const [funnelData, setFunnelData] = useState<any>(null);
    const [roiData, setROIData] = useState<any>(null);
    const [scoredLeads, setScoredLeads] = useState<any[]>([]);
    const [testResults, setTestResults] = useState<any>(null);
    const [showVariantModal, setShowVariantModal] = useState(false);

    // --- Modal states ---
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [showAudienceModal, setShowAudienceModal] = useState(false);

    // --- Form states ---
    const [campaignForm, setCampaignForm] = useState({
        name: '',
        type: 'LANDING_PAGE' as CampaignType,
        audienceId: '',
        budget: '',
        startDate: '',
        endDate: ''
    });

    const [audienceForm, setAudienceForm] = useState({
        name: '',
        description: '',
        type: 'CORE' as AudienceType
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [campaignsRes, leadsRes, audiencesRes, statsRes] = await Promise.all([
                marketingService.getCampaigns(),
                marketingService.getLeads(),
                marketingService.getAudiences(),
                marketingService.getStats()
            ]);

            setCampaigns(campaignsRes.data || []);
            setLeads(leadsRes.data || []);
            setAudiences(audiencesRes.data || []);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Failed to load marketing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCampaign = async () => {
        try {
            await marketingService.createCampaign({
                ...campaignForm,
                budget: campaignForm.budget ? parseFloat(campaignForm.budget) : null,
                audienceId: campaignForm.audienceId || null
            });
            setShowCampaignModal(false);
            resetCampaignForm();
            loadData();
        } catch (error) {
            console.error('Failed to create campaign:', error);
        }
    };

    const handleCreateAudience = async () => {
        try {
            await marketingService.createAudience(audienceForm);
            setShowAudienceModal(false);
            resetAudienceForm();
            loadData();
        } catch (error) {
            console.error('Failed to create audience:', error);
        }
    };

    const handleUpdateCampaignStatus = async (id: string, status: CampaignStatus) => {
        try {
            await marketingService.updateCampaignStatus(id, status);
            loadData();
        } catch (error) {
            console.error('Failed to update campaign status:', error);
        }
    };

    const handleUpdateLeadStatus = async (id: string, status: LeadStatus) => {
        try {
            await marketingService.updateLeadStatus(id, status);
            loadData();
        } catch (error) {
            console.error('Failed to update lead status:', error);
        }
    };

    const resetCampaignForm = () => {
        setCampaignForm({
            name: '',
            type: 'LANDING_PAGE',
            audienceId: '',
            budget: '',
            startDate: '',
            endDate: ''
        });
    };

    const resetAudienceForm = () => {
        setAudienceForm({
            name: '',
            description: '',
            type: 'CORE'
        });
    };

    const getCampaignTypeIcon = (type: CampaignType) => {
        const icons = {
            WHATSAPP: '💬',
            LANDING_PAGE: '🌐',
            SOCIAL_MEDIA: '📱',
            EMAIL: '📧',
            SMS: '📲'
        };
        return icons[type] || '📊';
    };

    const getStatusBadge = (status: CampaignStatus) => {
        const badges: Record<CampaignStatus, { text: string; color: string }> = {
            DRAFT: { text: 'مسودة', color: '#718096' },
            SCHEDULED: { text: 'مجدولة', color: '#4299E1' },
            ACTIVE: { text: 'نشطة', color: '#38A169' },
            PAUSED: { text: 'متوقفة', color: '#ED8936' },
            COMPLETED: { text: 'مكتملة', color: '#805AD5' },
            ARCHIVED: { text: 'مؤرشفة', color: '#A0AEC0' }
        };
        return badges[status] || badges.DRAFT;
    };

    // --- Filter Logic ---
    const filteredCampaigns = campaigns.filter(c => {
        const matchesSearch = !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = !filterType || c.type === filterType;
        const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
        return matchesSearch && matchesType && matchesStatus;
    });

    const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;

    // Load funnel analytics for selected campaign
    const loadFunnelAnalytics = async (campaignId: string) => {
        try {
            const res = await marketingService.getFunnelAnalytics(campaignId);
            setFunnelData(res.data);
        } catch (error) {
            console.error('Failed to load funnel:', error);
        }
    };

    // Load ROI data for selected campaign
    const loadROIData = async (campaignId: string) => {
        try {
            const res = await marketingService.getCampaignROI(campaignId);
            setROIData(res.data);
        } catch (error) {
            console.error('Failed to load ROI:', error);
        }
    };

    // Load scored leads
    const loadScoredLeads = async () => {
        try {
            const res = await marketingService.getLeadsWithScoring();
            setScoredLeads(res.data || []);
        } catch (error) {
            console.error('Failed to load scored leads:', error);
        }
    };

    // Load A/B test results
    const loadTestResults = async (campaignId: string) => {
        try {
            const res = await marketingService.getTestResults(campaignId);
            setTestResults(res.data);
        } catch (error) {
            console.error('Failed to load test results:', error);
        }
    };

    // Declare A/B test winner
    const handleDeclareWinner = async (campaignId: string, winnerVariantId: string) => {
        try {
            await marketingService.declareWinner(campaignId, winnerVariantId);
            alert('✅ فائز تم الإعلان عنه بنجاح!');
            loadTestResults(campaignId);
        } catch (error: any) {
            alert('❌ خطأ: ' + (error.response?.data?.message || 'فشل إعلان الفائز'));
        }
    };

    return (
        <div className="next-gen-page-container orange-theme marketing-page-2026">
            {/* --- Premium Floating Header --- */}
            <header className="glass-header">
                <div className="container-wide header-content">
                    <div className="header-branding">
                        <div className="branding-icon orange">🚀</div>
                        <div className="branding-text">
                            <h1>التسويق والحملات</h1>
                            <p className="hide-on-mobile">إدارة الحملات بتقنيات الذكاء الاصطناعي 2026</p>
                        </div>
                    </div>

                    <div className="header-actions">
                        <div className="view-switcher hide-on-mobile">
                            <button onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'active' : ''}>▦</button>
                            <button onClick={() => setViewMode('table')} className={viewMode === 'table' ? 'active' : ''}>☰</button>
                        </div>
                        <div className="header-pills hide-on-mobile">
                            <span className="pill pill-orange">النشطة: {activeCampaigns}</span>
                        </div>
                        <button onClick={() => setShowCampaignModal(true)} className="btn-modern btn-orange-gradient">
                            <span className="plus-icon">+</span>
                            <span className="hide-on-mobile">حملة جديدة</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* --- Main Content --- */}
            <main className="container-wide main-content">
                {/* Desktop Search & Filters Toolbar */}
                <section className="filters-toolbar hide-on-mobile">
                    <div className="search-box-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="بحث باسم الحملة..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filters-group">
                        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                            <option value="">كل الأنواع</option>
                            <option value="LANDING_PAGE">🌐 صفحة هبوط</option>
                            <option value="WHATSAPP">💬 واتساب</option>
                            <option value="SOCIAL_MEDIA">📱 وسائل التواصل</option>
                            <option value="EMAIL">📧 بريد إلكتروني</option>
                            <option value="SMS">📲 رسائل نصية</option>
                        </select>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
                            <option value="all">كل الحالات</option>
                            <option value="ACTIVE">نشطة</option>
                            <option value="DRAFT">مسودة</option>
                            <option value="PAUSED">متوقفة</option>
                            <option value="COMPLETED">مكتملة</option>
                        </select>
                    </div>
                </section>

                {/* --- Analytics Tabs --- */}
                <section className="analytics-tabs-2026">
                    <button
                        className={activeTab === 'campaigns' ? 'tab-active' : ''}
                        onClick={() => setActiveTab('campaigns')}
                    >
                        📊 الحملات
                    </button>
                    <button
                        className={activeTab === 'funnel' ? 'tab-active' : ''}
                        onClick={() => { setActiveTab('funnel'); if (campaigns[0]) loadFunnelAnalytics(campaigns[0].id); }}
                    >
                        📈 مسار التحويل
                    </button>
                    <button
                        className={activeTab === 'leads' ? 'tab-active' : ''}
                        onClick={() => { setActiveTab('leads'); loadScoredLeads(); }}
                    >
                        🎯 تقييم العملاء
                    </button>
                    <button
                        className={activeTab === 'roi' ? 'tab-active' : ''}
                        onClick={() => { setActiveTab('roi'); if (campaigns[0]) loadROIData(campaigns[0].id); }}
                    >
                        💰 عائد الاستثمار
                    </button>
                </section>

                {/* --- Executive Insights Grid --- */}
                {stats && (
                    <section className="executive-stats-2026">
                        <div className="stat-card-2026 orange">
                            <div className="st-info">
                                <span className="st-label">إجمالي العملاء المحتملين</span>
                                <h3 className="st-value">{stats.overview.totalLeads}</h3>
                            </div>
                            <div className="st-icon">🎯</div>
                        </div>
                        <div className="stat-card-2026 green">
                            <div className="st-info">
                                <span className="st-label">الحملات النشطة</span>
                                <h3 className="st-value">{stats.overview.activeCampaigns}</h3>
                            </div>
                            <div className="st-icon">📊</div>
                        </div>
                        <div className="stat-card-2026 orange">
                            <div className="st-info">
                                <span className="st-label">الوصول الكلي</span>
                                <h3 className="st-value">{stats.overview.totalReach.toLocaleString()}</h3>
                            </div>
                            <div className="st-icon">👁️</div>
                        </div>
                        <div className="stat-card-2026 green">
                            <div className="st-info">
                                <span className="st-label">معدل التحويل (AI)</span>
                                <h3 className="st-value">{stats.overview.conversionRate}%</h3>
                            </div>
                            <div className="st-icon">✨</div>
                        </div>
                    </section>
                )}

                {/* Data Display - Campaigns Tab */}
                {activeTab === 'campaigns' && (
                    <div className={`content-transition-wrapper ${viewMode}`}>
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                                <div className="spinner"></div>
                            </div>
                        ) : filteredCampaigns.length === 0 ? (
                            <div className="empty-state-modern">
                                <div className="empty-icon">📢</div>
                                <h2>لا توجد حملات</h2>
                                <p>لا توجد حملات تطابق معايير البحث الحالية.</p>
                            </div>
                        ) : viewMode === 'grid' ? (
                            <div key="grid-view" className="programs-grid-2026">
                                {filteredCampaigns.map((campaign) => (
                                    <div key={campaign.id} className="program-card-2026 card-hover">
                                        <div className="card-header-2026">
                                            <div className="card-meta">
                                                <span className="type-badge">{getCampaignTypeIcon(campaign.type)} {campaign.type}</span>
                                                <span
                                                    className="status-pill"
                                                    style={{ background: getStatusBadge(campaign.status).color }}
                                                >
                                                    {getStatusBadge(campaign.status).text}
                                                </span>
                                            </div>
                                        </div>

                                        <h3 className="card-title-2026">{campaign.name}</h3>

                                        <div className="card-metrics">
                                            <div className="metric-item">
                                                <span className="metric-label">العملاء المحتملون</span>
                                                <span className="metric-value">{campaign._count?.leads || 0}</span>
                                            </div>
                                            {campaign.budget && (
                                                <div className="metric-item">
                                                    <span className="metric-label">الميزانية</span>
                                                    <span className="metric-value">{campaign.budget} ر.س</span>
                                                </div>
                                            )}
                                            {campaign.aiScore && (
                                                <div className="metric-item ai-highlight">
                                                    <span className="metric-label">نقاط AI</span>
                                                    <span className="metric-value">{campaign.aiScore}/10</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="card-actions-2026">
                                            {campaign.status === 'DRAFT' && (
                                                <button
                                                    className="btn-action btn-primary"
                                                    onClick={() => handleUpdateCampaignStatus(campaign.id, 'ACTIVE')}
                                                >
                                                    تفعيل
                                                </button>
                                            )}
                                            {campaign.status === 'ACTIVE' && (
                                                <button
                                                    className="btn-action btn-warning"
                                                    onClick={() => handleUpdateCampaignStatus(campaign.id, 'PAUSED')}
                                                >
                                                    إيقاف مؤقت
                                                </button>
                                            )}
                                            {campaign.status === 'PAUSED' && (
                                                <button
                                                    className="btn-action btn-primary"
                                                    onClick={() => handleUpdateCampaignStatus(campaign.id, 'ACTIVE')}
                                                >
                                                    استئناف
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="modern-table-container">
                                <table className="modern-table-2026">
                                    <thead>
                                        <tr>
                                            <th>الحملة</th>
                                            <th>النوع</th>
                                            <th>الحالة</th>
                                            <th>الجمهور</th>
                                            <th>العملاء المحتملون</th>
                                            <th>الميزانية</th>
                                            <th>الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCampaigns.map((campaign) => (
                                            <tr key={campaign.id}>
                                                <td className="td-bold">{campaign.name}</td>
                                                <td>{getCampaignTypeIcon(campaign.type)} {campaign.type}</td>
                                                <td>
                                                    <span
                                                        className="status-pill"
                                                        style={{ background: getStatusBadge(campaign.status).color }}
                                                    >
                                                        {getStatusBadge(campaign.status).text}
                                                    </span>
                                                </td>
                                                <td>{campaign.audience?.name || '-'}</td>
                                                <td>{campaign._count?.leads || 0}</td>
                                                <td>{campaign.budget ? `${campaign.budget} ر.س` : '-'}</td>
                                                <td>
                                                    <div className="table-actions">
                                                        {campaign.status === 'DRAFT' && (
                                                            <button onClick={() => handleUpdateCampaignStatus(campaign.id, 'ACTIVE')}>
                                                                تفعيل
                                                            </button>
                                                        )}
                                                        {campaign.status === 'ACTIVE' && (
                                                            <button onClick={() => handleUpdateCampaignStatus(campaign.id, 'PAUSED')}>
                                                                إيقاف
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Funnel Analytics Tab */}
                {activeTab === 'funnel' && (
                    <div className="funnel-analytics-2026">
                        <div className="funnel-header">
                            <h2>مسار التحويل - تحليل مراحل العملاء</h2>
                            <select onChange={(e) => loadFunnelAnalytics(e.target.value)}>
                                <option value="">-- اختر حملة --</option>
                                {campaigns.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {funnelData ? (
                            <div className="funnel-visualization">
                                {funnelData.map((stage: any, index: number) => (
                                    <div key={stage.stage} className="funnel-stage">
                                        <div className="stage-info">
                                            <h3>المرحلة {index + 1}: {stage.stage}</h3>
                                            <div className="stage-count">{stage.count} عميل</div>
                                        </div>
                                        <div className="stage-bar" style={{ width: `${100 - (index * 15)}%` }}>
                                            <span>{stage.conversionRate?.toFixed(1)}% معدل التحويل</span>
                                        </div>
                                        {stage.dropOffRate > 0 && (
                                            <div className="drop-off-indicator">
                                                ⚠️ تسرب {stage.dropOffRate.toFixed(1)}%
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state-modern">
                                <div className="empty-icon">📊</div>
                                <h2>اختر حملة لعرض مسار التحويل</h2>
                            </div>
                        )}
                    </div>
                )}

                {/* Lead Scoring Tab */}
                {activeTab === 'leads' && (
                    <div className="lead-scoring-2026">
                        <h2>العملاء المحتملون - مرتبون حسب الأولوية</h2>

                        {scoredLeads.length > 0 ? (
                            <div className="scored-leads-grid">
                                {scoredLeads.map((lead) => {
                                    const quality = lead.scoring?.quality || 'COLD';
                                    const qualityColors = {
                                        HOT: '#E53E3E',
                                        WARM: '#ED8936',
                                        COLD: '#718096'
                                    };

                                    return (
                                        <div key={lead.id} className="lead-score-card">
                                            <div className="lead-header">
                                                <div>
                                                    <h4>{lead.firstName} {lead.lastName}</h4>
                                                    <p className="lead-contact">{lead.email || lead.phone}</p>
                                                </div>
                                                <div
                                                    className="quality-badge"
                                                    style={{ background: qualityColors[quality as keyof typeof qualityColors] }}
                                                >
                                                    {quality === 'HOT' ? '🔥 ساخن' : quality === 'WARM' ? '🌤️ دافئ' : '❄️ بارد'}
                                                </div>
                                            </div>

                                            <div className="score-breakdown">
                                                <div className="score-main">
                                                    <span className="score-label">النقاط الكلية</span>
                                                    <span className="score-value">{lead.scoring?.totalScore || 0}/100</span>
                                                </div>
                                                <div className="mini-scores">
                                                    <span>👤 {lead.scoring?.demographicScore || 0}</span>
                                                    <span>💬 {lead.scoring?.engagementScore || 0}</span>
                                                    <span>⚡ {lead.scoring?.behaviorScore || 0}</span>
                                                </div>
                                            </div>

                                            {lead.scoring?.recommendedAction && (
                                                <div className="ai-recommendation">
                                                    <span className="ai-icon">✨</span>
                                                    <span>{lead.scoring.recommendedAction}</span>
                                                </div>
                                            )}

                                            <div className="conversion-prob">
                                                احتمالية التحويل: {lead.scoring?.conversionProb || 0}%
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="empty-state-modern">
                                <div className="empty-icon">🎯</div>
                                <h2>لا توجد عملاء محتملون بعد</h2>
                            </div>
                        )}
                    </div>
                )}

                {/* ROI Dashboard Tab */}
                {activeTab === 'roi' && (
                    <div className="roi-dashboard-2026">
                        <div className="roi-header">
                            <h2>عائد الاستثمار - تحليل الربحية</h2>
                            <select onChange={(e) => loadROIData(e.target.value)}>
                                <option value="">-- اختر حملة --</option>
                                {campaigns.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {roiData ? (
                            <div className="roi-metrics">
                                <div className="roi-summary">
                                    <div className={`profitability-indicator ${roiData.profitability}`}>
                                        {roiData.profitability === 'profitable' ? '✅ مربحة' : '⚠️ خسارة'}
                                    </div>
                                    <div className="roi-percentage">
                                        <span className="roi-label">عائد الاستثمار (ROI)</span>
                                        <span className="roi-value">{roiData.roi}%</span>
                                    </div>
                                </div>

                                <div className="metrics-grid">
                                    <div className="metric-box">
                                        <span className="metric-icon">💵</span>
                                        <div>
                                            <p className="metric-title">إجمالي المصروفات</p>
                                            <p className="metric-number">{roiData.totalSpent} ر.س</p>
                                        </div>
                                    </div>

                                    <div className="metric-box">
                                        <span className="metric-icon">💰</span>
                                        <div>
                                            <p className="metric-title">إجمالي الإيرادات</p>
                                            <p className="metric-number">{roiData.totalRevenue} ر.س</p>
                                        </div>
                                    </div>

                                    <div className="metric-box">
                                        <span className="metric-icon">🎯</span>
                                        <div>
                                            <p className="metric-title">تكلفة العميل المحتمل (CPL)</p>
                                            <p className="metric-number">{roiData.costPerLead} ر.س</p>
                                        </div>
                                    </div>

                                    <div className="metric-box">
                                        <span className="metric-icon">✅</span>
                                        <div>
                                            <p className="metric-title">تكلفة الاستحواذ (CPA)</p>
                                            <p className="metric-number">{roiData.costPerAcq} ر.س</p>
                                        </div>
                                    </div>

                                    <div className="metric-box">
                                        <span className="metric-icon">📊</span>
                                        <div>
                                            <p className="metric-title">عائد الإنفاق الإعلاني (ROAS)</p>
                                            <p className="metric-number">{roiData.roas}x</p>
                                        </div>
                                    </div>

                                    <div className="metric-box">
                                        <span className="metric-icon">👥</span>
                                        <div>
                                            <p className="metric-title">العملاء المحولون</p>
                                            <p className="metric-number">{roiData.convertedLeads} / {roiData.totalLeads}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="empty-state-modern">
                                <div className="empty-icon">💰</div>
                                <h2>اختر حملة لعرض تحليل العائد</h2>
                            </div>
                        )}
                    </div>
                )}

                {/* A/B Testing Tab */}
                {activeTab === 'abtest' && (
                    <div className="ab-testing-2026">
                        <div className="ab-test-header">
                            <h2>🧪 اختبارات A/B - تحسين الحملات علمياً</h2>
                            <div className="ab-header-actions">
                                <select onChange={(e) => loadTestResults(e.target.value)}>
                                    <option value="">-- اختر حملة --</option>
                                    {campaigns.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <button className="btn-modern btn-orange-gradient" onClick={() => setShowVariantModal(true)}>
                                    ➕ إضافة متغيرات
                                </button>
                            </div>
                        </div>

                        {testResults ? (
                            <div className="ab-test-content">
                                {/* Variants Comparison Table */}
                                <div className="variants-table-container">
                                    <table className="variants-table">
                                        <thead>
                                            <tr>
                                                <th>المتغير</th>
                                                <th>الظهور</th>
                                                <th>النقرات</th>
                                                <th>التحويلات</th>
                                                <th>معدل التحويل</th>
                                                <th>معدل النقر</th>
                                                <th>الحالة</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {testResults.variants?.map((variant: any) => (
                                                <tr key={variant.id}>
                                                    <td className="td-bold">{variant.name}</td>
                                                    <td>{variant.impressions}</td>
                                                    <td>{variant.clicks}</td>
                                                    <td>{variant.conversions}</td>
                                                    <td className="metric-highlight">{variant.conversionRate}%</td>
                                                    <td>{variant.clickThroughRate}%</td>
                                                    <td>
                                                        <span className={`status-pill status-${variant.status.toLowerCase()}`}>
                                                            {variant.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Statistical Significance */}
                                {testResults.comparisons && testResults.comparisons.length > 0 && (
                                    <div className="significance-section">
                                        <h3>📊 التحليل الإحصائي</h3>
                                        <div className="comparisons-grid">
                                            {testResults.comparisons.map((comp: any) => (
                                                <div key={comp.variantId} className={`comparison-card ${comp.isSignificant ? 'significant' : 'not-significant'}`}>
                                                    <div className="comparison-header">
                                                        <h4>{comp.variantName} vs Control</h4>
                                                        {comp.isSignificant && <span className="winner-badge">🏆 فائز محتمل</span>}
                                                    </div>

                                                    <div className="comparison-metrics">
                                                        <div className="comp-metric">
                                                            <span className="comp-label">نسبة التحسين</span>
                                                            <span className={`comp-value ${parseFloat(comp.improvementRate) > 0 ? 'positive' : 'negative'}`}>
                                                                {comp.improvementRate}%
                                                            </span>
                                                        </div>
                                                        <div className="comp-metric">
                                                            <span className="comp-label">مستوى الثقة</span>
                                                            <span className="comp-value">{comp.confidence}%</span>
                                                        </div>
                                                        <div className="comp-metric">
                                                            <span className="comp-label">P-Value</span>
                                                            <span className="comp-value">{comp.pValue}</span>
                                                        </div>
                                                    </div>

                                                    <div className="comparison-message">
                                                        {comp.message}
                                                    </div>

                                                    {comp.isSignificant && (
                                                        <button
                                                            className="btn-declare-winner"
                                                            onClick={() => handleDeclareWinner(testResults.variants[0].campaignId, comp.variantId)}
                                                        >
                                                            🎯 إعلان كفائز
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Winner Declared */}
                                {testResults.hasWinner && (
                                    <div className="winner-declared">
                                        <div className="winner-icon">🏆</div>
                                        <h3>تم تحديد الفائز!</h3>
                                        <p>تم العثور على متغير فائز بمستوى ثقة إحصائي عالٍ</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="empty-state-modern">
                                <div className="empty-icon">🧪</div>
                                <h2>اختر حملة لعرض نتائج الاختبار</h2>
                                <p>أنشئ متغيرات وابدأ اختبار A/B لتحسين حملاتك</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Campaign Modal */}
            {showCampaignModal && (
                <div className="modal-overlay-2026" onClick={() => setShowCampaignModal(false)}>
                    <div className="modal-content-2026" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-2026">
                            <h3>إنشاء حملة تسويقية جديدة</h3>
                            <button className="btn-close-2026" onClick={() => setShowCampaignModal(false)}>✕</button>
                        </div>
                        <div className="modal-body-2026">
                            <div className="form-group-2026">
                                <label>اسم الحملة *</label>
                                <input
                                    type="text"
                                    value={campaignForm.name}
                                    onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                                />
                            </div>

                            <div className="form-group-2026">
                                <label>نوع الحملة *</label>
                                <select
                                    value={campaignForm.type}
                                    onChange={(e) => setCampaignForm({ ...campaignForm, type: e.target.value as CampaignType })}
                                >
                                    <option value="LANDING_PAGE">🌐 صفحة هبوط</option>
                                    <option value="WHATSAPP">💬 واتساب</option>
                                    <option value="SOCIAL_MEDIA">📱 وسائل التواصل</option>
                                    <option value="EMAIL">📧 بريد إلكتروني</option>
                                    <option value="SMS">📲 رسائل نصية</option>
                                </select>
                            </div>

                            <div className="form-group-2026">
                                <label>الجمهور المستهدف</label>
                                <select
                                    value={campaignForm.audienceId}
                                    onChange={(e) => setCampaignForm({ ...campaignForm, audienceId: e.target.value })}
                                >
                                    <option value="">-- اختر الجمهور --</option>
                                    {audiences.map((aud) => (
                                        <option key={aud.id} value={aud.id}>{aud.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-grid-2026">
                                <div className="form-group-2026">
                                    <label>تاريخ البداية</label>
                                    <input
                                        type="date"
                                        value={campaignForm.startDate}
                                        onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
                                    />
                                </div>

                                <div className="form-group-2026">
                                    <label>تاريخ النهاية</label>
                                    <input
                                        type="date"
                                        value={campaignForm.endDate}
                                        onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group-2026">
                                <label>الميزانية (ر.س)</label>
                                <input
                                    type="number"
                                    value={campaignForm.budget}
                                    onChange={(e) => setCampaignForm({ ...campaignForm, budget: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="modal-footer-2026">
                            <button className="btn-cancel-2026" onClick={() => setShowCampaignModal(false)}>
                                إلغاء
                            </button>
                            <button className="btn-primary-2026" onClick={handleCreateCampaign}>
                                إنشاء الحملة
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Audience Modal */}
            {showAudienceModal && (
                <div className="modal-overlay-2026" onClick={() => setShowAudienceModal(false)}>
                    <div className="modal-content-2026" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-2026">
                            <h3>إنشاء جمهور مستهدف</h3>
                            <button className="btn-close-2026" onClick={() => setShowAudienceModal(false)}>✕</button>
                        </div>
                        <div className="modal-body-2026">
                            <div className="form-group-2026">
                                <label>اسم الجمهور *</label>
                                <input
                                    type="text"
                                    value={audienceForm.name}
                                    onChange={(e) => setAudienceForm({ ...audienceForm, name: e.target.value })}
                                />
                            </div>

                            <div className="form-group-2026">
                                <label>نوع الجمهور *</label>
                                <select
                                    value={audienceForm.type}
                                    onChange={(e) => setAudienceForm({ ...audienceForm, type: e.target.value as AudienceType })}
                                >
                                    <option value="CORE">جمهور أساسي (Core)</option>
                                    <option value="CUSTOM">جمهور مخصص (Custom)</option>
                                    <option value="LOOKALIKE">جمهور مشابه (Lookalike)</option>
                                    <option value="AI_PREDICTIVE">ذكاء اصطناعي تنبؤي</option>
                                </select>
                            </div>

                            <div className="form-group-2026">
                                <label>الوصف</label>
                                <textarea
                                    value={audienceForm.description}
                                    onChange={(e) => setAudienceForm({ ...audienceForm, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="modal-footer-2026">
                            <button className="btn-cancel-2026" onClick={() => setShowAudienceModal(false)}>
                                إلغاء
                            </button>
                            <button className="btn-primary-2026" onClick={handleCreateAudience}>
                                إنشاء الجمهور
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
