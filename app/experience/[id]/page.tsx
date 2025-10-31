"use client";
import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import Navbar from "../../../components/navbar";
import { useAuth } from "../../../context/AuthContext";

interface PackageDetails {
  id: string;
  title: string;
  description: string;
  thumbnailImages: string[];
  location: string;
  price: number;
  duration: number;
  availableSlots: number;
  itinerary: string;
  inclusions: string;
  exclusions: string;
}

interface Coupon {
  id: number;
  code: string;
  discountPercentage: number;
  validFrom: string;
  validUntil: string;
}

function ExperienceDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const [packageData, setPackageData] = useState<PackageDetails | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>(
    {}
  );
  const { isAuthenticated } = useAuth();

  const TAX_RATE = 0.18;

  const handleImageError = (index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [packageResponse, couponsResponse] = await Promise.all([
          axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/experiences/${id}`
          ),
          axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/order/coupons/${id}`
          ),
        ]);
        setPackageData(packageResponse.data.package);
        setCoupons(couponsResponse.data.coupons || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      alert("Please login to add favorites");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (isFavorited) {
        await axios.delete(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/experiences/${id}/favourite`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/experiences/${id}/favourite`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
      setIsFavorited(!isFavorited);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="w-full h-96 bg-gray-300 rounded-lg mb-6"></div>
            <div className="h-8 bg-gray-300 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = packageData ? packageData.price * quantity : 0;
  const discountAmount = subtotal * (discount / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxes = taxableAmount * TAX_RATE;
  const total = taxableAmount + taxes;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/order/validate-coupon`,
        {
          packageId: id,
          couponCode: couponCode,
        }
      );
      setDiscount(response.data.discountPercentage);
      setCouponApplied(true);
      setCouponError("");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Invalid coupon code";
      setCouponError(errorMessage);
      setDiscount(0);
      setCouponApplied(false);
    }
  };

  const handleBookNow = async () => {
    if (!isAuthenticated) {
      alert("Please login to book this experience");
      router.push("/login");
      return;
    }

    if (!startDate) {
      alert("Please select a journey start date");
      return;
    }

    const endDate = new Date(
      new Date(startDate).getTime() +
        (packageData?.duration || 1) * 24 * 60 * 60 * 1000
    );

    const confirmBooking = confirm(
      `Confirm booking for ${quantity} person(s)?\n` +
        `Start Date: ${new Date(startDate).toLocaleDateString()}\n` +
        `End Date: ${endDate.toLocaleDateString()}\n` +
        `Total: ₹${total.toFixed(2)}`
    );

    if (!confirmBooking) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/order/experiences/${id}/book`,
        {
          numberOfPeople: quantity,
          couponCode: couponApplied ? couponCode : undefined,
          startDate: startDate,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const message =
        `🎉 Booking Successful!\n\n` +
        `Order ID: ${response.data.order.id}\n` +
        `Experience: ${packageData?.title}\n` +
        `Participants: ${quantity}\n` +
        `Total Paid: ₹${total.toFixed(2)}\n\n` +
        `${
          response.data.savedAmount > 0
            ? `You saved ₹${response.data.savedAmount.toFixed(2)}!\n\n`
            : ""
        }` +
        `A confirmation email has been sent to your registered email address.`;

      alert(message);
      router.push("/");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Booking failed. Please try again.";
      alert("❌ " + errorMessage);
    }
  };

  if (!packageData) {
    return (
      <div>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Package not found</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="grid grid-cols-2 gap-3 mb-6">
                {packageData.thumbnailImages.map((img, index) => (
                  <div key={index} className={index === 0 ? "col-span-2" : ""}>
                    {imageErrors[index] ? (
                      <div
                        className="w-full rounded-lg bg-linear-to-br from-gray-200 to-gray-300 flex items-center justify-center"
                        style={{ height: index === 0 ? "350px" : "250px" }}
                      >
                        <div className="text-center">
                          <div className="text-6xl mb-2">🏔️</div>
                          <p className="text-gray-600 font-medium">
                            {packageData.title}
                          </p>
                          <p className="text-gray-500 text-sm">
                            Image {index + 1}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <Image
                        src={img || "/placeholder.jpg"}
                        alt={`${packageData.title} ${index + 1}`}
                        width={600}
                        height={index === 0 ? 350 : 250}
                        className="w-full rounded-lg object-cover"
                        style={{ height: index === 0 ? "350px" : "250px" }}
                        onError={() => handleImageError(index)}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">
                      {packageData.title}
                    </h1>
                    <div className="flex items-center gap-2">
                      <span className="bg-gray-300 rounded-lg px-3 py-1">
                        {packageData.location}
                      </span>
                      <span className="text-gray-600">
                        {packageData.duration} days
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleFavorite}
                    className="text-3xl focus:outline-none"
                  >
                    {isFavorited ? "❤️" : "🤍"}
                  </button>
                </div>

                <div className="border-t border-gray-200 pt-4 mb-4">
                  <h2 className="text-2xl font-semibold mb-2">Description</h2>
                  <p className="text-gray-700">{packageData.description}</p>
                </div>

                {packageData.itinerary && (
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <h2 className="text-2xl font-semibold mb-2">Itinerary</h2>
                    <p className="text-gray-700 whitespace-pre-line">
                      {packageData.itinerary}
                    </p>
                  </div>
                )}

                {packageData.inclusions && (
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <h2 className="text-2xl font-semibold mb-2">Inclusions</h2>
                    <p className="text-gray-700 whitespace-pre-line">
                      {packageData.inclusions}
                    </p>
                  </div>
                )}

                {packageData.exclusions && (
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <h2 className="text-2xl font-semibold mb-2">Exclusions</h2>
                    <p className="text-gray-700 whitespace-pre-line">
                      {packageData.exclusions}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 sticky top-4">
                <div className="mb-4">
                  <p className="text-gray-600 text-sm">Starts at</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ₹{packageData.price}
                  </p>
                  <p className="text-sm text-gray-500">per person</p>
                </div>

                <div className="border-t border-gray-200 pt-4 mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Journey Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  {startDate && packageData.duration && (
                    <p className="text-xs text-gray-600 mt-1">
                      End Date:{" "}
                      {new Date(
                        new Date(startDate).getTime() +
                          packageData.duration * 24 * 60 * 60 * 1000
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4 mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="text-xl font-semibold w-12 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity(
                          Math.min(packageData.availableSlots, quantity + 1)
                        )
                      }
                      className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {packageData.availableSlots} slots available
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-4 mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apply Coupon
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                      }
                      placeholder="Enter code"
                      disabled={couponApplied}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:bg-gray-100"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponApplied}
                      className="px-4 py-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {couponApplied ? "Applied" : "Apply"}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-red-600 text-xs mt-1">{couponError}</p>
                  )}
                  {couponApplied && (
                    <p className="text-green-600 text-xs mt-1">
                      Coupon applied! {discount}% off
                    </p>
                  )}

                  {coupons.length > 0 && !couponApplied && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        Available Coupons:
                      </p>
                      <div className="space-y-2">
                        {coupons.map((coupon) => (
                          <div
                            key={coupon.id}
                            className="flex items-center justify-between text-xs bg-white p-2 rounded border border-yellow-300 cursor-pointer hover:bg-yellow-100"
                            onClick={() => {
                              setCouponCode(coupon.code);
                              setCouponError("");
                            }}
                          >
                            <div>
                              <span className="font-bold text-yellow-700">
                                {coupon.code}
                              </span>
                              <span className="text-gray-600 ml-2">
                                {coupon.discountPercentage}% OFF
                              </span>
                            </div>
                            <button className="text-yellow-600 font-medium">
                              Apply
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4 mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">
                        Discount ({discount}%)
                      </span>
                      <span className="font-medium text-green-600">
                        -₹{discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Taxes (18%)</span>
                    <span className="font-medium">₹{taxes.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleBookNow}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 rounded-lg transition-colors"
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExperienceDetails() {
  return (
    <Suspense
      fallback={
        <div>
          <Navbar />
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse">
              <div className="w-full h-96 bg-gray-300 rounded-lg mb-6"></div>
              <div className="h-8 bg-gray-300 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      }
    >
      <ExperienceDetailsContent />
    </Suspense>
  );
}
