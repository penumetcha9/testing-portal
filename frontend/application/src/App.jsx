import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useRole } from "./hooks/useRole";
import Sidebar from "./components/Sidebar";

const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const VersionManagement = lazy(() => import("./pages/VersionManagement"));
const CreateVersion = lazy(() => import("./pages/CreateVersion"));
const ModulesLibrary = lazy(() => import("./pages/ModulesLibrary"));
const FeaturesLibrary = lazy(() => import("./pages/FeaturesLibrary"));
const UserStoriesList = lazy(() => import("./pages/UserStoriesList"));
const UserStoryMapping = lazy(() => import("./pages/UserStoryMapping"));
const TestExecution = lazy(() => import("./pages/TestExecution"));
const FailedIssues = lazy(() => import("./pages/FailedIssues"));
const UserManagement = lazy(() => import("./pages/UserManagement"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin" />
    </div>
  );
}

function ProtectedLayout() {
  const { role, loading } = useRole();

  if (loading) return <PageLoader />;   // ← wait until role is fetched
  if (!role) return <Navigate to="/login" replace />;  // ← only redirect when sure

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto flex flex-col">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/versions" element={<VersionManagement />} />
            <Route path="/versions/new" element={<CreateVersion />} />
            <Route path="/modules" element={<ModulesLibrary />} />
            <Route path="/features" element={<FeaturesLibrary />} />
            <Route path="/stories" element={<UserStoriesList />} />
            <Route path="/stories/new" element={<UserStoryMapping />} />
            <Route path="/stories/:storyId" element={<UserStoryMapping />} />
            <Route path="/test-execution" element={<TestExecution />} />
            <Route path="/failed-issues" element={<FailedIssues />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </Suspense>
  );
}