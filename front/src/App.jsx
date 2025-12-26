import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";

import Home from "./pages/Home";
import HospitalHome from "./pages/HospitalHome";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
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
import Footer from "./components/Footer";


export default function App() {
  const [signedIn, setSignedIn] = useState(false);
  const [role, setRole] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user) {
      setSignedIn(false);
      setRole(null);
    } else {
      setSignedIn(true);
      setRole(user.role);
    }
  }, []);

  return (
    <>
      <Navbar signedIn={signedIn} setSignedIn={setSignedIn} role={role} />

      <Routes>
        {/* ROLE BASED HOME */}
        <Route
          path="/"
          element={role === "hospital" ? <HospitalHome /> : <Home />}
        />

        {/* AUTH */}
        <Route
          path="/login"
          element={<Login setSignedIn={setSignedIn} setRole={setRole} />}
        />
        <Route
          path="/signup"
          element={<Signup setSignedIn={setSignedIn} setRole={setRole} />}
        />

        {/* HOSPITAL */}
        <Route
          path="/hospital-profile"
          element={
            <ProtectedRoute>
              <HospitalProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/post-job"
          element={
            <ProtectedRoute>
              <PostJob />
            </ProtectedRoute>
          }
        />

        <Route
          path="/posted-jobs"
          element={
            <ProtectedRoute>
              <JobsPosted />
            </ProtectedRoute>
          }
        />

        <Route
          path="/jobs/:jobId"
          element={
            <ProtectedRoute>
              <HospJobData />
            </ProtectedRoute>
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
            <ProtectedRoute>
              <MedicalResume />
            </ProtectedRoute>
          }
        />

        {/* CHAT */}
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

        {/* MISC */}
        <Route path="/news" element={<News />} />
        <Route path="/who" element={<WhoUpdates />} />
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

      <Footer />
    </>
  );
}
