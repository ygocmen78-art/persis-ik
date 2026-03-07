"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

interface DepartmentStatsProps {
    data: {
        name: string
        value: number
    }[]
}

// Custom vibrant color palette for departments
const COLORS = [
    "#0088FE", // Blue
    "#00C49F", // Teal
    "#FFBB28", // Yellow
    "#FF8042", // Orange
    "#8884d8", // Purple
    "#82ca9d", // Green
    "#ffc658", // Gold
    "#ff7300", // Dark Orange
    "#a4de6c", // Light Green
    "#d0ed57", // Lime
    "#83a6ed", // Light Blue
    "#8dd1e1", // Sky Blue
]

export function DepartmentStats({ data }: DepartmentStatsProps) {
    // Filter out departments with 0 employees just in case, though query filters active
    const activeData = data.filter(item => item.value > 0);

    return (
        <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
                <CardTitle>Departman Dağılımı</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Pie Chart */}
                    <div className="h-[250px] w-full md:w-1/2 min-w-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={activeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {activeData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            strokeWidth={0}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => [`${value} Kişi`, 'Personel']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Custom Legend */}
                    <div className="w-full md:w-1/2 flex flex-col justify-center gap-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {activeData.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between text-sm group hover:bg-muted/50 p-1.5 rounded-md transition-colors">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="h-3 w-3 rounded-full shrink-0"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <span className="font-medium text-muted-foreground truncate max-w-[150px]" title={entry.name}>
                                        {entry.name}
                                    </span>
                                </div>
                                <span className="font-bold font-mono bg-muted px-2 py-0.5 rounded text-xs">
                                    {entry.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
