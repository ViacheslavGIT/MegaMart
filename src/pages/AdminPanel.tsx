import React, { useEffect, useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import "./AdminPanel.css";

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

const AdminPanel: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [fileName, setFileName] = useState<string>("");
  const [editFileNames, setEditFileNames] = useState<Record<string, string>>({});
  const [newProduct, setNewProduct] = useState<Product>({
    name: "",
    brand: "",
    category: "",
    price: 0,
    off: 0,
    img: "",
    description: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, Product>>({});
  const navigate = useNavigate();
  const { isAdmin, token } = useAuth();

  useEffect(() => {
    if (!isAdmin) navigate("/login");
  }, [isAdmin, navigate]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/products", { params: { page: 1, limit: 200 } });
      const data = res.data;
      const list: Product[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.products)
          ? data.products
          : [];
      setProducts(list);
      const uniqueCategories = Array.from(new Set(list.map((p) => p.category).filter(Boolean)));
      const uniqueBrands = Array.from(new Set(list.map((p) => p.brand).filter(Boolean)));
      setCategories(uniqueCategories);
      setBrands(uniqueBrands);
    } catch (err) {
      console.error("Error loading products:", err);
      setProducts([]);
      setCategories([]);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleNewFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    setFileName(file.name);
    setNewProduct({ ...newProduct, img: base64 });
  };

  const addProduct = async () => {
    if (!token) return alert("Please login as admin first.");
    if (!newProduct.name || !newProduct.price) return alert("Fill at least name and price.");
    try {
      await api.post("/admin/products", newProduct, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewProduct({
        name: "",
        brand: "",
        category: "",
        price: 0,
        off: 0,
        img: "",
        description: "",
      });
      setFileName("");
      await fetchProducts();
    } catch (err) {
      console.error("Error adding product:", err);
    }
  };

  const deleteProduct = async (id?: string) => {
    if (!token) return alert("Please login as admin first.");
    if (!id) return;
    if (!confirm("Delete this product?")) return;
    try {
      await api.delete(`/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  const startEdit = (p: Product) => {
    if (!p._id) return;
    setEditingId(p._id);
    setEditData((prev) => ({ ...prev, [p._id!]: { ...p } }));
  };

  const handleEditChange = (id: string, key: keyof Product, value: any) => {
    setEditData((d) => ({ ...d, [id]: { ...d[id], [key]: value } }));
  };

  const handleEditFile = async (id: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    handleEditChange(id, "img", base64);
    setEditFileNames((prev) => ({ ...prev, [id]: file.name }));
  };

  const saveEdit = async (id: string) => {
    if (!token) return alert("Please login as admin first.");
    const data = editData[id];
    try {
      await api.put(`/admin/products/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditingId(null);
      await fetchProducts();
    } catch (err) {
      console.error("Error updating product:", err);
    }
  };

  const cancelEdit = () => setEditingId(null);

  return (
    <div className="admin-container">
      <h1>Admin Panel</h1>

      <section className="add-section">
        <h2>Add Product</h2>
        <div className="add-form">
          <input
            placeholder="Product name"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
          />

          <select
            className="styled-select"
            value={newProduct.brand}
            onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
          >
            <option value="">Select brand</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <select
            className="styled-select"
            value={newProduct.category}
            onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Price"
            value={newProduct.price || ""}
            onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
          />
          <input
            type="number"
            placeholder="Discount (%)"
            value={newProduct.off || ""}
            onChange={(e) => setNewProduct({ ...newProduct, off: Number(e.target.value) })}
          />
          <input
            placeholder="Description"
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
          />

          <label className="file-upload">
            <input type="file" accept="image/*" onChange={handleNewFile} />
            📁 Choose File
          </label>
          {fileName && <span className="file-name">Selected: {fileName}</span>}

          {newProduct.img && (
            <div className="preview">
              <img src={newProduct.img} alt="preview" />
            </div>
          )}

          <button onClick={addProduct}>Add Product</button>
        </div>
      </section>

      <hr />

      <section>
        <h2>Products</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="product-grid">
            {products.map((p) => {
              const isEditing = editingId === p._id;
              const edit = editData[p._id || ""] || p;
              return (
                <div key={p._id} className="product-card">
                  <div className="product-thumb">
                    <img
                      src={p.img || "https://placehold.co/400x400?text=No+Image"}
                      alt={p.name}
                      onError={(e) =>
                      ((e.target as HTMLImageElement).src =
                        "https://placehold.co/400x400?text=No+Image")
                      }
                    />
                    {p.off > 0 && <span className="badge">-{p.off}%</span>}
                  </div>

                  {!isEditing ? (
                    <>
                      <h3>{p.name}</h3>
                      <p>{p.brand}</p>
                      <p>{p.category}</p>
                      <p>
                        <b>₴{p.price}</b> (-{p.off}%)
                      </p>
                      <div className="card-actions">
                        <button onClick={() => startEdit(p)}>Edit</button>
                        <button className="danger" onClick={() => deleteProduct(p._id)}>
                          Delete
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="edit-form">
                      <input
                        placeholder="Name"
                        value={edit.name}
                        onChange={(e) => handleEditChange(p._id!, "name", e.target.value)}
                      />

                      <select
                        className="styled-select"
                        value={edit.brand}
                        onChange={(e) => handleEditChange(p._id!, "brand", e.target.value)}
                      >
                        {brands.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>

                      <select
                        className="styled-select"
                        value={edit.category}
                        onChange={(e) => handleEditChange(p._id!, "category", e.target.value)}
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        placeholder="Price"
                        value={edit.price}
                        onChange={(e) => handleEditChange(p._id!, "price", Number(e.target.value))}
                      />
                      <input
                        type="number"
                        placeholder="Discount (%)"
                        value={edit.off}
                        onChange={(e) => handleEditChange(p._id!, "off", Number(e.target.value))}
                      />
                      <input
                        placeholder="Description"
                        value={edit.description}
                        onChange={(e) => handleEditChange(p._id!, "description", e.target.value)}
                      />

                      <label className="file-upload">
                        <input type="file" accept="image/*" onChange={(e) => handleEditFile(p._id!, e)} />
                        📁 Choose File
                      </label>
                      {editFileNames[p._id!] && (
                        <span className="file-name">Selected: {editFileNames[p._id!]}</span>
                      )}

                      {edit.img && (
                        <div className="preview">
                          <img src={edit.img} alt="preview" />
                        </div>
                      )}
                      <div className="card-actions">
                        <button onClick={() => saveEdit(p._id!)}>Save</button>
                        <button className="danger" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminPanel;
