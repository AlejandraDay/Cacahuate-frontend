export type UserRole = 'Admin' | 'Therapist' | 'Parent';

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface NameLookup {
  id: string;
  name: string;
}

export interface TherapistPatientSummary {
  id: string;
  name: string;
  dateOfBirth: string;
  parentName?: string;
  totalAppointments: number;
  completedAppointments: number;
  lastAppointmentDate?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  email: string;
  fullName: string;
  role: UserRole;
  expiresAt: string;
  refreshTokenExpiresAt: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface TherapistAvailability {
  id: string;
  therapistId: string;
  therapistName?: string;
  date: string;
  startTime: string;
  endTime: string;
  sessionDurationMinutes: number;
  slots?: TimeSlot[];
  availableSlots?: TimeSlot[];
}

export interface Therapist {
  id: string;
  fullName: string;
  bio?: string;
  sessionDurationMinutes: number;
  isActive?: boolean;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  notes?: string;
  parentName?: string;
}

export interface Notification {
  id: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  appointmentId?: string
}

// El backend serializa el enum ParticipationLevel como número: 0=Low, 1=Medium, 2=High
export interface ProgressData {
  progressNotes?: string;
  objectives?: string;
  behavior?: string;
  communication?: string;
  socialInteraction?: string;
  sensoryResponse?: string;
  achievements?: string;
  areasToReinforce?: string;
  recommendations?: string;
  participationLevel?: number;
}

export interface Appointment {
  id: string;
  therapistId: string;
  therapistName?: string;
  patientId: string;
  patientName?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | 'EnRoute' | 'InProgress';
  notes?: string;
  progressNotes?: string;
  progressObjectives?: string;
  progressBehavior?: string;
  progressCommunication?: string;
  progressSocialInteraction?: string;
  progressSensoryResponse?: string;
  progressAchievements?: string;
  progressAreasToReinforce?: string;
  progressRecommendations?: string;
  progressParticipationLevel?: number;
  progressUpdatedAt?: string;
  enRouteAt?: string;
  inProgressAt?: string;
  parentSignature?: string;
  parentSignedAt?: string;
  therapistSignature?: string;
  therapistSignedAt?: string;
  isRated?: boolean;
  ratingStars?: number;
  formSubmissionIds?: string[];
  createdAt?: string;
}

// FieldType enum numeric mapping: 0=Text,1=Textarea,2=Number,3=Select,4=Checkbox,5=Scale
export type FieldType = 0 | 1 | 2 | 3 | 4 | 5;
export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  0: 'Texto corto',
  1: 'Texto largo',
  2: 'Número',
  3: 'Selección',
  4: 'Sí / No',
  5: 'Escala (1-10)',
};

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
  isRequired: boolean;
  order: number;
}

export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  fields: FormField[];
}

export interface FormAnswer {
  fieldId: string;
  fieldLabel: string;
  fieldType: FieldType;
  value: string;
}

export interface FormSubmissionResult {
  id: string;
  appointmentId: string;
  therapistName: string;
  submittedAt: string;
  answers: FormAnswer[];
}

export interface FormAssignment {
  id: string;
  formTemplateId: string;
  formTemplateName: string;
  formTemplateDescription?: string;
  patientId: string;
  patientName: string;
  notes?: string;
  assignedAt: string;
  fields: FormField[];
  submissions: FormSubmissionResult[];
}

export interface AppointmentFormInfo {
  assignmentId: string;
  formTemplateName: string;
  formTemplateDescription?: string;
  notes?: string;
  fields: FormField[];
  isSubmitted: boolean;
  submission?: FormSubmissionResult;
}

export interface TherapistRating {
  id: string;
  appointmentId: string;
  therapistId: string;
  therapistName: string;
  parentId: string;
  parentName: string;
  stars: number;
  comment?: string;
  createdAt: string;
}

export interface RatingsPagedResult extends PagedResult<TherapistRating> {
  averageStars?: number;
}
