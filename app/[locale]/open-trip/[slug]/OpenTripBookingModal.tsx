"use client";

import React, { useState, FormEvent, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";
import { 
  X, MapPin, User, Mail, Phone, Flag, TicketPercent, 
  CheckCircle2, AlertCircle, Loader2, Users, Calendar, 
  Plus, Smartphone, ChevronDown, ExternalLink, ShieldCheck 
} from "lucide-react"; 
import { useTheme } from "@/components/ThemeProvider";
import axios, { AxiosError } from "axios";
import { OpenTrip, AuthUser } from "@/types/opentrip";

// ✅ Mengatasi error TypeScript dengan meng-extend tipe AuthUser
interface ExtendedAuthUser extends AuthUser {
  full_name?: string;
  nationality?: string;
  phone_number?: string;
}

interface ApiCheckPriceResponse {
  discount_amount: number;
  total_amount: number;
  message?: string;
}

interface OpenTripBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: OpenTrip;
  user: AuthUser | null; 
  t: (key: string) => string; 
}

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

const OpenTripBookingModal: React.FC<OpenTripBookingModalProps> = ({ isOpen, onClose, pkg, user, t }) => {
  const router = useRouter();
  const { theme } = useTheme();
  const today = new Date().toISOString().split("T")[0];

  // --- STATE ---
  const [startDate, setStartDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCode, setPhoneCode] = useState("+62");
  const [localPhone, setLocalPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");
  const [selectedMeetingPoint, setSelectedMeetingPoint] = useState("");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [discountMessage, setDiscountMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  // ✅ LOGIKA SINKRONISASI DATA PROFIL (Safe Casting)
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
      setSelectedMeetingPoint("");
      setSpecialRequest("");
      setDiscountCode("");
      setAppliedDiscount(0); 
      setDiscountMessage(null);
      setSelectedAddons([]); 
      setErrors({});
    }
  }, [isOpen, user]);

  const formatPrice = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

  const toggleAddon = (addonName: string) => {
    setSelectedAddons((prev) => 
      prev.includes(addonName) ? prev.filter((item) => item !== addonName) : [...prev, addonName]
    );
  };

  const handleApplyCode = useCallback(async () => {
    if (!discountCode.trim()) return;
    setIsCheckingCode(true);
    try {
      const response = await api.post<ApiCheckPriceResponse>('/booking/check-price', {
        type: 'open_trip',
        id: pkg.id,
        discount_code: discountCode,
        adults,
        children,
        selected_addons: selectedAddons
      });
      if (response.data.discount_amount > 0) {
        setAppliedDiscount(response.data.discount_amount);
        setDiscountMessage({ type: 'success', text: `Code applied! Saved ${formatPrice(response.data.discount_amount)}` });
      } else {
        setAppliedDiscount(0);
        setDiscountMessage({ type: 'error', text: "No discount applicable." });
      }
    } catch (err: unknown) {
      const error = err as AxiosError<{message: string}>;
      setAppliedDiscount(0);
      setDiscountMessage({ type: 'error', text: error.response?.data?.message || "Invalid code." });
    } finally { setIsCheckingCode(false); }
  }, [pkg.id, discountCode, adults, children, selectedAddons]);

  useEffect(() => {
    if (appliedDiscount > 0 && discountCode) {
      const timer = setTimeout(() => handleApplyCode(), 500); 
      return () => clearTimeout(timer);
    }
  }, [adults, children, selectedAddons, appliedDiscount, discountCode, handleApplyCode]);

  const { pricePerPax, totalPax, addonsTotal, grandTotal } = useMemo(() => {
    const count = adults + children;
    let finalPrice = Number(pkg.starting_from_price) || 0;
    
    if (pkg.price_tiers && pkg.price_tiers.length > 0) {
        const sortedTiers = [...pkg.price_tiers].sort((a, b) => a.min_pax - b.min_pax);
        const foundTier = sortedTiers.find(tier => {
            const min = Number(tier.min_pax);
            const max = tier.max_pax ? Number(tier.max_pax) : Infinity;
            return count >= min && count <= max;
        });
        if (foundTier) finalPrice = Number(foundTier.price);
        else if (count > 0) {
             const lastTier = sortedTiers[sortedTiers.length - 1];
             if (count > Number(lastTier.max_pax)) finalPrice = Number(lastTier.price);
        }
    }

    const addonsCost = selectedAddons.reduce((sum, addonName) => {
        const addon = pkg.addons?.find(a => a.name === addonName);
        return sum + (addon ? Number(addon.price) : 0);
    }, 0);

    const baseTotal = (finalPrice * count) + addonsCost;
    return { pricePerPax: finalPrice, totalPax: count, addonsTotal: addonsCost, grandTotal: Math.max(0, baseTotal - appliedDiscount) };
  }, [adults, children, pkg, selectedAddons, appliedDiscount]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!startDate) newErrors.startDate = "Date is required";
    if (!selectedMeetingPoint) newErrors.meetingPoint = "Meeting point is required";
    if (!fullName) newErrors.fullName = "Full Name is required";
    if (!localPhone) newErrors.phone = "WhatsApp number is required";
    if (!nationality) newErrors.nationality = "Nationality is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!user) { toast.error("Please login first"); return; }

    setIsSubmitting(true);
    try {
      const payload = {
        start_date: startDate,
        adults,
        children,
        full_name: fullName,
        email,
        phone_number: `${phoneCode}${localPhone.replace(/[^0-9]/g, "")}`,
        participant_nationality: nationality,
        pickup_location: selectedMeetingPoint, 
        special_request: specialRequest || null,
        discount_code: appliedDiscount > 0 ? discountCode : null,
        selected_addons: selectedAddons, 
      };

      const response = await api.post(`/open-trips/${pkg.id}/book`, payload);
      if (response.status === 201 || response.status === 200) {
        toast.success("Booking successful!");
        router.push("/profile?tab=bookings");
        onClose();
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        toast.error(Object.values(error.response.data.errors)[0] as string);
      } else {
        toast.error("Booking failed. Please try again.");
      }
    } finally { setIsSubmitting(false); }
  };

  if (!isOpen) return null;

  // --- STYLING VARS ---
  const modalBgClass = theme === "regular" ? "bg-white" : "bg-card";
  const textColor = theme === "regular" ? "text-gray-900" : "text-foreground";
  const mutedTextColor = theme === "regular" ? "text-gray-600" : "text-foreground/70";
  const inputBgClass = theme === "regular" ? "bg-gray-50" : "bg-background";
  const inputBorderClass = theme === "regular" ? "border-gray-300" : "border-border";
  const baseInputClass = `mt-1 block w-full rounded-md shadow-sm ${inputBgClass} focus:ring-primary focus:border-primary ${textColor} placeholder:${mutedTextColor} border ${inputBorderClass} disabled:opacity-50 disabled:cursor-not-allowed py-2 px-3`;
  const addonCardClass = theme === "regular" ? "border-gray-200 hover:border-primary bg-white" : "border-gray-700 hover:border-primary bg-gray-800";
  const addonSelectedClass = "border-primary ring-1 ring-primary bg-primary/10 dark:bg-primary/20";

  return (
    <div className="fixed inset-0 z-1000 flex justify-center items-start bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
      <div className={`${modalBgClass} rounded-xl shadow-xl p-6 sm:p-8 w-full max-w-lg relative my-10 animate-in zoom-in-95 duration-200`}>
        <button onClick={onClose} className={`absolute top-4 right-4 ${mutedTextColor} hover:${textColor} transition-colors`}><X size={24} /></button>

        <div className="sm:flex sm:items-start mb-6 border-b border-border pb-4">
          <div className="w-full text-center sm:text-left">
            <h2 className={`text-2xl font-bold ${textColor}`}>{t("title") || "Booking Form"}</h2>
            <p className={`text-sm ${mutedTextColor} mt-1`}>{pkg.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* SECTION 1: Date & Pax */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${mutedTextColor}`}><Calendar size={14} className="inline mr-1" /> Select Date :</label>
              <input type="date" min={today} value={startDate} onChange={(e) => setStartDate(e.target.value)} required className={`${baseInputClass} ${errors.startDate ? 'border-red-500' : ''}`} />
              {errors.startDate && <p className="text-red-600 text-xs mt-1 font-medium">{errors.startDate}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-sm font-medium ${mutedTextColor}`}><Users size={14} className="inline mr-1" /> Adults :</label>
                <input type="number" min={1} value={adults} onChange={(e) => setAdults(Number(e.target.value))} required className={baseInputClass} />
              </div>
              <div>
                <label className={`block text-sm font-medium ${mutedTextColor}`}><Users size={14} className="inline mr-1" /> Kids :</label>
                <input type="number" min={0} value={children} onChange={(e) => setChildren(Number(e.target.value))} required className={baseInputClass} />
              </div>
            </div>
          </div>

          {/* SECTION 2: Price Notification */}
          <div className="bg-blue-100 dark:bg-blue-900/40 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-700 flex items-start gap-3 shadow-sm transition-colors">
              <AlertCircle size={20} className="text-blue-700 dark:text-black mt-0.5 shrink-0" />
              <div className="text-sm">
                  <p className="font-bold text-blue-900 dark:text-blue-100 uppercase tracking-tight text-xs">Price Tier Applied:</p>
                  <p className="text-blue-800 dark:text-blue-200 mt-1 font-medium">
                      {totalPax} Participants @ <strong className="text-base text-black dark:text-blue-50">{formatPrice(pricePerPax)}</strong> /pax
                  </p>
              </div>
          </div>

          {/* SECTION 3: Add-ons */}
          {pkg.addons && pkg.addons.length > 0 && (
            <div className="space-y-3 pt-2">
              <label className={`block text-sm font-bold ${textColor} flex items-center gap-2`}><Plus size={16} className="text-primary" /> Optional Add-ons :</label>
              <div className="grid grid-cols-1 gap-2">
                {pkg.addons.map((addon) => {
                  const isSelected = selectedAddons.includes(addon.name);
                  return (
                    <div key={addon.name} onClick={() => toggleAddon(addon.name)} className={`relative flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ${addonCardClass} ${isSelected ? addonSelectedClass : ""}`}>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${isSelected ? "bg-primary border-primary" : "border-gray-400"}`}>{isSelected && <Plus size={14} className="text-white" />}</div>
                      <div className="flex-1"><p className={`font-medium text-sm ${textColor}`}>{addon.name}</p><p className={`text-xs ${mutedTextColor}`}>+ {formatPrice(Number(addon.price))}</p></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 4: Meeting Point */}
          <div>
            <label className={`block text-sm font-medium ${mutedTextColor}`}><MapPin size={14} className="inline mr-1"/> Meeting Point :</label>
            {pkg.meeting_points && pkg.meeting_points.length > 0 ? (
                <select value={selectedMeetingPoint} onChange={(e) => setSelectedMeetingPoint(e.target.value)} required className={baseInputClass}>
                    <option value="">-- Select Meeting Point --</option>
                    {pkg.meeting_points.map((mp, idx) => (<option key={idx} value={`${mp.name}`}>{mp.name} {mp.time ? `- ${mp.time}` : ""}</option>))}
                </select>
            ) : ( <input type="text" placeholder="e.g. Stasiun Tugu" value={selectedMeetingPoint} onChange={(e) => setSelectedMeetingPoint(e.target.value)} required className={baseInputClass} /> )}
          </div>

          {/* SECTION 5: Contact Details */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <h3 className={`text-base font-bold ${textColor}`}>Contact Details</h3>
              <button 
                type="button" 
                onClick={() => router.push("/profile?tab=profile")}
                className="text-xs sm:text-sm font-bold text-primary hover:bg-primary hover:text-white flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg transition-all border border-primary/20 shadow-sm"
              >
                <ExternalLink size={14} /> 
                Update Profile Info
              </button>
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${mutedTextColor}`}><User size={14} className="inline mr-1"/> Full Name :</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className={baseInputClass} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className={`block text-sm font-medium ${mutedTextColor}`}><Flag size={14} className="inline mr-1"/> Nationality :</label>
                  <select value={nationality} onChange={(e) => setNationality(e.target.value)} required className={baseInputClass}>
                      <option value="">-- Select --</option>
                      <option value="WNI">WNI (Indonesian)</option>
                      <option value="WNA">WNA (Foreigner)</option>
                      {nationality && !["WNI", "WNA"].includes(nationality) && (
                          <option value={nationality}>{nationality}</option>
                      )}
                  </select>
               </div>
               <div>
                  <label className={`block text-sm font-medium ${mutedTextColor}`}><Mail size={14} className="inline mr-1"/> Email :</label>
                  <input type="email" value={email} disabled className={`${baseInputClass} bg-gray-100 opacity-70 italic font-semibold`} />
               </div>
            </div>

            {/* WhatsApp Section */}
            <div>
              <label className={`block text-sm font-medium ${mutedTextColor}`}><Phone size={14} className="inline mr-1"/> WhatsApp Number :</label>
              <div className="flex flex-row items-stretch h-11 rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary transition-all mt-1">
                <div className="relative w-[130px] sm:w-[150px] shrink-0 bg-gray-100 border-r border-gray-300">
                  <select
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                    className="absolute inset-0 w-full h-full pl-2 pr-6 bg-transparent outline-none text-[11px] sm:text-xs font-bold appearance-none cursor-pointer truncate"
                  >
                    {countryCodes.map((c) => (
                      <option key={c.iso} value={c.code} className="text-black">{c.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative flex-1 min-w-0 bg-white">
                  <input
                    type="tel"
                    value={localPhone}
                    onChange={(e) => setLocalPhone(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full h-full pl-3 pr-3 bg-transparent outline-none text-sm font-bold tracking-tight"
                    placeholder="8123..."
                  />
                </div>
              </div>
              {/* Preview */}
              <div className="mt-2 flex items-center gap-2 px-1">
                <div className="flex items-center gap-1.5 py-1 px-3 bg-primary/5 rounded-lg border border-primary/10">
                  <Smartphone className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Final Format:</span>
                  <span className="text-xs font-mono font-bold text-primary">{phoneCode}{localPhone || "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 6: Discount */}
          <div>
            <label className={`block text-sm font-medium ${mutedTextColor} flex items-center gap-1`}><TicketPercent size={14} /> Discount Code :</label>
            <div className="flex gap-2 mt-1">
              <input type="text" value={discountCode} onChange={(e) => { setDiscountCode(e.target.value.toUpperCase()); setAppliedDiscount(0); setDiscountMessage(null); }} className={`${baseInputClass} uppercase mt-0`} placeholder="-" />
              <button type="button" onClick={handleApplyCode} disabled={!discountCode.trim() || isCheckingCode} className="bg-primary hover:brightness-95 text-black font-semibold py-2 px-5 rounded-md transition-all active:scale-95 flex items-center justify-center min-w-20">
                {isCheckingCode ? <Loader2 size={16} className="animate-spin" /> : "Apply"}
              </button>
            </div>
            {discountMessage && (
              <div className={`mt-2 text-xs flex items-center gap-1.5 font-medium ${discountMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {discountMessage.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} {discountMessage.text}
              </div>
            )}
          </div>

          {/* Summary Section */}
          <div className={`pt-4 space-y-2 bg-gray-50 dark:bg-gray-900/40 p-5 rounded-lg border ${inputBorderClass}`}>
            <div className="flex justify-between items-center text-sm">
              <span className={mutedTextColor}>Base Price ({totalPax} Pax)</span>
              <span className={`font-medium ${textColor}`}>{formatPrice(pricePerPax * totalPax)}</span>
            </div>
            {addonsTotal > 0 && <div className="flex justify-between items-center text-sm"><span className={mutedTextColor}>Add-ons</span><span className={`font-medium ${textColor}`}>+ {formatPrice(addonsTotal)}</span></div>}
            {appliedDiscount > 0 && <div className="flex justify-between items-center text-sm text-green-600 font-bold"><span>Discount</span><span>- {formatPrice(appliedDiscount)}</span></div>}
            <div className={`flex justify-between items-center border-t ${inputBorderClass} pt-3 mt-2`}>
              <p className={`text-lg font-bold ${textColor}`}>Total Amount :</p>
              <p className="text-2xl font-black text-primary">{formatPrice(grandTotal)}</p>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting || isCheckingCode} className="w-full bg-primary text-black font-bold py-4 px-4 rounded-lg hover:brightness-95 disabled:opacity-50 transition-all active:scale-[0.98] shadow-lg shadow-primary/10">
            {isSubmitting ? <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" /> Processing...</span> : "Join Open Trip"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OpenTripBookingModal;