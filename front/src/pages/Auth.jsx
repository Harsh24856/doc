import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import API_BASE_URL from "../config/api.js";
import logo from "../assets/1.png";
import { Button, Field, Icon, useToast, cn, dur, easeIn, easeOut } from "../ui";

/* Switch choreography (ms): form out → mark locks + flares → form rises in. */
const OUT_MS = 150;
const MARK_MS = 600;

/** The switch mark: a cut-corner tile in two halves that fly in, lock together and flare. */
function SwitchMark() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center" aria-hidden>
      <div className="auth-flare absolute h-40 w-40 rounded-full" />
      <svg width="64" height="64" viewBox="0 0 64 64" className="relative overflow-visible">
        <defs>
          <linearGradient id="markA" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFC9C9" />
            <stop offset="1" stopColor="#FF6B6B" />
          </linearGradient>
          <linearGradient id="markB" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FF6B6B" />
            <stop offset="1" stopColor="#C43D3D" />
          </linearGradient>
        </defs>
        <polygon className="auth-half-a" points="14,4 50,4 4,50 4,14" fill="url(#markA)" stroke="#FFA8A8" strokeOpacity="0.6" />
        <polygon className="auth-half-b" points="60,14 60,50 50,60 14,60" fill="url(#markB)" stroke="#E05252" strokeOpacity="0.6" />
      </svg>
    </div>
  );
}

const ROLES = [
  { value: "doctor", icon: "stethoscope", label: "Doctor", sub: "Find jobs & peers" },
  { value: "hospital", icon: "local_hospital", label: "Hospital", sub: "Hire verified staff" },
];

export default function Auth({ setSignedIn, setRole }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [mode, setMode] = useState(() => (localStorage.getItem("authFormMode") === "signup" ? "signup" : "login"));
  // The page opens on the mark, then reveals the form.
  const [phase, setPhase] = useState("mark");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const timers = useRef([]);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ name: "", email: "", password: "", role: "" });

  const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    timers.current.push(setTimeout(() => setPhase("form"), reduce() ? 0 : MARK_MS));
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  const goTo = useCallback(
    (next) => {
      if (next === mode) return;
      localStorage.setItem("authFormMode", next);
      window.dispatchEvent(new Event("storage"));
      setError(null);
      if (reduce()) {
        setMode(next);
        return;
      }
      setPhase("out");
      timers.current.push(
        setTimeout(() => {
          setMode(next);
          setPhase("mark");
        }, OUT_MS)
      );
      timers.current.push(setTimeout(() => setPhase("form"), OUT_MS + MARK_MS));
    },
    [mode]
  );

  /* Other parts of the app can ask the form to switch. */
  useEffect(() => {
    const onToggle = (e) => {
      if (e.detail?.showSignup) goTo("signup");
      else if (e.detail?.showLogin) goTo("login");
    };
    window.addEventListener("toggleAuthForm", onToggle);
    return () => window.removeEventListener("toggleAuthForm", onToggle);
  }, [goTo]);

  const finish = (data, role) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setRole(role);
    setSignedIn(true);
    toast.success(`Welcome${data.user?.name ? `, ${data.user.name}` : ""}.`);
    navigate("/");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const isSignup = mode === "signup";
    if (isSignup && !signupForm.role) return setError("Choose whether you're joining as a doctor or a hospital.");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/${isSignup ? "signup" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isSignup ? signupForm : loginForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.message || (isSignup ? "Signup failed" : "Login failed"));
      finish(data, isSignup ? signupForm.role : data.user.role);
    } catch {
      setError("Can't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const d = (ms) => ({ animationDelay: `${ms}ms` });
  const isLogin = mode === "login";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white">
      <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
      <div className="auth-glow pointer-events-none absolute inset-x-0 top-0 h-80" aria-hidden />

      <Link to="/news" className="absolute left-5 top-5 z-20 opacity-90 transition-opacity duration-150 hover:opacity-100" aria-label="DocSpace">
        <img src={logo} alt="DocSpace" className="h-8" />
      </Link>

      <div className="relative z-10 w-full max-w-[430px] px-4 py-12">
        <p className="ds-eyebrow mb-5 justify-center">DocSpace — {isLogin ? "Sign in" : "Join the network"}</p>

        <div className="auth-edge">
          <motion.div layout transition={{ duration: dur.slow, ease: easeOut }} className="auth-card relative">
            <span className="auth-corner auth-corner-tl" aria-hidden />
            <span className="auth-corner auth-corner-br" aria-hidden />
            {phase === "mark" && <SwitchMark />}

            <div className="px-7 py-8">
              {/* While the mark plays the incoming form is laid out but invisible; the key remounts it so its entrance plays. */}
              <div key={`${mode}-${phase === "mark" ? "m" : "f"}`} className={phase === "out" ? "auth-out" : phase === "mark" ? "invisible" : ""}>
                <h1 className="auth-in ds-display text-[30px] font-bold" style={d(0)}>
                  {isLogin ? (
                    <>
                      Welcome <span className="text-primary">back</span>
                    </>
                  ) : (
                    <>
                      Create <span className="text-primary">account</span>
                    </>
                  )}
                </h1>
                <p className="auth-in mt-1.5 text-sm text-gray-500" style={d(40)}>
                  {isLogin ? "Sign in to your jobs, messages and verified profile." : "Doctors and hospitals, verified and connected."}
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate={false}>
                  {!isLogin && (
                    <fieldset className="auth-in" style={d(80)}>
                      <legend className="ds-label mb-1.5">I'm joining as</legend>
                      <div className="grid grid-cols-2 gap-2.5">
                        {ROLES.map((r) => {
                          const on = signupForm.role === r.value;
                          return (
                            <label
                              key={r.value}
                              className={cn(
                                "group relative flex cursor-pointer flex-col gap-2 rounded-[var(--radius-control)] border p-3 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5",
                                on ? "border-primary shadow-[2px_2px_0_var(--color-coral-500)]" : "border-gray-300 hover:border-gray-500"
                              )}
                            >
                              <input
                                type="radio"
                                name="role"
                                value={r.value}
                                checked={on}
                                onChange={() => setSignupForm({ ...signupForm, role: r.value })}
                                className="sr-only"
                              />
                              <span className="flex items-center justify-between">
                                <Icon name={r.icon} fill={on} className={cn("text-[22px] transition-colors duration-150", on ? "text-primary" : "text-gray-500")} />
                                <AnimatePresence>
                                  {on && (
                                    <motion.span
                                      initial={{ opacity: 0, scale: 0.6 }}
                                      animate={{ opacity: 1, scale: 1, transition: { duration: dur.quick, ease: easeOut } }}
                                      exit={{ opacity: 0, scale: 0.6, transition: { duration: dur.fast, ease: easeIn } }}
                                    >
                                      <Icon name="check_circle" fill className="text-[18px] text-primary" />
                                    </motion.span>
                                  )}
                                </AnimatePresence>
                              </span>
                              <span>
                                <span className="block font-display text-sm font-semibold uppercase tracking-wide text-gray-900">{r.label}</span>
                                <span className="block text-xs text-gray-500">{r.sub}</span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  )}

                  {!isLogin && (
                    <div className="auth-in" style={d(120)}>
                      <Field
                        label={signupForm.role === "hospital" ? "Hospital name" : "Full name"}
                        required
                        autoComplete="name"
                        placeholder={signupForm.role === "hospital" ? "e.g. City Care Hospital" : "e.g. Dr. Asha Verma"}
                        value={signupForm.name}
                        onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="auth-in" style={d(isLogin ? 80 : 160)}>
                    <Field
                      label="Email address"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@hospital.org"
                      value={isLogin ? loginForm.email : signupForm.email}
                      onChange={(e) =>
                        isLogin ? setLoginForm({ ...loginForm, email: e.target.value }) : setSignupForm({ ...signupForm, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="auth-in" style={d(isLogin ? 120 : 200)}>
                    <Field
                      label="Password"
                      type="password"
                      required
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      placeholder={isLogin ? "••••••••" : "At least 8 characters"}
                      value={isLogin ? loginForm.password : signupForm.password}
                      onChange={(e) =>
                        isLogin ? setLoginForm({ ...loginForm, password: e.target.value }) : setSignupForm({ ...signupForm, password: e.target.value })
                      }
                    />
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        role="alert"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0, transition: { duration: dur.base, ease: easeOut } }}
                        exit={{ opacity: 0, transition: { duration: dur.quick, ease: easeIn } }}
                        className="flex items-start gap-2 rounded-[var(--radius-control)] border border-coral-200 bg-coral-50 px-3 py-2 text-[13px] leading-relaxed text-coral-800"
                      >
                        <Icon name="error" className="mt-px text-[18px]" />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="auth-in pt-1" style={d(isLogin ? 160 : 240)}>
                    <Button type="submit" size="lg" className="w-full" loading={loading} icon="bolt">
                      <span className="auth-shine" aria-hidden />
                      {isLogin ? "Sign in" : "Create account"}
                    </Button>
                  </div>
                </form>

                <div className="auth-in my-5 flex items-center gap-3" style={d(isLogin ? 200 : 280)}>
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="ds-label">or</span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                <p className="auth-in text-center font-mono text-[11px] uppercase tracking-[0.12em] text-gray-500" style={d(isLogin ? 240 : 320)}>
                  {isLogin ? "No account yet? " : "Already have an account? "}
                  <button type="button" onClick={() => goTo(isLogin ? "signup" : "login")} className="-my-2 p-2 font-bold text-coral-700 hover:underline">
                    {isLogin ? "Create one" : "Sign in"}
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <p className="mt-6 text-center">
          <Link to="/news" className="inline-block p-3 font-mono text-[11px] uppercase tracking-wider text-gray-500 transition-colors duration-150 hover:text-coral-700">
            Browse medical news without an account →
          </Link>
        </p>
      </div>
    </div>
  );
}
