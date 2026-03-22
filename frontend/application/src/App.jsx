import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./services/supabaseClient";

import Sidebar from "./components/Sidebar";
import LoginPage from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import VersionManagement from "./pages/VersionManagement";
import CreateVersion from "./pages/CreateVersion";
import ModulesLibrary from "./pages/ModulesLibrary";
import FeaturesLibrary from "./pages/FeaturesLibrary";
import TestExecution from "./pages/TestExecution";
import FailedIssues from "./pages/FailedIssues";
import UserStoryMapping from "./pages/UserStoryMapping";

function ProtectedRoute({ session, children }) {
  if (session === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }
  return session ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    // Get session on first load
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    // ✅ This listener fires on both login AND logout
    // When user clicks logout → session becomes null → redirects to /login
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route
          path="/login"
          element={session ? <Navigate to="/" replace /> : <LoginPage />}
        />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute session={session}>
              <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 flex flex-col">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/versions" element={<VersionManagement />} />
                    <Route path="/versions/create" element={<CreateVersion />} />
                    <Route path="/modules" element={<ModulesLibrary />} />
                    <Route path="/features" element={<FeaturesLibrary />} />
                    <Route path="/test-execution" element={<TestExecution />} />
                    <Route path="/failed-issues" element={<FailedIssues />} />
                    <Route path="/stories" element={<UserStoryMapping />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}