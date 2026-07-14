import { useMemo, useState, type ElementType } from "react";
import { Beef, Beer, CreditCard, DollarSign, Grid2X2, Minus, Plus, Search, ShoppingCart, Trash2, Users, WalletCards, X } from "lucide-react";
import { CartDrawer } from "../components/cart/CartDrawer";
import { MobileCartBar } from "../components/cart/MobileCartBar";
import { dbApi } from "../database/db";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { useOrientation } from "../hooks/useOrientation";
import { printOrder } from "../services/printService";
import type { CartItem, Categoria, Configuracao, FormaPagamento, Pedido, Produto, SessaoCaixa } from "../types";
import { money, orderNumber, uid } from "../utils/format";

interface Props {
  products: Produto[];
  categories: Categoria[];
  session: SessaoCaixa;
  settings: Configuracao;
  onChanged: () => void;
}

const categoryIcons: Record<string, ElementType> = {
  skewer: Beef,
  cup: Beer,
  users: Users,
  more: Grid2X2,
};

type MobileCheckoutStep = "cart" | "payment";

export const SalesPage = ({ products, categories, session, settings, onChanged }: Props) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState<FormaPagamento | undefined>();
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileCheckoutStep, setMobileCheckoutStep] = useState<MobileCheckoutStep>("cart");
  const { isMobile, isTablet } = useBreakpoint();
  const orientation = useOrientation();
  const compactCart = isMobile || (isTablet && orientation === "portrait");

  const activeProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.ativo &&
          (category === "all" || product.categoriaId === category) &&
          product.nome.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [products, category, query],
  );

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantidade, 0);

  const addProduct = (product: Produto) => {
    setMessage(`${product.nome} adicionado`);
    window.setTimeout(() => setMessage((current) => (current === `${product.nome} adicionado` ? "" : current)), 1400);
    setCart((items) => {
      const existing = items.find((item) => item.productId === product.id);
      if (existing) {
        return items.map((item) =>
          item.productId === product.id
            ? { ...item, quantidade: item.quantidade + 1, subtotal: (item.quantidade + 1) * item.valorUnitario }
            : item,
        );
      }
      return [...items, { productId: product.id, nome: product.nome, quantidade: 1, valorUnitario: product.preco, subtotal: product.preco }];
    });
  };

  const changeQty = (productId: string, delta: number) => {
    setCart((items) =>
      items
        .map((item) => {
          if (item.productId !== productId) return item;
          const quantidade = Math.max(0, item.quantidade + delta);
          return { ...item, quantidade, subtotal: quantidade * item.valorUnitario };
        })
        .filter((item) => item.quantidade > 0),
    );
  };

  const clearCart = () => {
    if (cart.length === 0 || confirm("Limpar o pedido atual?")) {
      setCart([]);
      setPayment(undefined);
      setMessage("");
      setMobileCheckoutStep("cart");
    }
  };

  const openCart = () => {
    setMobileCheckoutStep("cart");
    setCartOpen(true);
  };

  const openPayment = () => {
    if (cart.length === 0) {
      setMessage("Adicione pelo menos um produto.");
      return;
    }
    setMobileCheckoutStep("payment");
    setCartOpen(true);
  };

  const finish = async () => {
    if (cart.length === 0) {
      setMessage("Adicione pelo menos um produto.");
      return;
    }
    if (!payment) {
      setMessage("Selecione a forma de pagamento.");
      setMobileCheckoutStep("payment");
      setCartOpen(true);
      return;
    }
    const order: Pedido = {
      id: uid("order"),
      sessionId: session.id,
      numero: session.proximoPedido,
      itens: cart,
      total,
      formaPagamento: payment,
      status: "pago",
      operador: session.operador,
      criadoEm: new Date().toISOString(),
    };
    await dbApi.saveOrder(order);
    await dbApi.saveSession({ ...session, proximoPedido: session.proximoPedido + 1 });
    try {
      printOrder(order, settings);
      setMessage(`Pedido ${orderNumber(order.numero)} registrado e enviado para impressão.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Pedido registrado, mas a impressão falhou.");
    }
    setCart([]);
    setPayment(undefined);
    setMobileCheckoutStep("cart");
    setCartOpen(false);
    onChanged();
  };

  const orderPanel = (
    <aside className="order-panel panel">
      <div className="order-head">
        <Grid2X2 size={34} />
        <div><span>Pedido</span><strong>#{orderNumber(session.proximoPedido)}</strong></div>
      </div>
      <div className="cart-table">
        <div className="cart-row cart-header"><span>Item</span><span>Qtd</span><span>Unit.</span><span>Subtotal</span><span /></div>
        {cart.length === 0 && <p className="empty">Toque nos produtos para montar o pedido.</p>}
        {cart.map((item) => (
          <div className="cart-row" key={item.productId}>
            <span>{item.nome}</span>
            <span className="qty">
              <button onClick={() => changeQty(item.productId, -1)}><Minus size={16} /></button>
              {item.quantidade}
              <button onClick={() => changeQty(item.productId, 1)}><Plus size={16} /></button>
            </span>
            <span>{money(item.valorUnitario)}</span>
            <span>{money(item.subtotal)}</span>
            <button className="ghost" onClick={() => changeQty(item.productId, -item.quantidade)}><X size={16} /></button>
          </div>
        ))}
      </div>
      <div className="total-line"><span>Total</span><strong>{money(total)}</strong></div>
      <h3>Forma de pagamento</h3>
      <div className="payment-grid">
        <button className={payment === "dinheiro" ? "selected money" : "money"} onClick={() => setPayment("dinheiro")}><DollarSign /> Dinheiro</button>
        <button className={payment === "pix" ? "selected pix" : "pix"} onClick={() => setPayment("pix")}><WalletCards /> Pix</button>
        <button className={payment === "cartao" ? "selected card" : "card"} onClick={() => setPayment("cartao")}><CreditCard /> Cartão</button>
      </div>
      {message && <p className={message.includes("Adicione") || message.includes("Selecione") ? "message danger" : "message ok"}>{message}</p>}
      <div className="order-actions">
        <button onClick={clearCart}><Trash2 /> Limpar</button>
        <button onClick={() => confirm("Cancelar o pedido atual?") && clearCart()}><X /> Cancelar</button>
      </div>
      <button className="primary-action" onClick={finish}><CreditCard size={28} /> FINALIZAR E IMPRIMIR</button>
    </aside>
  );

  const mobileCartPanel = (
    <section className="mobile-checkout mobile-checkout-cart">
      <div className="order-head">
        <Grid2X2 size={34} />
        <div><span>Pedido</span><strong>#{orderNumber(session.proximoPedido)}</strong></div>
      </div>
      <div className="cart-table">
        {cart.length === 0 && <p className="empty">Toque nos produtos para montar o pedido.</p>}
        {cart.map((item) => (
          <div className="cart-row mobile-cart-row" key={item.productId}>
            <span>{item.nome}</span>
            <span className="qty">
              <button onClick={() => changeQty(item.productId, -1)}><Minus size={16} /></button>
              {item.quantidade}
              <button onClick={() => changeQty(item.productId, 1)}><Plus size={16} /></button>
            </span>
            <span>{money(item.subtotal)}</span>
            <button className="ghost" onClick={() => changeQty(item.productId, -item.quantidade)}><X size={16} /></button>
          </div>
        ))}
      </div>
      <div className="total-line"><span>Total</span><strong>{money(total)}</strong></div>
      {message && <p className={message.includes("Adicione") || message.includes("Selecione") ? "message danger" : "message ok"}>{message}</p>}
      <div className="mobile-checkout-actions">
        <button onClick={() => setCartOpen(false)}>Adicionar mais</button>
        <button onClick={clearCart}><Trash2 /> Limpar</button>
      </div>
      <button className="primary-action" onClick={openPayment}><CreditCard size={26} /> Ir para pagamento</button>
    </section>
  );

  const mobilePaymentPanel = (
    <section className="mobile-checkout mobile-checkout-payment">
      <div className="mobile-step-summary">
        <button onClick={() => setMobileCheckoutStep("cart")}><ShoppingCart /> Conferir itens</button>
        <strong>{money(total)}</strong>
      </div>
      <h3>Forma de pagamento</h3>
      <div className="payment-grid">
        <button className={payment === "dinheiro" ? "selected money" : "money"} onClick={() => setPayment("dinheiro")}><DollarSign /> Dinheiro</button>
        <button className={payment === "pix" ? "selected pix" : "pix"} onClick={() => setPayment("pix")}><WalletCards /> Pix</button>
        <button className={payment === "cartao" ? "selected card" : "card"} onClick={() => setPayment("cartao")}><CreditCard /> Cartão</button>
      </div>
      {message && <p className={message.includes("Adicione") || message.includes("Selecione") ? "message danger" : "message ok"}>{message}</p>}
      <div className="mobile-checkout-actions">
        <button onClick={clearCart}><Trash2 /> Limpar</button>
        <button onClick={() => confirm("Cancelar o pedido atual?") && clearCart()}><X /> Cancelar</button>
      </div>
      <button className="primary-action" onClick={finish}><CreditCard size={28} /> FINALIZAR E IMPRIMIR</button>
    </section>
  );

  return (
    <section className={compactCart ? "sales-layout compact-sale" : "sales-layout"}>
      {!compactCart && orderPanel}

      <section className="products-panel panel">
        <label className="search-field"><Search /><input placeholder="Buscar produto..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="product-grid">
          {activeProducts.map((product) => (
            <button className="product-card" key={product.id} onClick={() => addProduct(product)}>
              <span className="product-icon">{product.imagem ? <img src={product.imagem} alt="" /> : product.icone}</span>
              <strong>{product.nome}</strong>
              {product.descricao && <small>{product.descricao}</small>}
              <span>{money(product.preco)}</span>
            </button>
          ))}
          {activeProducts.length === 0 && <p className="empty">Nenhum produto encontrado.</p>}
        </div>
      </section>

      <aside className="category-rail">
        <button className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}><Grid2X2 />Todos</button>
        {categories.filter((item) => item.ativo).map((item) => {
          const Icon = categoryIcons[item.icone] ?? Grid2X2;
          return <button key={item.id} className={category === item.id ? "active" : ""} onClick={() => setCategory(item.id)}><Icon />{item.nome}</button>;
        })}
      </aside>

      {compactCart && (
        <>
          <MobileCartBar itemCount={itemCount} total={total} onOpen={openCart} onFinish={openPayment} />
          <CartDrawer
            open={cartOpen}
            title={mobileCheckoutStep === "cart" ? `Conferir pedido #${orderNumber(session.proximoPedido)}` : "Pagamento"}
            onClose={() => setCartOpen(false)}
          >
            {mobileCheckoutStep === "cart" ? mobileCartPanel : mobilePaymentPanel}
          </CartDrawer>
        </>
      )}
    </section>
  );
};
