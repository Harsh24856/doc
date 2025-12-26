import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import { useState } from "react";
import { useEffect } from "react";
import Navbar from "./components/Navbar"
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
export default function App() {
  const[signedIn, setSignedIn] = useState(false);
  const[role, setRole] = useState("");
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
  <Navbar signedIn={signedIn} setSignedIn={setSignedIn} role={role}/>
  <Routes>
  <Route
    path="/"
    element={
        <Home />
    }
  />

  <Route path="/login" element={<Login setSignedIn={setSignedIn} setRole={setRole}/>} />
  <Route path="/signup" element={<Signup setSignedIn={setSignedIn} setRole={setRole}/>} />
  <Route 
        path="/hospital-profile" 
        element={
        <ProtectedRoute>
        <HospitalProfile/>
        </ProtectedRoute>
        } />
  <Route
        path="/resume"
        element={
          <ProtectedRoute>
            <MedicalResume />
          </ProtectedRoute>
        }
      />
      <Route
        path="/get-verified"
        element={
          <ProtectedRoute>
            <GetVerified />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
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
      {/* Catch-all route for unmatched paths */}
      <Route path="*" element={<Home />} />
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
      <Route 
        path="/search/jobs"
        element={
          <ProtectedRoute>
            <SearchJob />
          </ProtectedRoute>
        }
      /> 
      <Route 
        path="/jobs/view/:jobId"
        element={
          <ProtectedRoute>
            <ViewJob />
          </ProtectedRoute>
        }
      />  
</Routes>
</>

    
  );
}