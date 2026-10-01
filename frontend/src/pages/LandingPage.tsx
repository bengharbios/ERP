import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    GraduationCap, ShieldCheck, Zap, Sparkles, Check, ArrowRight,
    Users, Wallet, BarChart3, MessageSquare, Globe, ChevronLeft,
    Building2, Phone, Mail, Lock, CheckCircle2, Star, Award, Layers
} from 'lucide-react';
import { apiClient } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function LandingPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);

    const [billingAnnual, setBillingAnnual] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'STARTER' | 'PRO' | 'BUSINESS'>('PRO');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Signup form state
    const [formData, setFormData] = useState({
        instituteName: '',
        slug: '',
        adminFullName: '',
        adminEmail: '',
        adminPassword: '',
        phone: '',
        country: 'SA',
    });

    const handleSlugAutoFill = (name: string) => {
        // Auto generate simple english slug from institute name if possible
        const cleaned = name
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');
        setFormData(prev => ({ ...prev, instituteName: name, slug: prev.slug || cleaned }));
    };

    const handleSignupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSubmitting(true);

        try {
            const payload = {
                name: formData.instituteName,
                slug: formData.slug || `inst-${Date.now().toString().slice(-5)}`,
                adminFullName: formData.adminFullName,
                adminEmail: formData.adminEmail,
                adminPassword: formData.adminPassword,
                phone: formData.phone,
                country: formData.country,
                plan: selectedPlan,
            };

            const res = await apiClient.post('/tenants', payload);
            if (res.data?.success) {
                // Auto login the newly created institute admin
                const loginRes = await apiClient.post('/auth/login', {
                    email: formData.adminEmail,
                    password: formData.adminPassword,
                });

                if (loginRes.data?.success && loginRes.data?.data) {
                    const { user, token } = loginRes.data.data;
                    setAuth(user, token);
                    navigate('/dashboard');
                    return;
                }

                // Fallback to login page with prefilled credentials
                navigate('/login');
            } else {
                setErrorMsg(res.data?.error || 'حدث خطأ أثناء إنشاء حساب المعهد');
            }
        } catch (err: any) {
            setErrorMsg(err.response?.data?.error || err.message || 'فشل في إنشاء الحساب، يرجى المحاولة مرة أخرى');
        } finally {
            setSubmitting(false);
        }
    };

    const openTrialModal = (plan: 'STARTER' | 'PRO' | 'BUSINESS') => {
        setSelectedPlan(plan);
        setModalOpen(true);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at 50% 0%, #0d1b2e 0%, #060a12 100%)',
            color: '#f8fafc',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            direction: 'rtl',
            overflowX: 'hidden'
        }}>
            {/* Top Navigation */}
            <nav style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                backdropFilter: 'blur(20px)',
                background: 'rgba(6, 10, 18, 0.75)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '16px 32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(0, 210, 255, 0.4)'
                    }}>
                        <GraduationCap size={24} color="#fff" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.5px' }}>
                            EduCloud <span style={{ color: '#00d2ff' }}>ERP</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>المنصة السحابية الموحدة للمؤسسات التعليمية</div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
                    <a href="#features" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>المميزات</a>
                    <a href="#modules" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>الأنظمة</a>
                    <a href="#pricing" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>الأسعار</a>
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#e2e8f0',
                            padding: '8px 18px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.9rem'
                        }}
                    >
                        تسجيل الدخول
                    </button>
                    <button
                        onClick={() => openTrialModal('PRO')}
                        style={{
                            background: 'linear-gradient(135deg, #00d2ff 0%, #0072ff 100%)',
                            border: 'none',
                            color: '#fff',
                            padding: '9px 22px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            boxShadow: '0 4px 15px rgba(0, 210, 255, 0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Sparkles size={16} /> ابدأ تجربة مجانية
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <header style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '90px 24px 60px',
                textAlign: 'center',
                position: 'relative'
            }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 18px',
                    borderRadius: '999px',
                    background: 'rgba(0, 210, 255, 0.1)',
                    border: '1px solid rgba(0, 210, 255, 0.3)',
                    color: '#38bdf8',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    marginBottom: '28px'
                }}>
                    <Sparkles size={16} /> الجيل الجديد من برامج إدارة المعاهد والتدريب 2026
                </div>

                <h1 style={{
                    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                    fontWeight: 900,
                    lineHeight: 1.25,
                    marginBottom: '24px',
                    letterSpacing: '-1px'
                }}>
                    شغّل معهدك باحترافية كاملة <br />
                    <span style={{
                        background: 'linear-gradient(135deg, #00d2ff 0%, #38ef7d 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        في منظومة سحابية واحدة ذكية
                    </span>
                </h1>

                <p style={{
                    fontSize: '1.2rem',
                    color: '#94a3b8',
                    maxWidth: '780px',
                    margin: '0 auto 40px',
                    lineHeight: 1.8
                }}>
                    نظام متكامل يجمع شؤون الطلاب والأكاديمية، الفواتير وضريبة القيمة المضافة،
                    الموارد البشرية والبصمة، واستقطاب الطلاب والتسويق (CRM) في منصة مؤمنة بالكامل لكل معهد.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => openTrialModal('PRO')}
                        style={{
                            background: 'linear-gradient(135deg, #00d2ff 0%, #0072ff 100%)',
                            border: 'none',
                            color: '#fff',
                            padding: '16px 36px',
                            borderRadius: '14px',
                            cursor: 'pointer',
                            fontWeight: 800,
                            fontSize: '1.1rem',
                            boxShadow: '0 8px 30px rgba(0, 210, 255, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}
                    >
                        ابدأ تجربة مجانية لمدة 14 يوماً <ArrowRight size={20} />
                    </button>
                    <button
                        onClick={() => {
                            const pricingEl = document.getElementById('pricing');
                            pricingEl?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#f8fafc',
                            padding: '16px 32px',
                            borderRadius: '14px',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '1.1rem'
                        }}
                    >
                        استعرض الباقات والأسعار
                    </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '36px', marginTop: '48px', color: '#64748b', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} color="#00d2ff" /> لا يلزم بطاقة ائتمانية للبدء</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} color="#00d2ff" /> تفعيل فوري خلال دقيقة</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} color="#00d2ff" /> عزل كامل للبيانات وأمان سحابي</div>
                </div>
            </header>

            {/* Modules Grid */}
            <section id="modules" style={{ maxWidth: '1200px', margin: '60px auto', padding: '0 24px' }}>
                <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '12px' }}>كل ما يحتاجه معهدك تحت سقف واحد</h2>
                    <p style={{ color: '#94a3b8', fontSize: '1.05rem' }}>منظومة متكاملة لا تحتاج فيها لشراء أو ربط أي برامج خارجية</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                    {[
                        {
                            icon: GraduationCap,
                            color: '#00d2ff',
                            title: 'الإدارة الأكاديمية وشؤون الطلاب',
                            desc: 'تسجيل الطلاب، خطط البرامج والدبلومات، جداول الفصول، الحضور والانصراف، وكشوف الدرجات والشهادات.'
                        },
                        {
                            icon: Wallet,
                            color: '#10b981',
                            title: 'الإدارة المالية والفواتير الضريبية',
                            desc: 'سندات القبض، الفواتير الإلكترونية المعتمدة، خطط الأقساط، تتبع المتأخرات، وميزان المراجعة والأرباح.'
                        },
                        {
                            icon: Users,
                            color: '#f59e0b',
                            title: 'الموارد البشرية والرواتب (HRMS)',
                            desc: 'ملفات الموظفين، مسيرات الرواتب والبدلات، ربط أجهزة البصمة، تتبع الإجازات والمأموريات، وتقييم الأداء.'
                        },
                        {
                            icon: MessageSquare,
                            color: '#ec4899',
                            title: 'استقطاب الطلاب والتسويق (CRM)',
                            desc: 'قمع المبيعات، متابعة العملاء المحتملين، تكامل التلغرام والواتساب، وتحليل العائد على الحملات الإعلانية.'
                        },
                        {
                            icon: Sparkles,
                            color: '#8b5cf6',
                            title: 'المصحح الذكي والذكاء الاصطناعي',
                            desc: 'تصحيح الواجبات آلياً بتقنيات AI، كشف الانتحال العلمي، وتوليد تقارير الأداء الفورية للطلاب والمعلمين.'
                        },
                        {
                            icon: ShieldCheck,
                            color: '#38bdf8',
                            title: 'الأمان والعلامة البيضاء (White-Label)',
                            desc: 'شعارك الخاص، هويتك على جميع السندات، نطاق مخصص، وعزل سحابي مستقل ومضمون لقواعد بياناتك.'
                        }
                    ].map((mod, i) => (
                        <div key={i} style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '20px',
                            padding: '32px 24px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            transition: 'all 0.3s ease',
                        }}>
                            <div style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '14px',
                                background: `${mod.color}15`,
                                border: `1px solid ${mod.color}33`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: mod.color
                            }}>
                                <mod.icon size={26} />
                            </div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{mod.title}</h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>{mod.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" style={{ maxWidth: '1200px', margin: '100px auto', padding: '0 24px' }}>
                <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '16px' }}>باقات شفافة ومدروسة لنمو معهدك</h2>
                    <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '32px' }}>اختر الباقة المناسبة لحجم معهدك، مع إمكانية الترقية أو الإلغاء في أي وقت</p>

                    {/* Toggle Monthly / Annual */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        padding: '6px 8px',
                        borderRadius: '14px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <button
                            onClick={() => setBillingAnnual(false)}
                            style={{
                                background: !billingAnnual ? '#00d2ff' : 'transparent',
                                color: !billingAnnual ? '#000' : '#94a3b8',
                                border: 'none',
                                padding: '8px 20px',
                                borderRadius: '10px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            دفع شهري
                        </button>
                        <button
                            onClick={() => setBillingAnnual(true)}
                            style={{
                                background: billingAnnual ? '#00d2ff' : 'transparent',
                                color: billingAnnual ? '#000' : '#94a3b8',
                                border: 'none',
                                padding: '8px 20px',
                                borderRadius: '10px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            دفع سنوي <span style={{ background: '#10b981', color: '#fff', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '99px' }}>وفر 20%</span>
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'stretch' }}>
                    {/* Starter Plan */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '24px',
                        padding: '40px 32px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}>
                        <div>
                            <div style={{ color: '#00d2ff', fontWeight: 800, fontSize: '1rem', marginBottom: '8px' }}>باقة البداية (STARTER)</div>
                            <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '24px' }}>للمراكز التدريبية الناشئة والمعاهد الفردية</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '24px' }}>
                                ${billingAnnual ? '79' : '99'} <span style={{ fontSize: '1rem', color: '#64748b' }}>/ شهرياً</span>
                            </div>

                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}><Check size={18} color="#00d2ff" /> حتى 100 طالب نشط</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}><Check size={18} color="#00d2ff" /> النظام الأكاديمي والامتحانات</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}><Check size={18} color="#00d2ff" /> سندات القبض والفواتير المبسطة</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}><Check size={18} color="#00d2ff" /> حسابين للمشرفين والمعلمين</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}><Check size={18} color="#00d2ff" /> دعم فني عبر البريد</li>
                            </ul>
                        </div>

                        <button
                            onClick={() => openTrialModal('STARTER')}
                            style={{
                                width: '100%',
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: '#fff',
                                padding: '14px',
                                borderRadius: '12px',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            ابدأ تجربة مجانية 14 يوماً
                        </button>
                    </div>

                    {/* Pro Plan (Featured) */}
                    <div style={{
                        background: 'linear-gradient(180deg, rgba(0, 210, 255, 0.1) 0%, rgba(6, 10, 18, 0.95) 100%)',
                        border: '2px solid #00d2ff',
                        borderRadius: '24px',
                        padding: '40px 32px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 0 40px rgba(0, 210, 255, 0.15)',
                        position: 'relative'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '-14px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#00d2ff',
                            color: '#000',
                            padding: '4px 16px',
                            borderRadius: '999px',
                            fontWeight: 800,
                            fontSize: '0.8rem'
                        }}>
                            الأكثر طلباً واختياراً
                        </div>

                        <div>
                            <div style={{ color: '#00d2ff', fontWeight: 800, fontSize: '1rem', marginBottom: '8px' }}>باقة الاحتراف (PRO)</div>
                            <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '24px' }}>للمعاهد المتوسطة ومراكز اللغات الشاملة</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '24px' }}>
                                ${billingAnnual ? '199' : '249'} <span style={{ fontSize: '1rem', color: '#64748b' }}>/ شهرياً</span>
                            </div>

                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}><Check size={18} color="#00d2ff" /> حتى 500 طالب نشط</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}><Check size={18} color="#00d2ff" /> إدارة مالية كاملة + ضريبة القيمة المضافة</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}><Check size={18} color="#00d2ff" /> نظام شؤون الموظفين والبصمة والرواتب</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}><Check size={18} color="#00d2ff" /> نظام استقطاب الطلاب (CRM) والواتساب</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}><Check size={18} color="#00d2ff" /> عدد لا محدود من حسابات الموظفين</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}><Check size={18} color="#00d2ff" /> دعم فني مباشر وسريع</li>
                            </ul>
                        </div>

                        <button
                            onClick={() => openTrialModal('PRO')}
                            style={{
                                width: '100%',
                                background: 'linear-gradient(135deg, #00d2ff 0%, #0072ff 100%)',
                                border: 'none',
                                color: '#fff',
                                padding: '14px',
                                borderRadius: '12px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                boxShadow: '0 4px 20px rgba(0, 210, 255, 0.4)'
                            }}
                        >
                            ابدأ تجربة مجانية 14 يوماً
                        </button>
                    </div>

                    {/* Business Plan */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '24px',
                        padding: '40px 32px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}>
                        <div>
                            <div style={{ color: '#10b981', fontWeight: 800, fontSize: '1rem', marginBottom: '8px' }}>باقة المؤسسات (BUSINESS)</div>
                            <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '24px' }}>للكليات والأكاديميات الكبرى ومتعددة الفروع</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '24px' }}>
                                ${billingAnnual ? '399' : '499'} <span style={{ fontSize: '1rem', color: '#64748b' }}>/ شهرياً</span>
                            </div>

                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}><Check size={18} color="#10b981" /> طلاب غير محدودين وفروع متعددة</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}><Check size={18} color="#10b981" /> علامة بيضاء كاملة ونطاق خاص (Custom Domain)</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}><Check size={18} color="#10b981" /> المصحح الأكاديمي الذكي (AI Grader)</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}><Check size={18} color="#10b981" /> مدير حساب مخصص وتدريب الكادر</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}><Check size={18} color="#10b981" /> اتفاقية مستوى خدمة 99.9% (SLA)</li>
                            </ul>
                        </div>

                        <button
                            onClick={() => openTrialModal('BUSINESS')}
                            style={{
                                width: '100%',
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: '#fff',
                                padding: '14px',
                                borderRadius: '12px',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            تواصل معنا لتفعيل الباقة
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '40px 24px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '0.9rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <GraduationCap size={20} color="#00d2ff" />
                    <span style={{ fontWeight: 700, color: '#e2e8f0' }}>منصة EduCloud ERP السحابية</span>
                </div>
                <div>جميع الحقوق محفوظة © 2026. تم تصميم النظام وفق أعلى معايير الأمان السحابي.</div>
            </footer>

            {/* Onboarding Signup Modal */}
            {modalOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 200,
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        background: '#0d1522',
                        border: '1px solid rgba(0, 210, 255, 0.3)',
                        borderRadius: '24px',
                        padding: '36px',
                        maxWidth: '520px',
                        width: '100%',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => setModalOpen(false)}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                left: '20px',
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                fontSize: '1.4rem',
                                cursor: 'pointer'
                            }}
                        >
                            ✕
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: 'rgba(0, 210, 255, 0.15)',
                                color: '#00d2ff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 12px'
                            }}>
                                <Building2 size={26} />
                            </div>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px 0' }}>ابدأ تجربة معهدك الآن</h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
                                الباقة المختارة: <span style={{ color: '#00d2ff', fontWeight: 700 }}>{selectedPlan}</span> (تجربة مجانية 14 يوماً)
                            </p>
                        </div>

                        {errorMsg && (
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#fca5a5',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                fontSize: '0.85rem',
                                marginBottom: '16px'
                            }}>
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>اسم المعهد أو الأكاديمية</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="مثال: أكاديمية الرواد للتدريب"
                                    value={formData.instituteName}
                                    onChange={(e) => handleSlugAutoFill(e.target.value)}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        padding: '11px 14px',
                                        borderRadius: '10px',
                                        color: '#fff',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>معرف الرابط (Slug بالإنجليزية)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="alrowad-academy"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        padding: '11px 14px',
                                        borderRadius: '10px',
                                        color: '#38bdf8',
                                        direction: 'ltr',
                                        textAlign: 'left',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>اسم المدير المسؤول</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="د. خالد المنصور"
                                        value={formData.adminFullName}
                                        onChange={(e) => setFormData({ ...formData, adminFullName: e.target.value })}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.12)',
                                            padding: '11px 14px',
                                            borderRadius: '10px',
                                            color: '#fff',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>رقم الجوال / واتساب</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="+966 50 000 0000"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.12)',
                                            padding: '11px 14px',
                                            borderRadius: '10px',
                                            color: '#fff',
                                            direction: 'ltr',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>البريد الإلكتروني للإدارة</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="admin@academy.edu"
                                    value={formData.adminEmail}
                                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        padding: '11px 14px',
                                        borderRadius: '10px',
                                        color: '#fff',
                                        direction: 'ltr',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>كلمة المرور</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={formData.adminPassword}
                                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        padding: '11px 14px',
                                        borderRadius: '10px',
                                        color: '#fff',
                                        direction: 'ltr',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    marginTop: '10px',
                                    background: 'linear-gradient(135deg, #00d2ff 0%, #0072ff 100%)',
                                    border: 'none',
                                    color: '#fff',
                                    padding: '14px',
                                    borderRadius: '12px',
                                    fontWeight: 800,
                                    fontSize: '1rem',
                                    cursor: submitting ? 'wait' : 'pointer',
                                    boxShadow: '0 4px 20px rgba(0, 210, 255, 0.4)'
                                }}
                            >
                                {submitting ? 'جاري تجهيز نظام المعهد...' : 'إنشاء المعهد والدخول للوحة التحكم 🚀'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
