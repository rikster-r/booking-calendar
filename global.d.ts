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
};

type Booking = {
  id: number;
  room_id: number;
  client_name: string;
  client_phone: string;
  client_email: string;
  adults_count: number;
  children_count: number;
  door_code: number;
  additional_info: string;
  daily_price: number;
  paid: boolean;
  check_in: string;
  check_out: string;
  created_at: string;
};

type BookingInput = {
  roomId: number;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  adultsCount: number | string;
  childrenCount: number | string;
  doorCode: number | string;
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
