import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/apiService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Notification preferences
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [processUpdates, setProcessUpdates] = useState(true);
  const [hearingReminders, setHearingReminders] = useState(true);
  const [documentAlerts, setDocumentAlerts] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const res = await authAPI.getProfile();
      if (res && res.success && res.data) {
        const profile = res.data;
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        setPhoneNumber(profile.phone_number || '');
        
        // Load notification preferences
        const prefs = profile.notification_preferences || {};
        setEmailEnabled(prefs.email_enabled !== false);
        setSmsEnabled(prefs.sms_enabled === true);
        setInAppEnabled(prefs.in_app_enabled !== false);
        setSoundEnabled(prefs.sound_enabled !== false);
        setProcessUpdates(prefs.process_updates !== false);
        setHearingReminders(prefs.hearing_reminders !== false);
        setDocumentAlerts(prefs.document_alerts !== false);
        setWeeklySummary(prefs.weekly_summary === true);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      Alert.alert('Error', 'No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    } else if (firstName.trim().length < 2) {
      newErrors.firstName = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    } else if (lastName.trim().length < 2) {
      newErrors.lastName = 'El apellido debe tener al menos 2 caracteres';
    }

    if (phoneNumber && phoneNumber.trim().length > 0) {
      // Remove spaces and dashes for validation
      const cleanPhone = phoneNumber.replace(/[\s-]/g, '');
      if (!/^\d{10,15}$/.test(cleanPhone)) {
        newErrors.phoneNumber = 'Número de teléfono inválido (10-15 dígitos)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Error de Validación', 'Por favor corrige los errores en el formulario');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phoneNumber.trim(),
        notification_preferences: {
          email_enabled: emailEnabled,
          sms_enabled: smsEnabled,
          in_app_enabled: inAppEnabled,
          sound_enabled: soundEnabled,
          process_updates: processUpdates,
          hearing_reminders: hearingReminders,
          document_alerts: documentAlerts,
          weekly_summary: weeklySummary,
        },
      };

      const res = await authAPI.updateProfile(updateData);
      if (res && res.success) {
        Alert.alert('Éxito', 'Perfil actualizado correctamente');
        setIsEditing(false);
        await loadProfile();
      } else {
        throw new Error(res?.message || 'Error al actualizar perfil');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      Alert.alert('Error', err?.message || 'No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    loadProfile();
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1f6feb" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No hay usuario autenticado</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Icon name="account-circle" size={80} color="#1f6feb" />
        <Text style={styles.userName}>{user.first_name} {user.last_name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        {user.is_active && (
          <View style={styles.badge}>
            <Icon name="check-circle" size={14} color="#16a34a" />
            <Text style={styles.badgeText}>Cuenta Activa</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          {!isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editBtn}>
              <Icon name="pencil" size={18} color="#1f6feb" />
              <Text style={styles.editBtnText}>Editar</Text>
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          <View style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={[styles.input, errors.firstName && styles.inputError]}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Ingresa tu nombre"
                placeholderTextColor="#999"
              />
              {errors.firstName && (
                <Text style={styles.errorText}>{errors.firstName}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Apellido *</Text>
              <TextInput
                style={[styles.input, errors.lastName && styles.inputError]}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Ingresa tu apellido"
                placeholderTextColor="#999"
              />
              {errors.lastName && (
                <Text style={styles.errorText}>{errors.lastName}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={[styles.input, errors.phoneNumber && styles.inputError]}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Ingresa tu teléfono"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
              {errors.phoneNumber && (
                <Text style={styles.errorText}>{errors.phoneNumber}</Text>
              )}
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary]}
                onPress={handleCancel}
                disabled={saving}
              >
                <Text style={styles.btnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.btnPrimaryText}>Guardar Cambios</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nombre:</Text>
              <Text style={styles.infoValue}>{user.first_name || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Apellido:</Text>
              <Text style={styles.infoValue}>{user.last_name || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Correo:</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Teléfono:</Text>
              <Text style={styles.infoValue}>{user.phone_number || 'No especificado'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tipo de Documento:</Text>
              <Text style={styles.infoValue}>{user.document_type || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Número de Documento:</Text>
              <Text style={styles.infoValue}>{user.document_number || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tipo de Usuario:</Text>
              <Text style={styles.infoValue}>{user.user_type || 'Usuario'}</Text>
            </View>
            {user.company_id && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ID de Empresa:</Text>
                <Text style={styles.infoValue}>{user.company_id}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferencias de Notificaciones</Text>
        {isEditing ? (
          <View style={styles.preferencesContainer}>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Notificaciones por Email</Text>
              <Switch
                value={emailEnabled}
                onValueChange={setEmailEnabled}
                trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                thumbColor={emailEnabled ? '#1f6feb' : '#f3f4f6'}
              />
            </View>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Notificaciones por SMS</Text>
              <Switch
                value={smsEnabled}
                onValueChange={setSmsEnabled}
                trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                thumbColor={smsEnabled ? '#1f6feb' : '#f3f4f6'}
              />
            </View>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Notificaciones en la App</Text>
              <Switch
                value={inAppEnabled}
                onValueChange={setInAppEnabled}
                trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                thumbColor={inAppEnabled ? '#1f6feb' : '#f3f4f6'}
              />
            </View>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Sonidos de Notificación</Text>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                thumbColor={soundEnabled ? '#1f6feb' : '#f3f4f6'}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Actualizaciones de Procesos</Text>
              <Switch
                value={processUpdates}
                onValueChange={setProcessUpdates}
                trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                thumbColor={processUpdates ? '#1f6feb' : '#f3f4f6'}
              />
            </View>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Recordatorios de Audiencias</Text>
              <Switch
                value={hearingReminders}
                onValueChange={setHearingReminders}
                trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                thumbColor={hearingReminders ? '#1f6feb' : '#f3f4f6'}
              />
            </View>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Alertas de Documentos</Text>
              <Switch
                value={documentAlerts}
                onValueChange={setDocumentAlerts}
                trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                thumbColor={documentAlerts ? '#1f6feb' : '#f3f4f6'}
              />
            </View>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Resumen Semanal</Text>
              <Switch
                value={weeklySummary}
                onValueChange={setWeeklySummary}
                trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                thumbColor={weeklySummary ? '#1f6feb' : '#f3f4f6'}
              />
            </View>
          </View>
        ) : (
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{emailEnabled ? 'Activado' : 'Desactivado'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>SMS:</Text>
              <Text style={styles.infoValue}>{smsEnabled ? 'Activado' : 'Desactivado'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>En la App:</Text>
              <Text style={styles.infoValue}>{inAppEnabled ? 'Activado' : 'Desactivado'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sonidos:</Text>
              <Text style={styles.infoValue}>{soundEnabled ? 'Activado' : 'Desactivado'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Actualizaciones de Procesos:</Text>
              <Text style={styles.infoValue}>{processUpdates ? 'Activado' : 'Desactivado'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Recordatorios de Audiencias:</Text>
              <Text style={styles.infoValue}>{hearingReminders ? 'Activado' : 'Desactivado'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Alertas de Documentos:</Text>
              <Text style={styles.infoValue}>{documentAlerts ? 'Activado' : 'Desactivado'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Resumen Semanal:</Text>
              <Text style={styles.infoValue}>{weeklySummary ? 'Activado' : 'Desactivado'}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estado de la Cuenta</Text>
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email Verificado:</Text>
            <View style={styles.statusBadge}>
              <Icon
                name={user.email_verified ? 'check-circle' : 'alert-circle'}
                size={16}
                color={user.email_verified ? '#16a34a' : '#dc2626'}
              />
              <Text style={[styles.statusText, user.email_verified ? styles.statusSuccess : styles.statusError]}>
                {user.email_verified ? 'Verificado' : 'No Verificado'}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha de Registro:</Text>
            <Text style={styles.infoValue}>{formatDate(user.created_at)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Última Actualización:</Text>
            <Text style={styles.infoValue}>{formatDate(user.updated_at)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Icon name="logout" size={20} color="#dc2626" />
          <Text style={styles.logoutBtnText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7fb',
  },
  contentContainer: {
    paddingBottom: 40,
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
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    gap: 4,
  },
  badgeText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editBtnText: {
    color: '#1f6feb',
    fontSize: 14,
    fontWeight: '600',
  },
  formContainer: {
    marginTop: 8,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 4,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: '#1f6feb',
  },
  btnSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  btnSecondaryText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  preferencesContainer: {
    marginTop: 8,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  preferenceLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusSuccess: {
    color: '#16a34a',
  },
  statusError: {
    color: '#dc2626',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  logoutBtnText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
