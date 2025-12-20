import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('📝 [Signup] Form submitted:', { name: form.name, email: form.email, password: '***' });

    try {
      const url = `${API_BASE_URL}/auth/signup`;
      console.log('📤 [Signup] Making request to:', url);
      console.log('📤 [Signup] Request body:', { name: form.name, email: form.email, password: '***' });

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      console.log('📥 [Signup] Response status:', res.status, res.statusText);
      console.log('📥 [Signup] Response headers:', Object.fromEntries(res.headers.entries()));

      const data = await res.json();
      console.log('📥 [Signup] Response data:', data);

      if (!res.ok) {
        console.error('❌ [Signup] Signup failed:', data);
        alert(data.message || "Signup failed");
        return;
      }

      // ✅ AUTO-LOGIN
      console.log('💾 [Signup] Storing token and user data');
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      console.log('✅ [Signup] Signup successful, redirecting to home');

      navigate("/");
    } catch (error) {
      console.error('❌ [Signup] Error during signup:', error);
      alert('An error occurred during signup. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-8 rounded-xl shadow-md"
      >
        <h2 className="text-2xl font-semibold text-center mb-6">
          Create Account
        </h2>

        <input
          placeholder="Name"
          className="w-full px-4 py-2 border rounded-lg mb-4"
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
          required
        />

        <input
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
          Sign Up
        </button>
      </form>
    </div>
  );
}