import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MagicBento from '../components/MagicBento';
import DashBar from '../components/DashBar';
import { api, post } from '../api';

const BG = '#0a0f12';

export default function Admin() {
  const nav = useNavigate();
  const [s, setS] = useState(null);
  const [rows, setRows] = useState(null);
  const [msg, setMsg] = useState('');

  const draw = () => api('/api/admin/clients').then(setRows);
  useEffect(() => {
    api('/api/session')
      .then(x => { if (x.role !== 'admin' || x.impersonating) nav('/dashboard', { replace: true }); else { setS(x); draw(); } })
      .catch(() => nav('/login', { replace: true }));
  }, []);

  if (!rows) return <div className="dpage"><p className="muted">Loading...</p></div>;

  async function act(a, id) {
    if (a === 'verify') {
      const v = await api('/api/admin/verify/' + id);
      setMsg(v.verified ? `Paid on ${v.paid_at}. Reference: ${v.ref} (cross-check in your Yoco portal).` : 'Not verified: ' + v.note);
    } else if (a === 'impersonate') { await post('/api/admin/impersonate/' + id); nav('/dashboard'); }
    else if (window.confirm('Are you sure?')) { await post(`/api/admin/${a}/${id}`); draw(); }
  }

  const paid = rows.filter(r => +r.paid).length, inst = rows.filter(r => +r.downloaded).length;
  const cards = [
    { color: BG, label: 'Clients', title: String(rows.length), description: 'Total accounts' },
    { color: BG, label: 'Paid', title: String(paid), description: 'Confirmed payments' },
    { color: BG, label: 'Waiting', title: String(paid - inst), description: 'Paid, not downloaded yet' },
    { color: BG, label: 'Installed', title: String(inst), description: 'Download link used' },
    { color: BG, label: 'Unpaid', title: String(rows.length - paid), description: 'Signed up, not bought' },
    { color: BG, label: 'Conversion', title: (rows.length ? Math.round((paid / rows.length) * 100) : 0) + '%', description: 'Signups that paid' }
  ];

  return (
    <>
      <DashBar email={s?.email} />
      <div className="dpage">
        <h1 className="dtitle">Admin dashboard</h1>
        <MagicBento cards={cards} textAutoHide={false} enableStars enableSpotlight enableBorderGlow
          enableTilt={false} enableMagnetism={false} clickEffect spotlightRadius={400} particleCount={12} glowColor="0, 217, 255" />
        <h2>Clients</h2>
        <p className="ok">{msg}</p>
        <div className="card wrap">
          <table>
            <thead><tr><th>Email</th><th>Joined</th><th>Paid</th><th>Downloaded</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>{r.email}</td><td>{String(r.created_at).slice(0, 10)}</td>
                  <td>{+r.paid ? 'Yes' : 'No'}</td><td>{+r.downloaded ? 'Yes' : 'No'}</td>
                  <td>
                    <button onClick={() => act('impersonate', r.id)}>Open account</button>{' '}
                    <button onClick={() => act('verify', r.id)}>Verify payment</button>{' '}
                    <button onClick={() => act('reset-download', r.id)}>Reset download</button>{' '}
                    <button onClick={() => act('grant', r.id)}>Grant access</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}