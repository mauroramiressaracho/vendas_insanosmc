import { useState } from "react";
import { Ban, Eye, Printer } from "lucide-react";
import { dbApi } from "../database/db";
import { printOrder } from "../services/printService";
import type { Configuracao, Pedido } from "../types";
import { dateTime, money, orderNumber, paymentLabel } from "../utils/format";

interface Props {
  orders: Pedido[];
  settings: Configuracao;
  onChanged: () => void;
  readOnly?: boolean;
}

export const OrdersPage = ({ orders, settings, onChanged, readOnly = false }: Props) => {
  const [selected, setSelected] = useState<Pedido | undefined>(orders[0]);

  const cancel = async (order: Pedido) => {
    if (readOnly || order.status === "cancelado") return;
    if (!confirm(`Cancelar o pedido ${orderNumber(order.numero)}?`)) return;
    const motivo = prompt("Motivo do cancelamento (opcional):") ?? undefined;
    await dbApi.saveOrder({ ...order, status: "cancelado", canceladoEm: new Date().toISOString(), motivoCancelamento: motivo });
    setSelected({ ...order, status: "cancelado", canceladoEm: new Date().toISOString(), motivoCancelamento: motivo });
    onChanged();
  };

  return (
    <section className="split-page">
      <div className="panel list-panel">
        <h2>Histórico de pedidos</h2>
        {orders.length === 0 && <p className="empty">Nenhum pedido registrado nesta sessão.</p>}
        {orders.map((order) => (
          <button key={order.id} className={`order-list-item ${selected?.id === order.id ? "active" : ""} ${order.status}`} onClick={() => setSelected(order)}>
            <strong>#{orderNumber(order.numero)}</strong>
            <span>{new Date(order.criadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
            <span>{money(order.total)}</span>
            <small>{paymentLabel(order.formaPagamento)} · {order.status}</small>
          </button>
        ))}
      </div>
      <div className="panel detail-panel">
        {!selected ? (
          <p className="empty">Selecione um pedido para visualizar.</p>
        ) : (
          <>
            <div className="detail-head">
              <div><span>Pedido</span><strong>#{orderNumber(selected.numero)}</strong></div>
              <span className={`badge ${selected.status}`}>{selected.status}</span>
            </div>
            <div className="receipt-preview">
              {selected.itens.map((item) => (
                <div key={item.productId}><span>{item.quantidade}x {item.nome}</span><strong>{money(item.subtotal)}</strong></div>
              ))}
            </div>
            <div className="summary-grid">
              <span>Total<strong>{money(selected.total)}</strong></span>
              <span>Pagamento<strong>{paymentLabel(selected.formaPagamento)}</strong></span>
              <span>Data<strong>{dateTime(selected.criadoEm)}</strong></span>
              <span>Operador<strong>{selected.operador}</strong></span>
            </div>
            {selected.motivoCancelamento && <p className="message danger">Motivo: {selected.motivoCancelamento}</p>}
            <div className="toolbar">
              <button onClick={() => printOrder(selected, settings)}><Printer /> Reimprimir</button>
              <button onClick={() => alert(selected.itens.map((item) => `${item.quantidade}x ${item.nome}`).join("\n"))}><Eye /> Visualizar</button>
              <button disabled={readOnly || selected.status === "cancelado"} onClick={() => cancel(selected)}><Ban /> Cancelar</button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
