import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import TextType from "../components/TextType";
import ScrollReveal from "../components/ScrollReveal";
import MagicBento from "../components/MagicBento";
import "../pages/Home.css";

const NOW = "R1000",
  WAS = "R2450";

/* ---------- helpers ---------- */
const speak = (t, on, off) => {
  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.pitch = 0.85;
    u.onstart = on;
    u.onend = u.onerror = off;
    speechSynthesis.speak(u);
  } else {
    on();
    setTimeout(off, Math.min(4000, t.length * 45));
  }
};

function NeuralBG() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current,
      x = c.getContext("2d");
    let w,
      h,
      raf,
      m = { x: -999, y: -999 };
    const P = Array.from({ length: innerWidth < 700 ? 34 : 70 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 3e-4,
      vy: (Math.random() - 0.5) * 3e-4,
    }));
    const fit = () => {
      const d = Math.min(devicePixelRatio || 1, 2);
      w = c.offsetWidth;
      h = c.offsetHeight;
      c.width = w * d;
      c.height = h * d;
      x.setTransform(d, 0, 0, d, 0, 0);
    };
    const mv = (e) => {
      const r = c.getBoundingClientRect();
      m = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    fit();
    addEventListener("resize", fit);
    addEventListener("pointermove", mv);
    const loop = () => {
      x.clearRect(0, 0, w, h);
      P.forEach((p) => {
        p.x = (p.x + p.vx + 1) % 1;
        p.y = (p.y + p.vy + 1) % 1;
      });
      for (let i = 0; i < P.length; i++) {
        const a = P[i],
          ax = a.x * w,
          ay = a.y * h;
        for (let j = i + 1; j < P.length; j++) {
          const d = Math.hypot(ax - P[j].x * w, ay - P[j].y * h);
          if (d < 130) {
            x.strokeStyle = `rgba(0,217,255,${(1 - d / 130) * 0.25})`;
            x.beginPath();
            x.moveTo(ax, ay);
            x.lineTo(P[j].x * w, P[j].y * h);
            x.stroke();
          }
        }
        const dm = Math.hypot(ax - m.x, ay - m.y);
        if (dm < 180) {
          x.strokeStyle = `rgba(124,92,255,${(1 - dm / 180) * 0.6})`;
          x.beginPath();
          x.moveTo(ax, ay);
          x.lineTo(m.x, m.y);
          x.stroke();
        }
        x.fillStyle = "#00D9FF";
        x.beginPath();
        x.arc(ax, ay, 1.6, 0, 7);
        x.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", fit);
      removeEventListener("pointermove", mv);
    };
  }, []);
  return <canvas ref={ref} className="jv-bg" />;
}

const Orb = ({ on, onClick, label }) => (
  <div
    className={"orb" + (on ? " on" : "")}
    onClick={onClick}
    role={onClick ? "button" : undefined}
    aria-label={label}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={
      onClick
        ? (e) =>
            (e.key === "Enter" || e.key === " ") &&
            (e.preventDefault(), onClick())
        : undefined
    }
  >
    <i />
    <i />
    <i />
    <b />
  </div>
);

function Wave({ active }) {
  const r = useRef([]);
  useEffect(() => {
    let raf,
      t = 0;
    const f = () => {
      t += 0.12;
      r.current.forEach((b, i) => {
        const a = active
          ? 0.25 +
            0.75 * Math.abs(Math.sin(t + i * 0.5) * Math.cos(t * 0.7 + i * 0.2))
          : 0.08 + 0.04 * Math.sin(t * 0.5 + i);
        if (b) b.style.transform = `scaleY(${a})`;
      });
      raf = requestAnimationFrame(f);
    };
    f();
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return (
    <div className="wave">
      {Array.from({ length: 40 }, (_, i) => (
        <span key={i} ref={(e) => (r.current[i] = e)} />
      ))}
    </div>
  );
}

const Win = ({ title, children }) => (
  <div className="win">
    <div className="win-bar">
      <i />
      <i />
      <i />
      <span>{title}</span>
    </div>
    {children}
  </div>
);

/* ---------- Screen 1: Voice ---------- */
const REPLIES = [
  [
    /music|play|song|chill/,
    "Sure! Playing something chill. Just say next any time to skip.",
  ],
  [
    /research|find|look up|search/,
    "On it. I'll open the browser, read a few websites and give you a short summary.",
  ],
  [/joke/, "Why did the computer get glasses? To improve its web sight!"],
  [
    /time|date/,
    () =>
      `It's ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
  ],
  [
    /can you do|help|what/,
    "I can listen for Hey Jarvis, control your music, research the web for you, and think with any AI you connect.",
  ],
];
const reply = (q) => {
  const r = REPLIES.find(([re]) => re.test(q.toLowerCase()));
  const v = r
    ? r[1]
    : "Got it! In the full version I'd take care of that for you.";
  return typeof v === "function" ? v() : v;
};
const PHRASES = [
  "Hey Jarvis, what can you do?",
  "Hey Jarvis, play something chill",
  "Hey Jarvis, research electric cars",
  "Hey Jarvis, tell me a joke",
];

function VoiceScreen() {
  const [msgs, setMsgs] = useState([
    {
      w: "j",
      t: "Hi! I'm Jarvis. Tap the mic (or pick a phrase) and talk to me.",
    },
  ]);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [voice, setVoice] = useState(true);
  const box = useRef(null);
  useEffect(() => {
    box.current?.scrollTo({ top: 1e5, behavior: "smooth" });
  }, [msgs]);
  useEffect(
    () => () => "speechSynthesis" in window && speechSynthesis.cancel(),
    [],
  );
  const ask = (q) => {
    setMsgs((m) => [...m, { w: "u", t: q }]);
    setTimeout(() => {
      const a = reply(q);
      setMsgs((m) => [...m, { w: "j", t: a }]);
      if (voice)
        speak(
          a,
          () => setSpeaking(true),
          () => setSpeaking(false),
        );
      else {
        setSpeaking(true);
        setTimeout(() => setSpeaking(false), 1800);
      }
    }, 500);
  };
  const mic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return ask("What can you do?");
    const r = new SR();
    r.lang = "en-US";
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onresult = (e) => ask(e.results[0][0].transcript);
    r.start();
  };
  return (
    <Win title="Jarvis · Voice">
      <div className="scr voice">
        <div className="vleft">
          <Orb
            on={speaking || listening}
            onClick={mic}
            label="Talk to Jarvis"
          />
          <p className="muted small">
            {listening
              ? "Listening…"
              : speaking
                ? "Speaking…"
                : "Tap the orb to talk"}
          </p>
          <Wave active={speaking || listening} />
          <label className="tgl">
            <input
              type="checkbox"
              checked={voice}
              onChange={(e) => setVoice(e.target.checked)}
            />{" "}
            Jarvis speaks out loud
          </label>
        </div>
        <div className="vright">
          <div className="chat" ref={box}>
            {msgs.map((m, i) => (
              <div key={i} className={"bub " + m.w}>
                {m.t}
              </div>
            ))}
          </div>
          <div className="chips2">
            {PHRASES.map((p) => (
              <button key={p} onClick={() => ask(p)}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Win>
  );
}

/* ---------- Screen 2: Music ---------- */
const TRACKS = [
  { t: "Midnight Circuit", len: 184, h: 190, root: 220, sc: [0, 3, 7, 10] },
  { t: "Neon Sunrise", len: 203, h: 300, root: 196, sc: [0, 2, 4, 7] },
  { t: "Quiet Server Room", len: 157, h: 160, root: 262, sc: [0, 4, 7, 11] },
];
const fmt = (s) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function MusicScreen() {
  const [i, setI] = useState(0),
    [on, setOn] = useState(false),
    [p, setP] = useState(0),
    [vol, setVol] = useState(40),
    [heard, setHeard] = useState("");
  const tr = TRACKS[i],
    volR = useRef(vol),
    ctx = useRef(null);
  volR.current = vol;
  useEffect(() => {
    if (!on) return;
    const t = setInterval(
      () =>
        setP((x) =>
          x + 1 >= tr.len ? (setI((n) => (n + 1) % TRACKS.length), 0) : x + 1,
        ),
      1000,
    );
    return () => clearInterval(t);
  }, [on, tr]);
  useEffect(() => {
    if (!on) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = ctx.current || (ctx.current = new AC());
    c.resume();
    let s = 0;
    const id = setInterval(() => {
      const o = c.createOscillator(),
        g = c.createGain(),
        v = (volR.current / 100) * 0.2 + 1e-4,
        n = c.currentTime;
      o.type = "triangle";
      o.frequency.value =
        tr.root * 2 ** (tr.sc[s % 4] / 12 + (s % 8 > 3 ? 1 : 0));
      g.gain.setValueAtTime(1e-4, n);
      g.gain.exponentialRampToValueAtTime(v, n + 0.05);
      g.gain.exponentialRampToValueAtTime(1e-4, n + 0.7);
      o.connect(g).connect(c.destination);
      o.start();
      o.stop(n + 0.75);
      s++;
    }, 380);
    return () => clearInterval(id);
  }, [on, tr]);
  useEffect(
    () => () => {
      ctx.current?.close();
    },
    [],
  );
  const next = () => {
    setI((n) => (n + 1) % TRACKS.length);
    setP(0);
  };
  const prev = () => {
    setI((n) => (n + TRACKS.length - 1) % TRACKS.length);
    setP(0);
  };
  const cmd = (label, fn) => () => {
    setHeard(label);
    fn();
  };
  return (
    <Win title="Jarvis · Music">
      <div className="scr music">
        <div
          className="art"
          style={{
            background: `conic-gradient(from 90deg,hsl(${tr.h} 90% 55%),hsl(${tr.h + 80} 90% 40%),hsl(${tr.h} 90% 55%))`,
          }}
        >
          <div className={"eq" + (on ? " on" : "")}>
            {Array.from({ length: 24 }, (_, k) => (
              <span
                key={k}
                style={{
                  animationDelay: `${(k * 97) % 700}ms`,
                  animationDuration: `${500 + ((k * 173) % 600)}ms`,
                }}
              />
            ))}
          </div>
        </div>
        <div className="mctl">
          <h3>{tr.t}</h3>
          <p className="muted small">
            Jarvis Radio · demo tune made live in your browser
          </p>
          <input
            type="range"
            min="0"
            max={tr.len}
            value={p}
            onChange={(e) => setP(+e.target.value)}
            aria-label="Song position"
          />
          <div className="time">
            <span>{fmt(p)}</span>
            <span>{fmt(tr.len)}</span>
          </div>
          <div className="btns">
            <button onClick={prev} aria-label="Previous">
              ⏮
            </button>
            <button
              className="primary big"
              onClick={() => setOn(!on)}
              aria-label={on ? "Pause" : "Play"}
            >
              {on ? "❚❚" : "▶"}
            </button>
            <button onClick={next} aria-label="Next">
              ⏭
            </button>
            <span className="vol">
              🔊
              <input
                type="range"
                min="0"
                max="100"
                value={vol}
                onChange={(e) => setVol(+e.target.value)}
                aria-label="Volume"
              />
            </span>
          </div>
          <div className="say">
            <small>Or just ask Jarvis:</small>
            <div className="chips2">
              <button onClick={cmd('"Hey Jarvis, play"', () => setOn(true))}>
                Play
              </button>
              <button onClick={cmd('"Hey Jarvis, pause"', () => setOn(false))}>
                Pause
              </button>
              <button
                onClick={cmd('"Hey Jarvis, next song"', () => {
                  next();
                  setOn(true);
                })}
              >
                Next song
              </button>
              <button
                onClick={cmd('"Hey Jarvis, turn it up"', () =>
                  setVol((v) => Math.min(100, v + 20)),
                )}
              >
                Louder
              </button>
              <button
                onClick={cmd('"Hey Jarvis, turn it down"', () =>
                  setVol((v) => Math.max(0, v - 20)),
                )}
              >
                Quieter
              </button>
            </div>
            <p className="heard">
              {heard ? (
                <>
                  🎙 Jarvis heard: <b>{heard}</b>
                </>
              ) : (
                "Tap a button to see what Jarvis would hear."
              )}
            </p>
          </div>
        </div>
      </div>
    </Win>
  );
}

/* ---------- Screen 3: Research ---------- */
const STEPS = [
  "Opening the browser",
  "Searching the web",
  "Reading 6 websites",
  "Comparing what they say",
  "Writing your summary",
];
const SRC = [
  ["news-daily.example", 92],
  ["tech-review.example", 84],
  ["the-guide.example", 77],
  ["wiki-style.example", 71],
  ["expert-blog.example", 64],
  ["forum-talk.example", 38],
];

function ResearchScreen() {
  const [q, setQ] = useState("best budget electric cars");
  const [st, setSt] = useState(-1);
  const timer = useRef();
  const run = st >= 0 && st < STEPS.length;
  const go = (topic = q) => {
    if (run || !topic.trim()) return;
    setQ(topic);
    setSt(0);
    let n = 0;
    timer.current = setInterval(() => {
      n++;
      setSt(n);
      if (n >= STEPS.length) clearInterval(timer.current);
    }, 1100);
  };
  useEffect(() => () => clearInterval(timer.current), []);
  return (
    <Win title="Jarvis · Research">
      <div className="scr research">
        <div className="rleft">
          <label>What should Jarvis look up?</label>
          <div className="ask">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && go()}
              placeholder="Type anything…"
            />
            <button className="primary" onClick={() => go()} disabled={run}>
              {run ? "Working…" : "Go"}
            </button>
          </div>
          <div className="chips2">
            {[
              "cheap flights to Cape Town",
              "how solar panels work",
              "best laptop for students",
            ].map((c) => (
              <button key={c} onClick={() => go(c)}>
                {c}
              </button>
            ))}
          </div>
          <ol className="steps">
            {STEPS.map((s, k) => (
              <li key={s} className={st > k ? "done" : st === k ? "now" : ""}>
                <i>{st > k ? "✓" : k + 1}</i>
                {s}
              </li>
            ))}
          </ol>
        </div>
        <div className="browser">
          <div className="url">
            <i />
            <span>
              {st < 0
                ? "jarvis://ready"
                : `https://search.example/?q=${encodeURIComponent(q)}`}
            </span>
          </div>
          <div className="bprog">
            <span style={{ width: `${Math.max(0, Math.min(st, 5)) * 20}%` }} />
          </div>
          <div className="bbody">
            {st < 2 && (
              <p className="muted center pad">
                {st < 0
                  ? "Jarvis will browse here, just like you would."
                  : "Searching…"}
              </p>
            )}
            {st >= 2 &&
              SRC.map(([d, a], k) => (
                <div
                  className="src"
                  key={d}
                  style={{ animationDelay: `${k * 120}ms` }}
                >
                  <span>{d}</span>
                  <em>
                    <b style={{ width: st >= 3 ? a + "%" : "0%" }} />
                  </em>
                  <small>{st >= 3 ? a + "% match" : "reading…"}</small>
                </div>
              ))}
            {st >= STEPS.length && (
              <div className="result">
                <strong>Summary for “{q}”</strong>
                <p>
                  I read 6 websites. Most agree on the big points, a couple
                  disagree on the details, and I've marked which ones. Want me
                  to save this as a note?
                </p>
                <small className="muted">
                  Sample answer. In real life Jarvis uses live websites.
                </small>
              </div>
            )}
          </div>
        </div>
      </div>
    </Win>
  );
}

/* ---------- Any model ---------- */
const MODELS = [
  "GPT",
  "Claude",
  "Gemini",
  "Llama (local & free)",
  "Mistral",
  "Your own",
];
function Models() {
  const [m, setM] = useState(null);
  return (
    <div className="models">
      <div className="mrow">
        {MODELS.map((x) => (
          <button
            key={x}
            className={m === x ? "on" : ""}
            onClick={() => setM(x)}
          >
            {x}
          </button>
        ))}
      </div>
      <div className={"link" + (m ? " live" : "")}>
        <span />
      </div>
      <Orb on={!!m} label="Jarvis core" />
      <p className="mstat">
        {m ? (
          <>
            Connected ✓ Jarvis is now thinking with <b>{m}</b>.
          </>
        ) : (
          "Pick a brain for Jarvis ↑"
        )}
      </p>
    </div>
  );
}

/* ---------- Price graph ---------- */
function CostGraph() {
  const W = 520,
    H = 230,
    px = (mo) => 40 + (mo / 24) * (W - 60),
    py = (v) => H - 30 - (v / 6000) * (H - 50);
  return (
    <svg
      className="cg"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Monthly subscription cost versus one payment of Jarvis"
    >
      {[0, 2000, 4000, 6000].map((v) => (
        <g key={v}>
          <line x1="40" x2={W - 20} y1={py(v)} y2={py(v)} className="gl" />
          <text x="34" y={py(v) + 4} textAnchor="end">
            R{v / 1000}k
          </text>
        </g>
      ))}
      <path
        pathLength="1"
        d={`M${px(0)},${py(0)} L${px(24)},${py(6000)}`}
        stroke="#ff5c6c"
      />
      <path
        pathLength="1"
        d={`M${px(0)},${py(1000)} L${px(24)},${py(1000)}`}
        stroke="#00D9FF"
      />
      <circle cx={px(4)} cy={py(1000)} r="5" fill="#fff" className="pop" />
      <text x={px(4) + 10} y={py(1000) - 12} fill="#fff" className="lbl">
        Month 4: Jarvis is already cheaper
      </text>
      <text
        x={px(24) - 4}
        y={py(6000) + 16}
        textAnchor="end"
        fill="#ff5c6c"
        className="lbl"
      >
        Monthly plan
      </text>
      <text
        x={px(24) - 4}
        y={py(1000) + 18}
        textAnchor="end"
        fill="#00D9FF"
        className="lbl"
      >
        Jarvis (pay once)
      </text>
      <text x={W / 2} y={H - 4} textAnchor="middle" className="ax">
        Months
      </text>
    </svg>
  );
}

/* ---------- Page ---------- */
const TABS = [
  ["Voice", "🎙 Talk to it"],
  ["Music", "🎵 Play music"],
  ["Research", "🌐 Research"],
];
const CARDS = [
  {
    color: "#0a0f12",
    label: "Hands free",
    title: "Hey Jarvis",
    description: 'Say "Hey Jarvis" and it wakes up. No typing, no clicking.',
  },
  {
    color: "#0a0f12",
    label: "Your music",
    title: "Music control",
    description:
      "Play, pause, skip and change the volume with just your voice.",
  },
  {
    color: "#0a0f12",
    label: "Does the homework",
    title: "Web research",
    description:
      "Jarvis opens the browser, reads websites and gives you a short summary.",
  },
  {
    color: "#0a0f12",
    label: "Your choice",
    title: "Any AI brain",
    description: "Connect any AI model you like, today or in the future.",
  },
  {
    color: "#0a0f12",
    label: "Always fresh",
    title: "Free updates",
    description: "Every new version is yours at no extra cost.",
  },
  {
    color: "#0a0f12",
    label: "Simple",
    title: "Pay once",
    description: "One payment. No monthly fees. Download it and keep it.",
  },
];
const FAQ = [
  [
    "Do I need to be technical?",
    "No. Jarvis is made for everyday people. Download it, open it and say hello.",
  ],
  ["Is it a subscription?", "No. You pay once and Jarvis is yours."],
  [
    "Do I pay again for new versions?",
    "Never. Every new version we release is free for you.",
  ],
  [
    "Which AI does it use?",
    "Any model you connect. There are free options, and some AI companies charge for their own service. That choice is yours.",
  ],
];

export default function Home() {
  const [tab, setTab] = useState("Voice");
  const [hi, setHi] = useState(false);
  useEffect(
    () => () => "speechSynthesis" in window && speechSynthesis.cancel(),
    [],
  );
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) =>
        es.forEach(
          (e) =>
            e.isIntersecting &&
            (e.target.classList.add("in"), io.unobserve(e.target)),
        ),
      { threshold: 0.15 },
    );
    document.querySelectorAll(".jv .rv").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  const hello = () =>
    speak(
      "Hello. I'm Jarvis. Say hey Jarvis, and I'll take care of the rest.",
      () => setHi(true),
      () => setHi(false),
    );
  const word = [
    "Meet Jarvis.",
    'Just say "Hey Jarvis".',
    "Your own AI assistant.",
  ];
  const ticker = [
    "HEY JARVIS",
    "MUSIC CONTROL",
    "WEB RESEARCH",
    "ANY AI MODEL",
    "PAY ONCE",
    "FREE UPDATES",
  ];

  return (
    <div className="jv">
      <header className="jv-herowrap">
        <NeuralBG />
        <div className="jv-hero">
          <div className="rv in">
            <span className="badge">● LAUNCH SPECIAL · SAVE R1450</span>
            <h1>
              <TextType
                as="span"
                text={word}
                typingSpeed={70}
                deletingSpeed={40}
                pauseDuration={1600}
                cursorCharacter="_"
              />
            </h1>
            <p className="lead">
              A private AI assistant that lives on your computer. Talk to it,
              play your music and let it search the internet for you. No tech
              skills needed.
            </p>
            <div className="cta">
              <Link className="btn primary glow" to="/signup">
                Get Jarvis for {NOW}
              </Link>
              <a className="btn" href="#demo">
                Try it live ↓
              </a>
            </div>
            <p className="muted small">
              One payment · Free updates · Checkout by Yoco
            </p>
          </div>
          <div className="rv in orbbox">
            <Orb on={hi} onClick={hello} label="Click to hear Jarvis" />
            <p className="muted small center">
              👆 Click the orb. Jarvis will say hello.
            </p>
          </div>
        </div>
      </header>

      <div className="tick" aria-hidden="true">
        <div>
          {[...ticker, ...ticker, ...ticker, ...ticker].map((t, i) => (
            <span key={i}>
              {t} <b>✦</b>
            </span>
          ))}
        </div>
      </div>

      <ScrollReveal
        baseOpacity={0.1}
        enableBlur
        baseRotation={3}
        blurStrength={4}
      >
        Imagine an assistant that never sleeps. You talk, it listens. It plays
        your songs, reads the internet for you and gets smarter with every
        update.
      </ScrollReveal>

      <section className="sec" id="demo">
        <div className="rv center">
          <h2 className="h2">Try it right now</h2>
          <p className="muted">
            These are real, working demos. Go on, click everything.
          </p>
        </div>
        <div className="tabs rv">
          {TABS.map(([k, l]) => (
            <button
              key={k}
              className={tab === k ? "on" : ""}
              onClick={() => setTab(k)}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="rv">
          {tab === "Voice" && <VoiceScreen />}
          {tab === "Music" && <MusicScreen />}
          {tab === "Research" && <ResearchScreen />}
        </div>
      </section>

      <section className="sec">
        <div className="rv center">
          <h2 className="h2">Everything Jarvis does</h2>
          <p className="muted">Simple things, done really well.</p>
        </div>
        <div className="jv-bento rv">
          <MagicBento
            cards={CARDS}
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
      </section>

      <section className="sec">
        <div className="rv center">
          <h2 className="h2">Plug in any AI brain</h2>
          <p className="muted">
            Jarvis is the body. You choose the brain, and you can swap it any
            time.
          </p>
        </div>
        <div className="rv">
          <Models />
        </div>
      </section>

      <section className="sec">
        <div className="rv center">
          <h2 className="h2">Three steps. That's it.</h2>
        </div>
        <div className="steps3">
          {[
            ["1", "Buy once", "Sign up and pay securely."],
            [
              "2",
              "Download",
              "Your private download appears in your dashboard.",
            ],
            ["3", 'Say "Hey Jarvis"', "And watch it work."],
          ].map(([n, t, d], k) => (
            <div
              className="card rv"
              style={{ transitionDelay: `${k * 120}ms` }}
              key={n}
            >
              <span className="num">{n}</span>
              <h3>{t}</h3>
              <p className="muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="sec price">
        <div className="pgrid">
          <div className="rv">
            <h2 className="h2">
              Pay once.
              <br />
              Keep it. Forever.
            </h2>
            <p className="muted">
              Most assistants charge you every month. Jarvis doesn't. Here's
              what that looks like over two years, using an example plan of R250
              a month.
            </p>
            <CostGraph />
          </div>
          <div className="card pcard rv">
            <span className="badge">LAUNCH SPECIAL · 59% OFF</span>
            <h3>Jarvis, full version</h3>
            <div className="pr">
              <s>{WAS}</s>
              <strong>{NOW}</strong>
            </div>
            <ul>
              <li>✓ "Hey Jarvis" voice wake-up</li>
              <li>✓ Music control by voice</li>
              <li>✓ Web research in the browser</li>
              <li>✓ Works with any AI model you connect</li>
              <li>✓ Every future version, free</li>
              <li>✓ One payment. No monthly fees.</li>
            </ul>
            <Link className="btn primary glow full center" to="/signup">
              Buy Jarvis now
            </Link>
            <p className="muted small center">
              Secure checkout by Yoco. We never see your card details.
            </p>
          </div>
        </div>
      </section>

      <section className="sec narrowx">
        <div className="rv center">
          <h2 className="h2">Questions?</h2>
        </div>
        {FAQ.map(([q, a]) => (
          <details className="faq rv" key={q}>
            <summary>{q}</summary>
            <p className="muted">{a}</p>
          </details>
        ))}
      </section>

      <section className="final rv">
        <h2 className="h2">Ready to say "Hey Jarvis"?</h2>
        <p className="muted">
          Launch price of {NOW} (normally {WAS}). One payment, free updates.
        </p>
        <Link className="btn primary glow" to="/signup">
          Get Jarvis
        </Link>
      </section>
    </div>
  );
}
