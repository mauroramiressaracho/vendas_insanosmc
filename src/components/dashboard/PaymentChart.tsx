import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import type { DashboardSummary } from "../../types";
import { money, paymentLabel } from "../../utils/format";
import { chartValueLabels } from "../../utils/chartValueLabels";

ChartJS.register(ArcElement, Tooltip, Legend, chartValueLabels);

export const PaymentChart = ({ summary }: { summary: DashboardSummary }) => (
  <div className="chart-card">
    <h3>Vendas por pagamento</h3>
    <Doughnut
      data={{
        labels: summary.pagamentos.map((item) => paymentLabel(item.formaPagamento)),
        datasets: [{ data: summary.pagamentos.map((item) => item.valor), backgroundColor: ["#248c2c", "#00a0a4", "#176fc2"], borderColor: "#111" }],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#fff" } },
          tooltip: { callbacks: { label: (item) => `${item.label}: ${money(Number(item.raw))}` } },
          valueLabels: {
            formatter: (value: number) => `${money(value)}\n${summary.totalVendido ? ((value / summary.totalVendido) * 100).toFixed(1) : "0,0"}%`,
          },
        },
      }}
    />
  </div>
);
