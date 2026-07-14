import { useEffect, useMemo, useState } from "react";
import { BarChart3, Menu, PackageSearch, Printer, Settings, ShoppingCart, Store, X } from "lucide-react";
import { MobileBottomNavigation } from "./components/navigation/MobileBottomNavigation";
import { dbApi, seedIfEmpty } from "./database/db";
import { useClock } from "./hooks/useClock";
import { useBreakpoint } from "./hooks/useBreakpoint";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { usePwaInstall } from "./hooks/usePwaInstall";
import { ClosePage } from "./pages/ClosePage";
import { DashboardPage } from "./pages/DashboardPage";
import { OpenCashPage } from "./pages/OpenCashPage";
import { OrdersPage } from "./pages/OrdersPage";
import { SalesPage } from "./pages/SalesPage";
import { SettingsPage } from "./pages/SettingsPage";
import type { Categoria, Configuracao, Pedido, Produto, SessaoCaixa } from "./types";

type View = "open" | "sales" | "orders" | "close" | "dashboard" | "settings";

export const App = () => {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>("sales");
  const [products, setProducts] = useState<Produto[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [sessions, setSessions] = useState<SessaoCaixa[]>([]);
  const [session, setSession] = useState<SessaoCaixa | undefined>();
  const [settings, setSettings] = useState<Configuracao | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const online = useOnlineStatus();
  const clock = useClock();
  const { isMobile } = useBreakpoint();
  const pwaInstall = usePwaInstall();

  const refresh = async () => {
    const [nextProducts, nextCategories, nextOrders, nextSession, nextSessions, nextSettings] = await Promise.all([
      dbApi.getProducts(),
      dbApi.getCategories(),
      dbApi.getOrders(),
      dbApi.getOpenSession(),
      dbApi.getSessions(),
      dbApi.getSettings(),
    ]);
    setProducts(nextProducts.sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome)));
    setCategories(nextCategories.sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome)));
    setOrders(nextOrders.reverse());
    setSession(nextSession);
    setSessions(nextSessions.sort((a, b) => new Date(b.abertoEm).getTime() - new Date(a.abertoEm).getTime()));
    setSettings(nextSettings);
    setReady(true);
  };

  useEffect(() => {
    seedIfEmpty().then(refresh).catch((error) => {
      console.error(error);
      alert("Não foi possível iniciar o banco local.");
    });
  }, []);

  useEffect(() => {
    if (ready && !session && (view === "sales" || view === "close")) setView("open");
  }, [ready, session, view]);

  const handleCashOpened = async (openedSession: SessaoCaixa) => {
    setSession(openedSession);
    setView("sales");
    await refresh();
    setView("sales");
  };

  const activeOrders = useMemo(() => session ? orders.filter((order) => order.sessionId === session.id) : orders, [orders, session]);

  if (!ready || !settings) {
    return <main className="loading">Carregando caixa...</main>;
  }

  const nav = [
    { id: (session ? "sales" : "open") as View, label: session ? "Venda" : "Abrir caixa", icon: ShoppingCart },
    { id: "orders" as const, label: "Pedidos", icon: PackageSearch },
    { id: "dashboard" as const, label: "Dashboard", icon: BarChart3 },
    { id: "close" as const, label: "Fechamento", icon: Store },
    { id: "settings" as const, label: "Configurações", icon: Settings },
  ];

  const shellMode = view === "sales" && session ? "sales-mode" : view === "open" ? "open-mode" : "";

  return (
    <div className={shellMode ? `app-shell ${shellMode}` : "app-shell"}>
      <header className="topbar">
        <button className="icon-button" onClick={() => setDrawerOpen((open) => !open)} aria-label="Menu">
          {drawerOpen ? <X /> : <Menu />}
        </button>
        <div className="brand-mark" aria-label="Espaço para logo">
          MC
        </div>
        <div className="title-block">
          <h1>CAIXA DE VENDAS</h1>
          <strong>{settings.nomeEvento}</strong>
          <span>{settings.subtitulo}</span>
        </div>
        <div className="status-top">
          <span><small>Operador</small><strong>{session?.operador ?? "-"}</strong></span>
          <span><small>Hora</small><strong>{clock}</strong></span>
          <span><small>Caixa</small><strong className={session ? "ok" : "danger"}>{session ? "Aberto" : "Fechado"}</strong></span>
          <span><small>Impressora</small><strong className={settings.impressaoAtivada ? "ok" : "danger"}>{settings.impressaoAtivada ? "Configurada" : "Desligada"}</strong></span>
          <button className="icon-button" onClick={() => setView("settings")} aria-label="Configurações">
            <Settings />
          </button>
        </div>
      </header>

      {drawerOpen && (
        <nav className="drawer">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => { setView(item.id); setDrawerOpen(false); }}>
                <Icon /> {item.label}
              </button>
            );
          })}
          {(pwaInstall.canInstall || pwaInstall.showInstructions) && (
            <button onClick={() => { pwaInstall.install(); setDrawerOpen(false); }}>
              {pwaInstall.canInstall ? "Instalar aplicativo" : "Como instalar"}
            </button>
          )}
        </nav>
      )}

      {(pwaInstall.canInstall || pwaInstall.message) && (
        <div className="pwa-banner">
          <span>{pwaInstall.message || "Instale o Caixa Insanos para usar em tela cheia e com acesso rápido."}</span>
          {!pwaInstall.message && <button onClick={pwaInstall.install}>Instalar</button>}
          {!pwaInstall.message && <button onClick={pwaInstall.dismiss}>Agora não</button>}
        </div>
      )}

      <main className="main-view">
        {view === "open" && <OpenCashPage defaultOperator={settings.operadorPadrao} onOpened={handleCashOpened} />}
        {view === "sales" && session && (
          <SalesPage
            products={products}
            categories={categories}
            session={session}
            settings={settings}
            onChanged={refresh}
          />
        )}
        {view === "orders" && <OrdersPage orders={activeOrders} settings={settings} onChanged={refresh} readOnly={!session} />}
        {view === "close" && session && <ClosePage session={session} orders={activeOrders} products={products} categories={categories} onClosed={() => { refresh(); setView("dashboard"); }} />}
        {view === "dashboard" && <DashboardPage orders={orders} products={products} categories={categories} sessions={sessions} currentSession={session} settings={settings} onChanged={refresh} />}
        {view === "settings" && (
          <SettingsPage
            products={products}
            categories={categories}
            orders={orders}
            settings={settings}
            onChanged={refresh}
          />
        )}
      </main>

      <footer className="bottombar">
        <span className={online ? "ok" : "danger"}>{online ? "Online" : "Offline"}<small>{online ? "Conectado" : "Sem internet"}</small></span>
        <span className={session ? "ok" : "danger"}>{session ? "Caixa aberto" : "Caixa fechado"}<small>{session ? `Desde ${new Date(session.abertoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "Abra para vender"}</small></span>
        <span className={settings.impressaoAtivada ? "ok" : "danger"}><Printer size={18} /> Impressão<small>{settings.impressaoAtivada ? "Ativada" : "Desativada"}</small></span>
        <span>Bobina {settings.larguraMm}mm<small>{settings.vias} via(s)</small></span>
      </footer>
      {isMobile && <MobileBottomNavigation active={view} onNavigate={setView} />}
    </div>
  );
};
