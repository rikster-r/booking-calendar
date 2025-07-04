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
    return res
      .status(200)
      .json({ message: `Успешно удалена бронь ${booking_id}` });
  }

  if (req.method === 'PUT') {
    const { bookingId: booking_id, id: user_id } = req.query;
    if (!booking_id || !user_id) {
      return res.status(400).json({ error: 'Некорректный ID брони' });
    }

    const {
      roomId,
      clientName,
      clientPhone,
      clientEmail,
      adultsCount,
      childrenCount,
      checkIn,
      checkOut,
      doorCode,
      additionalInfo,
      dailyPrice,
      paid,
    }: Partial<BookingInput> = req.body;

    // Validate phone if provided
    if (clientPhone) {
      if (!clientPhone.startsWith('+7') && !clientPhone.startsWith('8')) {
        return res.status(400).json({ error: 'Некорректный номер телефона.' });
      }
      if (
        (clientPhone.startsWith('+7') && clientPhone.length !== 12) ||
        (clientPhone.startsWith('8') && clientPhone.length !== 11)
      ) {
        return res.status(400).json({ error: 'Некорректный номер телефона.' });
      }
    }

    // Overlap and room status checks if enough info is present
    if (roomId && checkIn && checkOut) {
      const [existingBookingsResult, roomResult] = await Promise.all([
        supabase
          .from('bookings')
          .select('*')
          .or(`and(check_in.lt.${checkOut}, check_out.gt.${checkIn})`)
          .eq('room_id', roomId)
          .eq('user_id', user_id)
          .neq('id', booking_id),
        supabase.from('rooms').select('status').eq('id', roomId).single(),
      ]);

      const { data: existingBookings, error: existingBookingsError } =
        existingBookingsResult;
      const { data: room, error: roomError } = roomResult;

      if (existingBookingsError) {
        return res.status(500).json({ error: existingBookingsError.message });
      }

      if (existingBookings && existingBookings.length > 0) {
        return res
          .status(409)
          .json({ error: 'Временной слот уже занят другой бронью.' });
      }

      if (roomError) {
        return res.status(500).json({ error: roomError.message });
      }

      if (room.status === 'not ready') {
        return res
          .status(400)
          .json({ error: 'Комната не готова для бронирования.' });
      }
    }

    // Build dynamic update payload
    const payload = {
      ...(roomId !== undefined && { room_id: roomId }),
      ...(clientName !== undefined && { client_name: clientName }),
      ...(clientPhone !== undefined && { client_phone: clientPhone }),
      ...(clientEmail !== undefined && { client_email: clientEmail }),
      ...(adultsCount !== undefined && { adults_count: adultsCount }),
      ...(childrenCount !== undefined && { children_count: childrenCount }),
      ...(checkIn !== undefined && { check_in: checkIn }),
      ...(checkOut !== undefined && { check_out: checkOut }),
      ...(doorCode !== undefined && { door_code: doorCode }),
      ...(additionalInfo !== undefined && { additional_info: additionalInfo }),
      ...(dailyPrice !== undefined && { daily_price: dailyPrice }),
      ...(paid !== undefined && { paid }),
    };

    const { data, error } = await supabase
      .from('bookings')
      .update(payload)
      .eq('id', booking_id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Данный метод API не существует.' });
}
