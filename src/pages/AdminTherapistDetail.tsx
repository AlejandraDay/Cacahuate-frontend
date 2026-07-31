import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  StarIcon,
  FunnelIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import AdminLayout from '../components/AdminLayout';
import Pager from '../components/Pager';
import ReportsMenu from '../components/ReportsMenu';
import FormSubmissionModal from '../components/FormSubmissionModal';
import { schedulingService } from '../services/scheduling';
import { formsService } from '../services/forms';
import type { Appointment, Therapist, TherapistRating, TherapistPatientSummary, NameLookup, FormSubmissionResult } from '../types';

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

const renderStars = (stars: number) => (
  <span className="inline-flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) =>
      i < stars ? (
        <StarIconSolid key={i} className="w-4 h-4 text-amber-500" />
      ) : (
        <StarIcon key={i} className="w-4 h-4 text-gray-200" />
      )
    )}
  </span>
);

type SectionTab = 'resumen' | 'citas';

const AdminTherapistDetail: React.FC = () => {
  const { therapistId } = useParams<{ therapistId: string }>();
  const navigate = useNavigate();

  const [section, setSection] = useState<SectionTab>('resumen');

  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [ratings, setRatings] = useState<TherapistRating[]>([]);
  const [ratingsPage, setRatingsPage] = useState(1);
  const [ratingsPageSize, setRatingsPageSize] = useState(10);
  const [ratingsTotalCount, setRatingsTotalCount] = useState(0);
  const [ratingsTotalPages, setRatingsTotalPages] = useState(0);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [averageStars, setAverageStars] = useState<number | null>(null);
  const [patientSummaries, setPatientSummaries] = useState<TherapistPatientSummary[]>([]);
  const [patientsPage, setPatientsPage] = useState(1);
  const [patientsPageSize, setPatientsPageSize] = useState(12);
  const [patientsTotalCount, setPatientsTotalCount] = useState(0);
  const [patientsTotalPages, setPatientsTotalPages] = useState(0);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientOptions, setPatientOptions] = useState<NameLookup[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsPage, setAppointmentsPage] = useState(1);
  const [appointmentsPageSize, setAppointmentsPageSize] = useState(10);
  const [appointmentsTotalCount, setAppointmentsTotalCount] = useState(0);
  const [appointmentsTotalPages, setAppointmentsTotalPages] = useState(0);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  const [patientFilter, setPatientFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [submissionView, setSubmissionView] = useState<FormSubmissionResult | null>(null);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState('');

  useEffect(() => {
    if (!therapistId) return;
    (async () => {
      try {
        setLoading(true);
        const [therapists, patients, completed, cancelled] = await Promise.all([
          schedulingService.getTherapists(),
          schedulingService.getPatientsForTherapist(therapistId),
          schedulingService.getAllAppointments({ therapistId, status: 'Completed', page: 1, pageSize: 1 }),
          schedulingService.getAllAppointments({ therapistId, status: 'Cancelled', page: 1, pageSize: 1 }),
        ]);
        setTherapist(therapists.find((t) => t.id === therapistId) ?? null);
        setPatientOptions(patients);
        setCompletedCount(completed.totalCount);
        setCancelledCount(cancelled.totalCount);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando el terapeuta');
      } finally {
        setLoading(false);
      }
    })();
  }, [therapistId]);

  useEffect(() => {
    if (!therapistId) return;
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [therapistId, appointmentsPage, appointmentsPageSize, patientFilter, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (!therapistId) return;
    loadRatings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [therapistId, ratingsPage, ratingsPageSize]);

  useEffect(() => {
    if (!therapistId) return;
    loadPatientSummaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [therapistId, patientsPage, patientsPageSize]);

  const loadPatientSummaries = async () => {
    if (!therapistId) return;
    try {
      setPatientsLoading(true);
      const result = await schedulingService.getPatientSummariesForTherapist(therapistId, patientsPage, patientsPageSize);
      setPatientSummaries(result.items);
      setPatientsTotalCount(result.totalCount);
      setPatientsTotalPages(result.totalPages);
    } catch {
      setPatientSummaries([]);
    } finally {
      setPatientsLoading(false);
    }
  };

  const loadRatings = async () => {
    if (!therapistId) return;
    try {
      setRatingsLoading(true);
      const result = await schedulingService.getTherapistRatingsPaged(therapistId, ratingsPage, ratingsPageSize);
      setRatings(result.items);
      setRatingsTotalCount(result.totalCount);
      setRatingsTotalPages(result.totalPages);
      setAverageStars(result.averageStars ?? null);
    } catch {
      setRatings([]);
    } finally {
      setRatingsLoading(false);
    }
  };

  const loadAppointments = async () => {
    if (!therapistId) return;
    try {
      setAppointmentsLoading(true);
      const result = await schedulingService.getAllAppointments({
        page: appointmentsPage,
        pageSize: appointmentsPageSize,
        therapistId,
        patientId: patientFilter !== 'all' ? patientFilter : undefined,
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

  const resetFilters = () => {
    setPatientFilter('all');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setAppointmentsPage(1);
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
      ) : !therapist ? (
        <div className="text-center py-16 text-gray-400 text-sm">Terapeuta no encontrado.</div>
      ) : (
        <div className="space-y-4">
          {/* Header */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2.5 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors shrink-0"
                aria-label="Volver"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div className="p-3 bg-violet-50 rounded-2xl shrink-0">
                <AcademicCapIcon className="w-7 h-7 text-violet-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-extrabold text-gray-900">{therapist.fullName}</h1>
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                    therapist.isActive === false ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {therapist.isActive === false ? 'Inactivo' : 'Activo'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  Duración de sesión: {therapist.sessionDurationMinutes} min
                  {averageStars != null && ` · Calificación promedio: ${averageStars.toFixed(1)} (${ratingsTotalCount})`}
                </p>
                {therapist.bio && <p className="text-xs text-gray-400 mt-1">{therapist.bio}</p>}
              </div>
            </div>

            {/* Stats — compact pills */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <div className="flex items-center gap-3 bg-white rounded-2xl pl-3 pr-4 py-2.5 border border-blue-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="p-2 bg-blue-50 rounded-xl shrink-0">
                  <UserIcon className="w-5 h-5 text-blue-500" />
                </div>
                <div className="border-l border-gray-100 pl-3">
                  <p className="text-xl font-black text-gray-900 leading-none">{patientsTotalCount}</p>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider whitespace-nowrap mt-0.5">Pacientes</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white rounded-2xl pl-3 pr-4 py-2.5 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="p-2 bg-emerald-50 rounded-xl shrink-0">
                  <CalendarDaysIcon className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="border-l border-gray-100 pl-3">
                  <p className="text-xl font-black text-gray-900 leading-none">{completedCount}</p>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider whitespace-nowrap mt-0.5">Completadas</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white rounded-2xl pl-3 pr-4 py-2.5 border border-red-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="p-2 bg-red-50 rounded-xl shrink-0">
                  <ClockIcon className="w-5 h-5 text-red-500" />
                </div>
                <div className="border-l border-gray-100 pl-3">
                  <p className="text-xl font-black text-gray-900 leading-none">{cancelledCount}</p>
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider whitespace-nowrap mt-0.5">Canceladas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section tabs */}
          <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setSection('resumen')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 font-semibold text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                section === 'resumen' ? 'border-violet-600 text-violet-700' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Squares2X2Icon className="w-4 h-4" />
              Resumen
            </button>
            <button
              onClick={() => setSection('citas')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 font-semibold text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                section === 'citas' ? 'border-violet-600 text-violet-700' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <CalendarDaysIcon className="w-4 h-4" />
              Citas ({appointmentsTotalCount || '...'})
            </button>
          </div>

          {section === 'resumen' && (
            <>
              {/* Pacientes atendidos */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-blue-500" />
                  Pacientes atendidos ({patientsTotalCount})
                </h2>
                {patientsLoading ? (
                  <div className="flex items-center justify-center h-24 text-gray-400 text-sm">Cargando...</div>
                ) : patientSummaries.length === 0 ? (
                  <p className="text-sm text-gray-400">Sin pacientes atendidos aún.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-1">
                      {patientSummaries.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => navigate(`/admin/patients/${p.id}`)}
                          className="text-left border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 rounded-2xl p-4 transition-colors"
                        >
                          <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Nacimiento: {new Date(p.dateOfBirth).toLocaleDateString('es-ES')}
                          </p>
                          {p.parentName && <p className="text-xs text-gray-400 mt-0.5">Tutor: {p.parentName}</p>}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded-lg font-semibold">
                              {p.totalAppointments} sesion{p.totalAppointments !== 1 ? 'es' : ''}
                            </span>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] rounded-lg font-semibold">
                              {p.completedAppointments} completada{p.completedAppointments !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {p.lastAppointmentDate && (
                            <p className="text-[11px] text-gray-400 mt-2">
                              Última sesión: {new Date(p.lastAppointmentDate).toLocaleDateString('es-ES')}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                    <Pager
                      page={patientsPage}
                      totalPages={patientsTotalPages}
                      totalCount={patientsTotalCount}
                      onPageChange={setPatientsPage}
                      pageSize={patientsPageSize}
                      onPageSizeChange={(size) => { setPatientsPageSize(size); setPatientsPage(1); }}
                      pageSizeOptions={[12, 24, 60, 120]}
                    />
                  </>
                )}
              </div>

              {/* Calificaciones */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                    <StarIcon className="w-4 h-4 text-amber-500" />
                    Calificaciones ({ratingsTotalCount})
                  </h2>
                </div>
                {ratingsLoading ? (
                  <div className="flex items-center justify-center h-24 text-gray-400 text-sm">Cargando...</div>
                ) : ratings.length === 0 ? (
                  <p className="text-sm text-gray-400 p-6">Sin calificaciones aún.</p>
                ) : (
                  <>
                    <div className="divide-y divide-gray-100 px-6 max-h-[220px] overflow-y-auto">
                      {ratings.map((r) => (
                        <div key={r.id} className="py-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-gray-700 truncate">{r.parentName}</p>
                            {renderStars(r.stars)}
                          </div>
                          {r.comment && <p className="text-sm text-gray-600 mt-1 break-words">{r.comment}</p>}
                          <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString('es-ES')}</p>
                        </div>
                      ))}
                    </div>
                    <div className="px-4">
                      <Pager
                        page={ratingsPage}
                        totalPages={ratingsTotalPages}
                        totalCount={ratingsTotalCount}
                        onPageChange={setRatingsPage}
                        pageSize={ratingsPageSize}
                        onPageSizeChange={(size) => { setRatingsPageSize(size); setRatingsPage(1); }}
                      />
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {section === 'citas' && (
            <>
              {/* Filtros */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FunnelIcon className="w-4 h-4 text-blue-500" />
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Filtros</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Paciente</label>
                    <select
                      value={patientFilter}
                      onChange={(e) => { setPatientFilter(e.target.value); setAppointmentsPage(1); }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="all">Todos</option>
                      {patientOptions.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
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
                {(patientFilter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo) && (
                  <button
                    onClick={resetFilters}
                    className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>

              {/* Historial de citas */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
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
                  <>
                    <div className="divide-y divide-gray-100 max-h-[calc(100vh-580px)] overflow-y-auto">
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
                                onClick={() => navigate(`/admin/patients/${apt.patientId}`)}
                                className="hover:text-blue-600 hover:underline"
                              >
                                {apt.patientName || apt.patientId}
                              </button>
                            </p>
                            <span className={`inline-flex mt-2 px-2 py-0.5 rounded-lg text-xs font-semibold border ${statusClasses(apt.status)}`}>
                              {statusLabel(apt.status)}
                            </span>
                          </div>
                          {apt.formSubmissionIds && apt.formSubmissionIds.length > 0 && (
                            <ReportsMenu submissionIds={apt.formSubmissionIds} onSelect={handleOpenSubmission} disabled={submissionLoading} />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="px-4">
                      <Pager
                        page={appointmentsPage}
                        totalPages={appointmentsTotalPages}
                        totalCount={appointmentsTotalCount}
                        onPageChange={setAppointmentsPage}
                        pageSize={appointmentsPageSize}
                        onPageSizeChange={(size) => { setAppointmentsPageSize(size); setAppointmentsPage(1); }}
                      />
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <FormSubmissionModal
        submission={submissionView}
        loading={submissionLoading}
        error={submissionError}
        onClose={() => {
          setSubmissionView(null);
          setSubmissionError('');
        }}
      />
    </AdminLayout>
  );
};

export default AdminTherapistDetail;
