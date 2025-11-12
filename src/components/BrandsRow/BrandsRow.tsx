import { NavLink, useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import "./style.css"

const brandsByCategory: Record<string, string[]> = {
  smartphones: ["Apple", "Samsung", "Xiaomi"],
  laptops: ["Apple", "Dell", "HP"],
  headphones: ["Sony", "Bose", "JBL"],
  watches: ["Apple", "Garmin", "Samsung"],
}

const BrandsRow: React.FC = () => {
  const { category } = useParams<{ category?: string }>()
  const [loaded, setLoaded] = useState(false)

  const categoryKey = category?.toLowerCase() || "smartphones"
  const brands = brandsByCategory[categoryKey] || []

  // Эффект для плавного появления
  useEffect(() => {
    setLoaded(false)
    const timeout = setTimeout(() => setLoaded(true), 100)
    return () => clearTimeout(timeout)
  }, [categoryKey])

  return (
    <div className={`brands-row ${loaded ? "loaded" : "loading"}`}>
      {brands.length > 0
        ? brands.map((brand) => (
          <NavLink
            key={brand}
            to={`/products/${categoryKey}/${brand.toLowerCase()}`}
            className={({ isActive }) =>
              `brand-link ${isActive ? "active" : ""}`
            }
          >
            {brand}
          </NavLink>
        ))
        : // если нет брендов — рисуем скелеты, чтобы не прыгало
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="brand-skeleton"></div>
        ))}
    </div>
  )
}

export default BrandsRow
