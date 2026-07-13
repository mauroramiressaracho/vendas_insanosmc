import type { DashboardSummary } from "../../types";
import { money } from "../../utils/format";

export const ProductSalesTable = ({ summary }: { summary: DashboardSummary }) => (
  <section className="panel dashboard-section">
    <h2>Produtos vendidos</h2>
    <div className="data-table">
      <div className="table-row header"><span>Produto</span><span>Categoria</span><span>Qtd</span><span>Preço médio</span><span>Total</span></div>
      {summary.produtos.map((item) => (
        <div className="table-row" key={item.productId}><span>{item.produto}</span><span>{item.categoria}</span><span>{item.quantidade}</span><span>{money(item.precoMedio)}</span><span>{money(item.total)}</span></div>
      ))}
      <div className="table-row total"><span>Total geral</span><span /><span>{summary.totalItens}</span><span /><span>{money(summary.totalVendido)}</span></div>
    </div>
  </section>
);
