import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Aperture, Mail, ArrowRight, Loader2, CheckCircle } from 'lucide-react';

export const AuthView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      setSubmitted(true);
    } catch (error: any) {
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen dark:bg-zinc-950 bg-slate-100 flex flex-col items-center justify-center p-4 font-rajdhani">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="dark:hidden absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-400/20 rounded-full blur-[100px]" />
        <div className="hidden dark:block absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-zinc-800/20 rounded-full blur-[80px]" />
      </div>

      <div className="w-full max-w-sm text-center relative z-10 animate-fadeIn">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="relative">
             <Aperture size={48} className="text-cyan-600 dark:text-cyan-400 animate-spin-slow" />
             <div className="absolute inset-0 bg-cyan-400/20 blur-lg rounded-full animate-pulse" />
          </div>
          <div className="flex flex-col items-start">
            <h1 className="text-3xl font-bold tracking-[0.2em] leading-none dark:text-zinc-100 text-slate-900">NETUNO</h1>
            <span className="text-xs text-cyan-600 dark:text-cyan-500 font-mono tracking-widest font-bold">JARVIS SYSTEM</span>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-3xl shadow-2xl">
          {submitted ? (
            <div className="animate-scaleIn text-center">
              <CheckCircle size={48} className="mx-auto text-emerald-500 mb-4" />
              <h2 className="text-xl font-bold dark:text-white text-slate-900">Revisa tu correo</h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2">
                Hemos enviado un enlace mágico a <b>{email}</b>. Haz clic para iniciar sesión.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold dark:text-white text-slate-900">Bienvenido</h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2 mb-6">
                Ingresa tu correo para acceder a tu panel de producción.
              </p>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                  <input
                    type="email"
                    placeholder="tu-correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/70 dark:bg-zinc-800/50 border border-white/40 dark:border-white/10 rounded-full py-4 pl-12 pr-4 text-sm dark:text-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold tracking-wider hover:scale-105 transition-transform disabled:opacity-60 disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <span>ENVIAR ENLACE MÁGICO</span>
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};