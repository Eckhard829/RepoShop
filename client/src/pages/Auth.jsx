import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { post, toastOk } from "../api";

export default function Auth({ mode = "login", session }) {
  const nav = useNavigate();
  const isLogin = mode === "login";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await post(isLogin ? "/api/login" : "/api/register", { email, password });
      toastOk(isLogin ? "Signed in." : "Account created.");
      nav("/dashboard");
    } catch {
      // api.js already toasted the error
    } finally {
      setBusy(false);
    }
  }

  if (session) {
    return (
      <div className="auth narrow">
        <h2>You're already logged in</h2>
        <p className="muted">Head to your dashboard to continue.</p>
        <Link to="/dashboard" className="btn primary full">Go to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="auth narrow">
      <h1 className="dtitle">{isLogin ? "Log in" : "Create account"}</h1>
      <p className="muted">{isLogin ? "Welcome back." : "Get instant access to the repo."}</p>

      <form onSubmit={submit}>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" required autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} />

        <label htmlFor="password">Password</label>
        <input id="password" type="password" required minLength={8}
          autoComplete={isLogin ? "current-password" : "new-password"}
          value={password} onChange={(e) => setPassword(e.target.value)} />

        <button type="submit" className="primary full" disabled={busy}>
          {busy ? "Please wait…" : isLogin ? "Log in" : "Sign up"}
        </button>
      </form>

      <div style={{ margin: "1.2rem 0", textAlign: "center", color: "var(--muted)" }}>— or —</div>

      <a href="/api/auth/google" className="btn full" style={{ display: "block", textAlign: "center" }}>
        Continue with Google
      </a>

      <p className="muted" style={{ marginTop: "1.5rem", textAlign: "center" }}>
        {isLogin ? (<>No account? <Link to="/signup">Sign up</Link></>) : (<>Already have one? <Link to="/login">Log in</Link></>)}
      </p>
    </div>
  );
}
