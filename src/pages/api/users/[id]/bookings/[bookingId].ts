import { NextApiRequest, NextApiResponse } from 'next';
import createClient from '@/lib/supabase/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(req, res);

  if (req.method === 'DELETE') {
    const { bookingId: booking_id } = req.query;

    if (!booking_id)
      return res.status(400).json({ error: 'Некорректный айди.' });

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', booking_id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: `Успешно удалена бронь ${booking_id}` });
  }

  if (req.method === 'PUT') {
    const { bookingId: booking_id, id: user_id } = req.query;
    if (!booking_id || !user_id) {
      return res.status(400).json({ error: 'Некорректный ID брони' });
    }

    const {
      roomId: room_id,
      clientName: client_name,
      clientPhone: client_phone,
      clientEmail: client_email,
      adultsCount: adults_count,
      childrenCount: children_count,
      checkIn: check_in,
      checkOut: check_out,
      doorCode: door_code,
      additionalInfo: additional_info,
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
      daily_price === null ||
      daily_price === '' ||
      paid === null
    ) {
      return res.status(400).json({ error: 'Не все поля заполнены.' });
    }

    if (!client_phone.startsWith('+7') && !client_phone.startsWith('8')) {
      return res.status(400).json({ error: 'Некорректный номер телефона.' });
    }
    if (
      (client_phone.startsWith('+7') && client_phone.length !== 12) ||
      (client_phone.startsWith('8') && client_phone.length !== 11)
    ) {
      return res.status(400).json({ error: 'Некорректный номер телефона.' });
    }

    // Check if the booking slot is available
    const { data: existingBookings, error: existingBookingsError } =
      await supabase
        .from('bookings')
        .select('*')
        .or(`and(check_in.lt.${check_out}, check_out.gt.${check_in})`)
        .eq('room_id', room_id)
        .eq('user_id', user_id)
        .neq('id', booking_id); // Exclude current booking

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

    // Update the booking
    const { data, error } = await supabase
      .from('bookings')
      .update({
        room_id,
        user_id,
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
      })
      .eq('id', booking_id)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res
      .status(200)
      .json({ booking: data[0] });
  }

  return res.status(405).json({ error: 'Данный метод API не существует.' });
}
