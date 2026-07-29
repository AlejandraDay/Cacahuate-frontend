import apiClient from './api';
import type { Therapist, TherapistAvailability, Appointment, Patient, TherapistRating, ProgressData, PagedResult, NameLookup, TherapistPatientSummary, RatingsPagedResult } from '../types';

export interface AppointmentFilters {
  page?: number;
  pageSize?: number;
  patientId?: string;
  therapistId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const schedulingService = {
  // Terapeutas
  async getTherapists(): Promise<Therapist[]> {
    const response = await apiClient.get<Therapist[]>('/therapist');
    return response.data;
  },

  // Disponibilidad
  async createAvailability(data: {
    date: string;
    startTime: string;
    endTime: string;
    sessionDurationMinutes: number;
  }): Promise<TherapistAvailability> {
    const response = await apiClient.post<TherapistAvailability>(
      '/scheduling/availability',
      data
    );
    return response.data;
  },

  async getTherapistAvailability(therapistId: string): Promise<TherapistAvailability[]> {
    const response = await apiClient.get<TherapistAvailability[]>(
      `/scheduling/therapists/${therapistId}/availability`
    );
    return response.data;
  },

  async getMyAvailability(): Promise<TherapistAvailability[]> {
    const response = await apiClient.get<TherapistAvailability[]>('/scheduling/availability');
    return response.data;
  },

  async deleteAvailability(availabilityId: string): Promise<void> {
    await apiClient.delete(`/scheduling/availability/${availabilityId}`);
  },

  // Citas – Parent
  async bookAppointment(data: {
    therapistId: string;
    patientId: string;
    date: string;
    startTime: string;
  }): Promise<Appointment> {
    const response = await apiClient.post<Appointment>('/scheduling/appointments', data);
    return response.data;
  },

  async getMyAppointments(): Promise<Appointment[]> {
    const response = await apiClient.get<Appointment[]>('/scheduling/appointments/my');
    return response.data;
  },

  // Citas – Therapist
  async getTherapistAppointments(): Promise<Appointment[]> {
    const response = await apiClient.get<Appointment[]>('/scheduling/appointments/therapist');
    return response.data;
  },

  async cancelAppointment(appointmentId: string): Promise<void> {
    await apiClient.patch(`/scheduling/appointments/${appointmentId}/cancel`);
  },

  async markEnRoute(appointmentId: string): Promise<Appointment> {
    const response = await apiClient.patch<Appointment>(
      `/scheduling/appointments/${appointmentId}/enroute`
    );
    return response.data;
  },

  async markInProgress(appointmentId: string): Promise<Appointment> {
    const response = await apiClient.patch<Appointment>(
      `/scheduling/appointments/${appointmentId}/inprogress`
    );
    return response.data;
  },

  async completeAppointment(appointmentId: string): Promise<void> {
    await apiClient.patch(`/scheduling/appointments/${appointmentId}/complete`);
  },

  async confirmAppointment(appointmentId: string): Promise<void> {
    await apiClient.patch(`/scheduling/appointments/${appointmentId}/confirm`);
  },

  async rejectAppointment(appointmentId: string): Promise<void> {
    await apiClient.patch(`/scheduling/appointments/${appointmentId}/reject`);
  },

  // Admin
  async getAllPendingAppointments(): Promise<Appointment[]> {
    const response = await apiClient.get<Appointment[]>('/scheduling/appointments/admin/pending');
    return response.data;
  },

  async getAllAppointments(filters: AppointmentFilters = {}): Promise<PagedResult<Appointment>> {
    const response = await apiClient.get<PagedResult<Appointment>>('/scheduling/appointments/admin/all', {
      params: { page: 1, pageSize: 20, ...filters },
    });
    return response.data;
  },

  async getTherapistsForPatient(patientId: string): Promise<NameLookup[]> {
    const response = await apiClient.get<NameLookup[]>(`/scheduling/appointments/patient/${patientId}/therapists`);
    return response.data;
  },

  async getPatientsForTherapist(therapistId: string): Promise<NameLookup[]> {
    const response = await apiClient.get<NameLookup[]>(`/scheduling/appointments/therapist/${therapistId}/patients`);
    return response.data;
  },

  async getPatientSummariesForTherapist(therapistId: string, page = 1, pageSize = 12): Promise<PagedResult<TherapistPatientSummary>> {
    const response = await apiClient.get<PagedResult<TherapistPatientSummary>>(
      `/scheduling/appointments/therapist/${therapistId}/patients/summary`,
      { params: { page, pageSize } }
    );
    return response.data;
  },

  // Pacientes
  async createPatient(data: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  }): Promise<Patient> {
    const response = await apiClient.post<Patient>('/scheduling/patients', data);
    return response.data;
  },

  async getMyPatients(): Promise<Patient[]> {
    const response = await apiClient.get<Patient[]>('/scheduling/patients/my');
    return response.data;
  },

  async getAllPatients(page = 1, pageSize = 20, search?: string): Promise<PagedResult<Patient>> {
    const response = await apiClient.get<PagedResult<Patient>>('/scheduling/patients/all', {
      params: { page, pageSize, search },
    });
    return response.data;
  },

  async getPatientsLookup(): Promise<Patient[]> {
    const response = await apiClient.get<Patient[]>('/scheduling/patients/lookup');
    return response.data;
  },

  async getPatientById(patientId: string): Promise<Patient> {
    const response = await apiClient.get<Patient>(`/scheduling/patients/${patientId}`);
    return response.data;
  },

  // Progreso – Therapist
  async addProgressNotes(appointmentId: string, data: ProgressData): Promise<Appointment> {
    const response = await apiClient.patch<Appointment>(
      `/scheduling/appointments/${appointmentId}/progress`,
      data
    );
    return response.data;
  },

  // Calificaciones
  async rateTherapist(
    appointmentId: string,
    data: { stars: number; comment?: string }
  ): Promise<TherapistRating> {
    const response = await apiClient.post<TherapistRating>(
      `/scheduling/appointments/${appointmentId}/rate`,
      data
    );
    return response.data;
  },

  async getTherapistRatings(therapistId: string): Promise<TherapistRating[]> {
    const response = await apiClient.get<TherapistRating[]>(
      `/scheduling/therapists/${therapistId}/ratings`
    );
    return response.data;
  },

  async getTherapistRatingsPaged(therapistId: string, page = 1, pageSize = 20): Promise<RatingsPagedResult> {
    const response = await apiClient.get<RatingsPagedResult>(
      `/scheduling/therapists/${therapistId}/ratings/paged`,
      { params: { page, pageSize } }
    );
    return response.data;
  },

  async getMyRatings(): Promise<TherapistRating[]> {
    const response = await apiClient.get<TherapistRating[]>('/scheduling/ratings/my');
    return response.data;
  },

  async signAppointment(appointmentId: string, signature: string): Promise<Appointment> {
    const response = await apiClient.post<Appointment>(
      `/scheduling/appointments/${appointmentId}/sign`,
      { signature }
    );
    return response.data;
  },
};
