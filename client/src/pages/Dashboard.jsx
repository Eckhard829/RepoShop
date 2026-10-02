import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MagicBento from "../components/MagicBento";
import DashBar from "../components/DashBar";
import { api, post, toastOk } from "../api";

const BG = "#0a0f12";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "-";

export default function Dashboard() {
  const nav = useNavigate();
  const [m, setM] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [open, setOpen] = useState(true);

  const load = () =>
    api("/api/me")
      .then((d) => (d.role === "admin" && !d.impersonating ? nav("/admin", { replace: true }) : setM(d)))
      .catch(() => nav("/login", { replace: true }));

  // New versions are published by admin only; this just lists them.
  const loadUpdates = () =>
    api("/api/versions")
      .then((d) => setUpdates(d.versions || []))
      .catch(() => setUpdates([]));

  useEffect(() => {
    load();
    loadUpdates();
  }, []);

  if (!m) return <div className="dpage"><p className="muted">Loading...</p></div>;

  const cards = [
    {
      color: BG,
      label: "Ordered",
      title: fmtDate(m.ordered_at),
      description: "The date you ordered Jarvis",
    },
    {
      color: BG,
      label: "Version",
      title: m.version ? `v${m.version}` : "-",
      description: "Your installed version of Jarvis",
    },
    {
      color: BG,
      label: "Download",
      title: m.downloaded ? "Already downloaded" : "Ready to download",
      description: m.downloaded
        ? "Your download link has been used."
        : "This link works once, for your account only.",
      extra: (
        <a
          className="btn primary"
          href={m.downloaded || !m.link ? undefined : m.link}
          aria-disabled={m.downloaded || !m.link}
          onClick={(e) => {
            if (m.downloaded || !m.link) return e.preventDefault();
            setTimeout(load, 2500);
          }}
          style={m.downloaded || !m.link ? { opacity: 0.4, pointerEvents: "none", cursor: "not-allowed" } : undefined}
        >
          {m.downloaded ? "Downloaded" : "Download Jarvis"}
        </a>
      ),
    },
    {
      color: BG,
      label: "Notifications",
      title: updates.length ? `${updates.length} new` : "All caught up",
      description: updates.length
        ? `Here are your new notifications. Jarvis v${updates[0].version} is available.`
        : "Here are your new notifications. Nothing new right now.",
      extra: updates.length ? (
        <button className="primary" onClick={() => setOpen(true)}>View notifications</button>
      ) : undefined,
    },
  ];

  return (
    <>
      <DashBar email={m.email} />
      <div className="dpage">
        {m.impersonating && (
          <div className="imp">
            <span>Viewing as {m.email}</span>
            <button onClick={async () => { await post("/api/admin/stop"); nav("/admin"); }}>Back to admin</button>
          </div>
        )}
        <h1 className="dtitle">Your dashboard</h1>

        <div>
          {/* Main column (leaves room for the fixed panel when it is open) */}
          <div style={{ minWidth: 0, marginRight: open ? 340 : 56, transition: "margin .2s" }}>
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

          {/* Right-side collapsible menu */}
          <aside
            style={{
              position: "fixed",
              top: 72,
              right: 0,
              zIndex: 20,
              width: open ? 320 : 48,
              maxHeight: "calc(100vh - 88px)",
              overflowY: "auto",
              background: BG,
              border: "1px solid rgba(0, 217, 255, 0.25)",
              borderRight: 0,
              borderRadius: "12px 0 0 12px",
              transition: "width .2s",
            }}
          >
            <button
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                background: "transparent",
                color: "inherit",
                border: 0,
                cursor: "pointer",
                font: "inherit",
                fontWeight: 600,
              }}
            >
              {open && <span>Notifications{updates.length > 0 ? ` (${updates.length})` : ""}</span>}
              <span aria-hidden style={{ transform: open ? "none" : "rotate(180deg)", transition: "transform .2s" }}>
                ›
              </span>
            </button>

            {open && (
              <div style={{ padding: "0 16px 16px", display: "grid", gap: 12 }}>
                {updates.length === 0 && (
                  <p className="muted" style={{ margin: 0 }}>No new notifications.</p>
                )}
                {updates.map((u) => (
                  <div
                    key={u.version}
                    style={{ padding: 12, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  >
                    <div style={{ fontWeight: 600 }}>New version: Jarvis v{u.version}</div>
                    <div className="muted" style={{ fontSize: 13, margin: "2px 0 10px" }}>
                      Released {fmtDate(u.released_at)}
                    </div>
                    <a
                      className="btn primary"
                      href={u.downloaded ? undefined : u.link}
                      onClick={(e) => {
                        if (u.downloaded) return e.preventDefault();
                        toastOk("Download started.");
                        setTimeout(loadUpdates, 2500);
                      }}
                      style={u.downloaded ? { opacity: 0.4, pointerEvents: "none", cursor: "not-allowed" } : undefined}
                    >
                      {u.downloaded ? "Downloaded" : "Download"}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}