import React, { useState, useRef, useEffect } from 'react';
import { PencilIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SignatureModalProps {
  appointmentId: string;
  userName: string;
  onSubmit: (appointmentId: string, signature: string) => Promise<void>;
  onClose: () => void;
}

const SignatureModal: React.FC<SignatureModalProps> = ({
  appointmentId,
  userName,
  onSubmit,
  onClose,
}) => {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const matches = value.trim().toLowerCase() === userName.trim().toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matches) return;
    setLoading(true);
    setError('');
    try {
      await onSubmit(appointmentId, value.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al firmar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
              <PencilIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Firma de constancia</p>
              <p className="text-xs text-gray-400">Escribe tu nombre completo tal como está registrado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Instruction */}
          <div className="bg-gray-50 rounded-2xl px-4 py-3">
            <p className="text-xs text-gray-500 mb-0.5">Tu nombre registrado</p>
            <p className="text-sm font-bold text-gray-800">{userName}</p>
          </div>

          {/* Signature input */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Escribe tu nombre para firmar
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => { setValue(e.target.value); setError(''); }}
                placeholder={userName}
                className={`w-full px-4 py-3 border rounded-xl text-sm font-medium transition-all duration-150 outline-none pr-10
                  ${matches && value
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-200'
                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400'
                  }`}
                style={{ fontFamily: "'Georgia', serif", fontSize: '15px', letterSpacing: '0.02em' }}
                autoComplete="off"
              />
              {matches && value && (
                <CheckCircleIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
              )}
            </div>

            {/* Live feedback */}
            <div className="mt-1.5 h-4">
              {value && !matches && (
                <p className="text-xs text-red-500">
                  El nombre no coincide exactamente
                </p>
              )}
              {matches && value && (
                <p className="text-xs text-emerald-600 font-medium">
                  Nombre verificado — puedes firmar
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Legal note */}
          <p className="text-xs text-gray-400 leading-relaxed">
            Al firmar confirmas que tuviste conocimiento de esta cita y que la información registrada es correcta.
          </p>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!matches || !value || loading}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
            >
              {loading ? 'Firmando...' : 'Firmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignatureModal;
