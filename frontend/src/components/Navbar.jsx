import { Link } from "react-router-dom";
import { Leaf, Menu } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed left-0 top-0 z-50 w-full border-b border-green-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        <Link to="/" className="flex items-center gap-2">
          <div className="rounded-xl bg-green-600 p-2 text-white">
            <Leaf size={24} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-green-800">
              AgroConnect 360
            </h1>
            <p className="text-xs text-gray-500">Smart Agriculture</p>
          </div>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-gray-600 hover:text-green-600">
            Features
          </a>

          <a href="#roles" className="text-gray-600 hover:text-green-600">
            Users
          </a>

          <a href="#ai" className="text-gray-600 hover:text-green-600">
            AI Solutions
          </a>

          <a href="#about" className="text-gray-600 hover:text-green-600">
            About
          </a>
        </div>

        <div className="hidden items-center md:flex">
  <Link
    to="/login"
    className="rounded-lg bg-green-600 px-6 py-2.5 font-semibold text-white transition hover:bg-green-700"
  >
    Login / Get Started
  </Link>
</div>

<button
  onClick={() => setOpen(!open)}
  className="md:hidden"
>
  <Menu />
</button>
</div>

{open && (
  <div className="border-t bg-white px-6 py-5 md:hidden">
    <div className="flex flex-col gap-4">
      <a href="#features">Features</a>
      <a href="#roles">Users</a>
      <a href="#ai">AI Solutions</a>
      <a href="#about">About</a>

      <Link
        to="/login"
        onClick={() => setOpen(false)}
        className="rounded-lg bg-green-600 px-4 py-2 text-center font-semibold text-white"
      >
        Login / Get Started
      </Link>
    </div>
  </div>
)}
</nav>
);
}