export const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export const dateTime = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));

export const timeOnly = (date = new Date()) =>
  new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date);

export const orderNumber = (number: number) => String(number).padStart(3, "0");

export const uid = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

export const paymentLabel = (payment: string) =>
  ({ dinheiro: "Dinheiro", pix: "Pix", cartao: "Cartão" }[payment] ?? payment);
