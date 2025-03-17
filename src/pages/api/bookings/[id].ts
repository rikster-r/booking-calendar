import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'DELETE') {
    const { id } = req.query;

    if (!id) return res.status(400).json({ error: 'Некорректный айди.' });

    const { error } = await supabase.from('bookings').delete().eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: `Успешно удалена бронь ${id}` });
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Неверный ID брони' });
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
        .or(`and(check_in.lte.${check_out}, check_out.gte.${check_in})`)
        .eq('room_id', room_id)
        .neq('id', id); // Exclude current booking

    if (existingBookingsError) {
      return res.status(500).json({ error: existingBookingsError.message });
    }

    if (existingBookings && existingBookings.length > 0) {
      return res
        .status(409)
        .json({ error: 'Временной слот уже занят другой бронью.' });
    }

    // Update the booking
    const { data, error } = await supabase
      .from('bookings')
      .update({
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
      })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res
      .status(200)
      .json({ message: 'Бронь успешно обновлена.', booking: data });
  }

  res.status(405).json({ error: 'Данный метод API не существует.' });
}
