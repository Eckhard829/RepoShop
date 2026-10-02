import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import MagicBento from "../components/MagicBento";
import DashBar from "../components/DashBar";
import Confirm from "../components/Confirm";
import { api, post, toastOk, toastInfo, toastErr } from "../api";
import "./Admin.css";

const BG = "#0a0f12";

/* ---------- Graphs (pure SVG, no extra deps) ---------- */
const N = 30,
  W = 600,
  H = 180,
  TICK = 1400;
const walk = (v, lo, hi, s) =>
  Math.min(hi, Math.max(lo, v + (Math.random() - 0.5) * s));
const smooth = (pts) =>
  pts.reduce((d, p, i, a) => {
    if (!i) return `M${p[0]},${p[1]}`;
    const mx = (a[i - 1][0] + p[0]) / 2;
    return d + ` C${mx},${a[i - 1][1]} ${mx},${p[1]} ${p[0]},${p[1]}`;
  }, "");

function LiveLine() {
  const [d, setD] = useState(() => {
    let a = 50,
      b = 30;
    return Array.from({ length: N + 1 }, () => ({
      a: (a = walk(a, 15, 90, 18)),
      b: (b = walk(b, 10, 60, 14)),
    }));
  });
  useEffect(() => {
    const t = setInterval(
      () =>
        setD((p) => {
          const l = p[p.length - 1];
          return [
            ...p.slice(1),
            { a: walk(l.a, 15, 90, 18), b: walk(l.b, 10, 60, 14) },
          ];
        }),
      TICK,
    );
    return () => clearInterval(t);
  }, []);
  const step = W / (N - 1);
  const pts = (k) =>
    d.map((p, i) => [i * step, H - (p[k] / 100) * H * 0.85 - 10]);
  const pa = pts("a"),
    pb = pts("b");
  const area = smooth(pa) + ` L${pa[pa.length - 1][0]},${H} L0,${H} Z`;
  return (
    <svg
      className="chart"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Live visits and sales"
    >
      <defs>
        <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#00D9FF" stopOpacity=".35" />
          <stop offset="1" stopColor="#00D9FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line
          key={g}
          x1="0"
          x2={W}
          y1={H * g}
          y2={H * g}
          className="gridline"
        />
      ))}
      <g
        className="slide"
        style={{ "--step": `${step}px`, "--tick": `${TICK}ms` }}
      >
        <path d={area} fill="url(#ga)" />
        <path d={smooth(pa)} className="ln ln-a" />
        <path d={smooth(pb)} className="ln ln-b" />
      </g>
    </svg>
  );
}

function Donut({ parts }) {
  const total = parts.reduce((s, p) => s + p.v, 0) || 1;
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), 60);
    return () => clearTimeout(t);
  }, []);
  let off = 0;
  return (
    <div className="donut-wrap">
      <svg
        viewBox="0 0 100 100"
        className="donut"
        role="img"
        aria-label="Client funnel"
      >
        <circle cx="50" cy="50" r="38" className="donut-bg" />
        {parts.map((p) => {
          const len = (p.v / total) * 100;
          const el = (
            <circle
              key={p.label}
              cx="50"
              cy="50"
              r="38"
              pathLength="100"
              className="donut-seg"
              stroke={p.color}
              strokeDasharray={`${on ? len : 0} ${100 - (on ? len : 0)}`}
              strokeDashoffset={-off}
            />
          );
          off += len;
          return el;
        })}
        <text x="50" y="54" textAnchor="middle" className="donut-n">
          {total === 1 && !parts.some((p) => p.v) ? 0 : total}
        </text>
      </svg>
      <ul className="legend">
        {parts.map((p) => (
          <li key={p.label}>
            <i style={{ background: p.color }} />
            {p.label}
            <b>{p.v}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Pulse() {
  return (
    <div className="pulse" aria-hidden="true">
      {Array.from({ length: 28 }, (_, i) => (
        <span
          key={i}
          style={{
            animationDelay: `${(i * 137) % 900}ms`,
            animationDuration: `${900 + ((i * 211) % 800)}ms`,
          }}
        />
      ))}
    </div>
  );
}

/* ---------- Notification: create modal ---------- */
function NotifModal({ onClose, onCreate }) {
  const [f, setF] = useState({ title: "", message: "", link: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  async function submit(e) {
    e.preventDefault();
    if (!f.title.trim() || !f.message.trim()) {
      toastErr("Title and message are required.");
      return;
    }
    setBusy(true);
    try {
      const { id } = await post("/api/admin/notifications", f);
      toastOk("Draft created.");
      onCreate(id);
    } catch {
      // api.js already toasted
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-back" onMouseDown={onClose}>
      <form
        className="modal card"
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <h2>Create notification</h2>
        <label>
          Title
          <input
            value={f.title}
            onChange={set("title")}
            maxLength={80}
            autoFocus
            placeholder="e.g. New repo drop"
          />
        </label>
        <label>
          Message
          <textarea
            value={f.message}
            onChange={set("message")}
            rows={4}
            maxLength={300}
            placeholder="What should clients see?"
          />
        </label>
        <label>
          Link (optional)
          <input
            value={f.link}
            onChange={set("link")}
            placeholder="https://..."
          />
        </label>
        <div className="modal-actions">
          <button type="button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={busy}>
            {busy ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Notification: side panel ---------- */
function NotifPanel({ open, onClose }) {
  const [list, setList] = useState(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = useCallback(
    () =>
      api("/api/admin/notifications")
        .then(setList)
        .catch(() => setList([])),
    [],
  );

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  async function send(n) {
    setBusyId(n.id);
    try {
      const r = await post(`/api/admin/notifications/${n.id}/send`);
      toastOk(
        n.send_count > 0
          ? `Resent to ${r.recipients} client${r.recipients === 1 ? "" : "s"}.`
          : `Sent to ${r.recipients} client${r.recipients === 1 ? "" : "s"}.`,
      );
      load();
    } catch {
      // api.js toasted
    } finally {
      setBusyId(null);
    }
  }

  async function doDelete(n) {
    setBusyId(n.id);
    try {
      await api(`/api/admin/notifications/${n.id}`, undefined, "DELETE");
      toastOk("Deleted.");
      load();
    } catch {
      // api.js toasted
    } finally {
      setBusyId(null);
      setConfirmDel(null);
    }
  }

  return (
    <>
      <div className={"panel-back" + (open ? " on" : "")} onClick={onClose} />
      <aside
        className={"panel" + (open ? " on" : "")}
        aria-hidden={!open}
        aria-label="Notifications"
      >
        <div className="panel-head">
          <h2>Notifications</h2>
          <div className="r">
            <button
              className="primary icon"
              onClick={() => setCreating(true)}
              aria-label="Create notification"
              title="Create notification"
            >
              +
            </button>
            <button
              className="icon"
              onClick={onClose}
              aria-label="Collapse panel"
              title="Collapse"
            >
              &times;
            </button>
          </div>
        </div>
        <div className="panel-body">
          {list === null && <p className="muted">Loading...</p>}
          {list && !list.length && (
            <p className="muted">No notifications yet. Hit + to create one.</p>
          )}
          {list &&
            list.map((n) => {
              const sent = n.status === "sent";
              const busy = busyId === n.id;
              return (
                <div className="notif" key={n.id}>
                  <div className="notif-top">
                    <strong>{n.title}</strong>
                    <span className={"tag" + (sent ? " sent" : "")}>
                      {sent ? "Sent" : "Draft"}
                    </span>
                  </div>
                  <p>{n.message}</p>
                  {n.link && (
                    <a
                      href={n.link}
                      target="_blank"
                      rel="noreferrer"
                      className="notif-link"
                    >
                      {n.link}
                    </a>
                  )}
                  <p className="muted small">
                    {sent
                      ? `Sent ${+n.send_count} time${+n.send_count === 1 ? "" : "s"}${
                          n.last_sent
                            ? ` · last ${String(n.last_sent).slice(0, 16).replace("T", " ")}`
                            : ""
                        }`
                      : "Not sent yet"}
                  </p>
                  <div className="notif-actions">
                    <button onClick={() => send(n)} disabled={busy}>
                      {busy ? "..." : sent ? "Resend" : "Send"}
                    </button>
                    <button
                      className="danger"
                      onClick={() => setConfirmDel(n)}
                      disabled={busy}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </aside>
      {creating && (
        <NotifModal
          onClose={() => setCreating(false)}
          onCreate={() => {
            setCreating(false);
            load();
          }}
        />
      )}
      <Confirm
        open={!!confirmDel}
        title="Delete notification?"
        message={
          confirmDel
            ? `"${confirmDel.title}" will be removed for everyone.`
            : ""
        }
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirmDel(null)}
        onConfirm={() => doDelete(confirmDel)}
      />
    </>
  );
}

/* ---------- Card hover glow ---------- */
function trackGlow(e) {
  const card = e.target.closest?.(".magic-bento-card");
  const wrap = e.currentTarget;
  if (wrap._last && wrap._last !== card)
    wrap._last.style.setProperty("--glow-intensity", "0");
  wrap._last = card || null;
  if (!card) return;
  const r = card.getBoundingClientRect();
  card.style.setProperty(
    "--glow-x",
    ((e.clientX - r.left) / r.width) * 100 + "%",
  );
  card.style.setProperty(
    "--glow-y",
    ((e.clientY - r.top) / r.height) * 100 + "%",
  );
  card.style.setProperty("--glow-intensity", "1");
}
function clearGlow(e) {
  e.currentTarget
    .querySelectorAll(".magic-bento-card")
    .forEach((c) => c.style.setProperty("--glow-intensity", "0"));
  e.currentTarget._last = null;
}

/* ---------- Clients ---------- */
const hue = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const ago = (v) => {
  const t = new Date(String(v).replace(" ", "T"));
  if (isNaN(t)) return "";
  const d = Math.floor((Date.now() - t) / 864e5);
  return d <= 0 ? "today" : d === 1 ? "yesterday" : d + "d ago";
};
const stage = (r) =>
  !+r.paid ? "unpaid" : +r.downloaded ? "installed" : "waiting";

function Clients({ rows, act }) {
  const [q, setQ] = useState("");
  const [f, setF] = useState("all");
  const tabs = ["all", "unpaid", "waiting", "installed"];
  const count = (t) =>
    t === "all" ? rows.length : rows.filter((r) => stage(r) === t).length;
  const shown = rows.filter(
    (r) =>
      (f === "all" || stage(r) === f) &&
      r.email.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <section className="clients card">
      <div className="clients-head">
        <h2>Clients</h2>
        <div className="chips">
          {tabs.map((t) => (
            <button
              key={t}
              className={"chip" + (f === t ? " on" : "")}
              onClick={() => setF(t)}
            >
              {t}
              <b>{count(t)}</b>
            </button>
          ))}
        </div>
        <input
          className="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email..."
          aria-label="Search clients"
        />
      </div>

      <div className="crow chead">
        <span>Client</span>
        <span>Joined</span>
        <span>Status</span>
        <span className="end">Actions</span>
      </div>
      {!shown.length && <p className="muted center pad">No clients match.</p>}
      {shown.map((r, i) => {
        const st = stage(r),
          h = hue(r.email);
        return (
          <div
            className="crow"
            key={r.id}
            style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
          >
            <span className="who">
              <i
                className="avatar"
                style={{
                  background: `linear-gradient(135deg,hsl(${h} 80% 55%),hsl(${(h + 60) % 360} 80% 40%))`,
                }}
              >
                {r.email[0].toUpperCase()}
              </i>
              <span>{r.email}</span>
            </span>
            <span className="muted">
              {String(r.created_at).slice(0, 10)}{" "}
              <small>{ago(r.created_at)}</small>
            </span>
            <span className="pills">
              <em className={"pill " + (+r.paid ? "good" : "bad")}>
                {+r.paid ? "Paid" : "Unpaid"}
              </em>
              <em className={"pill " + (+r.downloaded ? "good" : "")}>
                {+r.downloaded ? "Downloaded" : "Not downloaded"}
              </em>
            </span>
            <span className="acts end">
              <button
                className="primary"
                onClick={() => act("impersonate", r.id)}
              >
                Open account
              </button>
              <button className="a-verify" onClick={() => act("verify", r.id)}>
                Verify payment
              </button>
              <button
                className="a-reset"
                onClick={() => act("reset-download", r.id)}
              >
                Reset download
              </button>
              <button className="a-grant" onClick={() => act("grant", r.id)}>
                Grant access
              </button>
            </span>
          </div>
        );
      })}
    </section>
  );
}

/* ---------- Page ---------- */
export default function Admin() {
  const nav = useNavigate();
  const [s, setS] = useState(null);
  const [rows, setRows] = useState(null);
  const [panel, setPanel] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  const draw = () => api("/api/admin/clients").then(setRows);

  useEffect(() => {
    api("/api/session")
      .then((x) => {
        if (x.role !== "admin" || x.impersonating)
          nav("/dashboard", { replace: true });
        else {
          setS(x);
          draw();
        }
      })
      .catch(() => nav("/login", { replace: true }));
  }, []);

  if (!rows)
    return (
      <div className="dpage">
        <p className="muted">Loading...</p>
      </div>
    );

  function askConfirm(opts) {
    setConfirmState(opts);
  }

  async function runConfirmed(a, id) {
    await post(`/api/admin/${a}/${id}`);
    toastOk(
      a === "grant"
        ? "Access granted."
        : a === "reset-download"
          ? "Download reset."
          : "Done.",
    );
    draw();
  }

  async function act(a, id) {
    if (a === "verify") {
      const v = await api("/api/admin/verify/" + id);
      if (v.verified) toastOk(`Paid on ${v.paid_at}. Ref: ${v.ref}`);
      else toastInfo(v.note || "No payment on record.");
    } else if (a === "impersonate") {
      await post("/api/admin/impersonate/" + id);
      nav("/dashboard");
    } else if (a === "reset-download") {
      askConfirm({
        title: "Reset download?",
        message:
          "This lets the client download the repository again with a fresh one-time link.",
        confirmLabel: "Reset download",
        danger: true,
        onYes: () => runConfirmed(a, id),
      });
    } else if (a === "grant") {
      askConfirm({
        title: "Grant access?",
        message:
          "This marks the client as paid without a Yoco payment on record. Only do this if you've confirmed payment another way.",
        confirmLabel: "Grant access",
        danger: true,
        onYes: () => runConfirmed(a, id),
      });
    }
  }

  const paid = rows.filter((r) => +r.paid).length;
  const inst = rows.filter((r) => +r.downloaded).length;
  const waiting = paid - inst;
  const unpaid = rows.length - paid;
  const conv = rows.length ? Math.round((paid / rows.length) * 100) : 0;

  const cards = [
    {
      color: BG,
      label: "Clients",
      title: String(rows.length),
      description: "Total accounts",
    },
    {
      color: BG,
      label: "Paid",
      title: String(paid),
      description: "Confirmed payments",
    },
    {
      color: BG,
      label: "Waiting",
      title: String(waiting),
      description: "Paid, not downloaded",
    },
    {
      color: BG,
      label: "Installed",
      title: String(inst),
      description: "Download link used",
    },
    {
      color: BG,
      label: "Unpaid",
      title: String(unpaid),
      description: "Signed up, not bought",
    },
    {
      color: BG,
      label: "Conversion",
      title: conv + "%",
      description: "Signups that paid",
    },
    {
      color: BG,
      label: "Revenue",
      title: "$4,820",
      description: "This month (static)",
    },
    {
      color: BG,
      label: "Repo views",
      title: "12.4k",
      description: "Last 7 days (static)",
    },
  ];

  return (
    <>
      <DashBar email={s?.email} />
      <div className="dpage admin">
        <div className="admin-head">
          <h1 className="dtitle">Admin dashboard</h1>
          <button
            className="expand"
            onClick={() => setPanel(true)}
            aria-expanded={panel}
          >
            Notifications <span aria-hidden="true">&#8250;&#8250;</span>
          </button>
        </div>

        <div
          className="admin-metrics"
          onMouseMove={trackGlow}
          onMouseLeave={clearGlow}
        >
          <MagicBento
            cards={cards}
            textAutoHide={false}
            enableStars
            enableSpotlight
            enableBorderGlow
            enableTilt={false}
            enableMagnetism={false}
            clickEffect
            spotlightRadius={400}
            particleCount={12}
            glowColor="0, 217, 255"
          />
        </div>

        <div className="charts">
          <div className="card chart-card wide">
            <div className="chart-title">
              <h2>Live activity</h2>
              <span className="key">
                <i className="a" />
                Visits <i className="b" />
                Sales <em className="live">LIVE</em>
              </span>
            </div>
            <LiveLine />
          </div>
          <div className="card chart-card">
            <div className="chart-title">
              <h2>Client funnel</h2>
            </div>
            <Donut
              parts={[
                { label: "Installed", v: inst, color: "#00D9FF" },
                { label: "Waiting", v: waiting, color: "#7c5cff" },
                { label: "Unpaid", v: unpaid, color: "#2a4750" },
              ]}
            />
          </div>
          <div className="card chart-card">
            <div className="chart-title">
              <h2>Traffic pulse</h2>
              <em className="live">LIVE</em>
            </div>
            <Pulse />
            <p className="muted small">
              Simulated data. Wire to your analytics when ready.
            </p>
          </div>
        </div>

        <Clients rows={rows} act={act} />
      </div>

      <NotifPanel open={panel} onClose={() => setPanel(false)} />

      <Confirm
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel}
        danger={confirmState?.danger}
        onCancel={() => setConfirmState(null)}
        onConfirm={async () => {
          const fn = confirmState?.onYes;
          setConfirmState(null);
          if (fn) await fn();
        }}
      />
    </>
  );
}
