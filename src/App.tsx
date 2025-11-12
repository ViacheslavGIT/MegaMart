import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header/Header";
import Home from "./pages/Home";
import Products from "./pages/Products";
import Contact from "./pages/Contact";
import AdminPanel from "./pages/AdminPanel";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import { CartProvider } from "./context/CartContext";
import { ProductsProvider } from "./context/ProductsContext";
import { useAuth } from "./context/AuthContext";
import ChatWidget from "./components/ChatWidget/ChatWidget";

const App: React.FC = () => {
  const { initialized } = useAuth();

  // ⛔ Показываем "Loading" только при первом запуске
  if (!initialized) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>Loading...</div>
    );
  }

  return (
    <ProductsProvider>
      <CartProvider>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:category" element={<Products />} />
            <Route path="/products/:category/:brand" element={<Products />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/account" element={<Account />} />
            <Route path="/admin" element={<Login />} />
            <Route path="/admin/dashboard" element={<AdminPanel />} />
          </Routes>
          <ChatWidget />
        </main>
      </CartProvider>
    </ProductsProvider>
  );
};

export default App;

