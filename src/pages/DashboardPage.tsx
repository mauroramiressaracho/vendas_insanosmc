import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileText, Share2 } from "lucide-react";
import type { Chart as ChartType } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { CashReconciliation } from "../components/dashboard/CashReconciliation";
import { OrderSummaryTable } from "../components/dashboard/OrderSummaryTable";
import { PaymentChart } from "../components/dashboard/PaymentChart";
import { ProductRankingChart } from "../components/dashboard/ProductRankingChart";
import { ProductSalesTable } from "../components/dashboard/ProductSalesTable";
import { SalesByHourChart } from "../components/dashboard/SalesByHourChart";
import { SummaryCards } from "../components/dashboard/SummaryCards";
import { ReportPreview } from "../components/reports/ReportPreview";
import { dbApi } from "../database/db";
import { buildDashboardSummary, defaultFilters } from "../services/dashboardService";
import { exportSalesCsv, exportSummaryCsv } from "../services/csvService";
import { createReportPdf, reportFileName } from "../services/pdfService";
import { sharePdf } from "../services/shareService";
import type { Categoria, Configuracao, DashboardFilters, FormaPagamento, Pedido, Produto, ReportMeta, SessaoCaixa } from "../types";
import { money, paymentLabel } from "../utils/format";
import { chartValueLabels } from "../utils/chartValueLabels";

interface Props {
  orders: Pedido[];
  products: Produto[];
  categories: Categoria[];
  sessions: SessaoCaixa[];
  currentSession?: SessaoCaixa;
  settings: Configuracao;
  onChanged: () => void;
}

export const DashboardPage = ({ orders, products, categories, sessions, currentSession, settings, onChanged }: Props) => {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters(currentSession));
  const [valorContado, setValorContado] = useState(currentSession?.valorContado ?? 0);
  const [meta, setMeta] = useState<ReportMeta>({ nomeEvento: settings.nomeEvento, responsavel: currentSession?.operador ?? "", diretor: "", observacoes: "", valorContado: 0 });
  const paymentRef = useRef<ChartType<"doughnut"> | null>(null);
  const rankingRef = useRef<ChartType<"bar"> | null>(null);

  const selectedSession = sessions.find((session) => session.id === filters.sessionId) ?? (filters.sessionId === currentSession?.id ? currentSession : undefined);
  const summary = useMemo(() => buildDashboardSummary(orders, products, categories, selectedSession, filters, valorContado), [orders, products, categories, selectedSession, filters, valorContado]);

  useEffect(() => {
    setMeta((current) => ({ ...current, valorContado }));
  }, [valorContado]);

  const setShortcut = (shortcut: "current" | "today" | "week" | "all") => {
    const today = new Date();
    const iso = (date: Date) => date.toISOString().slice(0, 10);
    if (shortcut === "current") setFilters(defaultFilters(currentSession));
    if (shortcut === "today") setFilters({ ...filters, sessionId: "all", dateStart: iso(today), dateEnd: iso(today) });
    if (shortcut === "week") {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      setFilters({ ...filters, sessionId: "all", dateStart: iso(start), dateEnd: iso(today) });
    }
    if (shortcut === "all") setFilters({ ...filters, sessionId: "all", dateStart: "", dateEnd: "" });
  };

  const buildPdf = () => {
    const pdf = createReportPdf(summary, settings, selectedSession, meta, {
      payment: paymentRef.current?.toBase64Image(),
      ranking: rankingRef.current?.toBase64Image(),
    });
    return pdf;
  };

  const filename = reportFileName();
  const dateFile = new Date().toISOString().slice(0, 10);

  const saveCashCount = async () => {
    if (!selectedSession) return;
    await dbApi.saveSession({ ...selectedSession, valorContado, observacoesFechamento: meta.observacoes });
    onChanged();
    alert("Valor contado salvo na sessão.");
  };

  return (
    <section className="dashboard-page">
      <div className="panel dashboard-filters">
        <h2>Dashboard de vendas</h2>
        <div className="shortcut-row">
          <button onClick={() => setShortcut("current")}>Caixa atual</button>
          <button onClick={() => setShortcut("today")}>Hoje</button>
          <button onClick={() => setShortcut("week")}>Últimos 7 dias</button>
          <button onClick={() => setShortcut("all")}>Todos</button>
        </div>
        <div className="form-grid">
          <label>Sessão<select value={filters.sessionId} onChange={(e) => setFilters({ ...filters, sessionId: e.target.value })}><option value="all">Todas</option>{sessions.map((session) => <option key={session.id} value={session.id}>{session.operador} · {new Date(session.abertoEm).toLocaleDateString("pt-BR")} · {session.status}</option>)}</select></label>
          <label>Data inicial<input type="date" value={filters.dateStart} onChange={(e) => setFilters({ ...filters, dateStart: e.target.value })} /></label>
          <label>Data final<input type="date" value={filters.dateEnd} onChange={(e) => setFilters({ ...filters, dateEnd: e.target.value })} /></label>
          <label>Operador<select value={filters.operador} onChange={(e) => setFilters({ ...filters, operador: e.target.value })}><option value="todos">Todos</option>{[...new Set(orders.map((order) => order.operador))].map((operator) => <option key={operator} value={operator}>{operator}</option>)}</select></label>
          <label>Status<select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value as DashboardFilters["status"] })}><option value="todos">Todos</option><option value="pago">Pagos</option><option value="cancelado">Cancelados</option></select></label>
          <label>Pagamento<select value={filters.formaPagamento} onChange={(e) => setFilters({ ...filters, formaPagamento: e.target.value as "todos" | FormaPagamento })}><option value="todos">Todos</option><option value="dinheiro">Dinheiro</option><option value="pix">Pix</option><option value="cartao">Cartão</option></select></label>
        </div>
      </div>

      <SummaryCards summary={summary} />

      <div className="payment-summary">
        {summary.pagamentos.map((payment) => (
          <article className="metric-card" key={payment.formaPagamento}>
            <span>{paymentLabel(payment.formaPagamento)}</span>
            <strong>{money(payment.valor)}</strong>
            <small>{payment.pedidos} pedidos · {payment.percentual.toFixed(1)}% das vendas</small>
          </article>
        ))}
        <article className="metric-card"><span>Total geral</span><strong>{money(summary.totalVendido)}</strong><small>{summary.quantidadePedidos} pedidos</small></article>
      </div>

      <CashReconciliation summary={summary} counted={valorContado} onCountedChange={setValorContado} />

      <div className="chart-grid">
        <PaymentChart summary={summary} />
        <ProductRankingChart summary={summary} />
      </div>
      <HiddenChartRefs summary={summary} paymentRef={paymentRef} rankingRef={rankingRef} />
      <SalesByHourChart summary={summary} />
      <ProductSalesTable summary={summary} />
      <OrderSummaryTable summary={summary} />
      <ReportPreview summary={{ ...summary, valorContado, diferencaCaixa: valorContado - summary.valorEsperadoDinheiro }} settings={settings} session={selectedSession} meta={meta} onMetaChange={setMeta} />

      <div className="panel report-actions">
        <button className="primary-action small" onClick={() => window.open(URL.createObjectURL(buildPdf().output("blob")), "_blank")}><FileText /> Visualizar PDF</button>
        <button onClick={() => buildPdf().save(filename)}><Download /> Baixar PDF</button>
        <button onClick={() => sharePdf(buildPdf().output("blob"), filename)}><Share2 /> Compartilhar PDF</button>
        <button onClick={() => exportSalesCsv(summary.grossOrders, products, categories, `vendas-insanos-${dateFile}.csv`)}>Exportar vendas CSV</button>
        <button onClick={() => exportSummaryCsv(summary, `resumo-insanos-${dateFile}.csv`)}>Exportar resumo CSV</button>
        <button onClick={() => dbApi.exportAll().then((payload) => {
          const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `backup-insanos-${dateFile}.json`;
          link.click();
          URL.revokeObjectURL(url);
        })}>Exportar backup JSON</button>
        <button onClick={saveCashCount}>Salvar conferência</button>
      </div>
    </section>
  );
};

const HiddenChartRefs = ({ summary, paymentRef, rankingRef }: { summary: ReturnType<typeof buildDashboardSummary>; paymentRef: React.RefObject<ChartType<"doughnut"> | null>; rankingRef: React.RefObject<ChartType<"bar"> | null> }) => {
  const top = summary.produtos.slice(0, 10).sort((a, b) => a.quantidade - b.quantidade);
  return (
    <div className="hidden-charts">
      <Doughnut
        ref={paymentRef}
        plugins={[chartValueLabels]}
        data={{ labels: summary.pagamentos.map((item) => paymentLabel(item.formaPagamento)), datasets: [{ data: summary.pagamentos.map((item) => item.valor), backgroundColor: ["#248c2c", "#00a0a4", "#176fc2"] }] }}
        options={{
          animation: false,
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            valueLabels: {
              formatter: (value: number) => `${money(value)}\n${summary.totalVendido ? ((value / summary.totalVendido) * 100).toFixed(1) : "0,0"}%`,
              color: "#111111",
              strokeColor: "#ffffff",
              backgroundColor: "rgba(255,255,255,.9)",
              font: "800 13px Arial, sans-serif",
            },
          },
        }}
      />
      <Bar
        ref={rankingRef}
        plugins={[chartValueLabels]}
        data={{ labels: top.map((item) => item.produto), datasets: [{ label: "Quantidade", data: top.map((item) => item.quantidade), backgroundColor: "#d71920" }] }}
        options={{
          indexAxis: "y",
          animation: false,
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true },
            valueLabels: {
              formatter: (value: number) => `${value} un.`,
              color: "#111111",
              strokeColor: "#ffffff",
              backgroundColor: "rgba(255,255,255,.9)",
              font: "800 13px Arial, sans-serif",
            },
          },
        }}
      />
    </div>
  );
};
