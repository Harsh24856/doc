import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api.js";

export default function Home() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  console.log('🏠 [Home] Component rendered');

  useEffect(() => {
    console.log('🏠 [Home] useEffect triggered - loading user from localStorage');
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    console.log('🏠 [Home] Stored user data:', stored ? 'exists' : 'not found');
    console.log('🏠 [Home] Token exists:', !!token);
    
    if (stored) {
      try {
        const parsedUser = JSON.parse(stored);
        console.log('🏠 [Home] User loaded:', { name: parsedUser.name, email: parsedUser.email, role: parsedUser.role });
        setUser(parsedUser);
      } catch (error) {
        console.error('❌ [Home] Error parsing user data:', error);
        // If parsing fails, clear corrupted data and redirect
        localStorage.removeItem("user");
        if (token) {
          // Try to fetch user data from backend
          fetchUserFromBackend(token);
        } else {
          navigate("/login");
        }
      }
    } else {
      console.warn('⚠️ [Home] No user data found in localStorage');
      // If token exists but no user data, try to fetch from backend
      if (token) {
        console.log('🔄 [Home] Token exists but no user data, fetching from backend');
        fetchUserFromBackend(token);
      } else {
        // No token and no user data, redirect to login
        console.log('🔄 [Home] No token or user data, redirecting to login');
        navigate("/login");
      }
    }
  }, [navigate]);

  const fetchUserFromBackend = async (token) => {
    try {
      console.log('📤 [Home] Fetching user data from backend');
      const url = `${API_BASE_URL}/auth/me`;
      console.log('📤 [Home] Request URL:', url);
      
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('📥 [Home] Response status:', res.status, res.statusText);

      if (res.ok) {
        const userData = await res.json();
        console.log('✅ [Home] User data fetched from backend:', userData);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('❌ [Home] Failed to fetch user data:', errorData);
        console.error('❌ [Home] Clearing auth and redirecting to login');
        localStorage.clear();
        navigate("/login");
      }
    } catch (error) {
      console.error('❌ [Home] Error fetching user data:', error);
      console.error('❌ [Home] Clearing auth and redirecting to login');
      localStorage.clear();
      navigate("/login");
    }
  };

  const logout = () => {
    console.log('🚪 [Home] Logout clicked');
    localStorage.clear();
    console.log('🗑️ [Home] localStorage cleared');
    navigate("/login");
    console.log('🔄 [Home] Redirecting to login');
  };

  if (!user) {
    console.log('⏳ [Home] No user data, showing loading or redirecting');
    return <div className="page">Loading...</div>;
  }

  console.log('✅ [Home] Rendering home page for user:', user.name);

  return (
    <div className="page">
      <div className="card">
        <h1 className="title">Welcome, {user.name}</h1>
        <p>Email: {user.email}</p>
        <p>Role: {user.role}</p>

        <div className="flex gap-4 mt-6">
          <button className="btn" onClick={() => navigate("/resume")}>
            Edit Resume
          </button>
          <button className="btn danger" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}