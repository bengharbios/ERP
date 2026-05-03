import React from 'react';
import '../../App.css';
import { useAuthStore } from '../../store/authStore';
import Sidebar from '../../components/Sidebar';

interface LegacyLayoutProps {
    children: React.ReactNode;
}

export function LegacyLayout({ children }: LegacyLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
    const [isMobile, setIsMobile] = React.useState(typeof window !== 'undefined' && window.innerWidth < 1024);
    const [showHeader, setShowHeader] = React.useState(true);
    const [lastScrollY, setLastScrollY] = React.useState(0);
    const user = useAuthStore((state) => state.user);

    React.useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        const handleScroll = () => {
            if (window.innerWidth >= 1024) {
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

        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [lastScrollY]);

    const sidebarWidth = sidebarCollapsed ? '80px' : '260px';

    return (
        <div style={{
            direction: 'rtl',
            display: 'flex',
            minHeight: '100vh',
            background: '#F8FAFC',
            fontFamily: "'Cairo', sans-serif"
        }}>
            <Sidebar
                isCollapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                isMobileOpen={mobileSidebarOpen}
                onMobileClose={() => setMobileSidebarOpen(false)}
            />

            <div style={{
                flex: 1,
                marginRight: isMobile ? '0' : sidebarWidth,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0, // Prevent flex items from overflowing
            }}>
                <header style={{
                    background: 'white',
                    height: '80px',
                    padding: '0 2rem',
                    borderBottom: '1px solid #F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1000,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                    transition: 'transform 0.3s ease-in-out',
                    transform: isMobile && !showHeader ? 'translateY(-100%)' : 'translateY(0)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
                        <button
                            onClick={() => setMobileSidebarOpen(true)}
                            style={{
                                display: isMobile ? 'flex' : 'none',
                                background: '#F8FAFC',
                                border: 'none',
                                width: '44px',
                                height: '44px',
                                borderRadius: '12px',
                                color: '#1E293B',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>☰</span>
                        </button>

                        <div style={{
                            background: '#F8FAFC',
                            borderRadius: '12px',
                            padding: '0 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            width: 'clamp(200px, 40%, 450px)',
                            height: '48px',
                            border: '1px solid #F1F5F9'
                        }}>
                            <span style={{ color: '#94A3B8' }}>🔍</span>
                            <input
                                type="text"
                                placeholder="ابحث عن أي شيء..."
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    outline: 'none',
                                    width: '100%',
                                    fontSize: '14px',
                                    fontFamily: "'Cairo', sans-serif"
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ textAlign: 'left', display: isMobile ? 'none' : 'block' }}>
                            <span style={{ display: 'block', fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
                                {user?.firstName} {user?.lastName}
                            </span>
                        </div>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '14px',
                            background: '#F1F5F9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px'
                        }}>
                            👤
                        </div>
                    </div>
                </header>

                <main style={{
                    padding: isMobile ? '1rem' : '1.25rem 2rem',
                    flex: 1,
                    width: '100%',
                    maxWidth: '1600px',
                    margin: '0 auto'
                }}>
                    {children}
                </main>
            </div>
        </div>
    );
}

export default LegacyLayout;
