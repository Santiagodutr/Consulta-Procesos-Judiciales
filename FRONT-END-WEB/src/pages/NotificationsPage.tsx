import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { notificationAPI } from '../services/apiService.ts';
import { PublicFooter } from '../components/PublicFooter.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { ArrowLeft } from 'lucide-react';
import { useTour } from '../hooks/useTour.ts';
import { HelpButton } from '../components/HelpButton.tsx';
import { notificationsTourSteps } from '../tours/notificationsTour.ts';

interface NotificationItem {
	id: string;
	user_id: string;
	process_id?: string | null;
	type?: string;
	title: string;
	message: string;
	is_read: boolean;
	sent_at?: string | null;
	read_at?: string | null;
	created_at: string;
}

const NotificationsPage: React.FC = () => {
	const [notifications, setNotifications] = useState<NotificationItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [showUnreadOnly, setShowUnreadOnly] = useState(false);
	const [isMarkingAll, setIsMarkingAll] = useState(false);
	const navigate = useNavigate();
	const { user, signOut } = useAuth();
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
	const userMenuRef = useRef<HTMLDivElement | null>(null);
	const { startTour, hasCompletedTour } = useTour(notificationsTourSteps, 'notifications');

	const navLinks = [
		{ label: 'Inicio', onClick: () => navigate('/dashboard') },
		{ label: 'Reportes', onClick: () => navigate('/analytics') },
		{ label: 'Notificaciones', onClick: () => navigate('/notifications') },
	];

	const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Usuario';

	const loadNotifications = useCallback(async () => {
		try {
			setLoading(true);
			const response = await notificationAPI.getNotifications({ limit: 50 });

			if (response?.success) {
				setNotifications(response.data ?? []);
			} else {
				toast.error(response?.message ?? 'No se pudieron cargar las notificaciones');
			}
		} catch (error) {
			console.error('Error fetching notifications', error);
			toast.error('Error al cargar las notificaciones');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadNotifications();
	}, [loadNotifications]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
				setIsUserMenuOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const unreadCount = useMemo(
		() => notifications.filter((item) => !item.is_read).length,
		[notifications]
	);

	const filteredNotifications = useMemo(() => {
		if (!showUnreadOnly) {
			return notifications;
		}
		return notifications.filter((item) => !item.is_read);
	}, [notifications, showUnreadOnly]);

	const handleMarkAsRead = async (notificationId: string) => {
		try {
			const response = await notificationAPI.markAsRead(notificationId);

			if (response?.success) {
				setNotifications((prev) =>
					prev.map((item) =>
						item.id === notificationId
							? { ...item, is_read: true, read_at: new Date().toISOString() }
							: item
					)
				);
			} else {
				toast.error(response?.message ?? 'No se pudo marcar la notificación');
			}
		} catch (error) {
			console.error('Error marking notification as read', error);
			toast.error('Error al marcar la notificación como leída');
		}
	};

	const handleMarkAllAsRead = async () => {
		try {
			setIsMarkingAll(true);
			const response = await notificationAPI.markAllAsRead();

			if (response?.success) {
				toast.success('Notificaciones marcadas como leídas');
				setNotifications((prev) =>
					prev.map((item) => ({ ...item, is_read: true, read_at: new Date().toISOString() }))
				);
			} else {
				toast.error(response?.message ?? 'No se pudieron marcar las notificaciones');
			}
		} catch (error) {
			console.error('Error marking all notifications as read', error);
			toast.error('Error al marcar todas las notificaciones como leídas');
		} finally {
			setIsMarkingAll(false);
		}
	};

	const formatDate = (value?: string | null) => {
		if (!value) {
			return '—';
		}

		return new Date(value).toLocaleString('es-CO', {
			day: '2-digit',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const handleLogout = async () => {
		try {
			await signOut();
			navigate('/login');
		} catch (error) {
			console.error('Error during logout:', error);
			navigate('/login');
		}
	};

	const handleHeaderBack = () => {
		navigate('/dashboard');
	};

	const handleLogoClick = () => {
		navigate('/');
	};

	const renderHeader = () => (
		<header className="bg-primary-700 text-white shadow-lg">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={handleHeaderBack}
							className="rounded-full p-2 transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
							title="Regresar"
						>
							<ArrowLeft className="h-5 w-5" />
						</button>
						<button
							type="button"
							onClick={handleLogoClick}
							className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded"
						>
							<img src="/logo_justitrack.png" alt="JustiTrack" className="h-12 w-auto" />
						</button>
					</div>

					<div className="hidden md:flex items-center gap-8">
						{navLinks.map((link) => (
							<button
								key={link.label}
								type="button"
								onClick={link.onClick}
								className="rounded-full px-4 py-3 text-base font-semibold tracking-wide text-white/95 transition hover:bg-white/15 hover:text-white"
							>
								{link.label}
							</button>
						))}
					</div>

					<div className="flex items-center gap-2 md:gap-4">
						<div className="relative" ref={userMenuRef}>
							<button
								type="button"
								onClick={() => setIsUserMenuOpen((prev) => !prev)}
								className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
							>
								<img src="/usuario.png" alt="Usuario" className="h-6 w-6" />
								<span className="hidden sm:inline">{displayName}</span>
								<svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M6 9l6 6 6-6" />
								</svg>
							</button>

							{isUserMenuOpen && (
								<div className="absolute right-0 z-20 mt-3 w-52 overflow-hidden rounded-xl bg-white text-gray-700 shadow-xl ring-1 ring-black/5">
									<div className="py-2">
										<button
											type="button"
											onClick={() => {
												setIsUserMenuOpen(false);
												navigate('/profile');
											}}
											className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium transition hover:bg-gray-100"
										>
											Perfil
										</button>
										
									</div>
									<div className="border-t border-gray-100">
										<button
											type="button"
											onClick={() => {
												setIsUserMenuOpen(false);
												handleLogout();
											}}
											className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-semibold text-danger-600 transition hover:bg-danger-50"
										>
											Cerrar Sesión
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</header>
	);

	return (
		<div className="min-h-screen bg-brand-neutral flex flex-col">
			{renderHeader()}

		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
			<div className="mb-8" data-tour="notifications-header">
				<h1 className="text-3xl font-semibold text-gray-900">Notificaciones</h1>
				<p className="text-gray-600 mt-2">
					Gestiona las alertas generadas por tus procesos favoritos y consultas recientes.
				</p>
			</div>			<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
				<div className="flex items-center gap-3" data-tour="stats-badges">
					<div className="rounded-full bg-primary-100 text-primary-700 px-4 py-2 text-sm font-medium">
						Total: {notifications.length}
					</div>
					<div className="rounded-full bg-amber-100 text-amber-700 px-4 py-2 text-sm font-medium">
						Sin leer: {unreadCount}
					</div>
				</div>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
					<label className="inline-flex items-center text-sm font-medium text-gray-600" data-tour="filter-unread">
						<input
							type="checkbox"
							className="h-4 w-4 text-primary-600 border-gray-300 rounded mr-2"
							checked={showUnreadOnly}
							onChange={(event) => setShowUnreadOnly(event.target.checked)}
						/>
						Mostrar solo no leídas
					</label>
					<div className="flex flex-col gap-3 sm:flex-row">
						<button
							type="button"
							onClick={loadNotifications}
							className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-primary-700 shadow-sm ring-1 ring-primary-200 transition hover:bg-primary-50"
							data-tour="refresh-button"
						>
								<span role="img" aria-label="Actualizar">
									🔄
								</span>
								Actualizar
							</button>
						<button
							type="button"
							onClick={handleMarkAllAsRead}
							disabled={unreadCount === 0 || isMarkingAll}
							className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
								unreadCount === 0 || isMarkingAll
									? 'bg-gray-200 text-gray-500 cursor-not-allowed'
									: 'bg-primary-600 text-white shadow-sm hover:bg-primary-500'
							}`}
							data-tour="mark-all-read-btn"
						>
								<span role="img" aria-label="Marcar todas">
									✅
								</span>
								Marcar todas como leídas
							</button>
						</div>
					</div>
				</div>

				<div className="bg-white shadow rounded-xl">
					{loading ? (
						<div className="flex flex-col items-center justify-center py-16">
							<img src="/notificaciones.png" alt="Cargando" className="h-16 w-16 mb-4" />
							<p className="text-gray-500">Cargando notificaciones...</p>
						</div>
					) : filteredNotifications.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 px-6 text-center">
							<img src="/notificaciones.png" alt="Sin notificaciones" className="h-20 w-20 mb-4" />
							<h2 className="text-xl font-semibold text-gray-800 mb-2">No hay notificaciones</h2>
							<p className="text-gray-500 mb-4">
								Aquí aparecerán las actualizaciones de los procesos que sigues y tus consultas recientes.
							</p>
							<Link
								to="/dashboard"
								className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-700 hover:bg-primary-600"
							>
								Volver al dashboard
							</Link>
						</div>
					) : (
						<ul className="divide-y divide-gray-200">
							{filteredNotifications.map((item) => (
								<li key={item.id} className={`px-6 py-5 ${item.is_read ? 'bg-white' : 'bg-primary-50'}`} data-tour="notification-item">
									<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-1">
												<span className="text-lg" role="img" aria-label="Bell">
													{item.is_read ? '🔔' : '🛎️'}
												</span>
												<h3 className={`text-base font-semibold ${item.is_read ? 'text-gray-800' : 'text-primary-800'}`}>
													{item.title}
												</h3>
												{!item.is_read && (
													<span className="text-xs font-medium uppercase bg-primary-600 text-white px-2 py-0.5 rounded-full">
														Nueva
													</span>
												)}
											</div>
											<p className="text-sm text-gray-600 whitespace-pre-wrap mb-2">{item.message}</p>
											<div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
												<span>Creada: {formatDate(item.created_at)}</span>
												{item.read_at && <span>Leída: {formatDate(item.read_at)}</span>}
												{item.process_id && <span>ID proceso: {item.process_id}</span>}
											</div>
										</div>
										<div className="flex items-center gap-2">
											{!item.is_read && (
												<button
													type="button"
													onClick={() => handleMarkAsRead(item.id)}
													className="inline-flex items-center px-3 py-2 border border-primary-600 text-sm font-medium rounded-md text-primary-600 hover:bg-primary-50"
												>
													Marcar como leída
												</button>
											)}
										</div>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
			
			<HelpButton onClick={startTour} showNotification={!hasCompletedTour} position="bottom-left" />
			<PublicFooter />
		</div>
	);
};

export default NotificationsPage;
