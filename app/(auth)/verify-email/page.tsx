'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, RefreshCw } from 'lucide-react';

const VerifyEmailPage = () => {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? 'your email';

  return (
    <div className="signin-card" style={{ textAlign: 'center' }}>
      <div className="verify-icon-wrap">
        <Mail size={32} className="verify-icon" />
      </div>

      <h1 className="signin-title" style={{ marginTop: '1.5rem' }}>Check your inbox</h1>
      <p className="signin-subtitle" style={{ maxWidth: 340, margin: '0.4rem auto 0' }}>
        We sent a verification link to{' '}
        <strong style={{ color: '#CCDADC' }}>{email}</strong>. Click it to activate your account.
      </p>

      <div className="verify-steps">
        {['Open your email app', 'Find the email from FinNext', 'Click "Verify My Email"'].map((text, i) => (
          <div key={i} className="verify-step-item">
            <div className="verify-step-num">{i + 1}</div>
            <span>{text}</span>
          </div>
        ))}
      </div>

      <p className="auth-footer-text" style={{ marginTop: '2rem' }}>
        Already verified?{' '}
        <Link href="/sign-in" className="auth-footer-link">Sign in</Link>
      </p>
      <p style={{ fontSize: '0.75rem', color: '#30333A', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <RefreshCw size={11} />
        Didn&apos;t receive it? Check spam or contact support.
      </p>
    </div>
  );
};

export default VerifyEmailPage;
