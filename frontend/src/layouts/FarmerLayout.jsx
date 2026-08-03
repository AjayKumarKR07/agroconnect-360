import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import {
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  IndianRupee,
  LayoutDashboard,
  Leaf,
  LogOut,
  PackageSearch,
  ScanLine,
  ShoppingBag,
  ShoppingCart,
  Sprout,
  User,
} from "lucide-react";

export default function FarmerLayout() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const user = JSON.parse(
    localStorage.getItem("agroconnect_user") || "{}"
  );

  const handleLogout = () => {
    localStorage.removeItem("agroconnect_token");
    localStorage.removeItem("agroconnect_user");
    navigate("/login", { replace: true });
  };

  const menuItems = [
    {
      name: "Dashboard",
      path: "/farmer/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "My Crops",
      path: "/farmer/crops",
      icon: Sprout,
    },
    {
      name: "Orders",
      path: "/farmer/orders",
      icon: ShoppingCart,
    },
    {
      name: "Income",
      path: "/farmer/income",
      icon: IndianRupee,
    },
    {
      name: "Weather",
      path: "/farmer/weather",
      icon: CloudSun,
    },
    {
      name: "Disease Detection",
      path: "/farmer/disease-detection",
      icon: ScanLine,
    },
    {
      name: "Price Prediction",
      path: "/farmer/price-prediction",
      icon: BarChart3,
    },
    {
  name: "Market Trends",
  path: "/farmer/market-trends",
  icon: BarChart3,
},
    {
      name: "Buy Inputs",
      path: "/farmer/inputs",
      icon: ShoppingBag,
    },
    {
      name: "Export",
      path: "/farmer/export",
      icon: PackageSearch,
    },
    {
      name: "AI Assistant",
      path: "/farmer/assistant",
      icon: Bot,
    },
    {
      name: "Profile",
      path: "/farmer/profile",
      icon: User,
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-white transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b px-5">
          <div className="flex items-center gap-3 text-green-700">
            <Leaf size={28} />

            {!collapsed && (
              <div>
                <p className="font-bold">
                  AgroConnect 360
                </p>

                <p className="text-xs text-gray-400">
                  Farmer Portal
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                      isActive
                        ? "bg-green-600 text-white"
                        : "text-gray-600 hover:bg-green-50 hover:text-green-700"
                    }`
                  }
                >
                  <Icon size={20} />

                  {!collapsed && (
                    <span className="text-sm font-medium">
                      {item.name}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="border-t p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-red-600 hover:bg-red-50"
          >
            <LogOut size={20} />

            {!collapsed && (
              <span className="font-medium">
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div
        className={`min-h-screen flex-1 transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b bg-white px-8">

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg border p-2 text-gray-500 hover:bg-gray-50"
          >
            {collapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>

          <div className="text-right">
            <p className="font-semibold text-gray-800">
              {user.name || "Farmer"}
            </p>

            <p className="text-xs text-gray-500">
              Farmer
            </p>
          </div>

        </header>

        {/* Child pages */}
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}