import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const data = [
    { day: "Mon", Passed: 45, Failed: 8 },
    { day: "Tue", Passed: 52, Failed: 12 },
    { day: "Wed", Passed: 61, Failed: 11 },
    { day: "Thu", Passed: 58, Failed: 7 },
    { day: "Fri", Passed: 67, Failed: 10 },
];

export default function TrendsChart() {
    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Testing Trends</h3>

            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Passed" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="Failed" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}