import React, { useState } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

type PortalSlug = 'parents' | 'therapists' | 'admin';

interface PortalConfig {
  title: string;
  subtitle: string;
  welcomeBack: string;
  bgGradient: string;
  blob1: string;
  blob2: string;
  blob3: string;
  blob4: string;
  inputFocus: string;
  iconColor: string;
  eyeColor: string;
  buttonGradient: string;
  buttonShadow: string;
  linkColor: string;
  logoGradFrom: string;
  logoGradTo: string;
  titleColor: string;
  canRegister: boolean;
  fixedRole?: 'Parent' | 'Therapist';
}

const configs: Record<PortalSlug, PortalConfig> = {
  parents: {
    title: 'Portal de Padres',
    subtitle: 'Accede a las citas y el progreso de tu hijo',
    welcomeBack: '¡Bienvenido de vuelta!',
    bgGradient: 'from-emerald-300 via-green-500 to-green-700',
    blob1: 'bg-emerald-200/40',
    blob2: 'bg-white/15',
    blob3: 'bg-green-900/20',
    blob4: 'bg-emerald-300/20',
    inputFocus: 'focus:ring-emerald-400',
    iconColor: 'text-emerald-500',
    eyeColor: 'text-emerald-300 hover:text-emerald-600',
    buttonGradient: 'from-emerald-500 to-green-700 hover:from-emerald-600 hover:to-green-800',
    buttonShadow: 'shadow-emerald-500/30',
    linkColor: 'text-emerald-700 hover:text-emerald-900',
    logoGradFrom: '#34D399',
    logoGradTo: '#059669',
    titleColor: 'text-green-900',
    canRegister: true,
    fixedRole: 'Parent',
  },
  therapists: {
    title: 'Portal de Terapeutas',
    subtitle: 'Gestiona tus citas y notas de sesión',
    welcomeBack: '¡Bienvenido de vuelta!',
    bgGradient: 'from-violet-300 via-purple-500 to-purple-700',
    blob1: 'bg-violet-200/40',
    blob2: 'bg-white/15',
    blob3: 'bg-purple-900/20',
    blob4: 'bg-violet-300/20',
    inputFocus: 'focus:ring-violet-400',
    iconColor: 'text-violet-500',
    eyeColor: 'text-violet-300 hover:text-violet-600',
    buttonGradient: 'from-violet-500 to-purple-700 hover:from-violet-600 hover:to-purple-800',
    buttonShadow: 'shadow-violet-500/30',
    linkColor: 'text-violet-700 hover:text-violet-900',
    logoGradFrom: '#A78BFA',
    logoGradTo: '#7C3AED',
    titleColor: 'text-purple-900',
    canRegister: true,
    fixedRole: 'Therapist',
  },
  admin: {
    title: 'Panel de Administración',
    subtitle: 'Acceso exclusivo para administradores',
    welcomeBack: 'Acceso restringido',
    bgGradient: 'from-slate-500 via-slate-700 to-slate-900',
    blob1: 'bg-slate-400/30',
    blob2: 'bg-white/10',
    blob3: 'bg-slate-900/30',
    blob4: 'bg-slate-500/20',
    inputFocus: 'focus:ring-slate-400',
    iconColor: 'text-slate-400',
    eyeColor: 'text-slate-400 hover:text-slate-600',
    buttonGradient: 'from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900',
    buttonShadow: 'shadow-slate-500/30',
    linkColor: 'text-slate-700 hover:text-slate-900',
    logoGradFrom: '#94A3B8',
    logoGradTo: '#334155',
    titleColor: 'text-slate-800',
    canRegister: false,
  },
};

const PeanutIcon: React.FC<{ gradFrom: string; gradTo: string; className?: string }> = ({
  gradFrom,
  gradTo,
  className,
}) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="peanutGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor={gradFrom} />
        <stop offset="100%" stopColor={gradTo} />
      </linearGradient>
    </defs>
    <ellipse cx="16" cy="14" rx="10" ry="11" transform="rotate(-35 16 14)" fill="url(#peanutGrad)" />
    <ellipse cx="32" cy="34" rx="10" ry="11" transform="rotate(-35 32 34)" fill="url(#peanutGrad)" />
    <rect x="17" y="17" width="14" height="14" transform="rotate(-35 24 24)" fill="url(#peanutGrad)" />
  </svg>
);

const Login: React.FC = () => {
  const { portal } = useParams<{ portal: string }>();
  const cfg = configs[portal as PortalSlug];

  if (!cfg) return <Navigate to="/login" replace />;

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register({
          firstName,
          lastName,
          email,
          password,
          role: cfg.fixedRole!,
        });
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la autenticación');
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase = `w-full pl-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 ${cfg.inputFocus} focus:border-transparent focus:bg-white transition-all duration-150`;

  const canSubmit = isLogin
    ? email.length > 0 && password.length > 0
    : firstName.length > 0 && lastName.length > 0 && email.length > 0 && password.length > 0;

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-br ${cfg.bgGradient} px-4 py-10 relative overflow-hidden`}
    >
      {/* Decorative blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-[40%] -left-[30%] w-[160%] h-[90%] ${cfg.blob1} rounded-[50%] rotate-[8deg]`} />
        <div className={`absolute -top-[20%] -right-[20%] w-[120%] h-[80%] ${cfg.blob2} rounded-[50%] -rotate-[10deg]`} />
        <div className={`absolute -bottom-[35%] -right-[25%] w-[150%] h-[85%] ${cfg.blob3} rounded-[50%] -rotate-[8deg]`} />
        <div className={`absolute -bottom-[15%] -left-[20%] w-[110%] h-[70%] ${cfg.blob4} rounded-[50%] rotate-[12deg]`} />
      </div>

      {/* Back to portal selector */}
      <Link
        to="/login"
        className="relative flex items-center gap-1.5 text-white/70 hover:text-white text-xs font-medium mb-6 transition-colors"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" />
        Cambiar portal
      </Link>

      <div className="relative w-full max-w-[400px]">
        <div className="w-full bg-white/95 backdrop-blur rounded-3xl shadow-2xl overflow-hidden">
          <div className="px-8 sm:px-10 pt-10 pb-6">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <PeanutIcon
                gradFrom={cfg.logoGradFrom}
                gradTo={cfg.logoGradTo}
                className="w-8 h-8"
              />
              <span className={`text-2xl font-black tracking-tight ${cfg.titleColor}`}>
                Cacahuate
              </span>
            </div>

            <p className="text-center text-xs text-gray-400 mb-5">{cfg.title}</p>

            <h1 className={`text-xl font-extrabold ${cfg.titleColor} text-center mb-6`}>
              {isLogin ? cfg.welcomeBack : 'Crear cuenta'}
            </h1>

            {error && (
              <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {!isLogin && cfg.canRegister && (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={`w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 ${cfg.inputFocus} focus:border-transparent transition-all duration-150`}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Apellido"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={`w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 ${cfg.inputFocus} focus:border-transparent transition-all duration-150`}
                    required
                  />
                </div>
              )}

              <div className="relative">
                <EnvelopeIcon className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 ${cfg.iconColor} pointer-events-none`} />
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputBase}
                  required
                />
              </div>

              <div className="relative">
                <LockClosedIcon className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 ${cfg.iconColor} pointer-events-none`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputBase} pr-11`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${cfg.eyeColor} transition-colors`}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || !canSubmit}
                className={`w-full py-3 mt-2 bg-gradient-to-r ${cfg.buttonGradient} disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm shadow-lg ${cfg.buttonShadow} transition-all duration-200`}
              >
                {isLoading ? 'Cargando...' : isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
              </button>
            </form>

            {isLogin && (
              <div className="text-center mt-4">
                <button type="button" className={`text-xs ${cfg.linkColor} font-medium`}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}
          </div>

          {cfg.canRegister && (
            <div className="border-t border-gray-100 bg-gray-50/60 px-8 sm:px-10 py-4 text-center">
              <p className="text-sm text-gray-700">
                {isLogin ? '¿No tienes una cuenta? ' : '¿Ya tienes una cuenta? '}
                <button
                  type="button"
                  onClick={() => { setIsLogin((v) => !v); setError(''); }}
                  className={`${cfg.linkColor} font-bold`}
                >
                  {isLogin ? 'Regístrate' : 'Inicia sesión'}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
