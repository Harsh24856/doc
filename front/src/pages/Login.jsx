import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔐 [Login] Form submitted:', { email: form.email, password: '***' });

    try {
      const url = `${API_BASE_URL}/auth/login`;
      console.log('📤 [Login] Making request to:', url);
      console.log('📤 [Login] Request body:', { email: form.email, password: '***' });

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      console.log('📥 [Login] Response status:', res.status, res.statusText);
      console.log('📥 [Login] Response headers:', Object.fromEntries(res.headers.entries()));

      const data = await res.json();
      console.log('📥 [Login] Response data:', data);

      if (!res.ok) {
        console.error('❌ [Login] Login failed:', data);
        alert(data.message || "Login failed");
        return;
      }

      // ✅ STORE AUTH DATA
      console.log('💾 [Login] Storing token and user data');
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      console.log('✅ [Login] Login successful, redirecting to home');

      // ✅ REDIRECT TO HOME
      navigate("/");
    } catch (error) {
      console.error('❌ [Login] Error during login:', error);
      alert('An error occurred during login. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-8 rounded-xl shadow-md"
      >
        <h2 className="text-2xl font-semibold text-center mb-6">Login</h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full px-4 py-2 border rounded-lg mb-4"
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full px-4 py-2 border rounded-lg mb-6"
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
          required
        />

        <button className="w-full bg-blue-600 text-white py-2 rounded-lg">
          Login
        </button>
      </form>
    </div>
  );
}