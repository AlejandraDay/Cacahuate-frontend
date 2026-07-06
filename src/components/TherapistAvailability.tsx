import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { schedulingService } from '../services/scheduling'
import type { TherapistAvailability as AvailabilityBlock } from '../types'
import Calendar from './Calendar'
import ConfirmDialog from './ConfirmDialog'

const TherapistAvailability: React.FC = () => {
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<'add' | 'calendar'>('add')

  // ── Add form state ──────────────────────────────────────────────
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [sessionDuration, setSessionDuration] = useState(60)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ── Calendar view state ─────────────────────────────────────────
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([])
  const [blocksLoading, setBlocksLoading] = useState(false)
  const [blocksError, setBlocksError] = useState('')
  const [selectedCalDate, setSelectedCalDate] = useState<Date | undefined>(undefined)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AvailabilityBlock | null>(null)

  const loadBlocks = async () => {
    try {
      setBlocksLoading(true)
      const data = await schedulingService.getMyAvailability()
      setBlocks(data)
      setBlocksError('')
    } catch {
      setBlocksError('No se pudo cargar la disponibilidad')
    } finally {
      setBlocksLoading(false)
    }
  }

  useEffect(() => {
    if (viewMode === 'calendar') loadBlocks()
  }, [viewMode, user?.id])

  // ── Slot calculator ─────────────────────────────────────────────
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

  const previewSlots = calcSlots(startTime, endTime, sessionDuration)

  // ── Submit new block ────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date) { setError('Selecciona una fecha'); return }
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    if (sh * 60 + sm >= eh * 60 + em) {
      setError('La hora de inicio debe ser anterior a la hora de fin'); return
    }
    if (sessionDuration > (eh * 60 + em) - (sh * 60 + sm)) {
      setError('La duración de sesión supera el bloque horario'); return
    }
    try {
      setLoading(true)
      await schedulingService.createAvailability({ date, startTime, endTime, sessionDurationMinutes: sessionDuration })
      setError('')
      setSuccess(`Disponibilidad agregada para el ${new Date(date + 'T00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`)
      setTimeout(() => setSuccess(''), 4000)
      setDate('')
      setStartTime('09:00')
      setEndTime('17:00')
      setSessionDuration(60)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar disponibilidad')
    } finally {
      setLoading(false)
    }
  }

  // ── Delete block ────────────────────────────────────────────────
  const handleDelete = async (block: AvailabilityBlock) => {
    try {
      setDeleting(block.id)
      await schedulingService.deleteAvailability(block.id)
      setBlocks((prev) => prev.filter((b) => b.id !== block.id))
      if (selectedCalDate) {
        const remaining = blocks.filter((b) => b.id !== block.id && b.date === block.date)
        if (remaining.length === 0) setSelectedCalDate(undefined)
      }
    } catch {
      setBlocksError('No se pudo eliminar el bloque')
    } finally {
      setDeleting(null)
      setDeleteTarget(null)
    }
  }

  // ── Calendar helpers ────────────────────────────────────────────
  const markedDates = blocks.map((b) => {
    const [y, m, d] = b.date.split('-').map(Number)
    return new Date(y, m - 1, d)
  })

  const selectedBlock = selectedCalDate
    ? blocks.find((b) => {
        const [y, m, d] = b.date.split('-').map(Number)
        return (
          y === selectedCalDate.getFullYear() &&
          m - 1 === selectedCalDate.getMonth() &&
          d === selectedCalDate.getDate()
        )
      })
    : undefined

  const inputClass =
    'w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 shadow-sm'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-gray-800 mb-1">
          Mi Disponibilidad
        </h2>
        <p className="text-gray-500 text-sm">Gestiona los bloques de tiempo para citas</p>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setViewMode('add')}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              viewMode === 'add' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            + Agregar
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              viewMode === 'calendar' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Ver calendario
          </button>
        </div>
      </div>

      {/* ── ADD VIEW ─────────────────────────────────────────────── */}
      {viewMode === 'add' && (
        <>
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">⚠️ {error}</div>
          )}
          {success && (
            <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-200">✅ {success}</div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="bg-white rounded-3xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 p-8">
              <h3 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold">+</span>
                Agregar Bloque de Disponibilidad
              </h3>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Fecha</label>
                  <input
                    type="date"
                    value={date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDate(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Hora inicio</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Hora fin</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Duración por sesión</label>
                  <div className="flex gap-2">
                    {[30, 45, 60, 90].map((min) => (
                      <button
                        key={min}
                        type="button"
                        onClick={() => setSessionDuration(min)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                          sessionDuration === min
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {min}min
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold transition-colors shadow-sm"
                >
                  {loading ? 'Guardando...' : 'Agregar disponibilidad'}
                </button>
              </form>
            </div>

            {/* Slot Preview */}
            <div className="bg-white rounded-3xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 p-8">
              <h3 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-gray-500 text-sm">⏱</span>
                Vista previa de horarios
              </h3>

              {previewSlots.length > 0 ? (
                <>
                  <p className="text-xs text-gray-500 mb-3">
                    Se generarán <span className="font-bold text-gray-800">{previewSlots.length} slots</span> de {sessionDuration} minutos
                  </p>
                  <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                    {previewSlots.map((slot) => (
                      <div key={slot} className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-semibold text-slate-700">
                        {slot}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                  <div className="text-4xl mb-3">🕐</div>
                  <p className="text-sm">Configura el bloque horario para ver los slots disponibles</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── CALENDAR VIEW ────────────────────────────────────────── */}
      {viewMode === 'calendar' && (
        <>
          {blocksError && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">⚠️ {blocksError}</div>
          )}

          {blocksLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-100 border-t-slate-500 mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">Cargando disponibilidad...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Calendar */}
              <div className="bg-white rounded-3xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 p-8">
                <p className="text-xs text-gray-400 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>
                  Días con disponibilidad asignada
                </p>
                <Calendar
                  onDateSelect={(d) => setSelectedCalDate(d)}
                  selectedDate={selectedCalDate}
                  markedDates={markedDates}
                  disablePast={false}
                />
              </div>

              {/* Block details */}
              <div className="bg-white rounded-3xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 p-8">
                {selectedCalDate ? (
                  selectedBlock ? (
                    <div className="space-y-5">
                      <div>
                        <h3 className="text-base font-bold text-gray-800">
                          {selectedCalDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </h3>
                        <p className="text-sm text-blue-600 font-semibold mt-1">
                          {selectedBlock.startTime} – {selectedBlock.endTime} · {selectedBlock.sessionDurationMinutes} min/sesión
                        </p>
                      </div>

                      {/* Slots grid */}
                      {(() => {
                        const rawSlots = selectedBlock.availableSlots ?? selectedBlock.slots ?? []
                        const slots =
                          rawSlots.length > 0
                            ? rawSlots.map((s) => ({ time: s.startTime, available: s.isAvailable }))
                            : calcSlots(selectedBlock.startTime, selectedBlock.endTime, selectedBlock.sessionDurationMinutes).map((t) => ({ time: t, available: true }))
                        return (
                          <>
                            <p className="text-xs text-gray-500">
                              <span className="font-bold text-gray-700">{slots.filter((s) => s.available).length}</span> slots disponibles de {slots.length} totales
                            </p>
                            <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto">
                              {slots.map((s) => (
                                <div
                                  key={s.time}
                                  className={`py-2 px-2 rounded-xl text-center text-sm font-semibold border ${
                                    s.available
                                      ? 'bg-blue-50 border-blue-100 text-blue-700'
                                      : 'bg-gray-100 border-gray-200 text-gray-400 line-through'
                                  }`}
                                >
                                  {s.time}
                                </div>
                              ))}
                            </div>
                          </>
                        )
                      })()}

                      <button
                        onClick={() => setDeleteTarget(selectedBlock)}
                        disabled={deleting === selectedBlock.id}
                        className="w-full py-2.5 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold transition-all duration-200"
                      >
                        {deleting === selectedBlock.id ? '⏳ Eliminando...' : '🗑 Eliminar este bloque'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center text-gray-400">
                      <div className="text-4xl mb-3">📭</div>
                      <p className="text-sm">No hay disponibilidad para este día</p>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center text-gray-400">
                    <div className="text-4xl mb-3">👆</div>
                    <p className="text-sm">Selecciona un día en el calendario<br />para ver los detalles</p>
                    {blocks.length > 0 && (
                      <p className="text-xs text-blue-500 mt-3">
                        Tienes disponibilidad en <span className="font-bold">{blocks.length}</span> {blocks.length === 1 ? 'día' : 'días'}
                      </p>
                    )}
                    {blocks.length === 0 && (
                      <p className="text-xs text-gray-400 mt-3">
                        Aún no tienes bloques asignados. Ve a <strong>Agregar</strong> para crear uno.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar disponibilidad"
        message={deleteTarget ? `¿Eliminar disponibilidad del ${deleteTarget.date}?` : ''}
        confirmLabel="Sí, eliminar"
        loading={deleting !== null}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default TherapistAvailability
