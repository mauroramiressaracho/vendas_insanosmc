import type { Configuracao, Pedido } from "../types";
import { dateTime, money, orderNumber, paymentLabel } from "../utils/format";

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const buildReceiptCopy = (order: Pedido, settings: Configuracao, copyNumber: number) => {
  const showValues = settings.mostrarValores;
  const rows = order.itens
    .map(
      (item) => `
        <tr>
          <td>${item.quantidade}x ${escapeHtml(item.nome).toUpperCase()}</td>
          ${showValues ? `<td class="value">${escapeHtml(money(item.subtotal))}</td>` : ""}
        </tr>`,
    )
    .join("");

  return `
    <section class="receipt ${copyNumber > 1 ? "receipt-copy" : ""}">
      <h1>${escapeHtml(settings.nomeEvento)}</h1>
      <h2>${escapeHtml(settings.subtitulo)}</h2>
      ${settings.vias > 1 ? `<p class="copy-label">VIA ${copyNumber}</p>` : ""}
      <p>PEDIDO</p>
      <p class="number">${escapeHtml(orderNumber(order.numero))}</p>
      <div class="line"></div>
      <table>
        <tbody>${rows}</tbody>
      </table>
      <div class="line"></div>
      ${
        settings.mostrarPagamento
          ? `<p>PAGAMENTO: ${escapeHtml(paymentLabel(order.formaPagamento)).toUpperCase()}</p>`
          : ""
      }
      <p>STATUS: ${escapeHtml(order.status).toUpperCase()}</p>
      ${settings.mostrarTotal ? `<p class="total">TOTAL: ${escapeHtml(money(order.total))}</p>` : ""}
      <p>${escapeHtml(dateTime(order.criadoEm))}</p>
      <p class="footer">${escapeHtml(settings.rodape || settings.mensagemComanda)}</p>
    </section>`;
};

export const buildReceiptHtml = (order: Pedido, settings: Configuracao) => {
  const copies = Math.max(1, Number(settings.vias) || 1);
  const receiptCopies = Array.from({ length: copies }, (_, index) =>
    buildReceiptCopy(order, settings, index + 1),
  ).join("");

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Pedido ${escapeHtml(orderNumber(order.numero))}</title>
  <style>
    @page { size: ${settings.larguraMm}mm auto; margin: 2mm; }
    * { box-sizing: border-box; }
    html, body {
      width: ${Math.max(48, settings.larguraMm - 4)}mm;
      margin: 0;
      padding: 0;
      background: #fff;
      color: #000;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
    }
    body { padding: 0; }
    h1, h2, p { margin: 0; text-align: center; }
    h1 { font-size: 14px; font-weight: 800; }
    h2 { font-size: 12px; margin-top: 2px; }
    .copy-label { margin-top: 5px; font-weight: 700; }
    .number { font-size: 32px; font-weight: 900; margin: 8px 0; }
    .line { border-top: 1px dashed #000; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    td { padding: 3px 0; vertical-align: top; overflow-wrap: anywhere; }
    td.value { width: 31%; text-align: right; white-space: nowrap; padding-left: 4px; }
    .total { font-size: 17px; font-weight: 900; margin-top: 4px; }
    .footer { margin-top: 10px; font-weight: 800; }
    .receipt-copy { border-top: 2px dashed #000; margin-top: 14px; padding-top: 14px; }
    .print-actions {
      position: sticky;
      top: 0;
      display: flex;
      gap: 8px;
      justify-content: center;
      padding: 10px;
      margin-bottom: 12px;
      background: #fff;
      border-bottom: 1px solid #ccc;
    }
    .print-actions button {
      min-height: 44px;
      padding: 8px 14px;
      border: 0;
      border-radius: 6px;
      font-size: 15px;
      font-weight: 700;
      color: #fff;
      background: #1f7a1f;
    }
    .print-note {
      margin: 0 0 10px;
      padding: 0 8px;
      text-align: center;
      font-size: 12px;
    }
    @media print {
      .no-print { display: none !important; }
      html, body { width: ${Math.max(48, settings.larguraMm - 4)}mm; }
    }
  </style>
</head>
<body>
  <div class="print-actions no-print">
    <button type="button" onclick="window.print()">IMPRIMIR AGORA</button>
  </div>
  <p class="print-note no-print">Aguarde a janela de impressão. Se ela não abrir automaticamente, toque em IMPRIMIR AGORA.</p>
  ${receiptCopies}
  <script>
    (function () {
      var started = false;
      function startPrint() {
        if (started) return;
        started = true;
        setTimeout(function () {
          window.focus();
          window.print();
        }, 1200);
      }
      if (document.readyState === "complete") {
        startPrint();
      } else {
        window.addEventListener("load", startPrint, { once: true });
      }
    })();
  </script>
</body>
</html>`;
};

export const printOrder = (order: Pedido, settings: Configuracao) => {
  if (!settings.impressaoAtivada) return;

  const printWindow = window.open("", "_blank", "width=420,height=760");
  if (!printWindow) {
    throw new Error("O navegador bloqueou a janela de impressão.");
  }

  printWindow.document.open();
  printWindow.document.write(buildReceiptHtml(order, settings));
  printWindow.document.close();
};
