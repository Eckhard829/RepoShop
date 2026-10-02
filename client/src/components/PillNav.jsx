import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiHome,
  FiInfo,
  FiMail,
  FiGrid,
  FiLogIn,
  FiUserPlus,
  FiShield,
  FiLogOut,
  FiChevronRight,
  FiArrowRight,
  FiMenu,
  FiX,
  FiCpu,
} from "react-icons/fi";
import "./PillNav.css";

// Icons are picked by route. Override per item with `icon: SomeReactIcon`.
const ICONS = {
  "/": FiHome,
  "/about": FiInfo,
  "/contact": FiMail,
  "/dashboard": FiGrid,
  "/login": FiLogIn,
  "/signup": FiUserPlus,
  "/admin": FiShield,
};
// These routes render as buttons on the right side of the bar. Override per item with `action: true/false`.
const ACTION_HREFS = ["/login", "/signup", "/dashboard"];
const PRIMARY_HREFS = ["/signup", "/dashboard"];

const isExternal = (href) =>
  /^(https?:)?\/\/|^mailto:|^tel:|^#/.test(href || "");
const LinkTag = ({ href, ...props }) =>
  isExternal(href) ? (
    <a href={href} {...props} />
  ) : (
    <Link to={href} {...props} />
  );

const Ico = ({ item }) => {
  const I = item.icon || ICONS[item.href] || FiChevronRight;
  return <I className="pn-ico" aria-hidden="true" />;
};

export default function PillNav({
  logoAlt = "Home", // shown as the brand name next to the logo
  logoIcon: LogoIcon = FiCpu,
  items = [],
  activeHref,
  className = "",
  onLogout, // optional: shows a Log out button in the bar
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isAction = (i) => i.action ?? ACTION_HREFS.includes(i.href);
  const links = items.filter((i) => !isAction(i));
  const actions = items.filter(isAction);
  const home = items[0]?.href || "/";

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 8);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  // close the mobile menu: after navigating, on Escape, when resized to desktop
  useEffect(() => setOpen(false), [activeHref]);
  useEffect(() => {
    const key = (e) => e.key === "Escape" && setOpen(false);
    const size = () => window.innerWidth > 900 && setOpen(false);
    document.addEventListener("keydown", key);
    window.addEventListener("resize", size);
    return () => {
      document.removeEventListener("keydown", key);
      window.removeEventListener("resize", size);
    };
  }, []);

  // stop the page scrolling behind the open menu
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const btn = (a) =>
    `pn-btn${PRIMARY_HREFS.includes(a.href) ? " is-primary" : ""}`;
  const logout = () => {
    setOpen(false);
    onLogout();
  };

  return (
    <>
      <header
        className={`pn${scrolled || open ? " is-solid" : ""}${open ? " is-open" : ""} ${className}`}
      >
        <div className="pn-inner">
          <LinkTag
            href={home}
            className="pn-brand"
            aria-label={`${logoAlt} home`}
          >
            <span className="pn-logo">
              <LogoIcon aria-hidden="true" />
            </span>
            <span className="pn-name">{logoAlt}</span>
          </LinkTag>

          <nav className="pn-links" aria-label="Primary">
            {links.map((l) => (
              <LinkTag
                key={l.href}
                href={l.href}
                className={`pn-link${activeHref === l.href ? " is-active" : ""}`}
                aria-current={activeHref === l.href ? "page" : undefined}
              >
                <Ico item={l} />
                {l.label}
              </LinkTag>
            ))}
          </nav>

          <div className="pn-actions">
            {actions.map((a) => (
              <LinkTag key={a.href} href={a.href} className={btn(a)}>
                <Ico item={a} />
                {a.label}
              </LinkTag>
            ))}
            {onLogout && (
              <button type="button" className="pn-btn" onClick={logout}>
                <FiLogOut aria-hidden="true" className="pn-ico" />
                Log out
              </button>
            )}
          </div>

          <button
            type="button"
            className="pn-burger"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="pn-panel"
          >
            {open ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
          </button>
        </div>

        <div className="pn-panel" id="pn-panel" aria-hidden={!open}>
          <div className="pn-panel-in">
            {links.map((l) => (
              <LinkTag
                key={l.href}
                href={l.href}
                tabIndex={open ? 0 : -1}
                className={`pn-mlink${activeHref === l.href ? " is-active" : ""}`}
              >
                <Ico item={l} />
                <span>{l.label}</span>
                <FiChevronRight className="pn-arrow" aria-hidden="true" />
              </LinkTag>
            ))}
            <div className="pn-mactions">
              {actions.map((a) => (
                <LinkTag
                  key={a.href}
                  href={a.href}
                  tabIndex={open ? 0 : -1}
                  className={btn(a)}
                >
                  <Ico item={a} />
                  {a.label}
                  {PRIMARY_HREFS.includes(a.href) && (
                    <FiArrowRight aria-hidden="true" className="pn-ico" />
                  )}
                </LinkTag>
              ))}
              {onLogout && (
                <button
                  type="button"
                  tabIndex={open ? 0 : -1}
                  className="pn-btn"
                  onClick={logout}
                >
                  <FiLogOut aria-hidden="true" className="pn-ico" />
                  Log out
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      <div
        className={`pn-scrim${open ? " on" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
    </>
  );
}
