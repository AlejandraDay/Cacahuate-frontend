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
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import DashboardLayout from '../components/DashboardLayout';
import Pager from '../components/Pager';
import { schedulingService } from '../services/scheduling';
import type { Appointment, Therapist, TherapistRating, NameLookup } from '../types';

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

const AdminTherapistDetail: React.FC = () => {
  const { therapistId } = useParams<{ therapistId: string }>();
  const navigate = useNavigate();

  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [ratings, setRatings] = useState<TherapistRating[]>([]);
  const [patientOptions, setPatientOptions] = useState<NameLookup[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsPage, setAppointmentsPage] = useState(1);
  const [appointmentsTotalCount, setAppointmentsTotalCount] = useState(0);
  const [appointmentsTotalPages, setAppointmentsTotalPages] = useState(0);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  const [patientFilter, setPatientFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (!therapistId) return;
    (async () => {
      try {
        setLoading(true);
        const [therapists, therapistRatings, patients, completed, cancelled] = await Promise.all([
          schedulingService.getTherapists(),
          schedulingService.getTherapistRatings(therapistId).catch(() => [] as TherapistRating[]),
          schedulingService.getPatientsForTherapist(therapistId),
          schedulingService.getAllAppointments({ therapistId, status: 'Completed', page: 1, pageSize: 1 }),
          schedulingService.getAllAppointments({ therapistId, status: 'Cancelled', page: 1, pageSize: 1 }),
        ]);
        setTherapist(therapists.find((t) => t.id === therapistId) ?? null);
        setRatings(therapistRatings);
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
  }, [therapistId, appointmentsPage, patientFilter, statusFilter, dateFrom, dateTo]);

  const loadAppointments = async () => {
    if (!therapistId) return;
    try {
      setAppointmentsLoading(true);
      const result = await schedulingService.getAllAppointments({
        page: appointmentsPage,
        pageSize: 10,
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

  const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length : null;

  const resetFilters = () => {
    setPatientFilter('all');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setAppointmentsPage(1);
  };

  return (
    <DashboardLayout>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 font-medium mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Volver
      </button>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Cargando...</div>
      ) : error ? (
        <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">{error}</div>
      ) : !therapist ? (
        <div className="text-center py-16 text-gray-400 text-sm">Terapeuta no encontrado.</div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
            <div className="p-3 bg-violet-50 rounded-2xl">
              <AcademicCapIcon className="w-7 h-7 text-violet-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-gray-900">{therapist.fullName}</h1>
                <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                  therapist.isActive === false ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {therapist.isActive === false ? 'Inactivo' : 'Activo'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Duración de sesión: {therapist.sessionDurationMinutes} min
                {avgRating != null && ` · Calificación promedio: ${avgRating.toFixed(1)} (${ratings.length})`}
              </p>
              {therapist.bio && <p className="text-xs text-gray-400 mt-1">{therapist.bio}</p>}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pacientes</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{patientOptions.length}</p>
            </div>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Completadas</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{completedCount}</p>
            </div>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Canceladas</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{cancelledCount}</p>
            </div>
          </div>

          {/* Pacientes atendidos */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-blue-500" />
              Pacientes atendidos
            </h2>
            {patientOptions.length === 0 ? (
              <p className="text-sm text-gray-400">Sin pacientes atendidos aún.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {patientOptions.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/admin/patients/${p.id}`)}
                    className="px-2 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-600 text-xs rounded-lg transition-colors"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Calificaciones */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <StarIcon className="w-4 h-4 text-amber-500" />
              Calificaciones ({ratings.length})
            </h2>
            {ratings.length === 0 ? (
              <p className="text-sm text-gray-400">Sin calificaciones aún.</p>
            ) : (
              <div className="space-y-3">
                {ratings.map((r) => (
                  <div key={r.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-700">{r.parentName}</p>
                      {renderStars(r.stars)}
                    </div>
                    {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
                    <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString('es-ES')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

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
                <div className="divide-y divide-gray-100">
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
                    </div>
                  ))}
                </div>
                <div className="px-4">
                  <Pager page={appointmentsPage} totalPages={appointmentsTotalPages} totalCount={appointmentsTotalCount} onPageChange={setAppointmentsPage} />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminTherapistDetail;
