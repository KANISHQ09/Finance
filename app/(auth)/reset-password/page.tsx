'use client';

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { resetPassword } from '@/lib/actions/auth.actions';

type ResetForm = { password: string; confirmPassword: string };

/* ─── Inner component that reads searchParams ─── */
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onBlur',
  });

  const password = watch('password');

  const getStrength = (pw: string) => {
    if (!pw) return { score: 0, label: '', color: '' };
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    const map = [
      { label: '', color: '' },
      { label: 'Weak', color: '#FF495B' },
      { label: 'Fair', color: '#FF8243' },
      { label: 'Good', color: '#FDD458' },
      { label: 'Strong', color: '#0FEDBE' },
    ];
    return { score: s, ...map[s] };
  };
  const strength = getStrength(password);

  const onSubmit = async (data: ResetForm) => {
    if (!token) {
      toast.error('Invalid or missing reset token. Please request a new link.');
      return;
    }
    try {
      const result = await resetPassword({ token, newPassword: data.password });
      if (result.success) {
        setDone(true);
        setTimeout(() => router.push('/sign-in'), 3000);
      } else {
        toast.error(result.error ?? 'Reset failed. The link may have expired.');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  /* ── Success state ── */
  if (done) {
    return (
      <div className="signin-card" style={{ textAlign: 'center' }}>
        <div className="verify-icon-wrap">
          <CheckCircle2 size={32} className="verify-icon" />
        </div>
        <h1 className="signin-title" style={{ marginTop: '1.5rem' }}>Password updated!</h1>
        <p className="signin-subtitle" style={{ maxWidth: 320, margin: '0.4rem auto 0' }}>
          Your password has been reset successfully. Redirecting you to sign in…
        </p>
        <p className="auth-footer-text" style={{ marginTop: '2rem' }}>
          <Link href="/sign-in" className="auth-footer-link">Go to Sign In →</Link>
        </p>
      </div>
    );
  }

  /* ── No token guard ── */
  if (!token) {
    return (
      <div className="signin-card" style={{ textAlign: 'center' }}>
        <h1 className="signin-title">Invalid link</h1>
        <p className="signin-subtitle" style={{ maxWidth: 320, margin: '0.4rem auto 0' }}>
          This password reset link is invalid or has expired.
        </p>
        <p className="auth-footer-text" style={{ marginTop: '2rem' }}>
          <Link href="/forgot-password" className="auth-footer-link">Request a new link</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="signin-card">
      <div className="signin-header">
        <h1 className="signin-title">Reset your password</h1>
        <p className="signin-subtitle">Choose a strong password for your account.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="signin-form">
        {/* New Password */}
        <div className="auth-field">
          <label className="auth-label">
            <Lock size={13} className="auth-label-icon" /> New Password
          </label>
          <div className="auth-input-wrapper auth-input-password">
            <input
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Min 8 characters' },
              })}
              type={showPassword ? 'text' : 'password'}
              placeholder="Min 8 characters"
              className={`auth-input ${errors.password ? 'auth-input-error' : ''}`}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {password && (
            <div className="password-strength">
              <div className="password-strength-bars">
                {[1, 2, 3, 4].map(n => (
                  <div
                    key={n}
                    className="password-strength-bar"
                    style={{ background: strength.score >= n ? strength.color : '#212328' }}
                  />
                ))}
              </div>
              <span className="password-strength-label" style={{ color: strength.color }}>
                {strength.label}
              </span>
            </div>
          )}
          {errors.password && <p className="auth-error">{errors.password.message}</p>}
        </div>

        {/* Confirm Password */}
        <div className="auth-field">
          <label className="auth-label">
            <Lock size={13} className="auth-label-icon" /> Confirm Password
          </label>
          <div className="auth-input-wrapper auth-input-password">
            <input
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: val => val === password || 'Passwords do not match',
              })}
              type={showConfirm ? 'text' : 'password'}
              placeholder="Re-enter password"
              className={`auth-input ${errors.confirmPassword ? 'auth-input-error' : ''}`}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowConfirm(v => !v)}
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="auth-error">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button type="submit" disabled={isSubmitting} className="auth-submit-btn">
          {isSubmitting ? (
            <><Loader2 size={17} className="animate-spin" /> Updating…</>
          ) : (
            <>Reset Password <ArrowRight size={17} /></>
          )}
        </button>
      </form>

      <p className="auth-footer-text">
        Remember your password?{' '}
        <Link href="/sign-in" className="auth-footer-link">Sign in</Link>
      </p>
    </div>
  );
}

/* ─── Page export — Suspense required for useSearchParams ─── */
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="signin-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Loader2 size={22} className="animate-spin" style={{ color: '#FDD458' }} />
          <span style={{ color: '#A1A1AA', fontSize: '0.9rem' }}>Loading…</span>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
