// types/order-detail.ts

export interface OrderItem {
    id: number;
    name: string | null;
    quantity: number;
    price: number;
    orderable_type: string;
}

export interface Transaction {
    id: number;
    transaction_code: string | null;
    status: string;
    payment_type: string;
    gross_amount: number;
    updated_at: string;
    payment_payloads: string | object | null;
}

export interface UserProfile {
    id: number;
    name: string;
    email: string;
    phone_number: string | null;
}

export interface BookingDetails {
    service_name?: string;
    name?: string;
    activity_name?: string;
    full_name?: string;
    fullName?: string;
    email?: string;
    phone_number?: string;
    phone?: string;
    pickup_location?: string;
    pickup_time?: string;
    pickup_point?: string;
    meeting_point?: string;
    trip_start?: string;
    trip_end?: string;
    booked_for?: string;
    duration?: string | number;
    adults?: number;
    children?: number;
    total_pax?: number;
    num_participants?: number;
    quantity?: number;
    brand?: string;
    car_model?: string;
    total_days?: number;
    price_per_day?: number;
    price_per_pax?: number;
    price_per_person?: number;
    flight_number?: string;
    itinerary?: string;
    cost_includes?: string;
    cost_excludes?: string;
    description?: string;
    special_request?: string;
    city?: string;
    province?: string;
    country?: string;
    tripType?: string;
    budgetPack?: string;
    travelType?: string;
    selected_addons?: Array<{ name: string; price: number }>;
    [key: string]: unknown;
}

export interface Order {
    id: number;
    order_number: string;
    status: string;
    payment_status: string;
    subtotal: number;
    total_amount: number;
    discount_amount: number;
    created_at: string;
    updated_at: string;
    payment_deadline: string | null;
    order_items?: OrderItem[];
    transaction?: Transaction | null;
    user: UserProfile;
    booking?: {
        id: number;
        bookable_type: string;
        start_date: string | null;
        end_date: string | null;
        status: string;
        details: BookingDetails;
        bookable?: {
            name?: string;
            brand?: string;
            car_model?: string;
            description?: string;
        };
    };
}