import { NextApiRequest, NextApiResponse } from 'next';
import createClient from '@/lib/supabase/api';
import { get100DayRange } from '@/lib/dates';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(req, res);

  if (req.method === 'POST') {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res
        .status(401)
        .json({ error: 'Войдите в аккаунт перед запросом' });
    }

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
    const { id: user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'Некорректный ID пользователя.' });
    }

    if (
      !room_id ||
      !client_name ||
      !client_phone ||
      !adults_count ||
      !check_in ||
      !check_out ||
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
        .eq('room_id', room_id)
        .eq('user_id', user_id);

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
      return res
        .status(400)
        .json({ error: 'Комната не готова для бронирования.' });
    }

    // Insert into avito
    const avitoCreateRes = await fetch(
      `${process.env.NEXT_PUBLIC_URL}/api/avito/bookings`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id,
          room_id,
          check_in,
          check_out,
          additional_info,
        }),
      }
    );

    const avitoCreateData = await avitoCreateRes.json();
    if (!avitoCreateRes.ok) {
      return res.status(500).json(avitoCreateData);
    }

    const avito_booking_id = avitoCreateData.avito_booking_id;

    // Insert new booking
    const { data, error } = await supabase
      .from('bookings')
      .insert([
        {
          room_id,
          user_id,
          avito_id: avito_booking_id,
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
      ])
      .select()

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ booking: data[0] });
  }

  if (req.method === 'GET') {
    // eslint-disable-next-line prefer-const
    let { start, end, id: user_id } = req.query;

    // Validate and set default values
    const { start: today, end: in30Days } = get100DayRange();

    if (!start || typeof start !== 'string') start = today;
    if (!end || typeof end !== 'string') end = in30Days;

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user_id)
      .lte('check_in', end)
      .gte('check_out', start)
      .order('check_in', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Данный метод API не существует.' });
}
