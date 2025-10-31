"use client";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <>
      <div className="border-b border-gray-200 shadow-md flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="py-4 cursor-pointer">
            <Image src="/hdl.svg" alt="Logo" width={100} height={100} />
          </Link>
          {isAuthenticated && (
            <span className="text-lg font-semibold text-gray-800">
              Welcome, {user?.username}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search Experiences..."
            className="border border-gray-300 rounded-sm px-5 py-3 md:w-96 bg-gray-100"
          />
          <button className="bg-yellow-400 text-black rounded-sm px-4 py-3 font-medium">
            Search
          </button>
          {isAuthenticated ? (
            <>
              <Link href="/my-orders">
                <button className="bg-green-500 text-white rounded-sm px-4 py-3 font-medium ml-2">
                  My Bookings
                </button>
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white rounded-sm px-4 py-3 font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login">
              <button className="bg-blue-500 text-white rounded-sm px-4 py-3 font-medium ml-2">
                Login
              </button>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
