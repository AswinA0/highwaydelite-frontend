"use client";
import Navbar from "../components/navbar";
import Card from "../components/card";
import { useEffect, useState } from "react";
import axios from "axios";

interface Experience {
  id: string;
  title: string;
  description: string;
  thumbnailImages: string[];
  location: string;
  price: number;
}

export default function Home() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/experiences`
        );
        setExperiences(response.data.experiences);
      } catch (error) {
        console.error("Error fetching experiences:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-6 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-lg overflow-hidden shadow-md animate-pulse bg-white"
              >
                <div className="w-full h-48 bg-gray-300"></div>
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                    <div className="h-8 bg-gray-300 rounded w-20"></div>
                  </div>
                  <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {experiences.map((exp) => (
              <Card
                key={exp.id}
                id={exp.id}
                title={exp.title}
                description={exp.description}
                imageUrl={exp.thumbnailImages[0]}
                location={exp.location}
                price={exp.price}
                isFavorited={false}
                onFavoriteChange={undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
