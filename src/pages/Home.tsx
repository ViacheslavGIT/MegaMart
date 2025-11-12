import HeroBanner from "../components/HeroBanner/HeroBanner";
import Footer from "../components/Footer/Footer";
import CategoriesRow from "../components/CategoriesRow/CategoriesRow";
import BrandsRow from "../components/BrandsRow/BrandsRow";
import ProductRow from "../components/ProductRow/ProductRow";

export default function Home() {
  return (
    <div>
      <HeroBanner />
      <CategoriesRow />
      <BrandsRow />
      <ProductRow />
      <Footer />
    </div>
  );
}
