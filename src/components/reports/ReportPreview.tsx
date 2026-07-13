import type { Configuracao, DashboardSummary, ReportMeta, SessaoCaixa } from "../../types";
import { dateTime, money } from "../../utils/format";

export const ReportPreview = ({ summary, settings, session, meta, onMetaChange }: { summary: DashboardSummary; settings: Configuracao; session?: SessaoCaixa; meta: ReportMeta; onMetaChange: (meta: ReportMeta) => void }) => (
  <section className="panel dashboard-section">
    <h2>Resumo da prestação de contas</h2>
    <div className="form-grid">
      <label>Nome do evento<input value={meta.nomeEvento} onChange={(e) => onMetaChange({ ...meta, nomeEvento: e.target.value })} /></label>
      <label>Responsável<input value={meta.responsavel} onChange={(e) => onMetaChange({ ...meta, responsavel: e.target.value })} /></label>
      <label>Diretor destinatário<input value={meta.diretor} onChange={(e) => onMetaChange({ ...meta, diretor: e.target.value })} /></label>
      <label>Observações finais<input value={meta.observacoes} onChange={(e) => onMetaChange({ ...meta, observacoes: e.target.value })} /></label>
    </div>
    <div className="summary-grid">
      <span>Organização<strong>{settings.nomeEvento}</strong></span>
      <span>Divisão<strong>{settings.subtitulo}</strong></span>
      <span>Operador<strong>{session?.operador ?? "Todos"}</strong></span>
      <span>Abertura<strong>{session ? dateTime(session.abertoEm) : "-"}</strong></span>
      <span>Fechamento<strong>{session?.fechadoEm ? dateTime(session.fechadoEm) : "Caixa aberto"}</strong></span>
      <span>Total vendido<strong>{money(summary.totalVendido)}</strong></span>
      <span>Dinheiro esperado<strong>{money(summary.valorEsperadoDinheiro)}</strong></span>
      <span>Diferença<strong>{money(summary.diferencaCaixa)}</strong></span>
    </div>
  </section>
);
