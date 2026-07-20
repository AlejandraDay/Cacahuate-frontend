import React, { useEffect, useState } from 'react';
import { ClipboardDocumentListIcon, UserIcon } from '@heroicons/react/24/outline';
import { formsService } from '../services/forms';
import type { FormAssignment } from '../types';

interface PatientGroup {
  patientId: string;
  patientName: string;
  assignments: FormAssignment[];
}

const groupByPatient = (assignments: FormAssignment[]): PatientGroup[] => {
  const map = new Map<string, PatientGroup>();
  for (const a of assignments) {
    const existing = map.get(a.patientId);
    if (existing) existing.assignments.push(a);
    else map.set(a.patientId, { patientId: a.patientId, patientName: a.patientName, assignments: [a] });
  }
  return Array.from(map.values());
};

const TherapistPatientForms: React.FC = () => {
  const [assignments, setAssignments] = useState<FormAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    formsService
      .getMyAssignments()
      .then(setAssignments)
      .catch(() => setError('No se pudieron cargar los formularios de tus pacientes.'))
      .finally(() => setLoading(false));
  }, []);

  const groups = groupByPatient(assignments);

  if (loading) return <div className="text-center py-12 text-gray-400 text-sm">Cargando formularios...</div>;

  if (error) return <div className="text-center py-12 text-red-500 text-sm">{error}</div>;

  return (
    <div className="space-y-3">
      {groups.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          No tienes formularios asignados a tus pacientes por ahora.
        </div>
      )}

      {groups.map((g) => (
        <div key={g.patientId} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-50 rounded-xl">
              <UserIcon className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{g.patientName}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {g.assignments.length} formulario{g.assignments.length !== 1 ? 's' : ''} · se llena en cada sesión
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {g.assignments.map((a) => (
              <span
                key={a.id}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg"
                title={a.notes ?? undefined}
              >
                <ClipboardDocumentListIcon className="w-3.5 h-3.5 text-gray-400" />
                {a.formTemplateName}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TherapistPatientForms;
