import { logout, BRAND } from '../api';

// Slim bar for dashboards (replaces the public site header)
export default function DashBar({ email }) {
  return (
    <div className="dbar">
      <span className="logo">{BRAND}</span>
      <div className="r"><span className="muted">{email}</span><button onClick={logout}>Log out</button></div>
    </div>
  );
}