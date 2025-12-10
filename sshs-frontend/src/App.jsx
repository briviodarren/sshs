import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Assignments from './pages/Assignments';
import Materials from './pages/Materials';
import Scores from './pages/Scores';
import Attendance from './pages/Attendance';
import Permit from './pages/Permit';
import Scholarship from './pages/Scholarship';
import FeeRelief from './pages/FeeRelief';
import Critique from './pages/Critique';
import Penalty from './pages/Penalty';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { requestForToken } from './firebase';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const initFcm = async () => {
      if (!("Notification" in window)) {
        console.log("Notifications not supported");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("Notification permission not granted");
        return;
      }

      const token = await requestForToken();
      console.log("FCM Token from App:", token);
    };

    initFcm();
  }, []);
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes (Wrapped in MainLayout) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* OPEN ROUTES (All Roles) */}
        <Route index element={<Dashboard />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="materials" element={<Materials />} />
        <Route path="scores" element={<Scores />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="permit" element={<Permit />} />
        <Route path="penalty" element={<Penalty />} />
        <Route path="profile" element={<Profile />} />

        {/* RESTRICTED ROUTES (Student & Admin ONLY) */}
        <Route 
          path="scholarship" 
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <Scholarship />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="fee-relief" 
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <FeeRelief />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="critique" 
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <Critique />
            </ProtectedRoute>
          } 
        />

        {/* ADMIN ONLY ROUTES */}
        <Route 
          path="reports" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Reports />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Catch-all Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;