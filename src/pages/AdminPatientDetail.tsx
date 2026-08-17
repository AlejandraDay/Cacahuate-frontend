import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  UserIcon,
  CalendarDaysIcon,
  ClockIcon,
  ClipboardDocumentListIcon,
  CheckBadgeIcon,
  StarIcon,
  FunnelIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import AdminLayout from '../components/AdminLayout';
import ReportsMenu from '../components/ReportsMenu';
import Pager from '../components/Pager';
import FormSubmissionModal from '../components/FormSubmissionModal';
import ProgressViewModal from '../components/ProgressViewModal';
import { schedulingService } from '../services/scheduling';
import { formsService } from '../services/forms';
import type { Appointment, Patient, FormAssignment, FormSubmissionResult, NameLookup } from '../types';

const toLocalDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d);
};

const statusStr = (status: unknown): string => {
  if (typeof status === 'number') {
    return ['pending', 'confirmed', 'cancelled', 'completed', 'enroute', 'inprogress'][status] ?? '';
  }
  return String(status ?? '').toLowerCase().replace('_', '');
};

const statusLabel = (status: unknown): string => {
  if (typeof status === 'number') {
    return ['Pendiente', 'Confirmada', 'Cancelada', 'Completada', 'En camino', 'En curso'][status] ?? String(status);
  }
  const s = String(status ?? '').toLowerCase();
  if (s === 'enroute') return 'En camino';
  if (s === 'inprogress') return 'En curso';
  return String(status ?? '');
};

const statusClasses = (status: unknown) => {
  const s = statusStr(status);
  if (s === 'completed') return 'bg-blue-50 text-blue-700 border-blue-100';
  if (s === 'confirmed') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (s === 'pending') return 'bg-amber-50 text-amber-700 border-amber-100';
  if (s === 'enroute') return 'bg-orange-50 text-orange-700 border-orange-100';
  if (s === 'inprogress') return 'bg-green-50 text-green-700 border-green-100';
  return 'bg-red-50 text-red-700 border-red-100';
};

const renderRatingStars = (stars?: number) => {
  const count = Math.max(0, Math.min(5, stars ?? 0));
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) =>
        i < count ? (
          <StarIconSolid key={i} className="w-4 h-4 text-amber-500" />
        ) : (
          <StarIcon key={i} className="w-4 h-4 text-gray-200" />
        )
      )}
    </span>
  );
};

const renderSignatures = (apt: Appointment) => (
  <div className="flex items-center gap-1.5">
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold ${
        apt.therapistSignature ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'
      }`}
      title={apt.therapistSignature ? `Firmado el ${apt.therapistSignedAt ? new Date(apt.therapistSignedAt).toLocaleDateString('es-ES') : ''}` : 'El terapeuta aún no ha firmado'}
    >
      Terapeuta {apt.therapistSignature ? '✓' : '—'}
    </span>
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold ${
        apt.parentSignature ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'
      }`}
      title={apt.parentSignature ? `Firmado el ${apt.parentSignedAt ? new Date(apt.parentSignedAt).toLocaleDateString('es-ES') : ''}` : 'El tutor aún no ha firmado'}
    >
      Tutor {apt.parentSignature ? '✓' : '—'}
    </span>
  </div>
);

type SectionTab = 'resumen' | 'citas';

const AdminPatientDetail: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const [section, setSection] = useState<SectionTab>('resumen');

  const [patient, setPatient] = useState<Patient | null>(null);
  const [assignments, setAssignments] = useState<FormAssignment[]>([]);
  const [therapistOptions, setTherapistOptions] = useState<NameLookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsPage, setAppointmentsPage] = useState(1);
  const [appointmentsPageSize, setAppointmentsPageSize] = useState(10);
  const [appointmentsTotalCount, setAppointmentsTotalCount] = useState(0);
  const [appointmentsTotalPages, setAppointmentsTotalPages] = useState(0);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  const [therapistFilter, setTherapistFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [progressView, setProgressView] = useState<Appointment | null>(null);
  const [submissionView, setSubmissionView] = useState<FormSubmissionResult | null>(null);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState('');

  useEffect(() => {
    if (!patientId) return;
    (async () => {
      try {
        setLoading(true);
        const [p, assignmentsRes, therapists] = await Promise.all([
          schedulingService.getPatientById(patientId),
          formsService.getAllAssignments(1, 100, patientId),
          schedulingService.getTherapistsForPatient(patientId),
        ]);
        setPatient(p);
        setAssignments(assignmentsRes.items);
        setTherapistOptions(therapists);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando el paciente');
        setPatient(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId]);

  useEffect(() => {
    if (!patientId) return;
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, appointmentsPage, appointmentsPageSize, therapistFilter, statusFilter, dateFrom, dateTo]);

  const loadAppointments = async () => {
    if (!patientId) return;
    try {
      setAppointmentsLoading(true);
      const result = await schedulingService.getAllAppointments({
        page: appointmentsPage,
        pageSize: appointmentsPageSize,
        patientId,
        therapistId: therapistFilter !== 'all' ? therapistFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setAppointments(result.items);
      setAppointmentsTotalCount(result.totalCount);
      setAppointmentsTotalPages(result.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando las citas');
      setAppointments([]);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const resetFilters = () => {
    setTherapistFilter('all');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setAppointmentsPage(1);
  };

  const handleOpenSubmission = async (submissionId: string) => {
    try {
      setSubmissionLoading(true);
      setSubmissionError('');
      const submission = await formsService.getSubmission(submissionId);
      setSubmissionView(submission);
    } catch (err) {
      setSubmissionError(err instanceof Error ? err.message : 'No se pudo cargar el informe');
      setSubmissionView(null);
    } finally {
      setSubmissionLoading(false);
    }
  };

  return (
    <AdminLayout>
      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Cargando...</div>
      ) : error ? (
        <>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 font-medium mb-3"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Volver
          </button>
          <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">{error}</div>
        </>
      ) : !patient ? (
        <div className="text-center py-16 text-gray-400 text-sm">Paciente no encontrado.</div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col gap-4">
          {/* Header */}
          <div className="shrink-0 bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors shrink-0"
              aria-label="Volver"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div className="p-3 bg-blue-50 rounded-2xl">
              <UserIcon className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">{patient.firstName} {patient.lastName}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Nacimiento: {new Date(patient.dateOfBirth).toLocaleDateString('es-ES')}
                {patient.parentName && ` · Tutor: ${patient.parentName}`}
              </p>
              {patient.notes && <p className="text-xs text-gray-400 mt-1 italic">"{patient.notes}"</p>}
            </div>
          </div>

          {/* Section tabs */}
          <div className="shrink-0 flex gap-1 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setSection('resumen')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 font-semibold text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                section === 'resumen' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Squares2X2Icon className="w-4 h-4" />
              Resumen
            </button>
            <button
              onClick={() => setSection('citas')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 font-semibold text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                section === 'citas' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <CalendarDaysIcon className="w-4 h-4" />
              Citas ({appointmentsTotalCount || '...'})
            </button>
          </div>

          {section === 'resumen' && (
            /* Formularios asignados */
            <div className="shrink-0 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <ClipboardDocumentListIcon className="w-4 h-4 text-indigo-500" />
                Formularios asignados
              </h2>
              {assignments.length === 0 ? (
                <p className="text-sm text-gray-400">Sin formularios asignados.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {assignments.map((a) => (
                    <span key={a.id} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg" title={a.notes ?? undefined}>
                      {a.formTemplateName}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {section === 'citas' && (
            <div className="flex-1 min-h-0 flex flex-col gap-4">
              {/* Filtros */}
              <div className="shrink-0 bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FunnelIcon className="w-4 h-4 text-blue-500" />
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Filtros</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Terapeuta</label>
                    <select
                      value={therapistFilter}
                      onChange={(e) => { setTherapistFilter(e.target.value); setAppointmentsPage(1); }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="all">Todos</option>
                      {therapistOptions.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Estado</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => { setStatusFilter(e.target.value); setAppointmentsPage(1); }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="all">Todos</option>
                      <option value="Pending">Pendiente</option>
                      <option value="Confirmed">Confirmada</option>
                      <option value="Completed">Completada</option>
                      <option value="Cancelled">Cancelada</option>
                      <option value="EnRoute">En camino</option>
                      <option value="InProgress">En curso</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Desde</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => { setDateFrom(e.target.value); setAppointmentsPage(1); }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Hasta</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => { setDateTo(e.target.value); setAppointmentsPage(1); }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>
                {(therapistFilter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo) && (
                  <button
                    onClick={resetFilters}
                    className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>

              {/* Historial de citas */}
              <div className="flex-1 min-h-0 flex flex-col bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="shrink-0 px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                    <CalendarDaysIcon className="w-4 h-4 text-blue-500" />
                    Historial de citas ({appointmentsTotalCount})
                  </h2>
                </div>
                {appointmentsLoading ? (
                  <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Cargando...</div>
                ) : appointments.length === 0 ? (
                  <p className="text-sm text-gray-400 p-6">Ninguna cita coincide con los filtros.</p>
                ) : (
                  <div className="flex-1 min-h-0 flex flex-col">
                    <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-100">
                      {appointments.map((apt) => (
                        <div key={apt.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {toLocalDate(apt.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                              <ClockIcon className="w-3.5 h-3.5" />
                              {apt.startTime} — {apt.endTime} ·{' '}
                              <button
                                onClick={() => navigate(`/admin/therapists/${apt.therapistId}`)}
                                className="hover:text-blue-600 hover:underline"
                              >
                                {apt.therapistName || apt.therapistId}
                              </button>
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-semibold border ${statusClasses(apt.status)}`}>
                                {statusLabel(apt.status)}
                              </span>
                              {renderSignatures(apt)}
                              {apt.ratingStars != null && renderRatingStars(apt.ratingStars)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {apt.progressUpdatedAt && (
                              <button
                                onClick={() => setProgressView(apt)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                              >
                                <CheckBadgeIcon className="w-4 h-4" />
                                Ver progreso
                              </button>
                            )}
                            {apt.formSubmissionIds && apt.formSubmissionIds.length > 0 && (
                              <ReportsMenu submissionIds={apt.formSubmissionIds} onSelect={handleOpenSubmission} disabled={submissionLoading} />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="shrink-0 px-4">
                      <Pager
                        page={appointmentsPage}
                        totalPages={appointmentsTotalPages}
                        totalCount={appointmentsTotalCount}
                        onPageChange={setAppointmentsPage}
                        pageSize={appointmentsPageSize}
                        onPageSizeChange={(size) => { setAppointmentsPageSize(size); setAppointmentsPage(1); }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <ProgressViewModal appointment={progressView} onClose={() => setProgressView(null)} />

      <FormSubmissionModal
        submission={submissionView}
        loading={submissionLoading}
        error={submissionError}
        patientName={patient ? `${patient.firstName} ${patient.lastName}` : undefined}
        onClose={() => {
          setSubmissionView(null);
          setSubmissionError('');
        }}
      />
    </AdminLayout>
  );
};

export default AdminPatientDetail;
