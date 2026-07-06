import React, { useEffect, useState } from 'react';
import {
  PlusIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { formsService } from '../services/forms';
import { schedulingService } from '../services/scheduling';
import type { FormTemplate, FormAssignment, Patient, FieldType } from '../types';
import { FIELD_TYPE_LABELS as LABELS } from '../types';

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
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selTemplate, setSelTemplate] = useState('');
  const [selPatient, setSelPatient] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [tpls, asgns, pts] = await Promise.all([
        formsService.getTemplates(),
        formsService.getAllAssignments(),
        schedulingService.getAllPatients().catch(() => [] as Patient[]),
      ]);
      setTemplates(tpls);
      setAssignments(asgns);
      setPatients(pts);
    } finally {
      setLoading(false);
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

  const handleAssign = async () => {
    if (!selTemplate || !selPatient) return;
    setAssigning(true);
    try {
      const a = await formsService.assignTemplate({
        formTemplateId: selTemplate,
        patientId: selPatient,
        notes: assignNotes.trim() || undefined,
      });
      setAssignments((prev) => [a, ...prev]);
      setShowAssignModal(false);
      setSelTemplate('');
      setSelPatient('');
      setAssignNotes('');
    } finally {
      setAssigning(false);
    }
  };

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
            {t === 'templates' ? `Plantillas (${templates.length})` : `Asignaciones (${assignments.length})`}
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

      {/* ── Assignments list ── */}
      {tab === 'assignments' && (
        <div className="space-y-3">
          {assignments.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              No hay asignaciones aún.
            </div>
          )}
          {assignments.map((a) => (
            <div key={a.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div
                className="flex items-center justify-between gap-3 p-5 cursor-pointer"
                onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-xl">
                    <UserIcon className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{a.patientName}</p>
                    <p className="text-xs text-gray-500">{a.formTemplateName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.submissions.length} informe{a.submissions.length !== 1 ? 's' : ''} completado{a.submissions.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {expandedId === a.id
                    ? <ChevronUpIcon className="w-4 h-4 text-gray-400" />
                    : <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                  }
                </div>
              </div>

              {expandedId === a.id && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                  {a.notes && (
                    <p className="text-xs text-gray-500 mb-3 italic">"{a.notes}"</p>
                  )}
                  {a.submissions.length === 0 && (
                    <p className="text-xs text-amber-600">Sin informes completados aún.</p>
                  )}
                  {a.submissions.map((sub) => (
                    <div key={sub.id} className="mb-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        {sub.therapistName} · {new Date(sub.submittedAt).toLocaleDateString('es-MX')}
                      </p>
                      <div className="space-y-1">
                        {sub.answers.map((ans) => (
                          <div key={ans.fieldId} className="flex gap-2 text-xs">
                            <span className="text-gray-500 min-w-[140px] font-medium">{ans.fieldLabel}:</span>
                            <span className="text-gray-900">
                              {ans.fieldType === 4 ? (ans.value === 'true' ? 'Sí' : 'No') : ans.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
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
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Plantilla</label>
                <select
                  value={selTemplate}
                  onChange={(e) => setSelTemplate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">Selecciona una plantilla...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Paciente</label>
                <select
                  value={selPatient}
                  onChange={(e) => setSelPatient(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">Selecciona un paciente...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                  ))}
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
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-sm text-gray-600 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssign}
                disabled={assigning || !selTemplate || !selPatient}
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
