import { X } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const CartDrawer = ({ open, title, onClose, children }: Props) => {
  if (!open) return null;
  return (
    <div className="cart-drawer-backdrop" role="dialog" aria-modal="true">
      <section className="cart-drawer">
        <header>
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Fechar pedido"><X /></button>
        </header>
        {children}
      </section>
    </div>
  );
};
