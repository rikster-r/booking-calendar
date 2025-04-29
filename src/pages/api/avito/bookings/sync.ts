import { NextApiRequest, NextApiResponse } from 'next';
import createClient from '@/lib/supabase/api';
import { decrypt } from '@/lib/encrypt';

// route used by external cron job service every 5 minutes

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(req, res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не поддерживается' });
  }

  // Step 1: Fetch all user access tokens
  const { data: tokenRows, error: tokenError } = await supabase
    .from('avito_access_tokens')
    .select('user_id');

  if (tokenError) {
    return res
      .status(500)
      .json({ error: 'Не удалось получить токены пользователей' });
  }

  for (const tokenRow of tokenRows) {
    const { user_id } = tokenRow;

    // Get the user token separately because it might be expired
    const tokenDataRes = await fetch(`
      ${process.env.NEXT_PUBLIC_URL}/api/avito/accessToken?user_id=${user_id}`);
    const tokenData: AvitoTokenData = await tokenDataRes.json();

    if (!tokenDataRes.ok) {
      continue;
    }

    const decryptedToken = decrypt(tokenData.access_token);

    // Step 2: Fetch that user's bookings
    const { data: dbBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*, rooms(id,room_id,avito_id,avito_link)')
      .neq('rooms.avito_link', null)
      .neq('rooms.avito_link', '')
      .eq('user_id', user_id);

    if (bookingsError) {
      console.error(`User ${user_id}: failed to get bookings`, bookingsError);
      continue;
    }

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
          console.error(
            `Room ${booking.room.id}: failed to get Avito bookings`
          );
          return;
        }

        const avitoData = await avitoRes.json();
        avitoBookingsByRoom[booking.room.id] = avitoData.bookings || [];
      });

      await Promise.all(bookingsPromises);
    } catch (err) {
      console.error(`User ${user_id}: error fetching Avito data`, err);
      continue;
    }

    // Step 3: Prepare data to sync
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
            user_id,
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
            user_id,
          });
        }
      });
    });

    // Step 4: Upsert and insert bookings
    if (bookingsToUpsert.length > 0) {
      const { error: updateError } = await supabase
        .from('bookings')
        .upsert(bookingsToUpsert, {
          onConflict: 'id',
          ignoreDuplicates: false,
        });

      if (updateError) {
        console.error(
          `User ${user_id}: failed to upsert bookings`,
          updateError
        );
      }
    }

    if (bookingsToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('bookings')
        .insert(bookingsToCreate);

      if (insertError) {
        console.error(
          `User ${user_id}: failed to insert new bookings`,
          insertError
        );
      }
    }
  }

  return res
    .status(200)
    .json({ message: 'Синхронизация завершена для всех пользователей' });
}
