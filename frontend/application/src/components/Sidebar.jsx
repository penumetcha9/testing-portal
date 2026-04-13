import { NavLink } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useRole } from "../hooks/useRole";
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
    const listenerRef = useRef(null);

    useEffect(() => {
        if (listenerRef.current) return;

        let isMounted = true;

        async function loadProfile() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user || !isMounted) return;

                const { data } = await supabase
                    .from("profiles")
                    .select("full_name, username, avatar_url")
                    .eq("id", user.id)
                    .single();

                if (!isMounted) return;

                setProfile({
                    email: user.email,
                    full_name: data?.full_name || user.user_metadata?.full_name || "",
                    avatar_url: data?.avatar_url || user.user_metadata?.avatar_url || null,
                });
            } catch (err) {
                if (err?.name !== "AbortError") console.error("loadProfile error:", err);
            }
        }

        loadProfile();

        const { data: listener } = supabase.auth.onAuthStateChange(() => {
            if (isMounted) loadProfile();
        });

        listenerRef.current = listener.subscription;

        return () => {
            isMounted = false;
            listenerRef.current?.unsubscribe();
            listenerRef.current = null;
        };
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
            ? "text-white shadow-md"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        }`;

    const visibleNavItems = navItems;

    return (
        <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col overflow-hidden">

            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center">
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
                            style={({ isActive }) => isActive ? { backgroundColor: '#15803d' } : {}}
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
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: '#15803d' }}>
                            {getInitials(profile)}
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                            {profile?.full_name || "Loading..."}
                        </p>
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