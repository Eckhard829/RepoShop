import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MagicBento from "../components/MagicBento";
import DashBar from "../components/DashBar";
import { api, post } from "../api";

const BG = "#0a0f12";
const ACCENT = "#00d9ff";
const SEEN_KEY = "jarvis_login_popup_seen";

// Customer route that returns only SENT notifications.
const NOTIFICATIONS_URL = "/api/me/notifications";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "-";

const disabledStyle = { opacity: 0.4, pointerEvents: "none", cursor: "not-allowed" };

function NotificationItem({ u, onDownloaded }) {
  return (
    <div
      style={{
        padding: 14,
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
      }}
    >
      <div style={{ fontWeight: 600 }}>{u.title}</div>
      <div className="muted" style={{ fontSize: 13, margin: "2px 0 8px" }}>
        {fmtDate(u.sent_at || u.created_at)}
      </div>
      {(u.message || u.body) && (
        <p style={{ margin: "0 0 10px", fontSize: 14 }}>{u.message || u.body}</p>
      )}
      {u.link && (
        <a
          className="btn primary"
          href={u.downloaded ? undefined : u.link}
          onClick={(e) => {
            if (u.downloaded) return e.preventDefault();
            setTimeout(onDownloaded, 2500);
          }}
          style={u.downloaded ? disabledStyle : undefined}
        >
          {u.downloaded ? "Downloaded" : "Download"}
        </a>
      )}
    </div>
  );
}

export default function Dashboard() {
  const nav = useNavigate();
  const [m, setM] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [open, setOpen] = useState(false); // side drawer
  const [showPopup, setShowPopup] = useState(false); // login popup

  const load = () =>
    api("/api/me")
      .then((d) =>
        d.role === "admin" && !d.impersonating
          ? nav("/admin", { replace: true })
          : setM(d),
      )
      .catch(() => nav("/login", { replace: true }));

  // Notifications are created and sent by the admin; this only lists them.
  const loadUpdates = () =>
    api(NOTIFICATIONS_URL)
      .then((d) => setUpdates(Array.isArray(d) ? d : d.notifications || []))
      .catch(() => setUpdates([]));

  useEffect(() => {
    load();
    loadUpdates();
  }, []);

  // Popup once per login session, only if there is something to show.
  useEffect(() => {
    if (!m || m.impersonating || !updates.length) return;
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return;
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* storage blocked: still show the popup */
    }
    setShowPopup(true);
  }, [m, updates]);

  // Esc closes whatever is open.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      setShowPopup(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!m)
    return (
      <div className="dpage">
        <p className="muted">Loading...</p>
      </div>
    );

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
          style={m.downloaded || !m.link ? disabledStyle : undefined}
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
        ? `Here are your new notifications. Latest: ${updates[0].title || "New message"}`
        : "Here are your new notifications. Nothing new right now.",
      extra: (
        <button className="primary" onClick={() => setOpen(true)}>
          View notifications
        </button>
      ),
    },
  ];

  const closeBtn = {
    width: 40,
    height: 40,
    display: "grid",
    placeItems: "center",
    background: "transparent",
    color: "inherit",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 18,
  };

  return (
    <>
      <DashBar email={m.email} />
      <div className="dpage">
        {m.impersonating && (
          <div className="imp">
            <span>Viewing as {m.email}</span>
            <button
              onClick={async () => {
                await post("/api/admin/stop");
                nav("/admin");
              }}
            >
              Back to admin
            </button>
          </div>
        )}
        <h1 className="dtitle">Your dashboard</h1>

        {/* Blocks never resize: the drawer overlays the page. */}
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

      {/* Edge tab to reopen the drawer */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open notifications"
          style={{
            position: "fixed",
            top: 96,
            right: 0,
            zIndex: 30,
            padding: "10px 14px",
            background: BG,
            color: "inherit",
            border: "1px solid rgba(0, 217, 255, 0.25)",
            borderRight: 0,
            borderRadius: "10px 0 0 10px",
            cursor: "pointer",
            font: "inherit",
            fontWeight: 600,
          }}
        >
          Notifications{updates.length > 0 ? ` (${updates.length})` : ""}
        </button>
      )}

      {/* Side drawer (fixed 420px, same size every time) */}
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.55)" }}
          />
          <aside
            role="dialog"
            aria-label="Notifications"
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              zIndex: 41,
              width: 420,
              maxWidth: "100vw",
              display: "flex",
              flexDirection: "column",
              background: BG,
              borderLeft: "1px solid rgba(0, 217, 255, 0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h2 style={{ margin: 0, fontSize: 20 }}>Notifications</h2>
              <button onClick={() => setOpen(false)} aria-label="Close notifications" style={closeBtn}>
                ✕
              </button>
            </div>
            <div style={{ padding: 20, overflowY: "auto", display: "grid", gap: 12, alignContent: "start" }}>
              {updates.length === 0 && (
                <p className="muted" style={{ margin: 0 }}>No notifications yet.</p>
              )}
              {updates.map((u) => (
                <NotificationItem key={u.id || u._id} u={u} onDownloaded={loadUpdates} />
              ))}
            </div>
          </aside>
        </>
      )}

      {/* Login popup */}
      {showPopup && (
        <div
          onClick={() => setShowPopup(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "grid",
            placeItems: "center",
            padding: 16,
            background: "rgba(0,0,0,0.6)",
          }}
        >
          <div
            role="dialog"
            aria-label="New notifications"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 440,
              maxWidth: "100%",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              background: BG,
              border: `1px solid ${ACCENT}40`,
              borderRadius: 14,
            }}
          >
            <div style={{ padding: "20px 20px 12px" }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>
                You have {updates.length} new notification{updates.length === 1 ? "" : "s"}
              </h2>
            </div>
            <div style={{ padding: "0 20px", overflowY: "auto", display: "grid", gap: 12 }}>
              {updates.slice(0, 3).map((u) => (
                <NotificationItem key={u.id || u._id} u={u} onDownloaded={loadUpdates} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: 20 }}>
              <button onClick={() => setShowPopup(false)}>Close</button>
              <button
                className="primary"
                onClick={() => {
                  setShowPopup(false);
                  setOpen(true);
                }}
              >
                {updates.length > 3 ? "View all" : "Open panel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}