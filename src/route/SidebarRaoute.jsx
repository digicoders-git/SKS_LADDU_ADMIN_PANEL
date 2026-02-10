import { lazy } from "react";
import {
  FaCoins,
  FaUsers,
  FaBox,
  FaTachometerAlt,
  FaShoppingCart,
  FaEnvelopeOpenText,
  FaImages,
  FaKey,
  FaBlog,
  FaVideo,
  FaMoneyBillWave,
} from "react-icons/fa";

// pages
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Categories = lazy(() => import("../pages/Categories"));
const Products = lazy(() => import("../pages/Products"));
const Offers = lazy(() => import("../pages/Offers"));
const Orders = lazy(() => import("../pages/Orders"));
const Enquiries = lazy(() => import("../pages/Enquiries"));
const Sliders = lazy(() => import("../pages/Sliders"));
const ReviewVideos = lazy(() => import("../pages/ReviewVideos"));
const Blogs = lazy(() => import("../pages/Blogs"));
const ChangePassword = lazy(() => import("../pages/ChangePassword"));
const Users = lazy(() => import("../pages/Users"));
const PayMethods = lazy(() => import("../pages/PayMethods"));

const routes = [
  { path: "/dashboard", component: Dashboard, name: "Dashboard", icon: FaTachometerAlt },
  { path: "/users", component: Users, name: "Users", icon: FaUsers },
  { path: "/categories", component: Categories, name: "Categories", icon: FaBox },
  { path: "/products", component: Products, name: "Products", icon: FaBox },
  // { path: "/offers", component: Offers, name: "Offers", icon: FaCoins },
  { path: "/orders", component: Orders, name: "Orders", icon: FaShoppingCart },
  { path: "/enquiries", component: Enquiries, name: "Enquiries", icon: FaEnvelopeOpenText },
  { path: "/sliders", component: Sliders, name: "Sliders", icon: FaImages },
  { path: "/review-videos", component: ReviewVideos, name: "Review Videos", icon: FaVideo },
  { path: "/pay-methods", component: PayMethods, name: "Pay Methods", icon: FaMoneyBillWave },
  // { path: "/blogs", component: Blogs, name: "Blogs", icon: FaBlog },
  { path: "/change-password", component: ChangePassword, name: "Change Password", icon: FaKey },
];

export default routes;
