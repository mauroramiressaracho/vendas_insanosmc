import { useState } from "react";
import { Store } from "lucide-react";
import { dbApi } from "../database/db";
import type { SessaoCaixa } from "../types";
import { uid } from "../utils/format";

interface Props {
  defaultOperator: string;
  onOpened: (session: SessaoCaixa) => void | Promise<void>;
}

export const OpenCashPage = ({ defaultOperator, onOpened }: Props) => {
  const [operador, setOperador] = useState(defaultOperator);
  const [valorInicial, setValorInicial] = useState("0");
  const [observacao, setObservacao] = useState("");
  const [error, setError] = useState("");

  const open = async () => {
    if (!operador.trim()) {
      setError("Informe o nome do operador.");
      return;
    }
    const session: SessaoCaixa = {
      id: uid("session"),
      operador: operador.trim(),
      valorInicial: Number(valorInicial || 0),
      observacao,
      abertoEm: new Date().toISOString(),
      status: "aberto",
      proximoPedido: 1,
    };
    await dbApi.saveSession(session);
    await onOpened(session);
  };

  return (
    <main className="open-screen">
      <section className="open-card">
        <div className="brand-mark large">MC</div>
        <h1>CAIXA DE VENDAS</h1>
        <strong>INSANOS MC CAMPO GRANDE MS</strong>
        <span>DIVISÃO NORTE</span>
        <label>Operador<input required autoFocus placeholder="Digite o nome do operador" value={operador} onChange={(event) => setOperador(event.target.value)} /></label>
        <label>Valor inicial em dinheiro<input type="number" min="0" step="0.01" value={valorInicial} onChange={(event) => setValorInicial(event.target.value)} /></label>
        <label>Observação<input value={observacao} onChange={(event) => setObservacao(event.target.value)} /></label>
        {error && <p className="message danger">{error}</p>}
        <button className="primary-action" onClick={open}><Store /> ABRIR CAIXA</button>
      </section>
    </main>
  );
};
