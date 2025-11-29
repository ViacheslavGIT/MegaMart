import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, MessageCircle, Package, ShoppingCart, UserRound } from "lucide-react";
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
  const location = useLocation();

  useEffect(() => {
    document.body.style.overflow = openCart ? "hidden" : "";
  }, [openCart]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const accountPath = isAdmin ? "/admin/dashboard" : isUser ? "/account" : "/login";
  const accountLabel = isAdmin ? "Admin" : isUser ? "Account" : "Login";

  return (
    <>
      <header className={`header ${scrolled ? "scrolled" : ""}`}>
        <div className="logo" onClick={() => navigate("/")}>MegaMart</div>

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
          {isUser || isAdmin ? (
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
            <button className="login-btn" onClick={() => navigate("/login")}>Login</button>
          )}

          <div className="cart" onClick={() => setOpenCart(true)}>
            <ShoppingCart size={24} className="cart-icon" />
            {totalQuantity > 0 && <span className="cart-count">{totalQuantity}</span>}
          </div>
        </div>
      </header>

      <div className="bottom-nav">
        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            <Home />
            Home
          </NavLink>
          <NavLink
            to="/products"
            className={({ isActive }) =>
              isActive || location.pathname.includes("/products") ? "active" : ""
            }
          >
            <Package />
            Shop
          </NavLink>
          <button
            type="button"
            className={`cart-tab ${openCart ? "active" : ""}`}
            onClick={() => setOpenCart(true)}
          >
            <ShoppingCart />
            Cart
            {totalQuantity > 0 && <span className="cart-count">{totalQuantity}</span>}
          </button>
          <NavLink to="/contact" className={({ isActive }) => (isActive ? "active" : "")}> 
            <MessageCircle />
            Contact
          </NavLink>
          <NavLink
            to={accountPath}
            className={({ isActive }) =>
              isActive ||
              location.pathname.includes("/account") ||
              location.pathname.includes("/admin")
                ? "active"
                : ""
            }
          >
            <UserRound />
            {accountLabel}
          </NavLink>
        </div>
      </div>

      <CartModal open={openCart} onClose={() => setOpenCart(false)} />
    </>
  );
}
