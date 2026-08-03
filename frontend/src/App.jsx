import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

// Public pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import VerifyOTP from "./pages/VerifyOTP";
import CompleteProfile from "./pages/CompleteProfile";
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