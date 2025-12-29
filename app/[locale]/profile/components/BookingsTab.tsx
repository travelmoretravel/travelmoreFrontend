"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { useLocale } from "next-intl";
import { formatCurrency, formatDate, getStatusChip } from "@/lib/utils";
import {
  User, Phone, MapPin, Clock, Users, Package, Plane, ArrowRight,
  RefreshCcw, Calendar, Car, Map, Ticket, LucideIcon, CreditCard,
  Wallet, CalendarDays, MapPinned, PlusCircle
} from "lucide-react";

// Import Base Types
import { SimpleBooking as BaseSimpleBooking, BookingDetails as BaseBookingDetails, Bookable as BaseBookable } from "../types";
import RefundModal from "./RefundModal";

// --- LOCAL TYPE DEFINITIONS ---

export interface OrderItem {
  id: number;
  name: string | null;
  quantity: number;
  price: number;
  orderable_type: string;
}

export interface Order {
  id: number;
  order_number: string;
  subtotal: number | string;
  discount_amount: number | string;
  total_amount: number | string;
  order_items: OrderItem[];
}

interface Bookable extends BaseBookable {
  duration?: number | string | null;
  days?: number | string | null;
  total_days?: number | string | null;
}

/**
 * Extended SimpleBooking to match the API payload while remaining
 * compatible with components expecting the base type.
 */
interface ExtendedSimpleBooking extends Omit<BaseSimpleBooking, 'bookable' | 'details'> {
  order?: Order | null;
  bookable: Bookable | null;
  details: BookingDetailsJSON;
}

/**
 * Redefining details to handle API snapshots correctly and avoid 'addons' type conflict.
 */
interface BookingDetailsJSON extends Omit<BaseBookingDetails, 'addons'> {
  service_name?: string;
  full_name?: string;
  fullName?: string;
  phone_number?: string;
  phone?: string;
  email?: string;
  special_request?: string;
  pickup_location?: string;
  pickup_time?: string;
  quantity?: number;
  num_participants?: number;
  adults?: number;
  children?: number;
  meeting_point?: string;
  destination?: string;
  trip_type?: string;
  tripType?: string;
  budget_pack?: string;
  budgetPack?: string;
  departure_date?: string;
  departureDate?: string;
  duration?: string | number;
  days?: string | number;
  city?: string;
  province?: string;
  country?: string;
  pax_adults?: number | string;
  paxAdults?: number | string;
  pax_teens?: number | string;
  paxTeens?: number | string;
  pax_kids?: number | string;
  paxKids?: number | string;
  pax_seniors?: number | string;
  paxSeniors?: number | string;
  travel_type?: string;
  travelType?: string;
  travel_style?: string[];
  travelStyle?: string[];
  selected_addons?: Array<{ name: string; price: number }>;
  addons?: Array<{ name: string; price: number }>;
}

// --- HELPERS ---

/**
 * Ensures a string is returned for the item name, matching addons or snapshots.
 */
const getOrderItemName = (item: OrderItem, details: BookingDetailsJSON): { name: string; isAddon: boolean } => {
  const addons = details.selected_addons || details.addons;
  if (Array.isArray(addons)) {
    const matchedAddon = addons.find((a) =>
      typeof a === "object" && a !== null && 'price' in a && Math.abs(Number((a as {price: number}).price) - Number(item.price)) < 1
    );
    if (matchedAddon) return { name: String(matchedAddon.name), isAddon: true };
  }

  if (item.name) return { name: String(item.name), isAddon: false };

  const snapshotName = details.service_name || details.name || details.activity_name;
  if (snapshotName) return { name: String(snapshotName), isAddon: false };

  return { name: "Service Item", isAddon: false };
};

// --- SUB-COMPONENTS ---

const DetailRow = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value?: string | number | null }) => {
  if (value === undefined || value === null || value === "-" || value === "0 Pax" || value === "0") return null;
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="min-w-5 text-primary">
        <Icon size={16} />
      </div>
      <div className="flex flex-col">
        <span className="text-foreground/70 text-[10px] uppercase font-bold tracking-wider leading-tight">{label}</span>
        <span className="font-medium text-foreground text-sm">{value}</span>
      </div>
    </div>
  );
};

function OrderItemsBreakdown({ booking }: { booking: ExtendedSimpleBooking }) {
  const order = booking.order;
  if (!order || !order.order_items || order.order_items.length === 0) return null;

  return (
    <div className="mt-6 border-t border-dashed border-border pt-4">
      <div className="flex items-center gap-2 mb-4">
        <Package size={14} className="text-muted-foreground" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Order Breakdown
        </span>
      </div>

      <div className="space-y-3">
        {order.order_items.map((item) => {
          const { name, isAddon } = getOrderItemName(item, booking.details);
          return (
            <div key={item.id} className="flex justify-between items-start text-sm">
              <div className="flex gap-3">
                <div className={`mt-1 p-1 rounded ${isAddon ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"}`}>
                  {isAddon ? <PlusCircle size={12} /> : <Ticket size={12} />}
                </div>
                <div className="flex flex-col">
                  {/* String() wrapper ensures React can render the value without {} type errors */}
                  <span className="font-semibold text-foreground leading-tight">{String(name)}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">
                    {isAddon ? "Service Add-on" : "Base Service"}
                  </span>
                </div>
              </div>
              <div className="flex gap-6 items-center pl-4">
                <span className="text-xs text-muted-foreground font-medium">x{item.quantity}</span>
                <span className="font-bold text-foreground">{formatCurrency(item.price)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-border/40 space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Items Subtotal</span>
          <span>{formatCurrency(Number(order.subtotal))}</span>
        </div>
        {Number(order.discount_amount) > 0 && (
          <div className="flex justify-between text-xs text-red-600 font-bold">
            <span>Discount Applied</span>
            <span>-{formatCurrency(Number(order.discount_amount))}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceSpecificDetails({ booking }: { booking: ExtendedSimpleBooking }) {
  const details = booking.details;
  const { bookable_type, bookable } = booking;
  const type = bookable_type?.split("\\").pop() || "";

  const getVal = (keySnake: string, keyCamel: string): string | number | null => {
    const valSnake = details[keySnake as keyof BookingDetailsJSON];
    if (typeof valSnake === 'string' || typeof valSnake === 'number') return valSnake;

    const valCamel = details[keyCamel as keyof BookingDetailsJSON];
    if (typeof valCamel === 'string' || typeof valCamel === 'number') return valCamel;

    return null;
  };

  if (type === "CarRental") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-dashed border-border/50">
          <Car size={18} className="text-blue-500" />
          <span className="font-semibold text-blue-700">Vehicle Rental</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DetailRow icon={Car} label="Car Model" value={`${bookable?.brand || ""} ${bookable?.car_model || ""}`} />
          <DetailRow icon={Phone} label="Contact" value={getVal("phone_number", "phone")} />
          <DetailRow icon={MapPin} label="Pickup" value={getVal("pickup_location", "pickup_location")} />
          <DetailRow icon={Clock} label="Pickup Time" value={getVal("pickup_time", "pickup_time")} />
        </div>
      </div>
    );
  }

  if (type === "Activity") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-dashed border-border/50">
          <Ticket size={18} className="text-orange-500" />
          <span className="font-semibold text-orange-700">Activity / Ticket</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DetailRow icon={Ticket} label="Activity Name" value={bookable?.name} />
          <DetailRow icon={Users} label="Participants" value={getVal("quantity", "num_participants")} />
          <DetailRow icon={MapPin} label="Meeting Point" value={getVal("pickup_location", "meeting_point")} />
          <DetailRow icon={Calendar} label="Date" value={formatDate(booking.start_date)} />
        </div>
      </div>
    );
  }

  if (type === "HolidayPackage" || type === "OpenTrip") {
    const paxCount = (Number(details.adults) || 0) + (Number(details.children) || 0) + (Number(details.num_participants) || 0) || 1;
    const meetingPointDisplay = (getVal("pickup_location", "meeting_point") || "See Voucher") as string;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-dashed border-border/50">
          <Package size={18} className="text-emerald-500" />
          <span className="font-semibold text-emerald-700">{type === "OpenTrip" ? "Open Trip" : "Holiday Package"}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DetailRow icon={Map} label="Destination" value={bookable?.name} />
          <DetailRow icon={Users} label="Travelers" value={`${paxCount} Pax`} />
          <DetailRow icon={MapPin} label="Meeting Point" value={meetingPointDisplay} />
        </div>
      </div>
    );
  }

  if (type === "TripPlanner") {
    const adults = Number(details.pax_adults || details.paxAdults || 0);
    const teens = Number(details.pax_teens || details.paxTeens || 0);
    const kids = Number(details.pax_kids || details.paxKids || 0);
    const seniors = Number(details.pax_seniors || details.paxSeniors || 0);

    let totalPax = adults + teens + kids + seniors;
    if (totalPax === 0) {
      totalPax = Number(details.quantity) || Number(details.num_participants) || 1;
    }

    const city = getVal("city", "city") as string;
    const province = getVal("province", "province") as string;
    const country = getVal("country", "country") as string;
    let locationDisplay = (getVal("destination", "destination") as string) || "Custom Destination";

    if (city) {
      const tripType = getVal("trip_type", "tripType");
      locationDisplay = tripType === "domestic" ? `🇮🇩 ${city}${province ? `, ${province}` : ""}` : `🌐 ${city}${country ? `, ${country}` : ""}`;
    }

    const rawDate = (getVal("departure_date", "departureDate") as string) || booking.start_date;

    let rawDuration: string | number | null = getVal("duration", "duration") || getVal("days", "days");

    if (!rawDuration && bookable) {
      rawDuration = bookable.duration || bookable.days || bookable.total_days || null;
    }

    let durationDisplay = "1 Day";
    if (rawDuration) {
      const strVal = String(rawDuration);
      durationDisplay = strVal.toLowerCase().includes("day") || strVal.toLowerCase().includes("hari") ? strVal : `${strVal} Days`;
    }

    const dateDisplay = rawDate ? `${formatDate(rawDate)} (${durationDisplay})` : "Date TBA";
    const contactDisplay = (getVal("phone", "phone_number") as string) || "-";
    const bookedBy = (getVal("full_name", "fullName") as string) || "-";
    const budget = (getVal("budget_pack", "budgetPack") as string) || "Standard";
    const travelType = (getVal("travel_type", "travelType") as string) || "Personal";
    const travelStyles = (details.travel_style || details.travelStyle || []) as string[];

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-dashed border-border/50">
          <Plane size={18} className="text-purple-500" />
          <span className="font-semibold text-purple-700">Custom Trip Plan</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
          <DetailRow icon={MapPinned} label="Destination" value={locationDisplay} />
          <DetailRow icon={CalendarDays} label="Date & Duration" value={dateDisplay} />
          <DetailRow icon={User} label="Booked For" value={bookedBy} />
          <DetailRow icon={Phone} label="Contact" value={contactDisplay} />
          <DetailRow icon={Users} label="Travelers" value={`${totalPax} Pax (${travelType})`} />
          <DetailRow icon={Wallet} label="Budget Tier" value={budget.toUpperCase()} />
        </div>
        {travelStyles.length > 0 && (
          <div className="mt-3 pt-2 border-t border-dashed border-border/40 text-xs text-foreground/80">
            <span className="font-bold mr-1">Requested Style:</span> {travelStyles.join(", ")}
          </div>
        )}
      </div>
    );
  }

  return <p className="text-sm text-foreground/60 italic">Service details not available.</p>;
}

// --- MAIN COMPONENT ---

export default function BookingsTab() {
  const locale = useLocale();
  const [bookings, setBookings] = useState<ExtendedSimpleBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedBookingForRefund, setSelectedBookingForRefund] = useState<ExtendedSimpleBooking | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/my-bookings");
      setBookings(response.data);
    } catch (err) {
      setError("Failed to fetch your bookings.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenRefund = (booking: ExtendedSimpleBooking) => {
    setSelectedBookingForRefund(booking);
    setIsRefundModalOpen(true);
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <div className="animate-fadeIn space-y-6 relative">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <h2 className="text-2xl font-bold">My Bookings</h2>
        <span className="text-xs text-muted-foreground hidden sm:block">Manage your trips and vouchers</span>
      </div>

      <div className="space-y-4">
        {bookings.map((booking) => {
          const details = booking.details;
          const bookable = booking.bookable;
          const serviceName = details.service_name || bookable?.name || "Service Booking";
          const detailUrl = `/${locale}/profile/bookings/${booking.id}`;
          const historyUrl = `/${locale}/profile?tab=history`;
          const isPaid = booking.payment_status === "paid";
          const canRefund = isPaid && (booking.status === "confirmed" || booking.status === "pending");

          return (
            <div key={booking.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-4 flex justify-between items-start bg-muted/20 border-b border-border/50">
                <h3 className="font-bold text-lg">{serviceName}</h3>
                <div className="flex flex-col items-end gap-1">
                  <span className={getStatusChip(booking.status)}>{booking.status.toUpperCase()}</span>
                  {!isPaid && (
                    <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                      {booking.payment_status?.toUpperCase() || "UNPAID"}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4">
                <ServiceSpecificDetails booking={booking} />
                <OrderItemsBreakdown booking={booking} />
              </div>

              <div className="bg-muted/10 p-4 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Final Total</span>
                  <span className="font-bold text-lg text-primary">{formatCurrency(booking.total_price)}</span>
                </div>

                <div className="flex items-center gap-3">
                  {canRefund && (
                    <button
                      onClick={() => handleOpenRefund(booking)}
                      className="flex items-center gap-2 px-4 py-2 border border-border bg-background text-sm font-semibold rounded-full hover:bg-red-50 hover:text-red-600 transition-all"
                    >
                      <RefreshCcw size={16} /> Request Refund
                    </button>
                  )}

                  {isPaid ? (
                    <Link href={detailUrl} className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-full hover:brightness-110 shadow-sm transition-all">
                      View Voucher <ArrowRight size={16} />
                    </Link>
                  ) : (
                    <Link href={historyUrl} className="flex items-center gap-2 px-5 py-2 bg-orange-500 text-white text-sm font-bold rounded-full hover:bg-orange-600 shadow-sm transition-all">
                      <CreditCard size={16} /> Pay Now
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {bookings.length === 0 && !loading && <div className="text-center py-10 text-muted-foreground">You don&apos;t have any bookings yet.</div>}
      </div>

      {selectedBookingForRefund && (
        <RefundModal 
          isOpen={isRefundModalOpen} 
          onClose={() => setIsRefundModalOpen(false)} 
          booking={selectedBookingForRefund as unknown as BaseSimpleBooking} // Bridging compatibility
          onSuccess={fetchData} 
        />
      )}
    </div>
  );
}