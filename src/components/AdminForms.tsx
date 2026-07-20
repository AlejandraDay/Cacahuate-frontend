import React, { useEffect, useState } from 'react';
import {
  PlusIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { formsService } from '../services/forms';
import { schedulingService } from '../services/scheduling';
import type { FormTemplate, FormAssignment, Patient, FieldType } from '../types';
import { FIELD_TYPE_LABELS as LABELS } from '../types';
import Pager from './Pager';

// ── Field builder row ──────────────────────────────────────────────────────────
interface DraftField {
  label: string;
  type: FieldType;
  options: string;
  isRequired: boolean;
  order: number;
}

const emptyField = (): DraftField => ({
  label: '',
  type: 0,
  options: '',
  isRequired: true,
  order: 0,
});

// ── Main component ─────────────────────────────────────────────────────────────
const AdminForms: React.FC = () => {
  const [tab, setTab] = useState<'templates' | 'assignments'>('templates');

  // Templates state
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplDesc, setTplDesc] = useState('');
  const [fields, setFields] = useState<DraftField[]>([emptyField()]);
  const [saving, setSaving] = useState(false);

  // Assignments state
  const [assignments, setAssignments] = useState<FormAssignment[]>([]);
  const [assignmentsPage, setAssignmentsPage] = useState(1);
  const [assignmentsTotalCount, setAssignmentsTotalCount] = useState(0);
  const [assignmentsTotalPages, setAssignmentsTotalPages] = useState(0);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selTemplate, setSelTemplate] = useState('');
  const [selPatient, setSelPatient] = useState('');
  const [selPatientAssignments, setSelPatientAssignments] = useState<FormAssignment[]>([]);
  const [assignNotes, setAssignNotes] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (tab === 'assignments') loadAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, assignmentsPage]);

  useEffect(() => {
    if (!selPatient) { setSelPatientAssignments([]); return; }
    formsService.getAllAssignments(1, 100, selPatient)
      .then((res) => setSelPatientAssignments(res.items))
      .catch(() => setSelPatientAssignments([]));
  }, [selPatient]);

  const load = async () => {
    setLoading(true);
    try {
      const [tpls, pts] = await Promise.all([
        formsService.getTemplates(),
        schedulingService.getPatientsLookup().catch(() => [] as Patient[]),
      ]);
      setTemplates(tpls);
      setPatients(pts);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    setAssignmentsLoading(true);
    try {
      const res = await formsService.getAllAssignments(assignmentsPage, 20);
      setAssignments(res.items);
      setAssignmentsTotalCount(res.totalCount);
      setAssignmentsTotalPages(res.totalPages);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  // ── Template builder handlers ──────────────────────────────────────────────

  const updateField = (i: number, patch: Partial<DraftField>) =>
    setFields((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));

  const removeField = (i: number) =>
    setFields((prev) => prev.filter((_, idx) => idx !== i));

  const addField = () => setFields((prev) => [...prev, { ...emptyField(), order: prev.length }]);

  const handleSaveTemplate = async () => {
    if (!tplName.trim() || fields.some((f) => !f.label.trim())) return;
    setSaving(true);
    try {
      const payload = {
        name: tplName.trim(),
        description: tplDesc.trim() || undefined,
        fields: fields.map((f, i) => ({
          label: f.label.trim(),
          type: f.type,
          options: f.type === 3 ? f.options.split(',').map((o) => o.trim()).filter(Boolean) : undefined,
          isRequired: f.isRequired,
          order: i,
        })),
      };
      const tpl = await formsService.createTemplate(payload);
      setTemplates((prev) => [tpl, ...prev]);
      setShowBuilder(false);
      setTplName('');
      setTplDesc('');
      setFields([emptyField()]);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    await formsService.deleteTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  // ── Assign handler ─────────────────────────────────────────────────────────

  const assignedTemplateIds = new Set(selPatientAssignments.map((a) => a.formTemplateId));

  const isAlreadyAssigned = selPatient && selTemplate
    ? assignedTemplateIds.has(selTemplate)
    : false;

  const handleAssign = async () => {
    if (!selTemplate || !selPatient) return;
    if (assignedTemplateIds.has(selTemplate)) {
      setAssignError('Este paciente ya tiene esa plantilla asignada.');
      return;
    }
    setAssignError('');
    setAssigning(true);
    try {
      await formsService.assignTemplate({
        formTemplateId: selTemplate,
        patientId: selPatient,
        notes: assignNotes.trim() || undefined,
      });
      setShowAssignModal(false);
      setSelTemplate('');
      setSelPatient('');
      setAssignNotes('');
      setAssignmentsPage(1);
      loadAssignments();
    } finally {
      setAssigning(false);
    }
  };

  const groupedAssignments = (() => {
    const map = new Map<string, { patientId: string; patientName: string; items: FormAssignment[] }>();
    for (const a of assignments) {
      const existing = map.get(a.patientId);
      if (existing) existing.items.push(a);
      else map.set(a.patientId, { patientId: a.patientId, patientName: a.patientName, items: [a] });
    }
    return Array.from(map.values());
  })();

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        Cargando...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Formularios</h2>
          <p className="text-sm text-gray-500 mt-0.5">Crea plantillas y asígnalas a pacientes</p>
        </div>
        <div className="flex gap-2">
          {tab === 'templates' && (
            <button
              onClick={() => setShowBuilder(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow transition"
            >
              <PlusIcon className="w-4 h-4" />
              Nueva plantilla
            </button>
          )}
          {tab === 'assignments' && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow transition"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Asignar formulario
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['templates', 'assignments'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition -mb-px ${
              tab === t
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'templates' ? `Plantillas (${templates.length})` : `Asignaciones (${assignmentsTotalCount})`}
          </button>
        ))}
      </div>

      {/* ── Templates list ── */}
      {tab === 'templates' && (
        <div className="space-y-3">
          {templates.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              No hay plantillas. Crea la primera.
            </div>
          )}
          {templates.map((tpl) => (
            <div key={tpl.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <ClipboardDocumentListIcon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{tpl.name}</p>
                    {tpl.description && <p className="text-xs text-gray-500 mt-0.5">{tpl.description}</p>}
                    <p className="text-xs text-gray-400 mt-1">{tpl.fields.length} campo{tpl.fields.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteTemplate(tpl.id)}
                  className="text-gray-400 hover:text-red-500 transition p-1 rounded-lg hover:bg-red-50"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
              {/* Fields preview */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tpl.fields.map((f) => (
                  <span key={f.id} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                    {f.label} <span className="text-gray-400">· {LABELS[f.type]}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Assignments list (catálogo de formularios por paciente) ── */}
      {tab === 'assignments' && (
        <div className="space-y-3">
          {assignmentsLoading ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Cargando...</div>
          ) : (
          <>
          {groupedAssignments.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              No hay asignaciones aún.
            </div>
          )}
          {groupedAssignments.map((g) => (
            <div key={g.patientId} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-xl">
                  <UserIcon className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{g.patientName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {g.items.length} formulario{g.items.length !== 1 ? 's' : ''} asignado{g.items.length !== 1 ? 's' : ''} · se llena en cada sesión
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {g.items.map((a) => (
                  <span
                    key={a.id}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg"
                    title={a.notes ?? undefined}
                  >
                    {a.formTemplateName}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <Pager page={assignmentsPage} totalPages={assignmentsTotalPages} totalCount={assignmentsTotalCount} onPageChange={setAssignmentsPage} />
          </>
          )}
        </div>
      )}

      {/* ── Template Builder Modal ── */}
      {showBuilder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-extrabold text-gray-900">Nueva plantilla</h3>
              <button onClick={() => setShowBuilder(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nombre de la plantilla *"
                  value={tplName}
                  onChange={(e) => setTplName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <input
                  type="text"
                  placeholder="Descripción (opcional)"
                  value={tplDesc}
                  onChange={(e) => setTplDesc(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-700">Campos del formulario</p>
                  <button
                    onClick={addField}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    <PlusIcon className="w-3.5 h-3.5" /> Agregar campo
                  </button>
                </div>

                <div className="space-y-3">
                  {fields.map((f, i) => (
                    <div key={i} className="border border-gray-200 rounded-xl p-3 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Etiqueta del campo *"
                          value={f.label}
                          onChange={(e) => updateField(i, { label: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                        <select
                          value={f.type}
                          onChange={(e) => updateField(i, { type: Number(e.target.value) as FieldType })}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        >
                          {([0, 1, 2, 3, 4, 5] as FieldType[]).map((t) => (
                            <option key={t} value={t}>{LABELS[t]}</option>
                          ))}
                        </select>
                        {fields.length > 1 && (
                          <button
                            onClick={() => removeField(i)}
                            className="text-gray-400 hover:text-red-500 p-1"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {f.type === 3 && (
                        <input
                          type="text"
                          placeholder="Opciones separadas por coma: Opción 1, Opción 2"
                          value={f.options}
                          onChange={(e) => updateField(i, { options: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      )}

                      <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={f.isRequired}
                          onChange={(e) => updateField(i, { isRequired: e.target.checked })}
                          className="accent-indigo-600 w-3.5 h-3.5"
                        />
                        Campo obligatorio
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 pb-6">
              <button
                onClick={() => setShowBuilder(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={saving || !tplName.trim() || fields.some((f) => !f.label.trim())}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow transition"
              >
                {saving ? 'Guardando...' : 'Guardar plantilla'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Modal ── */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-extrabold text-gray-900">Asignar formulario</h3>
              <button
                onClick={() => { setShowAssignModal(false); setAssignError(''); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Paciente</label>
                <select
                  value={selPatient}
                  onChange={(e) => { setSelPatient(e.target.value); setAssignError(''); }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">Selecciona un paciente...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Plantilla</label>
                <select
                  value={selTemplate}
                  onChange={(e) => { setSelTemplate(e.target.value); setAssignError(''); }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">Selecciona una plantilla...</option>
                  {templates.map((t) => {
                    const alreadyAssigned = selPatient ? assignedTemplateIds.has(t.id) : false;
                    return (
                      <option key={t.id} value={t.id} disabled={alreadyAssigned}>
                        {t.name}{alreadyAssigned ? ' (ya asignada a este paciente)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Instrucciones (opcional)</label>
                <textarea
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  rows={2}
                  placeholder="Notas para el terapeuta..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>
              {(assignError || isAlreadyAssigned) && (
                <p className="text-xs text-red-600 font-medium">
                  {assignError || 'Este paciente ya tiene esa plantilla asignada.'}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button
                onClick={() => { setShowAssignModal(false); setAssignError(''); }}
                className="px-4 py-2 text-sm text-gray-600 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssign}
                disabled={assigning || !selTemplate || !selPatient || isAlreadyAssigned}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow transition"
              >
                {assigning ? 'Asignando...' : 'Asignar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminForms;
