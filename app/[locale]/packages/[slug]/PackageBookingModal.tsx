// app/[locale]/packages/[slug]/PackageBookingModal.tsx
"use client";

import React, { useState, FormEvent, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl"; 
import api from "@/lib/api";
import { toast } from "sonner";
import { 
  X, Users, TicketPercent, Camera, Plus, CheckCircle2, 
  AlertCircle, Loader2, MapPin, Phone, Info, Smartphone,
  ChevronDown, ExternalLink, Mail, User, Flag, Globe
} from "lucide-react"; 
import { AxiosError } from "axios";
import { useTheme } from "@/components/ThemeProvider";
import { HolidayPackage, TFunction, AuthUser, Addon, PackagePriceTier } from "@/types/package";

// ✅ Extend interface untuk sinkronisasi data profil
interface ExtendedAuthUser extends AuthUser {
  full_name?: string;
  nationality?: string;
  phone_number?: string;
}

interface PackageBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: HolidayPackage; 
  user: AuthUser | null;
  t: TFunction;
}

interface ApiCheckPriceResponse {
  discount_amount: number;
  total_amount: number;
  message?: string;
}
type FormErrors = { [key: string]: string | undefined };

const countryCodes = [
  { code: "+62", label: "Indonesia (+62)", iso: "ID" },
  { code: "+60", label: "Malaysia (+60)", iso: "MY" },
  { code: "+65", label: "Singapore (+65)", iso: "SG" },
  { code: "+61", label: "Australia (+61)", iso: "AU" },
  { code: "+44", label: "United Kingdom (+44)", iso: "GB" },
  { code: "+1", label: "USA (+1)", iso: "US" },
  { code: "+81", label: "Japan (+81)", iso: "JP" },
  { code: "+82", label: "South Korea (+82)", iso: "KR" },
  { code: "+86", label: "China (+86)", iso: "CN" },
  { code: "+971", label: "UAE (+971)", iso: "AE" },
  { code: "+33", label: "France (+33)", iso: "FR" },
  { code: "+49", label: "Germany (+49)", iso: "DE" },
  { code: "+91", label: "India (+91)", iso: "IN" },
  { code: "+31", label: "Netherlands (+31)", iso: "NL" },
  { code: "+64", label: "New Zealand (+64)", iso: "NZ" },
  { code: "+63", label: "Philippines (+63)", iso: "PH" },
  { code: "+66", label: "Thailand (+66)", iso: "TH" },
  { code: "+90", label: "Turkey (+90)", iso: "TR" },
  { code: "+84", label: "Vietnam (+84)", iso: "VN" },
];

const PackageBookingModal: React.FC<PackageBookingModalProps> = ({
  isOpen, onClose, pkg, user, t,
}) => {
  const router = useRouter();
  const locale = useLocale();
  const { theme } = useTheme();

  // --- STATES ---
  const [startDate, setStartDate] = useState<string>("");
  const [adults, setAdults] = useState<number>(1);
  const [children, setChildren] = useState<number>(0);
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [nationality, setNationality] = useState<string>("");
  const [phoneCode, setPhoneCode] = useState("+62");
  const [localPhone, setLocalPhone] = useState("");
  const [pickupLocation, setPickupLocation] = useState<string>("");
  
  const [discountCode, setDiscountCode] = useState<string>("");
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [discountMessage, setDiscountMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  // ✅ LOGIKA SINKRONISASI DATA PROFIL & PARSING PHONE
  useEffect(() => {
    if (isOpen && user) {
      const profile = user as ExtendedAuthUser;
      setFullName(profile.full_name || user.name || "");
      setEmail(user.email || "");
      setNationality(profile.nationality || "");
      
      const fullPhone = profile.phone_number || "";
      const sortedForMatch = [...countryCodes].sort((a, b) => b.code.length - a.code.length);
      const matchedCode = sortedForMatch.find((c) => fullPhone.startsWith(c.code));

      if (matchedCode) {
        setPhoneCode(matchedCode.code);
        setLocalPhone(fullPhone.substring(matchedCode.code.length));
      } else {
        setPhoneCode("+62");
        setLocalPhone(fullPhone.replace(/^\+62|^0/, ""));
      }

      setStartDate("");
      setAdults(1);
      setChildren(0);
      setDiscountCode("");
      setAppliedDiscount(0);
      setDiscountMessage(null);
      setPickupLocation("");
      setSelectedAddons([]);
      setErrors({});
    }
  }, [isOpen, user]);

  const handleApplyCode = useCallback(async () => {
    if (!discountCode.trim()) return;
    setIsCheckingCode(true);
    try {
      const response = await api.post<ApiCheckPriceResponse>('/booking/check-price', {
        type: 'holiday_package', id: pkg.id, discount_code: discountCode, adults, children, selected_addons: selectedAddons
      });
      if (response.data.discount_amount > 0) {
        setAppliedDiscount(response.data.discount_amount);
        setDiscountMessage({ type: 'success', text: `Code applied! Saved ${formatPrice(response.data.discount_amount)}` });
      } else {
        setAppliedDiscount(0);
        setDiscountMessage({ type: 'error', text: "Code valid but no discount applicable." });
      }
    } catch (err: unknown) {
      const error = err as AxiosError<{message: string}>;
      setAppliedDiscount(0);
      setDiscountMessage({ type: 'error', text: error.response?.data?.message || "Invalid code." });
    } finally { setIsCheckingCode(false); }
  }, [pkg.id, discountCode, adults, children, selectedAddons]);

  useEffect(() => {
    if (appliedDiscount > 0 && discountCode) {
      const timer = setTimeout(() => handleApplyCode(), 800); 
      return () => clearTimeout(timer);
    }
  }, [adults, children, selectedAddons, appliedDiscount, discountCode, handleApplyCode]);

  const { pricePerPax, totalPax } = useMemo(() => {
    const totalPax = adults + children;
    let foundPrice = 0;
    if (pkg.price_tiers && pkg.price_tiers.length > 0) {
      const tier = pkg.price_tiers.find((t: PackagePriceTier) => totalPax >= t.min_pax && (totalPax <= t.max_pax || !t.max_pax || t.max_pax === 0));
      foundPrice = tier ? tier.price : pkg.price_tiers.reduce((min: number, t: PackagePriceTier) => (t.price < min ? t.price : min), pkg.price_tiers[0].price);
    }
    if (foundPrice === 0) foundPrice = pkg.starting_from_price || 0;
    return { pricePerPax: foundPrice, totalPax };
  }, [adults, children, pkg.price_tiers, pkg.starting_from_price]);

  const baseSubtotal = useMemo(() => pricePerPax * totalPax, [pricePerPax, totalPax]);

  const addonsTotal = useMemo(() => {
    if (!pkg.addons || selectedAddons.length === 0) return 0;
    return selectedAddons.reduce((total, addonName) => {
      const addon = pkg.addons?.find((a: Addon) => a.name === addonName);
      return total + (Number(addon?.price) || 0);
    }, 0);
  }, [selectedAddons, pkg.addons]);

  const grandTotal = Math.max(0, baseSubtotal + addonsTotal - appliedDiscount);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
  };

  const toggleAddon = (addonName: string) => {
    setSelectedAddons(prev => prev.includes(addonName) ? prev.filter(name => name !== addonName) : [...prev, addonName]);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!startDate) newErrors.startDate = t("booking.errors.noDate");
    if (!nationality) newErrors.participant_nationality = t("booking.errors.noNationality");
    if (!fullName) newErrors.full_name = t("booking.errors.noName");
    if (!localPhone) newErrors.phone_number = t("booking.errors.noPhone");
    if (!pickupLocation) newErrors.pickup_location = t("booking.errors.noPickup");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!user) { toast.error(t("booking.errors.notLoggedIn")); return; }

    setIsSubmitting(true);
    try {
      await api.post(`/packages/${pkg.id}/book`, {
        start_date: startDate,
        adults,
        children,
        discount_code: appliedDiscount > 0 ? discountCode : null,
        participant_nationality: nationality,
        full_name: fullName,
        email: email,
        phone_number: `${phoneCode}${localPhone.replace(/[^0-9]/g, "")}`,
        pickup_location: pickupLocation,
        flight_number: null,
        special_request: null,
        selected_addons: selectedAddons,
      });

      toast.success(t("booking.success.message"));
      router.push(`/${locale}/profile?tab=bookings`);
      onClose();
    } catch (err: unknown) {
        const error = err as AxiosError<{ message?: string }>;
        toast.error(error.response?.data?.message || t("booking.errors.general"));
    } finally { setIsSubmitting(false); }
  };

  if (!isOpen) return null;

  // --- STYLING VARS (Sesuai Desain User) ---
  const modalBgClass = theme === "regular" ? "bg-white" : "bg-card";
  const textColor = theme === "regular" ? "text-gray-900" : "text-foreground";
  const mutedTextColor = theme === "regular" ? "text-gray-600" : "text-foreground/70";
  const inputBgClass = theme === "regular" ? "bg-gray-50" : "bg-background";
  const inputBorderClass = theme === "regular" ? "border-gray-300" : "border-border";
  const focusRingClass = "focus:ring-primary focus:border-primary";
  const baseInputClass = `mt-1 block w-full rounded-md shadow-sm ${inputBgClass} ${focusRingClass} ${textColor} placeholder:${mutedTextColor} disabled:opacity-50 disabled:cursor-not-allowed border py-2 px-3`;
  const errorBorderClass = "border-red-500 focus:border-red-500 focus:ring-red-500";
  const addonCardClass = theme === "regular" ? "border-gray-200 hover:border-primary bg-white" : "border-gray-700 hover:border-primary bg-gray-800";
  const addonSelectedClass = "border-primary ring-1 ring-primary bg-primary/10 dark:bg-primary/20";

  const isMapLink = (text: string) => text.includes("goo.gl") || text.includes("maps.app");

  return (
    <div className="fixed inset-0 z-1000 flex justify-center items-start bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
      <div className={`${modalBgClass} rounded-xl shadow-xl p-6 sm:p-8 w-full max-w-lg relative my-10 animate-in zoom-in-95 duration-200`}>
        <button onClick={onClose} className={`absolute top-4 right-4 ${mutedTextColor} hover:${textColor} transition-colors`}><X size={24} /></button>

        <div className="sm:flex sm:items-start mb-6 border-b border-border pb-4">
           <div className="w-full text-center sm:text-left">
               <h2 className={`text-2xl font-bold ${textColor}`}>{t("booking.title")}</h2>
               <p className={`text-sm ${mutedTextColor}`}>{pkg.name}</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Date */}
          <div>
            <label className={`block text-sm font-medium ${mutedTextColor}`}>{t("booking.startDate")}</label>
            <input
              type="date"
              min={today}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              disabled={isSubmitting}
              className={`${baseInputClass} ${errors.startDate ? errorBorderClass : inputBorderClass}`}
            />
            {errors.startDate && <p className="text-red-600 text-sm mt-1 font-medium">{errors.startDate}</p>}
          </div>

          {/* 2. Pax */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${mutedTextColor}`}><Users size={14} className="inline mr-1" /> {t("trip.adult")}</label>
              <input type="number" min={1} value={adults} onChange={(e) => setAdults(Number(e.target.value))} required className={baseInputClass} />
            </div>
            <div>
              <label className={`block text-sm font-medium ${mutedTextColor}`}><Users size={14} className="inline mr-1" /> {t("trip.child")}</label>
              <input type="number" min={0} value={children} onChange={(e) => setChildren(Number(e.target.value))} required className={baseInputClass} />
            </div>
          </div>

          {/* SECTION 2: Price Notification - Sesuai Desain Asli User */}
          <div className="bg-blue-100 dark:bg-blue-900/40 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-700 flex items-start gap-3 shadow-sm transition-colors">
              <AlertCircle size={20} className="text-blue-700 dark:text-black mt-0.5 shrink-0" />
              <div className="text-sm">
                  <p className="font-bold text-blue-900 dark:text-blue-100 uppercase tracking-tight text-xs">Price Tier Applied:</p>
                  <p className="text-blue-800 dark:text-blue-200 mt-1 font-medium">
                      {totalPax} Participants @ <strong className="text-base text-black dark:text-blue-50">{formatPrice(pricePerPax)}</strong> /pax
                  </p>
              </div>
          </div>

          {/* ADD-ONS */}
          {pkg.addons && pkg.addons.length > 0 && (
            <div className="space-y-3 pt-2">
              <label className={`block text-sm font-bold ${textColor} flex items-center gap-2`}><Camera size={16} /> {t("booking.enhanceTrip")}</label>
              <div className="grid grid-cols-1 gap-2">
                {pkg.addons.map((addon) => {
                  const isSelected = selectedAddons.includes(addon.name);
                  return (
                    <div key={addon.name} onClick={() => !isCheckingCode && toggleAddon(addon.name)} className={`relative flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ${addonCardClass} ${isSelected ? addonSelectedClass : ""}`}>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${isSelected ? "bg-primary border-primary" : "border-gray-400"}`}>{isSelected && <Plus size={14} className="text-white" />}</div>
                      <div className="flex-1"><p className={`font-medium text-sm ${textColor}`}>{addon.name}</p><p className={`text-xs ${mutedTextColor}`}>+ {formatPrice(Number(addon.price))}</p></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Nationality */}
          <div>
              <label className={`block text-sm font-medium ${mutedTextColor}`}><Flag size={14} className="inline mr-1" /> {t("booking.nationality.title")}</label>
              <select value={nationality} onChange={(e) => setNationality(e.target.value)} required className={baseInputClass}>
                 <option value="">{t("booking.selectOption")}</option>
                 <option value="WNI">{t("booking.nationality.local")}</option>
                 <option value="WNA">{t("booking.nationality.foreign")}</option>
              </select>
          </div>

           {/* User Info Inputs - ORIGINAL DESIGN */}
           <div className="space-y-4 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
             <div className="flex items-center justify-between">
                <label className={`block text-sm font-medium ${mutedTextColor}`}>{t("booking.fullName")}</label>
                {/* ✅ TOMBOL EDIT PROFIL DIPERBESAR */}
                <button type="button" onClick={() => router.push("/profile?tab=profile")} className="text-xs sm:text-sm font-bold text-primary hover:bg-primary/10 px-4 py-2 rounded-lg border border-primary/20 flex items-center gap-2 transition-all">
                  <ExternalLink size={14} /> Update Profile
                </button>
             </div>
             <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className={baseInputClass} />
             
             <div>
                <label className={`block text-sm font-medium ${mutedTextColor}`}><Mail size={14} className="inline mr-1" /> {t("booking.email")}</label>
                <input type="email" value={email} disabled className={`${baseInputClass} bg-gray-100 opacity-70 italic font-semibold`} />
             </div>
             
             {/* ✅ WHATSAPP SECTION - FIXED-FLEX ANTI-CUTOFF */}
             <div>
                <label className={`block text-sm font-medium ${mutedTextColor} flex items-center gap-1`}>
                    {t("booking.phone")} <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-row items-stretch h-11 rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary transition-all mt-1">
                  <div className="relative w-[110px] sm:w-[140px] shrink-0 bg-gray-100 border-r border-gray-300">
                    <select value={phoneCode} onChange={(e) => setPhoneCode(e.target.value)} className="absolute inset-0 w-full h-full pl-2 pr-6 bg-transparent outline-none text-[11px] sm:text-xs font-bold appearance-none cursor-pointer truncate">
                      {countryCodes.map((c) => (<option key={c.iso} value={c.code}>{c.label}</option>))}
                    </select>
                    <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="relative flex-1 min-w-0 bg-white">
                    <input type="tel" value={localPhone} onChange={(e) => setLocalPhone(e.target.value.replace(/[^0-9]/g, ""))} className="w-full h-full pl-3 pr-3 bg-transparent outline-none text-sm font-bold tracking-tight" placeholder="8123..." />
                  </div>
                </div>
                {/* Live Preview */}
                <div className="mt-2 flex items-center gap-2 px-1">
                  <div className="flex items-center gap-1.5 py-1 px-2.5 bg-primary/5 rounded-lg border border-primary/10">
                    <Smartphone className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Final Format:</span>
                    <span className="text-xs font-mono font-bold text-primary">{phoneCode}{localPhone || "—"}</span>
                  </div>
                </div>
             </div>

             {/* PICKUP LOCATION */}
             <div>
                <label className={`block text-sm font-medium ${mutedTextColor} flex items-center gap-1`}><MapPin size={14}/> {t("booking.pickupLocation")} :</label>
                <input type="text" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} required placeholder="Hotel Name or Google Maps Link" className={baseInputClass} />
                {!pickupLocation && <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><Info size={10}/> Tip: You can paste a Google Maps link here.</p>}
             </div>
           </div>

           {/* Discount Code */}
           <div>
            <label className={`block text-sm font-medium ${mutedTextColor}`}><TicketPercent size={14} className="inline mr-1" /> {t("booking.discountCode")}</label>
            <div className="flex gap-2 mt-1">
              <input type="text" value={discountCode} onChange={(e) => { setDiscountCode(e.target.value.toUpperCase()); setAppliedDiscount(0); setDiscountMessage(null); }} className={`${baseInputClass} uppercase mt-0`} placeholder="-" />
              <button type="button" onClick={handleApplyCode} disabled={!discountCode.trim() || isCheckingCode} className="bg-primary hover:brightness-95 text-black font-semibold py-2 px-5 rounded-md transition-all active:scale-95 flex items-center justify-center min-w-20">
                {isCheckingCode ? <Loader2 size={16} className="animate-spin" /> : "Apply"}
              </button>
            </div>
            {discountMessage && (
               <div className={`mt-2 text-xs flex items-center gap-1.5 font-medium ${discountMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {discountMessage.type === 'success' ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>} {discountMessage.text}
               </div>
            )}
          </div>

          {/* Summary Section - ORIGINAL STYLE */}
          <div className={`pt-4 space-y-2 bg-gray-50 dark:bg-gray-900/40 p-5 rounded-lg border ${inputBorderClass}`}>
            <div className="flex justify-between items-center text-sm">
              <span className={mutedTextColor}>{t("pricing.pricePerPax")} ({totalPax}x)</span>
              <span className={`font-medium ${textColor}`}>{formatPrice(pricePerPax)}</span>
            </div>
            {addonsTotal > 0 && <div className="flex justify-between items-center text-sm"><span className={mutedTextColor}>Add-ons</span><span className={`font-medium ${textColor}`}>+ {formatPrice(addonsTotal)}</span></div>}
            {appliedDiscount > 0 && <div className="flex justify-between items-center text-sm text-green-600 font-bold"><span>Discount</span><span>- {formatPrice(appliedDiscount)}</span></div>}
            <div className={`flex justify-between items-center border-t ${inputBorderClass} pt-3 mt-2`}>
              <p className={`text-lg font-bold ${textColor}`}>{t("booking.subtotal")}:</p>
              <p className="text-2xl font-black text-primary">{formatPrice(grandTotal)}</p>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting || isCheckingCode} className="w-full bg-primary text-black font-bold py-4 px-4 rounded-lg hover:brightness-95 disabled:opacity-50 transition-all active:scale-[0.98] shadow-lg shadow-primary/10">
            {isSubmitting ? <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" /> Processing...</span> : t("booking.confirm")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PackageBookingModal;