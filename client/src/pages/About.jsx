import { Link } from "react-router-dom";
import { PRICE } from "../api";
import "./PublicPage.css";
import "./About.css";

export default function About() {
  return (
    <div className="pp">
      <header className="pp-hero">
        <span className="pp-label">● About</span>
        <h1>
          Meet <span>Jarvis</span>.
        </h1>
        <p className="pp-lead">
          A private AI assistant you own outright. One payment, no
          subscriptions, free updates forever. Built for people who want
          real tools, not another monthly bill.
        </p>
      </header>

      <section className="pp-sec wide">
        <div className="pp-split">
          <div className="pp-card">
            <h3>The story</h3>
            <div className="pp-story">
              <p>
                Most AI assistants charge a monthly fee and live in someone
                else's cloud. We wanted the opposite: an assistant that runs
                on your computer, listens only when you ask it to, and belongs
                to you the day you buy it.
              </p>
              <p>
                Jarvis is the result. It listens for{" "}
                <em>"Hey Jarvis"</em>, plays your music, browses the web for
                you, and can think with any AI model you connect — GPT,
                Claude, Gemini, a local Llama, or your own. You choose the
                brain, we handle the body.
              </p>
              <p>
                We sell it directly, at {PRICE} once. No middlemen, no
                app-store markup, no hidden fees. When a new version ships,
                you get it free, forever.
              </p>
            </div>
          </div>

          <div className="pp-card">
            <h3>By the numbers</h3>
            <ul className="pp-stats">
              <li>
                <b>200+</b>
                <span>builders already using Jarvis</span>
              </li>
              <li>
                <b>4.9 / 5</b>
                <span>average rating from early access</span>
              </li>
              <li>
                <b>{PRICE}</b>
                <span>one-time, never a subscription</span>
              </li>
              <li>
                <b>∞</b>
                <span>free updates, forever</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="pp-sec">
        <div className="ab-stack">
          <span className="pp-label">● What we stand for</span>
          <div className="ab-values">
            <div className="pp-card">
              <h3>
                <span className="ab-dot" /> You own it
              </h3>
              <p>
                Pay once, own forever. No lock-in, no per-seat pricing, no
                quiet price hikes in your inbox.
              </p>
            </div>
            <div className="pp-card">
              <h3>
                <span className="ab-dot" /> Privacy first
              </h3>
              <p>
                Jarvis listens only when you say the wake word. Nothing is
                recorded or sent anywhere you didn't choose.
              </p>
            </div>
            <div className="pp-card">
              <h3>
                <span className="ab-dot" /> Any AI you like
              </h3>
              <p>
                Bring your own model. Swap it any time. We don't gate you to
                one company or one subscription.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pp-final">
        <h2>Ready to meet Jarvis?</h2>
        <p>
          One payment of {PRICE}. Free updates. Download it today and say
          hello.
        </p>
        <Link className="btn primary glow" to="/signup">
          Get Jarvis
        </Link>
      </section>
    </div>
  );
}
