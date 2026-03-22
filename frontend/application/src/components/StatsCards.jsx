export default function StatsCards() {

    const stats = [
        { title: "Total Tests", value: 1247 },
        { title: "Passed Tests", value: 892 },
        { title: "Failed Tests", value: 127 },
        { title: "In Progress", value: 228 }
    ]

    return (
        <div className="grid grid-cols-4 gap-6">

            {stats.map((s, i) => (

                <div key={i} className="bg-white p-6 rounded-lg shadow">

                    <p className="text-gray-500 text-sm">
                        {s.title}
                    </p>

                    <p className="text-2xl font-bold">
                        {s.value}
                    </p>

                </div>

            ))}

        </div>
    )
}