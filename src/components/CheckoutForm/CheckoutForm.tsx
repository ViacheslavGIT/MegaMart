import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import api from "../../api/api";
import "./CheckoutForm.css";

const CheckoutForm: React.FC = () => {
  const { isUser } = useAuth();
  const { cart, clearCart } = useCart();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    country: "",
    city: "",
    address: "",
  });

  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isUser) {
      const storedEmail = localStorage.getItem("userEmail");
      if (storedEmail) setForm((prev) => ({ ...prev, email: storedEmail }));
    }
  }, [isUser]);

  useEffect(() => {
    const singleProduct = localStorage.getItem("checkoutProduct");
    if (singleProduct) {
      try {
        const parsed = JSON.parse(singleProduct);
        setSelectedProducts([{ ...parsed, quantity: 1 }]);
      } catch {
        setSelectedProducts([]);
      }
      localStorage.removeItem("checkoutProduct");
    } else {
      setSelectedProducts(cart);
    }
  }, [cart]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isValid = Object.values(form).every((v) => v.trim() !== "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || selectedProducts.length === 0) return;

    const payload = {
      user: form,
      products: selectedProducts.map((p) => ({
        id: p._id,
        name: p.name,
        price: p.price,
        quantity: p.quantity || 1,
      })),
      total: selectedProducts.reduce(
        (sum, item) => sum + item.price * (item.quantity || 1),
        0
      ),
      date: new Date().toISOString(),
    };

    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      await api.post("/checkout", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(true);
      clearCart();
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success)
    return (
      <div className="checkout-success">
        <div className="success-box">
          <h1>✅ Purchase Successful!</h1>
          <p>Thank you for your order.</p>
        </div>
      </div>
    );

  return (
    <div className="checkout-container">
      <form className="checkout-form" onSubmit={handleSubmit}>
        <h2>Checkout</h2>

        {selectedProducts.length > 0 ? (
          <div className="checkout-summary">
            {selectedProducts.map((p) => (
              <div key={p._id} className="checkout-item">
                <img
                  src={p.img || "https://placehold.co/80x80?text=No+Image"}
                  alt={p.name}
                />
                <div>
                  <p>{p.name}</p>
                  <small>
                    ₴{p.price} × {p.quantity || 1}
                  </small>
                </div>
              </div>
            ))}
            <div className="checkout-total">
              <strong>
                Total: ₴
                {selectedProducts
                  .reduce(
                    (sum, item) => sum + item.price * (item.quantity || 1),
                    0
                  )
                  .toLocaleString()}
              </strong>
            </div>
          </div>
        ) : (
          <p className="empty-msg">No products selected for checkout.</p>
        )}

        <div className="form-row">
          <label>Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            required
          />
        </div>

        <div className="form-row">
          <label>Phone</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+1 (000) 000 0000"
            required
          />
        </div>

        <div className="form-row">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />
        </div>

        <div className="form-row">
          <label>Country</label>
          <input
            type="text"
            name="country"
            value={form.country}
            onChange={handleChange}
            placeholder="Your country"
            required
          />
        </div>

        <div className="form-row">
          <label>City</label>
          <input
            type="text"
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="Your city"
            required
          />
        </div>

        <div className="form-row">
          <label>Address</label>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Street, house number"
            required
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={!isValid || loading}>
          {loading ? "Processing..." : "Buy Now"}
        </button>
      </form>
    </div>
  );
};

export default CheckoutForm;
