import apiClient from './api';
import type { FormTemplate, FormAssignment, FormField, AppointmentFormInfo, FormSubmissionResult, PagedResult } from '../types';

interface CreateFormTemplatePayload {
  name: string;
  description?: string;
  fields: Omit<FormField, 'id'>[];
}

interface AssignFormPayload {
  formTemplateId: string;
  patientId: string;
  notes?: string;
}

interface SubmitFormPayload {
  answers: { fieldId: string; value: string }[];
}

export const formsService = {
  // Admin — templates
  async createTemplate(data: CreateFormTemplatePayload): Promise<FormTemplate> {
    const response = await apiClient.post<FormTemplate>('/forms/templates', data);
    return response.data;
  },

  async getTemplates(): Promise<FormTemplate[]> {
    const response = await apiClient.get<FormTemplate[]>('/forms/templates');
    return response.data;
  },

  async deleteTemplate(templateId: string): Promise<void> {
    await apiClient.delete(`/forms/templates/${templateId}`);
  },

  // Admin — assignments
  async assignTemplate(data: AssignFormPayload): Promise<FormAssignment> {
    const response = await apiClient.post<FormAssignment>('/forms/assignments', data);
    return response.data;
  },

  async getAllAssignments(page = 1, pageSize = 20, patientId?: string): Promise<PagedResult<FormAssignment>> {
    const response = await apiClient.get<PagedResult<FormAssignment>>('/forms/assignments', {
      params: { page, pageSize, patientId },
    });
    return response.data;
  },

  // Therapist — formularios de sus pacientes asignados
  async getMyAssignments(): Promise<FormAssignment[]> {
    const response = await apiClient.get<FormAssignment[]>('/forms/assignments/my');
    return response.data;
  },

  // Therapist — per appointment (puede haber varios formularios asignados al paciente)
  async getFormsForAppointment(appointmentId: string): Promise<AppointmentFormInfo[]> {
    const response = await apiClient.get<AppointmentFormInfo[]>(`/forms/for-appointment/${appointmentId}`);
    return response.data;
  },

  async getSubmission(submissionId: string): Promise<FormSubmissionResult> {
    const response = await apiClient.get<FormSubmissionResult>(`/forms/submissions/${submissionId}`);
    return response.data;
  },

  async submitForm(
    appointmentId: string,
    assignmentId: string,
    data: SubmitFormPayload
  ): Promise<AppointmentFormInfo> {
    const response = await apiClient.post<AppointmentFormInfo>(
      `/forms/for-appointment/${appointmentId}/submit/${assignmentId}`,
      data
    );
    return response.data;
  },
};
