import { NavLink } from "react-router-dom";
import { Smartphone, Laptop, Headphones, Watch } from "lucide-react";
import "./style.css";

const categories = [
  { name: "Smartphones", icon: Smartphone },
  { name: "Laptops", icon: Laptop },
  { name: "Headphones", icon: Headphones },
  { name: "Watches", icon: Watch },
];

const CategoriesRow: React.FC = () => {
  return (
    <div className="categories-row">
      {categories.map(({ name, icon: Icon }) => (
        <NavLink
          key={name}
          to={`/products/${name.toLowerCase()}`}
          className={({ isActive }) =>
            `category-link ${isActive ? "active" : ""}`
          }
        >
          <Icon size={24} />
          <span>{name}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default CategoriesRow;
