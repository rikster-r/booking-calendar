import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    return createBooking(req, res);
  } else if (req.method === 'GET') {
    return getBookings(req, res);
  } else {
    return res.status(405).json({ error: 'Данный метод API не существует.' });
  }
}

async function createBooking(req: NextApiRequest, res: NextApiResponse) {
  const {
    roomId: room_id,
    clientName: client_name,
    clientPhone: client_phone,
    clientEmail: client_email,
    adultsCount: adults_count,
    doorCode: door_code,
    additionalInfo: additional_info,
    childrenCount: children_count,
    checkIn: check_in,
    checkOut: check_out,
    dailyPrice: daily_price,
    paid,
  }: BookingInput = req.body;

  if (
    !room_id ||
    !client_name ||
    !client_phone ||
    !adults_count ||
    !check_in ||
    !check_out ||
    door_code === null ||
    daily_price === null ||
    daily_price === '' ||
    paid === null
  ) {
    return res.status(400).json({ error: 'Не все поля заполнены.' });
  }

  if (!client_phone.startsWith('+7') && !client_phone.startsWith('8')) {
    return res.status(400).json({ error: 'Некорректный номер телефона.' });
  }

  if (client_phone.startsWith('+7') && client_phone.length !== 12) {
    return res.status(400).json({ error: 'Некорректный номер телефона.' });
  }

  if (client_phone.startsWith('8') && client_phone.length !== 11) {
    return res.status(400).json({ error: 'Некорректный номер телефона.' });
  }

  // Check if the booking slot is already taken
  const { data: existingBookings, error: existingBookingsError } =
    await supabase
      .from('bookings')
      .select('*')
      .or(`and(check_in.lte.${check_out}, check_out.gte.${check_in})`)
      .eq('room_id', room_id);

  if (existingBookingsError) {
    return res.status(500).json({ error: existingBookingsError.message });
  }

  if (existingBookings && existingBookings.length > 0) {
    return res
      .status(409)
      .json({ error: 'Временной слот уже занят другой бронью.' });
  }

  // Check if the room is ready
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('status')
    .eq('id', room_id)
    .single();

  if (roomError) {
    return res.status(500).json({ error: roomError.message });
  }

  if (room.status === 'not ready') {
    return res.status(400).json({ error: 'Комната не готова для бронирования.' });
  }

  // Insert new booking
  const { data, error } = await supabase.from('bookings').insert([
    {
      room_id,
      client_name,
      client_phone,
      client_email,
      adults_count,
      children_count,
      check_in,
      check_out,
      door_code,
      additional_info,
      daily_price,
      paid,
    },
  ]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res
    .status(201)
    .json({ message: 'Успешно создана бронь.', booking: data });
}

async function getBookings(req: NextApiRequest, res: NextApiResponse) {
  let { start, end } = req.query;

  // Validate and set default values
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  const next30Days = futureDate.toISOString().split('T')[0];

  if (!start || typeof start !== 'string') start = today;
  if (!end || typeof end !== 'string') end = next30Days;

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .or(
      `and(check_in.gte.${start}, check_in.lte.${end}),and(check_out.gte.${start}, check_out.lte.${end})`
    );

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
}
