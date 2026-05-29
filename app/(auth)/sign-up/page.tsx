'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  Eye, EyeOff, Lock, Mail, User, Globe,
  Target, Shield, Building, ArrowRight, ArrowLeft, Loader2, CheckCircle2,
} from 'lucide-react';
import { signUpWithEmail } from '@/lib/actions/auth.actions';
import { INVESTMENT_GOALS, PREFERRED_INDUSTRIES, RISK_TOLERANCE_OPTIONS } from '@/lib/constants';

const STEPS = ['Account', 'Profile'];

const SignUp = () => {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      country: 'US',
      investmentGoals: 'Growth',
      riskTolerance: 'Medium',
      preferredIndustry: 'Technology',
    },
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

  const goNext = async () => {
    const valid = await trigger(['fullName', 'email', 'password']);
    if (valid) setStep(1);
  };

  const onSubmit = async (data: SignUpFormData) => {
    try {
      const result = await signUpWithEmail(data);
      if (result.success) {
        toast.success('Account created! Welcome to FinNext.');
        router.push('/');
      } else {
        toast.error(result.error ?? 'Please try again.');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong.');
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-card signup-card">
        {/* Logo */}
        <div className="signin-logo">
          <Image src="/assets/icons/logo.png" alt="FinNext" width={120} height={28} className="h-7 w-auto" />
        </div>

        {/* Step indicator */}
        <div className="signup-steps">
          {STEPS.map((label, i) => (
            <div key={label} className={`signup-step ${i <= step ? 'signup-step-active' : ''}`}>
              <div className="signup-step-circle">
                {i < step ? <CheckCircle2 size={13} /> : <span>{i + 1}</span>}
              </div>
              <span className="signup-step-label">{label}</span>
              {i < STEPS.length - 1 && (
                <div className={`signup-step-line ${i < step ? 'signup-step-line-done' : ''}`} />
              )}
            </div>
          ))}
        </div>

        <div className="signin-header">
          <h1 className="signin-title">
            {step === 0 ? 'Create your account' : 'Your investment profile'}
          </h1>
          <p className="signin-subtitle">
            {step === 0 ? 'Join thousands of AI-powered investors' : 'Personalize your AI experience'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* ── STEP 0: Credentials ── */}
          {step === 0 && (
            <div className="signin-form">
              <div className="auth-field">
                <label className="auth-label"><User size={13} className="auth-label-icon" /> Full Name</label>
                <input
                  {...register('fullName', { required: 'Full name is required', minLength: { value: 2, message: 'Min 2 characters' } })}
                  placeholder="John Doe"
                  className={`auth-input ${errors.fullName ? 'auth-input-error' : ''}`}
                />
                {errors.fullName && <p className="auth-error">{errors.fullName.message}</p>}
              </div>

              <div className="auth-field">
                <label className="auth-label"><Mail size={13} className="auth-label-icon" /> Email address</label>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, message: 'Invalid email' },
                  })}
                  type="email"
                  placeholder="you@example.com"
                  className={`auth-input ${errors.email ? 'auth-input-error' : ''}`}
                />
                {errors.email && <p className="auth-error">{errors.email.message}</p>}
              </div>

              <div className="auth-field">
                <label className="auth-label"><Lock size={13} className="auth-label-icon" /> Password</label>
                <div className="auth-input-wrapper auth-input-password">
                  <input
                    {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    className={`auth-input ${errors.password ? 'auth-input-error' : ''}`}
                  />
                  <button type="button" className="auth-password-toggle" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {password && (
                  <div className="password-strength">
                    <div className="password-strength-bars">
                      {[1, 2, 3, 4].map(n => (
                        <div key={n} className="password-strength-bar"
                          style={{ background: strength.score >= n ? strength.color : '#212328' }} />
                      ))}
                    </div>
                    <span className="password-strength-label" style={{ color: strength.color }}>{strength.label}</span>
                  </div>
                )}
                {errors.password && <p className="auth-error">{errors.password.message}</p>}
              </div>

              <button type="button" onClick={goNext} className="auth-submit-btn">
                Continue <ArrowRight size={17} />
              </button>
            </div>
          )}

          {/* ── STEP 1: Investment Profile ── */}
          {step === 1 && (
            <div className="signin-form">
              <div className="auth-field">
                <label className="auth-label"><Globe size={13} className="auth-label-icon" /> Country</label>
                <input
                  {...register('country', { required: true })}
                  placeholder="US"
                  className={`auth-input ${errors.country ? 'auth-input-error' : ''}`}
                />
              </div>

              <div className="auth-field">
                <label className="auth-label"><Target size={13} className="auth-label-icon" /> Investment Goals</label>
                <select {...register('investmentGoals')} className="auth-input auth-select">
                  {INVESTMENT_GOALS.map((g: { value: string; label: string }) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>

              <div className="auth-field">
                <label className="auth-label"><Shield size={13} className="auth-label-icon" /> Risk Tolerance</label>
                <select {...register('riskTolerance')} className="auth-input auth-select">
                  {RISK_TOLERANCE_OPTIONS.map((r: { value: string; label: string }) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="auth-field">
                <label className="auth-label"><Building size={13} className="auth-label-icon" /> Preferred Industry</label>
                <select {...register('preferredIndustry')} className="auth-input auth-select">
                  {PREFERRED_INDUSTRIES.map((i: { value: string; label: string }) => (
                    <option key={i.value} value={i.value}>{i.label}</option>
                  ))}
                </select>
              </div>

              <div className="signup-step-nav">
                <button type="button" onClick={() => setStep(0)} className="auth-back-btn">
                  <ArrowLeft size={17} /> Back
                </button>
                <button type="submit" disabled={isSubmitting} className="auth-submit-btn auth-submit-btn-grow">
                  {isSubmitting
                    ? <><Loader2 size={17} className="animate-spin" /> Creating…</>
                    : <>Launch Dashboard <ArrowRight size={17} /></>}
                </button>
              </div>
            </div>
          )}
        </form>

        <p className="auth-footer-text">
          Already have an account?{' '}
          <Link href="/sign-in" className="auth-footer-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
