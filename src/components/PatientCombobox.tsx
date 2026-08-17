import React, { useEffect, useRef, useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { schedulingService } from '../services/scheduling';
import type { Patient } from '../types';

interface PatientComboboxProps {
  value: string;
  onChange: (patientId: string, patient: Patient | null) => void;
  placeholder?: string;
  allowAll?: boolean;
  disabled?: boolean;
}

const PatientCombobox: React.FC<PatientComboboxProps> = ({
  value,
  onChange,
  placeholder = 'Buscar paciente...',
  allowAll = false,
  disabled = false,
}) => {
  const [query, setQuery] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(async () => {
      try {
        setLoading(true);
        const result = await schedulingService.getAllPatients(1, 8, query.trim() || undefined);
        setResults(result.items);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query, open]);

  useEffect(() => {
    if (!value) setSelectedLabel('');
  }, [value]);

  const handleSelect = (p: Patient) => {
    setSelectedLabel(`${p.firstName} ${p.lastName}`);
    setQuery('');
    setOpen(false);
    onChange(p.id, p);
  };

  const handleClear = () => {
    setSelectedLabel('');
    setQuery('');
    setOpen(false);
    onChange('', null);
  };

  const displayValue = open ? query : selectedLabel || (allowAll && !value ? 'Todos' : '');

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => !disabled && setOpen(true)}
        className={`flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus-within:ring-2 focus-within:ring-blue-400 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'
        }`}
      >
        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          disabled={disabled}
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none min-w-0 disabled:cursor-not-allowed"
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleClear(); }}
            className="text-gray-400 hover:text-gray-600 shrink-0"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
        <ChevronDownIcon className="w-4 h-4 text-gray-300 shrink-0" />
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {allowAll && (
            <button
              type="button"
              onClick={handleClear}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${!value ? 'font-semibold text-blue-600' : 'text-gray-700'}`}
            >
              Todos
            </button>
          )}
          {loading ? (
            <p className="px-3 py-2 text-xs text-gray-400">Buscando...</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-400">Sin resultados.</p>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect(p)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${p.id === value ? 'font-semibold text-blue-600' : 'text-gray-700'}`}
              >
                {p.firstName} {p.lastName}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PatientCombobox;
