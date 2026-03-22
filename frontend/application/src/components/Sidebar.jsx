import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import {
    LayoutDashboard,
    GitBranch,
    Package,
    ListChecks,
    Map,
    Play,
    AlertCircle,
    LogOut,
} from "lucide-react";

export default function Sidebar() {
    const [profile, setProfile] = useState(null);

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

    const navItems = [
        { label: "Dashboard", path: "/", icon: <LayoutDashboard size={20} /> },
        { label: "Version Management", path: "/versions", icon: <GitBranch size={20} /> },
        { label: "Modules Library", path: "/modules", icon: <Package size={20} /> },
        { label: "Features Library", path: "/features", icon: <ListChecks size={20} /> },
        { label: "User Story Mapping", path: "/stories", icon: <Map size={20} /> },
        { label: "Test Execution", path: "/test-execution", icon: <Play size={20} /> },
        { label: "Failed Issues Review", path: "/failed-issues", icon: <AlertCircle size={20} /> },
    ];

    const linkClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${isActive
            ? "bg-green-700 text-white shadow-md"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        }`;

    return (
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">

            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-700 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">✓</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">NexTech RMS</h1>
                        <p className="text-xs text-gray-500 font-medium">Testing Portal</p>
                    </div>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-1">
                    {navItems.map((item) => (
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

            {/* User Profile + Sign Out */}
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
                        <p className="text-xs text-gray-500 truncate">
                            {profile?.email || ""}
                        </p>
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