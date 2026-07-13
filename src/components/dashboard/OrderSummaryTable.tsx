import { useState } from "react";
import type { DashboardSummary } from "../../types";
import { dateTime, money, orderNumber, paymentLabel } from "../../utils/format";

export const OrderSummaryTable = ({ summary }: { summary: DashboardSummary }) => {
  const [opened, setOpened] = useState<string | undefined>();
  return (
    <section className="panel dashboard-section">
      <h2>Pedidos</h2>
      <div className="data-table orders-table">
        <div className="table-row header"><span>Pedido</span><span>Data</span><span>Operador</span><span>Pagamento</span><span>Itens</span><span>Total</span><span>Status</span></div>
        {summary.grossOrders.map((order) => (
          <button className={`table-row ${order.status}`} key={order.id} onClick={() => setOpened(opened === order.id ? undefined : order.id)}>
            <span>#{orderNumber(order.numero)}</span>
            <span>{dateTime(order.criadoEm)}</span>
            <span>{order.operador}</span>
            <span>{paymentLabel(order.formaPagamento)}</span>
            <span>{order.itens.reduce((sum, item) => sum + item.quantidade, 0)}</span>
            <span>{money(order.total)}</span>
            <span>{order.status}</span>
            {opened === order.id && <small>{order.itens.map((item) => `${item.quantidade}x ${item.nome}`).join(" · ")}</small>}
          </button>
        ))}
      </div>
    </section>
  );
};
