import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useRole } from "./hooks/useRole";
import Sidebar from "./components/Sidebar";
import { can } from "./components/RoleGuard";

// ── All pages load lazily — only downloaded when the user navigates to them ──
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const VersionManagement = lazy(() => import("./pages/VersionManagement"));
const CreateVersion = lazy(() => import("./pages/CreateVersion"));
const ModulesLibrary = lazy(() => import("./pages/ModulesLibrary"));
const FeaturesLibrary = lazy(() => import("./pages/FeaturesLibrary"));
const UserStoryMapping = lazy(() => import("./pages/UserStoryMapping"));
const TestExecution = lazy(() => import("./pages/TestExecution"));
const FailedIssues = lazy(() => import("./pages/FailedIssues"));
const UserManagement = lazy(() => import("./pages/UserManagement"));

// ── Spinner shown while a page chunk is downloading ──────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin" />
    </div>
  );
}

// ── Shown when a user tries to access a page they don't have permission for ──
function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <i className="fa-solid fa-lock text-4xl text-muted-foreground" />
      <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
      <p className="text-muted-foreground text-sm">
        You don't have permission to view this page.
      </p>
    </div>
  );
}

// ── Layout for all authenticated pages (sidebar + content) ───────────────────
function ProtectedLayout() {
  const { role, loading } = useRole();

  // Still fetching role — show spinner, don't flash wrong content
  if (loading) return <PageLoader />;

  // No role means not logged in — send to login
  if (!role) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto flex flex-col">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Dashboard — all roles ── */}
            <Route path="/" element={<Dashboard />} />

            {/* ── Version Management — admin only ── */}
            <Route
              path="/versions"
              element={can("view_version_management", role) ? <VersionManagement /> : <AccessDenied />}
            />
            <Route
              path="/versions/new"
              element={can("create_version", role) ? <CreateVersion /> : <AccessDenied />}
            />

            {/* ── Modules Library — admin, developer, tester ── */}
            <Route
              path="/modules"
              element={can("view_modules", role) ? <ModulesLibrary /> : <AccessDenied />}
            />

            {/* ── Features Library — admin, developer, tester ── */}
            <Route
              path="/features"
              element={can("view_features", role) ? <FeaturesLibrary /> : <AccessDenied />}
            />

            {/* ── User Story Mapping — admin, developer, tester ── */}
            <Route
              path="/stories"
              element={can("view_user_stories", role) ? <UserStoryMapping /> : <AccessDenied />}
            />

            {/* ── Test Execution — admin, tester ── */}
            <Route
              path="/test-execution"
              element={can("view_test_execution", role) ? <TestExecution /> : <AccessDenied />}
            />

            {/* ── Failed Issues — all roles ── */}
            <Route
              path="/failed-issues"
              element={can("view_failed_issues", role) ? <FailedIssues /> : <AccessDenied />}
            />

            {/* ── User Management — admin only ── */}
            <Route
              path="/users"
              element={can("manage_users", role) ? <UserManagement /> : <AccessDenied />}
            />

            {/* ── Catch-all — redirect home ── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

// ── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </Suspense>
  );
}