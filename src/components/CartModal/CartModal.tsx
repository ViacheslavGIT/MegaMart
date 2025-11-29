import React, { useEffect, useState } from "react";
import { useCart } from "../../context/CartContext";
import { FaTimes } from "react-icons/fa";
import CheckoutForm from "../../components/CheckoutForm/CheckoutForm";
import "./styles.css";

interface CartModalProps {
  open: boolean;
  onClose: () => void;
}

const CartModal: React.FC<CartModalProps> = ({ open, onClose }) => {
  const { cart, removeFromCart, totalPrice, totalQuantity, clearCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    const closeOnEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEsc);
    return () => window.removeEventListener("keydown", closeOnEsc);
  }, [onClose]);

  useEffect(() => {
    if (open) document.body.classList.add("cart-open");
    else document.body.classList.remove("cart-open");
    return () => document.body.classList.remove("cart-open");
  }, [open]);

  if (!open) return null;

  if (showCheckout)
    return (
      <div className="cart-overlay show">
        <div className="cart-modal cart-fullscreen">
          <button className="close-btn" onClick={() => setShowCheckout(false)}>
            <FaTimes size={18} />
          </button>
          <CheckoutForm />
        </div>
      </div>
    );

  return (
    <div className={`cart-overlay ${open ? "show" : ""}`} onClick={onClose}>
      <div
        className="cart-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="cart-header">
          <h2>🛒 Cart ({totalQuantity})</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes size={16} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="empty-cart">Cart is empty</div>
        ) : (
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.name} className="cart-item">
                <img src={item.img} alt={item.name} />
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">
                    ₴{item.price} × {item.quantity}
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item._id!)}
                  className="remove-btn"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="cart-footer">
          <div className="total">
            <strong>Total:</strong> ₴{totalPrice.toFixed(2)}
          </div>
          <div className="cart-actions">
            <button className="continue-btn" onClick={onClose}>
              Continue shopping
            </button>
            <button
              className="checkout-btn"
              disabled={cart.length === 0}
              onClick={() => setShowCheckout(true)}
            >
              Place an order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartModal;

