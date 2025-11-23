import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, ShieldCheck, Building2, CalendarDays, CheckCircle2, XCircle, LogOut, Home, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { PublicFooter } from '../components/PublicFooter.tsx';
import { toast } from 'react-hot-toast';
import { useTour } from '../hooks/useTour.ts';
import { HelpButton } from '../components/HelpButton.tsx';
import { profileTourSteps } from '../tours/profileTour.ts';

const formatDocumentType = (type?: string) => {
	switch (type) {
		case 'CC':
			return 'Cédula de Ciudadanía';
		case 'CE':
			return 'Cédula de Extranjería';
		case 'NIT':
			return 'NIT';
		case 'passport':
			return 'Pasaporte';
		default:
			return 'No registrado';
	}
};

const formatUserType = (type?: string) => {
	switch (type) {
		case 'natural':
			return 'Persona Natural';
		case 'juridical':
			return 'Persona Jurídica';
		case 'company':
			return 'Empresa';
		default:
			return 'No especificado';
	}
};

const formatDateTime = (value?: string) => {
	if (!value) {
		return 'No disponible';
	}

	try {
		return new Date(value).toLocaleString('es-CO', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	} catch {
		return value;
	}
};

export const ProfilePage: React.FC = () => {
	const navigate = useNavigate();
	const { user, signOut, updateProfile } = useAuth();
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
	const userMenuRef = useRef<HTMLDivElement | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const { startTour, hasCompletedTour } = useTour(profileTourSteps, 'profile');

	type PreferenceKey =
		| 'email_enabled'
		| 'sms_enabled'
		| 'in_app_enabled'
		| 'sound_enabled'
		| 'process_updates'
		| 'hearing_reminders'
		| 'document_alerts'
		| 'weekly_summary';

	const defaultPreferences = useMemo<Record<PreferenceKey, boolean>>(
		() => ({
			email_enabled: true,
			sms_enabled: false,
			in_app_enabled: true,
			sound_enabled: true,
			process_updates: true,
			hearing_reminders: true,
			document_alerts: true,
			weekly_summary: false,
		}),
		[]
	);

	const [formValues, setFormValues] = useState(() => ({
		first_name: user?.first_name || '',
		last_name: user?.last_name || '',
		phone_number: user?.phone_number || '',
		notification_preferences: {
			email_enabled: user?.notification_preferences?.email_enabled ?? defaultPreferences.email_enabled,
			sms_enabled: user?.notification_preferences?.sms_enabled ?? defaultPreferences.sms_enabled,
			in_app_enabled: user?.notification_preferences?.in_app_enabled ?? defaultPreferences.in_app_enabled,
			sound_enabled: user?.notification_preferences?.sound_enabled ?? defaultPreferences.sound_enabled,
			process_updates: user?.notification_preferences?.process_updates ?? defaultPreferences.process_updates,
			hearing_reminders: user?.notification_preferences?.hearing_reminders ?? defaultPreferences.hearing_reminders,
			document_alerts: user?.notification_preferences?.document_alerts ?? defaultPreferences.document_alerts,
			weekly_summary: user?.notification_preferences?.weekly_summary ?? defaultPreferences.weekly_summary,
		},
	}));

	const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Usuario';

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
				setIsUserMenuOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	useEffect(() => {
		if (!user) {
			return;
		}
		setFormValues({
			first_name: user.first_name || '',
			last_name: user.last_name || '',
			phone_number: user.phone_number || '',
			notification_preferences: {
				email_enabled: user.notification_preferences?.email_enabled ?? defaultPreferences.email_enabled,
				sms_enabled: user.notification_preferences?.sms_enabled ?? defaultPreferences.sms_enabled,
				in_app_enabled: user.notification_preferences?.in_app_enabled ?? defaultPreferences.in_app_enabled,
				sound_enabled: user.notification_preferences?.sound_enabled ?? defaultPreferences.sound_enabled,
				process_updates: user.notification_preferences?.process_updates ?? defaultPreferences.process_updates,
				hearing_reminders: user.notification_preferences?.hearing_reminders ?? defaultPreferences.hearing_reminders,
				document_alerts: user.notification_preferences?.document_alerts ?? defaultPreferences.document_alerts,
				weekly_summary: user.notification_preferences?.weekly_summary ?? defaultPreferences.weekly_summary,
			},
		});
		}, [user, defaultPreferences]);

	const hasFormChanges = useMemo(() => {
		if (!user) {
			return false;
		}
		const baseFirst = user.first_name || '';
		const baseLast = user.last_name || '';
		const basePhone = user.phone_number || '';
		if (
			formValues.first_name !== baseFirst ||
			formValues.last_name !== baseLast ||
			formValues.phone_number !== basePhone
		) {
			return true;
		}
		const userPrefs = {
			email_enabled: user.notification_preferences?.email_enabled ?? defaultPreferences.email_enabled,
			sms_enabled: user.notification_preferences?.sms_enabled ?? defaultPreferences.sms_enabled,
			in_app_enabled: user.notification_preferences?.in_app_enabled ?? defaultPreferences.in_app_enabled,
			sound_enabled: user.notification_preferences?.sound_enabled ?? defaultPreferences.sound_enabled,
			process_updates: user.notification_preferences?.process_updates ?? defaultPreferences.process_updates,
			hearing_reminders: user.notification_preferences?.hearing_reminders ?? defaultPreferences.hearing_reminders,
			document_alerts: user.notification_preferences?.document_alerts ?? defaultPreferences.document_alerts,
			weekly_summary: user.notification_preferences?.weekly_summary ?? defaultPreferences.weekly_summary,
		};
		return (Object.keys(formValues.notification_preferences) as PreferenceKey[]).some(
			(key) => formValues.notification_preferences[key] !== userPrefs[key]
		);
	}, [formValues, user, defaultPreferences]);

	const handleLogout = async () => {
		try {
			await signOut();
			navigate('/');
		} catch (error) {
			console.error('Error during logout:', error);
			navigate('/');
		}
	};

	const handleFieldChange = (field: 'first_name' | 'last_name' | 'phone_number') =>
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const value = field === 'phone_number' ? event.target.value.replace(/[^\d+\-\s]/g, '') : event.target.value;
			setFormValues((prev) => ({ ...prev, [field]: value }));
		};

	const togglePreference = (key: PreferenceKey) => {
		setFormValues((prev) => ({
			...prev,
			notification_preferences: {
				...prev.notification_preferences,
				[key]: !prev.notification_preferences[key],
			},
		}));
	};

	const handleCancelEdit = () => {
		if (!user) {
			return;
		}
		setFormValues({
			first_name: user.first_name || '',
			last_name: user.last_name || '',
			phone_number: user.phone_number || '',
			notification_preferences: {
				email_enabled: user.notification_preferences?.email_enabled ?? defaultPreferences.email_enabled,
				sms_enabled: user.notification_preferences?.sms_enabled ?? defaultPreferences.sms_enabled,
				in_app_enabled: user.notification_preferences?.in_app_enabled ?? defaultPreferences.in_app_enabled,
				sound_enabled: user.notification_preferences?.sound_enabled ?? defaultPreferences.sound_enabled,
				process_updates: user.notification_preferences?.process_updates ?? defaultPreferences.process_updates,
				hearing_reminders: user.notification_preferences?.hearing_reminders ?? defaultPreferences.hearing_reminders,
				document_alerts: user.notification_preferences?.document_alerts ?? defaultPreferences.document_alerts,
				weekly_summary: user.notification_preferences?.weekly_summary ?? defaultPreferences.weekly_summary,
			},
		});
		setIsEditing(false);
	};

	const handleSave = async () => {
		if (!user) {
			return;
		}
		const trimmedFirst = formValues.first_name.trim();
		const trimmedLast = formValues.last_name.trim();
		if (trimmedFirst.length < 2) {
			toast.error('El nombre debe tener al menos 2 caracteres');
			return;
		}
		if (trimmedLast.length < 2) {
			toast.error('El apellido debe tener al menos 2 caracteres');
			return;
		}
		setIsSaving(true);
		try {
			await updateProfile({
				first_name: trimmedFirst,
				last_name: trimmedLast,
				phone_number: formValues.phone_number.trim(),
				notification_preferences: formValues.notification_preferences,
			});
			toast.success('Perfil actualizado correctamente');
			setIsEditing(false);
		} catch (error: any) {
			toast.error(error?.message || 'No se pudo actualizar el perfil');
		} finally {
			setIsSaving(false);
		}
	};

	const navLinks = [
		{ label: 'Inicio', onClick: () => navigate('/dashboard') },
		{ label: 'Reportes', onClick: () => navigate('/analytics') },
		{ label: 'Notificaciones', onClick: () => navigate('/notifications') },
	];

	const createdAt = user?.created_at || (user && (user as any).createdAt);
	const updatedAt = user?.updated_at || (user && (user as any).updatedAt);

	const preferenceLabels: Record<PreferenceKey, string> = {
		process_updates: 'Actualizaciones de procesos',
		hearing_reminders: 'Recordatorios de audiencias',
		document_alerts: 'Alertas de documentos',
		weekly_summary: 'Resumen semanal',
		email_enabled: 'Notificaciones por correo',
		sms_enabled: 'Notificaciones por SMS',
		in_app_enabled: 'Alertas dentro de la app',
		sound_enabled: 'Sonidos en notificaciones',
	};

	const preferencesToRender = isEditing
		? formValues.notification_preferences
		: {
			process_updates: user?.notification_preferences?.process_updates ?? defaultPreferences.process_updates,
			hearing_reminders: user?.notification_preferences?.hearing_reminders ?? defaultPreferences.hearing_reminders,
			document_alerts: user?.notification_preferences?.document_alerts ?? defaultPreferences.document_alerts,
			weekly_summary: user?.notification_preferences?.weekly_summary ?? defaultPreferences.weekly_summary,
			email_enabled: user?.notification_preferences?.email_enabled ?? defaultPreferences.email_enabled,
			sms_enabled: user?.notification_preferences?.sms_enabled ?? defaultPreferences.sms_enabled,
			in_app_enabled: user?.notification_preferences?.in_app_enabled ?? defaultPreferences.in_app_enabled,
			sound_enabled: user?.notification_preferences?.sound_enabled ?? defaultPreferences.sound_enabled,
		};

	const preferenceOrder: PreferenceKey[] = [
		'process_updates',
		'hearing_reminders',
		'document_alerts',
		'weekly_summary',
		'email_enabled',
		'sms_enabled',
		'in_app_enabled',
		'sound_enabled',
	];

	const renderHeader = () => (
		<header className="bg-primary-700 text-white shadow-lg">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					<button
						type="button"
						onClick={() => navigate('/dashboard')}
						className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 rounded"
					>
						<img src="/logo_justitrack.png" alt="JustiTrack" className="h-12 w-auto" />
					</button>

					<nav className="hidden md:flex items-center gap-6">
						{navLinks.map((link) => (
							<button
								key={link.label}
								type="button"
								onClick={link.onClick}
								className="rounded-full px-4 py-2 text-sm font-semibold tracking-wide text-white/90 transition hover:bg-white/15 hover:text-white"
							>
								{link.label}
							</button>
						))}
					</nav>

					<div className="flex items-center gap-3">
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
								<div className="absolute right-0 z-20 mt-3 w-48 overflow-hidden rounded-xl bg-white text-gray-700 shadow-xl ring-1 ring-black/5">
									<div className="py-2">
										<button
											type="button"
											onClick={() => {
												setIsUserMenuOpen(false);
												navigate('/');
											}}
											className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium transition hover:bg-gray-100"
										>
											<Home className="h-4 w-4" /> Inicio
										</button>
									</div>
									<div className="border-t border-gray-100">
										<button
											type="button"
											onClick={() => {
												setIsUserMenuOpen(false);
												handleLogout();
											}}
											className="flex w-full items-center gap-2 px-4 py-2 text-sm font-semibold text-danger-600 transition hover:bg-danger-50"
										>
											<LogOut className="h-4 w-4" /> Cerrar sesión
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
		<div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
			{renderHeader()}

			<main className="flex-1 pb-24">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
					{!user ? (
						<div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 text-center">
							<h2 className="text-2xl font-semibold text-gray-900">No pudimos cargar tu información</h2>
							<p className="mt-2 text-gray-600">Inicia sesión nuevamente para ver los detalles de tu perfil.</p>
							<div className="mt-6 flex flex-wrap justify-center gap-3">
								<button
									type="button"
									onClick={() => navigate('/login')}
									className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
								>
									Iniciar sesión
								</button>
								<button
									type="button"
									onClick={() => navigate('/')}
									className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400"
								>
									Ir al inicio
								</button>
							</div>
						</div>
					) : (
						<div className="space-y-8">
						<section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8" data-tour="profile-header">
							<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
									<div className="flex items-center gap-4">
										<div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
											<img src="/usuario.png" alt="Avatar de usuario" className="h-10 w-10" />
										</div>
										<div>
											<h1 className="text-3xl font-bold text-gray-900">{displayName}</h1>
											<p className="text-gray-600 mt-1">{user.email}</p>
											<p className="text-sm text-blue-600 mt-2 font-medium">{formatUserType(user.user_type)}</p>
										</div>
									</div>
									<div className="flex flex-wrap gap-3">
										<button
											type="button"
											onClick={() => navigate('/dashboard')}
											className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
										>
											<LayoutDashboard className="h-4 w-4" /> Ir al Inicio
										</button>
										<button
											type="button"
											onClick={handleLogout}
											className="inline-flex items-center gap-2 rounded-lg border border-danger-200 bg-danger-50 px-4 py-2 text-sm font-semibold text-danger-600 transition hover:bg-danger-100"
										>
											<LogOut className="h-4 w-4" /> Cerrar sesión
										</button>
									</div>
								</div>
							</section>

							<section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
								<div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8" data-tour="personal-info">
									<div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
										<div>
											<h2 className="text-xl font-semibold text-gray-900">Información personal</h2>
											<p className="mt-1 text-sm text-gray-600">Administra los datos principales de tu cuenta.</p>
										</div>
										<div className="flex flex-wrap items-center gap-3">
											{isEditing ? (
												<>
													<button
														type="button"
														onClick={handleCancelEdit}
														className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400"
														disabled={isSaving}
													>
														Cancelar
													</button>
													<button
														type="button"
														onClick={handleSave}
														className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${
															hasFormChanges && !isSaving ? 'bg-primary-600 hover:bg-primary-700' : 'bg-primary-400'
														}`}
														disabled={!hasFormChanges || isSaving}
													>
														{isSaving ? 'Guardando...' : 'Guardar cambios'}
													</button>
												</>
											) : (
												<button
														type="button"
														onClick={() => setIsEditing(true)}
														className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
														data-tour="edit-button"
													>
														Editar información
													</button>
											)}
										</div>
									</div>
									<div className="mt-6 space-y-6">
										{isEditing ? (
											<>
												<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
													<div>
														<label className="text-sm font-medium text-gray-500">Nombre(s)</label>
														<input
															type="text"
															value={formValues.first_name}
															onChange={handleFieldChange('first_name')}
															className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
															placeholder="Ingresa tu nombre"
															disabled={isSaving}
														/>
													</div>
													<div>
														<label className="text-sm font-medium text-gray-500">Apellidos</label>
														<input
															type="text"
															value={formValues.last_name}
															onChange={handleFieldChange('last_name')}
															className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
															placeholder="Ingresa tus apellidos"
															disabled={isSaving}
														/>
													</div>
												</div>
												<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
													<div>
														<label className="text-sm font-medium text-gray-500">Correo electrónico</label>
														<div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-base text-gray-700">
															<Mail className="h-4 w-4 text-blue-500" />
															<span className="break-words">{user.email}</span>
														</div>
														<p className="mt-1 text-xs text-gray-500">Este dato se gestiona desde la configuración de acceso.</p>
													</div>
													<div>
														<label className="text-sm font-medium text-gray-500">Teléfono</label>
														<input
															type="text"
															value={formValues.phone_number}
															onChange={handleFieldChange('phone_number')}
															className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
															placeholder="Ingresa un número de contacto"
															disabled={isSaving}
														/>
														<p className="mt-1 text-xs text-gray-500">Usaremos este número para enviarte alertas cuando lo habilites.</p>
													</div>
												</div>
												<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
													<div className="flex items-start gap-3">
														<ShieldCheck className="h-5 w-5 text-blue-500 mt-0.5" />
														<div>
															<span className="text-sm font-medium text-gray-500">Tipo de documento</span>
															<p className="text-base font-semibold text-gray-900">{formatDocumentType(user.document_type)}</p>
														</div>
													</div>
													<div>
														<span className="text-sm font-medium text-gray-500">Número de documento</span>
														<p className="text-base font-semibold text-gray-900">{user.document_number || 'No registrado'}</p>
													</div>
												</div>
												<div className="flex items-start gap-3">
													<Building2 className="h-5 w-5 text-blue-500 mt-0.5" />
													<div>
														<span className="text-sm font-medium text-gray-500">Tipo de usuario</span>
														<p className="text-base font-semibold text-gray-900">{formatUserType(user.user_type)}</p>
														{user.company_id && <p className="mt-1 text-sm text-gray-600">ID Empresa: {user.company_id}</p>}
													</div>
												</div>
											</>
										) : (
											<div className="grid grid-cols-1 gap-5">
												<div>
													<span className="text-sm font-medium text-gray-500">Nombre completo</span>
													<p className="text-base font-semibold text-gray-900">{displayName}</p>
												</div>
												<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
													<div className="flex items-start gap-3">
														<Mail className="h-5 w-5 text-blue-500 mt-0.5" />
														<div>
															<span className="text-sm font-medium text-gray-500">Correo electrónico</span>
															<p className="text-base font-semibold text-gray-900 break-words">{user.email}</p>
														</div>
													</div>
													<div className="flex items-start gap-3">
														<Phone className="h-5 w-5 text-blue-500 mt-0.5" />
														<div>
															<span className="text-sm font-medium text-gray-500">Teléfono</span>
															<p className="text-base font-semibold text-gray-900">{user.phone_number || 'No registrado'}</p>
														</div>
													</div>
												</div>
												<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
													<div className="flex items-start gap-3">
														<ShieldCheck className="h-5 w-5 text-blue-500 mt-0.5" />
														<div>
															<span className="text-sm font-medium text-gray-500">Tipo de documento</span>
															<p className="text-base font-semibold text-gray-900">{formatDocumentType(user.document_type)}</p>
														</div>
													</div>
													<div>
														<span className="text-sm font-medium text-gray-500">Número de documento</span>
														<p className="text-base font-semibold text-gray-900">{user.document_number || 'No registrado'}</p>
													</div>
												</div>
												<div className="flex items-start gap-3">
													<Building2 className="h-5 w-5 text-blue-500 mt-0.5" />
													<div>
														<span className="text-sm font-medium text-gray-500">Tipo de usuario</span>
														<p className="text-base font-semibold text-gray-900">{formatUserType(user.user_type)}</p>
														{user.company_id && <p className="mt-1 text-sm text-gray-600">ID Empresa: {user.company_id}</p>}
													</div>
												</div>
											</div>
										)}
									</div>
								</div>

								<div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8" data-tour="account-status">
									<h2 className="text-xl font-semibold text-gray-900">Estado de la cuenta</h2>
									<div className="mt-6 space-y-5">
										<div className="flex items-start gap-3">
											{(user.is_active ? <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" /> : <XCircle className="h-5 w-5 text-red-500 mt-0.5" />)}
											<div>
												<span className="text-sm font-medium text-gray-500">Estado</span>
												<p className="text-base font-semibold text-gray-900">{user.is_active ? 'Cuenta activa' : 'Cuenta inactiva'}</p>
											</div>
										</div>
										<div className="flex items-start gap-3">
											{(user.email_verified ? <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" /> : <XCircle className="h-5 w-5 text-red-500 mt-0.5" />)}
											<div>
												<span className="text-sm font-medium text-gray-500">Correo verificado</span>
												<p className="text-base font-semibold text-gray-900">{user.email_verified ? 'Verificado' : 'Pendiente de verificación'}</p>
											</div>
										</div>
										<div className="flex items-start gap-3">
											<CalendarDays className="h-5 w-5 text-blue-500 mt-0.5" />
											<div>
												<span className="text-sm font-medium text-gray-500">Miembro desde</span>
												<p className="text-base font-semibold text-gray-900">{formatDateTime(createdAt)}</p>
												<p className="text-sm text-gray-600 mt-1">Última actualización: {formatDateTime(updatedAt)}</p>
											</div>
										</div>
									</div>
								</div>
							</section>

							<section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8" data-tour="notification-preferences">
								<h2 className="text-xl font-semibold text-gray-900">Preferencias de notificación</h2>
								<p className="mt-2 text-sm text-gray-600">Controla los canales y tipos de alertas que recibes sobre tus procesos.</p>
								<div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
									{preferenceOrder.map((key) => {
										const enabled = preferencesToRender[key];
										return (
											<div
												key={key}
												className={`rounded-xl border px-4 py-4 shadow-sm transition ${
													enabled ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-500'
												}${isEditing ? ' hover:border-primary-300' : ''}`}
											>
												<div className="flex items-start justify-between gap-3">
													<div>
														<p className="text-sm font-semibold">{preferenceLabels[key]}</p>
														<p className="mt-2 text-xs uppercase tracking-wide">{enabled ? 'Activado' : 'Desactivado'}</p>
														{isEditing && (
															<p className="mt-2 text-xs text-gray-600">
																Haz clic en el interruptor para {enabled ? 'desactivar' : 'activar'} esta alerta.
															</p>
														)}
													</div>
													{isEditing ? (
														<button
															type="button"
															onClick={() => togglePreference(key)}
															className={`mt-1 inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold transition ${
																enabled ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
															}`}
															disabled={isSaving}
														>
															{enabled ? 'Activado' : 'Desactivado'}
														</button>
													) : enabled ? (
														<CheckCircle2 className="h-5 w-5 text-green-500" />
													) : (
														<XCircle className="h-5 w-5 text-gray-400" />
													)}
												</div>
											</div>
										);
									})}
								</div>
							</section>
						</div>
					)}
				</div>
			</main>

			<HelpButton onClick={startTour} showNotification={!hasCompletedTour} position="bottom-left" />
			<PublicFooter />
		</div>
	);
};
