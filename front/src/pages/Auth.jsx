import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";
import msfileImage from "../assets/msfile.png";

export default function Auth({ setSignedIn, setRole }) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true); // Login visible by default

  // Helper function to toggle form and sync with Navbar
  const toggleForm = useCallback((showLogin) => {
    setIsLogin(showLogin);
    localStorage.setItem('authFormMode', showLogin ? 'login' : 'signup');
    // Dispatch event to update Navbar immediately
    window.dispatchEvent(new Event('storage'));
  }, []);

  // Listen for toggle event from Navbar
  useEffect(() => {
    const handleToggleAuth = (event) => {
      if (event.detail?.showSignup) {
        toggleForm(false);
      } else if (event.detail?.showLogin) {
        toggleForm(true);
      }
    };

    window.addEventListener('toggleAuthForm', handleToggleAuth);

    return () => {
      window.removeEventListener('toggleAuthForm', handleToggleAuth);
    };
  }, [toggleForm]);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  /* ================= LOGIN ================= */
  const handleLogin = async (e) => {
    e.preventDefault();

    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginForm),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.message || "Login failed");

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setRole(data.user.role);
    setSignedIn(true);
    navigate("/");
  };

  /* ================= SIGNUP ================= */
  const handleSignup = async (e) => {
    e.preventDefault();

    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signupForm),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.message || "Signup failed");

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setRole(signupForm.role);
    setSignedIn(true);
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#e2e2e2] to-[#c9d6ff] px-3 sm:px-4 py-4 sm:py-8">
      <div 
        className={`relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden transition-all duration-700 ease-in-out w-full max-w-5xl ${!isLogin ? 'active' : ''} min-h-[600px] sm:min-h-[700px] h-auto sm:h-[700px]`}
      >
        {/* SIGNUP FORM (LEFT) */}
        <div className={`absolute top-0 left-0 w-full sm:w-1/2 h-full transition-all duration-700 ease-in-out ${!isLogin ? 'translate-x-0 sm:translate-x-full opacity-100 z-50' : 'opacity-0 sm:opacity-0 z-10 -translate-x-full sm:translate-x-0'}`}>
          <form onSubmit={handleSignup} className="h-full flex flex-col items-center justify-center px-6 sm:px-12 py-6 sm:py-10">
            <img 
              src={msfileImage} 
              className="h-16 sm:h-20 w-auto mx-auto mb-3 sm:mb-4 object-contain" 
              alt="DocSpace Logo" 
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Create Account</h1>
            <span className="text-xs sm:text-sm text-gray-600 mb-6 sm:mb-8 text-center">or use your email for registration</span>
            
            <input
              type="text"
              placeholder="Name"
              className="w-full bg-gray-100 border-none my-2 sm:my-3 px-4 sm:px-5 py-2.5 sm:py-3.5 text-sm sm:text-base rounded-lg outline-none"
              required
              value={signupForm.name}
              onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
            />
            
            <select
              className="w-full bg-gray-100 border-none my-2 sm:my-3 px-4 sm:px-5 py-2.5 sm:py-3.5 text-sm sm:text-base rounded-lg outline-none cursor-pointer"
              required
              value={signupForm.role}
              onChange={(e) => setSignupForm({ ...signupForm, role: e.target.value })}
            >
              <option value="">Select Role</option>
              <option value="doctor">Doctor</option>
              <option value="hospital">Hospital</option>
            </select>
            
            <input
              type="email"
              placeholder="Email"
              className="w-full bg-gray-100 border-none my-2 sm:my-3 px-4 sm:px-5 py-2.5 sm:py-3.5 text-sm sm:text-base rounded-lg outline-none"
              required
              value={signupForm.email}
              onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
            />
            
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-gray-100 border-none my-2 sm:my-3 px-4 sm:px-5 py-2.5 sm:py-3.5 text-sm sm:text-base rounded-lg outline-none"
              required
              value={signupForm.password}
              onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
            />
            
            <button
              type="submit"
              className="bg-[var(--color-primary)] text-white text-xs sm:text-sm py-2.5 sm:py-3 px-8 sm:px-12 rounded-lg font-semibold uppercase tracking-wider mt-3 sm:mt-4 cursor-pointer border border-transparent hover:opacity-90 transition-opacity w-full sm:w-auto"
            >
              Signup
            </button>

            <p className="text-xs sm:text-sm text-gray-600 mt-4 sm:mt-6 text-center">
              Have an account?{" "}
              <button
                type="button"
                onClick={() => toggleForm(true)}
                className="text-[var(--color-primary)] hover:underline font-semibold"
              >
                Login
              </button>
            </p>
          </form>
        </div>

        {/* LOGIN FORM (RIGHT) */}
        <div className={`absolute top-0 left-0 w-full sm:w-1/2 h-full transition-all duration-700 ease-in-out z-20 ${isLogin ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full sm:translate-x-0'}`}>
          <form onSubmit={handleLogin} className="h-full flex flex-col items-center justify-center px-6 sm:px-12 py-6 sm:py-10">
            <img 
              src={msfileImage} 
              className="h-16 sm:h-20 w-auto mx-auto mb-3 sm:mb-4 object-contain" 
              alt="DocSpace Logo" 
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Login</h1>
            <span className="text-xs sm:text-sm text-gray-600 mb-6 sm:mb-8 text-center">or use your email password</span>
            
            <input
              type="email"
              placeholder="Email"
              className="w-full bg-gray-100 border-none my-2 sm:my-3 px-4 sm:px-5 py-2.5 sm:py-3.5 text-sm sm:text-base rounded-lg outline-none"
              required
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
            />
            
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-gray-100 border-none my-2 sm:my-3 px-4 sm:px-5 py-2.5 sm:py-3.5 text-sm sm:text-base rounded-lg outline-none"
              required
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            />
            
            <button
              type="submit"
              className="bg-[var(--color-primary)] text-white text-xs sm:text-sm py-2.5 sm:py-3 px-8 sm:px-12 rounded-lg font-semibold uppercase tracking-wider mt-3 sm:mt-4 cursor-pointer border border-transparent hover:opacity-90 transition-opacity w-full sm:w-auto"
            >
              Login
            </button>

            <p className="text-xs sm:text-sm text-gray-600 mt-4 sm:mt-6 text-center">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => toggleForm(false)}
                className="text-[var(--color-primary)] hover:underline font-semibold"
              >
                Signup
              </button>
            </p>
          </form>
        </div>

        {/* TOGGLE CONTAINER - Hidden on mobile, visible on desktop */}
        <div className={`hidden sm:block absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-all duration-700 ease-in-out ${!isLogin ? '-translate-x-full rounded-l-3xl' : 'rounded-r-3xl'}`} style={{ borderRadius: !isLogin ? '0 150px 100px 0' : '150px 0 0 100px' }}>
          <div 
            className="h-full relative -left-full transition-all duration-700 ease-in-out"
            style={{
              width: '200%',
              background: `linear-gradient(to right, var(--color-primary), var(--color-primary-dark))`,
              transform: !isLogin ? 'translateX(50%)' : 'translateX(0)'
            }}
          >
            {/* TOGGLE LEFT PANEL (Shows when login is active) */}
            <div className={`absolute top-0 left-0 w-1/2 h-full flex flex-col items-center justify-center px-6 sm:px-10 text-center text-white transition-all duration-700 ease-in-out ${isLogin ? 'translate-x-0' : '-translate-x-full'}`}>
              <img 
                src={msfileImage} 
                className="h-24 sm:h-32 w-auto mx-auto mb-6 sm:mb-8 object-contain" 
                alt="DocSpace Logo" 
              />
              <h1 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-5">Welcome Back!</h1>
              <p className="text-sm sm:text-lg mb-6 sm:mb-10 px-2 sm:px-4">Enter your personal details to use all of site features</p>
              <button
                onClick={() => toggleForm(false)}
                className="bg-transparent border-2 border-white text-white text-xs sm:text-sm py-2 sm:py-3 px-8 sm:px-12 rounded-lg font-semibold uppercase tracking-wider cursor-pointer hover:bg-white hover:text-[var(--color-primary)] transition-all"
              >
                Signup
              </button>
            </div>

            {/* TOGGLE RIGHT PANEL (Shows when signup is active) */}
            <div className={`absolute top-0 right-0 w-1/2 h-full flex flex-col items-center justify-center px-6 sm:px-10 text-center text-white transition-all duration-700 ease-in-out ${!isLogin ? 'translate-x-0' : 'translate-x-full'}`}>
              <img 
                src={msfileImage} 
                className="h-24 sm:h-32 w-auto mx-auto mb-6 sm:mb-8 object-contain" 
                alt="DocSpace Logo" 
              />
              <h1 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-5">Hello, Friend!</h1>
              <p className="text-sm sm:text-lg mb-6 sm:mb-10 px-2 sm:px-4">Register with your personal details to use all of site features</p>
              <button
                onClick={() => toggleForm(true)}
                className="bg-transparent border-2 border-white text-white text-xs sm:text-sm py-2 sm:py-3 px-8 sm:px-12 rounded-lg font-semibold uppercase tracking-wider cursor-pointer hover:bg-white hover:text-[var(--color-primary)] transition-all"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
