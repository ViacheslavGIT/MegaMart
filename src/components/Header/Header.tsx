import { NavLink, useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import CartModal from "../CartModal/CartModal";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import "./style.css";

export default function Header() {
  const [openCart, setOpenCart] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { totalQuantity } = useCart();
  const { isAdmin, isUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = openCart ? "hidden" : "";
  }, [openCart]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  return (
    <>
      <header className={`header ${scrolled ? "scrolled" : ""}`}>
        <div className="logo" onClick={() => navigate("/")}>
          MegaMart
        </div>

        <nav className="nav">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/contact">Contact</NavLink>
          {isAdmin && <NavLink to="/admin/dashboard">Admin</NavLink>}
          {isUser && !isAdmin && <NavLink to="/account">Account</NavLink>}
        </nav>

        <div className="header-right">
          {(isUser || isAdmin) ? (
            <button
              className="login-btn logout"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Logout
            </button>
          ) : (
            <button
              className="login-btn"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          )}

          <div className="cart" onClick={() => setOpenCart(true)}>
            <ShoppingCart size={24} className="cart-icon" />
            {totalQuantity > 0 && (
              <span className="cart-count">{totalQuantity}</span>
            )}
          </div>
        </div>
      </header>

      <CartModal open={openCart} onClose={() => setOpenCart(false)} />
    </>
  );
}
