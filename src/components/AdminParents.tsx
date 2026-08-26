import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UsersIcon,
  UserPlusIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
  XMarkIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { authService } from '../services/auth'
import { schedulingService } from '../services/scheduling'
import ParentCombobox from './ParentCombobox'
import Pager from './Pager'
import type { ParentSummary, Patient, Therapist } from '../types'

type Tab = 'parent' | 'patient' | 'therapist'

const Modal: React.FC<{ open: boolean; onClose: () => void; children: React.ReactNode }> = ({ open, onClose, children }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-8 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

const CreateParentForm: React.FC<{ onCreated?: () => void; onClose: () => void }> = ({ onCreated, onClose }) => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      setLoading(true)
      const created = await authService.adminCreateParent({ firstName, lastName, email, password })
      setSuccess(`Cuenta creada: ${created.firstName} ${created.lastName} (${created.email})`)
      setFirstName('')
      setLastName('')
      setEmail('')
      setPassword('')
      onCreated?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la cuenta del padre')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-6">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <UserPlusIcon className="w-4 h-4 text-emerald-500" />
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Crear cuenta de padre</h2>
        </div>
        <button type="button" onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-xs">
          <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-xs">
          <CheckCircleIcon className="w-4 h-4 shrink-0" />
          <p className="font-medium">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nombre" required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Apellido</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Apellido" required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Correo electrónico</label>
          <div className="relative">
            <EnvelopeIcon className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" required
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Contraseña</label>
          <div className="relative">
            <LockClosedIcon className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña temporal" required
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlusIcon className="w-4 h-4" />}
          Crear cuenta
        </button>
      </form>
    </div>
  )
}

const CreateTherapistForm: React.FC<{ onCreated?: () => void; onClose: () => void }> = ({ onCreated, onClose }) => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      setLoading(true)
      const created = await authService.adminCreateTherapist({ firstName, lastName, email, password })
      setSuccess(`Cuenta creada: ${created.firstName} ${created.lastName} (${created.email})`)
      setFirstName('')
      setLastName('')
      setEmail('')
      setPassword('')
      onCreated?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la cuenta del terapeuta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-6">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <AcademicCapIcon className="w-4 h-4 text-violet-500" />
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Crear cuenta de terapeuta</h2>
        </div>
        <button type="button" onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-xs">
          <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-xs">
          <CheckCircleIcon className="w-4 h-4 shrink-0" />
          <p className="font-medium">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nombre" required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Apellido</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Apellido" required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Correo electrónico</label>
          <div className="relative">
            <EnvelopeIcon className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" required
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Contraseña</label>
          <div className="relative">
            <LockClosedIcon className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña temporal" required
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlusIcon className="w-4 h-4" />}
          Crear cuenta
        </button>
      </form>
    </div>
  )
}

const CreatePatientForm: React.FC<{ onCreated?: () => void; onClose: () => void }> = ({ onCreated, onClose }) => {
  const [selectedParentId, setSelectedParentId] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dob, setDob] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [comboboxKey, setComboboxKey] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!selectedParentId) {
      setError('Selecciona un padre/tutor')
      return
    }
    try {
      setLoading(true)
      const created = await schedulingService.createPatientAsAdmin({
        parentUserId: selectedParentId,
        firstName,
        lastName,
        dateOfBirth: dob,
        notes: notes || undefined,
      })
      setSuccess(`Paciente registrado: ${created.firstName} ${created.lastName}`)
      setSelectedParentId('')
      setFirstName('')
      setLastName('')
      setDob('')
      setNotes('')
      setComboboxKey((k) => k + 1)
      onCreated?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar el paciente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-6">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <UsersIcon className="w-4 h-4 text-blue-500" />
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Registrar paciente</h2>
        </div>
        <button type="button" onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-xs">
          <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-xs">
          <CheckCircleIcon className="w-4 h-4 shrink-0" />
          <p className="font-medium">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Padre / tutor</label>
          <ParentCombobox key={comboboxKey} value={selectedParentId} onChange={(id) => setSelectedParentId(id)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nombre" required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Apellido</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Apellido" required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha de nacimiento</label>
          <input type="date" value={dob} max={new Date().toISOString().split('T')[0]} onChange={(e) => setDob(e.target.value)} required
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Notas (opcional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notas relevantes..."
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UsersIcon className="w-4 h-4" />}
          Registrar paciente
        </button>
      </form>
    </div>
  )
}

const ParentsList: React.FC<{ refreshToken?: number; onAdd: () => void }> = ({ refreshToken, onAdd }) => {
  const [items, setItems] = useState<ParentSummary[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const handle = setTimeout(async () => {
      try {
        setLoading(true)
        const result = await schedulingService.getAllParents(page, pageSize, search.trim() || undefined)
        if (!cancelled) {
          setItems(result.items)
          setTotalCount(result.totalCount)
          setTotalPages(result.totalPages)
        }
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)
    return () => { cancelled = true; clearTimeout(handle) }
  }, [page, pageSize, search, refreshToken])

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mt-4">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
          <UsersIcon className="w-4 h-4 text-emerald-500" />
          Padres registrados
        </h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Buscar por nombre o correo..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors shrink-0"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Registrar</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-100 border-t-emerald-500" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Sin resultados</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map((p) => (
            <div key={p.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{p.fullName}</p>
                <p className="text-xs text-gray-400 truncate">{p.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pager
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
        pageSizeOptions={[10, 25, 50]}
      />
    </div>
  )
}

const PatientsList: React.FC<{ refreshToken?: number; onAdd: () => void }> = ({ refreshToken, onAdd }) => {
  const navigate = useNavigate()
  const [items, setItems] = useState<Patient[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const handle = setTimeout(async () => {
      try {
        setLoading(true)
        const result = await schedulingService.getAllPatients(page, pageSize, search.trim() || undefined)
        if (!cancelled) {
          setItems(result.items)
          setTotalCount(result.totalCount)
          setTotalPages(result.totalPages)
        }
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)
    return () => { cancelled = true; clearTimeout(handle) }
  }, [page, pageSize, search, refreshToken])

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mt-4">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
          <UsersIcon className="w-4 h-4 text-blue-500" />
          Pacientes registrados
        </h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Buscar por nombre..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold transition-colors shrink-0"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Registrar</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-100 border-t-blue-500" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Sin resultados</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/admin/patients/${p.id}`)}
              className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{p.firstName} {p.lastName}</p>
                <p className="text-xs text-gray-400 truncate">
                  Nac. {new Date(p.dateOfBirth + 'T00:00').toLocaleDateString('es-ES')}
                  {p.parentName ? ` · Tutor: ${p.parentName}` : ''}
                </p>
              </div>
              <ArrowRightIcon className="w-4 h-4 text-gray-300 shrink-0" />
            </button>
          ))}
        </div>
      )}

      <Pager
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
        pageSizeOptions={[10, 25, 50]}
      />
    </div>
  )
}

const TherapistsList: React.FC<{ refreshToken?: number; onAdd: () => void }> = ({ refreshToken, onAdd }) => {
  const navigate = useNavigate()
  const [items, setItems] = useState<Therapist[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    schedulingService.getTherapists()
      .then((result) => { if (!cancelled) setItems(result) })
      .catch(() => { if (!cancelled) setItems([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [refreshToken])

  const filtered = items.filter((t) => t.fullName.toLowerCase().includes(search.trim().toLowerCase()))

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mt-4">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
          <AcademicCapIcon className="w-4 h-4 text-violet-500" />
          Terapeutas registrados
        </h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition-colors shrink-0"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Registrar</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-100 border-t-violet-500" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Sin resultados</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => navigate(`/admin/therapists/${t.id}`)}
              className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{t.fullName}</p>
                {t.bio && <p className="text-xs text-gray-400 truncate">{t.bio}</p>}
              </div>
              <ArrowRightIcon className="w-4 h-4 text-gray-300 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const AdminParents: React.FC = () => {
  const [tab, setTab] = useState<Tab>('parent')
  const [refreshToken, setRefreshToken] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const bumpRefresh = () => setRefreshToken((v) => v + 1)

  const tabs: { key: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { key: 'parent', label: 'Padre', icon: UserPlusIcon },
    { key: 'patient', label: 'Paciente', icon: UsersIcon },
    { key: 'therapist', label: 'Terapeuta', icon: AcademicCapIcon },
  ]

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4">
      {/* Header */}
      <div className="shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <UsersIcon className="w-8 h-8 text-blue-600 shrink-0" />
          <h1 className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-blue-600 via-blue-800 to-black bg-clip-text text-transparent">
            Gestión de Usuarios
          </h1>
        </div>
        <p className="text-gray-500 text-sm ml-11">Crea cuentas de padres, terapeutas y registra pacientes asignándolos a su padre/tutor</p>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex gap-1 border-b border-gray-200">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 font-semibold text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
              tab === key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {tab === 'parent' && <ParentsList refreshToken={refreshToken} onAdd={() => setModalOpen(true)} />}
        {tab === 'patient' && <PatientsList refreshToken={refreshToken} onAdd={() => setModalOpen(true)} />}
        {tab === 'therapist' && <TherapistsList refreshToken={refreshToken} onAdd={() => setModalOpen(true)} />}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        {tab === 'parent' && <CreateParentForm onCreated={bumpRefresh} onClose={() => setModalOpen(false)} />}
        {tab === 'patient' && <CreatePatientForm onCreated={bumpRefresh} onClose={() => setModalOpen(false)} />}
        {tab === 'therapist' && <CreateTherapistForm onCreated={bumpRefresh} onClose={() => setModalOpen(false)} />}
      </Modal>
    </div>
  )
}

export default AdminParents
