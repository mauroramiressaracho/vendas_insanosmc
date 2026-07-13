import type { Configuracao, Pedido } from "../types";
import { dateTime, money, orderNumber, paymentLabel } from "../utils/format";

export const buildReceiptHtml = (order: Pedido, settings: Configuracao) => {
  const values = settings.mostrarValores;
  const lines = order.itens
    .map(
      (item) =>
        `<div class="row"><span>${item.quantidade}x ${item.nome.toUpperCase()}</span>${values ? `<strong>${money(item.subtotal)}</strong>` : ""}</div>`,
    )
    .join("");

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Pedido ${orderNumber(order.numero)}</title>
  <style>
    @page { size: ${settings.larguraMm}mm auto; margin: 3mm; }
    * { box-sizing: border-box; }
    body { width: ${settings.larguraMm - 6}mm; margin: 0; color: #000; font-family: Arial, sans-serif; font-size: 12px; }
    h1, h2, p { margin: 0; text-align: center; }
    h1 { font-size: 13px; font-weight: 800; }
    h2 { font-size: 11px; margin-top: 2px; }
    .number { font-size: 32px; font-weight: 900; margin: 8px 0; }
    .line { border-top: 1px dashed #000; margin: 8px 0; }
    .row { display: flex; justify-content: space-between; gap: 6px; margin: 5px 0; }
    .row span { flex: 1; }
    .total { font-size: 17px; font-weight: 900; }
    .footer { margin-top: 10px; font-weight: 800; }
  </style>
</head>
<body>
  <h1>${settings.nomeEvento}</h1>
  <h2>${settings.subtitulo}</h2>
  <p>PEDIDO</p>
  <p class="number">${orderNumber(order.numero)}</p>
  <div class="line"></div>
  ${lines}
  <div class="line"></div>
  ${settings.mostrarPagamento ? `<p>PAGAMENTO: ${paymentLabel(order.formaPagamento).toUpperCase()}</p>` : ""}
  <p>STATUS: ${order.status.toUpperCase()}</p>
  ${settings.mostrarTotal ? `<p class="total">TOTAL: ${money(order.total)}</p>` : ""}
  <p>${dateTime(order.criadoEm)}</p>
  <p class="footer">${settings.rodape || settings.mensagemComanda}</p>
  <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); };</script>
</body>
</html>`;
};

export const printOrder = (order: Pedido, settings: Configuracao) => {
  if (!settings.impressaoAtivada) return;
  for (let i = 0; i < settings.vias; i += 1) {
    const win = window.open("", "_blank", "width=380,height=700");
    if (!win) throw new Error("O navegador bloqueou a janela de impressão.");
    win.document.write(buildReceiptHtml(order, settings));
    win.document.close();
  }
};
