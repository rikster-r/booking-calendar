type Room = {
  id: number;
  name: string;
  createdAt: string;
}

type RoomInput = {
  name: string;
}

type Booking = {
  id: number;
  roomId: number;
  clientName: string;
  clientSurname: string;
  clientPhone: string;
  clientEmail: string;
  adultsCount: number;
  childrenCount: number;
  checkIn: string;
  checkOut: string;
  createdAt: string;
}

type BookingInput = {
  roomId: number;
  clientName: string;
  clientSurname: string;
  clientPhone: string;
  clientEmail: string;
  checkIn: string;
  checkOut: string;
}