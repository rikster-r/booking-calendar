type Room = {
  id: number;
  name: string;
  color: string;
  created_at: string;
};

type RoomInput = {
  name: string;
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
  adultsCount: number;
  childrenCount: number;
  doorCode: number;
  additionalInfo: string;
  dailyPrice: number;
  paid: boolean;
  checkIn: Date;
  checkOut: Date;
};
