import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useRole } from "../hooks/useRole";
import { can } from "./RoleGuard";
import {
    LayoutDashboard,
    GitBranch,
    Package,
    ListChecks,
    Map,
    Play,
    AlertCircle,
    LogOut,
    Users,
} from "lucide-react";

// Role badge styling
const ROLE_BADGE = {
    admin: "bg-purple-100 text-purple-700",
    tester: "bg-emerald-100 text-emerald-700",
    developer: "bg-blue-100 text-blue-700",
};

export default function Sidebar() {
    const [profile, setProfile] = useState(null);
    const { role } = useRole();

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from("profiles")
                .select("full_name, username, avatar_url")
                .eq("id", user.id)
                .single();

            setProfile({
                email: user.email,
                full_name: data?.full_name || user.user_metadata?.full_name || "",
                avatar_url: data?.avatar_url || user.user_metadata?.avatar_url || null,
            });
        }

        loadProfile();

        const { data: listener } = supabase.auth.onAuthStateChange(() => loadProfile());
        return () => listener.subscription.unsubscribe();
    }, []);

    function getInitials(profile) {
        if (profile?.full_name) {
            return profile.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
        }
        return profile?.email?.[0]?.toUpperCase() ?? "?";
    }

    async function handleSignOut() {
        await supabase.auth.signOut();
    }

    // Each nav item declares which permission is needed to see it
    const navItems = [
        { label: "Dashboard", path: "/", icon: <LayoutDashboard size={20} />, action: null },
        { label: "Version Management", path: "/versions", icon: <GitBranch size={20} />, action: "view_version_management" },
        { label: "Modules Library", path: "/modules", icon: <Package size={20} />, action: "view_modules" },
        { label: "Features Library", path: "/features", icon: <ListChecks size={20} />, action: "view_features" },
        { label: "User Story Mapping", path: "/stories", icon: <Map size={20} />, action: "view_user_stories" },
        { label: "Test Execution", path: "/test-execution", icon: <Play size={20} />, action: "view_test_execution" },
        { label: "Failed Issues Review", path: "/failed-issues", icon: <AlertCircle size={20} />, action: "view_failed_issues" },
        { label: "User Management", path: "/users", icon: <Users size={20} />, action: "manage_users" },
    ];

    const linkClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${isActive
            ? "bg-green-700 text-white shadow-md"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        }`;

    // Only show nav items the current role has access to
    const visibleNavItems = navItems.filter(
        (item) => item.action === null || can(item.action, role)
    );

    return (
        <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col overflow-hidden">

            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-[#fce8dc]">
                        <img src="data:image/png;base64,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" alt="NexTech Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">NexTech RMS</h1>
                        <p className="text-xs text-gray-500 font-medium">Testing Portal</p>
                    </div>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-1">
                    {visibleNavItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === "/"}
                            className={linkClass}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/* User Profile + Role Badge + Sign Out */}
            <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-3">
                    {profile?.avatar_url ? (
                        <img
                            src={profile.avatar_url}
                            alt="avatar"
                            className="w-10 h-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {getInitials(profile)}
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                            {profile?.full_name || "Loading..."}
                        </p>
                        {/* Role badge */}
                        {role && (
                            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full capitalize mt-0.5 ${ROLE_BADGE[role] || "bg-gray-100 text-gray-600"}`}>
                                {role}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={handleSignOut}
                        title="Sign out"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>

        </aside>
    );
}