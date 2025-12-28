// components/Navbar.tsx
"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "./ThemeProvider";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";

// 🌐 Language Switcher
const LocaleSwitcher = () => {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div className="flex items-center p-1 rounded-full bg-gray-200 dark:bg-gray-700">
      <Link
        href={pathname}
        locale="id"
        className={`px-3 py-1 text-sm font-bold rounded-full transition-colors duration-300 ${
          locale === "id" ? "bg-white text-black" : "text-gray-500"
        }`}
      >
        ID
      </Link>
      <Link
        href={pathname}
        locale="en"
        className={`px-3 py-1 text-sm font-bold rounded-full transition-colors duration-300 ${
          locale === "en" ? "bg-white text-black" : "text-gray-500"
        }`}
      >
        EN
      </Link>
    </div>
  );
};

// 🔗 Standard Navigation Link
function NavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="relative inline-block group text-foreground font-medium hover:text-primary transition-colors"
    >
      {children}
      <span
        className="absolute left-0 -bottom-1 h-[2px] w-full bg-primary origin-left scale-x-0 transform transition-transform duration-300 group-hover:scale-x-100"
        aria-hidden
      />
    </Link>
  );
}

// 🔽 Dropdown Navigation Link
function DropdownLink({
  title,
  items,
  onItemClick,
}: {
  title: string;
  items: { name: string; href: string }[];
  onItemClick?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative group md:cursor-pointer"
      // Toggle on click for mobile, or if user prefers clicking on desktop
      onClick={() => setIsOpen(!isOpen)}
      // Keep menu open when mouse enters the parent group
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="inline-flex items-center space-x-1 text-foreground font-medium w-full justify-between md:w-auto outline-none">
        <span>{title}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          // Rotate icon on state open OR on CSS group hover
          className={`h-5 w-5 transform transition-transform duration-300 ${
            isOpen ? "rotate-180" : "group-hover:rotate-180"
          }`}
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      
      <div
        className={`
          md:absolute md:left-0 md:top-full md:pt-6 md:w-48 z-[999]
          transition-all duration-300 ease-in-out
          ${
            isOpen
              ? "opacity-100 visible scale-100 translate-y-0"
              : "opacity-0 invisible scale-95 -translate-y-2 md:group-hover:opacity-100 md:group-hover:visible md:group-hover:scale-100 md:group-hover:translate-y-0"
          }
          ${isOpen ? "block" : "hidden"} md:block
        `}
      >
        {/* Inner Visual Container */}
        <div className="bg-background rounded-md shadow-lg overflow-hidden border border-border">
          <div className="py-1 md:py-2" role="menu" aria-orientation="vertical">
            {items.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={onItemClick}
                className="block px-4 py-2 text-sm text-foreground hover:bg-gray-100 hover:text-primary transition-colors"
                role="menuitem"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 👤 Authentication Buttons & Profile Dropdown
function AuthButtons() {
  const { user, logout, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getInitials = (name: string | undefined) => {
    if (!name) return "";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  // Effect to handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (loading) {
    return (
      <div className="h-10 w-10 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full"></div>
    );
  }

  if (user) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)} // Toggle on click
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          {getInitials(user.name)}
        </button>
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-background rounded-md shadow-lg py-1 z-50 animate-fadeIn">
            <div className="px-4 py-2 text-sm text-foreground font-semibold border-b border-border">
              {user.name}
            </div>
            <Link
              href="/profile"
              className="block px-4 py-2 text-sm text-foreground hover:bg-card transition-colors"
              onClick={() => setIsOpen(false)} // Close on navigate
            >
              Profile
            </Link>
            <button
              onClick={() => {
                logout();
                setIsOpen(false); // Close on logout
              }}
              className="w-full text-left block px-4 py-2 text-sm text-red-500 hover:bg-card transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Link href="/login">
        <button className="px-4 py-2 text-sm font-medium rounded-md hover:bg-muted">
          Login
        </button>
      </Link>
      <Link href="/register">
        <button className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90">
          Register
        </button>
      </Link>
    </div>
  );
}

// 📱 Mobile Menu Component
function MobileMenu({
  serviceLinks,
  moreLinks,
  closeMenu,
}: {
  serviceLinks: { name: string; href: string }[];
  moreLinks: { name: string; href: string }[];
  closeMenu: () => void;
}) {
  const t = useTranslations("Navbar");
  const { user, logout, loading } = useAuth();

  const handleLogout = () => {
    logout();
    closeMenu();
  };

  return (
    <div className="md:hidden flex flex-col space-y-4 pb-4 animate-fadeIn">
      {/* 1. Home */}
      <NavLink href="/" onClick={closeMenu}>{t("home")}</NavLink>
      
      {/* 2. Services (Dropdown) - Tambahkan onItemClick agar menutup saat dipilih */}
      <DropdownLink title={t("ourServices")} items={serviceLinks} onItemClick={closeMenu} />
      
      {/* 3. Blog */}
      <NavLink href="/blog" onClick={closeMenu}>{t("blog")}</NavLink>
      
      {/* 4. More (Dropdown) - Tambahkan onItemClick */}
      <DropdownLink title={t("more")} items={moreLinks} onItemClick={closeMenu} />

      <div className="border-t border-border my-2"></div>

      {/* Auth Section */}
      {loading ? (
        <div className="h-10 w-full animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md"></div>
      ) : user ? (
        <div className="flex flex-col space-y-2">
          <Link
            href="/profile"
            onClick={closeMenu}
            className="px-4 py-2 font-medium rounded-md hover:bg-muted"
          >
            My Profile
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 font-medium rounded-md text-red-500 hover:bg-muted text-left"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center space-x-2">
          <Link href="/login" onClick={closeMenu} className="flex-1">
            <button className="w-full px-4 py-2 text-sm font-medium rounded-md hover:bg-muted border border-border">
              Login
            </button>
          </Link>
          <Link href="/register" onClick={closeMenu} className="flex-1">
            <button className="w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90">
              Register
            </button>
          </Link>
        </div>
      )}

      <div className="pt-4 flex justify-around items-center">
        <LocaleSwitcher />
      </div>
    </div>
  );
}

// --- Main Navbar Component ---
export default function Navbar() {
  const { theme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations("Navbar");

  // --- MENU LINKS ---
  const serviceLinks = [
    { name: t("planner"), href: "/planner" },
    { name: t("packages"), href: "/packages" },
    { name: t("openTrip"), href: "/open-trip" }, 
    { name: t("carRental"), href: "/car-rental" },
    { name: t("activities"), href: "/activities" },
  ];

  const pageLinks = [
    { name: t("gallery"), href: "/gallery" },
    { name: t("about"), href: "/about" },
  ];

  const logoSrc =
    theme === "regular"
      ? "/navbar/logo-regular.png"
      : "/navbar/logo-exclusive.png";

  return (
    
    <nav className="bg-background/80 dark:bg-card/80 backdrop-blur-lg shadow-md sticky top-0 z-[999] border-b border-border transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-24 gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              key={logoSrc}
              src={logoSrc}
              alt="TravelMore Logo"
              width={200}
              height={60}
              priority
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink href="/">{t("home")}</NavLink>
            <DropdownLink title={t("ourServices")} items={serviceLinks} />
            <NavLink href="/blog">{t("blog")}</NavLink>
            <DropdownLink title={t("more")} items={pageLinks} />
          </div>

          {/* Right-side Controls */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-4">
              <LocaleSwitcher />
              <AuthButtons />
            </div>

            {/* Mobile Hamburger Button */}
            <button
              className="md:hidden focus:outline-none"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={t("toggleMenu")}
            >
              {menuOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 text-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 text-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <MobileMenu
            serviceLinks={serviceLinks}
            moreLinks={pageLinks}
            closeMenu={() => setMenuOpen(false)}
          />
        )}
      </div>
    </nav>
  );
}