import apiClient from './api'
import type { Notification } from '../types'

export const notificationService = {
  async getMyNotifications(): Promise<Notification[]> {
    const response = await apiClient.get<Notification[]>('/notifications')
    return response.data
  },

  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.patch(`/notifications/${notificationId}/read`)
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all')
  },
}
