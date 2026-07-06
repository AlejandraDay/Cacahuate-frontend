import apiClient from './api';
import type { Therapist, TherapistAvailability, Appointment, Patient, TherapistRating, ProgressData } from '../types';

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

  async getAllAppointments(): Promise<Appointment[]> {
    const response = await apiClient.get<Appointment[]>('/scheduling/appointments/admin/all');
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

  async getAllPatients(): Promise<Patient[]> {
    const response = await apiClient.get<Patient[]>('/scheduling/patients/all');
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

  async getMyRatings(): Promise<TherapistRating[]> {
    const response = await apiClient.get<TherapistRating[]>('/scheduling/ratings/my');
    return response.data;
  },
};
