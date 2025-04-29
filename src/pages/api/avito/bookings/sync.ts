import { NextApiRequest, NextApiResponse } from 'next';
import createClient from '@/lib/supabase/api';
import { decrypt } from '@/lib/encrypt';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(req, res);

  if (req.method === 'POST') {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Не указан айди пользователя' });
    }

    // Get bookings in the database
    const { data: dbBookings, error } = await supabase
      .from('bookings')
      .select('*, rooms(id,room_id,avito_id,avito_link)')
      .neq('rooms.avito_link', null)
      .neq('rooms.avito_link', '')
      .eq('user_id', userId);

    if (error) {
      return res
        .status(500)
        .json({ error: 'Не удалось получить брони с датабазы' });
    }

    // Get the user token
    const tokenDataRes = await fetch(
      `${process.env.NEXT_PUBLIC_URL}/api/avito/accessToken`
    );
    const tokenData: AvitoTokenData = await tokenDataRes.json();

    if (!tokenDataRes.ok) {
      return res.status(500).json({ error: tokenData });
    }

    const decryptedToken = decrypt(tokenData.access_token);

    // Get bookings in Avito for each room
    const avitoBookingsByRoom: Record<number, AvitoBooking[]> = {};

    try {
      const bookingsPromises = dbBookings.map(async (booking: Booking) => {
        if (!booking.room) return;
        const avitoRes = await fetch(
          `https://api.avito.ru/realty/v1/accounts/${tokenData.avito_user_id}/items/${booking.room.avito_id}/bookings`,
          {
            headers: {
              Authorization: `Bearer ${decryptedToken}`,
            },
          }
        );

        if (!avitoRes.ok) {
          throw new Error(
            `Не удалось получить брони с Авито для комнаты ${booking.room.id}`
          );
        }

        const avitoData = await avitoRes.json();
        avitoBookingsByRoom[booking.room.id] = avitoData.bookings || [];
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

    // Compare and sync bookings
    const bookingsToUpsert: Booking[] = [];
    const bookingsToCreate: BookingToInsert[] = [];

    Object.entries(avitoBookingsByRoom).forEach(([roomId, avitoBookings]) => {
      avitoBookings.forEach((avitoBooking) => {
        const matchingDbBooking = (dbBookings as Booking[]).find(
          (dbBooking) => dbBooking.avito_id === avitoBooking.avito_booking_id
        );

        if (matchingDbBooking) {
          bookingsToUpsert.push({
            id: matchingDbBooking.id,
            room_id: matchingDbBooking.room_id,
            client_name: avitoBooking.contact.name,
            client_phone: `+7${avitoBooking.contact.phone}`,
            client_email: avitoBooking.contact.email,
            adults_count: matchingDbBooking.adults_count,
            children_count: matchingDbBooking.children_count,
            door_code: matchingDbBooking.door_code,
            additional_info: matchingDbBooking.additional_info,
            daily_price: matchingDbBooking.daily_price,
            paid: matchingDbBooking.paid,
            check_in: new Date(avitoBooking.check_in),
            check_out: new Date(avitoBooking.check_out),
            created_at: matchingDbBooking.created_at,
            avito_id: avitoBooking.avito_booking_id,
            user_id: userId as string,
          });
        } else {
          bookingsToCreate.push({
            room_id: Number(roomId),
            client_name: avitoBooking.contact.name,
            client_phone: `+7${avitoBooking.contact.phone}`,
            client_email: avitoBooking.contact.email,
            adults_count: avitoBooking.guest_count,
            children_count: 0,
            door_code: null,
            additional_info: '',
            daily_price: avitoBooking.base_price / avitoBooking.nights,
            paid: false,
            check_in: new Date(avitoBooking.check_in),
            check_out: new Date(avitoBooking.check_out),
            avito_id: avitoBooking.avito_booking_id,
            user_id: userId as string,
          });
        }
      });
    });

    // Perform updates
    if (bookingsToUpsert.length > 0) {
      const { error: updateError } = await supabase
        .from('bookings')
        .upsert(bookingsToUpsert, {
          onConflict: 'id',
          ignoreDuplicates: false,
        });

      if (updateError) {
        return res.status(500).json({ error: 'Не удалось обновить брони.' });
      }
    }

    // Perform inserts
    if (bookingsToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('bookings')
        .insert(bookingsToCreate);

      if (insertError) {
        return res
          .status(500)
          .json({ error: 'Не удалось создать новые брони.' });
      }
    }

    return res.status(200).json({ message: 'Брони успешно синхронизированы' });
  }
}
