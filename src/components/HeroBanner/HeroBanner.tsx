import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import api from "../../api/api";
import { useCart } from "../../context/CartContext";
import CheckoutForm from "../CheckoutForm/CheckoutForm";
import "./style.css";

interface Product {
  _id?: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  off: number;
  img: string;
  description?: string;
}

export default function HeroBanner() {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    const fetchRandomProduct = async () => {
      try {
        const res = await api.get("/products/random");
        if (res.data && typeof res.data === "object" && res.data.name) {
          setProduct(res.data);
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error("Ошибка загрузки случайного товара:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRandomProduct();
  }, []);

  useEffect(() => {
    if (showCheckout) document.body.classList.add("cart-open");
    else document.body.classList.remove("cart-open");
    return () => document.body.classList.remove("cart-open");
  }, [showCheckout]);

  if (loading || !product) {
    return (
      <div className="hero">
        <div className="hero-content container">
          <div className="hero-left">
            <p className="small">Loading featured item...</p>
            <h1>Loading...</h1>
            <p className="muted">Please wait</p>
          </div>
          <div className="hero-right">
            <img src="https://placehold.co/400x400?text=No+Image" alt="Loading" />
          </div>
        </div>
      </div>
    );
  }

  const safePrice =
    typeof product.price === "number" ? product.price.toLocaleString() : "—";

  return (
    <>
      <div className="hero fade-in">
        <div className="hero-content container">
          <div className="hero-left">
            <p className="small">🔥 Hot deal of the week</p>
            <h1>{product.name || "Unnamed product"}</h1>
            <p className="muted">
              {product.brand || "Brand"} — {product.category || "Category"}
            </p>
            <h3>
              ₴{safePrice}
              <span className="off">{product.off ? `-${product.off}%` : ""}</span>
            </h3>

            <div className="hero-buttons">
              <button className="btn-glass add" onClick={() => addToCart(product)}>
                Add to Cart
              </button>

              <button
                className="btn-glass buy"
                onClick={() => {
                  addToCart(product);
                  setShowCheckout(true);
                }}
              >
                Buy Now
              </button>
            </div>
          </div>

          <div className="hero-right">
            <img
              src={product.img || "https://placehold.co/400x400?text=No+Image"}
              alt={product.name}
              onError={(e) =>
              ((e.target as HTMLImageElement).src =
                "https://placehold.co/400x400?text=No+Image")
              }
            />
          </div>
        </div>
      </div>

      {showCheckout && (
        <div className="cart-overlay show" onClick={() => setShowCheckout(false)}>
          <div
            className="cart-modal cart-fullscreen"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={() => setShowCheckout(false)}>
              <FaTimes size={18} />
            </button>
            <CheckoutForm />
          </div>
        </div>
      )}
    </>
  );
}
