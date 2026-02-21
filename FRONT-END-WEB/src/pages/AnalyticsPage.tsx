import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { useTour } from '../hooks/useTour.ts';
import { HelpButton } from '../components/HelpButton.tsx';
import { analyticsTourSteps } from '../tours/analyticsTour.ts';
import { Header } from '../components/Header.tsx';
import {
	Activity as ActivityIcon,
	BarChart3,
	CalendarClock,
	Loader2,
	TrendingUp,
	FileDown,
	User,
	LogOut,
	Bell,
	Search,
	ChevronRight,
	ArrowLeft,
	Star,
	Gavel
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
		<div className="rounded-xl border border-accent-500/20 bg-primary-900 px-4 py-3 shadow-2xl animate-fade-in">
			<p className="text-xs font-bold text-accent-400 uppercase tracking-widest mb-1">{point.label}</p>
			<div className="flex items-center gap-2">
				<p className="text-sm font-bold text-white">
					Actuaciones: <span className="text-accent-500">{point.count}</span>
				</p>
			</div>
			{point.isPeak && (
				<div className="mt-2 flex items-center gap-1">
					<span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse"></span>
					<p className="text-[10px] font-bold text-accent-500 uppercase">Pico de actividad</p>
				</div>
			)}
			{point.isInactive && <p className="mt-2 text-[10px] font-medium text-gray-400 uppercase">Periodo inactivo</p>}
		</div>
	);
};

const ActivityDot = (props: any) => {
	const { cx, cy, payload } = props;
	if (payload.isPeak) {
		return <circle cx={cx} cy={cy} r={6} fill="#EAB308" stroke="#0F1E33" strokeWidth={2} />;
	}
	if (payload.count === 0) {
		return <circle cx={cx} cy={cy} r={4} fill="#1e293b" stroke="#334155" strokeWidth={1} />;
	}
	return <circle cx={cx} cy={cy} r={4} fill="#EAB308" stroke="#0F1E33" strokeWidth={1.5} />;
};

const formatNumber = (value: number) => new Intl.NumberFormat('es-CO').format(value);

const AnalyticsPage: React.FC = () => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const { startTour, hasCompletedTour } = useTour(analyticsTourSteps, 'analytics');

	const [favoriteProcesses, setFavoriteProcesses] = useState<FavoriteProcess[]>([]);
	const [selectedProcess, setSelectedProcess] = useState<string | null>(null);
	const [analyticsByProcess, setAnalyticsByProcess] = useState<Record<string, ActivityAnalytics>>({});
	const [loadingFavorites, setLoadingFavorites] = useState(true);
	const [loadingProcess, setLoadingProcess] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [processError, setProcessError] = useState<string | null>(null);
	const [exporting, setExporting] = useState(false);
	const exportContentRef = useRef<HTMLElement | null>(null);

	const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Usuario';

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


	return (
		<div className="min-h-screen bg-gray-50 flex flex-col font-sans">
			<Header title="Reportes Transaccionales" />

			<main
				ref={exportContentRef}
				className="flex-1 mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8"
			>
				<div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between animate-fade-in" data-tour="analytics-header">
					<div className="max-w-3xl">
						<div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-500/10 border border-accent-500/20 rounded-full mb-4 text-accent-600">
							<span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse"></span>
							<span className="text-[10px] font-bold uppercase tracking-[0.2em]">Inteligencia Judicial</span>
						</div>
						<h1 className="text-4xl font-serif font-bold text-primary-900 leading-tight">Analítica de Procesos Favoritos</h1>
						<p className="mt-3 text-lg text-gray-500 max-w-2xl">
							Explora la frecuencia de actuaciones judiciales, identifica picos de actividad y detecta periodos de inactividad con precisión estadística.
						</p>
					</div>
					<button
						type="button"
						onClick={handleExportPdf}
						disabled={exporting || loadingProcess || loadingFavorites}
						data-html2canvas-ignore="true"
						data-tour="export-pdf-btn"
						className="inline-flex items-center justify-center gap-3 rounded-xl bg-primary-900 px-6 py-3.5 text-sm font-bold text-white shadow-xl hover:bg-primary-800 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed group shadow-primary-900/20"
					>
						{exporting ? (
							<>
								<Loader2 className="h-5 w-5 animate-spin" />
								<span>Generando Reporte...</span>
							</>
						) : (
							<>
								<FileDown className="h-5 w-5 text-accent-500" />
								<span>Exportar Análisis PDF</span>
							</>
						)}
					</button>
				</div>

				<section className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" data-tour="summary-cards">
					<div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ring-1 ring-gray-100/50 hover:shadow-xl transition-all duration-300 animate-scale-in">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Procesos favoritos</p>
								<p className="text-3xl font-bold text-primary-900">
									{loadingFavorites ? '—' : formatNumber(favoriteProcesses.length)}
								</p>
							</div>
							<div className="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-900 group-hover:bg-primary-900 group-hover:text-white transition-colors">
								<Star className="h-6 w-6" />
							</div>
						</div>
					</div>

					<div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ring-1 ring-gray-100/50 hover:shadow-xl transition-all duration-300 animate-scale-in" style={{ animationDelay: '100ms' }}>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Procesos analizados</p>
								<p className="text-3xl font-bold text-primary-900">
									{formatNumber(globalSummary.processesAnalyzed)}
								</p>
							</div>
							<div className="h-12 w-12 rounded-xl bg-accent-50 flex items-center justify-center text-accent-600 group-hover:bg-accent-500 group-hover:text-primary-900 transition-colors">
								<ActivityIcon className="h-6 w-6" />
							</div>
						</div>
					</div>

					<div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ring-1 ring-gray-100/50 hover:shadow-xl transition-all duration-300 animate-scale-in" style={{ animationDelay: '200ms' }}>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Actuaciones registradas</p>
								<p className="text-3xl font-bold text-primary-900">
									{formatNumber(globalSummary.totalActivities)}
								</p>
								{globalSummary.peakLabel && (
									<div className="mt-2 flex items-center gap-1.5 px-2 py-0.5 bg-accent-50 rounded-full w-fit">
										<TrendingUp className="w-3 h-3 text-accent-600" />
										<span className="text-[10px] font-bold text-accent-600 tracking-tight">Pico: {globalSummary.peakLabel}</span>
									</div>
								)}
							</div>
							<div className="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-900 group-hover:bg-primary-900 group-hover:text-white transition-colors">
								<BarChart3 className="h-6 w-6" />
							</div>
						</div>
					</div>

					<div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ring-1 ring-gray-100/50 hover:shadow-xl transition-all duration-300 animate-scale-in" style={{ animationDelay: '300ms' }}>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Periodos inactivos</p>
								<p className="text-3xl font-bold text-primary-900">
									{formatNumber(globalSummary.inactiveSegments)}
								</p>
								{selectedAnalytics?.longestGap && (
									<div className="mt-2 flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded-full w-fit">
										<CalendarClock className="w-3 h-3 text-gray-500" />
										<span className="text-[10px] font-bold text-gray-500 tracking-tight">{selectedAnalytics.longestGap.days} días</span>
									</div>
								)}
							</div>
							<div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-gray-100 transition-colors">
								<CalendarClock className="h-6 w-6" />
							</div>
						</div>
					</div>
				</section>

				{error && (
					<div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
						{error}
					</div>
				)}

				<div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
					<aside className="space-y-6 lg:col-span-1" data-tour="process-list">
						<div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 ring-1 ring-gray-100/50">
							<div className="bg-primary-900 px-6 py-5">
								<h2 className="text-lg font-serif font-bold text-white mb-1">Portafolio</h2>
								<p className="text-[10px] font-bold text-accent-500 uppercase tracking-widest">Favoritos analizados</p>
							</div>

							<div className="max-h-[520px] overflow-y-auto px-1.5 py-4 scrollbar-thin scrollbar-thumb-accent-500/20">
								{loadingFavorites && (
									<div className="flex flex-col items-center justify-center py-16 text-gray-400 space-y-4">
										<Loader2 className="h-8 w-8 animate-spin text-accent-500" />
										<span className="text-[10px] font-bold uppercase">Sincronizando...</span>
									</div>
								)}

								{!loadingFavorites && favoriteProcesses.length === 0 && (
									<div className="flex flex-col items-center justify-center py-16 text-center text-sm text-gray-400 px-4">
										<Gavel className="mb-4 h-10 w-10 opacity-20" />
										<p className="font-medium">No tiene procesos registrados para análisis.</p>
										<Link to="/consulta" className="mt-4 text-accent-600 font-bold uppercase tracking-wider text-xs">Añadir Proceso</Link>
									</div>
								)}

								<div className="space-y-1.5 px-2">
									{favoriteProcesses.map(process => {
										const isSelected = selectedProcess === process.numero_radicacion;
										const analysisReady = Boolean(analyticsByProcess[process.numero_radicacion]);

										return (
											<button
												key={process.numero_radicacion}
												type="button"
												onClick={() => handleProcessSelection(process.numero_radicacion)}
												className={`w-full group rounded-2xl p-4 text-left transition-all duration-300 border-2 ${isSelected
													? 'bg-primary-50 border-accent-500 shadow-md transform scale-[1.02]'
													: 'bg-white border-transparent hover:border-gray-100 hover:bg-gray-50'
													}`}
											>
												<p className={`text-sm font-bold font-mono tracking-tight transition-colors ${isSelected ? 'text-primary-900' : 'text-gray-600'}`}>
													{process.numero_radicacion}
												</p>
												<p className="mt-1 text-[10px] font-medium text-gray-400 truncate uppercase tracking-tight">{process.despacho}</p>
												<div className="mt-3 flex items-center justify-between">
													<span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-colors ${isSelected ? 'bg-primary-900 text-accent-400' : 'bg-gray-100 text-gray-500'}`}>
														{process.tipo_proceso || 'CIVIL'}
													</span>
													<div className="flex items-center gap-1.5">
														{analysisReady && <div className="w-1.5 h-1.5 rounded-full bg-accent-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></div>}
														<span className={`text-[9px] font-bold uppercase tracking-wider ${analysisReady ? 'text-accent-600' : 'text-gray-300'}`}>
															{analysisReady ? 'Listo' : 'Pendiente'}
														</span>
													</div>
												</div>
											</button>
										);
									})}
								</div>
							</div>
						</div>
					</aside>

					<section className="lg:col-span-3" data-tour="timeline-chart">
						<div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden ring-1 ring-gray-100/50">
							<div className="flex flex-col gap-4 bg-gray-50/50 border-b border-gray-100 px-8 py-6 md:flex-row md:items-center md:justify-between">
								<div>
									<div className="flex items-center gap-2 mb-1">
										<h2 className="text-xl font-serif font-bold text-primary-900">Actividad Procesal Dinámica</h2>
										{selectedProcess && (
											<div className="px-3 py-0.5 rounded-full bg-accent-500 text-primary-900 text-[10px] font-bold font-mono shadow-sm">
												{selectedProcess}
											</div>
										)}
									</div>
									<p className="text-xs text-gray-500 font-medium">
										Cronograma técnico con detección de hitos críticos y periodos de latencia.
									</p>
								</div>
							</div>

							<div className="relative h-[420px] px-6 pb-8 pt-8">
								{loadingProcess && (
									<div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-white/90 text-primary-900 backdrop-blur-sm animate-fade-in">
										<Loader2 className="mb-4 h-10 w-10 animate-spin text-accent-500" />
										<span className="text-[10px] font-bold uppercase tracking-[0.2em]">Analizando Actuaciones...</span>
									</div>
								)}

								{!loadingProcess && !selectedAnalytics && (
									<div className="flex h-full flex-col items-center justify-center text-center px-10">
										<div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
											<BarChart3 className="h-10 w-10 text-gray-300" />
										</div>
										<h4 className="text-lg font-bold text-primary-900 mb-2">Selección Requerida</h4>
										<p className="text-sm text-gray-400 max-w-xs">Especifique un proceso del portafolio lateral para desplegar los indicadores analíticos.</p>
									</div>
								)}

								{processError && (
									<div className="absolute inset-8 z-10 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-accent-200 bg-accent-50 p-10 text-center animate-scale-in">
										<div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
											<Search className="w-8 h-8 text-accent-500" />
										</div>
										<p className="mb-2 font-bold text-primary-900">Anomalía en la Sincronización</p>
										<p className="mb-8 text-xs text-primary-900/70 px-4 leading-relaxed">{processError}</p>
										{selectedProcess && (
											<button
												type="button"
												onClick={() => loadProcessAnalytics(selectedProcess)}
												className="px-8 py-3 bg-primary-900 text-white text-xs font-bold rounded-xl hover:bg-primary-800 shadow-lg shadow-primary-900/20 transition-all active:scale-95"
											>
												REINTENTAR ANÁLISIS
											</button>
										)}
									</div>
								)}

								{selectedAnalytics && selectedAnalytics.chartData.length > 0 && (
									<ResponsiveContainer width="100%" height="100%">
										<LineChart data={selectedAnalytics.chartData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
											<CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
											<XAxis
												dataKey="label"
												tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
												axisLine={{ stroke: '#f1f5f9' }}
												tickLine={false}
												interval={0}
											/>
											<YAxis
												allowDecimals={false}
												tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
												axisLine={false}
												tickLine={false}
											/>
											<Tooltip content={<ActivityTooltipContent />} cursor={{ stroke: '#EAB308', strokeWidth: 1 }} />
											{selectedAnalytics.inactiveBlocks.map(block => (
												<ReferenceArea
													key={`${block.startLabel}-${block.endLabel}`}
													x1={block.startLabel}
													x2={block.endLabel}
													fill="#f8fafc"
													fillOpacity={0.8}
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
														fill="#EAB308"
														stroke="#0F1E33"
														isFront
													/>
												))}
											<Line
												type="monotone"
												dataKey="count"
												stroke="#0F1E33"
												strokeWidth={3}
												dot={<ActivityDot />}
												activeDot={{ r: 8, fill: '#EAB308', stroke: '#0F1E33', strokeWidth: 2 }}
												animationDuration={1500}
											/>
										</LineChart>
									</ResponsiveContainer>
								)}
							</div>

							{selectedAnalytics && (
								<div className="grid grid-cols-1 gap-6 bg-gray-50/50 border-t border-gray-100 px-8 py-6 md:grid-cols-3 animate-fade-in" data-tour="activity-details">
									<div>
										<p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Pico de actividad</p>
										<p className="text-base font-bold text-primary-900">
											{selectedAnalytics.peakYearLabel
												? `${selectedAnalytics.peakYearLabel} (${formatNumber(selectedAnalytics.peakCount)} actuaciones)`
												: 'Sin registros'}
										</p>
									</div>
									<div>
										<p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Última actuación</p>
										<p className="text-base font-bold text-primary-900">
											{selectedAnalytics.lastActivityLabel || 'N/A'}
										</p>
									</div>
									<div className="group">
										<p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Mayor latencia</p>
										<p className="text-base font-bold text-accent-600">
											{selectedAnalytics.longestGap
												? `${formatNumber(selectedAnalytics.longestGap.days)} días inactivo`
												: 'Actividad continua'}
										</p>
										{selectedAnalytics.longestGap && (
											<p className="text-[10px] text-gray-400 mt-1 font-medium">{selectedAnalytics.longestGap.fromLabel} → {selectedAnalytics.longestGap.toLabel}</p>
										)}
									</div>
								</div>
							)}
						</div>
					</section>
				</div>

				{globalSummary.chartData.length > 0 && (
					<section className="mt-12 group" data-tour="consolidated-chart">
						<div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden ring-1 ring-gray-100/50">
							<div className="bg-primary-900 px-8 py-6 border-b border-primary-800">
								<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
									<div>
										<h3 className="text-xl font-serif font-bold text-white">Consolidado de Actividad Proporcional</h3>
										<p className="text-xs text-accent-500 font-bold uppercase tracking-widest mt-1">
											Visión global de la carga procesal acumulada
										</p>
									</div>
								</div>
							</div>

							<div className="h-[320px] px-8 py-8">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={globalSummary.chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
										<CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
										<XAxis
											dataKey="label"
											tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
											axisLine={false}
											tickLine={false}
											interval={0}
										/>
										<YAxis
											allowDecimals={false}
											tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
											axisLine={false}
											tickLine={false}
										/>
										<Tooltip content={<ActivityTooltipContent />} cursor={{ fill: 'rgba(234, 179, 8, 0.05)' }} />
										<Bar dataKey="count" radius={[4, 4, 0, 0]} animationDuration={2000}>
											{globalSummary.chartData.map(point => (
												<Cell
													key={point.yearKey}
													fill={point.isPeak ? '#EAB308' : point.isInactive ? '#f1f5f9' : '#0F1E33'}
													className="hover:opacity-80 transition-opacity"
												/>
											))}
										</Bar>
									</BarChart>
								</ResponsiveContainer>
							</div>
						</div>
					</section>
				)}
			</main>

			<HelpButton onClick={startTour} showNotification={!hasCompletedTour} position="bottom-left" />
			<PublicFooter />
		</div>
	);
};

export default AnalyticsPage;
