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
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
}

async function createBooking(req: NextApiRequest, res: NextApiResponse) {
  const {
    roomId: room_id,
    clientName: client_name,
    clientSurname: client_surname,
    clientPhone: client_phone,
    clientEmail: client_email,
    adultsCount: adults_count,
    childrenCount: children_count,
    checkIn: check_in,
    checkOut: check_out,
  } = req.body;

  if (!room_id || !client_name || !client_phone || !check_in || !check_out) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data: existingBookings, error: conflictError } = await supabase
    .from('bookings')
    .select('id')
    .eq('room_id', room_id)
    .or(`check_in.lte.${check_out}, check_out.gte.${check_in}`);

  if (conflictError) {
    return res.status(500).json({ error: conflictError.message });
  }

  if (existingBookings.length > 0) {
    return res
      .status(400)
      .json({ error: 'Room is already booked for this period' });
  }

  // Insert new booking
  const { data, error } = await supabase.from('bookings').insert([
    {
      room_id,
      client_name,
      client_surname,
      client_phone,
      client_email,
      adults_count,
      children_count,
      check_in,
      check_out,
    },
  ]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res
    .status(201)
    .json({ message: 'Booking created successfully', booking: data });
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
