import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Mail,
	Phone,
	ShieldCheck,
	Building2,
	CalendarDays,
	CheckCircle2,
	XCircle,
	LogOut,
	Home,
	User,
	Settings,
	Bell,
	Smartphone,
	Volume2,
	FileText,
	Calendar,
	Clock,
	Edit3,
	Save,
	X,
	ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { PublicFooter } from '../components/PublicFooter.tsx';
import { Header } from '../components/Header.tsx';
import { toast } from 'react-hot-toast';
import { useTour } from '../hooks/useTour.ts';
import { HelpButton } from '../components/HelpButton.tsx';
import { profileTourSteps } from '../tours/profileTour.ts';

const formatDocumentType = (type?: string) => {
	switch (type) {
		case 'CC': return 'Cédula de Ciudadanía';
		case 'CE': return 'Cédula de Extranjería';
		case 'NIT': return 'NIT';
		case 'passport': return 'Pasaporte';
		default: return 'No registrado';
	}
};

const formatUserType = (type?: string) => {
	switch (type) {
		case 'natural': return 'Persona Natural';
		case 'juridical': return 'Persona Jurídica';
		case 'company': return 'Empresa';
		default: return 'No especificado';
	}
};

const formatDateTime = (value?: string) => {
	if (!value) return 'No disponible';
	try {
		return new Date(value).toLocaleDateString('es-CO', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	} catch {
		return value;
	}
};

export const ProfilePage: React.FC = () => {
	const navigate = useNavigate();
	const { user, signOut, updateProfile } = useAuth();
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const { startTour, hasCompletedTour } = useTour(profileTourSteps, 'profile');

	type PreferenceKey =
		| 'email_enabled' | 'sms_enabled' | 'in_app_enabled' | 'sound_enabled'
		| 'process_updates' | 'hearing_reminders' | 'document_alerts' | 'weekly_summary';

	const defaultPreferences = useMemo<Record<PreferenceKey, boolean>>(() => ({
		email_enabled: true,
		sms_enabled: false,
		in_app_enabled: true,
		sound_enabled: true,
		process_updates: true,
		hearing_reminders: true,
		document_alerts: true,
		weekly_summary: false,
	}), []);

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
		if (!user) return;
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
		if (!user) return false;
		const baseFirst = user.first_name || '';
		const baseLast = user.last_name || '';
		const basePhone = user.phone_number || '';
		if (formValues.first_name !== baseFirst || formValues.last_name !== baseLast || formValues.phone_number !== basePhone) return true;

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
			key => formValues.notification_preferences[key] !== userPrefs[key]
		);
	}, [formValues, user, defaultPreferences]);

	const handleFieldChange = (field: 'first_name' | 'last_name' | 'phone_number') =>
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const value = field === 'phone_number' ? event.target.value.replace(/[^\d+\-\s]/g, '') : event.target.value;
			setFormValues(prev => ({ ...prev, [field]: value }));
		};

	const togglePreference = (key: PreferenceKey) => {
		setFormValues(prev => ({
			...prev,
			notification_preferences: {
				...prev.notification_preferences,
				[key]: !prev.notification_preferences[key],
			},
		}));
	};

	const handleCancelEdit = () => {
		if (!user) return;
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
		if (!user) return;
		const trimmedFirst = formValues.first_name.trim();
		const trimmedLast = formValues.last_name.trim();
		if (trimmedFirst.length < 2 || trimmedLast.length < 2) {
			toast.error('Nombre y apellido deben tener al menos 2 caracteres');
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

	const handleLogout = async () => {
		try {
			await signOut();
			navigate('/login');
		} catch (error: any) {
			toast.error('Error al cerrar sesión');
		}
	};

	const preferenceLabels: Record<PreferenceKey, { label: string, icon: any }> = {
		process_updates: { label: 'Actualizaciones de procesos', icon: FileText },
		hearing_reminders: { label: 'Recordatorios de audiencias', icon: Calendar },
		document_alerts: { label: 'Alertas de documentos', icon: Settings },
		weekly_summary: { label: 'Resumen semanal', icon: Clock },
		email_enabled: { label: 'Notificaciones por correo', icon: Mail },
		sms_enabled: { label: 'Notificaciones por SMS', icon: Smartphone },
		in_app_enabled: { label: 'Alertas dentro de la app', icon: Bell },
		sound_enabled: { label: 'Sonidos en notificaciones', icon: Volume2 },
	};

	const preferenceOrder: PreferenceKey[] = [
		'process_updates', 'hearing_reminders', 'document_alerts', 'weekly_summary',
		'email_enabled', 'sms_enabled', 'in_app_enabled', 'sound_enabled'
	];

	if (!user) {
		return (
			<div className="min-h-screen bg-gray-50 flex flex-col font-sans">
				<Header activePath="/profile" showBack={false} />
				<main className="flex-1 flex items-center justify-center p-4">
					<div className="bg-white rounded-3xl shadow-xl p-12 max-w-lg w-full text-center border border-gray-100 animate-scale-in">
						<div className="w-20 h-20 bg-danger-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
							<XCircle className="h-10 w-10 text-danger-500" />
						</div>
						<h2 className="text-2xl font-serif font-bold text-primary-900 mb-2">Sesión Caducada</h2>
						<p className="text-gray-500 mb-8 leading-relaxed">No pudimos cargar tu información. Por favor inicia sesión nuevamente.</p>
						<button onClick={() => navigate('/login')} className="bg-primary-900 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-accent-500 hover:text-primary-900 transition-all shadow-xl">
							Iniciar Sesión
						</button>
					</div>
				</main>
				<PublicFooter />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col font-sans">
			<Header title="Configuración de Perfil" activePath="/profile" />

			<main className="flex-1 py-12">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					{/* Hero Section */}
					<div className="relative mb-12 animate-fade-in" data-tour="profile-header">
						<div className="bg-primary-900 rounded-[2.5rem] p-10 md:p-14 overflow-hidden relative shadow-2xl border border-accent-500/20">
							<div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transform rotate-12">
								<User size={300} className="text-white" />
							</div>

							<div className="relative z-10 flex flex-col md:flex-row items-center gap-10 text-center md:text-left">
								<div className="relative">
									<div className="w-32 h-32 rounded-3xl bg-accent-500 flex items-center justify-center text-primary-900 shadow-2xl transform hover:scale-105 transition-transform">
										<User size={64} />
									</div>
									<div className="absolute -bottom-2 -right-2 w-10 h-10 bg-success-500 border-4 border-primary-900 rounded-full flex items-center justify-center shadow-lg">
										<CheckCircle2 size={18} className="text-white" />
									</div>
								</div>

								<div className="space-y-4 flex-1">
									<div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-500/20 border border-accent-500/30 rounded-full text-accent-400">
										<span className="text-[10px] font-bold uppercase tracking-widest leading-none">Perfil Profesional</span>
									</div>
									<h1 className="text-4xl md:text-5xl font-serif font-bold text-white tracking-tight">{displayName}</h1>
									<div className="flex flex-wrap justify-center md:justify-start items-center gap-6 text-white/70">
										<div className="flex items-center gap-2">
											<Mail size={16} className="text-accent-500" />
											<span className="text-sm font-medium">{user.email}</span>
										</div>
										<div className="flex items-center gap-2">
											<Building2 size={16} className="text-accent-500" />
											<span className="text-sm font-medium">{formatUserType(user.user_type)}</span>
										</div>
									</div>
								</div>

								<div className="flex gap-4">
									{!isEditing ? (
										<button
											onClick={() => setIsEditing(true)}
											className="flex items-center gap-3 bg-accent-500 text-primary-900 px-8 py-4 rounded-2xl font-bold text-sm hover:bg-white transition-all shadow-xl shadow-accent-500/10 active:scale-95"
											data-tour="edit-button"
										>
											<Edit3 size={18} />
											<span>Editar Perfil</span>
										</button>
									) : (
										<div className="flex gap-3">
											<button
												onClick={handleCancelEdit}
												className="flex items-center gap-2 bg-white/10 text-white border border-white/20 px-6 py-4 rounded-2xl font-bold text-sm hover:bg-white/20 transition-all"
												disabled={isSaving}
											>
												<X size={18} />
												<span>Cancelar</span>
											</button>
											<button
												onClick={handleSave}
												className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm transition-all shadow-xl active:scale-95 ${hasFormChanges && !isSaving
													? 'bg-accent-500 text-primary-900 shadow-accent-500/10'
													: 'bg-gray-400 text-white opacity-50 cursor-not-allowed'
													}`}
												disabled={!hasFormChanges || isSaving}
											>
												{isSaving ? <Clock className="animate-spin" size={18} /> : <Save size={18} />}
												<span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
											</button>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						{/* Personal Data Column */}
						<div className="lg:col-span-2 space-y-8">
							<div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden animate-scale-in" data-tour="personal-info">
								<div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
									<div className="flex items-center gap-4">
										<div className="w-12 h-12 rounded-2xl bg-primary-900/5 flex items-center justify-center text-primary-900">
											<ShieldCheck size={24} />
										</div>
										<div>
											<h2 className="text-xl font-serif font-bold text-primary-900">Datos Principales</h2>
											<p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Información Legal y Contacto</p>
										</div>
									</div>
								</div>

								<div className="p-10">
									{isEditing ? (
										<div className="space-y-8">
											<div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
												<div className="space-y-2">
													<label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Nombre(s)</label>
													<input
														type="text"
														value={formValues.first_name}
														onChange={handleFieldChange('first_name')}
														className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-primary-900 font-bold focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all outline-none"
														placeholder="Tu nombre"
														disabled={isSaving}
													/>
												</div>
												<div className="space-y-2">
													<label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Apellidos</label>
													<input
														type="text"
														value={formValues.last_name}
														onChange={handleFieldChange('last_name')}
														className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-primary-900 font-bold focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all outline-none"
														placeholder="Tus apellidos"
														disabled={isSaving}
													/>
												</div>
											</div>

											<div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
												<div className="space-y-2">
													<label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Teléfono Móvil</label>
													<div className="relative">
														<Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
														<input
															type="text"
															value={formValues.phone_number}
															onChange={handleFieldChange('phone_number')}
															className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-5 py-4 text-primary-900 font-bold focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all outline-none"
															placeholder="+57..."
															disabled={isSaving}
														/>
													</div>
												</div>
												<div className="space-y-2">
													<label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Correo Electrónico</label>
													<div className="relative">
														<Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
														<div className="w-full bg-gray-100 border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-gray-500 font-bold border-dashed">
															{user.email}
														</div>
													</div>
												</div>
											</div>

											<div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
												<div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
													<span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Identificación</span>
													<p className="text-sm font-bold text-primary-900">{formatDocumentType(user.document_type)}</p>
													<p className="text-xl font-serif font-bold text-accent-600 mt-1">{user.document_number || 'N/A'}</p>
												</div>
												<div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
													<span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Entidad / Tipo</span>
													<p className="text-sm font-bold text-primary-900">{formatUserType(user.user_type)}</p>
													<p className="text-xs text-gray-500 mt-2">Registrado como usuario profesional certificado.</p>
												</div>
											</div>
										</div>
									) : (
										<div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
											<div className="space-y-1.5">
												<span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
													<User size={12} className="text-accent-500" /> Nombre Completo
												</span>
												<p className="text-lg font-serif font-bold text-primary-900">{displayName}</p>
											</div>
											<div className="space-y-1.5">
												<span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
													<Mail size={12} className="text-accent-500" /> Email
												</span>
												<p className="text-lg font-serif font-bold text-primary-900 break-all">{user.email}</p>
											</div>
											<div className="space-y-1.5">
												<span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
													<Phone size={12} className="text-accent-500" /> Teléfono
												</span>
												<p className="text-lg font-serif font-bold text-primary-900">{user.phone_number || 'No registrado'}</p>
											</div>
											<div className="space-y-1.5">
												<span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
													<ShieldCheck size={12} className="text-accent-500" /> Documento
												</span>
												<p className="text-lg font-serif font-bold text-primary-900">
													<span className="text-xs text-gray-400 mr-2">{user.document_type}</span>
													{user.document_number || '-'}
												</p>
											</div>
											<div className="md:col-span-2 space-y-1.5">
												<span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
													<Building2 size={12} className="text-accent-500" /> Tipo de Cuenta
												</span>
												<div className="inline-flex items-center gap-3 bg-primary-900/5 px-4 py-2 rounded-xl">
													<span className="text-sm font-bold text-primary-900">{formatUserType(user.user_type)}</span>
													{user.company_id && <span className="text-[10px] text-accent-600 font-bold border-l border-gray-200 pl-3">ID: {user.company_id}</span>}
												</div>
											</div>
										</div>
									)}
								</div>
							</div>

							<div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden animate-scale-in" data-tour="notification-preferences">
								<div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
									<div className="flex items-center gap-4">
										<div className="w-12 h-12 rounded-2xl bg-primary-900/5 flex items-center justify-center text-primary-900">
											<Bell size={24} />
										</div>
										<div>
											<h2 className="text-xl font-serif font-bold text-primary-900">Alertas y Canales</h2>
											<p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Control de Notificaciones</p>
										</div>
									</div>
								</div>

								<div className="p-10">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{preferenceOrder.map((key) => {
											const item = preferenceLabels[key];
											const enabled = isEditing ? formValues.notification_preferences[key] : (user?.notification_preferences as any)?.[key] ?? defaultPreferences[key];

											return (
												<div
													key={key}
													onClick={() => isEditing && togglePreference(key)}
													className={`group flex items-center justify-between p-6 rounded-3xl border transition-all duration-300 ${isEditing ? 'cursor-pointer hover:shadow-xl hover:shadow-primary-900/5 hover:border-accent-500/30' : ''} ${enabled
														? 'bg-white border-accent-500/10 shadow-lg shadow-accent-500/5'
														: 'bg-gray-50 border-gray-100 opacity-60'
														}`}
												>
													<div className="flex items-center gap-4">
														<div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${enabled ? 'bg-accent-500 text-primary-900' : 'bg-gray-200 text-gray-400'
															}`}>
															<item.icon size={20} />
														</div>
														<span className={`text-sm font-bold ${enabled ? 'text-primary-900' : 'text-gray-500'}`}>{item.label}</span>
													</div>

													{isEditing ? (
														<div className={`w-12 h-6 rounded-full relative transition-colors ${enabled ? 'bg-accent-500' : 'bg-gray-300'}`}>
															<div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'left-7' : 'left-1'}`}></div>
														</div>
													) : (
														enabled ? <CheckCircle2 size={20} className="text-accent-500" /> : <XCircle size={20} className="text-gray-300" />
													)}
												</div>
											);
										})}
									</div>
								</div>
							</div>
						</div>

						{/* Sidebar Stats Column */}
						<div className="space-y-8 lg:sticky lg:top-32 h-fit animate-fade-in-right" data-tour="account-status">
							<div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
								<div className="p-8 border-b border-gray-50 bg-primary-900 text-white relative">
									<div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
										<ShieldCheck size={80} />
									</div>
									<h2 className="text-lg font-serif font-bold relative z-10">Seguridad de Cuenta</h2>
									<p className="text-[10px] font-bold text-accent-400 uppercase tracking-[0.2em] mt-1 relative z-10">Estado del Sistema</p>
								</div>

								<div className="p-8 space-y-8">
									<div className="flex items-start gap-4">
										<div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${user.is_active ? 'bg-success-500/10 text-success-600' : 'bg-danger-50 text-danger-500'}`}>
											{user.is_active ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
										</div>
										<div>
											<p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Estado Global</p>
											<p className="text-sm font-bold text-primary-900">{user.is_active ? 'Suscripción Activa' : 'Cuenta Suspendida'}</p>
										</div>
									</div>

									<div className="flex items-start gap-4">
										<div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${user.email_verified ? 'bg-accent-500/10 text-accent-600' : 'bg-danger-50 text-danger-500'}`}>
											{user.email_verified ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
										</div>
										<div>
											<p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Verificación</p>
											<p className="text-sm font-bold text-primary-900">{user.email_verified ? 'Identity Verified' : 'Pendiente'}</p>
										</div>
									</div>

									<div className="flex items-start gap-4">
										<div className="w-10 h-10 bg-primary-900/5 text-primary-900 rounded-xl flex items-center justify-center shrink-0">
											<CalendarDays size={20} />
										</div>
										<div>
											<p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Miembro Desde</p>
											<p className="text-sm font-bold text-primary-900">{formatDateTime(user.created_at || (user as any).createdAt)}</p>
										</div>
									</div>
								</div>

								<div className="p-6 bg-gray-50 border-t border-gray-100 mt-4">
									<button
										onClick={handleLogout}
										className="w-full flex items-center justify-center gap-3 bg-white text-danger-600 border border-danger-200 px-6 py-4 rounded-2xl font-bold text-sm hover:bg-danger-50 transition-all active:scale-95 shadow-sm"
									>
										<LogOut size={18} />
										<span>Cerrar Sesión</span>
									</button>
									<p className="text-[9px] font-bold text-gray-400 uppercase text-center mt-6 tracking-widest">
										Sesión segura encriptada (AES-256)
									</p>
								</div>
							</div>

							{/* Security Tip Card */}
							<div className="bg-accent-500/10 rounded-[2rem] p-8 border border-accent-500/20">
								<div className="flex items-center gap-3 mb-4">
									<ShieldCheck className="text-accent-600" size={24} />
									<h3 className="font-serif font-bold text-primary-900">Consejo de Seguridad</h3>
								</div>
								<p className="text-sm text-primary-800 leading-relaxed opacity-80">
									JustiTrack nunca te pedirá tu contraseña a través de correos electrónicos. Asegúrate de habilitar las notificaciones por correo para recibir alertas de intentos de acceso.
								</p>
							</div>
						</div>
					</div>
				</div>
			</main>

			<HelpButton onClick={startTour} showNotification={!hasCompletedTour} position="bottom-left" />
			<PublicFooter />
		</div>
	);
};

export default ProfilePage;
