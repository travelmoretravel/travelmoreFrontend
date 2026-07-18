// app/[locale]/car-rental/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Users, Gauge, Luggage } from "lucide-react";
import api from "@/lib/api";
import { useTheme } from "@/components/ThemeProvider";
import { AxiosError } from "axios"; 

interface ApiCar {
  id: number;
  slug: string; 
  car_model: string;
  brand: string;
  category: "regular" | "exclusive";
  description: string | null;
  price_per_day: string;
  car_type: string | null; 
  transmission: string;
  capacity: number;
  trunk_size: number;
  features: string[];
  images: { url: string; type: 'thumbnail' | 'gallery' }[];
}

// --- Reusable Icon Component ---
function InfoIcon({ icon: Icon, text, colorClass }: { icon: React.ElementType; text: string | number; colorClass?: string }) {
  return (
    <div className={`flex items-center gap-2 ${colorClass || "text-foreground/80"}`}>
      <Icon className="h-5 w-5 opacity-70" />
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}

// --- CarCard Component ---
function CarCard({ car, isExclusive }: { car: ApiCar; isExclusive: boolean }) {
  const t = useTranslations("carRental");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const carName = `${car.brand} ${car.car_model}`;
  const price = parseFloat(car.price_per_day);
  const thumbnail = car.images.find(img => img.type === 'thumbnail');

  // ✅ CORRECT (Checks if the URL already has http, otherwise safely appends)
const imageUrl = thumbnail
  ? (thumbnail.url.startsWith('http') 
      ? thumbnail.url 
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}/storage/${thumbnail.url}`)
  : "/cars/placeholder.jpg";

  const displayType = car.car_type?.toUpperCase() || "GENERAL";

  const cardBgClass = isExclusive ? "bg-gray-900 border border-gray-800" : "bg-card shadow-md";
  const textTitleClass = isExclusive ? "text-white" : "text-foreground";
  const textMutedClass = isExclusive ? "text-gray-400" : "text-foreground/70";
  const accentColor = isExclusive ? "text-yellow-500" : "text-primary";

  return (
    <Link href={`/car-rental/${car.slug}`} className="block h-full">
      <div className={`${cardBgClass} rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 h-full flex flex-col group`}>
        <div className="relative h-56 w-full">
          <Image
            src={imageUrl}
            alt={carName}
            fill
            className="object-cover transform group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className="p-5 flex flex-col grow"> 
          <p className={`text-sm font-semibold ${accentColor}`}>{displayType}</p>
          <h3 className={`text-2xl font-bold mt-1 ${textTitleClass}`}>{carName}</h3>
          <div className={`flex items-center gap-4 mt-4 text-sm ${textMutedClass}`}>
            <InfoIcon icon={Users} text={`${car.capacity} Seats`} colorClass={textMutedClass} />
            <InfoIcon icon={Gauge} text={car.transmission} colorClass={textMutedClass} />
            <InfoIcon icon={Luggage} text={`${car.trunk_size} Bags`} colorClass={textMutedClass} />
          </div>
          <p className={`${textMutedClass} mt-4 line-clamp-2 grow h-12`}> 
            {car.description || "No description available."}
          </p>
          <div className={`mt-5 pt-4 border-t ${isExclusive ? "border-gray-800" : "border-border/50"}`}>
            <p className={`text-xl font-extrabold ${textTitleClass}`}>
              {formatCurrency(price)}
              <span className={`text-sm font-normal ${textMutedClass}`}>{" "}{t("pricePerDay")}</span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function CarRentalPage() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("carRental");
  const tNav = useTranslations("Navbar");
  const locale = useLocale();

  const [cars, setCars] = useState<ApiCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => setTheme("regular");
  }, [setTheme]);

  const isExclusive = theme === "exclusive";
  const mainBgClass = isExclusive ? "bg-black" : "bg-background";
  const textClass = isExclusive ? "text-white" : "text-foreground";
  const textMutedClass = isExclusive ? "text-gray-400" : "text-foreground/60";

  const filteredCars = useMemo(() => {
    return cars.filter((car) => car.category === theme);
  }, [cars, theme]);

  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true);
      try {
        const response = await api.get("/public/car-rentals", { params: { locale } });
        setCars(response.data.data || response.data);
      } catch (err: unknown) { 
        const axiosError = err as AxiosError<{ message: string }>; 
        setError(axiosError.message || "Error fetching cars.");
      } finally {
        setLoading(false);
      }
    };
    fetchCars();
  }, [locale]);

  if (loading) return <div className={`flex justify-center items-center min-h-screen ${mainBgClass}`}><p className={textMutedClass}>Loading cars...</p></div>;
  
 
  if (error) return <div className={`flex justify-center items-center min-h-screen ${mainBgClass}`}><p className="text-red-500 font-bold">{error}</p></div>;

  return (
    <div className={`${mainBgClass} min-h-screen transition-colors duration-300`}>
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className={`text-5xl font-extrabold tracking-tight ${textClass}`}>{t("title")}</h1>
          <p className={`mt-4 text-lg max-w-2xl mx-auto ${textMutedClass}`}>{t("subtitle")}</p>
          <div className="flex justify-center mt-8">
            <div className={`flex items-center p-1.5 rounded-full ${isExclusive ? "bg-gray-800" : "bg-gray-100"}`}>
              <button onClick={() => setTheme("regular")} className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${!isExclusive ? "bg-white text-primary shadow-md" : "text-gray-400 hover:text-white"}`}>{tNav("regular")}</button>
              <button onClick={() => setTheme("exclusive")} className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${isExclusive ? "bg-yellow-500 text-black shadow-md" : "text-gray-500 hover:text-black"}`}>{tNav("exclusive")}</button>
            </div>
          </div>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCars.map((car) => <CarCard key={car.id} car={car} isExclusive={isExclusive} />)}
        </div>
      </div>
    </div>
  );
}
