import { useState } from "react";
import { Link } from "react-router-dom";

import {
  Eye,
  EyeOff,
  Leaf,
  ShoppingCart,
  Sprout,
  Store,
  Truck,
} from "lucide-react";

export default function Register() {
  const [role, setRole] = useState("farmer");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    location: "",
  });

  const roles = [
    {
      id: "farmer",
      name: "Farmer",
      icon: Sprout,
    },
    {
      id: "user",
      name: "Consumer",
      icon: ShoppingCart,
    },
    {
      id: "seller",
      name: "Seller",
      icon: Store,
    },
    {
      id: "exporter",
      name: "Exporter",
      icon: Truck,
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitized = name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;
    setForm({ ...form, [name]: sanitized });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Backend registration will be added later.
    console.log({
      ...form,
      role,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4 py-10">

      <div className="mx-auto w-full max-w-3xl">

        <div className="mb-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-2xl font-bold text-green-700"
          >
            <Leaf />
            AgroConnect 360
          </Link>

          <h1 className="mt-6 text-4xl font-bold">
            Create Your Account
          </h1>

          <p className="mt-2 text-gray-500">
            Join the connected agricultural ecosystem
          </p>
        </div>

        <div className="rounded-3xl border border-green-100 bg-white p-8 shadow-xl">

          {/* ROLE SELECTION */}

          <div>
            <label className="mb-4 block font-semibold text-gray-800">
              I want to join as
            </label>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {roles.map(({ id, name, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setRole(id)}
                  className={`rounded-xl border p-4 transition ${
                    role === id
                      ? "border-green-600 bg-green-50 text-green-700"
                      : "border-gray-200 text-gray-600 hover:border-green-300"
                  }`}
                >
                  <Icon className="mx-auto" size={25} />

                  <p className="mt-2 font-semibold">
                    {name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 grid gap-5 md:grid-cols-2"
          >

            <div>
              <label className="mb-2 block font-medium">
                Full Name *
              </label>

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                type="text"
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Mobile Number *
              </label>

              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                type="tel"
                placeholder="9876543210"
                maxLength={10}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block font-medium">
                Email Address *
              </label>

              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                type="email"
                placeholder="Enter your email address"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-500"
              />

              <p className="mt-2 text-xs text-gray-500">
                We'll verify this email using a one-time password.
              </p>
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Location *
              </label>

              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                required
                type="text"
                placeholder="City / District"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Password *
              </label>

              <div className="relative">
                <input
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength="8"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 outline-none focus:border-green-500"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* FARMER */}

            {role === "farmer" && (
              <div className="md:col-span-2 rounded-xl bg-green-50 p-4 text-sm text-green-800">
                After registration, you can complete your farmer
                profile with farm size, crop types, language preference,
                payment information and other agricultural details.
              </div>
            )}

            {/* SELLER */}

            {role === "seller" && (
              <div className="md:col-span-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                Seller business information and agricultural product
                details will be completed from your Seller Dashboard.
              </div>
            )}

            {/* EXPORTER */}

            {role === "exporter" && (
              <div className="md:col-span-2 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
                Export business information and verification details
                will be completed from your Exporter Dashboard.
              </div>
            )}

            <div className="md:col-span-2">
              <label className="flex items-start gap-3 text-sm text-gray-600">
                <input
                  type="checkbox"
                  required
                  className="mt-1"
                />

                <span>
                  I agree to the Terms of Service and Privacy Policy
                  of AgroConnect 360.
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="md:col-span-2 rounded-xl bg-green-600 py-3.5 font-semibold text-white transition hover:bg-green-700"
            >
              Continue to Email Verification
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-green-600 hover:underline"
            >
              Login
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}