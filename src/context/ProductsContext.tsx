import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "../api/api";

export interface Product {
  _id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  off: number;
  description?: string;
  img?: string;
}

interface ProductsContextType {
  products: Product[];
  loading: boolean;
  hasMore: boolean;
  reload: (filters?: { category?: string; brand?: string }) => void;
  loadMore: () => void;
}

const ProductsContext = createContext<ProductsContextType | undefined>(
  undefined
);

export const ProductsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<{ category?: string; brand?: string }>(
    {}
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // ==============================
  //   MAIN FETCH FUNCTION
  // ==============================
  const fetchProducts = useCallback(
    async (newPage = 1, append = false) => {
      setLoading(true);
      try {
        const { data } = await api.get("/api/products/filter", {
          params: { ...filters, page: newPage, limit: 20 },
        });

        const list = Array.isArray(data?.products)
          ? data.products
          : Array.isArray(data)
            ? data
            : [];

        setProducts((prev) => (append ? [...prev, ...list] : list));
        setHasMore(newPage < (data.pages || 1));
      } catch (err) {
        console.error("Ошибка загрузки товаров:", err);
        setProducts([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  // ==============================
  //    RELOAD WITH NEW FILTERS
  // ==============================
  const reload = useCallback((newFilters?: { category?: string; brand?: string }) => {
    setFilters(newFilters || {});
    setPage(1);
  }, []);

  // ==============================
  //    LOAD MORE
  // ==============================
  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore, loading]);

  // ==============================
  //    FETCH ON FILTER CHANGE
  // ==============================
  useEffect(() => {
    fetchProducts(1, false);
  }, [fetchProducts, JSON.stringify(filters)]);

  // ==============================
  //    LOAD NEXT PAGE
  // ==============================
  useEffect(() => {
    if (page > 1) fetchProducts(page, true);
  }, [page, fetchProducts]);

  return (
    <ProductsContext.Provider
      value={{ products, loading, hasMore, reload, loadMore }}
    >
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const ctx = useContext(ProductsContext);
  if (!ctx)
    throw new Error("useProducts must be used within a ProductsProvider");
  return ctx;
};
