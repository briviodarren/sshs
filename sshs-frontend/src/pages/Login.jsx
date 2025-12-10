import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, rememberMe);
      navigate(from, { replace: true });
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      {/* Refraction / Light Dispersion Overlay */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.18),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(180,200,255,0.16),transparent_45%),radial-gradient(circle_at_30%_90%,rgba(255,190,255,0.14),transparent_50%)]" />

      {/* Glass Card */}
      <div
        className="
          relative w-full max-w-md animate-glass
          rounded-[2rem]
          border border-white/25
          bg-white/[0.035]
          backdrop-blur-[8px]
          px-8 py-10 space-y-8
          shadow-[inset_0_0_22px_rgba(255,255,255,0.18)]
        "
      >
        {/* Chromatic Edge / Dispersion */}
        <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[linear-gradient(120deg,rgba(255,0,150,0.12),rgba(0,200,255,0.12),rgba(255,255,255,0.06))] mix-blend-screen opacity-40" />

        <div className="relative text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] border border-white/30 bg-white/[0.06] backdrop-blur-[6px]
            shadow-[inset_0_0_18px_rgba(255,255,255,0.2)]">
            <ShieldCheckIcon className="h-10 w-10 text-white/90" />
          </div>

          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-white">
            SSHS Portal
          </h2>
          <p className="mt-1 text-sm text-white/70">
            St. Stanislaus High School
          </p>
        </div>

        <form className="relative mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl border border-white-300/40 bg-white-500/10 px-4 py-3 text-center text-sm text-white-100 backdrop-blur-[6px]">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                  w-full rounded-full px-4 py-3 text-sm text-white outline-none
                  border border-white/25
                  bg-white/[0.03]
                  backdrop-blur-[6px]
                  shadow-[inset_0_0_12px_rgba(255,255,255,0.18)]
                  placeholder:text-white/60
                "
                placeholder="Email address"
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="
                  w-full rounded-full px-4 py-3 text-sm text-white outline-none
                  border border-white/25
                  bg-white/[0.03]
                  backdrop-blur-[6px]
                  shadow-[inset_0_0_12px_rgba(255,255,255,0.18)]
                  placeholder:text-white/60
                "
                placeholder="Password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="peer relative h-4 w-4 shrink-0 appearance-none
                rounded border border-white/70 bg-white/10
                backdrop-blur-[4px] shadow-[inset_0_0_6px_rgba(255,255,255,0.4)]
                transition-all
                checked:bg-white/25 checked:border-white checked:shadow-[0_0_0_1px_rgba(255,255,255,0.9)]
                focus:outline-none focus-visible:ring-0
                after:pointer-events-none after:absolute after:left-[5px] after:top-[2px]
                after:h-[7px] after:w-[4px] after:rotate-45
                after:border-b-[1.5px] after:border-r-[1.5px] after:border-white
                after:opacity-0 checked:after:opacity-100
                after:content-['']"
              />
              <label
                htmlFor="remember-me"
                className="select-none text-white/75"
              >
                Remember me
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="
                relative flex w-full justify-center py-3 text-sm font-semibold tracking-wide
                rounded-full
                border border-white/30
                bg-white/[0.06]
                backdrop-blur-[6px]
                shadow-[inset_0_0_18px_rgba(255,255,255,0.2)]
                transition-all duration-300
                hover:bg-white/[0.1]
                hover:shadow-[inset_0_0_26px_rgba(255,255,255,0.28)]
                active:scale-[0.98]
                disabled:cursor-not-allowed disabled:opacity-60
              "
            >
              {/* moving light sweep */}
              <span className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.35),transparent)] opacity-30" />
              <span>{loading ? 'Signing in…' : 'Sign in'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
