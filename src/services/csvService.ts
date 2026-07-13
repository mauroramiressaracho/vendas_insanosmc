import type { DashboardSummary, Pedido, Produto, Categoria } from "../types";

const bom = "\uFEFF";
const csv = (rows: Array<Array<string | number>>) => bom + rows.map((row) => row.map((cell) => String(cell).replace(/;/g, ",")).join(";")).join("\n");

export const downloadText = (content: string, filename: string, type = "text/csv;charset=utf-8") => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportSalesCsv = (orders: Pedido[], products: Produto[], categories: Categoria[], filename: string) => {
  const rows: Array<Array<string | number>> = [["pedido", "data", "hora", "operador", "produto", "categoria", "quantidade", "valor unitário", "subtotal", "pagamento", "status"]];
  orders.forEach((order) => {
    order.itens.forEach((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      const category = categories.find((entry) => entry.id === product?.categoriaId);
      const date = new Date(order.criadoEm);
      rows.push([order.numero, date.toLocaleDateString("pt-BR"), date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), order.operador, item.nome, category?.nome ?? "", item.quantidade, item.valorUnitario.toFixed(2), item.subtotal.toFixed(2), order.formaPagamento, order.status]);
    });
  });
  downloadText(csv(rows), filename);
};

export const exportSummaryCsv = (summary: DashboardSummary, filename: string) => {
  const rows: Array<Array<string | number>> = [
    ["indicador", "valor"],
    ["Total vendido", summary.totalVendido.toFixed(2)],
    ["Quantidade de pedidos", summary.quantidadePedidos],
    ["Ticket médio", summary.ticketMedio.toFixed(2)],
    ["Total de itens", summary.totalItens],
    ["Pedidos cancelados", summary.pedidosCancelados],
    ["Valor cancelado", summary.valorCancelado.toFixed(2)],
    ["Valor inicial", summary.valorInicial.toFixed(2)],
    ["Dinheiro esperado", summary.valorEsperadoDinheiro.toFixed(2)],
    ["Valor contado", summary.valorContado.toFixed(2)],
    ["Diferença", summary.diferencaCaixa.toFixed(2)],
  ];
  downloadText(csv(rows), filename);
};
