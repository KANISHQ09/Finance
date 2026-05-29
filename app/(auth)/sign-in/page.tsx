'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { signInWithEmail } from '@/lib/actions/auth.actions';

const SignIn = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      const result = await signInWithEmail(data);
      if (result.success) {
        toast.success('Welcome back!');
        router.push('/');
      } else {
        toast.error(result.error ?? 'Invalid credentials.');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong.');
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-card">
        {/* Logo */}
        <div className="signin-logo">
          <Image src="/assets/icons/logo.png" alt="FinNext" width={120} height={28} className="h-7 w-auto" />
        </div>

        {/* Heading */}
        <div className="signin-header">
          <h1 className="signin-title">Welcome back</h1>
          <p className="signin-subtitle">Sign in to your AI-powered portfolio</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="signin-form">
          {/* Email */}
          <div className="auth-field">
            <label className="auth-label">
              <Mail size={13} className="auth-label-icon" /> Email address
            </label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, message: 'Invalid email' },
              })}
              type="email"
              placeholder="you@example.com"
              className={`auth-input ${errors.email ? 'auth-input-error' : ''}`}
              autoComplete="email"
            />
            {errors.email && <p className="auth-error">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="auth-field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="auth-label">
                <Lock size={13} className="auth-label-icon" /> Password
              </label>
            </div>
            <div className="auth-input-wrapper auth-input-password">
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Min 8 characters' },
                })}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={`auth-input ${errors.password ? 'auth-input-error' : ''}`}
                autoComplete="current-password"
              />
              <button type="button" className="auth-password-toggle" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && <p className="auth-error">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="auth-submit-btn">
            {isSubmitting ? <><Loader2 size={17} className="animate-spin" /> Signing in…</> : <>Sign In <ArrowRight size={17} /></>}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <p className="auth-footer-text">
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="auth-footer-link">Create one free</Link>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
