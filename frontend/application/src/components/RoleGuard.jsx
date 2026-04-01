import { useRole } from "../hooks/useRole";
import { Navigate } from "react-router-dom";

export const PERMISSIONS = {
    view_test_execution: ["admin", "tester"],
    view_failed_issues: ["admin", "tester", "developer"],
    view_version_management: ["admin"],
    view_modules: ["admin", "developer", "tester"],
    view_features: ["admin", "developer", "tester"],
    view_user_stories: ["admin", "developer", "tester"],
    view_dashboard: ["admin", "tester", "developer"],
    submit_test_result: ["admin", "tester"],
    save_test_draft: ["admin", "tester"],
    assign_developer: ["admin"],
    add_comment: ["admin", "tester", "developer"],
    export_csv: ["admin", "tester"],
    export_report: ["admin", "tester", "developer"],
    link_bug_tracker: ["admin", "tester", "developer"],
    create_version: ["admin"],
    edit_version: ["admin"],
    create_module: ["admin", "developer"],
    edit_module: ["admin", "developer"],
    create_feature: ["admin", "developer"],
    edit_feature: ["admin", "developer"],
    manage_users: ["admin"],
};

export function can(action, role) {
    if (!role) return false;
    return PERMISSIONS[action]?.includes(role) ?? false;
}

export function Can({ action, children, fallback = null }) {
    const { role, loading } = useRole();
    if (loading) return null;
    return can(action, role) ? children : fallback;
}

export function RoleGuard({ action, children, redirectTo = "/" }) {
    const { role, loading } = useRole();

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin" />
        </div>
    );

    if (!can(action, role)) {
        return <Navigate to={redirectTo} replace />;
    }

    return children;
}
