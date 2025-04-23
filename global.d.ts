type Room = {
  id: number;
  name: string;
  status: 'not ready' | 'ready' | 'cleaning';
  color: string;
  created_at: string;
  last_cleaned_at: string;
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
