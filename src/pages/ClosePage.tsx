import { Download, LockKeyhole } from "lucide-react";
import { dbApi } from "../database/db";
import { buildSnapshot, defaultFilters } from "../services/dashboardService";
import type { Categoria, Pedido, Produto, SessaoCaixa } from "../types";
import { money } from "../utils/format";

interface Props {
  session: SessaoCaixa;
  orders: Pedido[];
  products: Produto[];
  categories: Categoria[];
  onClosed: () => void;
}

export const ClosePage = ({ session, orders, products, categories, onClosed }: Props) => {
  const paid = orders.filter((order) => order.status === "pago");
  const canceled = orders.filter((order) => order.status === "cancelado");
  const byPayment = (payment: string) => paid.filter((order) => order.formaPagamento === payment).reduce((sum, order) => sum + order.total, 0);
  const total = paid.reduce((sum, order) => sum + order.total, 0);
  const dinheiro = byPayment("dinheiro");
  const pix = byPayment("pix");
  const cartao = byPayment("cartao");

  const productTotals = products
    .map((product) => {
      const quantity = paid.flatMap((order) => order.itens).filter((item) => item.productId === product.id).reduce((sum, item) => sum + item.quantidade, 0);
      const value = paid.flatMap((order) => order.itens).filter((item) => item.productId === product.id).reduce((sum, item) => sum + item.subtotal, 0);
      return { product, quantity, value };
    })
    .filter((item) => item.quantity > 0);

  const close = async () => {
    if (!confirm("Fechar o caixa? Novas vendas só serão liberadas após uma nova abertura.")) return;
    const valorContado = session.valorContado ?? session.valorInicial + dinheiro;
    const meta = {
      nomeEvento: "Evento Insanos MC",
      responsavel: session.operador,
      diretor: "",
      observacoes: session.observacoesFechamento ?? "",
      valorContado,
    };
    await dbApi.saveSession({
      ...session,
      status: "fechado",
      fechadoEm: new Date().toISOString(),
      valorContado,
      reportSnapshot: buildSnapshot(orders, products, categories, session, defaultFilters(session), meta),
    });
    onClosed();
  };

  const exportClose = () => {
    const rows = [
      ["Resumo do fechamento"],
      ["Operador", session.operador],
      ["Pedidos pagos", paid.length],
      ["Pedidos cancelados", canceled.length],
      ["Total vendido", total],
      ["Dinheiro", dinheiro],
      ["Pix", pix],
      ["Cartão", cartao],
      ["Valor inicial", session.valorInicial],
      ["Dinheiro esperado", session.valorInicial + dinheiro],
      [],
      ["Produto", "Quantidade", "Total"],
      ...productTotals.map((item) => [item.product.nome, item.quantity, item.value]),
    ];
    const csv = rows.map((row) => row.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fechamento-caixa.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="close-page panel">
      <h2>Fechamento do caixa</h2>
      <div className="summary-grid big">
        <span>Pedidos concluídos<strong>{paid.length}</strong></span>
        <span>Pedidos cancelados<strong>{canceled.length}</strong></span>
        <span>Total vendido<strong>{money(total)}</strong></span>
        <span>Dinheiro<strong>{money(dinheiro)}</strong></span>
        <span>Pix<strong>{money(pix)}</strong></span>
        <span>Cartão<strong>{money(cartao)}</strong></span>
        <span>Valor inicial<strong>{money(session.valorInicial)}</strong></span>
        <span>Dinheiro esperado<strong>{money(session.valorInicial + dinheiro)}</strong></span>
      </div>
      <h3>Vendas por produto</h3>
      <div className="product-total-list">
        {productTotals.map((item) => (
          <div key={item.product.id}><span>{item.product.nome}</span><strong>{item.quantity} un. · {money(item.value)}</strong></div>
        ))}
      </div>
      <div className="toolbar">
        <button onClick={exportClose}><Download /> Exportar fechamento</button>
        <button className="danger-button" onClick={close}><LockKeyhole /> FECHAR CAIXA</button>
      </div>
    </section>
  );
};
