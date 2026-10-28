import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import AddProductsPage from "./pages/AddProductsPage";
import AdminDashboardPage from "./pages/AdminDashboard";
import CarouselManagerPage from "./pages/CarouselManagerPage";
import CategoryManagementPage from "./pages/CategoryManagementPage";
import Documentation from "./pages/Documentation";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentPage from "./pages/PaymentPage";
import ProfilePage from "./pages/ProfilePage";
import Store from "./pages/Store";

export default function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Store} />
      <Route path={"/products"} component={ProductsPage} />
      <Route path={"/products/:id"} component={ProductDetailPage} />
      <Route path={"/cart"} component={CartPage} />
      <Route path={"/checkout"} component={CheckoutPage} />
      <Route path={"/payment"} component={PaymentPage} />
      <Route path={"/profile"} component={ProfilePage} />
      <Route path={"/add-products"} component={AddProductsPage} />
      <Route path={"/carousel-manager"} component={CarouselManagerPage} />
      <Route path={"/admin"} component={AdminDashboardPage} />
      <Route path={"/categories"} component={CategoryManagementPage} />
      <Route path={"/docs"} component={Documentation} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}
