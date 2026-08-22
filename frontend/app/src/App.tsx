import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/Login";
import { Toaster } from "./components/ui/toaster";
import LoginRoute from "./components/LoginRoute";
import MainLayout from "./components/MainLayout";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

const DashboardPage = lazy(() => import("./components/pages/DashboardPage"));
const AnalyticsPage = lazy(() => import("./components/pages/AnalyticsPage"));
const SettingsPage = lazy(() => import("./components/pages/SettingsPage"));

function LogOut() {
  localStorage.clear();
  return <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Suspense fallback={null}>
        <Routes>
          <Route
            path="/login"
            element={
              <LoginRoute>
                <Login />
              </LoginRoute>
            }
          />
          <Route path="/logout" element={<LogOut />} />

          <Route element={<MainLayout />}>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={<Navigate to="/analytics/messages" replace />}
            />
            <Route
              path="/analytics/:tab"
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
