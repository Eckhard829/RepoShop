import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { post } from '../api';

export default function Auth({ mode, session }) {
  const up = mode === 'signup';
  const nav = useNavigate();
  const [err, setErr] = useState('');
  if (session) return <Navigate to="/dashboard" replace />;

  async function submit(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      await post(up ? '/api/register' : '/api/login', { email: f.get('email'), password: f.get('password') });
      nav('/dashboard');
    } catch (x) { setErr(x.message); }
  }

  return (
    <div className="card auth">
      <h2>{up ? 'Create your account' : 'Welcome back'}</h2>
      <form onSubmit={submit}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
        <label htmlFor="password">Password{up ? ' (8+ characters)' : ''}</label>
        <input id="password" name="password" type="password" required minLength={up ? 8 : 1}
          autoComplete={up ? 'new-password' : 'current-password'} />
        <p className="err" role="alert">{err}</p>
        <button className="primary full">{up ? 'Sign up' : 'Log in'}</button>
      </form>
      <p className="center">
        {up ? <>Already have an account? <Link to="/login">Log in</Link></> : <>New here? <Link to="/signup">Create an account</Link></>}
      </p>
    </div>
  );
}