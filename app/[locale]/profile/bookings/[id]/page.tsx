"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import { formatCurrency, formatDate, getStatusChip } from "@/lib/utils";
import { 
  ArrowLeft, Calendar, CreditCard, FileText, User, MapPin, Clock, Plane, Wallet,
  Compass, Users, Phone, Mail, Ticket, Map, MessageSquare,
  CheckCircle2, Hash, AlertCircle, HelpCircle, MessageCircle, 
  ListChecks, Tag, Package, PlusCircle, Car, Luggage 
} from "lucide-react"; 
import { toast } from "sonner";

// --- TYPES ---
interface OrderItem {
  id: number;
  name: string | null;
  quantity: number;
  price: number;
  orderable_type: string;
}

interface BookingDetails {
  [key: string]: unknown;
  service_name?: string;
  brand?: string;
  car_model?: string;
  pickup_location?: string;
  pickup_time?: string;
  return_location?: string;
  return_time?: string;
  phone_number?: string;
  phone?: string;
  email?: string;
  full_name?: string;
  fullName?: string;
  quantity?: number;
  total_days?: number;
  plate_number?: string;
  flight_number?: string;
  participant_nationality?: string;
  special_request?: string;
  adults?: number;
  children?: number;
  total_pax?: number;
  num_participants?: number;
  meeting_point?: string;
  type?: string;
  companyName?: string;
  paxAdults?: string | number;
  paxTeens?: string | number;
  paxKids?: string | number;
  paxSeniors?: string | number;
  city?: string;
  province?: string;
  country?: string;
  tripType?: string;
  travelType?: string;
  departureDate?: string;
  duration?: string | number;
  budgetPack?: string;
  price_per_day?: number;
  price_per_person?: number;
  price_per_pax?: number;
  selected_addons?: Array<{ name: string; price: number }>;
}

interface Bookable {
  name?: string;
  brand?: string;
  car_model?: string;
  transmission?: string;
  fuel_type?: string;
  seats?: number;
  luggage?: number;
  destination?: string;
  meeting_point?: string;
  duration?: string | number;
  [key: string]: unknown;
}

interface Booking {
  id: number;
  bookable_type: string;
  details: BookingDetails;
  bookable: Bookable;
  start_date: string | null;
  end_date: string | null;
  status: string;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  down_payment_amount: number;
  payment_deadline: string;
  total_amount: string | number;
  subtotal: string | number;
  discount_amount: string | number;
  booking?: Booking;
  order_items?: OrderItem[];
}

// --- HELPER COMPONENTS ---
const InfoRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: React.ReactNode }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/40 last:border-0">
      <div className="mt-0.5 text-primary/80 shrink-0 bg-primary/10 p-1.5 rounded-full">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
        <div className="text-sm font-medium text-foreground break-all leading-snug">{value}</div>
      </div>
    </div>
  );
};

const SectionTitle = ({ icon, title }: { icon: React.ReactNode, title: string }) => (
  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
    <div className="text-primary">{icon}</div>
    <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">{title}</h3>
  </div>
);

const AddonsSection = ({ addons }: { addons?: Array<{ name: string; price: number }> }) => {
  if (!addons || addons.length === 0) return null;
  return (
    <div className="mt-4 pt-4 border-t border-dashed border-border">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <PlusCircle size={12} className="text-orange-500" /> Booked Add-ons
      </p>
      <div className="flex flex-wrap gap-2">
        {addons.map((addon, idx) => (
          <span key={idx} className="bg-orange-50 text-orange-700 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-orange-100 shadow-sm">
            {String(addon.name)}
          </span>
        ))}
      </div>
    </div>
  );
};

const ServiceTypeBadge = ({ type }: { type: string }) => {
  let config = { 
    label: "Service", 
    color: "bg-gray-100 text-gray-700 border-gray-200", 
    icon: FileText 
  };

  if (type?.includes("CarRental")) config = { label: "Car Rental", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Car };
  else if (type?.includes("TripPlanner")) config = { label: "Trip Planner", color: "bg-purple-50 text-purple-700 border-purple-200", icon: Compass };
  else if (type?.includes("HolidayPackage")) config = { label: "Holiday Package", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Luggage };
  else if (type?.includes("Activity")) config = { label: "Activity", color: "bg-orange-50 text-orange-700 border-orange-200", icon: Ticket };
  else if (type?.includes("OpenTrip")) config = { label: "Open Trip", color: "bg-teal-50 text-teal-700 border-teal-200", icon: Map };

  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${config.color} w-fit shadow-sm`}>
      <Icon size={12} /> {config.label}
    </span>
  );
};

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

// --- MAIN COMPONENT ---

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id; 

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const response = await api.get("/my-orders");
        const foundOrder = response.data.find((o: Order) => 
           String(o.booking?.id) === String(id)
        );
        if (foundOrder) setOrder(foundOrder);
        else throw new Error("Booking not found.");
      } catch (error) {
        console.error(error);
        toast.error("Failed to load booking details.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground animate-pulse">Loading details...</div>;
  if (!order || !order.booking) return <div className="min-h-screen flex items-center justify-center text-red-500 flex-col gap-2"><AlertCircle size={32}/> Booking not found.</div>;

  const booking = order.booking;
  const details = booking.details;
  const bookable = booking.bookable;
  const bookableType = booking.bookable_type;
  
  const dateDisplay = booking.start_date ? formatDate(booking.start_date) : "-";
  const serviceName = String(details.service_name || bookable.name || (bookable.brand ? `${bookable.brand} ${bookable.car_model}` : "Service Details"));

  const getVal = (key: string, ...alts: string[]): string | null => {
    const keys = [key, ...alts];
    for (const k of keys) {
       const val = details[k];
       if (val !== undefined && val !== null && val !== "" && val !== "null" && typeof val !== "object") return String(val);
    }
    return null;
  };

  const openWhatsApp = (reason: string) => {
    const phoneNumber = "6282224291148"; 
    const text = `Hello Admin, I need help with my booking.\n📌 *Order: ${order.order_number}*\n🛎️ *Service:* ${serviceName}\n⚠️ *Issue:* ${reason}`;
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // --- RENDERERS ---

  const renderCarRental = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <SectionTitle icon={<Car size={18}/>} title="Vehicle Specs & Pickup" />
          <div className="space-y-1">
            <InfoRow icon={<Car size={14}/>} label="Brand & Model" value={`${String(details.brand || bookable.brand || '')} ${String(details.car_model || bookable.car_model || '')}`} />
            <InfoRow icon={<Calendar size={14}/>} label="Duration" value={`${getVal('total_days') || '1'} Day(s)`} />
            <InfoRow icon={<Calendar size={14}/>} label="Pickup Date" value={dateDisplay} />
            <InfoRow icon={<Clock size={14}/>} label="Pickup Time" value={getVal('pickup_time')} />
            <InfoRow icon={<MapPin size={14}/>} label="Pickup Location" value={getVal('pickup_location')} />
          </div>
        </div>
        <div>
          <SectionTitle icon={<Phone size={18}/>} title="Contact & Pricing Audit" />
          <div className="space-y-1">
            <InfoRow icon={<Phone size={14}/>} label="Contact Number" value={getVal('phone_number', 'phone')} />
            <InfoRow icon={<Tag size={14}/>} label="Price Per Day" value={formatCurrency(Number(details.price_per_day || 0))} />
            <InfoRow icon={<Mail size={14}/>} label="Email" value={getVal('email')} />
          </div>
        </div>
      </div>
      <AddonsSection addons={details.selected_addons} />
    </div>
  );

  const renderActivity = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <SectionTitle icon={<Ticket size={18}/>} title="Activity & Schedule" />
          <div className="space-y-1">
            <InfoRow icon={<Ticket size={14}/>} label="Activity Name" value={serviceName} />
            <InfoRow icon={<Calendar size={14}/>} label="Date" value={dateDisplay} />
            <InfoRow icon={<Clock size={14}/>} label="Time Slot" value={getVal('activity_time')} />
            <InfoRow icon={<MapPin size={14}/>} label="Meeting Point" value={getVal('pickup_location', 'meeting_point')} />
          </div>
        </div>
        <div>
          <SectionTitle icon={<Users size={18}/>} title="Participant Info" />
          <div className="space-y-1">
            <InfoRow icon={<User size={14}/>} label="Lead Participant" value={getVal('full_name', 'fullName')} />
            <InfoRow icon={<Users size={14}/>} label="Total Pax" value={`${getVal('quantity') || '1'} Person(s)`} />
            <InfoRow icon={<Tag size={14}/>} label="Price Per Person" value={formatCurrency(Number(details.price_per_person || 0))} />
            <InfoRow icon={<Phone size={14}/>} label="Contact" value={getVal('phone_number', 'phone')} />
          </div>
        </div>
      </div>
      <AddonsSection addons={details.selected_addons} />
    </div>
  );

  const renderHolidayPackage = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <SectionTitle icon={<Luggage size={18}/>} title="Package Logistics" />
          <div className="space-y-1">
            <InfoRow icon={<MapPin size={14}/>} label="Destination" value={String(bookable.name || "-")} />
            <InfoRow icon={<Calendar size={14}/>} label="Trip Dates" value={dateDisplay} />
            <InfoRow icon={<MapPin size={14}/>} label="Pickup/Meeting" value={getVal('pickup_location', 'meeting_point')} />
            <InfoRow icon={<Plane size={14}/>} label="Flight Number" value={getVal('flight_number')} />
          </div>
        </div>
        <div>
          <SectionTitle icon={<Users size={18}/>} title="Guest List" />
          <div className="space-y-1">
            <InfoRow icon={<User size={14}/>} label="Lead Guest" value={getVal('full_name', 'fullName')} />
            <InfoRow icon={<Users size={14}/>} label="Travelers" value={`${getVal('adults') || '1'} Adults, ${getVal('children') || '0'} Children`} />
            <InfoRow icon={<Tag size={14}/>} label="Price Per Pax" value={formatCurrency(Number(details.price_per_pax || 0))} />
            <InfoRow icon={<Phone size={14}/>} label="Contact" value={getVal('phone_number', 'phone')} />
          </div>
        </div>
      </div>
      <AddonsSection addons={details.selected_addons} />
    </div>
  );

  const renderTripPlanner = () => {
    const adults = parseInt(getVal('paxAdults', 'pax_adult_count') || "0");
    const kids = parseInt(getVal('paxKids', 'pax_kid_count') || "0");
    const totalPax = (adults + kids) || parseInt(getVal('quantity') || "1");

    const tripType = getVal('tripType', 'trip_type');
    const city = getVal('city');
    const province = getVal('province');
    const country = getVal('country');
    
    let locationDisplay = (getVal('destination') || "Custom Destination") as string;
    if (city) {
      locationDisplay = tripType === 'domestic' 
        ? `🇮🇩 ${city}${province ? `, ${province}` : ''}`
        : `🌐 ${city}${country ? `, ${country}` : ''}`;
    }

    return (
      <div className="space-y-6">
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex gap-4 items-start shadow-sm">
          <div className="bg-purple-100 p-2 rounded-lg text-purple-600 shrink-0">
            <Plane size={20} className="animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-purple-900 uppercase tracking-tight">Crafting Your Dream Trip</h4>
            <p className="text-xs text-purple-700 leading-relaxed">
              Our travel specialists are currently working on crafting your personalized itinerary. 
              <strong> Please ensure your WhatsApp number below is correct</strong>, as we will contact you via WhatsApp to finalize your trip details and preferences.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <SectionTitle icon={<Compass size={18}/>} title="Trip Concept" />
            <div className="space-y-1">
              <InfoRow icon={<MapPin size={14}/>} label="Planned Destination" value={locationDisplay} />
              <InfoRow icon={<Calendar size={14}/>} label="Tentative Departure" value={getVal('departureDate') || dateDisplay} />
              <InfoRow icon={<Clock size={14}/>} label="Planned Duration" value={`${getVal('duration') || String(bookable.duration || 1)} Day(s)`} />
              <InfoRow icon={<Wallet size={14}/>} label="Budget Preference" value={(getVal('budgetPack')?.toUpperCase() || "STANDARD") as string} />
            </div>
          </div>
          <div>
            <SectionTitle icon={<User size={18}/>} title="Contact & Group Info" />
            <div className="space-y-1">
              <InfoRow icon={<User size={14}/>} label="Primary Contact" value={(getVal('fullName', 'full_name', 'companyName') || "Customer") as string} />
              <InfoRow icon={<Phone size={14}/>} label="WhatsApp Number" value={getVal('phone', 'phone_number')} />
              <InfoRow icon={<Users size={14}/>} label="Travel Group" value={`${totalPax} Person(s) (${(getVal('type', 'travelType', 'travel_type') || "Personal")})`} />
              <div className="pl-8 pt-1 flex flex-wrap gap-x-3 gap-y-1">
                {adults > 0 && <span className="text-[10px] text-muted-foreground uppercase font-bold">{adults} Adults</span>}
                {kids > 0 && <span className="text-[10px] text-muted-foreground uppercase font-bold">{kids} Kids</span>}
              </div>
              <InfoRow icon={<Mail size={14}/>} label="Email Address" value={getVal('email')} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderItemsTable = () => (
    <div className="mb-10 border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-4 py-3 border-b border-border flex items-center gap-2">
            <Package size={16} className="text-primary" />
            <span className="font-bold text-xs uppercase tracking-widest text-slate-500">Items Purchased</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] uppercase font-bold text-muted-foreground border-b">
                    <tr>
                        <th className="px-6 py-3">Description</th>
                        <th className="px-6 py-3 text-center">Qty</th>
                        <th className="px-6 py-3 text-right">Price</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {order.order_items?.map((item) => {
                        const { name, isAddon } = getOrderItemName(item, details);
                        return (
                            <tr key={item.id} className="text-sm">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded ${isAddon ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {isAddon ? <PlusCircle size={14}/> : <Tag size={14}/>}
                                        </div>
                                        <div>
                                            <p className="font-bold">{String(name)}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">{isAddon ? 'Optional Extra' : 'Base Service'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center font-bold">{item.quantity}</td>
                                <td className="px-6 py-4 text-right font-bold">{formatCurrency(item.price)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
        <div className="p-4 bg-slate-50/30 border-t flex flex-col items-end gap-1">
            <div className="flex justify-between w-full max-w-xs text-xs font-medium text-muted-foreground">
                <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
            </div>
            {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between w-full max-w-xs text-xs font-bold text-red-600">
                    <span>Discount</span><span>-{formatCurrency(order.discount_amount)}</span>
                </div>
            )}
            <div className="flex justify-between w-full max-w-xs text-base font-black pt-2 border-t text-primary mt-1">
                <span>Final Total</span><span>{formatCurrency(order.total_amount)}</span>
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary mb-6 transition-colors group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
            Back to Bookings
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4 bg-white">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                         <ServiceTypeBadge type={bookableType} />
                         <span className="flex items-center gap-1 text-xs font-mono text-gray-400">
                             <Hash size={12} /> {order.order_number}
                         </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary leading-tight">{serviceName}</h1>
                </div>
                <div className="shrink-0">
                     <span className={`${getStatusChip(booking.status)} px-3 py-1 text-sm font-bold capitalize flex items-center gap-2`}>
                        {booking.status === 'pending' ? <Clock size={14}/> : <CheckCircle2 size={14}/>}
                        {booking.status.replace(/_/g, " ")}
                     </span>
                </div>
            </div>

            <div className="p-6 md:p-8">
                <div className="mb-10">
                    <div className="mb-4">
                        <SectionTitle icon={<ListChecks size={18} />} title="Fulfillment Information" />
                        <p className="text-[10px] text-muted-foreground ml-7 -mt-4">Requirements defined during checkout</p>
                    </div>
                    
                    {/* RESTORED ALL RENDERERS */}
                    {bookableType.includes("CarRental") && renderCarRental()}
                    {bookableType.includes("Activity") && renderActivity()}
                    {(bookableType.includes("HolidayPackage") || bookableType.includes("OpenTrip")) && renderHolidayPackage()}
                    {bookableType.includes("TripPlanner") && renderTripPlanner()}
                    
                    {details.special_request && typeof details.special_request === "string" && (
                      <div className="mt-6 p-4 bg-amber-50/50 border border-amber-100 rounded-lg flex gap-3">
                        <MessageSquare size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold uppercase text-amber-700 tracking-wider">Special Requests</span>
                          <p className="text-sm text-amber-900 italic">&quot;{String(details.special_request)}&quot;</p>
                        </div>
                      </div>
                    )}
                </div>

                {renderItemsTable()}

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 mb-8">
                     <SectionTitle icon={<CreditCard size={18}/>} title="Payment Status" />
                     <div className="flex flex-col md:flex-row justify-between items-end gap-4 mt-4">
                         <div className="space-y-2 text-sm text-gray-600">
                             <div className="flex items-center gap-2"><span className="text-muted-foreground">Order Status:</span><span className="font-semibold text-gray-900 capitalize">{order.status}</span></div>
                             <div className="flex items-center gap-2"><span className="text-muted-foreground">Payment Status:</span><span className="font-semibold text-gray-900 capitalize">{order.payment_status}</span></div>
                             {order.payment_deadline && order.status === 'pending' && (
                                <p className="text-xs text-red-500 mt-2 flex items-center gap-1 bg-red-50 px-2 py-1 rounded w-fit"><Clock size={12}/> Pay before: {formatDate(order.payment_deadline)}</p>
                             )}
                         </div>
                         <div className="text-right">
                             <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total Amount</p>
                             <p className="text-2xl font-bold text-primary">{formatCurrency(order.total_amount)}</p>
                         </div>
                     </div>
                </div>

                <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="bg-blue-100 p-3 rounded-full text-blue-600 hidden sm:block"><HelpCircle size={24} /></div>
                        <div>
                            <h3 className="font-bold text-blue-900">Need help with this booking?</h3>
                            <p className="text-sm text-blue-700 mt-1">If you spot an error in the details, contact us directly.</p>
                        </div>
                    </div>
                    <button onClick={() => openWhatsApp("Booking Detail Inquiry")} className="px-5 py-2 text-sm font-bold bg-green-500 text-white rounded-full hover:bg-green-600 shadow-md flex items-center gap-2 transition-all">
                        <MessageCircle size={16} /> Chat Admin
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}