import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#8b5cf6", "#6b7280"];

export default function StatusChart({ data }) {
    const chartData = data && data.length > 0
        ? data
        : [
            { name: "Passed", value: 0 },
            { name: "Failed", value: 0 },
            { name: "Blocked", value: 0 },
            { name: "Retest", value: 0 },
            { name: "Not Tested", value: 0 },
        ];

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Test Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) =>
                            percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ""
                        }
                    >
                        {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}