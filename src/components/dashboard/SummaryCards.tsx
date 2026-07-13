import type { DashboardSummary } from "../../types";
import { money } from "../../utils/format";

export const SummaryCards = ({ summary }: { summary: DashboardSummary }) => (
  <div className="dashboard-cards">
    <Card label="Total vendido" value={money(summary.totalVendido)} />
    <Card label="Quantidade de pedidos" value={summary.quantidadePedidos} />
    <Card label="Ticket médio" value={money(summary.ticketMedio)} />
    <Card label="Total de itens" value={summary.totalItens} />
    <Card label="Pedidos cancelados" value={summary.pedidosCancelados} />
    <Card label="Valor cancelado" value={money(summary.valorCancelado)} />
  </div>
);

const Card = ({ label, value }: { label: string; value: string | number }) => (
  <article className="metric-card">
    <span>{label}</span>
    <strong>{value}</strong>
  </article>
);
