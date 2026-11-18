import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import doctorBg from "../assets/doctor-bg.png";
import logoMark from "../assets/1.png";
import Footer from "../components/Footer";
import API_BASE_URL from "../config/api";
import { Button, ArrowLink, Icon, Words, Reveal, SectionHead, CountUp, Skeleton, cn, dur, easeIn, easeOut } from "../ui";

function decodeHTML(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

const SEEN_KEY = "ds-landing-seen";

const CHAPTERS = [
  { n: "01", id: "network", t: "The network", p: "Verified doctors and hospitals." },
  { n: "02", id: "features", t: "The toolkit", p: "Jobs, resume, chat, news." },
  { n: "03", id: "steps", t: "Get started", p: "Three steps to verified." },
  { n: "04", id: "informed", t: "Stay informed", p: "Medical news & WHO." },
];

const FEATURES = [
  { k: "Trust", icon: "verified_user", h: "Verified profiles", code: "IMR", p: "Every doctor is checked against the medical register before the badge appears.", to: "/get-verified", out: "Get verified" },
  { k: "Careers", icon: "work", h: "Career openings", code: "JOBS", p: "Roles posted directly by hospitals and clinics, with status you can track.", to: "/search/jobs", out: "Browse jobs" },
  { k: "Network", icon: "forum", h: "Clinical chat", code: "DM", p: "Discuss cases and share files with peers in private, real-time threads.", to: "/messages", out: "Open chat" },
  { k: "Profile", icon: "description", h: "Medical resume", code: "CV", p: "Build one structured resume and let hospitals find you.", to: "/resume", out: "Build resume" },
  { k: "Signal", icon: "newspaper", h: "Medical news", code: "NEWS", p: "Curated headlines and WHO bulletins, in one feed.", to: "/news", out: "Read news" },
];

const STEPS = [
  { n: "01", title: "Create your profile", desc: "Sign up and add your credentials, specialisation and experience." },
  { n: "02", title: "Get verified", desc: "Upload your registration and receive the verified badge." },
  { n: "03", title: "Connect & grow", desc: "Apply to jobs, message peers and get discovered by hospitals." },
];

/* ------------------------------------------------------------------ preloader */
function Preloader({ onDone }) {
  const [p, setP] = useState(0);
  const labels = ["Verifying network", "Loading opportunities", "Ready"];
  useEffect(() => {
    const steps = [0.35, 0.7, 1];
    const timers = steps.map((v, i) => setTimeout(() => setP(v), 120 + i * 220));
    timers.push(setTimeout(onDone, 120 + steps.length * 220 + 150));
    return () => timers.forEach(clearTimeout);
  }, [onDone]);
  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-white"
      exit={{ opacity: 0, transition: { duration: dur.slow, ease: easeIn } }}
      aria-hidden
    >
      <motion.div className="w-[min(420px,74vw)] text-center" exit={{ y: -12, opacity: 0, transition: { duration: dur.slow, ease: easeIn } }}>
        <img src={logoMark} alt="" className="mx-auto mb-6 h-10" />
        <p className="ds-label mb-5 !tracking-[0.4em]">DocSpace — Healthcare network</p>
        <div className="relative h-px overflow-hidden bg-gray-200">
          <span
            className="absolute inset-0 origin-left bg-primary transition-transform duration-200 ease-[var(--ease-out)]"
            style={{ transform: `scaleX(${p})` }}
          />
        </div>
        <div className="mt-3 flex justify-between ds-label">
          <span>{labels[Math.min(labels.length - 1, Math.round(p * 2))]}</span>
          <b className="font-medium tabular-nums text-gray-700">{Math.round(p * 100)}%</b>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ cursor */
function CursorFollower() {
  const ref = useRef(null);
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, t0 = performance.now(), raf = 0;
    const move = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      el.style.opacity = "1";
      el.classList.toggle("act", !!e.target.closest?.("a, button, [data-card]"));
    };
    const tick = (now = t0) => {
      // frame-rate independent follow
      const k = 1 - Math.exp((-Math.min(now - t0, 50) / 1000) * 13);
      t0 = now;
      x += (tx - x) * k;
      y += (ty - y) * k;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", move);
    tick();
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);
  return <div ref={ref} className="ds-cursor" aria-hidden />;
}

/* ------------------------------------------------------------------ section rail */
function Rail({ ids, active }) {
  return (
    <nav className={cn("fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 transition-opacity duration-300 xl:flex", active < 0 && "pointer-events-none opacity-0")} aria-label="Sections">
      {ids.map((c, i) => (
        <a key={c.id} href={`#${c.id}`} title={c.t} aria-label={c.t} className="group grid h-3 w-6 place-items-center">
          <i className={cn("block h-px transition-all duration-300 ease-[var(--ease-out)]", i === active ? "w-6 bg-primary" : "w-3.5 bg-gray-300 group-hover:w-6 group-hover:bg-gray-500")} />
        </a>
      ))}
    </nav>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [newsArticles, setNewsArticles] = useState([]);
  const [whoUpdates, setWhoUpdates] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [whoLoading, setWhoLoading] = useState(true);
  const [booting, setBooting] = useState(() => {
    try {
      return !sessionStorage.getItem(SEEN_KEY) && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  });
  const [activeSec, setActiveSec] = useState(-1);

  const doneBoot = () => {
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* private mode: it just plays again */
    }
    setBooting(false);
  };

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/news/medical?q=medical&limit=3`);
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/auth");
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setNewsArticles(data.articles || []);
        }
      } catch (err) {
        console.error("Failed to fetch news:", err);
      } finally {
        setNewsLoading(false);
      }
    };
    const fetchWHOUpdates = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/who/updates`);
        if (res.ok) {
          const data = await res.json();
          setWhoUpdates((data.articles || []).slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to fetch WHO updates:", err);
      } finally {
        setWhoLoading(false);
      }
    };
    fetchNews();
    fetchWHOUpdates();
  }, [navigate]);

  /* scroll spy for the rail */
  useEffect(() => {
    const els = CHAPTERS.map((c) => document.getElementById(c.id)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSec(CHAPTERS.findIndex((c) => c.id === e.target.id));
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    els.forEach((el) => io.observe(el));
    const onTop = () => window.scrollY < 200 && setActiveSec(-1);
    window.addEventListener("scroll", onTop, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onTop);
    };
  }, []);

  const heroAnim = booting ? "hidden" : "show";
  const rise = (delay) => ({
    initial: { opacity: 0, y: 14 },
    animate: booting ? { opacity: 0, y: 14 } : { opacity: 1, y: 0, transition: { duration: dur.slow, ease: easeOut, delay } },
  });

  return (
    <div className="relative bg-white">
      <AnimatePresence>{booting && <Preloader onDone={doneBoot} />}</AnimatePresence>
      <CursorFollower />
      <Rail ids={CHAPTERS} active={activeSec} />

      {/* ============================================ hero */}
      <section className="relative overflow-hidden border-b border-gray-200">
        <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
        <div className="auth-glow pointer-events-none absolute inset-x-0 top-0 h-96" aria-hidden />

        <div className="ds-container relative grid gap-12 pb-10 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20">
          <div className="flex flex-col">
            <motion.p className="ds-eyebrow mb-6" {...rise(0.05)}>
              Chapter 00 — Welcome
            </motion.p>
            <motion.h1 className="ds-display text-[40px] sm:text-[56px] lg:text-[68px]" initial="hidden" animate={heroAnim}>
              <span className="sr-only">Connect, collaborate, save lives.</span>
              <Words text="Connect," trigger="mount" />
              <Words text="collaborate," from={1} trigger="mount" />
              <Words text="save lives." from={2} trigger="mount" className="text-primary" />
            </motion.h1>
            <motion.p className="mt-6 max-w-md text-[17px] leading-relaxed text-gray-600" {...rise(0.25)}>
              DocSpace is the professional network for verified doctors and healthcare providers. Build your profile, find roles, and talk to peers securely.
            </motion.p>
            <motion.div className="mt-8 flex flex-wrap gap-3" {...rise(0.32)}>
              <Button to="/resume" size="lg" iconRight="arrow_forward">
                Get started
              </Button>
              <Button to="/search/jobs" size="lg" variant="secondary" icon="work">
                Find jobs
              </Button>
            </motion.div>

            {/* chapters */}
            <motion.div className="mt-14 grid grid-cols-2 gap-x-4 gap-y-6 border-t border-gray-200 pt-5 sm:grid-cols-4" {...rise(0.4)}>
              {CHAPTERS.map((c) => (
                <a key={c.n} href={`#${c.id}`} className="group flex flex-col gap-1.5">
                  <span className="font-display text-[34px] leading-none tracking-tight text-gray-900 tabular-nums transition-[color,transform] duration-300 ease-[var(--ease-out)] group-hover:-translate-y-1 group-hover:text-primary">
                    {c.n}
                  </span>
                  <span className="ds-label !text-gray-700 transition-colors duration-150 group-hover:!text-gray-900">{c.t}</span>
                  <span className="text-xs text-gray-500 sm:hidden">{c.p}</span>
                </a>
              ))}
            </motion.div>
          </div>

          {/* peek frame */}
          <motion.a
            href="#network"
            className="group relative hidden self-center lg:block"
            initial={{ opacity: 0, y: 14 }}
            animate={booting ? { opacity: 0 } : { opacity: 1, y: 0, transition: { duration: dur.slow, ease: easeOut, delay: 0.2 } }}
            data-card
          >
            <span className="relative block aspect-[4/5] overflow-hidden outline outline-1 -outline-offset-1 outline-gray-900/15 shadow-[0_34px_70px_-30px_rgb(22_24_28/0.45)] transition-[outline-color,transform] duration-300 ease-[var(--ease-out)] group-hover:-translate-y-1 group-hover:outline-primary">
              <img src={doctorBg} alt="Doctors collaborating" className="h-full w-full object-cover transition-transform duration-300 ease-[var(--ease-out)] group-hover:scale-[1.03]" />
              <span className="absolute inset-0 bg-gradient-to-t from-gray-900/45 via-transparent to-transparent" />
              <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded bg-white/90 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-gray-800">
                <i className="h-1.5 w-1.5 rounded-full bg-primary" /> Live network
              </span>
              <span className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                <b className="font-display text-2xl font-medium uppercase">DocSpace</b>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/80">Verified · Secure</span>
              </span>
            </span>
            <span className="mt-2.5 flex items-baseline justify-between">
              <b className="ds-label !text-gray-900">The network</b>
              <i className="ds-label not-italic">Doctors · Hospitals</i>
            </span>
          </motion.a>
        </div>
      </section>

      {/* ============================================ 01 · network */}
      <section id="network" className="ds-container scroll-mt-20 py-24 lg:py-32">
        <SectionHead n="01" title="The network" meta="Doctors · Hospitals" />
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <h2 className="ds-display max-w-[14ch] text-[34px] sm:text-[48px] lg:text-[58px]">
            <Words text="Built on trust, run on verified credentials." />
          </h2>
          <div className="pt-2">
            <Reveal>
              <p className="text-[17px] leading-relaxed text-gray-700">
                Every doctor on DocSpace can be checked against the medical register, so hospitals hire with confidence and peers know who they're talking to.
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <p className="mt-4 leading-relaxed text-gray-500">
                Hospitals post roles, review applications and message candidates from one place. Doctors keep a single structured resume that travels with them.
              </p>
            </Reveal>
            <Reveal delay={0.1} className="mt-8">
              <ArrowLink to="/find-doctor">Find a doctor</ArrowLink>
            </Reveal>
          </div>
        </div>

        <Reveal className="mt-16 grid grid-cols-2 border-t border-[var(--color-line-soft)] md:grid-cols-4">
          {[
            { v: 10, s: "K+", l: "Verified doctors" },
            { v: 500, s: "+", l: "Hospitals" },
            { v: 2, s: "K+", l: "Job openings" },
            { v: 50, s: "K+", l: "Connections made" },
          ].map((st, i) => (
            <div
              key={st.l}
              className={cn(
                "group min-h-[120px] border-l border-[var(--color-line-soft)] px-5 py-5 transition-colors duration-200 hover:bg-coral-50/50",
                i === 3 && "md:border-r",
                i < 2 && "border-b md:border-b-0"
              )}
            >
              <b className="block font-display text-[34px] font-normal leading-none tracking-tight text-gray-900 sm:text-[40px]">
                <CountUp to={st.v} />
                <sup className="ml-0.5 align-[0.9em] text-[0.5em] text-primary">{st.s}</sup>
              </b>
              <span className="ds-label mt-3 block">{st.l}</span>
            </div>
          ))}
        </Reveal>
      </section>

      {/* ============================================ 02 · features */}
      <section id="features" className="scroll-mt-20 border-y border-gray-200 bg-gray-50 py-24 lg:py-32">
        <div className="ds-container">
          <SectionHead n="02" title="The toolkit" meta="5 tools · 1 profile" />
          <div className="mb-12 grid gap-6 lg:grid-cols-[0.9fr_1fr] lg:items-end lg:gap-16">
            <h2 className="ds-display max-w-[13ch] text-[34px] sm:text-[48px] lg:text-[58px]">
              <Words text="Everything a medical career needs." />
            </h2>
            <Reveal>
              <p className="text-[17px] leading-relaxed text-gray-600">
                One account connects your verification, your resume, your applications and your conversations, so nothing gets lost between them.
              </p>
            </Reveal>
          </div>

          <Reveal className="ds-hairline grid-cols-1 md:grid-cols-6">
            {FEATURES.map((f, i) => (
              <Link
                key={f.h}
                to={f.to}
                data-card
                className={cn("ds-plate group flex min-h-[240px] flex-col p-6", i < 2 ? "md:col-span-3" : "md:col-span-2")}
              >
                <div className="ds-plate-body flex h-full flex-col gap-4">
                  <span className="flex items-center justify-between">
                    <span className="ds-label transition-colors duration-300 group-hover:!text-coral-700">{f.k}</span>
                    <Icon name={f.icon} className="text-[22px] text-gray-400 transition-colors duration-300 group-hover:text-primary" />
                  </span>
                  <h3 className="ds-display text-[24px] sm:text-[28px]">
                    {f.h}
                    <em className="ml-3 align-[0.5em] font-mono text-[10px] not-italic tracking-[0.24em] text-gray-400">{f.code}</em>
                  </h3>
                  <p className="max-w-[38ch] text-sm leading-relaxed text-gray-600">{f.p}</p>
                  <span className="mt-auto font-mono text-[11px] uppercase tracking-[0.14em] text-coral-700">out → {f.out}</span>
                </div>
              </Link>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ============================================ 03 · steps */}
      <section id="steps" className="ds-container scroll-mt-20 py-24 lg:py-32">
        <SectionHead n="03" title="Get started" meta="≈ 5 minutes" />
        <div className="grid gap-px overflow-hidden border border-[var(--color-line-soft)] bg-[var(--color-line-soft)] md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.05} className="group relative bg-white p-7">
              <span className="font-display text-[64px] font-normal leading-none tracking-tighter text-gray-200 transition-colors duration-300 group-hover:text-primary">{s.n}</span>
              <h3 className="ds-display mt-6 text-[22px]">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.desc}</p>
              <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-primary transition-transform duration-300 ease-[var(--ease-out)] group-hover:scale-x-100" />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============================================ 04 · informed */}
      <section id="informed" className="scroll-mt-20 border-t border-gray-200 bg-gray-50 py-24 lg:py-32">
        <div className="ds-container">
          <SectionHead n="04" title="Stay informed" meta="News · WHO" />
          <div className="grid gap-10 lg:grid-cols-2">
            <FeedColumn title="Medical news" to="/news" loading={newsLoading} items={newsArticles} kind="news" />
            <FeedColumn title="WHO updates" to="/who" loading={whoLoading} items={whoUpdates} kind="who" />
          </div>
        </div>
      </section>

      {/* ============================================ launch */}
      <section className="relative overflow-hidden border-t border-gray-200">
        <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
        <div className="ds-container relative grid items-center gap-10 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:py-32">
          <div>
            <Reveal>
              <p className="ds-eyebrow">Chapter 05 — Join</p>
            </Reveal>
            <Reveal delay={0.05}>
              <p className="mt-6 max-w-[40ch] text-[17px] leading-relaxed text-gray-600">
                Thousands of healthcare professionals already use DocSpace to grow their careers. Your verified profile is a few minutes away.
              </p>
            </Reveal>
            <Reveal delay={0.1} className="mt-8 flex flex-wrap gap-3">
              <Button to="/resume" size="lg" iconRight="arrow_forward">
                Join DocSpace
              </Button>
              <Button to="/search/jobs" size="lg" variant="secondary" icon="search">
                Browse roles
              </Button>
            </Reveal>
          </div>
          <h2 className="ds-display text-right text-[64px] leading-[0.9] tracking-[-0.04em] sm:text-[96px] lg:text-[128px]">
            <Words text="Save" />
            <Words text="lives." from={1} className="text-primary" />
          </h2>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FeedColumn({ title, to, loading, items, kind }) {
  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h3 className="ds-display text-[22px]">{title}</h3>
        <ArrowLink to={to}>View all</ArrowLink>
      </div>
      <div className="border-t border-gray-200">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 border-b border-gray-200 py-5">
              <Skeleton className="h-16 w-24 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <p className="py-10 text-sm text-gray-500">Nothing new right now. Check back later.</p>
        ) : (
          items.map((a, i) => (
            <Reveal key={`${a.url}-${i}`} delay={i * 0.04}>
              <a href={a.url} target="_blank" rel="noopener noreferrer" className="group flex gap-4 border-b border-gray-200 py-5" data-card>
                {a.image && (
                  <span className="h-16 w-24 shrink-0 overflow-hidden rounded bg-gray-100">
                    <img
                      src={a.image}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 ease-[var(--ease-out)] group-hover:scale-105"
                      onError={(e) => (e.currentTarget.parentElement.style.display = "none")}
                    />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 font-semibold text-gray-900 transition-colors duration-150 group-hover:text-coral-700">{a.title}</span>
                  <span className="mt-1 line-clamp-2 block text-sm text-gray-500">
                    {kind === "who" ? decodeHTML(a.description || "").replace(/<[^>]+>/g, "").slice(0, 140) : a.description}
                  </span>
                  <span className="mt-2 block ds-label">
                    {kind === "who" ? (a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : "WHO") : a.source}
                  </span>
                </span>
                <Icon name="arrow_outward" className="mt-1 text-gray-300 transition-[color,transform] duration-300 ease-[var(--ease-out)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
              </a>
            </Reveal>
          ))
        )}
      </div>
    </div>
  );
}
