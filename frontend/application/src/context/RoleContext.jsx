import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);
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
        loadRole().then(() => setInitialized(true));

        const { data: listener } = supabase.auth.onAuthStateChange((event) => {
            if (!initialized) return;

            if (event === "SIGNED_OUT") {
                setRole(null);
            }

            if (event === "USER_UPDATED") {
                loadRole();
            }

            // 🚫 Ignore SIGNED_IN unless you really need it
        });

        return () => listener.subscription.unsubscribe();
    }, [initialized]);

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