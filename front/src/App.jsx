import { Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

import Home from "./pages/Home";
import HospitalHome from "./pages/HospitalHome";
import Auth from "./pages/Auth";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import PageTransition from "./components/PageTransition";
import HospitalProfile from "./pages/HospitalProfile";
import AdminHospitalData from "./pages/AdminHospitalData";
import MedicalResume from "./pages/MedicalResume";
import GetVerified from "./pages/GetVerified";
import AdminDashboard from "./pages/AdminDashboard";
import AdminHospitals from "./pages/AdminHospitals";
import AdminRoute from "./components/AdminRoute";
import UsersPage from "./pages/UsersPage";
import ChatPage from "./pages/ChatPage";
import PostJob from "./pages/PostJob";
import JobsPosted from "./pages/JobsPosted";
import HospJobData from "./pages/HospJobData";
import SearchJob from "./pages/SearchJob";
import ViewJob from "./pages/ViewJob";
import News from "./pages/News";
import WhoUpdates from "./pages/WhoUpdates";
import Profile from "./pages/Profile";
import ViewResume from "./pages/ViewResume";
import Dashboard from "./pages/Dashboard";
import Notifications from "./pages/Notifications";
import FindDoctor from "./pages/FindDoctor";
import HospitalRoute from "./components/HospitalRoute"
import DocRoute from "./components/DocRoute"


export default function App() {
  const location = useLocation();
  const [signedIn, setSignedIn] = useState(false);
  const [role, setRole] = useState("");

  // Check auth state on mount and whenever location changes
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      
      if (!token || !userStr) {
        setSignedIn(false);
        setRole("");
        return;
      }

      try {
        const user = JSON.parse(userStr);
        if (user && user.role) {
          setSignedIn(true);
          setRole(user.role);
        } else {
          setSignedIn(false);
          setRole("");
        }
      } catch (e) {
        setSignedIn(false);
        setRole("");
      }
    };

    checkAuth();

    // Also listen for storage changes (logout from other tabs/windows)
    const handleStorageChange = () => {
      checkAuth();
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom logout event
    window.addEventListener('logout', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('logout', handleStorageChange);
    };
  }, [location.pathname]); // Re-check when route changes

  return (
    <>
      <Navbar signedIn={signedIn} setSignedIn={setSignedIn} role={role} />

      <PageTransition>
        <Routes>
          {/* ROLE BASED HOME */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                {role === "hospital" ? <HospitalHome /> : <Home />}
              </ProtectedRoute>
            }
          />

        {/* AUTH - Public route (not protected) */}
        <Route
          path="/auth"
          element={<Auth setSignedIn={setSignedIn} setRole={setRole} />}
        />
        {/* Legacy routes redirect to /auth */}
        <Route
          path="/login"
          element={<Auth setSignedIn={setSignedIn} setRole={setRole} />}
        />
        <Route
          path="/signup"
          element={<Auth setSignedIn={setSignedIn} setRole={setRole} />}
        />
        <Route
          path="/signUp"
          element={<Auth setSignedIn={setSignedIn} setRole={setRole} />}
        />

        {/* HOSPITAL */}
        <Route
          path="/hospital-profile"
          element={
            <HospitalRoute>
              <HospitalProfile />
            </HospitalRoute>
          }
        />

        <Route
          path="/post-job"
          element={
            <HospitalRoute>
              <PostJob />
            </HospitalRoute>
          }
        />

        <Route
          path="/posted-jobs"
          element={
            <HospitalRoute>
              <JobsPosted />
            </HospitalRoute>
          }
        />

        <Route
          path="/jobs/:jobId"
          element={
            <HospitalRoute>
              <HospJobData />
            </HospitalRoute>
          }
        />

        {/* PUBLIC JOB VIEW */}
        <Route
          path="/jobs/view/:jobId"
          element={<ViewJob />}
        />

        <Route
          path="/search/jobs"
          element={
            <ProtectedRoute>
              <SearchJob />
            </ProtectedRoute>
          }
        />

        {/* DOCTOR */}
        <Route
          path="/resume"
          element={
            <DocRoute>
              <MedicalResume />
            </DocRoute>
          }
        />
        <Route
          path="/get-verified"
          element={
            <DocRoute>
              <GetVerified />
            </DocRoute>
          }
        />

        {/* CHAT */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:userId"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin-hospital"
          element={
            <AdminRoute>
              <AdminHospitals />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/hospital/:hospitalId"
          element={
            <AdminRoute>
              <AdminHospitalData />
            </AdminRoute>
          }
        />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* NOTIFICATIONS */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* MISC */}
        <Route path="/news" element={<News />} />
        <Route path="/who" element={<WhoUpdates />} />
        <Route path="/find-doctor" element={<FindDoctor />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route
          path="/resume/:id"
          element={
            <ProtectedRoute>
              <ViewResume />
            </ProtectedRoute>
          }
        />

        {/* FALLBACK */}
        <Route path="*" element={<Home />} />
        </Routes>
      </PageTransition>
    </>
  );
}
