import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { judicialAPI, judicialPortalAPI } from '../services/apiService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';

const screenWidth = Dimensions.get('window').width;

interface ActivityData {
  year: number;
  count: number;
  processes: Set<string>;
}

interface GlobalStats {
  totalActivities: number;
  processesAnalyzed: number;
  peakYear: number;
  peakCount: number;
  averagePerYear: number;
  inactiveSegments: Array<{ start: number; end: number; duration: number }>;
}

const AnalyticsScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [activityByYear, setActivityByYear] = useState<Map<number, ActivityData>>(new Map());
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Cargar procesos favoritos
      const res = await judicialAPI.getFavoriteProcesses();
      if (!res || !res.success || !Array.isArray(res.data)) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      const favs = res.data;
      setFavorites(favs);

      // Cargar detalles de cada proceso para obtener idProceso
      const allProcessDetails: any[] = [];
      for (const fav of favs) {
        try {
          // Paso 1: Obtener idProceso del backend
          const detailRes = await judicialAPI.consultProcess(fav.numero_radicacion, false, false);
          if (detailRes && detailRes.success && detailRes.data && detailRes.data.idProceso) {
            const idProceso = detailRes.data.idProceso;
            
            // Paso 2: Obtener TODAS las actuaciones del portal usando idProceso
            const actuacionesRes = await judicialPortalAPI.getAllActuaciones(idProceso);
            if (actuacionesRes && actuacionesRes.success && actuacionesRes.data) {
              allProcessDetails.push({
                ...detailRes.data,
                actuaciones: actuacionesRes.data,
                numeroRadicacion: fav.numero_radicacion,
              });
            } else {
              // Si falla portal, usar datos del backend como fallback
              allProcessDetails.push(detailRes.data);
            }
          }
        } catch (err) {
          console.error(`Error loading process ${fav.numero_radicacion}`, err);
        }
      }

      // Procesar actuaciones
      processActivityData(allProcessDetails);
      setChartReady(true);
    } catch (err) {
      console.error('Error loading analytics', err);
      Alert.alert('Error', 'No se pudieron cargar las analíticas');
    } finally {
      setLoading(false);
    }
  };

  const processActivityData = (processes: any[]) => {
    const yearMap = new Map<number, ActivityData>();
    const currentYear = new Date().getFullYear();
    
    // Inicializar años desde 2005 hasta año actual
    for (let year = 2005; year <= currentYear; year++) {
      yearMap.set(year, {
        year,
        count: 0,
        processes: new Set<string>(),
      });
    }

    let totalActivities = 0;
    const processesAnalyzed = new Set<string>();

    // Procesar actuaciones de cada proceso
    processes.forEach(proc => {
      if (!proc || !proc.actuaciones) return;
      
      const numeroRadicacion = proc.numeroRadicacion || proc.numero_radicacion;
      if (numeroRadicacion) {
        processesAnalyzed.add(numeroRadicacion);
      }

      proc.actuaciones.forEach((act: any) => {
        if (!act.fechaActuacion) return;

        try {
          // Parsear fecha
          let date: Date | null = null;
          
          // Intentar diferentes formatos
          if (act.fechaActuacion.includes('/')) {
            // Formato dd/MM/yyyy
            date = parse(act.fechaActuacion, 'dd/MM/yyyy', new Date());
          } else if (act.fechaActuacion.includes('-')) {
            // Formato ISO
            date = new Date(act.fechaActuacion);
          }

          if (date && !isNaN(date.getTime())) {
            const year = date.getFullYear();
            if (year >= 2005 && year <= currentYear) {
              const yearData = yearMap.get(year);
              if (yearData) {
                yearData.count++;
                if (numeroRadicacion) {
                  yearData.processes.add(numeroRadicacion);
                }
                totalActivities++;
              }
            }
          }
        } catch (err) {
          console.error('Error parsing date', act.fechaActuacion, err);
        }
      });
    });

    setActivityByYear(yearMap);

    // Calcular estadísticas globales
    const yearDataArray = Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
    
    // Encontrar año pico
    let peakYear = yearDataArray[0].year;
    let peakCount = yearDataArray[0].count;
    yearDataArray.forEach(yd => {
      if (yd.count > peakCount) {
        peakCount = yd.count;
        peakYear = yd.year;
      }
    });

    // Calcular promedio
    const yearsWithActivity = yearDataArray.filter(yd => yd.count > 0).length;
    const averagePerYear = yearsWithActivity > 0 ? totalActivities / yearsWithActivity : 0;

    // Detectar periodos inactivos (años consecutivos sin actividad)
    const inactiveSegments: Array<{ start: number; end: number; duration: number }> = [];
    let inactiveStart: number | null = null;
    
    yearDataArray.forEach((yd, idx) => {
      if (yd.count === 0) {
        if (inactiveStart === null) {
          inactiveStart = yd.year;
        }
      } else {
        if (inactiveStart !== null) {
          const inactiveEnd = yearDataArray[idx - 1].year;
          const duration = inactiveEnd - inactiveStart + 1;
          if (duration >= 2) { // Solo reportar si son al menos 2 años
            inactiveSegments.push({
              start: inactiveStart,
              end: inactiveEnd,
              duration,
            });
          }
          inactiveStart = null;
        }
      }
    });

    setGlobalStats({
      totalActivities,
      processesAnalyzed: processesAnalyzed.size,
      peakYear,
      peakCount,
      averagePerYear,
      inactiveSegments,
    });
  };

  const getChartData = () => {
    const yearDataArray = Array.from(activityByYear.values()).sort((a, b) => a.year - b.year);
    
    // Filtrar años con actividad o años recientes
    const currentYear = new Date().getFullYear();
    const filteredData = yearDataArray.filter(yd => yd.count > 0 || yd.year >= currentYear - 5);

    return {
      labels: filteredData.map(yd => yd.year.toString()),
      datasets: [
        {
          data: filteredData.map(yd => yd.count),
        },
      ],
    };
  };

  const getBarChartData = () => {
    const yearDataArray = Array.from(activityByYear.values()).sort((a, b) => a.year - b.year);
    
    // Agrupar por décadas
    const decadeMap = new Map<string, number>();
    yearDataArray.forEach(yd => {
      const decade = `${Math.floor(yd.year / 10) * 10}s`;
      decadeMap.set(decade, (decadeMap.get(decade) || 0) + yd.count);
    });

    const labels = Array.from(decadeMap.keys());
    const data = Array.from(decadeMap.values());

    return {
      labels,
      datasets: [
        {
          data,
        },
      ],
    };
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#f6f7fb',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(31, 111, 235, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#1f6feb',
    },
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analíticas</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1f6feb" />
          <Text style={styles.loadingText}>Cargando analíticas...</Text>
        </View>
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analíticas</Text>
        </View>
        <View style={styles.centered}>
          <Icon name="chart-line" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No hay datos para analizar</Text>
          <Text style={styles.emptySubtitle}>
            Agrega procesos a favoritos para ver analíticas
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analíticas de Procesos</Text>
        <TouchableOpacity onPress={loadAnalytics} style={styles.refreshBtn}>
          <Icon name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Estadísticas globales */}
        {globalStats && (
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Resumen Global</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Icon name="file-document-multiple" size={32} color="#1f6feb" />
                <Text style={styles.statValue}>{globalStats.totalActivities}</Text>
                <Text style={styles.statLabel}>Total Actuaciones</Text>
              </View>

              <View style={styles.statCard}>
                <Icon name="folder-open" size={32} color="#16a34a" />
                <Text style={styles.statValue}>{globalStats.processesAnalyzed}</Text>
                <Text style={styles.statLabel}>Procesos Analizados</Text>
              </View>

              <View style={styles.statCard}>
                <Icon name="trophy" size={32} color="#f59e0b" />
                <Text style={styles.statValue}>{globalStats.peakYear}</Text>
                <Text style={styles.statLabel}>Año Pico</Text>
                <Text style={styles.statSubLabel}>({globalStats.peakCount} actuaciones)</Text>
              </View>

              <View style={styles.statCard}>
                <Icon name="chart-timeline-variant" size={32} color="#8b5cf6" />
                <Text style={styles.statValue}>{globalStats.averagePerYear.toFixed(0)}</Text>
                <Text style={styles.statLabel}>Promedio/Año</Text>
              </View>
            </View>

            {globalStats.inactiveSegments.length > 0 && (
              <View style={styles.inactiveSection}>
                <Text style={styles.inactiveTitle}>
                  <Icon name="alert-circle" size={16} color="#dc2626" /> Periodos Inactivos
                </Text>
                {globalStats.inactiveSegments.map((seg, idx) => (
                  <Text key={idx} style={styles.inactiveText}>
                    {seg.start} - {seg.end} ({seg.duration} años)
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Gráfica de línea: Frecuencia de actividad por año */}
        {chartReady && activityByYear.size > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Frecuencia de Actividad por Año</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={getChartData()}
                width={Math.max(screenWidth - 40, getChartData().labels.length * 50)}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withInnerLines={false}
                withOuterLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
              />
            </ScrollView>
          </View>
        )}

        {/* Gráfica de barras: Vista consolidada por década */}
        {chartReady && activityByYear.size > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Vista Consolidada por Década</Text>
            <BarChart
              data={getBarChartData()}
              width={screenWidth - 40}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars
              withInnerLines={false}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7fb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f6feb',
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  refreshBtn: {
    padding: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  statsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f6f7fb',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  statSubLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  inactiveSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#dc2626',
  },
  inactiveTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 8,
  },
  inactiveText: {
    fontSize: 13,
    color: '#991b1b',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default AnalyticsScreen;
