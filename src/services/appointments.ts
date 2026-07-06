import apiClient from './api'

const appointmentService = {
  async getMyAppointments() {
    const response = await apiClient.get('/appointments/my-appointments')
    return response.data
  },

  async getAppointment(id: string) {
    const response = await apiClient.get(`/appointments/${id}`)
    return response.data
  },

  async createAppointment(data: any) {
    const response = await apiClient.post('/appointments', data)
    return response.data
  },

  async updateAppointment(id: string, data: any) {
    const response = await apiClient.put(`/appointments/${id}`, data)
    return response.data
  },

  async cancelAppointment(id: string) {
    await apiClient.delete(`/appointments/${id}`)
  },

  async getAvailableSlots(date: string) {
    const response = await apiClient.get('/appointments/available-slots', {
      params: { date },
    })
    return response.data
  },

  async getTherapists() {
    const response = await apiClient.get('/therapists')
    return response.data
  },

  // Therapist availability methods
  async getTherapistAvailability(therapistId: string) {
    const response = await apiClient.get(`/therapists/${therapistId}/availability`)
    return response.data
  },

  async setTherapistAvailability(data: any) {
    const response = await apiClient.post('/therapists/availability', data)
    return response.data
  },

  async getAvailableTherapists() {
    const response = await apiClient.get('/therapists/available')
    return response.data
  },

  async getTherapistSchedule(therapistId: string, date: string) {
    const response = await apiClient.get(`/therapists/${therapistId}/schedule`, {
      params: { date },
    })
    return response.data
  },
}

export default appointmentService
