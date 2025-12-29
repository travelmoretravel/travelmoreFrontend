"use client";

import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { 
  User, 
  Mail, 
  Phone, 
  Globe, 
  ShieldCheck, 
  ChevronDown,
  Loader2,
  AlertCircle,
  Smartphone
} from "lucide-react";

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
  { code: "+971", label: "United Arab Emirates (+971)", iso: "AE" },
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

export default function SettingsTab() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneCode, setPhoneCode] = useState("+62");
  const [localPhone, setLocalPhone] = useState("");
  const [nationality, setNationality] = useState<"WNI" | "WNA" | "">("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await api.get("/my-profile");
        const profile = response.data;
        setName(profile.name || user?.name || "");
        setFullName(profile.full_name || "");
        setNationality(profile.nationality || "");

        const fullPhoneNumber = profile.phone_number || "";
        const sortedForMatch = [...countryCodes].sort((a, b) => b.code.length - a.code.length);
        const matchedCode = sortedForMatch.find((c) => fullPhoneNumber.startsWith(c.code));

        if (matchedCode) {
          setPhoneCode(matchedCode.code);
          setLocalPhone(fullPhoneNumber.substring(matchedCode.code.length));
        } else {
          setPhoneCode("+62");
          setLocalPhone(fullPhoneNumber.replace(/^\+62|^0/, ""));
        }
      } catch (err) {
        toast.error("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchProfile();
  }, [user]);

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    const toastId = toast.loading("Saving changes...");

    const cleanLocalPhone = localPhone.replace(/[^0-9]/g, "");
    const fullPhoneNumber = `${phoneCode}${cleanLocalPhone}`;

    try {
      await api.put("/my-profile", {
        name,
        full_name: fullName,
        phone_number: fullPhoneNumber,
        nationality,
      });
      toast.success("Profile updated successfully!", { id: toastId });
    } catch (err: unknown) {
      let message = "Failed to save profile.";
      if (err instanceof AxiosError) message = err.response?.data?.message ?? message;
      toast.error(message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <Loader2 className="animate-spin h-8 w-8 text-primary" />
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
        <p className="text-gray-500 text-base font-medium">Manage your personal identity and secure your communication channels.</p>
      </div>

      {/* Info Notice */}
      <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
        <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm sm:text-base text-amber-900 leading-relaxed">
          <strong>WhatsApp Confirmation:</strong> Please ensure your number is accurate. 
          The admin team will contact you for booking confirmations and real-time coordination via WhatsApp.
        </div>
      </div>

      <form onSubmit={handleProfileUpdate} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Display Name */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase ml-1">Display Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-base font-medium"
              />
            </div>
          </div>

          {/* Nationality */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase ml-1">Nationality</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
              <select
                value={nationality}
                onChange={(e) => setNationality(e.target.value as "WNI" | "WNA" | "")}
                className="w-full pl-12 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none appearance-none transition-all text-base font-medium"
              >
                <option value="" disabled>Select nationality</option>
                <option value="WNI">WNI (Indonesian Citizen)</option>
                <option value="WNA">WNA (Foreign Citizen)</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Full Name */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase ml-1">Full Legal Name (KTP / Passport)</label>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-base font-medium"
                placeholder="Matches your identity document"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-100 text-gray-500 cursor-not-allowed text-base font-medium italic"
              />
            </div>
          </div>

          {/* WhatsApp Number - POSITIONED UNDER EMAIL & FIX FOR CUT OFF */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase ml-1">WhatsApp Number</label>
            
            <div className="flex flex-row items-stretch h-[54px] rounded-xl border border-gray-200 overflow-hidden focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary transition-all shadow-sm">
              
              {/* FIXED WIDTH DROPDOWN - Mencegah terpotong */}
              <div className="relative w-[130px] sm:w-[170px] shrink-0 bg-gray-100 border-r border-gray-200">
                <select
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value)}
                  className="absolute inset-0 w-full h-full pl-3 pr-8 bg-transparent outline-none text-xs sm:text-sm font-bold appearance-none cursor-pointer truncate"
                >
                  {countryCodes.map((c) => (
                    <option key={c.iso} value={c.code} className="text-black text-sm">
                      {c.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* INPUT AREA - Lebar fleksibel & Teks lebih besar */}
              <div className="relative flex-1 min-w-0 bg-gray-50">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={localPhone}
                  onChange={(e) => setLocalPhone(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full h-full pl-11 pr-4 bg-transparent focus:bg-white outline-none text-lg font-bold tracking-tight"
                  placeholder="812345678"
                />
              </div>
            </div>

            {/* PREVIEW BOX */}
            <div className="mt-3 flex flex-wrap items-center gap-2 px-1">
              <div className="flex items-center gap-2 py-2 px-4 bg-primary/10 rounded-xl border border-primary/20">
                <Smartphone className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-gray-400 uppercase">Final Format:</span>
                <span className="text-base font-mono font-bold text-primary tracking-wider">
                  {phoneCode}{localPhone || "—"}
                </span>
              </div>
              {!localPhone && (
                <span className="text-xs text-amber-500 font-bold italic animate-pulse">
                  ← Enter number digits
                </span>
              )}
            </div>
          </div>

        </div>

        <div className="pt-6 flex justify-end border-t border-gray-100">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-12 py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : null}
            <span className="text-lg">{isSaving ? "Saving changes..." : "Save Profile Changes"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}