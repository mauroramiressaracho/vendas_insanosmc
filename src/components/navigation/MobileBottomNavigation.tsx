import { BarChart3, Menu, PackageSearch, ShoppingCart } from "lucide-react";

interface Props {
  active: string;
  onNavigate: (view: "sales" | "orders" | "dashboard" | "settings") => void;
}

export const MobileBottomNavigation = ({ active, onNavigate }: Props) => (
  <nav className="mobile-bottom-nav" aria-label="Navegação principal">
    <button className={active === "sales" ? "active" : ""} onClick={() => onNavigate("sales")}><ShoppingCart /> Vendas</button>
    <button className={active === "orders" ? "active" : ""} onClick={() => onNavigate("orders")}><PackageSearch /> Pedidos</button>
    <button className={active === "dashboard" ? "active" : ""} onClick={() => onNavigate("dashboard")}><BarChart3 /> Dashboard</button>
    <button className={active === "settings" ? "active" : ""} onClick={() => onNavigate("settings")}><Menu /> Menu</button>
  </nav>
);
