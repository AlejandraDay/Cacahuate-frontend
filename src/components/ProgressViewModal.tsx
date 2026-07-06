import React from 'react'
import { ClipboardDocumentListIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { Appointment } from '../types'

interface ProgressViewModalProps {
  appointment: Appointment | null
  onClose: () => void
}

const PARTICIPATION_LABELS = ['Baja', 'Media', 'Alta']

const SECTIONS: { key: keyof Appointment; label: string }[] = [
  { key: 'progressObjectives', label: 'Objetivos trabajados' },
  { key: 'progressBehavior', label: 'Comportamiento y regulación emocional' },
  { key: 'progressCommunication', label: 'Comunicación' },
  { key: 'progressSocialInteraction', label: 'Interacción social' },
  { key: 'progressSensoryResponse', label: 'Respuesta sensorial' },
  { key: 'progressAchievements', label: 'Logros de la sesión' },
  { key: 'progressAreasToReinforce', label: 'Áreas a reforzar' },
  { key: 'progressRecommendations', label: 'Recomendaciones para los padres' },
  { key: 'progressNotes', label: 'Notas generales' },
]

const ProgressViewModal: React.FC<ProgressViewModalProps> = ({ appointment, onClose }) => {
  if (!appointment) return null

  const filledSections = SECTIONS.filter((s) => Boolean((appointment[s.key] as string)?.trim()))

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50">
              <ClipboardDocumentListIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Progreso de la sesión</h3>
              <p className="text-xs text-gray-500">{appointment.patientName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {appointment.progressParticipationLevel !== undefined && appointment.progressParticipationLevel !== null && (
          <div className="mb-5">
            <p className="text-xs font-bold text-gray-700 mb-1.5">Nivel de participación</p>
            <span className="inline-flex px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl text-sm font-semibold">
              {PARTICIPATION_LABELS[appointment.progressParticipationLevel] ?? 'N/A'}
            </span>
          </div>
        )}

        {filledSections.length > 0 ? (
          <div className="space-y-4">
            {filledSections.map(({ key, label }) => (
              <div key={key}>
                <p className="text-xs font-bold text-gray-700 mb-1">{label}</p>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 whitespace-pre-wrap">
                  {appointment[key] as string}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">
            El terapeuta aún no ha registrado el progreso de esta sesión.
          </p>
        )}
      </div>
    </div>
  )
}

export default ProgressViewModal
