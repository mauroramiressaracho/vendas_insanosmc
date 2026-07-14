import type { Categoria, Configuracao, Produto } from "../types";
import { uid } from "../utils/format";

export const initialCategories: Categoria[] = [
  { id: "cat-espetinhos", nome: "Espetinhos", ordem: 1, ativo: true, icone: "skewer" },
  { id: "cat-bebidas", nome: "Bebidas", ordem: 2, ativo: true, icone: "cup" },
  { id: "cat-combos", nome: "Combos", ordem: 3, ativo: true, icone: "users" },
  { id: "cat-outros", nome: "Outros", ordem: 4, ativo: true, icone: "more" },
];

const now = new Date().toISOString();

export const initialProducts: Produto[] = [
  { id: "prod-carne", nome: "Espetinho de Carne", preco: 10, categoriaId: "cat-espetinhos", icone: "🍢", ativo: true, ordem: 1, criadoEm: now },
  { id: "prod-linguica", nome: "Espetinho de Linguiça", preco: 10, categoriaId: "cat-espetinhos", icone: "🍢", ativo: true, ordem: 2, criadoEm: now },
  { id: "prod-frango", nome: "Espetinho de Frango", preco: 10, categoriaId: "cat-espetinhos", icone: "🍗", ativo: false, ordem: 3, criadoEm: now },
  { id: "prod-kafta", nome: "Kafta", preco: 12, categoriaId: "cat-espetinhos", icone: "🍢", ativo: false, ordem: 4, criadoEm: now },
  { id: "prod-agua", nome: "Água Mineral", preco: 5, categoriaId: "cat-bebidas", icone: "💧", ativo: false, ordem: 1, criadoEm: now },
  { id: "prod-refri", nome: "Refrigerante Lata", preco: 6, categoriaId: "cat-bebidas", icone: "🥤", ativo: false, ordem: 2, criadoEm: now },
  { id: "prod-cerveja", nome: "Cerveja Lata", preco: 8, categoriaId: "cat-bebidas", icone: "🍺", ativo: false, ordem: 3, criadoEm: now },
  { id: "prod-longneck", nome: "Cerveja Long Neck", preco: 10, categoriaId: "cat-bebidas", icone: "🍻", ativo: false, ordem: 4, criadoEm: now },
  { id: "prod-combo1", nome: "Combo 1", descricao: "2 espetinhos + refrigerante", preco: 25, categoriaId: "cat-combos", icone: "🔥", ativo: false, ordem: 1, criadoEm: now },
  { id: "prod-combo2", nome: "Combo 2", descricao: "Linguiça + refrigerante", preco: 20, categoriaId: "cat-combos", icone: "⚡", ativo: false, ordem: 2, criadoEm: now },
  { id: "prod-combo3", nome: "Combo 3", descricao: "Kafta + refrigerante", preco: 22, categoriaId: "cat-combos", icone: "🏁", ativo: false, ordem: 3, criadoEm: now },
  { id: "prod-batata", nome: "Batata Frita", preco: 8, categoriaId: "cat-outros", icone: "🍟", ativo: false, ordem: 1, criadoEm: now },
  { id: "prod-pao", nome: "Pão de Queijo", preco: 10, categoriaId: "cat-outros", icone: "🧀", ativo: false, ordem: 2, criadoEm: now },
  { id: "prod-pastel", nome: "Pastel", preco: 8, categoriaId: "cat-outros", icone: "🥟", ativo: false, ordem: 3, criadoEm: now },
  { id: "prod-hotdog", nome: "Cachorro-Quente", preco: 9, categoriaId: "cat-outros", icone: "🌭", ativo: false, ordem: 4, criadoEm: now },
].map((product) => ({ ...product, id: product.id || uid("prod") }));

export const defaultSettings: Configuracao = {
  id: "default",
  nomeEvento: "INSANOS MC CAMPO GRANDE MS",
  subtitulo: "DIVISÃO NORTE",
  mensagemComanda: "OBRIGADO!",
  operadorPadrao: "",
  impressaoAtivada: true,
  larguraMm: 58,
  vias: 1,
  mostrarValores: true,
  mostrarTotal: true,
  mostrarPagamento: true,
  rodape: "OBRIGADO!",
};
