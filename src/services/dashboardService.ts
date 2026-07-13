import type { Categoria, DashboardFilters, DashboardSummary, FormaPagamento, Pedido, ProductSummary, Produto, ReportMeta, ReportSnapshot, SessaoCaixa } from "../types";

export const defaultFilters = (session?: SessaoCaixa): DashboardFilters => ({
  sessionId: session?.id ?? "all",
  dateStart: "",
  dateEnd: "",
  operador: "todos",
  status: "todos",
  formaPagamento: "todos",
});

export const filterOrders = (orders: Pedido[], filters: DashboardFilters) =>
  orders.filter((order) => {
    const created = new Date(order.criadoEm).getTime();
    const start = filters.dateStart ? new Date(`${filters.dateStart}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
    const end = filters.dateEnd ? new Date(`${filters.dateEnd}T23:59:59`).getTime() : Number.POSITIVE_INFINITY;
    return (
      (filters.sessionId === "all" || order.sessionId === filters.sessionId) &&
      created >= start &&
      created <= end &&
      (filters.operador === "todos" || order.operador === filters.operador) &&
      (filters.status === "todos" || order.status === filters.status) &&
      (filters.formaPagamento === "todos" || order.formaPagamento === filters.formaPagamento)
    );
  });

export const buildDashboardSummary = (
  orders: Pedido[],
  products: Produto[],
  categories: Categoria[],
  session?: SessaoCaixa,
  filters: DashboardFilters = defaultFilters(session),
  valorContado = session?.valorContado ?? 0,
): DashboardSummary => {
  const filtered = filterOrders(orders, filters);
  const paidOrders = filtered.filter((order) => order.status === "pago");
  const canceledOrders = filtered.filter((order) => order.status === "cancelado");
  const totalVendido = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const totalItens = paidOrders.flatMap((order) => order.itens).reduce((sum, item) => sum + item.quantidade, 0);
  const productMap = new Map<string, ProductSummary>();

  paidOrders.flatMap((order) => order.itens).forEach((item) => {
    const product = products.find((entry) => entry.id === item.productId);
    const category = categories.find((entry) => entry.id === product?.categoriaId);
    const current = productMap.get(item.productId) ?? {
      productId: item.productId,
      produto: item.nome,
      categoria: category?.nome ?? "Sem categoria",
      quantidade: 0,
      precoMedio: 0,
      total: 0,
    };
    current.quantidade += item.quantidade;
    current.total += item.subtotal;
    current.precoMedio = current.total / current.quantidade;
    productMap.set(item.productId, current);
  });

  const pagamentos = (["dinheiro", "pix", "cartao"] as FormaPagamento[]).map((formaPagamento) => {
    const paymentOrders = paidOrders.filter((order) => order.formaPagamento === formaPagamento);
    const valor = paymentOrders.reduce((sum, order) => sum + order.total, 0);
    return { formaPagamento, valor, pedidos: paymentOrders.length, percentual: totalVendido ? (valor / totalVendido) * 100 : 0 };
  });

  const hourMap = new Map<string, { valor: number; pedidos: number }>();
  paidOrders.forEach((order) => {
    const hora = `${new Date(order.criadoEm).getHours().toString().padStart(2, "0")}h`;
    const current = hourMap.get(hora) ?? { valor: 0, pedidos: 0 };
    current.valor += order.total;
    current.pedidos += 1;
    hourMap.set(hora, current);
  });

  const vendasDinheiro = pagamentos.find((item) => item.formaPagamento === "dinheiro")?.valor ?? 0;
  const valorInicial = session?.valorInicial ?? 0;
  const valorEsperadoDinheiro = valorInicial + vendasDinheiro;

  return {
    paidOrders,
    canceledOrders,
    grossOrders: filtered,
    totalVendido,
    quantidadePedidos: paidOrders.length,
    ticketMedio: paidOrders.length ? totalVendido / paidOrders.length : 0,
    totalItens,
    pedidosCancelados: canceledOrders.length,
    valorCancelado: canceledOrders.reduce((sum, order) => sum + order.total, 0),
    pagamentos,
    produtos: [...productMap.values()].sort((a, b) => b.total - a.total),
    horas: [...hourMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([hora, values]) => ({ hora, ...values })),
    valorInicial,
    vendasDinheiro,
    valorEsperadoDinheiro,
    valorContado,
    diferencaCaixa: valorContado - valorEsperadoDinheiro,
  };
};

export const buildSnapshot = (
  orders: Pedido[],
  products: Produto[],
  categories: Categoria[],
  session: SessaoCaixa,
  filters: DashboardFilters,
  meta: ReportMeta,
): ReportSnapshot => ({
  createdAt: new Date().toISOString(),
  filters,
  meta,
  summary: buildDashboardSummary(orders, products, categories, session, filters, meta.valorContado),
});
