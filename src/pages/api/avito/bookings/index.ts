import { NextApiRequest, NextApiResponse } from 'next';
import createClient from '@/lib/supabase/api';
import { decrypt } from '@/lib/encrypt';
import { formatDateForAvito, get30DayRange } from '@/lib/dates';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(req, res);

  if (req.method === 'POST') {
    const { user_id, room_id, check_in, check_out, additional_info } = req.body;

    // Get the user token
    const tokenDataRes = await fetch(
      `${process.env.NEXT_PUBLIC_URL}/api/avito/accessToken?user_id=${user_id}`
    );
    const tokenData: AvitoTokenData = await tokenDataRes.json();

    if (!tokenDataRes.ok) {
      return res.status(500).json({ error: tokenData });
    }

    const decryptedToken = decrypt(tokenData.access_token);

    // Get the room's avito id
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select(`*`)
      .eq('id', room_id)
      .single();

    if (roomError) {
      return res.status(500).json({ error: 'Не удалось найти комнату.' });
    }

    const avito_room_id: number = roomData.avito_id;
    // POST to avito
    const avitoCreateRes = await fetch(
      `https://api.avito.ru/core/v1/accounts/${tokenData.avito_user_id}/items/${avito_room_id}/bookings`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${decryptedToken}`,
        },
        body: JSON.stringify({
          bookings: [
            {
              comment: additional_info,
              date_start: formatDateForAvito(check_in),
              date_end: formatDateForAvito(check_out),
              type: 'booking',
            },
          ],
          source: 'Bookings Calendar',
        }),
      }
    );

    if (avitoCreateRes.status === 403 || avitoCreateRes.status === 404) {
      // No such room found in avito
      return res.status(200).json({ avito_booking_id: null });
    }

    const avitoCreateData = await avitoCreateRes.json();

    if (!avitoCreateRes.ok) {
      return res.status(500).json({ error: avitoCreateData });
    }

    const dayRange = get30DayRange();
    const avitoBookingsRes = await fetch(
      `https://api.avito.ru/realty/v1/accounts/${tokenData.avito_user_id}/items/${avito_room_id}/bookings?date_start=${dayRange.start}&date_end=${dayRange.end}&with_unpaid=true`,
      {
        headers: {
          Authorization: `Bearer ${decryptedToken}`,
        },
      }
    );

    const avitoBookingsData: AvitoResponse = await avitoBookingsRes.json();

    if (!avitoBookingsRes.ok) {
      return res.status(500).json({ error: avitoBookingsData.error?.message });
    }

    const bookings = avitoBookingsData.bookings as AvitoBooking[];
    const avito_booking_id = bookings.find(
      (booking) => booking.check_in === formatDateForAvito(check_in)
    )?.avito_booking_id;

    return res.status(200).json({ avito_booking_id: avito_booking_id ?? null });
  }

  if (req.method === 'GET') {
    const { user_id } = req.query;

    // Get the user token
    const tokenDataRes = await fetch(
      `${process.env.NEXT_PUBLIC_URL}/api/avito/accessToken?user_id=${user_id}`
    );
    const tokenData: AvitoTokenData = await tokenDataRes.json();

    if (!tokenDataRes.ok) {
      return res.status(500).json({ error: tokenData });
    }

    const decryptedToken = decrypt(tokenData.access_token);

    // Get bookings in the database
    const { data: dbRooms, error } = await supabase
      .from('rooms')
      .select('*')
      .neq('avito_link', null)
      .neq('avito_link', '')
      .eq('user_id', user_id);

    if (error) {
      return res
        .status(500)
        .json({ error: 'Не удалось получить брони с датабазы' });
    }

    // Get bookings in Avito for each room
    const avitoBookingsByRoom: Record<number, AvitoBooking[]> = {};

    const dayRange = get30DayRange();
    try {
      const bookingsPromises = dbRooms.map(async (room: Room) => {
        const avitoRes = await fetch(
          `https://api.avito.ru/realty/v1/accounts/${tokenData.avito_user_id}/items/${room.avito_id}/bookings?date_start=${dayRange.start}&date_end=${dayRange.end}&with_unpaid=true`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${decryptedToken}`,
            },
          }
        );

        if (!avitoRes.ok) {
          throw new Error(
            `Не удалось получить брони с Авито для комнаты ${room.name}`
          );
        }

        const avitoData = await avitoRes.json();
        avitoBookingsByRoom[room.id] = avitoData.bookings || [];
      });

      await Promise.all(bookingsPromises);
    } catch (error: unknown) {
      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Произошла неизвестная ошибка',
      });
    }
    return res.status(201).json(avitoBookingsByRoom);
  }

  return res.status(405).json({ error: 'Данный метод API не существует.' });
}
