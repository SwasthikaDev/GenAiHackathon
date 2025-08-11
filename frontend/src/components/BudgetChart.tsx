"use client";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

export default function BudgetChart({ data }: { data: Record<string, number> }) {
  const labels = Object.keys(data);
  const values = Object.values(data).map(v => Math.max(0, v));
  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: ["#a855f7", "#ec4899", "#22c55e", "#f59e0b", "#06b6d4"],
        borderWidth: 0,
      },
    ],
  };
  return <Doughnut data={chartData} />;
}


