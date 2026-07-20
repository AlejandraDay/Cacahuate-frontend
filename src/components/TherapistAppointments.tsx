import React, { useState, useEffect, useRef } from 'react'
import {
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  SunIcon,
  BookmarkIcon,
  CheckBadgeIcon,
  EllipsisHorizontalIcon,
  ClipboardDocumentListIcon,
  MapPinIcon,
  PlayCircleIcon,
  XMarkIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../hooks/useAuth'
import { schedulingService } from '../services/scheduling'
import { formsService } from '../services/forms'
import type { Appointment, ProgressData, AppointmentFormInfo, FormField } from '../types'
import { FIELD_TYPE_LABELS } from '../types'
import TherapistAvailability from './TherapistAvailability'
import ConfirmDialog from './ConfirmDialog'
import ProgressNotesModal from './ProgressNotesModal'
import SignatureModal from './SignatureModal'

// ── Field renderer ─────────────────────────────────────────────────────────────
const FieldInput: React.FC<{
  field: FormField;
  value: string;
  onChange: (v: string) => void;
}> = ({ field, value, onChange }) => {
  const base = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white'

  if (field.type === 1)
    return <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} required={field.isRequired} className={`${base} resize-none`} />

  if (field.type === 2)
    return <input type="number" value={value} onChange={e => onChange(e.target.value)} required={field.isRequired} className={base} />

  if (field.type === 3 && field.options)
    return (
      <select value={value} onChange={e => onChange(e.target.value)} required={field.isRequired} className={base}>
        <option value="">Selecciona...</option>
        {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    )

  if (field.type === 4)
    return (
      <div className="flex gap-4">
        {['true', 'false'].map(v => (
          <label key={v} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="radio" name={field.id} value={v} checked={value === v} onChange={() => onChange(v)} className="accent-violet-600" />
            {v === 'true' ? 'Sí' : 'No'}
          </label>
        ))}
      </div>
    )

  if (field.type === 5)
    return (
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 10 }, (_, i) => String(i + 1)).map(v => (
          <button key={v} type="button" onClick={() => onChange(v)}
            className={`w-9 h-9 rounded-full text-sm font-bold border-2 transition ${value === v ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-300 text-gray-600 hover:border-violet-400'}`}>
            {v}
          </button>
        ))}
      </div>
    )

  return <input type="text" value={value} onChange={e => onChange(e.target.value)} required={field.isRequired} className={base} />
}

// ── Appointment Form Modal ─────────────────────────────────────────────────────
const isHiddenPatientNameField = (field: FormField) => {
  const normalizedLabel = field.label.trim().toLowerCase().replace(/\s+/g, ' ')
  return [
    'name',
    'nombre',
    'patient name',
    'nombre del paciente',
    'full name',
    'nombre completo',
  ].includes(normalizedLabel)
}

const AppointmentFormModal: React.FC<{
  appointment: Appointment;
  onClose: () => void;
}> = ({ appointment, onClose }) => {
  const [forms, setForms] = useState<AppointmentFormInfo[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [answersByAssignment, setAnswersByAssignment] = useState<Record<string, Record<string, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    formsService.getFormsForAppointment(appointment.id)
      .then(info => {
        setForms(info)
        setSelectedId(info[0]?.assignmentId ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [appointment.id])

  const selectedForm = forms.find(f => f.assignmentId === selectedId) ?? null

  const setAnswer = (assignmentId: string, fieldId: string, value: string) =>
    setAnswersByAssignment(prev => ({
      ...prev,
      [assignmentId]: { ...prev[assignmentId], [fieldId]: value },
    }))

  const visibleFields = selectedForm?.fields.filter(field => !isHiddenPatientNameField(field)) ?? []
  const hiddenNameFields = selectedForm?.fields.filter(isHiddenPatientNameField) ?? []
  const answers = (selectedForm && answersByAssignment[selectedForm.assignmentId]) ?? {}

  const canSubmit = visibleFields
    .filter(f => f.isRequired)
    .every(f => (answers[f.id] ?? '').trim() !== '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedForm) return
    setError('')
    setSubmitting(true)
    try {
      const visibleAnswers = visibleFields.map(field => ({
        fieldId: field.id,
        value: answers[field.id] ?? '',
      }))

      const hiddenAnswers = hiddenNameFields.map(field => ({
        fieldId: field.id,
        value: appointment.patientName ?? '',
      }))

      const result = await formsService.submitForm(appointment.id, selectedForm.assignmentId, {
        answers: [...visibleAnswers, ...hiddenAnswers],
      })
      setForms(prev => prev.map(f => (f.assignmentId === result.assignmentId ? result : f)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl my-8 flex flex-col sm:flex-row overflow-hidden">
        {forms.length > 1 && (
          <div className="sm:w-52 shrink-0 border-b sm:border-b-0 sm:border-r border-gray-100 bg-gray-50 p-3 space-y-1">
            {forms.map(f => (
              <button
                key={f.assignmentId}
                onClick={() => setSelectedId(f.assignmentId)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 transition ${
                  selectedId === f.assignmentId ? 'bg-white shadow-sm text-violet-700' : 'text-gray-600 hover:bg-white/60'
                }`}
              >
                <span className="truncate">{f.formTemplateName}</span>
                {f.isSubmitted
                  ? <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                  : <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-extrabold text-gray-900">
                {loading ? 'Cargando...' : selectedForm?.formTemplateName ?? 'Formulario de sesión'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">{appointment.patientName}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {loading && (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Cargando formulario...</div>
            )}

            {!loading && forms.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <ClipboardDocumentListIcon className="w-12 h-12 mb-3" />
                <p className="text-sm font-medium text-gray-500">No hay formularios asignados para este paciente</p>
              </div>
            )}

            {!loading && selectedForm?.isSubmitted && selectedForm.submission && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                  <p className="text-xs text-emerald-700 font-semibold">
                    Completado por {selectedForm.submission.therapistName} · {new Date(selectedForm.submission.submittedAt).toLocaleDateString('es-MX')}
                  </p>
                </div>
                <div className="space-y-2">
                  {selectedForm.submission.answers.map(ans => (
                    <div key={ans.fieldId} className="flex gap-3 text-sm">
                      <span className="text-gray-500 font-medium min-w-[150px]">{ans.fieldLabel}:</span>
                      <span className="text-gray-900">
                        {ans.fieldType === 4 ? (ans.value === 'true' ? 'Sí' : 'No') : ans.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && selectedForm && !selectedForm.isSubmitted && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {selectedForm.notes && (
                  <div className="px-3 py-2 bg-violet-50 rounded-xl text-xs text-violet-700 italic">
                    Instrucciones: "{selectedForm.notes}"
                  </div>
                )}
                {hiddenNameFields.length > 0 && (
                  <div className="px-3 py-2 bg-blue-50 rounded-xl text-xs text-blue-700 mb-3">
                    El nombre del paciente se completará automáticamente desde la cita.
                  </div>
                )}
                {visibleFields.map(field => (
                  <div key={field.id}>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      {field.label}
                      {field.isRequired && <span className="text-red-400 ml-1">*</span>}
                      <span className="ml-2 text-gray-400 font-normal">({FIELD_TYPE_LABELS[field.type]})</span>
                    </label>
                    <FieldInput field={field} value={answers[field.id] ?? ''} onChange={v => setAnswer(selectedForm.assignmentId, field.id, v)} />
                  </div>
                ))}
                {error && <p className="text-xs text-red-600 text-center">{error}</p>}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={submitting || !canSubmit}
                    className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow transition"
                  >
                    <CheckBadgeIcon className="w-4 h-4" />
                    {submitting ? 'Enviando...' : 'Enviar informe'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const statusStr = (status: unknown): string => {
  if (typeof status === 'number') {
    return ['pending', 'confirmed', 'cancelled', 'completed', 'enroute', 'inprogress'][status] ?? ''
  }
  return String(status ?? '').toLowerCase().replace('_', '')
}

const TherapistAppointments: React.FC = () => {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('confirmed')
  const [activeTab, setActiveTab] = useState('appointments')
  const [newApptNotif, setNewApptNotif] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<string | null>(null)
  const [progressTarget, setProgressTarget] = useState<Appointment | null>(null)
  const [formTarget, setFormTarget] = useState<Appointment | null>(null)
  const [savingProgress, setSavingProgress] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [signTarget, setSignTarget] = useState<Appointment | null>(null)
  const prevApptCount = useRef<number | null>(null)

  useEffect(() => {
    loadAppointments()
    const interval = setInterval(loadAppointments, 30 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      const data = await schedulingService.getTherapistAppointments()
      setAppointments(data)
      setError('')
      const now = new Date(); now.setHours(0, 0, 0, 0)
      const upcoming = data.filter((a) => {
        const [y, m, d] = a.date.split('T')[0].split('-').map(Number)
        return statusStr(a.status) === 'confirmed' && new Date(y, m - 1, d) >= now
      }).length
      if (prevApptCount.current !== null && upcoming > prevApptCount.current) {
        setNewApptNotif(true)
      }
      prevApptCount.current = upcoming
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando citas')
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const handleMarkEnRoute = async (id: string) => {
    try {
      setActionLoading(id + '_enroute')
      await schedulingService.markEnRoute(id)
      setError('')
      loadAppointments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando estado')
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkInProgress = async (id: string) => {
    try {
      setActionLoading(id + '_inprogress')
      await schedulingService.markInProgress(id)
      setError('')
      loadAppointments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando estado')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCompleteAppointment = async (id: string) => {
    try {
      setActionLoading(id + '_complete')
      await schedulingService.completeAppointment(id)
      setError('')
      loadAppointments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error completando cita')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelAppointment = async (id: string) => {
    try {
      setLoading(true)
      await schedulingService.cancelAppointment(id)
      setError('')
      loadAppointments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cancelando cita')
    } finally {
      setLoading(false)
      setCancelTarget(null)
    }
  }

  const handleSaveProgress = async (data: ProgressData) => {
    if (!progressTarget) return
    try {
      setSavingProgress(true)
      await schedulingService.addProgressNotes(progressTarget.id, data)
      setError('')
      setProgressTarget(null)
      loadAppointments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando el progreso')
    } finally {
      setSavingProgress(false)
    }
  }

  const handleSignAppointment = async (appointmentId: string, signature: string) => {
    const updated = await schedulingService.signAppointment(appointmentId, signature)
    setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
  }

  const toLocalDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('T')[0].split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  const durationMinutes = (apt: Appointment) => {
    const [sh, sm] = apt.startTime.split(':').map(Number)
    const [eh, em] = apt.endTime.split(':').map(Number)
    return eh * 60 + em - (sh * 60 + sm)
  }

  const filteredAppointments = appointments.filter((apt) => {
    const aptDate = toLocalDate(apt.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const status = statusStr(apt.status)
    switch (filter) {
      case 'confirmed':
        return (status === 'confirmed' || status === 'pending' || status === 'enroute' || status === 'inprogress') && aptDate >= today
      case 'completed':
        return status === 'completed'
      case 'cancelled':
        return status === 'cancelled'
      default:
        return true
    }
  })

  const upcomingCount = appointments.filter((apt) => {
    const aptDate = toLocalDate(apt.date)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const weekOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    return statusStr(apt.status) === 'confirmed' && aptDate >= today && aptDate <= weekOut
  }).length

  if (activeTab === 'availability') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setActiveTab('appointments')}
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Volver a Citas
        </button>
        <TherapistAvailability />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {newApptNotif && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-blue-50 border border-blue-100 text-blue-700 rounded-2xl text-sm font-medium">
          <span>🔔 Tienes una nueva cita confirmada</span>
          <button
            onClick={() => setNewApptNotif(false)}
            className="text-blue-500 hover:text-blue-700 font-bold text-xs"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <CalendarDaysIcon className="w-8 h-8 text-blue-700 shrink-0" />
          <h1 className="text-2xl sm:text-4xl font-black text-gray-900">
            Mis Citas — {user?.firstName}
          </h1>
        </div>
        <p className="text-gray-500 text-sm ml-11">Gestiona tu calendario de citas y disponibilidad</p>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mt-5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 font-semibold text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
              activeTab === 'appointments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <BookmarkIcon className="w-4 h-4" />
            Citas
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 font-semibold text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
              activeTab === 'availability'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <ClockIcon className="w-4 h-4" />
            Mi Disponibilidad
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          {
            label: 'HOY',
            icon: <SunIcon className="w-5 h-5 text-amber-500" />,
            bg: 'bg-amber-50',
            value: appointments.filter((a) => {
              const d = toLocalDate(a.date); const t = new Date(); t.setHours(0,0,0,0)
              const tomorrow = new Date(t); tomorrow.setDate(t.getDate() + 1)
              return statusStr(a.status) === 'confirmed' && d >= t && d < tomorrow
            }).length,
            sub: 'confirmadas',
          },
          {
            label: 'PRÓXIMOS 7 DÍAS',
            icon: <CalendarDaysIcon className="w-5 h-5 text-blue-500" />,
            bg: 'bg-slate-100',
            value: upcomingCount,
            sub: 'próximas',
          },
          {
            label: 'COMPLETADAS',
            icon: <CheckCircleIcon className="w-5 h-5 text-blue-500" />,
            bg: 'bg-blue-50',
            value: appointments.filter((a) => statusStr(a.status) === 'completed').length,
            sub: 'sesiones',
          },
        ].map(({ label, icon, bg, value, sub }) => (
          <div key={label} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300 p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="text-gray-600 text-xs font-bold uppercase tracking-wide">{label}</p>
              <div className={`p-2.5 ${bg} rounded-xl`}>{icon}</div>
            </div>
            <p className="text-3xl font-black text-gray-900">{value}</p>
            <p className="text-gray-400 text-xs mt-1.5">{sub}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-200">
          <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'confirmed', label: 'Próximas' },
          { key: 'completed', label: 'Completadas' },
          { key: 'cancelled', label: 'Canceladas' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-200 ${
              filter === key 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Appointments table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600" />
          <p className="text-gray-500 text-sm font-medium">Cargando citas...</p>
        </div>
      ) : filteredAppointments.length > 0 ? (
        <>
          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {filteredAppointments.map((apt) => {
              const aptDate = toLocalDate(apt.date)
              const durationMins = `${durationMinutes(apt)} minutos`
              const initials = (apt.patientName || 'U')
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)

              return (
                <div key={apt.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{apt.patientName || 'Paciente'}</p>
                      <p className="text-xs text-gray-500">
                        {aptDate.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: '2-digit' })}, {apt.startTime} am
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>Duración: {durationMins}</span>
                    {apt.notes && (
                      <span className="inline-flex px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg font-medium">
                        {apt.notes}
                      </span>
                    )}
                  </div>

                  {statusStr(apt.status) === 'confirmed' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMarkEnRoute(apt.id)}
                        disabled={actionLoading === apt.id + '_enroute'}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        <MapPinIcon className="w-4 h-4" />
                        {actionLoading === apt.id + '_enroute' ? '...' : 'En camino'}
                      </button>
                      <button
                        onClick={() => setCancelTarget(apt.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <XCircleIcon className="w-4 h-4" />
                        Cancelar
                      </button>
                    </div>
                  )}

                  {statusStr(apt.status) === 'enroute' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMarkInProgress(apt.id)}
                        disabled={actionLoading === apt.id + '_inprogress'}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        <PlayCircleIcon className="w-4 h-4" />
                        {actionLoading === apt.id + '_inprogress' ? '...' : 'Iniciar sesión'}
                      </button>
                      <button
                        onClick={() => setCancelTarget(apt.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <XCircleIcon className="w-4 h-4" />
                        Cancelar
                      </button>
                    </div>
                  )}

                  {statusStr(apt.status) === 'inprogress' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCompleteAppointment(apt.id)}
                        disabled={actionLoading === apt.id + '_complete'}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        <CheckBadgeIcon className="w-4 h-4" />
                        {actionLoading === apt.id + '_complete' ? '...' : 'Completar'}
                      </button>
                    </div>
                  )}

                  {statusStr(apt.status) === 'completed' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFormTarget(apt)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <ClipboardDocumentListIcon className="w-4 h-4" />
                        Informe de sesión
                      </button>
                      <button
                        onClick={() => setProgressTarget(apt)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        {apt.progressUpdatedAt ? 'Editar progreso' : 'Progreso'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="hidden lg:grid bg-gray-50 border-b border-gray-100 px-6 py-5 grid-cols-6 gap-4 items-center text-xs font-bold text-gray-700 uppercase tracking-wide">
            <div>Paciente</div>
            <div>Fecha y Hora</div>
            <div>Duración</div>
            <div>Notas</div>
            <div>Calificación</div>
            <div></div>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-gray-100">
            {filteredAppointments.map((apt) => {
              const aptDate = toLocalDate(apt.date)
              const durationMins = `${durationMinutes(apt)} minutos`
              const initials = (apt.patientName || 'U')
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)

              return (
                <div
                  key={apt.id}
                  className="hidden lg:grid px-6 py-5 grid-cols-6 gap-4 items-center hover:bg-gray-50 transition-colors"
                >
                  {/* Paciente */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {initials}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">{apt.patientName || 'Paciente'}</p>
                  </div>

                  {/* Fecha y Hora */}
                  <div className="text-sm text-gray-700">
                    <p className="font-medium">
                      {aptDate.toLocaleDateString('es-ES', {
                        month: 'short',
                        day: 'numeric',
                        year: '2-digit',
                      })}
                      , {apt.startTime} am
                    </p>
                  </div>

                  {/* Duración */}
                  <div className="text-sm text-gray-700">{durationMins}</div>

                  {/* Notas */}
                  <div>
                    {apt.notes && (
                      <span className="inline-flex px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-medium">
                        {apt.notes}
                      </span>
                    )}
                  </div>

                  {/* Calificación del padre */}
                  <div>
                    {apt.ratingStars != null ? (
                      <span className="inline-flex items-center gap-1 text-amber-500 text-xs font-semibold">
                        {'★'.repeat(apt.ratingStars)}{'☆'.repeat(5 - apt.ratingStars)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 justify-end items-center">
                    {statusStr(apt.status) === 'confirmed' && (
                      <>
                        <button
                          onClick={() => handleMarkEnRoute(apt.id)}
                          disabled={actionLoading === apt.id + '_enroute'}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors disabled:opacity-50"
                          title="En camino"
                        >
                          <MapPinIcon className="w-4 h-4" />
                          {actionLoading === apt.id + '_enroute' ? '...' : 'En camino'}
                        </button>
                        <button
                          onClick={() => setCancelTarget(apt.id)}
                          className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Cancelar"
                        >
                          <XCircleIcon className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {statusStr(apt.status) === 'enroute' && (
                      <>
                        <button
                          onClick={() => handleMarkInProgress(apt.id)}
                          disabled={actionLoading === apt.id + '_inprogress'}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-green-50 hover:bg-green-100 text-green-700 transition-colors disabled:opacity-50"
                          title="Iniciar sesión"
                        >
                          <PlayCircleIcon className="w-4 h-4" />
                          {actionLoading === apt.id + '_inprogress' ? '...' : 'Iniciar'}
                        </button>
                        <button
                          onClick={() => setCancelTarget(apt.id)}
                          className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Cancelar"
                        >
                          <XCircleIcon className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {statusStr(apt.status) === 'inprogress' && (
                      <button
                        onClick={() => handleCompleteAppointment(apt.id)}
                        disabled={actionLoading === apt.id + '_complete'}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors disabled:opacity-50"
                        title="Completar"
                      >
                        <CheckBadgeIcon className="w-4 h-4" />
                        {actionLoading === apt.id + '_complete' ? '...' : 'Completar'}
                      </button>
                    )}
                    {statusStr(apt.status) === 'completed' && (
                      <>
                        <button
                          onClick={() => setFormTarget(apt)}
                          className="relative p-2 hover:bg-violet-50 text-gray-400 hover:text-violet-600 rounded-lg transition-colors"
                          title="Informe de sesión"
                        >
                          <ClipboardDocumentListIcon className="w-5 h-5" />
                          {apt.formSubmissionIds && apt.formSubmissionIds.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-emerald-500 text-white text-[10px] font-bold rounded-full">
                              {apt.formSubmissionIds.length}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => setProgressTarget(apt)}
                          className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                          title={apt.progressUpdatedAt ? 'Editar progreso' : 'Agregar progreso'}
                        >
                          <CheckBadgeIcon className="w-5 h-5" />
                        </button>
                        {apt.therapistSignature ? (
                          <span
                            className="p-2 text-emerald-500"
                            title={`Firmado el ${apt.therapistSignedAt ? new Date(apt.therapistSignedAt).toLocaleDateString('es-ES') : ''}`}
                          >
                            <CheckCircleIcon className="w-5 h-5" />
                          </span>
                        ) : (
                          <button
                            onClick={() => setSignTarget(apt)}
                            className="p-2 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors"
                            title="Firmar constancia de cita"
                          >
                            <PencilSquareIcon className="w-5 h-5" />
                          </button>
                        )}
                      </>
                    )}
                    <button className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                      <EllipsisHorizontalIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          </div>
        </>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <CalendarDaysIcon className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-gray-900 font-bold text-lg mb-1">Sin citas</p>
          <p className="text-gray-400 text-sm">No hay citas en esta categoría</p>
        </div>
      )}

      {formTarget && (
        <AppointmentFormModal
          appointment={formTarget}
          onClose={() => setFormTarget(null)}
        />
      )}

      <ConfirmDialog
        open={cancelTarget !== null}
        title="Cancelar cita"
        message="¿Seguro que quieres cancelar esta cita? Esta acción no se puede deshacer."
        confirmLabel="Sí, cancelar"
        loading={loading}
        onConfirm={() => cancelTarget && handleCancelAppointment(cancelTarget)}
        onCancel={() => setCancelTarget(null)}
      />

      <ProgressNotesModal
        appointment={progressTarget}
        loading={savingProgress}
        onSave={handleSaveProgress}
        onClose={() => setProgressTarget(null)}
      />

      {signTarget && (
        <SignatureModal
          appointmentId={signTarget.id}
          userName={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`}
          onSubmit={handleSignAppointment}
          onClose={() => setSignTarget(null)}
        />
      )}
    </div>
  )
}

export default TherapistAppointments
