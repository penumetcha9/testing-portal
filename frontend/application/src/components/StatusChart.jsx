import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const data = [
    { name: "Passed", value: 892 },
    { name: "Failed", value: 127 },
    { name: "Blocked", value: 58 },
    { name: "Retest", value: 42 },
    { name: "Not Tested", value: 128 },
];

const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#8b5cf6", "#6b7280"];

function StatusChart() {
    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">
                Test Status Distribution
            </h3>

            <PieChart width={400} height={300}>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                    }
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </div>
    );
}

export default StatusChart;