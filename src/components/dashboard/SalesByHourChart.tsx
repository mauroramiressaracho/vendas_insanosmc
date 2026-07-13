import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import type { DashboardSummary } from "../../types";
import { chartValueLabels } from "../../utils/chartValueLabels";
import { money } from "../../utils/format";

ChartJS.register(BarElement, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, chartValueLabels);

export const SalesByHourChart = ({ summary }: { summary: DashboardSummary }) => (
  <div className="chart-grid">
    <div className="chart-card">
      <h3>Faturamento por horário</h3>
      <Line
        data={{ labels: summary.horas.map((item) => item.hora), datasets: [{ label: "Valor", data: summary.horas.map((item) => item.valor), borderColor: "#63d64d", backgroundColor: "#63d64d", tension: 0.25 }] }}
        options={{ ...chartOptions, plugins: { ...chartOptions.plugins, valueLabels: { formatter: (value: number) => money(value) } } }}
      />
    </div>
    <div className="chart-card">
      <h3>Pedidos por horário</h3>
      <Bar
        data={{ labels: summary.horas.map((item) => item.hora), datasets: [{ label: "Pedidos", data: summary.horas.map((item) => item.pedidos), backgroundColor: "#176fc2" }] }}
        options={{ ...chartOptions, plugins: { ...chartOptions.plugins, valueLabels: { formatter: (value: number) => `${value} pedidos` } } }}
      />
    </div>
  </div>
);

const chartOptions = { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: "#fff" }, grid: { color: "#333" } }, y: { ticks: { color: "#fff" }, grid: { color: "#222" } } }, plugins: { legend: { labels: { color: "#fff" } } } };
