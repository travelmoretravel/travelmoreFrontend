/// components/GalleryGrid.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Clock, 
  Tag, 
  Info, 
  ZoomIn,
  Loader2,
  ArrowUpRight
} from "lucide-react";
import api from "@/lib/api"; 
import { useLocale } from "next-intl";

interface GalleryItem {
  id: number;
  title: string;
  location: string | null;
  description: string;
  best_time: string;
  ticket_price: string;
  redirect_url: string | null;
  redirect_text: string | null;
  thumbnail: string | null;
  images: string[];
}

export default function GalleryGrid() {
  const locale = useLocale();
  
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  // --- FETCH DATA ---
  const fetchGallery = async (pageNum: number) => {
    try {
      setLoading(true);
      const response = await api.get(`/public/galleries?page=${pageNum}`, {
        headers: { "Accept-Language": locale }
      });
      
      const newData = response.data.data;
      const meta = response.data; 

      if (pageNum === 1) {
        setItems(newData);
      } else {
        setItems((prev) => [...prev, ...newData]);
      }

      setHasMore(meta.current_page < meta.last_page);
    } catch (error) {
      console.error("Failed to fetch gallery:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchGallery(1);
  }, [locale]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchGallery(nextPage);
  };

  // --- LIGHTBOX LOGIC ---
  const closeLightBox = () => setSelectedItem(null);

  const navigateImage = useCallback((direction: "next" | "prev") => {
    if (!selectedItem) return;
    const currentIndex = items.findIndex((d) => d.id === selectedItem.id);
    let newIndex;
    if (direction === "next") {
      newIndex = (currentIndex + 1) % items.length;
    } else {
      newIndex = (currentIndex - 1 + items.length) % items.length;
    }
    setSelectedItem(items[newIndex]);
  }, [selectedItem, items]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedItem) return;
      if (e.key === "Escape") closeLightBox();
      if (e.key === "ArrowRight") navigateImage("next");
      if (e.key === "ArrowLeft") navigateImage("prev");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem, navigateImage]);

  // --- RENDER ---
  return (
    <>
      {/* --- GRID GALLERY --- */}
      {items.length === 0 && !loading ? (
        <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No gallery items found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 pb-10">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col group cursor-pointer"
            >
              {/* IMAGE CONTAINER */}
              <div className="relative h-80 w-full overflow-hidden bg-gray-100">
                {item.thumbnail ? (
                  <Image
                    src={item.thumbnail}
                    alt={item.title}
                    fill
                    className="object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                   <div className="bg-white/90 p-3.5 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      <ZoomIn className="text-gray-800 w-6 h-6" />
                   </div>
                </div>
              </div>

              {/* CARD CONTENT */}
              <div className="p-6 bg-white relative z-10 flex flex-col justify-center border-t border-gray-50">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1 mb-2">
                  {item.title}
                </h3>
                {item.location ? (
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <MapPin size={16} className="text-primary shrink-0" />
                        <span className="line-clamp-1">{item.location}</span>
                    </div>
                ) : (
                    <div className="h-5"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- LOAD MORE --- */}
      {hasMore && (
        <div className="flex justify-center mt-8 mb-16">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-8 py-3.5 bg-white border-2 border-gray-200 text-gray-800 font-bold rounded-full hover:border-primary hover:text-primary hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 size={20} className="animate-spin" />}
            {loading ? "Loading..." : "Load More Photos"}
          </button>
        </div>
      )}

      {/* --- RICH MODAL (Focus View) --- */}
      {selectedItem && (
        <div 
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300"
            onClick={closeLightBox}
        >
          <div 
            className="bg-white w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] md:h-[80vh]"
            onClick={(e) => e.stopPropagation()} 
          >
            
            {/* --- LEFT: IMAGE --- */}
            <div className="relative w-full md:w-[60%] h-64 md:h-full bg-gray-100 group">
               {selectedItem.thumbnail ? (
                   <Image
                      src={selectedItem.thumbnail}
                      alt={selectedItem.title}
                      fill
                      className="object-cover"
                      priority
                   />
               ) : (
                   <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
               )}
               
               <button 
                  onClick={(e) => { e.stopPropagation(); navigateImage("prev"); }} 
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-3 rounded-full shadow-lg transition opacity-0 group-hover:opacity-100 hidden md:block"
               >
                  <ChevronLeft size={24} />
               </button>
               <button 
                  onClick={(e) => { e.stopPropagation(); navigateImage("next"); }} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-3 rounded-full shadow-lg transition opacity-0 group-hover:opacity-100 hidden md:block"
               >
                  <ChevronRight size={24} />
               </button>
            </div>

            {/* --- RIGHT: INFO --- */}
            <div className="w-full md:w-[40%] p-8 overflow-y-auto relative flex flex-col bg-white text-gray-900">
                
                <button 
                    onClick={closeLightBox} 
                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition bg-gray-100 hover:bg-gray-200 p-2 rounded-full"
                >
                    <X size={20} />
                </button>

                {/* Title */}
                <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-2 pr-8 leading-tight">
                    {selectedItem.title}
                </h2>

                {/* Description (Top) */}
                {selectedItem.description && (
                    <div className="prose prose-sm prose-gray text-gray-600 mb-8 leading-relaxed">
                        <p>{selectedItem.description}</p>
                    </div>
                )}

                {/* Info Box (Smaller) */}
                <div className="space-y-4 mb-8 bg-gray-50 p-5 rounded-xl border border-gray-100">
                    
                    {selectedItem.location && (
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 w-7 h-7 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                                <MapPin size={14} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                                    Location
                                </span>
                                <span className="text-sm font-semibold text-gray-800 leading-tight">
                                    {selectedItem.location}
                                </span>
                            </div>
                        </div>
                    )}

                    {selectedItem.best_time && (
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                <Clock size={14} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                                    Best Time
                                </span>
                                <span className="text-sm font-semibold text-gray-800 leading-tight">
                                    {selectedItem.best_time}
                                </span>
                            </div>
                        </div>
                    )}

                    {selectedItem.ticket_price && (
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 w-7 h-7 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                <Tag size={14} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                                    Entrance Fee
                                </span>
                                <span className="text-sm font-semibold text-gray-800 leading-tight">
                                    {selectedItem.ticket_price}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Button (Primary Color) */}
                <div className="mt-auto pt-4 border-t border-gray-100">
                    {selectedItem.redirect_url ? (
                        <Link 
                            href={selectedItem.redirect_url} 
                            
                            className="flex items-center justify-center w-full py-3.5 bg-primary hover:bg-primary/90 text-white font-bold text-sm text-center rounded-xl transition shadow-lg hover:shadow-xl gap-2 group"
                        >
                            {selectedItem.redirect_text || "View Package Details"}
                            <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </Link>
                    ) : (
                        <button disabled className="block w-full py-3.5 bg-gray-100 text-gray-400 font-bold text-sm text-center rounded-xl cursor-not-allowed">
                            Information Only
                        </button>
                    )}
                </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}