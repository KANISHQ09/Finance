'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { toast } from 'sonner';
import { Mail, ArrowRight, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { requestPasswordReset } from '@/lib/actions/auth.actions';

type ForgotForm = { email: string };

const ForgotPasswordPage = () => {
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({ defaultValues: { email: '' }, mode: 'onBlur' });

  const onSubmit = async (data: ForgotForm) => {
    try {
      const result = await requestPasswordReset(data.email);
      if (result.success) {
        setSentTo(data.email);
        setSent(true);
      } else {
        toast.error(result.error ?? 'Failed to send reset email.');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  /* ── Sent confirmation state ── */
  if (sent) {
    return (
      <div className="signin-card" style={{ textAlign: 'center' }}>
        <div className="verify-icon-wrap">
          <ShieldCheck size={32} className="verify-icon" />
        </div>

        <h1 className="signin-title" style={{ marginTop: '1.5rem' }}>
          Check your inbox
        </h1>
        <p className="signin-subtitle" style={{ maxWidth: 340, margin: '0.4rem auto 0' }}>
          We sent a password reset link to{' '}
          <strong style={{ color: '#CCDADC' }}>{sentTo}</strong>. It expires in 1 hour.
        </p>

        <div className="verify-steps" style={{ marginTop: '1.75rem' }}>
          {[
            'Open your email app',
            'Find the email from FinNext',
            'Click "Reset My Password"',
          ].map((text, i) => (
            <div key={i} className="verify-step-item">
              <div className="verify-step-num">{i + 1}</div>
              <span>{text}</span>
            </div>
          ))}
        </div>

        <p className="auth-footer-text" style={{ marginTop: '2rem' }}>
          Back to{' '}
          <Link href="/sign-in" className="auth-footer-link">
            Sign in
          </Link>
        </p>
        <p style={{ fontSize: '0.75rem', color: '#30333A', marginTop: '0.5rem' }}>
          Didn&apos;t receive it? Check spam or{' '}
          <button
            className="auth-footer-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}
            onClick={() => setSent(false)}
          >
            try again
          </button>
          .
        </p>
      </div>
    );
  }

  /* ── Request form ── */
  return (
    <div className="signin-card">
      <div className="signin-header">
        <h1 className="signin-title">Forgot password?</h1>
        <p className="signin-subtitle">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="signin-form">
        <div className="auth-field">
          <label className="auth-label">
            <Mail size={13} className="auth-label-icon" /> Email address
          </label>
          <input
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
                message: 'Invalid email',
              },
            })}
            type="email"
            placeholder="you@example.com"
            className={`auth-input ${errors.email ? 'auth-input-error' : ''}`}
            autoComplete="email"
          />
          {errors.email && <p className="auth-error">{errors.email.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="auth-submit-btn">
          {isSubmitting ? (
            <>
              <Loader2 size={17} className="animate-spin" /> Sending…
            </>
          ) : (
            <>
              Send Reset Link <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>

      <p className="auth-footer-text">
        <Link href="/sign-in" className="auth-footer-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeft size={13} /> Back to Sign In
        </Link>
      </p>
    </div>
  );
};

export default ForgotPasswordPage;
