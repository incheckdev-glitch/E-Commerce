'use client';

import { useActionState } from 'react';
import { signIn, signUp } from '@/app/actions/auth';

const initial = { message: '' };

export function AuthForms() {
  const [loginState, loginAction] = useActionState(signIn as any, initial);
  const [signupState, signupAction] = useActionState(signUp as any, initial);

  return (
    <div className="detail-grid">
      <form className="panel" action={loginAction}>
        <h1>Login</h1>
        {loginState?.message ? <p className="notice">{loginState.message}</p> : null}
        <div className="form-row"><label>Email</label><input className="input" name="email" type="email" required /></div>
        <div className="form-row"><label>Password</label><input className="input" name="password" type="password" required /></div>
        <button className="btn" style={{ marginTop: 16 }}>Login</button>
      </form>

      <form className="panel" action={signupAction}>
        <h1>Create Account</h1>
        {signupState?.message ? <p className="notice">{signupState.message}</p> : null}
        <div className="form-row"><label>Full name</label><input className="input" name="fullName" required /></div>
        <div className="form-row"><label>Email</label><input className="input" name="email" type="email" required /></div>
        <div className="form-row"><label>Password</label><input className="input" name="password" type="password" minLength={8} required /></div>
        <button className="btn secondary" style={{ marginTop: 16 }}>Sign up</button>
      </form>
    </div>
  );
}
