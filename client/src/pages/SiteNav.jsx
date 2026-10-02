import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import PillNav from "./PillNav";
import "./SiteNav.css";

// Inline logo (Jarvis ring), so no image file is needed. Dark on the cyan pill.
const LOGO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="none" stroke="#000" stroke-width="4" stroke-dasharray="6 5"/><circle cx="32" cy="32" r="17" fill="none" stroke="#000" stroke-width="4"/><circle cx="32" cy="32" r="7" fill="#000"/></svg>',
  );

// First item MUST be the home route (PillNav uses it for the logo link).
const ITEMS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Log in", href: "/login" },
  { label: "Sign up", href: "/signup" },
];

export default function SiteNav({ items = ITEMS, price = "R1000" }) {
  const { pathname } = useLocation();
  const bar = useRef(null);

  // Scroll progress line at the very top of the screen
  useEffect(() => {
    const f = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      if (bar.current)
        bar.current.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`;
    };
    f();
    addEventListener("scroll", f, { passive: true });
    addEventListener("resize", f);
    return () => {
      removeEventListener("scroll", f);
      removeEventListener("resize", f);
    };
  }, [pathname]);

  return (
    <>
      <div className="nav-prog" ref={bar} aria-hidden="true" />
      <PillNav
        logo={LOGO}
        logoAlt="Jarvis"
        items={items}
        activeHref={pathname}
        baseColor="#00D9FF"
        pillColor="#0a0f12"
        pillTextColor="#ffffff"
        hoveredPillTextColor="#000000"
      />
      {pathname !== "/signup" && (
        <Link to="/signup" className="nav-cta btn primary glow">
          Get Jarvis · {price}
        </Link>
      )}
    </>
  );
}
