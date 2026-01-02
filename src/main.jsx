import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"

import StudentLogin from "./pages/StudentLogin/StudentLogin"
import AdminLogin from "./pages/AdminLogin/AdminLogin"
import StudentDashboard from "./pages/StudentDashboard/StudentDashboard"
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard"
import LabDetails from "./pages/LabDetails/LabDetails"

import "./index.css"
import StudentSignup from "./pages/StudentSignup/StudentSignup"
import StaffLogin from "./pages/StaffLogin/StaffLogin"
import StaffSignup from "./pages/StaffSignup/StaffSignup"
import StaffDashboard from "./pages/StaffDashboard/StaffDashboard"
const root = ReactDOM.createRoot(document.getElementById("root"))

root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<StudentLogin />} />
      <Route path="/signup" element={<StudentSignup />} />
      <Route path="/staff/login" element={<StaffLogin />} />
      <Route path="/staff/signup" element={<StaffSignup />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/" element={<StudentDashboard />} />
      <Route path="/staff/dashboard" element={<StaffDashboard />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/lab/:id" element={<LabDetails />} />
    </Routes>
  </BrowserRouter>
)
