import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  
  console.log('🔒 [ProtectedRoute] Checking authentication, token exists:', !!token);

  // ❌ Not logged in
  if (!token) {
    console.warn('⚠️ [ProtectedRoute] No token found, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // ✅ Logged in
  console.log('✅ [ProtectedRoute] User authenticated, rendering protected content');
  return children;
}