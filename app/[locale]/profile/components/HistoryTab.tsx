"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Order as BaseOrder } from "../types"; 
import { toast } from "sonner";
import { useMidtransSnap } from "@/hooks/useMidtransSnap";
import { formatCurrency, formatDate, getStatusChip } from "@/lib/utils";
import OrderPaymentActions from "./OrderPaymentActions";
import { AxiosError } from "axios";
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  User,
  Plane,
  Car,
  Clock,
  Calendar,
  Wallet,
  Compass,
  Users,
  Luggage,
  Ticket,
  FileText,
  Flag,
  PlusCircle,
  Tag,
  Package,
  Mail,
  ListChecks,
  MessageSquare,
  LucideIcon
} from "lucide-react";

// --- TYPES ---

export interface OrderItem {
  id: number;
  name: string | null;
  quantity: number;
  price: number;
  orderable_type: string;
}

// Extend the Base Order type with fields returned by the API
interface Order extends BaseOrder {
  order_items?: OrderItem[];
  subtotal?: string | number;
  discount_amount?: string | number;
}

interface BookingDetails {
  service_name?: string;
  brand?: string;
  car_model?: string;
  pickup_location?: string;
  pickup_time?: string;
  phone_number?: string;
  phone?: string;
  email?: string;
  full_name?: string;
  fullName?: string;
  companyName?: string;
  type?: string;
  trip_type?: string;
  tripType?: string;
  city?: string;
  destination?: string; 
  province?: string;
  country?: string;
  travel_type?: string;
  travelType?: string;
  departure_date?: string;
  departureDate?: string;
  start_date?: string;    
  end_date?: string;      
  duration?: string | number;
  days?: string | number;
  budget_pack?: string;
  budgetPack?: string;
  adults?: number;
  children?: number;
  pax_adults?: string | number;
  paxAdults?: string | number;
  pax_teens?: string | number;
  paxTeens?: string | number;
  pax_kids?: string | number;
  paxKids?: string | number;
  pax_seniors?: string | number;
  paxSeniors?: string | number;
  quantity?: number;
  activity_time?: string;
  special_request?: string;
  price_per_day?: number;
  price_per_person?: number;
  selected_addons?: Array<{ name: string; price: number }>;
  [key: string]: unknown;
}

// --- HELPERS ---

const getOrderItemName = (item: OrderItem, details: BookingDetails) => {
  const addons = details.selected_addons;
  if (Array.isArray(addons)) {
    const matched = addons.find((a) => Math.abs(Number(a.price) - Number(item.price)) < 1);
    if (matched) return { name: matched.name, isAddon: true };
  }
  const dbName = item.name || "";
  if (dbName && !dbName.toLowerCase().includes("service item")) {
    const isAddon = dbName.toLowerCase().includes("add-on");
    return { name: dbName.replace(/Add-on:\s*/i, ""), isAddon };
  }
  return { name: details.service_name || "Service Item", isAddon: false };
};

const ServiceTypeBadge = ({ type }: { type: string }) => {
  const config = type?.includes("CarRental") ? { label: "Car Rental", color: "bg-blue-50 text-blue-700", icon: Car }
    : type?.includes("TripPlanner") ? { label: "Trip Planner", color: "bg-purple-50 text-purple-700", icon: Compass }
    : type?.includes("HolidayPackage") ? { label: "Holiday Package", color: "bg-emerald-50 text-emerald-700", icon: Luggage }
    : type?.includes("Activity") ? { label: "Activity", color: "bg-orange-50 text-orange-700", icon: Ticket }
    : type?.includes("OpenTrip") ? { label: "Open Trip", color: "bg-teal-50 text-teal-700", icon: Flag }
    : { label: "Service", color: "bg-gray-100 text-gray-700", icon: FileText };

  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-current/10 ${config.color} mb-2`}>
      <Icon size={10} /> {config.label}
    </span>
  );
};

const InfoRowDetail = ({ icon: Icon, label, value }: { icon: LucideIcon, label: string, value: React.ReactNode }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 py-1">
      <div className="mt-0.5 text-primary shrink-0"><Icon size={14} /></div>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase font-bold text-muted-foreground leading-tight tracking-wider">{label}</span>
        <span className="text-sm font-medium leading-snug">{value}</span>
      </div>
    </div>
  );
};

// --- FULFILLMENT RENDERERS ---

const CarRentalFulfillment = ({ details }: { details: BookingDetails }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase text-primary mb-2 flex items-center gap-1.5"><Car size={12}/> Specs & Pickup</p>
      <InfoRowDetail icon={Car} label="Vehicle" value={`${details.brand || ""} ${details.car_model || ""}`} />
      <InfoRowDetail icon={Calendar} label="Duration" value={`${details.total_days || 1} Day(s)`} />
      <InfoRowDetail icon={MapPin} label="Location" value={details.pickup_location as string} />
      <InfoRowDetail icon={Clock} label="Time" value={details.pickup_time as string} />
    </div>
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase text-primary mb-2 flex items-center gap-1.5"><Phone size={12}/> Contact & Pricing</p>
      <InfoRowDetail icon={Phone} label="WhatsApp" value={(details.phone_number || details.phone) as string} />
      <InfoRowDetail icon={Tag} label="Daily Rate" value={formatCurrency(details.price_per_day || 0)} />
      <InfoRowDetail icon={Mail} label="Email" value={details.email as string} />
    </div>
  </div>
);

const TripPlannerFulfillment = ({ details }: { details: BookingDetails }) => {
  const adults = parseInt(String(details.paxAdults || details.pax_adults || 0));
  const kids = parseInt(String(details.paxKids || details.pax_kids || 0));
  const totalPax = (adults + kids) || (details.quantity as number) || 1;
  const tripType = details.tripType || details.trip_type;
  let location = (details.destination || details.city || "-") as string;
  if (details.city) location = tripType === "domestic" ? `🇮🇩 ${details.city}` : `🌐 ${details.city}, ${details.country || ""}`;

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 flex gap-3 items-start shadow-sm">
        <Plane size={16} className="text-purple-600 animate-pulse mt-1" />
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-purple-900 uppercase tracking-tight">Crafting Your Dream Trip</p>
          <p className="text-[10px] text-purple-700 leading-tight">Designing your itinerary. Ensure your WhatsApp is correct; we will contact you there.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase text-primary mb-2">Trip Concept</p>
          <InfoRowDetail icon={MapPin} label="Destination" value={location} />
          <InfoRowDetail icon={Clock} label="Duration" value={`${details.duration || details.days || 1} Day(s)`} />
          <InfoRowDetail icon={Wallet} label="Budget Tier" value={((details.budgetPack || details.budget_pack) as string)?.toUpperCase()} />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase text-primary mb-2">Organizer Info</p>
          <InfoRowDetail icon={User} label="Contact" value={(details.fullName || details.companyName || details.full_name) as string} />
          <InfoRowDetail icon={Phone} label="WhatsApp" value={(details.phone || details.phone_number) as string} />
          <InfoRowDetail icon={Users} label="Travel Group" value={`${totalPax} Person(s)`} />
        </div>
      </div>
    </div>
  );
};

const ItemsBreakdownTable = ({ order, details }: { order: Order, details: BookingDetails }) => (
  <div className="mt-6 border border-border rounded-xl overflow-hidden bg-white shadow-sm">
    <div className="bg-slate-50 px-4 py-2 border-b border-border flex items-center gap-2">
      <Package size={14} className="text-primary" />
      <span className="font-bold text-[10px] uppercase tracking-widest text-slate-500">Items Purchased</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <tbody className="divide-y divide-border">
          {order.order_items?.map((item: OrderItem) => {
            const { name, isAddon } = getOrderItemName(item, details);
            return (
              <tr key={item.id} className="text-xs hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded ${isAddon ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"}`}>
                      {isAddon ? <PlusCircle size={14} /> : <Tag size={14} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 leading-tight mb-0.5">{name}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-tight">{isAddon ? "Extra Add-on" : "Base Service"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-bold text-slate-600">x{item.quantity}</td>
                <td className="px-4 py-3 text-right font-black text-slate-900">{formatCurrency(Number(item.price))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    <div className="p-4 bg-slate-50/50 border-t border-border flex flex-col items-end gap-1">
       <div className="flex justify-between w-48 text-[10px] font-bold text-slate-400">
          <span>SUBTOTAL</span><span>{formatCurrency(Number(order.subtotal || order.total_amount))}</span>
       </div>
       {Number(order.discount_amount) > 0 && (
         <div className="flex justify-between w-48 text-[10px] font-black text-red-500">
            <span>DISCOUNT</span><span>-{formatCurrency(Number(order.discount_amount))}</span>
         </div>
       )}
       <div className="flex justify-between w-48 text-sm font-black text-primary border-t border-slate-200 mt-1 pt-2">
          <span>FINAL TOTAL</span><span>{formatCurrency(Number(order.total_amount))}</span>
       </div>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export default function HistoryTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  useMidtransSnap(); 

  const fetchData = async () => {
    setLoading(true);
    try {
      const ordersResponse = await api.get("/my-orders");
      setOrders(ordersResponse.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load purchase history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePayment = async (order: Order, paymentOption: "down_payment" | "full_payment") => {
    if (isPaying || !window.snap) return;
    setIsPaying(true);
    try {
      const response = await api.post(`/payment/create-transaction`, {
        order_id: order.id,
        payment_option: paymentOption,
      });
      window.snap.pay(response.data.snap_token, {
        onSuccess: () => { toast.success("Payment successful!"); fetchData(); setIsPaying(false); },
        onPending: () => { toast.info("Pending settlement..."); setIsPaying(false); },
        onError: () => { toast.error("Payment failed."); setIsPaying(false); },
        onClose: () => setIsPaying(false),
      });
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      toast.error(axiosErr.response?.data?.message || "Error.");
      setIsPaying(false);
    }
  };

  if (loading) return <div className="text-center py-20 animate-pulse text-muted-foreground font-bold">Loading transactions...</div>;

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <h2 className="text-2xl font-bold">Purchase History</h2>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground bg-muted/20 rounded-xl border-2 border-dashed border-border">
          <Wallet size={48} className="mb-4 opacity-20" />
          <p className="font-medium">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const { booking } = order;
            const bookableType = booking?.bookable_type || "";
            const details = { ...booking, ...booking?.bookable, ...booking?.details } as BookingDetails;
            const serviceName = details.service_name || booking?.bookable?.name || "Service Details";
            const isExpanded = expandedOrderId === order.id;

            return (
              <div key={order.id} className="bg-card border border-border rounded-xl p-5 transition-all hover:shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <ServiceTypeBadge type={bookableType} />
                    <h3 className="font-bold text-lg leading-tight text-slate-900">Order #{order.order_number}</h3>
                    <p className="text-[11px] text-muted-foreground uppercase font-black tracking-tighter mt-1">{formatDate(order.created_at)}</p>
                  </div>
                  <span className={getStatusChip(order.status)}>{order.status.replace("_", " ")}</span>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-sm text-slate-700">{serviceName}</span>
                      <button onClick={() => setExpandedOrderId(isExpanded ? null : order.id)} className="text-[11px] font-black uppercase text-primary flex items-center gap-1">
                        {isExpanded ? "Hide Details" : "Detailed Info"}
                        {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                      </button>
                  </div>

                  {isExpanded && (
                    <div className="bg-muted/40 rounded-2xl p-5 mb-5 border border-border/60 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="mb-6 flex items-center gap-2 border-b border-border pb-3">
                           <ListChecks size={18} className="text-primary" />
                           <span className="text-xs font-black uppercase text-slate-900 tracking-wider">Fulfillment Info</span>
                        </div>

                        {bookableType.includes("CarRental") && <CarRentalFulfillment details={details} />}
                        {bookableType.includes("TripPlanner") && <TripPlannerFulfillment details={details} />}
                        {bookableType.includes("Activity") && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase text-primary mb-2">Schedule</p>
                              <InfoRowDetail icon={Ticket} label="Activity" value={serviceName} />
                              <InfoRowDetail icon={Clock} label="Time Slot" value={(details.activity_time || details.pickup_time) as string} />
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase text-primary mb-2">Participant</p>
                              <InfoRowDetail icon={User} label="Name" value={(details.full_name || details.fullName) as string} />
                              <InfoRowDetail icon={Users} label="Pax" value={`${details.quantity || 1} Person(s)`} />
                            </div>
                          </div>
                        )}

                        {(bookableType.includes("HolidayPackage") || bookableType.includes("OpenTrip")) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                             <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-primary mb-2">Logistics</p>
                                <InfoRowDetail icon={MapPin} label="Destination" value={(details.name || details.destination) as string} />
                                <InfoRowDetail icon={MapPin} label="Meeting Point" value={(details.pickup_location || details.meeting_point) as string} />
                             </div>
                             <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-primary mb-2">Guest Info</p>
                                <InfoRowDetail icon={User} label="Lead Guest" value={(details.full_name || details.fullName) as string} />
                                <InfoRowDetail icon={Users} label="Pax" value={`${details.adults || 1} Ad, ${details.children || 0} Ch`} />
                             </div>
                          </div>
                        )}

                        {details.special_request && (
                          <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 shadow-sm">
                            <MessageSquare size={16} className="text-amber-600 mt-0.5 shrink-0" />
                            <div className="space-y-1">
                               <p className="text-[10px] font-black uppercase text-amber-700">Special Requests</p>
                               <p className="text-sm italic text-amber-900 font-medium leading-relaxed">&quot;{details.special_request}&quot;</p>
                            </div>
                          </div>
                        )}

                        <ItemsBreakdownTable order={order} details={details} />
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-between items-center pt-3 border-t border-border gap-4">
                      <div className="text-left w-full sm:w-auto">
                          <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Total Amount</p>
                          <p className="font-black text-xl text-primary leading-none">{formatCurrency(Number(order.total_amount))}</p>
                      </div>
                      <div className="w-full sm:w-auto flex justify-end">
                        <OrderPaymentActions order={order} onPay={handlePayment} isPaying={isPaying} />
                      </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}