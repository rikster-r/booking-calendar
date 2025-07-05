type Room = {
  id: number;
  name: string;
  status: 'not ready' | 'ready' | 'cleaning';
  color: string;
  last_cleaned_at: string | null;
  last_cleaned_by: string | null;
  last_cleaned_user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  avito_link: string | null;
  avito_id: string | null;
  comments: { author: string; text: string };
  created_at: string;
};

type RoomComment = {
  id: number;
  author_id: string;
  room_id: number;
  text: string;
  room?: {
    id: number;
    owner?: {
      id: string;
    };
  };
  author?: {
    first_name: string;
    last_name: string;
  };
  created_at: string;
};

type RoomInput = {
  name: string;
  status: 'not ready' | 'ready' | 'cleaning';
  color: string;
  avitoLink?: string | null;
};

type Booking = {
  id: number;
  room_id: number;
  client_name: string;
  client_phone: string;
  additional_client_phones: string[] | null;
  client_email: string;
  adults_count: number;
  children_count: number;
  door_code: string | null;
  additional_info: string;
  daily_price: number;
  paid: boolean;
  check_in: string | Date;
  check_out: string | Date;
  created_at: string;
  room?: Room;
  avito_id: number | null;
  user_id: string;
};

type BookingToInsert = {
  room_id: number;
  client_name: string;
  client_phone: string;
  client_email: string;
  adults_count: number;
  children_count: number;
  door_code: string | null;
  additional_info: string;
  daily_price: number;
  paid: boolean;
  check_in: string | Date;
  check_out: string | Date;
  room?: Room;
  avito_id: number | null;
  user_id: string;
};

type BookingInput = {
  id?: number;
  roomId: number;
  clientName: string;
  clientPhone: string;
  additionalClientPhones: string[];
  clientEmail: string;
  adultsCount: number | string;
  childrenCount: number | string;
  doorCode: number | string | null;
  additionalInfo: string;
  dailyPrice: number | string;
  paid: boolean;
  checkIn: Date;
  checkOut: Date;
};

type UserInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
};

type PublicUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  related_to: string | null;
  updated_at: string;
  last_sign_in_at: string | null;
  preferred_date_format: string | null;
  preferred_time_format: string | null;
  confirmItemDelete: boolean | null;
};

type AvitoTokenData = {
  id: number;
  user_id: string;
  access_token: string;
  expires_in: number;
  scope: string;
  refresh_token: string;
  token_type: string;
  created_at: string;
  avito_user_id: string;
};

type AvitoListing = {
  address: string;
  category: {
    id: number;
    name: string;
  };
  id: number;
  price: number;
  status: string;
  title: string;
  url: string;
};

type AvitoResponse = {
  bookings?: AvitoBooking[];
  error?: AvitoError;
};

type AvitoBooking = {
  avito_booking_id: number;
  base_price: number;
  check_in: string;
  check_out: string;
  contact: {
    email: string;
    name: string;
    phone: string;
  };
  guest_count: number;
  nights: number;
  safe_deposit: {
    owner_amount: number;
    tax: number;
    totalAmount: number;
  };
  status: 'active' | 'canceled' | 'pending';
};

type AvitoError = {
  code: number;
  message: string;
};
