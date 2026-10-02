import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MagicBento from '../components/MagicBento';
import DashBar from '../components/DashBar';
import { api, post, PRICE, EMAIL } from '../api';

const BG = '#0a0f12';

export default function Dashboard() {
  const nav = useNavigate();
  const [m, setM] = useState(null);
  const [err, setErr] = useState('');

  const load = () => api('/api/me')
    .then(d => (d.role === 'admin' && !d.impersonating) ? nav('/admin', { replace: true }) : setM(d))
    .catch(() => nav('/login', { replace: true }));
  useEffect(() => { load(); }, []);

  const confirming = m && !m.paid && new URLSearchParams(window.location.search).has('paid');
  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(load, 3000); // wait for the Yoco webhook
    return () => clearTimeout(t);
  }, [m]);

  if (!m) return <div className="dpage"><p className="muted">Loading...</p></div>;

  const buy = async () => { try { window.location.href = (await post('/api/checkout')).url; } catch (x) { setErr(x.message); } };

  let repo;
  if (confirming) repo = { title: 'Confirming payment...', description: 'This takes a few seconds.' };
  else if (!m.paid) repo = { title: 'Locked', description: 'Buy the repository to unlock your download.',
    extra: <button className="primary" onClick={buy}>Buy the repository ({PRICE})</button> };
  else if (m.downloaded) repo = { title: 'Installed', description: 'Your download link has been used. Contact support if something went wrong.' };
  else if (m.link) repo = { title: 'Ready to download', description: 'This link works once, for your account only. After you download, it disappears.',
    extra: <a className="btn primary" href={m.link} onClick={() => setTimeout(load, 2500)}>Download repository</a> };
  else repo = { title: 'Paid', description: 'Download link hidden while viewing as admin.' };

  const cards = [
    { color: BG, label: 'Account', title: m.email, description: 'Signed in' },
    { color: BG, label: 'Payment', title: m.paid ? 'Paid' : 'Not paid', description: m.paid ? 'Thank you!' : 'No purchase yet' },
    { color: BG, label: 'Repository', ...repo },
    { color: BG, label: 'Help', title: 'Support', description: `Problem with your account? Email ${EMAIL}` },
    { color: BG, label: 'Security', title: 'One-time link', description: 'Every link is unique and works once.' },
    { color: BG, label: 'Status', title: m.downloaded ? 'Installed' : 'Not installed', description: m.downloaded ? 'All done' : 'Waiting for download' }
  ];

  return (
    <>
      <DashBar email={m.email} />
      <div className="dpage">
        {m.impersonating && (
          <div className="imp"><span>Viewing as {m.email}</span>
            <button onClick={async () => { await post('/api/admin/stop'); nav('/admin'); }}>Back to admin</button></div>
        )}
        <h1 className="dtitle">Your dashboard</h1>
        <p className="err">{err}</p>
        <MagicBento cards={cards} textAutoHide={false} enableStars enableSpotlight enableBorderGlow
          enableTilt={false} enableMagnetism={false} clickEffect spotlightRadius={400} particleCount={12} glowColor="0, 217, 255" />
      </div>
    </>
  );
}