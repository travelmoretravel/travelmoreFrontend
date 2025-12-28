// components/FloatingContact.tsx
"use client";

import React, { useState } from "react";
import { MessageCircle, Mail, Instagram, X, MessageSquare } from "lucide-react";

export default function FloatingContact() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  // Data Kontak
  const contacts = [
    {
      name: "WhatsApp",
      icon: <MessageCircle size={20} />,
      href: "https://wa.me/6282224291148?text=Halo%20Travelmore,%20saya%20ingin%20bertanya%20tentang%20paket%20wisata.",
      color: "bg-green-500 hover:bg-green-600",
      textColor: "text-white"
    },
    {
      name: "Instagram",
      icon: <Instagram size={20} />,
      href: "https://www.instagram.com/travelmore.travel/",
      color: "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 hover:brightness-110",
      textColor: "text-white"
    },
    {
      name: "Email",
      icon: <Mail size={20} />,
      href: "mailto:hitmeup.travelmoreco@gmail.com",
      color: "bg-red-500 hover:bg-red-600",
      textColor: "text-white"
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3">

      {/* --- Menu Kontak (Muncul saat isOpen = true) --- */}
      <div
        className={`flex flex-col gap-3 transition-all duration-300 ease-in-out origin-bottom-right ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-0 translate-y-10 pointer-events-none"
        }`}
      >
        {contacts.map((contact, index) => {
          // Cek apakah ini link email
          const isEmail = contact.href.startsWith("mailto:");

          return (
            <a
              key={index}
              href={contact.href}
              // PERBAIKAN DISINI: Jangan gunakan _blank jika itu adalah email
              target={isEmail ? undefined : "_blank"}
              rel={isEmail ? undefined : "noopener noreferrer"}
              className={`flex items-center justify-end gap-3 group`}
            >
              {/* Label (Muncul saat hover) */}
              <span className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm font-medium px-3 py-1.5 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                {contact.name}
              </span>

              {/* Icon Button */}
              <div
                className={`w-12 h-12 flex items-center justify-center rounded-full shadow-lg transition-transform transform hover:scale-110 ${contact.color} ${contact.textColor}`}
              >
                {contact.icon}
              </div>
            </a>
          );
        })}
      </div>

      {/* --- Tombol Utama (Trigger) --- */}
      <button
        onClick={toggleMenu}
        className={`w-14 h-14 flex items-center justify-center rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 focus:outline-none ${
          isOpen ? "bg-gray-800 rotate-90" : "bg-primary hover:bg-primary/90"
        }`}
        aria-label="Contact Us"
      >
        {isOpen ? (
          <X size={28} className="text-white" />
        ) : (
          <MessageSquare size={28} className="text-white animate-pulse" />
        )}
      </button>
    </div>
  );
}