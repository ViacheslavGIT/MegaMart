import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaTag, FaCartPlus, FaTimes, FaCreditCard, FaHeart } from "react-icons/fa";
import { useProducts, Product } from "../../context/ProductsContext";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";
import "./styles.css";

export default function ProductRow() {
  const { products } = useProducts();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { isUser } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const token = localStorage.getItem("token");

  // ✅ Загрузка избранного с сервера
  useEffect(() => {
    if (!isUser || !token) return;
    const fetchFavorites = async () => {
      try {
        const res = await api.get("/user/favorites", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const list = Array.isArray(res.data)
          ? res.data.map((p) => p._id)
          : Array.isArray(res.data?.favorites)
            ? res.data.favorites.map((p: any) => p._id)
            : [];
        setFavorites(list);
      } catch (err) {
        console.error("Error loading favorites:", err);
      }
    };
    fetchFavorites();
  }, [isUser, token]);

  // ❤️ Добавление / удаление из избранного
  const toggleFavorite = async (id?: string) => {
    if (!id) return;
    if (!isUser || !token) {
      alert("Please log in to add favorites.");
      return;
    }

    try {
      const res = await api.post(
        `/user/favorites/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = Array.isArray(res.data)
        ? res.data.map((p) => p._id)
        : Array.isArray(res.data?.favorites)
          ? res.data.favorites.map((p: any) => p._id)
          : [];
      setFavorites(updated);
    } catch (err) {
      console.error("Error updating favorites:", err);
    }
  };

  // ⚙️ Управление модалкой
  useEffect(() => {
    if (selectedProduct) {
      setShowModal(true);
      document.body.style.overflow = "hidden";
    } else {
      setShowModal(false);
      document.body.style.overflow = "";
    }
  }, [selectedProduct]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setSelectedProduct(null);
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  const categories = ["Smartphones", "Laptops", "Headphones", "Watches"];
  const visibleProducts = categories.flatMap((cat) =>
    products.filter((p) => p.category === cat).slice(0, 2)
  );

  return (
    <div className="products-wrapper">
      <div className="product-row container">
        {visibleProducts.map((p) => {
          const isFav = p._id ? favorites.includes(p._id) : false;
          return (
            <div key={p._id} className="product-card" onClick={() => setSelectedProduct(p)}>
              <div className="product-thumb">
                <img
                  src={p.img || "https://placehold.co/400x400?text=No+Image"}
                  alt={p.name}
                  className="product-img"
                  onError={(e) =>
                  ((e.target as HTMLImageElement).src =
                    "https://placehold.co/400x400?text=No+Image")
                  }
                />
                {p.off > 0 && (
                  <span className="badge">
                    <FaTag /> {p.off}% OFF
                  </span>
                )}
                <button
                  className={`heart-btn ${isFav ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(p._id);
                  }}
                >
                  <FaHeart />
                </button>
              </div>

              <div className="product-info">
                <div className="product-title">{p.name}</div>
                <div className="product-price">₴{p.price.toLocaleString()}</div>
                <div className="product-save">-₴{Math.round((p.price * p.off) / 100)}</div>

                <button
                  className="add-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(p);
                  }}
                >
                  <FaCartPlus /> Add to cart
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ✅ Модалка */}
      {showModal && selectedProduct && (
        <div
          className="modal-overlay show"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedProduct(null);
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedProduct.name}</h2>
              <button className="close-btn" onClick={() => setSelectedProduct(null)}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-img">
                <img
                  src={selectedProduct.img || "https://placehold.co/400x400?text=No+Image"}
                  alt={selectedProduct.name}
                />
              </div>

              <div className="modal-text">
                <h3>₴{selectedProduct.price.toLocaleString()}</h3>
                <p>Discount: {selectedProduct.off}%</p>
                <p>
                  You save ₴
                  {Math.round((selectedProduct.price * selectedProduct.off) / 100)}
                </p>
                <p>{selectedProduct.description || "There is no product description."}</p>

                <div className="modal-buttons">
                  <button className="add-btn" onClick={() => addToCart(selectedProduct)}>
                    <FaCartPlus /> Add to cart
                  </button>

                  <button
                    className="checkout-btn"
                    onClick={() => {
                      addToCart(selectedProduct);
                      setSelectedProduct(null);
                      navigate("/checkout");
                    }}
                  >
                    <FaCreditCard /> Make an order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
