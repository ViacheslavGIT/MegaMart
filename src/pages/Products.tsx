import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CategoriesRow from "../components/CategoriesRow/CategoriesRow";
import BrandsRow from "../components/BrandsRow/BrandsRow";
import { useProducts } from "../context/ProductsContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { FaCartPlus, FaTimes, FaCreditCard, FaHeart } from "react-icons/fa";
import api from "../api/api";
import "./styles.css";

const Products: React.FC = () => {
  const { category, brand } = useParams<{ category?: string; brand?: string }>();
  const { products, loading, hasMore, reload, loadMore } = useProducts();
  const { addToCart } = useCart();
  const { isUser } = useAuth();
  const navigate = useNavigate();

  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const filters: { category?: string; brand?: string } = {};
    if (category) filters.category = category;
    if (brand) filters.brand = brand;
    reload(filters);
  }, [category, brand, reload]);

  useEffect(() => {
    document.body.classList.toggle("no-scroll", !!selectedProduct);
  }, [selectedProduct]);

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
        console.error("Error fetching favorites:", err);
      }
    };
    fetchFavorites();
  }, [isUser, token]);

  const toggleFavorite = async (productId: string) => {
    if (!isUser || !token) {
      alert("Please log in to add favorites.");
      return;
    }
    try {
      const res = await api.post(
        `/user/favorites/${productId}`,
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

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 400 &&
        hasMore &&
        !loading
      ) {
        loadMore();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loading, loadMore]);

  if (!products) {
    return <div className="error">Ошибка загрузки товаров.</div>;
  }

  return (
    <div className="products-wrapper">
      <div className="products-page fade-in">
        <CategoriesRow />
        {category && <BrandsRow />}

        <div className="product-grid">
          {products.length === 0 && !loading ? (
            <p className="no-products">No products found</p>
          ) : (
            products.map((p) => {
              const isFav = favorites.includes(p._id);
              return (
                <div key={p._id} className="product-card">
                  <div
                    className="product-thumb"
                    onClick={() => setSelectedProduct(p)}
                  >
                    <img
                      src={p.img || "https://placehold.co/400x400?text=No+Image"}
                      alt={p.name}
                      onError={(e) =>
                      ((e.target as HTMLImageElement).src =
                        "https://placehold.co/400x400?text=No+Image")
                      }
                    />
                    {p.off > 0 && <span className="badge">-{p.off}%</span>}
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
                  <h3>{p.name}</h3>
                  <p>{p.brand}</p>
                  <p>{p.category}</p>
                  <p>
                    <b>₴{p.price}</b> (-{p.off}%)
                  </p>
                </div>
              );
            })
          )}
          {loading && <div className="loading-spinner">Loading...</div>}
        </div>

        {selectedProduct && (
          <div
            className="modal-overlay show"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedProduct(null);
            }}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h2>{selectedProduct.name}</h2>
                <button
                  className="close-btn"
                  onClick={() => setSelectedProduct(null)}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="modal-img">
                  <img
                    src={
                      selectedProduct.img ||
                      "https://placehold.co/400x400?text=No+Image"
                    }
                    alt={selectedProduct.name}
                  />
                </div>
                <div className="modal-text">
                  <h3>₴{selectedProduct.price.toLocaleString()}</h3>
                  <p>Discount: {selectedProduct.off}%</p>
                  <p>
                    You save ₴
                    {Math.round(
                      (selectedProduct.price * selectedProduct.off) / 100
                    )}
                  </p>
                  <p>{selectedProduct.description || "No description available."}</p>
                  <div className="modal-buttons">
                    <button
                      className="add-btn"
                      onClick={() => addToCart(selectedProduct)}
                    >
                      <FaCartPlus /> Add to Cart
                    </button>
                    <button
                      className="checkout-btn"
                      onClick={() => {
                        addToCart(selectedProduct);
                        setSelectedProduct(null);
                        navigate("/checkout");
                      }}
                    >
                      <FaCreditCard /> Checkout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
