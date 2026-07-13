import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Configuracao, DashboardSummary, ReportMeta, SessaoCaixa } from "../types";
import { dateTime, money, orderNumber, paymentLabel } from "../utils/format";

export interface PdfChartImages {
  payment?: string;
  ranking?: string;
}

export const reportFileName = () => `prestacao-contas-insanos-${new Date().toISOString().slice(0, 10)}.pdf`;

export const createReportPdf = (
  summary: DashboardSummary,
  settings: Configuracao,
  session: SessaoCaixa | undefined,
  meta: ReportMeta,
  charts: PdfChartImages = {},
) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(settings.nomeEvento, width / 2, y, { align: "center" });
  y += 7;
  doc.setFontSize(12);
  doc.text(settings.subtitulo, width / 2, y, { align: "center" });
  y += 12;
  doc.setFontSize(14);
  doc.text("PRESTAÇÃO DE CONTAS DO EVENTO", width / 2, y, { align: "center" });
  y += 12;

  autoTable(doc, {
    startY: y,
    head: [["Identificação", "Informação"]],
    body: [
      ["Nome do evento", meta.nomeEvento || settings.nomeEvento],
      ["Data", new Date().toLocaleDateString("pt-BR")],
      ["Responsável", meta.responsavel],
      ["Diretor destinatário", meta.diretor],
      ["Operador", session?.operador ?? ""],
      ["Abertura do caixa", session ? dateTime(session.abertoEm) : ""],
      ["Fechamento do caixa", session?.fechadoEm ? dateTime(session.fechadoEm) : "Caixa aberto"],
      ["Gerado em", dateTime(new Date().toISOString())],
    ],
    margin: { left: margin, right: margin },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: y,
    head: [["Resumo financeiro", "Valor"]],
    body: [
      ["TOTAL VENDIDO", money(summary.totalVendido)],
      ["Dinheiro", money(summary.vendasDinheiro)],
      ["Pix", money(summary.pagamentos.find((p) => p.formaPagamento === "pix")?.valor ?? 0)],
      ["Cartão", money(summary.pagamentos.find((p) => p.formaPagamento === "cartao")?.valor ?? 0)],
      ["Ticket médio", money(summary.ticketMedio)],
      ["Pedidos pagos", summary.quantidadePedidos],
      ["Pedidos cancelados", summary.pedidosCancelados],
      ["Valor cancelado", money(summary.valorCancelado)],
    ],
    margin: { left: margin, right: margin },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: y,
    head: [["Conferência de dinheiro", "Valor"]],
    body: [
      ["Valor inicial", money(summary.valorInicial)],
      ["Vendas em dinheiro", money(summary.vendasDinheiro)],
      ["Valor esperado", money(summary.valorEsperadoDinheiro)],
      ["Valor contado", money(summary.valorContado)],
      ["Diferença", money(summary.diferencaCaixa)],
    ],
    margin: { left: margin, right: margin },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  if (charts.payment || charts.ranking) {
    if (y > 210) {
      doc.addPage();
      y = 18;
    }
    doc.setFont("helvetica", "bold");
    doc.text("Gráficos", margin, y);
    y += 6;
    if (charts.payment) doc.addImage(charts.payment, "PNG", margin, y, 82, 62);
    if (charts.ranking) doc.addImage(charts.ranking, "PNG", 108, y, 82, 62);
    y += 70;
  }

  autoTable(doc, {
    startY: y,
    head: [["Produto", "Quantidade", "Preço médio", "Total vendido"]],
    body: [
      ...summary.produtos.map((item) => [item.produto, item.quantidade, money(item.precoMedio), money(item.total)]),
      ["TOTAL GERAL", summary.totalItens, "", money(summary.totalVendido)],
    ],
    margin: { left: margin, right: margin },
  });

  autoTable(doc, {
    startY: (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8,
    head: [["Pedido", "Horário", "Pagamento", "Itens", "Valor", "Status"]],
    body: summary.grossOrders.map((order) => [
      orderNumber(order.numero),
      new Date(order.criadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      paymentLabel(order.formaPagamento),
      order.itens.reduce((sum, item) => sum + item.quantidade, 0),
      money(order.total),
      order.status,
    ]),
    margin: { left: margin, right: margin },
  });

  autoTable(doc, {
    startY: (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8,
    head: [["Pedidos cancelados", "Horário", "Valor", "Motivo", "Cancelado em"]],
    body: summary.canceledOrders.length
      ? summary.canceledOrders.map((order) => [orderNumber(order.numero), dateTime(order.criadoEm), money(order.total), order.motivoCancelamento ?? "", order.canceladoEm ? dateTime(order.canceladoEm) : ""])
      : [["Nenhum pedido cancelado.", "", "", "", ""]],
    margin: { left: margin, right: margin },
  });

  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.text("Observações", margin, finalY);
  doc.setFont("helvetica", "normal");
  doc.text(meta.observacoes || "Sem observações.", margin, finalY + 6, { maxWidth: width - margin * 2 });
  doc.text("Responsável pela prestação:", margin, finalY + 28);
  doc.line(margin, finalY + 42, 92, finalY + 42);
  doc.text("Diretor responsável:", 112, finalY + 28);
  doc.line(112, finalY + 42, 190, finalY + 42);

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFontSize(9);
    doc.text(`Insanos MC Campo Grande MS - Divisão Norte`, margin, 287);
    doc.text(`Página ${page} de ${pageCount}`, width - margin, 287, { align: "right" });
  }

  return doc;
};
