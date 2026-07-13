import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from "chart.js";
import { Bar } from "react-chartjs-2";
import type { DashboardSummary } from "../../types";
import { chartValueLabels } from "../../utils/chartValueLabels";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, chartValueLabels);

export const ProductRankingChart = ({ summary }: { summary: DashboardSummary }) => {
  const top = summary.produtos.slice(0, 10).sort((a, b) => a.quantidade - b.quantidade);
  return (
    <div className="chart-card">
      <h3>Produtos mais vendidos</h3>
      <Bar
        data={{ labels: top.map((item) => item.produto), datasets: [{ label: "Quantidade", data: top.map((item) => item.quantidade), backgroundColor: "#d71920" }] }}
        options={{ indexAxis: "y", responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: "#fff" }, grid: { color: "#333" } }, y: { ticks: { color: "#fff" }, grid: { color: "#222" } } }, plugins: { legend: { display: false }, valueLabels: { formatter: (value: number) => `${value} un.` } } }}
      />
    </div>
  );
};
