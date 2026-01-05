// app/[locale]/layout.tsx
import "./globals.css";
import React from "react";
import { Poppins, Montserrat, Lora } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from 'next-intl/server'; // ✅ Tambah getTranslations
import { Toaster } from "sonner";
import { Metadata } from "next";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider"; 
import ClientBreadcrumbsWrapper from "@/components/ui/ClientBreadcrumbsWrapper";
import { AuthProvider } from "@/contexts/AuthContext";
import { routing } from "@/i18n/routing";
import FloatingContact from "@/components/FloatingContact"; 


import {GoogleAnalytics} from '@next/third-parties/google'

// --- Font Configurations ---
const fontPoppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const fontMontserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

const fontSerif = Lora({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-serif",
  display: "swap",
});

// --- DYNAMIC METADATA GENERATOR ---
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  
  // ✅ UPDATE: Mengambil teks dari JSON (en.json / id.json) namespace 'SEO.home'
  const t = await getTranslations({ locale, namespace: 'SEO.home' });
  
  // ✅ Pastikan URL fallback konsisten (Gunakan domain production jika ada)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://travelmore.travel'; 
  
  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: t('title'), // Mengambil dari JSON
      template: "%s | TravelMore",
    },
    description: t('description'), // Mengambil dari JSON
    
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        'en': `${baseUrl}/en`,
        'id': `${baseUrl}/id`,
        'x-default': `${baseUrl}/en`,
      },
    },

    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${baseUrl}/${locale}`,
      siteName: 'TravelMore',
      locale: locale === 'id' ? 'id_ID' : 'en_US',
      type: 'website',
      images: [
        {
          url: '/og-image.jpg', 
          width: 1200,
          height: 630,
          alt: 'TravelMore Yogyakarta',
        },
      ],
    },
    
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },

    formatDetection: {
      telephone: false,
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://travelmore.travel';

  // ✅ Schema Organization Global
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    'name': 'TravelMore',
    'url': baseUrl,
    'logo': `${baseUrl}/logo.png`,
    'image': `${baseUrl}/og-image.jpg`,
    'description': 'Best Custom Trip Planner & Tour Operator in Yogyakarta.',
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': 'Jl. Magelang - Yogyakarta No.71',
      'addressLocality': 'Sleman',
      'addressRegion': 'Daerah Istimewa Yogyakarta',
      'postalCode': '55285',
      'addressCountry': 'ID'
    },
    'contactPoint': {
      '@type': 'ContactPoint',
      'telephone': '+6282224291148',
      'contactType': 'customer service',
      'areaServed': ['ID', 'MY', 'SG'],
      'availableLanguage': ['en', 'id']
    },
    'sameAs': [
      'https://www.instagram.com/travelmore_id',
      'https://www.facebook.com/travelmore'
    ]
  };

  return (
    <html
      lang={locale}
      className={`${fontPoppins.variable} ${fontMontserrat.variable} ${fontSerif.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Inject Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="bg-background text-foreground font-sans antialiased">
        <GoogleAnalytics gaId="G-F3E8XBJC29"/>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <ThemeProvider>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <ClientBreadcrumbsWrapper />
                <main className="flex-grow">
                  {children}
                </main>
                <Footer />
              </div>
              <FloatingContact />
              <Toaster richColors closeButton position="top-right" />
            </ThemeProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}