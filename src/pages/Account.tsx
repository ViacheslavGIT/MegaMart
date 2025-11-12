import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import "./Account.css";

interface Product {
  _id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  off: number;
  img?: string;
  description?: string;
}

interface OrderItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  createdAt: string;
  total: number;
  items: OrderItem[];
}

const Account: React.FC = () => {
  const { logout, userEmail, setUserEmail } = useAuth();
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingFav, setLoadingFav] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // ✅ Проверка токена и email
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token && !userEmail) {
      navigate("/login");
      return;
    }

    if (!userEmail && token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserEmail(payload.email);
      } catch {
        logout();
        navigate("/login");
      }
    }
  }, [userEmail, navigate, logout, setUserEmail]);

  // ✅ Загрузка избранных
  const fetchFavorites = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setFavorites([]);
      setLoadingFav(false);
      return;
    }

    try {
      setLoadingFav(true);
      const res = await api.get("/user/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.favorites)
          ? data.favorites
          : [];

      setFavorites(list);
    } catch (err) {
      console.error("Error loading favorites:", err);
      setFavorites([]);
    } finally {
      setLoadingFav(false);
    }
  }, []);

  // ✅ Загрузка заказов
  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }

    try {
      setLoadingOrders(true);
      const res = await api.get("/user/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data || []);
    } catch (err) {
      console.error("Error loading orders:", err);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  // 🔄 Загружаем при первом рендере и при смене юзера
  useEffect(() => {
    if (userEmail) {
      fetchFavorites();
      fetchOrders();
    }
  }, [userEmail, fetchFavorites, fetchOrders]);

  if (!userEmail) {
    return (
      <div className="account-page">
        <h2>No user found</h2>
        <p>Please register or login again.</p>
        <button className="primary-btn" onClick={() => navigate("/login")}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="account-page fade-in">
      <h1 className="account-title">Welcome, {userEmail}</h1>

      {/* ===== Избранные ===== */}
      <p className="account-subtitle">Your favorite products:</p>
      {loadingFav ? (
        <p>Loading favorites...</p>
      ) : favorites.length === 0 ? (
        <p className="no-favorites">You don’t have favorite items yet 💔</p>
      ) : (
        <div className="favorites-grid">
          {favorites.map((p) => (
            <div key={p._id} className="favorite-card">
              <img
                src={p.img || "https://placehold.co/400x400?text=No+Image"}
                alt={p.name}
                onError={(e) =>
                ((e.target as HTMLImageElement).src =
                  "https://placehold.co/400x400?text=No+Image")
                }
              />
              <h4>{p.name}</h4>
              <p className="brand">{p.brand}</p>
              <p className="price">₴{p.price}</p>
            </div>
          ))}
        </div>
      )}

      {/* ===== Заказы ===== */}
      <h2 className="account-subtitle">Your orders:</h2>
      {loadingOrders ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="no-orders">You have no orders yet 🛒</p>
      ) : (
        <div className="orders-list">
          {orders.map((o) => (
            <div key={o._id} className="order-card">
              <p>
                <b>Date:</b> {new Date(o.createdAt).toLocaleString()}
              </p>
              <p>
                <b>Total:</b> ₴{o.total.toLocaleString()}
              </p>
              <div className="order-items">
                {o.items.map((item) => (
                  <div key={item._id} className="order-item">
                    <span>{item.name}</span>
                    <small>
                      {item.quantity} × ₴{item.price}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== Кнопка выхода ===== */}
      <button
        className="logout-btn"
        onClick={() => {
          logout();
          localStorage.removeItem("token");
          navigate("/");
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default Account;
