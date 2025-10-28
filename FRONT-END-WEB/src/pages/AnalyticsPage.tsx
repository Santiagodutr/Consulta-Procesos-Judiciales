import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	ResponsiveContainer,
	LineChart,
	Line,
	CartesianGrid,
	XAxis,
	YAxis,
	Tooltip,
	ReferenceDot,
	ReferenceArea,
	BarChart,
	Bar,
	Cell,
} from 'recharts';
import {
	format,
	parseISO,
	isValid,
	eachYearOfInterval,
	startOfYear,
	differenceInCalendarDays,
	differenceInCalendarYears,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { TooltipProps } from 'recharts/types/component/Tooltip';
import { directJudicialAPI } from '../services/apiService.ts';
import { ProcessActivity, judicialPortalService } from '../services/judicialPortalService.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { PublicFooter } from '../components/PublicFooter.tsx';
import {
	Activity as ActivityIcon,
	BarChart3,
	CalendarClock,
	Loader2,
	TrendingUp,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface FavoriteProcess {
	id?: number;
	numero_radicacion: string;
	despacho: string;
	demandante: string;
	demandado: string;
	tipo_proceso: string;
	fecha_radicacion: string;
}

interface ActivityChartPoint {
	yearKey: string;
	label: string;
	count: number;
	isPeak: boolean;
	isInactive: boolean;
	dateISO: string;
}

interface InactiveBlock {
	startLabel: string;
	endLabel: string;
	length: number;
}

interface ActivityAnalytics {
	chartData: ActivityChartPoint[];
	totalActivities: number;
	peakYearLabel?: string;
	peakCount: number;
	averagePerYear: number;
	inactiveSegments: number;
	longestGap?: {
		days: number;
		fromLabel?: string;
		toLabel?: string;
	};
	lastActivityLabel?: string;
	firstActivityLabel?: string;
	inactiveBlocks: InactiveBlock[];
}

interface GlobalSummary {
	totalActivities: number;
	processesAnalyzed: number;
	peakLabel?: string;
	peakCount: number;
	inactiveSegments: number;
	chartData: ActivityChartPoint[];
}

const ANALYTICS_START_YEAR = 2005;
const ANALYTICS_END_YEAR = 2025;

const capitalize = (value: string) => {
	if (!value) {
		return value;
	}
	return value.charAt(0).toUpperCase() + value.slice(1);
};

const parseActivityDate = (activity: ProcessActivity): Date | null => {
	const candidates = [
		activity.fechaActuacion,
		activity.fechaRegistro,
		activity.fechaInicioTermino,
		activity.fechaInicial,
		activity.fechaFinal,
	];

	for (const raw of candidates) {
		if (!raw) {
			continue;
		}

		let parsed = parseISO(raw);
		if (!isValid(parsed)) {
			// Intentar reemplazar espacios por "T"
			const sanitized = raw.replace(' ', 'T');
			parsed = parseISO(sanitized);
		}

		if (!isValid(parsed)) {
			// Intentar con formato dd/MM/yyyy
			const parts = raw.split('/');
			if (parts.length === 3) {
				const [day, month, year] = parts.map(Number);
				const candidate = new Date(year, month - 1, day);
				if (isValid(candidate)) {
					return candidate;
				}
			}

			const fallback = new Date(raw);
			if (isValid(fallback)) {
				parsed = fallback;
			}
		}

		if (isValid(parsed)) {
			return parsed;
		}
	}

	return null;
};

const buildAnalyticsFromActivities = (activities: ProcessActivity[]): ActivityAnalytics => {
		const parsedDates = activities
			.map(parseActivityDate)
			.filter((date): date is Date => date !== null)
			.sort((a, b) => a.getTime() - b.getTime());

		const countedDates = parsedDates.filter(date => {
			const yearNumber = date.getFullYear();
			return yearNumber >= ANALYTICS_START_YEAR && yearNumber <= ANALYTICS_END_YEAR;
		});

	const timelineStart = startOfYear(new Date(ANALYTICS_START_YEAR, 0, 1));
	const timelineEnd = startOfYear(new Date(ANALYTICS_END_YEAR, 0, 1));

	const timelineYears = eachYearOfInterval({
		start: timelineStart,
		end: timelineEnd,
	});

	if (timelineYears.length === 0) {
		return {
			chartData: [],
			totalActivities: activities.length,
			peakCount: 0,
			peakYearLabel: undefined,
			averagePerYear: 0,
			inactiveSegments: 0,
			longestGap: undefined,
			lastActivityLabel: parsedDates.length
				? capitalize(format(parsedDates[parsedDates.length - 1], 'dd MMM yyyy', { locale: es }))
				: 'Sin registros',
			firstActivityLabel: parsedDates.length
				? capitalize(format(parsedDates[0], 'dd MMM yyyy', { locale: es }))
				: undefined,
			inactiveBlocks: [],
		};
	}

		if (countedDates.length === 0) {
			const hasHistoricalData = parsedDates.length > 0;
			const lastHistoricalLabel = hasHistoricalData
				? capitalize(format(parsedDates[parsedDates.length - 1], 'dd MMM yyyy', { locale: es }))
				: 'Sin registros';
			const firstHistoricalLabel = hasHistoricalData
				? capitalize(format(parsedDates[0], 'dd MMM yyyy', { locale: es }))
				: undefined;
		const chartData = timelineYears.map(yearDate => ({
			yearKey: format(yearDate, 'yyyy'),
			label: format(yearDate, 'yyyy'),
			count: 0,
			isPeak: false,
			isInactive: true,
			dateISO: yearDate.toISOString(),
		}));

		return {
			chartData,
			totalActivities: hasHistoricalData ? parsedDates.length : 0,
			peakCount: 0,
			peakYearLabel: undefined,
			averagePerYear: 0,
			inactiveSegments: chartData.length > 0 ? 1 : 0,
			longestGap: undefined,
			lastActivityLabel: lastHistoricalLabel,
			firstActivityLabel: firstHistoricalLabel,
			inactiveBlocks: chartData.length > 0
				? [
						{
							startLabel: chartData[0].label,
							endLabel: chartData[chartData.length - 1].label,
							length: chartData.length,
						},
					]
				: [],
		};
	}

		const countsByYear = new Map<string, number>();
		countedDates.forEach(date => {
			const yearKey = format(startOfYear(date), 'yyyy');
		countsByYear.set(yearKey, (countsByYear.get(yearKey) || 0) + 1);
	});

	let maxCount = 0;
	countsByYear.forEach(value => {
		if (value > maxCount) {
			maxCount = value;
		}
	});

	const chartData: ActivityChartPoint[] = timelineYears.map(yearDate => {
		const yearKey = format(yearDate, 'yyyy');
		const count = countsByYear.get(yearKey) || 0;
		return {
			yearKey,
			label: yearKey,
			count,
			isPeak: maxCount > 0 && count === maxCount,
			isInactive: count === 0,
			dateISO: yearDate.toISOString(),
		};
	});

	const peakPoint = chartData.find(point => point.isPeak);

		let inactiveSegments = 0;
		const inactiveBlocks: InactiveBlock[] = [];
		let inactiveStartIndex: number | null = null;

		chartData.forEach((point, index) => {
			if (point.count === 0) {
				if (inactiveStartIndex === null) {
					inactiveStartIndex = index;
				}
			} else if (inactiveStartIndex !== null) {
				inactiveSegments += 1;
				const startPoint = chartData[inactiveStartIndex];
				const endPoint = chartData[index - 1];
				const startDate = parseISO(startPoint.dateISO);
				const endDate = parseISO(endPoint.dateISO);
				const length = differenceInCalendarYears(endDate, startDate) + 1;
				inactiveBlocks.push({
					startLabel: startPoint.label,
					endLabel: endPoint.label,
					length,
				});
				inactiveStartIndex = null;
			}
		});

		if (inactiveStartIndex !== null) {
			inactiveSegments += 1;
			const startPoint = chartData[inactiveStartIndex];
			const endPoint = chartData[chartData.length - 1];
			const startDate = parseISO(startPoint.dateISO);
			const endDate = parseISO(endPoint.dateISO);
			const length = differenceInCalendarYears(endDate, startDate) + 1;
			inactiveBlocks.push({
				startLabel: startPoint.label,
				endLabel: endPoint.label,
				length,
			});
		}

	let longestGapDays = 0;
	let longestGapStart: Date | null = null;
	let longestGapEnd: Date | null = null;

		for (let i = 1; i < countedDates.length; i += 1) {
			const current = countedDates[i];
			const previous = countedDates[i - 1];
		const gap = Math.max(0, differenceInCalendarDays(current, previous) - 1);
		if (gap > longestGapDays) {
			longestGapDays = gap;
			longestGapStart = previous;
			longestGapEnd = current;
		}
	}

	const gapToToday = Math.max(
		0,
			differenceInCalendarDays(new Date(), countedDates[countedDates.length - 1]) - 1,
	);

	if (gapToToday > longestGapDays) {
		longestGapDays = gapToToday;
			longestGapStart = countedDates[countedDates.length - 1];
		longestGapEnd = new Date();
	}

	const longestGap = longestGapDays > 0 && longestGapStart && longestGapEnd
		? {
				days: longestGapDays,
				fromLabel: capitalize(format(longestGapStart, 'dd MMM yyyy', { locale: es })),
				toLabel: capitalize(format(longestGapEnd, 'dd MMM yyyy', { locale: es })),
			}
		: undefined;

		const averagePerYear = chartData.length > 0 ? countedDates.length / chartData.length : 0;

	return {
		chartData,
			totalActivities: countedDates.length,
		peakCount: peakPoint?.count ?? 0,
		peakYearLabel: peakPoint?.label,
		averagePerYear,
		inactiveSegments,
		longestGap,
			lastActivityLabel: capitalize(
				format(countedDates[countedDates.length - 1], 'dd MMM yyyy', { locale: es }),
			),
			firstActivityLabel: capitalize(format(countedDates[0], 'dd MMM yyyy', { locale: es })),
		inactiveBlocks,
	};
};

const ActivityTooltipContent: React.FC<TooltipProps<string, string>> = ({ active, payload }) => {
	if (!active || !payload || payload.length === 0) {
		return null;
	}

	const point = payload[0].payload as ActivityChartPoint;

	return (
		<div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-xl">
			<p className="text-sm font-semibold text-slate-900">{point.label}</p>
			<p className="text-sm text-slate-600">
				Actuaciones: <span className="font-semibold text-slate-900">{point.count}</span>
			</p>
			{point.isPeak && <p className="text-xs font-medium text-amber-600">Pico de actividad</p>}
			{point.isInactive && <p className="text-xs font-medium text-slate-500">Periodo inactivo</p>}
		</div>
	);
};

const ActivityDot = (props: any) => {
	const { cx, cy, payload } = props;
	if (payload.isPeak) {
		return <circle cx={cx} cy={cy} r={6} fill="#fb923c" stroke="#1f2937" strokeWidth={2} />;
	}
	if (payload.count === 0) {
		return <circle cx={cx} cy={cy} r={4} fill="#94a3b8" stroke="#ffffff" strokeWidth={1.5} />;
	}
	return <circle cx={cx} cy={cy} r={4} fill="#2563eb" stroke="#ffffff" strokeWidth={1.5} />;
};

const formatNumber = (value: number) => new Intl.NumberFormat('es-CO').format(value);

const AnalyticsPage: React.FC = () => {
	const navigate = useNavigate();
	const { user, signOut } = useAuth();

	const [favoriteProcesses, setFavoriteProcesses] = useState<FavoriteProcess[]>([]);
	const [selectedProcess, setSelectedProcess] = useState<string | null>(null);
	const [analyticsByProcess, setAnalyticsByProcess] = useState<Record<string, ActivityAnalytics>>({});
	const [loadingFavorites, setLoadingFavorites] = useState(true);
	const [loadingProcess, setLoadingProcess] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [processError, setProcessError] = useState<string | null>(null);
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
	const [exporting, setExporting] = useState(false);
	const userMenuRef = useRef<HTMLDivElement | null>(null);
	const exportContentRef = useRef<HTMLElement | null>(null);

	const displayName = useMemo(() => {
		const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ');
		return name || 'Usuario';
	}, [user?.first_name, user?.last_name]);

	const navLinks = useMemo(
		() => [
			{ label: 'Inicio', onClick: () => navigate('/dashboard') },
			{ label: 'Reportes', onClick: () => navigate('/analytics') },
			{ label: 'Notificaciones', onClick: () => navigate('/notifications') },
		],
		[navigate],
	);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
				setIsUserMenuOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

		const loadProcessAnalytics = useCallback(
			async (numeroRadicacion: string) => {
			setLoadingProcess(true);
			setProcessError(null);

			try {
				const response = await directJudicialAPI.consultProcess(numeroRadicacion);

				if (response.success && response.data) {
					let actividades: ProcessActivity[] = response.data.actuaciones || [];

					if ((!actividades || actividades.length === 0) && response.data.idProceso) {
						try {
							const actuacionesResponse = await judicialPortalService.getActuacionesByIdProceso(
								response.data.idProceso,
							);

							if (
								actuacionesResponse.todasActuaciones &&
								actuacionesResponse.todasActuaciones.length > 0
							) {
								actividades = actuacionesResponse.todasActuaciones;
							} else if (
								actuacionesResponse.actuaciones &&
								actuacionesResponse.actuaciones.length > 0
							) {
								actividades = actuacionesResponse.actuaciones;
							}
						} catch (actuacionesError) {
							console.error('Error obteniendo actuaciones avanzadas:', actuacionesError);
						}
					}

					const analytics = buildAnalyticsFromActivities(actividades);

					setAnalyticsByProcess(prev => ({
						...prev,
						[numeroRadicacion]: analytics,
					}));
				} else {
					setProcessError(
						response.message || 'No se pudo analizar la actividad procesal de este proceso',
					);
				}
			} catch (e) {
				console.error('Error loading process analytics', e);
				setProcessError('Ocurrió un error al consultar el portal judicial');
			} finally {
				setLoadingProcess(false);
			}
		},
		[],
		);

		const loadFavorites = useCallback(async () => {
			setLoadingFavorites(true);
			setError(null);

			try {
				const response = await directJudicialAPI.getFavoriteProcesses();
				if (response.success && Array.isArray(response.data)) {
					setFavoriteProcesses(response.data);
				} else {
					setFavoriteProcesses([]);
					setError(response.message || 'No se pudieron obtener los procesos favoritos');
				}
			} catch (e) {
				console.error('Error loading favorites', e);
				setError('No se pudieron obtener los procesos favoritos');
				setFavoriteProcesses([]);
			} finally {
				setLoadingFavorites(false);
			}
			}, []);

	useEffect(() => {
		loadFavorites();
	}, [loadFavorites]);

			useEffect(() => {
				if (favoriteProcesses.length === 0) {
					return;
				}

				if (!selectedProcess) {
					setSelectedProcess(favoriteProcesses[0].numero_radicacion);
				}
			}, [favoriteProcesses, selectedProcess]);

			useEffect(() => {
				if (!selectedProcess) {
					return;
				}

				if (!analyticsByProcess[selectedProcess]) {
					loadProcessAnalytics(selectedProcess);
				}
			}, [selectedProcess, analyticsByProcess, loadProcessAnalytics]);

		const handleProcessSelection = useCallback((numeroRadicacion: string) => {
			setSelectedProcess(numeroRadicacion);
			setProcessError(null);
		}, []);

	const handleLogout = useCallback(async () => {
		try {
			await signOut();
			navigate('/login');
		} catch (e) {
			console.error('Error al cerrar sesión', e);
		}
	}, [navigate, signOut]);

	const handleLogoClick = useCallback(() => {
		navigate('/');
	}, [navigate]);

	const handleExportPdf = useCallback(async () => {
		if (!exportContentRef.current) {
			return;
		}

		try {
			setExporting(true);
			const canvas = await html2canvas(exportContentRef.current, {
				scale: 2,
				backgroundColor: '#ffffff',
				ignoreElements: (element: Element) => element?.hasAttribute?.('data-html2canvas-ignore') ?? false,
			});
			const imageData = canvas.toDataURL('image/png');
			const pdf = new jsPDF('p', 'mm', 'a4');
			const pageWidth = pdf.internal.pageSize.getWidth();
			const pageHeight = pdf.internal.pageSize.getHeight();
			const imageWidth = pageWidth;
			const imageHeight = (canvas.height * imageWidth) / canvas.width;
			let heightLeft = imageHeight;
			let position = 0;

			pdf.addImage(imageData, 'PNG', 0, position, imageWidth, imageHeight, undefined, 'FAST');
			heightLeft -= pageHeight;

			while (heightLeft > 0) {
				position = heightLeft - imageHeight;
				pdf.addPage();
				pdf.addImage(imageData, 'PNG', 0, position, imageWidth, imageHeight, undefined, 'FAST');
				heightLeft -= pageHeight;
			}

			const filename = selectedProcess
				? `analitica-proceso-${selectedProcess.replace(/\s+/g, '-')}.pdf`
				: 'analitica-procesos.pdf';
			pdf.save(filename);
		} catch (exportError) {
			console.error('Error al exportar el análisis a PDF', exportError);
		} finally {
			setExporting(false);
		}
	}, [selectedProcess]);

	const selectedAnalytics = selectedProcess ? analyticsByProcess[selectedProcess] : undefined;

	const globalSummary: GlobalSummary = useMemo(() => {
		const analyticsValues = Object.values(analyticsByProcess);
		if (analyticsValues.length === 0) {
			return {
				totalActivities: 0,
				processesAnalyzed: 0,
				peakCount: 0,
				inactiveSegments: 0,
				chartData: [],
			};
		}

				const combinedMap = new Map<string, { count: number; dateISO: string }>();

		analyticsValues.forEach(analytics => {
			analytics.chartData.forEach(point => {
					const existing = combinedMap.get(point.yearKey);
				if (existing) {
					existing.count += point.count;
				} else {
						combinedMap.set(point.yearKey, { count: point.count, dateISO: point.dateISO });
				}
			});
		});

				const chartData: ActivityChartPoint[] = [];
				let globalMax = 0;

				for (let year = ANALYTICS_START_YEAR; year <= ANALYTICS_END_YEAR; year += 1) {
					const yearKey = year.toString();
					const existing = combinedMap.get(yearKey);
					const count = existing ? existing.count : 0;
					if (count > globalMax) {
						globalMax = count;
					}
					chartData.push({
						yearKey,
						label: yearKey,
						count,
						isPeak: false,
						isInactive: count === 0,
						dateISO: existing ? existing.dateISO : new Date(year, 0, 1).toISOString(),
					});
				}

				if (globalMax > 0) {
					chartData.forEach(point => {
						point.isPeak = point.count === globalMax;
					});
				}

		let inactiveSegments = 0;
		let currentBlock = false;
		chartData.forEach(point => {
			if (point.count === 0) {
				if (!currentBlock) {
					currentBlock = true;
				}
			} else if (currentBlock) {
				inactiveSegments += 1;
				currentBlock = false;
			}
		});
		if (currentBlock) {
			inactiveSegments += 1;
		}

		const peakPoint = chartData.find(point => point.isPeak);

		return {
			totalActivities: analyticsValues.reduce((sum, item) => sum + item.totalActivities, 0),
			processesAnalyzed: analyticsValues.length,
			peakLabel: peakPoint?.label,
			peakCount: peakPoint?.count ?? 0,
			inactiveSegments,
			chartData,
		};
	}, [analyticsByProcess]);

	const renderHeader = () => (
		<header className="bg-primary-700 text-white shadow-lg">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={handleLogoClick}
							className="flex items-center rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
						>
							<img src="/logo_justitrack.png" alt="JustiTrack" className="h-12 w-auto" />
						</button>
					</div>

					<div className="hidden items-center gap-8 md:flex">
						{navLinks.map(link => (
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
								onClick={() => setIsUserMenuOpen(prev => !prev)}
								className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
							>
								<img src="/usuario.png" alt="Usuario" className="h-6 w-6" />
								<span className="hidden sm:inline">{displayName}</span>
								<svg
									className="h-3 w-3"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
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
		<div className="min-h-screen bg-slate-50 flex flex-col">
			{renderHeader()}

			<main
				ref={exportContentRef}
				className="flex-1 mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8"
			>
				<div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div>
						<h1 className="text-3xl font-bold text-slate-900">Analítica de Procesos Favoritos</h1>
						<p className="mt-2 text-sm text-slate-600">
							Explora la frecuencia de actuaciones judiciales, identifica picos de actividad y detecta periodos de inactividad en tus procesos guardados.
						</p>
					</div>
					<button
						type="button"
						onClick={handleExportPdf}
						disabled={exporting || loadingProcess || loadingFavorites}
						data-html2canvas-ignore="true"
						className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:bg-primary-400"
					>
						{exporting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Generando PDF...
							</>
						) : (
							'Exportar análisis en PDF'
						)}
					</button>
				</div>

				<section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-slate-500">Procesos favoritos</p>
								<p className="mt-2 text-2xl font-semibold text-slate-900">
									{loadingFavorites ? '—' : formatNumber(favoriteProcesses.length)}
								</p>
							</div>
							<div className="rounded-full bg-primary-50 p-3 text-primary-700">
								<ActivityIcon className="h-5 w-5" />
							</div>
						</div>
					</div>

					<div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-slate-500">Procesos analizados</p>
								<p className="mt-2 text-2xl font-semibold text-slate-900">
									{formatNumber(globalSummary.processesAnalyzed)}
								</p>
							</div>
							<div className="rounded-full bg-emerald-50 p-3 text-emerald-600">
								<TrendingUp className="h-5 w-5" />
							</div>
						</div>
					</div>

					<div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-slate-500">Actuaciones registradas</p>
								<p className="mt-2 text-2xl font-semibold text-slate-900">
									{formatNumber(globalSummary.totalActivities)}
								</p>
								{globalSummary.peakLabel && (
									<p className="text-xs font-medium text-amber-600">
										Pico: {globalSummary.peakLabel} ({globalSummary.peakCount})
									</p>
								)}
							</div>
							<div className="rounded-full bg-amber-50 p-3 text-amber-500">
								<BarChart3 className="h-5 w-5" />
							</div>
						</div>
					</div>

					<div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-slate-500">Periodos inactivos</p>
								<p className="mt-2 text-2xl font-semibold text-slate-900">
									{formatNumber(globalSummary.inactiveSegments)}
								</p>
								{selectedAnalytics?.longestGap && (
									<p className="text-xs text-slate-500">
										Mayor: {selectedAnalytics.longestGap.days} días
									</p>
								)}
							</div>
							<div className="rounded-full bg-slate-100 p-3 text-slate-500">
								<CalendarClock className="h-5 w-5" />
							</div>
						</div>
					</div>
				</section>

				{error && (
					<div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
						{error}
					</div>
				)}

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
					<aside className="space-y-4 lg:col-span-1">
						<div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
							<div className="border-b border-slate-100 px-5 py-4">
								<h2 className="text-lg font-semibold text-slate-900">Procesos favoritos</h2>
								<p className="text-xs text-slate-500">Selecciona un radicado para analizar sus actuaciones.</p>
							</div>

							<div className="max-h-[480px] overflow-y-auto px-3 py-2">
								{loadingFavorites && (
									<div className="flex items-center justify-center py-12 text-slate-500">
										<Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando favoritos...
									</div>
								)}

								{!loadingFavorites && favoriteProcesses.length === 0 && (
									<div className="flex flex-col items-center justify-center py-10 text-center text-sm text-slate-500">
										<ActivityIcon className="mb-3 h-8 w-8 text-slate-300" />
										No tienes procesos favoritos aún.
									</div>
								)}

								<div className="space-y-2">
									{favoriteProcesses.map(process => {
										const isSelected = selectedProcess === process.numero_radicacion;
										const analysisReady = Boolean(analyticsByProcess[process.numero_radicacion]);

										return (
											<button
												key={process.numero_radicacion}
												type="button"
												onClick={() => handleProcessSelection(process.numero_radicacion)}
												className={`w-full rounded-lg border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
													isSelected
														? 'border-primary-500 bg-primary-50'
														: 'border-transparent hover:border-slate-200 hover:bg-slate-50'
												}`}
											>
												<p className="text-sm font-semibold text-slate-900">
													{process.numero_radicacion}
												</p>
												<p className="mt-1 text-xs text-slate-500">{process.despacho}</p>
												<div className="mt-2 flex items-center justify-between text-xs">
													<span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
														{process.tipo_proceso || 'Sin tipo'}
													</span>
													<span
														className={`font-medium ${
															analysisReady ? 'text-emerald-600' : 'text-slate-400'
														}`}
													>
														{analysisReady ? 'Analizado' : 'Pendiente'}
													</span>
												</div>
											</button>
										);
									})}
								</div>
							</div>
						</div>
					</aside>

					<section className="lg:col-span-3">
						<div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
							<div className="flex flex-col gap-2 border-b border-slate-100 px-6 py-4 md:flex-row md:items-center md:justify-between">
								<div>
									<h2 className="text-lg font-semibold text-slate-900">Actividad procesal en el tiempo</h2>
									<p className="text-xs text-slate-500">
										Línea temporal que resalta los picos de actuaciones (naranja) y los periodos de inactividad (zonas sombreadas).
									</p>
								</div>
								{selectedProcess && (
									<div className="rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold text-slate-600">
										{selectedProcess}
									</div>
								)}
							</div>

							<div className="relative h-[380px] px-4 pb-6 pt-4">
								{loadingProcess && (
									<div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-white/80 text-slate-500">
										<Loader2 className="mb-2 h-6 w-6 animate-spin" /> Analizando actuaciones...
									</div>
								)}

								{!loadingProcess && !selectedAnalytics && (
									<div className="flex h-full flex-col items-center justify-center text-sm text-slate-500">
										<ActivityIcon className="mb-3 h-9 w-9 text-slate-300" />
										Selecciona un proceso para visualizar su actividad.
									</div>
								)}

								{processError && (
									<div className="absolute inset-4 z-10 flex flex-col items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-center text-sm text-amber-700">
										<p className="mb-2 font-semibold">No se pudo obtener la información completa.</p>
										<p className="mb-4 px-4">{processError}</p>
										{selectedProcess && (
											<button
												type="button"
												onClick={() => loadProcessAnalytics(selectedProcess)}
												className="rounded-md bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700"
											>
												Reintentar
											</button>
										)}
									</div>
								)}

								{selectedAnalytics && selectedAnalytics.chartData.length > 0 && (
									<ResponsiveContainer width="100%" height="100%">
										<LineChart data={selectedAnalytics.chartData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
											<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
											  <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 12 }} interval={0} />
											<YAxis allowDecimals={false} tick={{ fill: '#475569', fontSize: 12 }} />
											<Tooltip content={<ActivityTooltipContent />} />
											{selectedAnalytics.inactiveBlocks.map(block => (
												<ReferenceArea
													key={`${block.startLabel}-${block.endLabel}`}
													x1={block.startLabel}
													x2={block.endLabel}
													fill="#e2e8f0"
													fillOpacity={0.25}
													ifOverflow="extendDomain"
												/>
											))}
																	{selectedAnalytics.chartData
																		.filter(point => point.isPeak)
																		.map(point => (
																			<ReferenceDot
																				key={`peak-${point.yearKey}`}
														x={point.label}
														y={point.count}
														r={8}
														fill="#fb923c"
														stroke="#1f2937"
														isFront
													/>
												))}
											<Line
												type="monotone"
												dataKey="count"
												stroke="#2563eb"
												strokeWidth={2}
												dot={<ActivityDot />}
												activeDot={{ r: 6 }}
											/>
										</LineChart>
									</ResponsiveContainer>
								)}
							</div>

							{selectedAnalytics && (
								<div className="grid grid-cols-1 gap-4 border-t border-slate-100 px-6 py-4 md:grid-cols-3">
									<div>
										<p className="text-xs uppercase tracking-wide text-slate-500">Pico de actividad</p>
										<p className="mt-1 text-sm font-semibold text-slate-900">
																							{selectedAnalytics.peakYearLabel
																		? `${selectedAnalytics.peakYearLabel} (${formatNumber(selectedAnalytics.peakCount)})`
												: 'Sin picos registrados'}
										</p>
									</div>
									<div>
										<p className="text-xs uppercase tracking-wide text-slate-500">Última actuación</p>
										<p className="mt-1 text-sm font-semibold text-slate-900">
											{selectedAnalytics.lastActivityLabel || 'Sin registros'}
										</p>
									</div>
									<div>
										<p className="text-xs uppercase tracking-wide text-slate-500">Mayor periodo inactivo</p>
										<p className="mt-1 text-sm font-semibold text-slate-900">
											{selectedAnalytics.longestGap
												? `${formatNumber(selectedAnalytics.longestGap.days)} días (${selectedAnalytics.longestGap.fromLabel} → ${selectedAnalytics.longestGap.toLabel})`
												: 'Sin periodos prolongados'}
										</p>
									</div>
								</div>
							)}
						</div>
					</section>
				</div>

				{globalSummary.chartData.length > 0 && (
					<section className="mt-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
						<div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
							<div>
								<h3 className="text-lg font-semibold text-slate-900">Actividad consolidada de favoritos</h3>
												<p className="text-xs text-slate-500">
													Comportamiento combinado de todos los procesos analizados. Los picos se resaltan en naranja y las columnas grises representan años sin actuaciones.
								</p>
							</div>
						</div>

						<div className="h-[280px]">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={globalSummary.chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
									<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
									  <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 12 }} interval={0} />
									<YAxis allowDecimals={false} tick={{ fill: '#475569', fontSize: 12 }} />
									<Tooltip content={<ActivityTooltipContent />} />
									<Bar dataKey="count" radius={[6, 6, 0, 0]}>
															{globalSummary.chartData.map(point => (
																<Cell
																	key={point.yearKey}
												fill={point.isPeak ? '#fb923c' : point.isInactive ? '#cbd5f5' : '#2563eb'}
											/>
										))}
									</Bar>
								</BarChart>
							</ResponsiveContainer>
						</div>
					</section>
				)}
			</main>

			<PublicFooter />
		</div>
	);
};

export default AnalyticsPage;
