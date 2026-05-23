import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import AppLayout from "./layouts/AppLayout";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const WorkspacePage = lazy(() => import("./pages/WorkspacePage"));
const PlaylistsPage = lazy(() => import("./pages/PlaylistsPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const StreakPage = lazy(() => import("./pages/StreakPage"));
const CodingDashboardPage = lazy(() => import("./pages/CodingDashboardPage"));
const AssignmentSolverPage = lazy(() => import("./pages/AssignmentSolverPage"));

function PageLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-[var(--bg)] text-[var(--text)]">
      <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-muted">
        Loading...
      </div>
    </div>
  );
}

function ProtectedRoute() {
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/workspace" element={<WorkspacePage />} />
              <Route path="/workspace/:videoId" element={<WorkspacePage />} />
              <Route path="/playlists" element={<PlaylistsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/dashboard/streak" element={<StreakPage />} />
              <Route path="/coding-dashboard" element={<CodingDashboardPage />} />
              <Route path="/assignment-solver" element={<AssignmentSolverPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
