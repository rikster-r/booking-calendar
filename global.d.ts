type Room = {
  id: number;
  name: string;
  created_at: string;
};

type RoomInput = {
  name: string;
};

type Booking = {
  id: number;
  room_id: number;
  client_name: string;
  client_phone: string;
  client_email: string;
  adults_count: number;
  children_count: number;
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
  checkIn: Date;
  checkOut: Date;
};
