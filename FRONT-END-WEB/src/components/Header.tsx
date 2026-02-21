import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    User,
    LogOut,
    ArrowLeft,
    Menu,
    X,
    LayoutDashboard,
    Bell,
    BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { notificationAPI } from '../services/apiService.ts';

interface HeaderProps {
    title?: string;
    showBack?: boolean;
    onBack?: () => void;
    activePath?: string;
}

export const Header: React.FC<HeaderProps> = ({
    title = "JustiTrack",
    showBack = true,
    onBack,
    activePath
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, signOut } = useAuth();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const userMenuRef = useRef<HTMLDivElement | null>(null);
    const currentPath = activePath || location.pathname;

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Usuario';

    useEffect(() => {
        const loadUnreadCount = async () => {
            try {
                const response = await notificationAPI.getUnreadNotifications(1);
                if (response?.success && Array.isArray(response.data)) {
                    setUnreadCount(response.data.length);
                }
            } catch (error) {
                console.error('Error fetching unread count:', error);
            }
        };

        if (user) {
            loadUnreadCount();
            const interval = setInterval(loadUnreadCount, 60000);
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error('Error during logout:', error);
            navigate('/login');
        }
    };

    const navLinks = [
        { label: 'Inicio', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Reportes', path: '/analytics', icon: BarChart3 },
        { label: 'Alertas', path: '/notifications', icon: Bell, badge: unreadCount },
    ];

    return (
        <header className="bg-primary-900 text-white shadow-xl border-b border-accent-500/20 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-20 items-center justify-between">
                    <div className="flex items-center gap-4">
                        {showBack && (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="group flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                                title="Volver"
                            >
                                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/5 hover:bg-white/20 transition-all">
                                    <ArrowLeft className="h-5 w-5" />
                                </div>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center focus:outline-none transition-transform hover:scale-105"
                        >
                            <div className="h-10 w-auto flex items-center bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                                <img
                                    src="/logo_justitrack.png"
                                    alt="JustiTrack"
                                    className="h-8 w-auto"
                                />
                            </div>
                        </button>
                        <div className="hidden lg:block h-8 w-px bg-white/10 mx-2"></div>
                        <h1 className="hidden lg:block text-sm font-serif font-bold uppercase tracking-widest text-accent-500/80">{title}</h1>
                    </div>

                    <div className="hidden md:flex items-center gap-1 bg-primary-800/50 p-1 rounded-full border border-white/5">
                        {navLinks.map((link) => (
                            <button
                                key={link.path}
                                type="button"
                                onClick={() => navigate(link.path)}
                                className={`px-5 py-2 text-sm font-bold rounded-full transition-all flex items-center gap-2 relative ${currentPath === link.path
                                    ? 'bg-accent-500 text-primary-900 shadow-lg shadow-accent-500/10'
                                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                <link.icon size={16} />
                                <span>{link.label}</span>
                                {link.badge && link.badge > 0 && (
                                    <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black ${currentPath === link.path ? 'bg-primary-900 text-white' : 'bg-accent-500 text-primary-900 ripple'
                                        }`}>
                                        {link.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative" ref={userMenuRef}>
                            <button
                                type="button"
                                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                                className="flex items-center gap-3 pl-4 pr-2 py-1.5 rounded-full bg-primary-800/50 border border-white/10 hover:border-accent-500/50 transition-all group shadow-inner"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-[10px] text-accent-400 font-black uppercase tracking-widest leading-none mb-0.5">Certificado</p>
                                    <p className="text-sm font-bold text-white leading-none truncate max-w-[120px]">{displayName}</p>
                                </div>
                                <div className="h-9 w-9 bg-accent-500 rounded-xl flex items-center justify-center text-primary-900 shadow-lg group-hover:scale-105 transition-transform">
                                    <User className="h-5 w-5 opacity-90" />
                                </div>
                            </button>

                            {isUserMenuOpen && (
                                <div className="absolute right-0 z-50 mt-4 w-60 overflow-hidden rounded-xl bg-white text-gray-700 shadow-2xl ring-1 ring-black/5 animate-fade-in origin-top-right">
                                    <div className="p-4 bg-primary-900 text-white">
                                        <p className="text-sm font-medium text-accent-400">Cuenta</p>
                                        <p className="text-base font-serif truncate">{displayName}</p>
                                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                                    </div>
                                    <div className="py-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsUserMenuOpen(false);
                                                navigate('/profile');
                                            }}
                                            className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition hover:bg-gray-50 ${currentPath === '/profile' ? 'bg-gray-50 text-accent-600' : 'text-gray-700'}`}
                                        >
                                            <User className="w-5 h-5 text-gray-400" />
                                            Mi Perfil
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsUserMenuOpen(false);
                                                navigate('/dashboard');
                                            }}
                                            className="flex md:hidden w-full items-center gap-3 px-4 py-3 text-sm font-medium transition hover:bg-gray-50 text-gray-700"
                                        >
                                            <LayoutDashboard className="w-5 h-5 text-gray-400" />
                                            Panel
                                        </button>
                                    </div>
                                    <div className="border-t border-gray-100 py-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsUserMenuOpen(false);
                                                handleLogout();
                                            }}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-danger-600 transition hover:bg-danger-50"
                                        >
                                            <LogOut className="w-5 h-5" />
                                            Cerrar Sesión
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            className="md:hidden p-2 text-white/70 hover:text-white"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="md:hidden bg-primary-800 border-t border-white/5 animate-fade-in">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {navLinks.map((link) => (
                            <button
                                key={link.path}
                                onClick={() => {
                                    navigate(link.path);
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-base font-medium transition-colors ${currentPath === link.path
                                    ? 'bg-accent-500 text-primary-900'
                                    : 'text-gray-300 hover:bg-white/10'
                                    }`}
                            >
                                <link.icon size={20} />
                                {link.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
};
