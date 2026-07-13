import { ShoppingCart } from "lucide-react";
import { money } from "../../utils/format";

interface Props {
  itemCount: number;
  total: number;
  onOpen: () => void;
  onFinish: () => void;
}

export const MobileCartBar = ({ itemCount, total, onOpen, onFinish }: Props) => (
  <div className="mobile-cart-bar">
    <button onClick={onOpen}><ShoppingCart /> {itemCount} itens</button>
    <strong>{money(total)}</strong>
    <button className="primary-action small" onClick={onFinish}>Finalizar</button>
  </div>
);
