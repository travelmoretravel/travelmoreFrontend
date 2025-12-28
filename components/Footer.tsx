// components/Footer.tsx
"use client";

import React from "react";
// PENTING: Gunakan Link dari konfigurasi i18n
import { Link } from "@/i18n/navigation"; 
import Image from "next/image";
import { useTheme } from "./ThemeProvider";
import { useTranslations } from "next-intl";
// Icon tidak lagi dibutuhkan karena kita hanya menggunakan teks
// import { MessageCircle, Instagram, Mail } from "lucide-react"; 

const Footer: React.FC = () => {
  const { theme } = useTheme();
  const t = useTranslations("footer");

  // Pastikan nama file gambar ini sesuai dengan yang ada di folder public Anda
  const logoSrc = theme === "regular" ? "/logo-Big.webp" : "/logo-dark.webp";

  return (
    <footer className="bg-gray-800 dark:bg-black text-white py-12 transition-colors duration-300 border-t border-gray-700 dark:border-gray-900">
      <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-start gap-10 px-6">
        
        {/* 1. Logo & Deskripsi */}
        <div className="flex flex-col max-w-sm">
          <Link href="/">
            <Image
              key={logoSrc}
              src={logoSrc}
              alt="Logo TravelMore"
              width={160}
              height={50}
              className="mb-4 object-contain"
            />
          </Link>
          <p className="text-sm text-gray-400 leading-relaxed">
            {t("description")}
          </p>
        </div>

        {/* 2. Quick Links (Blog & Gallery) */}
        <div>
          <h3 className="mb-4 text-lg font-bold text-white">{t("quickLinks.title")}</h3>
          <ul className="space-y-3 text-gray-400">
            <li>
              <Link href="/blog" className="hover:text-primary transition-colors hover:pl-1 duration-200">
                {t("quickLinks.blog") || "Blog"} 
              </Link>
            </li>
            
            <li>
              <Link href="/car-rental" className="hover:text-primary transition-colors hover:pl-1 duration-200">
                {t("quickLinks.carRental")}
              </Link>
            </li>
            
            <li>
              <Link href="/about" className="hover:text-primary transition-colors hover:pl-1 duration-200">
                {t("quickLinks.about")}
              </Link>
            </li>

            <li>
              <Link href="/gallery" className="hover:text-primary transition-colors hover:pl-1 duration-200">
                {t("quickLinks.gallery") || "Gallery"}
              </Link>
            </li>
          </ul>
        </div>

        {/* 3. Contact Info (Tampilan Teks Sederhana seperti Gambar 1) */}
        <div>
          <h3 className="mb-4 text-lg font-bold text-white">{t("contact.title")}</h3>
          <div className="space-y-6 text-sm text-gray-400">
            
            {/* Alamat */}
            <p className="leading-relaxed max-w-xs">
              {t("contact.address")}
            </p>
            
            {/* Telepon (Format Teks) */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-gray-500 text-xs uppercase tracking-wider">
                {t("contact.phone") || "TELEPON:"}
              </span>
              <a
                href="https://wa.me/6282224291148"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white text-base font-medium hover:text-primary transition-colors"
              >
                +62 822 2429 1148
              </a>
            </div>

            {/* Email (Format Teks) */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-gray-500 text-xs uppercase tracking-wider">
                {t("contact.email") || "EMAIL:"}
              </span>
              <a
                href="mailto:hitmeup.travelmoreco@gmail.com"
                className="text-white text-base font-medium hover:text-primary transition-colors"
              >
                hitmeup.travelmoreco@gmail.com 

              </a>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700/50 mt-12 pt-8 text-center px-4">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} travelmore.travel. {t("copyright")}
        </p>
      </div>
    </footer>
  );
};

export default Footer;