"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Navbar from "../../components/navbar";
import { useAuth } from "../../context/AuthContext";
import Image from "next/image";

export const dynamic = "force-dynamic";

interface Package {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  duration: number;
  thumbnailImages: string[];
}

interface Order {
  id: number;
  start: string;
  end: string;
  numberOfPeople: number;
  totalPrice: number;
  yourPrice: number;
  status: string;
  paymentMethod: string;
  completed: boolean;
  package: Package;
}

export default function MyOrders() {
  const [upcomingJourneys, setUpcomingJourneys] = useState<Order[]>([]);
  const [pastJourneys, setPastJourneys] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/order/my-orders`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUpcomingJourneys(response.data.upcomingJourneys);
        setPastJourneys(response.data.pastJourneys);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, router]);

  const OrderCard = ({ order }: { order: Order }) => {
    const isUpcoming = new Date(order.start) > new Date();

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3">
            <Image
              src={order.package.thumbnailImages[0] || "/placeholder.jpg"}
              alt={order.package.title}
              width={300}
              height={200}
              className="w-full h-48 object-cover"
            />
          </div>
          <div className="flex-1 p-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold text-gray-900">
                {order.package.title}
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  isUpcoming
                    ? "bg-green-100 text-green-800"
                    : order.completed
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {isUpcoming
                  ? "Upcoming"
                  : order.completed
                  ? "Completed"
                  : "Past"}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-3">
              📍 {order.package.location}
            </p>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-xs text-gray-500">Journey Dates</p>
                <p className="text-sm font-semibold">
                  {new Date(order.start).toLocaleDateString()} -{" "}
                  {new Date(order.end).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Participants</p>
                <p className="text-sm font-semibold">
                  {order.numberOfPeople} person
                  {order.numberOfPeople > 1 ? "s" : ""}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Booking ID</p>
                <p className="text-sm font-semibold">#{order.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-sm font-semibold capitalize">
                  {order.status}
                </p>
              </div>
            </div>
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center">
                <div>
                  {order.totalPrice !== order.yourPrice && (
                    <p className="text-xs text-gray-500 line-through">
                      ₹{order.totalPrice.toFixed(2)}
                    </p>
                  )}
                  <p className="text-lg font-bold text-gray-900">
                    ₹{order.yourPrice.toFixed(2)}
                  </p>
                  {order.totalPrice !== order.yourPrice && (
                    <p className="text-xs text-green-600">
                      Saved ₹{(order.totalPrice - order.yourPrice).toFixed(2)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => router.push(`/experience/${order.package.id}`)}
                  className="px-4 py-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500 font-medium"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-6 py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="h-48 bg-gray-300 rounded"></div>
            <div className="h-48 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Bookings</h1>

        {upcomingJourneys.length === 0 && pastJourneys.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🏔️</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              No bookings yet
            </h2>
            <p className="text-gray-500 mb-6">
              Start your adventure by booking an experience!
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-yellow-400 text-black rounded-md hover:bg-yellow-500 font-medium"
            >
              Explore Experiences
            </button>
          </div>
        ) : (
          <>
            {upcomingJourneys.length > 0 && (
              <div className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Upcoming Journeys ({upcomingJourneys.length})
                </h2>
                <div className="space-y-4">
                  {upcomingJourneys.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </div>
            )}

            {pastJourneys.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Past Journeys ({pastJourneys.length})
                </h2>
                <div className="space-y-4">
                  {pastJourneys.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
