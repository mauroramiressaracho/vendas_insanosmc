export type FormaPagamento = "dinheiro" | "pix" | "cartao";
export type OrderStatus = "pago" | "cancelado";

export interface Categoria {
  id: string;
  nome: string;
  ordem: number;
  ativo: boolean;
  icone: string;
}

export interface Produto {
  id: string;
  nome: string;
  preco: number;
  categoriaId: string;
  descricao?: string;
  icone: string;
  imagem?: string;
  ativo: boolean;
  ordem: number;
  criadoEm: string;
}

export interface ItemPedido {
  productId: string;
  nome: string;
  quantidade: number;
  valorUnitario: number;
  subtotal: number;
}

export interface Pedido {
  id: string;
  sessionId: string;
  numero: number;
  itens: ItemPedido[];
  total: number;
  formaPagamento: FormaPagamento;
  status: OrderStatus;
  operador: string;
  criadoEm: string;
  canceladoEm?: string;
  motivoCancelamento?: string;
}

export interface SessaoCaixa {
  id: string;
  operador: string;
  valorInicial: number;
  observacao?: string;
  abertoEm: string;
  fechadoEm?: string;
  status: "aberto" | "fechado";
  proximoPedido: number;
  valorContado?: number;
  observacoesFechamento?: string;
  reportSnapshot?: ReportSnapshot;
}

export interface Configuracao {
  id: "default";
  nomeEvento: string;
  subtitulo: string;
  mensagemComanda: string;
  operadorPadrao: string;
  impressaoAtivada: boolean;
  larguraMm: number;
  vias: 1 | 2;
  mostrarValores: boolean;
  mostrarTotal: boolean;
  mostrarPagamento: boolean;
  rodape: string;
}

export interface RegistroCancelamento {
  pedidoId: string;
  data: string;
  motivo?: string;
}

export interface CartItem extends ItemPedido {}

export interface BackupPayload {
  exportedAt: string;
  products: Produto[];
  categories: Categoria[];
  orders: Pedido[];
  cashSessions: SessaoCaixa[];
  settings: Configuracao;
}

export interface DashboardFilters {
  sessionId: string;
  dateStart: string;
  dateEnd: string;
  operador: string;
  status: "todos" | OrderStatus;
  formaPagamento: "todos" | FormaPagamento;
}

export interface ProductSummary {
  productId: string;
  produto: string;
  categoria: string;
  quantidade: number;
  precoMedio: number;
  total: number;
}

export interface PaymentSummary {
  formaPagamento: FormaPagamento;
  valor: number;
  pedidos: number;
  percentual: number;
}

export interface HourSummary {
  hora: string;
  valor: number;
  pedidos: number;
}

export interface DashboardSummary {
  paidOrders: Pedido[];
  canceledOrders: Pedido[];
  grossOrders: Pedido[];
  totalVendido: number;
  quantidadePedidos: number;
  ticketMedio: number;
  totalItens: number;
  pedidosCancelados: number;
  valorCancelado: number;
  pagamentos: PaymentSummary[];
  produtos: ProductSummary[];
  horas: HourSummary[];
  valorInicial: number;
  vendasDinheiro: number;
  valorEsperadoDinheiro: number;
  valorContado: number;
  diferencaCaixa: number;
}

export interface ReportMeta {
  nomeEvento: string;
  responsavel: string;
  diretor: string;
  observacoes: string;
  valorContado: number;
}

export interface ReportSnapshot {
  createdAt: string;
  filters: DashboardFilters;
  meta: ReportMeta;
  summary: DashboardSummary;
}
