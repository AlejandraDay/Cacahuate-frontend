import React, { useState, useEffect } from 'react'
import {
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  UsersIcon,
  PlusIcon,
  XMarkIcon,
  InboxIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckIcon,
  BookmarkIcon,
  PlusCircleIcon,
  CheckBadgeIcon,
  AcademicCapIcon,
  StarIcon,
  ClipboardDocumentListIcon,
  MapPinIcon,
  PlayCircleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { schedulingService } from '../services/scheduling'
import { formsService } from '../services/forms'
import type { Appointment, Therapist, Patient, TherapistAvailability, FormSubmissionResult } from '../types'
import Calendar from './Calendar'
import ConfirmDialog from './ConfirmDialog'
import RateTherapistModal from './RateTherapistModal'
import ProgressViewModal from './ProgressViewModal'
import FormSubmissionModal from './FormSubmissionModal'
import SignatureModal from './SignatureModal'
import ReportsMenu from './ReportsMenu'
import { useAuth } from '../hooks/useAuth'

const toLocalDateStr = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const calcSlots = (start: string, end: string, duration: number): string[] => {
  if (!start || !end || duration <= 0) return []
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const startMin = sh * 60 + sm
  const endMin = eh * 60 + em
  if (startMin >= endMin) return []
  const slots: string[] = []
  for (let m = startMin; m + duration <= endMin; m += duration) {
    slots.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`)
  }
  return slots
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

const ParentAppointments: React.FC = () => {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [availabilityBlocks, setAvailabilityBlocks] = useState<TherapistAvailability[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filter, setFilter] = useState('upcoming')
  const [activeTab, setActiveTab] = useState('appointments')
  const [submissionView, setSubmissionView] = useState<FormSubmissionResult | null>(null)
  const [submissionPatientName, setSubmissionPatientName] = useState('')
  const [submissionLoading, setSubmissionLoading] = useState(false)
  const [submissionError, setSubmissionError] = useState('')
  const [cancelTarget, setCancelTarget] = useState<string | null>(null)
  const [rateTarget, setRateTarget] = useState<Appointment | null>(null)
  const [ratingLoading, setRatingLoading] = useState(false)
  const [progressView, setProgressView] = useState<Appointment | null>(null)
  const [signTarget, setSignTarget] = useState<Appointment | null>(null)

  const [selectedPatient, setSelectedPatient] = useState<string | undefined>()
  const [selectedTherapist, setSelectedTherapist] = useState<string | undefined>()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedSlot, setSelectedSlot] = useState<string | undefined>()

  const [showPatientForm, setShowPatientForm] = useState(false)
  const [newPatient, setNewPatient] = useState({ firstName: '', lastName: '', dateOfBirth: '' })
  const [patientFormLoading, setPatientFormLoading] = useState(false)
  const [patientFormError, setPatientFormError] = useState('')

  useEffect(() => {
    loadAppointments()
    loadTherapists()
  }, [])

  useEffect(() => {
    if (activeTab === 'book') loadPatients()
  }, [activeTab])

  useEffect(() => {
    if (selectedTherapist) loadAvailability(selectedTherapist)
  }, [selectedTherapist])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      const data = await schedulingService.getMyAppointments()
      setAppointments(data)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando citas')
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const loadTherapists = async () => {
    try { setTherapists(await schedulingService.getTherapists()) }
    catch { setTherapists([]) }
  }

  const loadPatients = async () => {
    try { setPatients(await schedulingService.getMyPatients()) }
    catch { setPatients([]) }
  }

  const handleCreatePatient = async () => {
    if (!newPatient.firstName || !newPatient.lastName || !newPatient.dateOfBirth) {
      setPatientFormError('Completa todos los campos')
      return
    }
    try {
      setPatientFormLoading(true)
      const created = await schedulingService.createPatient(newPatient)
      setPatients((prev) => [...prev, created])
      setSelectedPatient(created.id)
      setNewPatient({ firstName: '', lastName: '', dateOfBirth: '' })
      setShowPatientForm(false)
      setPatientFormError('')
    } catch (err) {
      setPatientFormError(err instanceof Error ? err.message : 'Error al registrar paciente')
    } finally {
      setPatientFormLoading(false)
    }
  }

  const loadAvailability = async (therapistId: string) => {
    try { setAvailabilityBlocks(await schedulingService.getTherapistAvailability(therapistId)) }
    catch { setAvailabilityBlocks([]) }
  }

  const markedDates = availabilityBlocks.map((b) => {
    const [y, m, d] = b.date.split('-').map(Number)
    return new Date(y, m - 1, d)
  })

  const therapistName = (id: string) => {
    const t = therapists.find((t) => t.id === id)
    return t ? t.fullName : id
  }

  const availableSlots = (() => {
    if (!selectedDate || !availabilityBlocks.length) return []
    const dateStr = toLocalDateStr(selectedDate)
    const block = availabilityBlocks.find((b) => b.date === dateStr)
    if (!block) return []
    const slots = block.availableSlots ?? block.slots ?? []
    if (slots.length > 0)
      return slots.filter((s) => s.isAvailable).map((s) => s.startTime)
    return calcSlots(block.startTime, block.endTime, block.sessionDurationMinutes)
  })()

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

  const handleRateTherapist = async (stars: number, comment: string) => {
    if (!rateTarget) return
    try {
      setRatingLoading(true)
      await schedulingService.rateTherapist(rateTarget.id, { stars, comment: comment.trim() || undefined })
      setError('')
      setSuccess('¡Gracias por tu calificación!')
      setTimeout(() => setSuccess(''), 3000)
      setRateTarget(null)
      loadAppointments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar la calificación')
    } finally {
      setRatingLoading(false)
    }
  }

  const handleSignAppointment = async (appointmentId: string, signature: string) => {
    const updated = await schedulingService.signAppointment(appointmentId, signature)
    setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
    setSuccess('Cita firmada correctamente')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleOpenSubmission = async (appointment: Appointment, submissionId: string) => {
    try {
      setSubmissionLoading(true)
      setSubmissionError('')
      setSubmissionPatientName(appointment.patientName ?? '')
      const submission = await formsService.getSubmission(submissionId)
      setSubmissionView(submission)
    } catch (err) {
      setSubmissionError(err instanceof Error ? err.message : 'No se pudo cargar el informe')
      setSubmissionView(null)
    } finally {
      setSubmissionLoading(false)
    }
  }

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient || !selectedTherapist || !selectedDate || !selectedSlot) {
      setError('Por favor completa todos los campos requeridos')
      return
    }
    try {
      setLoading(true)
      await schedulingService.bookAppointment({
        therapistId: selectedTherapist,
        patientId: selectedPatient,
        date: toLocalDateStr(selectedDate),
        startTime: selectedSlot,
      })
      setError('')
      setSuccess('¡Cita agendada exitosamente!')
      setTimeout(() => setSuccess(''), 3000)
      loadAppointments()
      setActiveTab('appointments')
      setSelectedPatient(undefined)
      setSelectedTherapist(undefined)
      setSelectedDate(undefined)
      setSelectedSlot(undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agendar cita')
    } finally {
      setLoading(false)
    }
  }

  const toLocalDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('T')[0].split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  const filteredAppointments = appointments.filter((apt) => {
    const aptDate = toLocalDate(apt.date)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const s = statusStr(apt.status)
    switch (filter) {
      case 'upcoming':  return aptDate >= today && s !== 'cancelled'
      case 'completed': return s === 'completed'
      case 'cancelled': return s === 'cancelled'
      default:          return true
    }
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <CalendarDaysIcon className="w-8 h-8 text-blue-600 shrink-0" />
          <h1 className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-blue-600 via-blue-800 to-black bg-clip-text text-transparent">
            Mis Citas
          </h1>
        </div>
        <p className="text-gray-500 text-sm ml-11">Gestiona las citas de tus hijos con los terapeutas</p>

        <div className="flex gap-1 border-b border-gray-200 mt-5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 font-semibold text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
              activeTab === 'appointments'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <BookmarkIcon className="w-4 h-4" />
            Mis Citas
          </button>
          <button
            onClick={() => setActiveTab('book')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 font-semibold text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
              activeTab === 'book'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <PlusCircleIcon className="w-4 h-4" />
            Agendar Cita
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-200">
          <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200">
          <CheckCircleIcon className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      {/* ── My Appointments ── */}
      {activeTab === 'appointments' ? (
        <>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'upcoming',  label: 'Próximas',   Icon: CalendarDaysIcon, active: 'bg-blue-600 text-white shadow-md' },
              { key: 'completed', label: 'Completadas', Icon: CheckBadgeIcon,   active: 'bg-emerald-600 text-white shadow-md' },
              { key: 'cancelled', label: 'Canceladas',  Icon: XCircleIcon,      active: 'bg-red-500 text-white shadow-md' },
            ].map(({ key, label, Icon, active }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  filter === key ? active : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-100 border-t-blue-600" />
              <p className="text-gray-500 text-sm">Cargando citas...</p>
            </div>
          ) : filteredAppointments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 p-6"
                >
                  <div className="flex justify-between items-start mb-4 gap-3">
                    <div>
                      <p className="text-xs text-gray-400 capitalize">
                        {toLocalDate(apt.date).toLocaleDateString('es-ES', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </p>
                      <p className="text-xl font-bold text-gray-900 mt-0.5">
                        {apt.startTime} — {apt.endTime}
                      </p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                      statusStr(apt.status) === 'pending'     ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      statusStr(apt.status) === 'confirmed'   ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      statusStr(apt.status) === 'enroute'     ? 'bg-orange-50 text-orange-700 border-orange-100' :
                      statusStr(apt.status) === 'inprogress'  ? 'bg-green-50 text-green-700 border-green-100' :
                      statusStr(apt.status) === 'completed'   ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      'bg-red-50 text-red-700 border-red-100'
                    }`}>
                      {statusLabel(apt.status)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <AcademicCapIcon className="w-4 h-4 text-gray-300 shrink-0" />
                    <span>{therapistName(apt.therapistId)}</span>
                  </div>

                  {statusStr(apt.status) === 'pending' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-500 rounded-xl text-xs font-medium">
                      <ClockIcon className="w-3.5 h-3.5" />
                      Esperando aprobación
                    </span>
                  )}
                  {statusStr(apt.status) === 'confirmed' && (
                    <button
                      onClick={() => setCancelTarget(apt.id)}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-600 hover:text-red-600 rounded-xl text-xs font-semibold transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                      Cancelar cita
                    </button>
                  )}
                  {statusStr(apt.status) === 'enroute' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-100 text-orange-700 rounded-xl text-xs font-semibold">
                      <MapPinIcon className="w-3.5 h-3.5" />
                      El terapeuta está en camino
                    </span>
                  )}
                  {statusStr(apt.status) === 'inprogress' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-100 text-green-700 rounded-xl text-xs font-semibold animate-pulse">
                      <PlayCircleIcon className="w-3.5 h-3.5" />
                      ¡La sesión está en curso!
                    </span>
                  )}
                  {statusStr(apt.status) === 'completed' && (
                    <div className="flex flex-wrap gap-2">
                      {apt.formSubmissionIds && apt.formSubmissionIds.length > 0 ? (
                        <ReportsMenu
                          submissionIds={apt.formSubmissionIds}
                          disabled={submissionLoading}
                          onSelect={(submissionId) => handleOpenSubmission(apt, submissionId)}
                        />
                      ) : (
                        <button
                          onClick={() => setProgressView(apt)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
                        >
                          <ClipboardDocumentListIcon className="w-4 h-4" />
                          Ver progreso
                        </button>
                      )}
                      {apt.isRated ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-100 text-amber-700 rounded-xl text-xs font-semibold">
                          <StarIconSolid className="w-3.5 h-3.5" />
                          Terapeuta calificado
                        </span>
                      ) : (
                        <button
                          onClick={() => setRateTarget(apt)}
                          disabled={loading}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 rounded-xl text-xs font-semibold transition-colors"
                        >
                          <StarIcon className="w-4 h-4" />
                          Calificar terapeuta
                        </button>
                      )}
                      {apt.parentSignature ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold" title={`Firmado el ${apt.parentSignedAt ? new Date(apt.parentSignedAt).toLocaleDateString('es-ES') : ''}`}>
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                          Firmada
                        </span>
                      ) : (
                        <button
                          onClick={() => setSignTarget(apt)}
                          disabled={loading}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors"
                          title="Firmar constancia de cita"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                          Firmar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                <InboxIcon className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-500">
                {filter === 'upcoming' ? 'No hay citas próximas'
                  : filter === 'completed' ? 'No hay citas completadas'
                  : 'No hay citas canceladas'}
              </p>
            </div>
          )}
        </>
      ) : (
        /* ── Book Appointment ── */
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-10">
          <form onSubmit={handleBookAppointment} className="space-y-10">

            {/* Step 1 — Patient */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-0.5">Paso 1</p>
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-blue-600" />
                    <span className="text-base sm:text-lg font-bold text-gray-800">Selecciona el paciente</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowPatientForm((v) => !v); setPatientFormError('') }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-all shrink-0"
                >
                  {showPatientForm ? <><XMarkIcon className="w-3.5 h-3.5" /> Cancelar</> : <><PlusIcon className="w-3.5 h-3.5" /> Registrar hijo</>}
                </button>
              </div>

              {showPatientForm && (
                <div className="mb-4 p-4 sm:p-5 bg-blue-50 border border-blue-200 rounded-xl space-y-4">
                  <p className="text-sm font-bold text-blue-900">Nuevo paciente</p>
                  {patientFormError && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <ExclamationCircleIcon className="w-4 h-4 shrink-0" />
                      {patientFormError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre</label>
                      <input
                        type="text"
                        value={newPatient.firstName}
                        onChange={(e) => setNewPatient((p) => ({ ...p, firstName: e.target.value }))}
                        placeholder="Nombre"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Apellido</label>
                      <input
                        type="text"
                        value={newPatient.lastName}
                        onChange={(e) => setNewPatient((p) => ({ ...p, lastName: e.target.value }))}
                        placeholder="Apellido"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha de nacimiento</label>
                    <input
                      type="date"
                      value={newPatient.dateOfBirth}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setNewPatient((p) => ({ ...p, dateOfBirth: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCreatePatient}
                    disabled={patientFormLoading}
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-all"
                  >
                    {patientFormLoading
                      ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Registrando...</>
                      : <><CheckIcon className="w-4 h-4" /> Registrar paciente</>}
                  </button>
                </div>
              )}

              {patients.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {patients.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => setSelectedPatient(patient.id)}
                      className={`p-5 border-2 rounded-2xl transition-all duration-200 text-left ${
                        selectedPatient === patient.id
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <UsersIcon className="w-4 h-4 text-blue-500" />
                        <p className="font-bold text-gray-900">{patient.firstName} {patient.lastName}</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        Nac. {new Date(patient.dateOfBirth + 'T00:00').toLocaleDateString('es-ES')}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                !showPatientForm && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm">
                    <UsersIcon className="w-5 h-5 text-gray-400 shrink-0" />
                    <span>No hay pacientes registrados. Usa <strong>"Registrar hijo"</strong> para agregar uno.</span>
                  </div>
                )
              )}
            </div>

            {/* Step 2 — Therapist */}
            {selectedPatient && (
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-0.5">Paso 2</p>
                <div className="flex items-center gap-2 mb-4">
                  <AcademicCapIcon className="w-5 h-5 text-blue-600" />
                  <span className="text-base sm:text-lg font-bold text-gray-800">Selecciona el terapeuta</span>
                </div>
                {therapists.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {therapists.map((therapist) => (
                      <button
                        key={therapist.id}
                        type="button"
                        onClick={() => {
                          setSelectedTherapist(therapist.id)
                          setSelectedDate(undefined)
                          setSelectedSlot(undefined)
                        }}
                        className={`p-5 border-2 rounded-2xl transition-all duration-200 text-left ${
                          selectedTherapist === therapist.id
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <p className="font-bold text-gray-900">{therapist.fullName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{therapist.bio || 'Terapeuta'}</p>
                        <div className="flex items-center gap-1 mt-1.5">
                          <ClockIcon className="w-3.5 h-3.5 text-blue-500" />
                          <p className="text-xs text-blue-600 font-semibold">
                            Sesiones de {therapist.sessionDurationMinutes} min
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No hay terapeutas disponibles</p>
                )}
              </div>
            )}

            {/* Step 3 — Date */}
            {selectedTherapist && (
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-0.5">Paso 3</p>
                <div className="flex items-center gap-2 mb-4">
                  <CalendarDaysIcon className="w-5 h-5 text-blue-600" />
                  <span className="text-base sm:text-lg font-bold text-gray-800">Selecciona la fecha</span>
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 max-w-sm">
                  {markedDates.length > 0 && (
                    <p className="text-xs text-gray-400 mb-3 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                      Días con disponibilidad
                    </p>
                  )}
                  <Calendar
                    onDateSelect={(date) => { setSelectedDate(date); setSelectedSlot(undefined) }}
                    selectedDate={selectedDate}
                    markedDates={markedDates}
                  />
                </div>
                {markedDates.length === 0 && (
                  <div className="flex items-center gap-2 mt-3 max-w-sm p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                    <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
                    Este terapeuta no tiene disponibilidad registrada aún.
                  </div>
                )}
              </div>
            )}

            {/* Step 4 — Time slot */}
            {selectedDate && (
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-0.5">Paso 4</p>
                <div className="flex items-center gap-2 mb-4">
                  <ClockIcon className="w-5 h-5 text-blue-600" />
                  <span className="text-base sm:text-lg font-bold text-gray-800">Selecciona el horario</span>
                </div>
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-3 border-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                          selectedSlot === slot
                            ? 'border-blue-500 bg-blue-600 text-white shadow-md'
                            : 'border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 p-4 bg-gray-50 rounded-xl border border-gray-100 text-gray-400 text-sm">
                    <InboxIcon className="w-5 h-5" />
                    No hay horarios disponibles para esta fecha
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !selectedPatient || !selectedTherapist || !selectedDate || !selectedSlot}
              className="inline-flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-blue-600 to-black hover:from-blue-800 hover:to-gray-900 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-blue-500/30"
            >
              {loading
                ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Agendando...</>
                : <><CheckIcon className="w-5 h-5" /> Confirmar Cita</>}
            </button>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={cancelTarget !== null}
        title="Cancelar cita"
        message="¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer."
        confirmLabel="Sí, cancelar"
        loading={loading}
        onConfirm={() => cancelTarget && handleCancelAppointment(cancelTarget)}
        onCancel={() => setCancelTarget(null)}
      />

      <RateTherapistModal
        appointment={rateTarget}
        therapistName={rateTarget ? therapistName(rateTarget.therapistId) : ''}
        loading={ratingLoading}
        onSubmit={handleRateTherapist}
        onClose={() => setRateTarget(null)}
      />

      <ProgressViewModal
        appointment={progressView}
        onClose={() => setProgressView(null)}
      />

      <FormSubmissionModal
        submission={submissionView}
        loading={submissionLoading}
        error={submissionError}
        patientName={submissionPatientName}
        onClose={() => {
          setSubmissionView(null)
          setSubmissionError('')
        }}
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

export default ParentAppointments
