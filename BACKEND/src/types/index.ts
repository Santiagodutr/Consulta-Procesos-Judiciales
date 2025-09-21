export enum UserType {
  NATURAL = 'natural',
  JURIDICAL = 'juridical', 
  COMPANY = 'company'
}

export enum ProcessStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CLOSED = 'closed',
  ARCHIVED = 'archived'
}

export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app',
  SOUND = 'sound'
}

export enum ActivityType {
  HEARING = 'hearing',
  RESOLUTION = 'resolution',
  NOTIFICATION = 'notification',
  DOCUMENT = 'document',
  APPEAL = 'appeal',
  OTHER = 'other'
}

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  first_name: string;
  last_name: string;
  document_number: string;
  document_type: string;
  user_type: UserType;
  phone_number?: string;
  company_id?: string;
  is_active: boolean;
  email_verified: boolean;
  notification_preferences: NotificationPreferences;
  created_at: Date;
  updated_at: Date;
}

export interface Company {
  id: string;
  name: string;
  nit: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface JudicialProcess {
  id: string;
  process_number: string;
  court_name: string;
  process_type: string;
  subject_matter: string;
  plaintiff: string;
  defendant: string;
  status: ProcessStatus;
  start_date: Date;
  last_update: Date;
  next_hearing_date?: Date;
  case_summary?: string;
  portal_url: string;
  is_monitored: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserProcess {
  id: string;
  user_id: string;
  process_id: string;
  role: string; // plaintiff, defendant, lawyer, observer
  is_shared: boolean;
  can_edit: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProcessActivity {
  id: string;
  process_id: string;
  activity_type: ActivityType;
  title: string;
  description: string;
  activity_date: Date;
  document_url?: string;
  is_new: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProcessDocument {
  id: string;
  process_id: string;
  document_name: string;
  document_type: string;
  file_url: string;
  file_size: number;
  uploaded_by: string;
  is_downloaded: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ConsultationHistory {
  id: string;
  user_id: string;
  process_id: string;
  consultation_type: string;
  ip_address?: string;
  user_agent?: string;
  result_status: string;
  error_message?: string;
  created_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  process_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  sent_at?: Date;
  read_at?: Date;
  created_at: Date;
}

export interface NotificationPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  sound_enabled: boolean;
  process_updates: boolean;
  hearing_reminders: boolean;
  document_alerts: boolean;
  weekly_summary: boolean;
}

export interface ScrapingJob {
  id: string;
  process_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  portal_name: string;
  started_at?: Date;
  completed_at?: Date;
  error_message?: string;
  retry_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface ProcessStatistics {
  total_processes: number;
  active_processes: number;
  recent_updates: number;
  upcoming_hearings: number;
  activity_by_month: Array<{
    month: string;
    count: number;
  }>;
  process_types: Array<{
    type: string;
    count: number;
  }>;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
    borderWidth?: number;
  }>;
}