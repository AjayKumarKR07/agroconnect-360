import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";


// Public pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import VerifyOTP from "./pages/VerifyOTP";
import CompleteProfile from "./pages/CompleteProfile";
import RoleSelection from "./pages/RoleSelection";
import NotFound from "./pages/NotFound";

// Protection
import ProtectedRoute from "./components/ProtectedRoute";

// Farmer
import FarmerLayout from "./layouts/FarmerLayout";
import FarmerDashboard from "./dashboards/farmer/FarmerDashboard";
import MyCrops from "./dashboards/farmer/MyCrops";
import AddCrop from "./dashboards/farmer/AddCrop";
import EditCrop from "./dashboards/farmer/EditCrop";
import ViewCrop from "./dashboards/farmer/ViewCrop";
import Orders from "./dashboards/farmer/Orders";
import Income from "./dashboards/farmer/Income";
import Weather from "./dashboards/farmer/Weather";
import CropDiagnosis from "./dashboards/farmer/CropDiagnosis";
import PricePrediction from "./dashboards/farmer/PricePrediction";
import MarketTrends from "./pages/MarketTrends";
import BuyInputs from "./dashboards/farmer/BuyInputs";
import ExportPage from "./dashboards/farmer/ExportPage";
import AIAssistant from "./dashboards/farmer/AIAssistant";
import FarmerProfile from "./dashboards/farmer/FarmerProfile";
import SmartFarmPlanner from "./dashboards/farmer/SmartFarmPlanner";
import MyFarm from "./dashboards/farmer/MyFarm";
import SavedFarmPlans from "./dashboards/farmer/SavedFarmPlans";
import FarmAnalytics from "./dashboards/farmer/FarmAnalytics";
import FarmerNotifications from "./dashboards/farmer/FarmerNotifications";
import CropHealthHistory from "./dashboards/farmer/CropHealthHistory";
import MarketComparison from "./dashboards/farmer/MarketComparison";

// Seller
import SellerLayout from "./layouts/SellerLayout";
import SellerDashboard from "./dashboards/seller/SellerDashboard";
import SellerProducts from "./dashboards/seller/SellerProducts";
import AddSellerProduct from "./dashboards/seller/AddSellerProduct";
import SellerOrders from "./dashboards/seller/SellerOrders";
import SellerRevenue from "./dashboards/seller/SellerRevenue";
import EditSellerProduct from "./dashboards/seller/EditSellerProduct";
import SellerProcurement from "./dashboards/seller/SellerProcurement";
import SellerAnalytics from "./dashboards/seller/SellerAnalytics";
import SellerLogistics from "./dashboards/seller/SellerLogistics";

// User / Buyer
import UserLayout from "./layouts/UserLayout";
import UserDashboard from "./dashboards/user/UserDashboard";
import BrowseProducts from "./dashboards/user/BrowseProducts";
import UserOrders from "./dashboards/user/UserOrders";
import UserWishlist from "./dashboards/user/UserWishlist";
import UserCart from "./dashboards/user/UserCart";
import UserSubscriptions from "./dashboards/user/UserSubscriptions";
import UserInquiries from "./dashboards/user/UserInquiries";
import UserAlerts from "./dashboards/user/UserAlerts";
import BuyerProfile from "./dashboards/user/BuyerProfile";

// Exporter
import ExporterLayout from "./layouts/ExporterLayout";
import ExporterDashboard from "./dashboards/exporter/ExporterDashboard";
import ExportSourcing from "./dashboards/exporter/ExportSourcing";
import ExportLogistics from "./dashboards/exporter/ExportLogistics";
import ExportCompliance from "./dashboards/exporter/ExportCompliance";
import ExportMarkets from "./dashboards/exporter/ExportMarkets";
import ExportColdChain from "./dashboards/exporter/ExportColdChain";
import ExportContracts from "./dashboards/exporter/ExportContracts";
import ExportCalculator from "./dashboards/exporter/ExportCalculator";

// Admin
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./dashboards/admin/AdminDashboard";
import AdminUsers from "./dashboards/admin/AdminUsers";
import AdminCrops from "./dashboards/admin/AdminCrops";
import AdminFinance from "./dashboards/admin/AdminFinance";
import AdminDisputes from "./dashboards/admin/AdminDisputes";
import AdminSystem from "./dashboards/admin/AdminSystem";
import AdminAuditLogs from "./dashboards/admin/AdminAuditLogs";
import AdminBroadcast from "./dashboards/admin/AdminBroadcast";
import AdminOrders from "./dashboards/admin/AdminOrders";
import AdminExports from "./dashboards/admin/AdminExports";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            PUBLIC ROUTES
        ========================== */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/verify-otp"
          element={<VerifyOTP />}
        />

        <Route
          path="/complete-profile"
          element={<CompleteProfile />}
        />

        <Route
          path="/select-role"
          element={<RoleSelection />}
        />

        {/* =========================
    FARMER ROUTES
========================== */}

<Route
  path="/farmer"
  element={
    <ProtectedRoute allowedRole="farmer">
      <FarmerLayout />
    </ProtectedRoute>
  }
>
  {/* Farmer Dashboard */}
  <Route index element={<Navigate to="dashboard" replace />} />
  <Route
    path="dashboard"
    element={<FarmerDashboard />}
  />

  {/* My Crops */}
  <Route
    path="crops"
    element={<MyCrops />}
  />

  {/* Add Crop */}
  <Route
    path="crops/add"
    element={<AddCrop />}
  />

  {/* Edit Crop */}
  <Route
    path="crops/:id/edit"
    element={<EditCrop />}
  />

  <Route
  path="crops/:id"
  element={<ViewCrop />}
/>

<Route
  path="orders"
  element={<Orders />}
/>
<Route
  path="income"
  element={<Income />}
/>
<Route
  path="weather"
  element={<Weather />}
/>
<Route
  path="disease-detection"
  element={<CropDiagnosis />}
/>
<Route
  path="price-prediction"
  element={<PricePrediction />}
/>

<Route
  path="market-trends"
  element={<MarketTrends />}
/>

<Route
  path="inputs"
  element={<BuyInputs />}
/>

<Route
  path="export"
  element={<ExportPage />}
/>

<Route
  path="assistant"
  element={<AIAssistant />}
/>

<Route
  path="smart-farm-planner"
  element={<SmartFarmPlanner />}
/>

<Route path="profile" element={<FarmerProfile />} />

  {/* New Farmer Pages */}
  <Route path="my-farm"             element={<MyFarm />} />
  <Route path="saved-plans"         element={<SavedFarmPlans />} />
  <Route path="farm-analytics"      element={<FarmAnalytics />} />
  <Route path="notifications"       element={<FarmerNotifications />} />
  <Route path="crop-health-history" element={<CropHealthHistory />} />
  <Route path="market-comparison"   element={<MarketComparison />} />

</Route>


        {/* =========================
            SELLER ROUTES
        ========================== */}
        <Route
          path="/seller"
          element={
            <ProtectedRoute allowedRole="seller">
              <SellerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"     element={<SellerDashboard />} />

          <Route path="products"            element={<SellerProducts />} />
          <Route path="products/add"        element={<AddSellerProduct />} />
          <Route path="products/:id/edit"   element={<EditSellerProduct />} />
          <Route path="orders"            element={<SellerOrders />} />
          <Route path="procurement"        element={<SellerProcurement />} />
          <Route path="revenue"            element={<SellerRevenue />} />
          <Route path="analytics"          element={<SellerAnalytics />} />
          <Route path="logistics"          element={<SellerLogistics />} />
          <Route path="market-trends" element={<MarketTrends />} />
          <Route path="assistant"     element={<AIAssistant />} />
          <Route path="profile"       element={<FarmerProfile />} />
        </Route>

        {/* =========================
            USER / BUYER ROUTES
        ========================== */}
        <Route
          path="/user"
          element={
            <ProtectedRoute allowedRole="user">
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"     element={<UserDashboard />} />
          <Route path="browse"        element={<BrowseProducts />} />
          <Route path="orders"        element={<UserOrders />} />
          <Route path="wishlist"      element={<UserWishlist />} />
          <Route path="cart"          element={<UserCart />} />
          <Route path="subscriptions" element={<UserSubscriptions />} />
          <Route path="inquiries"     element={<UserInquiries />} />
          <Route path="alerts"        element={<UserAlerts />} />
          <Route path="assistant"     element={<AIAssistant />} />
          <Route path="market-trends" element={<MarketTrends />} />
          <Route path="profile"       element={<BuyerProfile />} />
        </Route>

        {/* =========================
            EXPORTER ROUTES
        ========================== */}
        <Route
          path="/exporter"
          element={
            <ProtectedRoute allowedRole="exporter">
              <ExporterLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"     element={<ExporterDashboard />} />
          <Route path="sourcing"      element={<ExportSourcing />} />
          <Route path="logistics"     element={<ExportLogistics />} />
          <Route path="cold-chain"    element={<ExportColdChain />} />
          <Route path="contracts"     element={<ExportContracts />} />
          <Route path="compliance"    element={<ExportCompliance />} />
          <Route path="calculator"   element={<ExportCalculator />} />
          <Route path="markets"       element={<ExportMarkets />} />
          <Route path="assistant"     element={<AIAssistant />} />
          <Route path="profile"       element={<FarmerProfile />} />
        </Route>

        {/* =========================
            ADMIN ROUTES
        ========================== */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users"     element={<AdminUsers />} />
          <Route path="crops"     element={<AdminCrops />} />
          <Route path="broadcast" element={<AdminBroadcast />} />
          <Route path="audit-logs"element={<AdminAuditLogs />} />
          <Route path="finance"   element={<AdminFinance />} />

          <Route path="disputes"  element={<AdminDisputes />} />
          <Route path="system"    element={<AdminSystem />} />
          <Route path="orders"    element={<AdminOrders />} />
          <Route path="exports"   element={<AdminExports />} />
          <Route path="profile"   element={<FarmerProfile />} />
        </Route>


        {/* =========================
            404
        ========================== */}

        <Route
          path="*"
          element={<NotFound />}
        />

      </Routes>
    </BrowserRouter>
  );
}