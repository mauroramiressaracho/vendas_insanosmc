import type { DashboardSummary } from "../../types";
import { money } from "../../utils/format";

export const CashReconciliation = ({ summary, counted, onCountedChange }: { summary: DashboardSummary; counted: number; onCountedChange: (value: number) => void }) => {
  const diff = counted - summary.valorEsperadoDinheiro;
  const status = diff === 0 ? "Caixa conferido" : diff > 0 ? "Sobra de caixa" : "Falta de caixa";
  return (
    <section className="panel dashboard-section">
      <h2>Conferência de caixa</h2>
      <div className="summary-grid">
        <span>Valor inicial<strong>{money(summary.valorInicial)}</strong></span>
        <span>Vendas em dinheiro<strong>{money(summary.vendasDinheiro)}</strong></span>
        <span>Valor esperado<strong>{money(summary.valorEsperadoDinheiro)}</strong></span>
        <label>Valor contado<input type="number" step="0.01" value={counted} onChange={(event) => onCountedChange(Number(event.target.value))} /></label>
        <span>Diferença<strong className={diff < 0 ? "danger" : "ok"}>{money(diff)}</strong></span>
        <span>Status<strong className={diff < 0 ? "danger" : "ok"}>{status}</strong></span>
      </div>
    </section>
  );
};
