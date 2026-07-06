import React, { useState, useEffect } from 'react'
import { ClipboardDocumentListIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { Appointment, ProgressData } from '../types'

interface ProgressNotesModalProps {
  appointment: Appointment | null
  loading?: boolean
  onSave: (data: ProgressData) => void
  onClose: () => void
}

const PARTICIPATION_LEVELS = [
  { value: 0, label: 'Baja' },
  { value: 1, label: 'Media' },
  { value: 2, label: 'Alta' },
]

const FIELDS: { key: keyof Omit<ProgressData, 'participationLevel'>; label: string; placeholder: string }[] = [
  { key: 'objectives', label: 'Objetivos trabajados', placeholder: 'Ej: Contacto visual, seguimiento de instrucciones simples...' },
  { key: 'behavior', label: 'Comportamiento y regulación emocional', placeholder: 'Ej: Mostró episodios de frustración al cambiar de actividad...' },
  { key: 'communication', label: 'Comunicación', placeholder: 'Ej: Usó frases de 2 palabras para pedir ayuda...' },
  { key: 'socialInteraction', label: 'Interacción social', placeholder: 'Ej: Inició contacto con el terapeuta al recibir un refuerzo...' },
  { key: 'sensoryResponse', label: 'Respuesta sensorial', placeholder: 'Ej: Sensibilidad a sonidos fuertes, buscó estimulación táctil...' },
  { key: 'achievements', label: 'Logros de la sesión', placeholder: 'Ej: Completó la actividad de clasificación sin apoyo...' },
  { key: 'areasToReinforce', label: 'Áreas a reforzar', placeholder: 'Ej: Tolerancia a la espera, transición entre actividades...' },
  { key: 'recommendations', label: 'Recomendaciones para los padres', placeholder: 'Ej: Practicar la rutina de saludo en casa...' },
  { key: 'progressNotes', label: 'Notas generales', placeholder: 'Observaciones adicionales sobre la sesión...' },
]

const emptyData: ProgressData = {
  progressNotes: '',
  objectives: '',
  behavior: '',
  communication: '',
  socialInteraction: '',
  sensoryResponse: '',
  achievements: '',
  areasToReinforce: '',
  recommendations: '',
  participationLevel: undefined,
}

const ProgressNotesModal: React.FC<ProgressNotesModalProps> = ({
  appointment,
  loading = false,
  onSave,
  onClose,
}) => {
  const [data, setData] = useState<ProgressData>(emptyData)

  useEffect(() => {
    if (!appointment) return
    setData({
      progressNotes: appointment.progressNotes ?? '',
      objectives: appointment.progressObjectives ?? '',
      behavior: appointment.progressBehavior ?? '',
      communication: appointment.progressCommunication ?? '',
      socialInteraction: appointment.progressSocialInteraction ?? '',
      sensoryResponse: appointment.progressSensoryResponse ?? '',
      achievements: appointment.progressAchievements ?? '',
      areasToReinforce: appointment.progressAreasToReinforce ?? '',
      recommendations: appointment.progressRecommendations ?? '',
      participationLevel: appointment.progressParticipationLevel,
    })
  }, [appointment])

  if (!appointment) return null

  const setField = (key: keyof ProgressData, value: string) =>
    setData((prev) => ({ ...prev, [key]: value }))

  const hasContent = Object.entries(data).some(([key, value]) =>
    key === 'participationLevel' ? value !== undefined : Boolean((value as string)?.trim())
  )

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5 sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50">
              <ClipboardDocumentListIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Ficha de progreso de la sesión</h3>
              <p className="text-xs text-gray-500">{appointment.patientName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Nivel de participación</label>
            <div className="flex gap-2">
              {PARTICIPATION_LEVELS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setData((prev) => ({ ...prev, participationLevel: value }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                    data.participationLevel === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-500 hover:border-blue-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {FIELDS.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">{label}</label>
              <textarea
                value={(data[key] as string) ?? ''}
                onChange={(e) => setField(key, e.target.value)}
                rows={2}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSave(data)}
            disabled={loading || !hasContent}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar progreso'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProgressNotesModal
