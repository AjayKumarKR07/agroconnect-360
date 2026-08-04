import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <h1 className="text-7xl font-bold text-green-700">404</h1>

      <h2 className="mt-4 text-2xl font-semibold">
        Page Not Found
      </h2>

      <Link
        to="/"
        className="mt-6 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white"
      >
        Return Home
      </Link>
    </div>
  );
}