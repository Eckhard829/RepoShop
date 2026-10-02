import { Link } from "react-router-dom";
import { EMAIL } from "../api";
import "./PublicPage.css";
import "./Contact.css";

export default function Contact() {
  return (
    <div className="pp">
      <header className="pp-hero">
        <span className="pp-label">● Contact</span>
        <h1>
          Let's <span>talk</span>.
        </h1>
        <p className="pp-lead">
          Most questions get answered the same day. Pick whichever way suits you
          — we read everything.
        </p>
      </header>

      <section className="pp-sec wide">
        <div className="ct-grid">
          <div className="pp-card ct-card">
            <h3>Email us</h3>
            <p className="pp-meta">The fastest way to reach a real human.</p>
            <a className="pp-bigbtn" href={`mailto:${EMAIL}`}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 6 9-6" />
              </svg>
              {EMAIL}
            </a>
            <div className="ct-meta-list">
              <span>
                Typical reply <b>under 4 hours</b>
              </span>
              <span>
                Support hours <b>Mon–Fri, 9–5 SAST</b>
              </span>
              <span>
                Refunds <b>within 14 days</b>
              </span>
            </div>
          </div>

          <div className="pp-card ct-card">
            <h3>Common questions</h3>
            <div className="pp-faq">
              <details>
                <summary>Do I pay again for new versions?</summary>
                <p>
                  Never. Once you've bought Jarvis, every future version is
                  yours at no extra cost.
                </p>
              </details>
              <details>
                <summary>Can I re-download after my link expires?</summary>
                <p>
                  Unfortunately not. The download link is only valid for a one
                  time download. If you need a new one, email us and we'll send
                  it.
                </p>
              </details>
              <details>
                <summary>I paid but haven't got access — what now?</summary>
                <p>
                  Give it a minute for the the backend process to sync with our
                  servers, then refresh your dashboard. Still stuck? Email us
                  and we'll fix it fast.
                </p>
              </details>
              <details>
                <summary>Can I change the email on my account?</summary>
                <p>
                  Email us from your current address with the new one and we
                  will move it across for you.
                </p>
              </details>
            </div>
          </div>
        </div>
      </section>

      <section className="pp-final">
        <h2>Want a Jarvis</h2>
        <p>Click the button below to purchase it now.</p>
        <Link className="btn primary glow" to="/">
          Buy it now
        </Link>
      </section>
    </div>
  );
}
