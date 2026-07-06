import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserGroupIcon,
  HeartIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const PeanutIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="landingPeanutGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#818CF8" />
        <stop offset="50%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    <ellipse cx="16" cy="14" rx="10" ry="11" transform="rotate(-35 16 14)" fill="url(#landingPeanutGrad)" />
    <ellipse cx="32" cy="34" rx="10" ry="11" transform="rotate(-35 32 34)" fill="url(#landingPeanutGrad)" />
    <rect x="17" y="17" width="14" height="14" transform="rotate(-35 24 24)" fill="url(#landingPeanutGrad)" />
  </svg>
);

interface PortalCard {
  path: string;
  label: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  gradient: string;
  buttonGradient: string;
  iconBg: string;
  border: string;
  ring: string;
  tag: string;
}

const portals: PortalCard[] = [
  {
    path: '/login/parents',
    label: 'Soy Padre / Madre',
    description: 'Consulta citas, revisa el progreso de tu hijo y comunícate con el terapeuta.',
    icon: HeartIcon,
    gradient: 'from-emerald-50 to-green-100',
    buttonGradient: 'from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700',
    iconBg: 'bg-emerald-100 text-emerald-600',
    border: 'border-emerald-200 hover:border-emerald-400',
    ring: 'focus-visible:ring-emerald-400',
    tag: 'Padres',
  },
  {
    path: '/login/therapists',
    label: 'Soy Terapeuta',
    description: 'Gestiona tu agenda, registra notas de sesión y actualiza el estado de las citas.',
    icon: UserGroupIcon,
    gradient: 'from-violet-50 to-purple-100',
    buttonGradient: 'from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700',
    iconBg: 'bg-violet-100 text-violet-600',
    border: 'border-violet-200 hover:border-violet-400',
    ring: 'focus-visible:ring-violet-400',
    tag: 'Terapeutas',
  },
];

const LoginLanding: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-emerald-50 px-4 py-14 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[30%] -left-[20%] w-[100%] h-[80%] bg-violet-100/50 rounded-[50%] rotate-[6deg]" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[100%] h-[80%] bg-emerald-100/50 rounded-[50%] -rotate-[6deg]" />
        <div className="absolute top-[20%] right-[5%] w-[40%] h-[60%] bg-sky-100/40 rounded-[50%] rotate-[12deg]" />
      </div>

      <div className="relative w-full max-w-3xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <PeanutIcon className="w-12 h-12" />
            <span className="text-4xl font-black tracking-tight bg-gradient-to-r from-violet-700 via-emerald-600 to-amber-500 bg-clip-text text-transparent">
              Cacahuate
            </span>
          </div>
          <p className="text-gray-500 text-base mt-2">Selecciona tu portal para continuar</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <div
                key={portal.path}
                className={`bg-gradient-to-br ${portal.gradient} border ${portal.border} rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group`}
                onClick={() => navigate(portal.path)}
              >
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${portal.iconBg}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {portal.tag}
                  </span>
                </div>

                <div>
                  <h2 className="text-gray-900 font-extrabold text-lg leading-tight mb-1.5">
                    {portal.label}
                  </h2>
                  <p className="text-gray-500 text-xs leading-relaxed">{portal.description}</p>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); navigate(portal.path); }}
                  className={`mt-auto w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold bg-gradient-to-r ${portal.buttonGradient} shadow transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 ${portal.ring}`}
                >
                  Acceder
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-gray-400 mt-10">
          © {new Date().getFullYear()} Cacahuate · Plataforma de terapia a domicilio
        </p>
      </div>
    </div>
  );
};

export default LoginLanding;
