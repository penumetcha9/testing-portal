import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    async function loadRole() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setRole(null);
                setLoading(false);
                return;
            }
            const { data } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();
            setRole(data?.role || "tester");
        } catch (e) {
            console.warn("RoleContext error:", e.message);
            setRole("tester");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadRole();

        // Re-fetch role whenever user logs in or out
        const { data: listener } = supabase.auth.onAuthStateChange(() => {
            setLoading(true);
            loadRole();
        });

        return () => listener.subscription.unsubscribe();
    }, []);

    return (
        <RoleContext.Provider
            value={{
                role,
                loading,
                isAdmin: role === "admin",
                isTester: role === "tester",
                isDeveloper: role === "developer",
            }}
        >
            {children}
        </RoleContext.Provider>
    );
}

export function useRole() {
    const ctx = useContext(RoleContext);
    if (!ctx) throw new Error("useRole must be used inside <RoleProvider>");
    return ctx;
}