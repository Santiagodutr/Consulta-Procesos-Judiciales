import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { notificationAPI } from '../services/apiService.ts';
import { PublicFooter } from '../components/PublicFooter.tsx';
import {
	Bell,
	CheckCircle2,
	RefreshCw,
	BellRing,
	Clock,
	Briefcase,
	Gavel
} from 'lucide-react';
import { useTour } from '../hooks/useTour.ts';
import { HelpButton } from '../components/HelpButton.tsx';
import { notificationsTourSteps } from '../tours/notificationsTour.ts';
import { Header } from '../components/Header.tsx';

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
	// const { user } = useAuth();
	const { startTour, hasCompletedTour } = useTour(notificationsTourSteps, 'notifications');


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



	return (
		<div className="min-h-screen bg-gray-50 flex flex-col font-sans">
			<Header title="Centro de Notificaciones" onBack={() => navigate('/dashboard')} />

			<main className="flex-1 py-12">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in">
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse"></div>
								<span className="text-[10px] font-bold text-accent-500 uppercase tracking-[0.2em]">Centro de Notificaciones</span>
							</div>
							<h1 className="text-4xl font-serif font-bold text-primary-900 tracking-tight">Mis Alertas</h1>
							<p className="text-gray-500 text-sm">Gestiona las actualizaciones críticas de tus procesos judiciales</p>
						</div>

						<div className="flex flex-wrap items-center gap-3 p-1.5 bg-white rounded-2xl shadow-sm border border-gray-100 ring-1 ring-gray-100/50" data-tour="stats-badges">
							<div className="px-5 py-2.5 bg-gray-50 rounded-xl flex items-center gap-3">
								<Bell size={18} className="text-primary-900" />
								<div>
									<p className="text-lg font-serif font-bold text-primary-900 leading-none">{notifications.length}</p>
									<p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total</p>
								</div>
							</div>
							<div className="px-5 py-2.5 bg-accent-500/10 rounded-xl flex items-center gap-3">
								<BellRing size={18} className="text-accent-600" />
								<div>
									<p className="text-lg font-serif font-bold text-accent-600 leading-none">{unreadCount}</p>
									<p className="text-[9px] font-bold text-accent-500 uppercase tracking-widest mt-1">Nuevas</p>
								</div>
							</div>
						</div>
					</div>

					<div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 bg-white p-4 rounded-3xl shadow-sm border border-gray-100 animate-fade-in">
						<div className="flex items-center gap-6">
							<label
								className="inline-flex items-center cursor-pointer group"
								data-tour="filter-unread"
							>
								<div className="relative">
									<input
										type="checkbox"
										className="sr-only"
										checked={showUnreadOnly}
										onChange={(event) => setShowUnreadOnly(event.target.checked)}
									/>
									<div className={`w-12 h-6 rounded-full transition-colors duration-300 ${showUnreadOnly ? 'bg-accent-500' : 'bg-gray-200'}`}></div>
									<div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 transform ${showUnreadOnly ? 'translate-x-6' : 'translate-x-0'}`}></div>
								</div>
								<span className="ml-3 text-sm font-bold text-primary-900 group-hover:text-accent-600 transition-colors">Solo no leídas</span>
							</label>

							<button
								type="button"
								onClick={loadNotifications}
								className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary-900 transition-colors p-2 rounded-xl"
								data-tour="refresh-button"
							>
								<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
								<span>Sincronizar</span>
							</button>
						</div>

						<button
							type="button"
							onClick={handleMarkAllAsRead}
							disabled={unreadCount === 0 || isMarkingAll}
							className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-900 text-white px-8 py-3.5 rounded-2xl text-sm font-bold hover:bg-accent-500 hover:text-primary-900 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-xl shadow-primary-900/10"
							data-tour="mark-all-read-btn"
						>
							{isMarkingAll ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
							<span>Marcar todas como leídas</span>
						</button>
					</div>

					<div className="space-y-4 min-h-[400px]">
						{loading ? (
							<div className="flex flex-col items-center justify-center py-20 space-y-6 animate-pulse">
								<div className="w-16 h-16 rounded-full border-t-2 border-accent-500 animate-spin"></div>
								<p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recuperando Alertas</p>
							</div>
						) : filteredNotifications.length === 0 ? (
							<div className="bg-white rounded-3xl shadow-xl p-20 text-center border border-gray-100 animate-scale-in">
								<div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto transform rotate-12 mb-8">
									<Bell size={48} className="text-gray-200" />
								</div>
								<h2 className="text-2xl font-serif font-bold text-primary-900 mb-3">Todo al día</h2>
								<p className="text-gray-500 mb-10 max-w-sm mx-auto leading-relaxed text-sm">
									{showUnreadOnly
										? "No tienes notificaciones pendientes por leer en este momento."
										: "Tu bandeja de alertas está vacía. Te informaremos cuando haya movimientos en tus procesos."}
								</p>
								<button
									onClick={() => navigate('/dashboard')}
									className="bg-primary-900 text-white py-4 px-10 rounded-2xl font-bold hover:bg-accent-500 hover:text-primary-900 transition-all active:scale-95 shadow-xl shadow-primary-900/10 text-sm"
								>
									Volver al Panel
								</button>
							</div>
						) : (
							<div className="space-y-4">
								{filteredNotifications.map((item, idx) => (
									<div
										key={item.id}
										className={`group relative bg-white rounded-3xl p-6 border transition-all duration-300 hover:shadow-2xl hover:shadow-primary-900/5 animate-scale-in ${item.is_read
											? 'border-gray-100 opacity-80'
											: 'border-accent-500/20 ring-1 ring-accent-500/5 bg-white shadow-xl shadow-accent-500/5'
											}`}
										style={{ animationDelay: `${idx * 50}ms` }}
										data-tour="notification-item"
									>
										{!item.is_read && (
											<div className="absolute top-0 left-0 w-1.5 h-full bg-accent-500 rounded-l-3xl"></div>
										)}

										<div className="flex flex-col md:flex-row items-start gap-6">
											<div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${item.is_read
												? 'bg-gray-50 text-gray-400'
												: 'bg-accent-500/10 text-accent-600 group-hover:bg-accent-500 group-hover:text-primary-900'
												}`}>
												{item.is_read ? <Bell size={24} /> : <BellRing size={24} />}
											</div>

											<div className="flex-1 min-w-0 space-y-3">
												<div className="flex flex-wrap items-center gap-3">
													<h3 className={`text-lg font-serif font-bold leading-tight ${item.is_read ? 'text-primary-900/60' : 'text-primary-900'
														}`}>
														{item.title}
													</h3>
													{!item.is_read && (
														<span className="px-2 py-0.5 bg-accent-500 text-primary-900 text-[9px] font-bold uppercase tracking-widest rounded-md">
															Nuevo Movimiento
														</span>
													)}
												</div>

												<p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
													{item.message}
												</p>

												<div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2">
													<div className="flex items-center gap-2">
														<Clock size={12} className="text-gray-400" />
														<span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
															{formatDate(item.created_at)}
														</span>
													</div>
													{item.process_id && (
														<div className="flex items-center gap-2">
															<Gavel size={12} className="text-accent-500" />
															<span className="text-[10px] font-bold text-primary-900 uppercase tracking-widest">
																EXP. {item.process_id}
															</span>
														</div>
													)}
													{item.type && (
														<div className="flex items-center gap-2">
															<Briefcase size={12} className="text-gray-400" />
															<span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
																{item.type}
															</span>
														</div>
													)}
												</div>
											</div>

											<div className="md:self-center">
												{!item.is_read ? (
													<button
														type="button"
														onClick={() => handleMarkAsRead(item.id)}
														className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 text-primary-900 rounded-xl text-xs font-bold hover:bg-primary-900 hover:text-white transition-all active:scale-95 border border-gray-100"
													>
														<CheckCircle2 size={14} />
														<span>Entendido</span>
													</button>
												) : (
													<div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-200">
														<CheckCircle2 size={20} />
													</div>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</main>

			<HelpButton onClick={startTour} showNotification={!hasCompletedTour} position="bottom-left" />
			<PublicFooter />
		</div>
	);
};

export default NotificationsPage;
