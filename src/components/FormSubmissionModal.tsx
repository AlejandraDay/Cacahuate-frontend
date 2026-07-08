import React from 'react'
import { XMarkIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import type { FormSubmissionResult } from '../types'

interface FormSubmissionModalProps {
  submission: FormSubmissionResult | null
  loading: boolean
  error: string
  onClose: () => void
}

const FormSubmissionModal: React.FC<FormSubmissionModalProps> = ({ submission, loading, error, onClose }) => {
  return (
    <div className={`${submission || loading || error ? 'fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4' : 'hidden'}`} onClick={onClose}>
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
              <h3 className="text-base font-bold text-gray-900">Informe de sesión</h3>
              <p className="text-xs text-gray-500">Detalles del informe de formulario</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-40 text-gray-500">Cargando informe...</div>
        )}

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && !submission && (
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-6 text-sm text-gray-500 text-center">
            No hay informe para mostrar.
          </div>
        )}

        {!loading && submission && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400">Fecha</p>
              <p className="text-sm font-semibold text-gray-900 mt-2">{new Date(submission.submittedAt).toLocaleString('es-ES')}</p>
            </div>

            <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-5">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">Terapeuta</p>
              <p className="text-sm font-semibold text-gray-900">{submission.therapistName}</p>
            </div>

            <div className="space-y-4">
              {submission.answers.map((answer) => (
                <div key={answer.fieldId} className="rounded-3xl bg-gray-50 border border-gray-100 p-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2">{answer.fieldLabel}</p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {answer.fieldType === 4 ? (answer.value === 'true' ? 'Sí' : 'No') : answer.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FormSubmissionModal
