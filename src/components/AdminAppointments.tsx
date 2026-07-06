import React, { useState, useEffect } from 'react'
import {
  ShieldCheckIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  UserIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon,
  CheckBadgeIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  FunnelIcon,
  InboxIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../hooks/useAuth'
import { schedulingService } from '../services/scheduling'
import type { Appointment } from '../types'
import ConfirmDialog from './ConfirmDialog'
import ProgressViewModal from './ProgressViewModal'

const toLocalDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('T')[0].split('-').map(Number)
  return new Date(y, m - 1, d)
}

const statusStr = (status: unknown): string => {
  if (typeof status === 'number') {
    return ['pending', 'confirmed', 'cancelled', 'completed', 'enroute', 'inprogress'][status] ?? ''
  }
  return String(status ?? '').toLowerCase().replace('_', '')
}

const statusLabel = (status: unknown): string => {
  if (typeof status === 'number') {
    return ['Pendiente', 'Confirmada', 'Cancelada', 'Completada', 'En camino', 'En curso'][status] ?? String(status)
  }
  const s = String(status ?? '').toLowerCase()
  if (s === 'enroute') return 'En camino'
  if (s === 'inprogress') return 'En curso'
  return String(status ?? '')
}

const AdminAppointments: React.FC = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'pending' | 'reports'>('pending')
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([])
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [progressView, setProgressView] = useState<Appointment | null>(null)

  const [patientFilter, setPatientFilter] = useState('all')
  const [therapistFilter, setTherapistFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      const [pending, all] = await Promise.all([
        schedulingService.getAllPendingAppointments(),
        schedulingService.getAllAppointments(),
      ])
      setPendingAppointments(pending)
      setAllAppointments(all)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando citas')
      setPendingAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const uniquePatients = Array.from(
    new Map(allAppointments.map((a) => [a.patientId, a.patientName || a.patientId])).entries()
  )
  const uniqueTherapists = Array.from(
    new Map(allAppointments.map((a) => [a.therapistId, a.therapistName || a.therapistId])).entries()
  )

  const filteredReports = allAppointments
    .filter((apt) => patientFilter === 'all' || apt.patientId === patientFilter)
    .filter((apt) => therapistFilter === 'all' || apt.therapistId === therapistFilter)
    .filter((apt) => !dateFrom || apt.date.split('T')[0] >= dateFrom)
    .filter((apt) => !dateTo || apt.date.split('T')[0] <= dateTo)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  const resetFilters = () => {
    setPatientFilter('all')
    setTherapistFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id)
      await schedulingService.confirmAppointment(id)
      setSuccess('Cita aprobada exitosamente')
      setTimeout(() => setSuccess(''), 3000)
      loadAppointments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar la cita')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string) => {
    try {
      setActionLoading(id)
      await schedulingService.rejectAppointment(id)
      setSuccess('Cita rechazada')
      setTimeout(() => setSuccess(''), 3000)
      loadAppointments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar la cita')
    } finally {
      setActionLoading(null)
      setRejectTarget(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <ShieldCheckIcon className="w-8 h-8 text-blue-600 shrink-0" />
          <h1 className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-blue-600 via-blue-800 to-black bg-clip-text text-transparent">
            Panel Admin — {user?.firstName}
          </h1>
        </div>
        <p className="text-gray-500 text-sm ml-11">Aprueba o rechaza las citas solicitadas por los padres</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-5 sm:gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Pendientes</p>
            <div className="p-2 bg-amber-50 rounded-xl">
              <ClockIcon className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-gray-900">{pendingAppointments.length}</p>
          <p className="text-gray-400 text-xs mt-1">requieren acción</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Total</p>
            <div className="p-2 bg-blue-50 rounded-xl">
              <CalendarDaysIcon className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-gray-900">{allAppointments.length}</p>
          <p className="text-gray-400 text-xs mt-1">citas en el sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pending')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 font-semibold text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
            activeTab === 'pending'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <ClockIcon className="w-4 h-4" />
          Pendientes
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 font-semibold text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
            activeTab === 'reports'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <ClipboardDocumentListIcon className="w-4 h-4" />
          Reportes de progreso
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">
          <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-sm">
          <CheckCircleIcon className="w-4 h-4 shrink-0" />
          <p className="font-medium">{success}</p>
        </div>
      )}

      {activeTab === 'pending' && (
      <>
      {/* Section title */}
      <div className="flex items-center gap-2 pt-1">
        <ClockIcon className="w-4 h-4 text-amber-500" />
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Pendientes de aprobación</h2>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-100 border-t-blue-500" />
          <p className="text-gray-400 text-sm">Cargando...</p>
        </div>
      ) : pendingAppointments.length > 0 ? (
        <div className="space-y-5">
          {pendingAppointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 p-6"
            >
              <div className="flex justify-between items-start gap-4 mb-5">
                <div>
                  <p className="text-xs text-gray-400 font-medium capitalize">
                    {toLocalDate(apt.date).toLocaleDateString('es-ES', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">
                    {apt.startTime} — {apt.endTime}
                  </p>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                  <ClockIcon className="w-3 h-3" />
                  Pendiente
                </span>
              </div>

              <div className="mb-4 space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <AcademicCapIcon className="w-4 h-4 text-gray-300 shrink-0" />
                  <span>{apt.therapistName || apt.therapistId}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <UserIcon className="w-4 h-4 text-gray-300 shrink-0" />
                  <span>{apt.patientName || apt.patientId}</span>
                </div>
                {apt.notes && (
                  <div className="flex items-start gap-2 text-sm text-gray-500">
                    <DocumentTextIcon className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                    <span>{apt.notes}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(apt.id)}
                  disabled={actionLoading === apt.id}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  {actionLoading === apt.id
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <CheckIcon className="w-4 h-4" />}
                  Aprobar
                </button>
                <button
                  onClick={() => setRejectTarget(apt.id)}
                  disabled={actionLoading === apt.id}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-600 hover:text-red-600 rounded-xl text-sm font-semibold transition-colors"
                >
                  {actionLoading === apt.id
                    ? <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
                    : <XMarkIcon className="w-4 h-4" />}
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl border border-gray-100">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
            <CheckBadgeIcon className="w-7 h-7 text-emerald-400" />
          </div>
          <p className="text-sm font-semibold text-gray-600">Todo al día</p>
          <p className="text-xs text-gray-400 mt-1">No hay citas pendientes de aprobación</p>
        </div>
      )}
      </>
      )}

      {activeTab === 'reports' && (
      <>
        {/* Filters */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <FunnelIcon className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Filtros</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Paciente</label>
              <select
                value={patientFilter}
                onChange={(e) => setPatientFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="all">Todos</option>
                {uniquePatients.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Terapeuta</label>
              <select
                value={therapistFilter}
                onChange={(e) => setTherapistFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="all">Todos</option>
                {uniqueTherapists.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Desde</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Hasta</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          {(patientFilter !== 'all' || therapistFilter !== 'all' || dateFrom || dateTo) && (
            <button
              onClick={resetFilters}
              className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Reports table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-100 border-t-blue-500" />
            <p className="text-gray-400 text-sm">Cargando...</p>
          </div>
        ) : filteredReports.length > 0 ? (
          <>
            {/* Mobile cards */}
            <div className="lg:hidden space-y-3">
              {filteredReports.map((apt) => (
                <div key={apt.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900 text-sm">{apt.patientName || apt.patientId}</p>
                    <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-semibold border ${
                      statusStr(apt.status) === 'completed'  ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      statusStr(apt.status) === 'confirmed'  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      statusStr(apt.status) === 'pending'    ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      statusStr(apt.status) === 'enroute'    ? 'bg-orange-50 text-orange-700 border-orange-100' :
                      statusStr(apt.status) === 'inprogress' ? 'bg-green-50 text-green-700 border-green-100' :
                      'bg-red-50 text-red-700 border-red-100'
                    }`}>
                      {statusLabel(apt.status)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">
                    {toLocalDate(apt.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' })} · {apt.startTime}
                  </p>
                  <p className="text-xs text-gray-500 mb-3">{apt.therapistName || apt.therapistId}</p>
                  <button
                    onClick={() => setProgressView(apt)}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <ClipboardDocumentListIcon className="w-4 h-4" />
                    {apt.progressUpdatedAt ? 'Ver reporte' : 'Sin reporte aún'}
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="grid bg-gray-50 border-b border-gray-100 px-6 py-4 grid-cols-6 gap-4 items-center text-xs font-bold text-gray-700 uppercase tracking-wide">
                <div>Paciente</div>
                <div>Terapeuta</div>
                <div>Fecha</div>
                <div>Hora</div>
                <div>Estado</div>
                <div className="text-right">Reporte</div>
              </div>
              <div className="divide-y divide-gray-100">
                {filteredReports.map((apt) => (
                  <div key={apt.id} className="grid px-6 py-4 grid-cols-6 gap-4 items-center hover:bg-gray-50 transition-colors">
                    <p className="font-semibold text-gray-900 text-sm">{apt.patientName || apt.patientId}</p>
                    <p className="text-sm text-gray-600">{apt.therapistName || apt.therapistId}</p>
                    <p className="text-sm text-gray-600">
                      {toLocalDate(apt.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </p>
                    <p className="text-sm text-gray-600">{apt.startTime}</p>
                    <span className={`w-fit inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                      statusStr(apt.status) === 'completed'  ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      statusStr(apt.status) === 'confirmed'  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      statusStr(apt.status) === 'pending'    ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      statusStr(apt.status) === 'enroute'    ? 'bg-orange-50 text-orange-700 border-orange-100' :
                      statusStr(apt.status) === 'inprogress' ? 'bg-green-50 text-green-700 border-green-100' :
                      'bg-red-50 text-red-700 border-red-100'
                    }`}>
                      {statusLabel(apt.status)}
                    </span>
                    <div className="text-right">
                      <button
                        onClick={() => setProgressView(apt)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <ClipboardDocumentListIcon className="w-4 h-4" />
                        {apt.progressUpdatedAt ? 'Ver reporte' : 'Sin reporte'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl border border-gray-100">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
              <InboxIcon className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-600">Sin resultados</p>
            <p className="text-xs text-gray-400 mt-1">No hay sesiones que coincidan con los filtros</p>
          </div>
        )}
      </>
      )}

      <ConfirmDialog
        open={rejectTarget !== null}
        title="Rechazar cita"
        message="¿Rechazar esta cita? El paciente quedará sin cita."
        confirmLabel="Sí, rechazar"
        loading={actionLoading === rejectTarget}
        onConfirm={() => rejectTarget && handleReject(rejectTarget)}
        onCancel={() => setRejectTarget(null)}
      />

      <ProgressViewModal
        appointment={progressView}
        onClose={() => setProgressView(null)}
      />
    </div>
  )
}

export default AdminAppointments
