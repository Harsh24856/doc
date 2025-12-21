import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API_BASE_URL from "../config/api.js";

export default function Login({setSignedIn, setRole}) {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Login failed");
      setSignedIn(false);
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    const user = JSON.parse(localStorage.getItem("user"));
    setRole(user.role)
    setSignedIn(true);
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        
        {/* Heading */}
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Doc Space 🩺
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Login to continue to <span className="font-semibold">Doc Space</span>
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              required
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold transition duration-200"
          >
            Login
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="grow border-t" />
          <span className="mx-3 text-sm text-gray-400">OR</span>
          <div className="grow border-t" />
        </div>

        {/* Signup link */}
        <p className="text-center text-sm text-gray-600">
          New to Doc Space?{" "}
          <Link
            to="/signUp"
            className="text-blue-600 hover:underline font-medium"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
