import React, { useState } from 'react'
import { StarIcon } from '@heroicons/react/24/solid'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { Appointment } from '../types'

interface RateTherapistModalProps {
  appointment: Appointment | null
  therapistName: string
  loading?: boolean
  onSubmit: (stars: number, comment: string) => void
  onClose: () => void
}

const RateTherapistModal: React.FC<RateTherapistModalProps> = ({
  appointment,
  therapistName,
  loading = false,
  onSubmit,
  onClose,
}) => {
  const [stars, setStars] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')

  if (!appointment) return null

  const handleClose = () => {
    setStars(0)
    setHovered(0)
    setComment('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4" onClick={handleClose}>
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Califica a tu terapeuta</h3>
            <p className="text-xs text-gray-500">{therapistName}</p>
          </div>
          <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 mb-5">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onMouseEnter={() => setHovered(value)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setStars(value)}
              className="transition-transform hover:scale-110"
            >
              <StarIcon
                className={`w-9 h-9 ${
                  value <= (hovered || stars) ? 'text-amber-400' : 'text-gray-200'
                }`}
              />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="Cuéntanos cómo fue tu experiencia (opcional)..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSubmit(stars, comment)}
            disabled={loading || stars === 0}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar calificación'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RateTherapistModal
