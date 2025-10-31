"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Card({
  id,
  title,
  description,
  imageUrl,
  location,
  price,
  isFavorited: initialFavorited,
  onFavoriteChange,
}) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited || false);
  const [imgError, setImgError] = useState(false);
  const router = useRouter();

  const handleFavorite = async (e) => {
    e.stopPropagation();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to add favorites");
      router.push("/login");
      return;
    }

    try {
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
      if (onFavoriteChange) onFavoriteChange();
    } catch (error) {
      console.error("Error toggling favorite:", error);
      if (error.response?.status === 401) {
        alert("Please login to add favorites");
        router.push("/login");
      }
    }
  };

  const handleViewDetails = () => {
    router.push(`/experience/${id}`);
  };

  return (
    <>
      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-md w-full relative">
        <button
          onClick={handleFavorite}
          className="absolute top-2 right-2 text-2xl z-10 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
        >
          {isFavorited ? "❤️" : "🤍"}
        </button>
        {imgError ? (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center border-b border-gray-200">
            <div className="text-center">
              <div className="text-4xl mb-2">🏔️</div>
              <p className="text-gray-500 text-sm">{title}</p>
            </div>
          </div>
        ) : (
          <Image
            src={imageUrl || "/placeholder.jpg"}
            alt={title}
            width={320}
            height={200}
            className="w-full h-48 object-cover border-b border-gray-200"
            onError={() => setImgError(true)}
          />
        )}
        <div className="p-2 px-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{title}</h3>
            <div className="bg-gray-300 rounded-lg p-2">
              <h3 className="text-md">{location}</h3>
            </div>
          </div>
          <div>
            <p className="text-gray-500 mt-3 wrap-break-word">{description}</p>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <h1>
              From <b className="text-2xl">₹{price}</b>
            </h1>
            <div>
              <button
                onClick={handleViewDetails}
                className="bg-yellow-400 p-2 rounded-sm hover:bg-yellow-500"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
