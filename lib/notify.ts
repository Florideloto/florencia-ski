import { Resend } from 'resend';
import { format } from 'date-fns';
import { createServerSupabase } from '@/lib/supabase';
import { getDateFnsLocale } from '@/lib/dateLocale';
import { isHalfDaySlot } from '@/lib/bookingUtils';
import type { Locale } from '@/lib/types';

interface BookingDay {
  date: string;
  start_time: string;
  end_time: string;
}

function parseDay(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

async function logEmailFailure(params: {
  type: 'booking_notification' | 'booking_confirmation';
  bookingRequestId?: string | null;
  recipient: string;
  error: unknown;
}) {
  try {
    const supabase = createServerSupabase();
    await supabase.from('email_logs').insert({
      type: params.type,
      booking_request_id: params.bookingRequestId ?? null,
      recipient: params.recipient,
      status: 'failed',
      error_message: params.error instanceof Error ? params.error.message : String(params.error),
    });
  } catch (logErr) {
    console.error('email_logs insert failed:', logErr);
  }
}

// =====================================================================
// System 1 — notify Florencia when a client submits a booking request
// =====================================================================

interface BookingNotificationParams {
  bookingId: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  resort: string;
  resortOther: string;
  message: string;
  days: BookingDay[];
}

export async function sendBookingNotificationEmail(params: BookingNotificationParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFICATION_EMAIL;
  if (!apiKey || !to) {
    await logEmailFailure({
      type: 'booking_notification',
      bookingRequestId: params.bookingId,
      recipient: to ?? '(NOTIFICATION_EMAIL no configurado)',
      error: 'RESEND_API_KEY o NOTIFICATION_EMAIL faltante en las variables de entorno',
    });
    return;
  }

  const resend = new Resend(apiKey);
  const resortLabel = params.resort === 'Other' ? params.resortOther : params.resort;
  const daysList = params.days
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => {
      const duration = isHalfDaySlot(d) ? '3 horas' : 'Día Completo';
      return `- ${d.date}: ${d.start_time.slice(0, 5)}–${d.end_time.slice(0, 5)} (${duration})`;
    })
    .join('\n');

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Florencia Ski <onboarding@resend.dev>',
      to,
      subject: `Nueva reserva: ${params.name}`,
      text: [
        `Nombre: ${params.name}`,
        `Email: ${params.email}`,
        `Teléfono: ${params.phone || '—'}`,
        `Servicio: ${params.service}`,
        `Resort: ${resortLabel}`,
        '',
        'Días:',
        daysList,
        '',
        `Mensaje: ${params.message || '—'}`,
      ].join('\n'),
    });
  } catch (err) {
    console.error('notification email error:', err);
    await logEmailFailure({
      type: 'booking_notification',
      bookingRequestId: params.bookingId,
      recipient: to,
      error: err,
    });
  }
}

// =====================================================================
// System 2 — confirm to the client once Florencia approves the booking
// =====================================================================

interface BookingConfirmationParams {
  bookingId: string;
  name: string;
  email: string;
  resort: string;
  resortOther: string;
  locale: Locale;
  days: BookingDay[];
}

const CONFIRMATION_COPY: Record<
  Locale,
  {
    subject: string;
    greeting: (name: string) => string;
    intro: string;
    closing: string;
    signoff: string;
    durationHalf: string;
    durationFull: string;
    dateFormat: string;
  }
> = {
  es: {
    subject: '¡Reserva confirmada! Nos vemos en la nieve ❄️',
    greeting: (name) => `Hola ${name},`,
    intro: '¡Qué alegría que vengas a esquiar conmigo! Tu reserva quedó confirmada:',
    closing:
      'Nos vemos en la montaña — va a ser un día para disfrutar a fondo. Cualquier duda o cambio de planes, escribime por WhatsApp o respondé este email.',
    signoff: '¡Nos vemos en la nieve!\nFlorencia',
    durationHalf: '3 horas',
    durationFull: 'Día Completo',
    dateFormat: 'd \'de\' MMMM',
  },
  en: {
    subject: 'Your ski class is confirmed! ❄️',
    greeting: (name) => `Hi ${name},`,
    intro: "So happy you're joining me on the mountain! Your booking is confirmed:",
    closing:
      "Get ready for a day you'll want to relive. Any questions or changes, just message me on WhatsApp or reply to this email.",
    signoff: 'See you on the snow!\nFlorencia',
    durationHalf: '3 hours',
    durationFull: 'Full Day',
    dateFormat: 'MMMM d',
  },
  th: {
    subject: 'ยืนยันการจองเรียบร้อยแล้ว! ❄️',
    greeting: (name) => `สวัสดีค่ะคุณ ${name}`,
    intro: 'ดีใจมากที่จะได้สอนเล่นสกีด้วยกันค่ะ! การจองของคุณได้รับการยืนยันแล้ว:',
    closing:
      'เตรียมตัวไว้สำหรับวันที่คุณจะประทับใจไม่รู้ลืมนะคะ หากมีคำถามหรือต้องการเปลี่ยนแปลง ทักมาทาง WhatsApp หรือตอบกลับอีเมลนี้ได้เลยค่ะ',
    signoff: 'แล้วเจอกันบนลานสกีนะคะ!\nFlorencia',
    durationHalf: '3 ชั่วโมง',
    durationFull: 'เต็มวัน',
    dateFormat: 'd MMMM',
  },
};

export async function sendBookingConfirmationEmail(params: BookingConfirmationParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    await logEmailFailure({
      type: 'booking_confirmation',
      bookingRequestId: params.bookingId,
      recipient: params.email,
      error: 'RESEND_API_KEY faltante en las variables de entorno',
    });
    return false;
  }

  const resend = new Resend(apiKey);
  const copy = CONFIRMATION_COPY[params.locale] ?? CONFIRMATION_COPY.es;
  const dateFnsLocale = getDateFnsLocale(params.locale);
  const resortLabel = params.resort === 'Other' ? params.resortOther : params.resort;

  const daysList = params.days
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => {
      const duration = isHalfDaySlot(d) ? copy.durationHalf : copy.durationFull;
      const dateLabel = format(parseDay(d.date), copy.dateFormat, { locale: dateFnsLocale });
      return `📅 ${dateLabel} — ${duration}`;
    })
    .join('\n');

  const text = [
    copy.greeting(params.name),
    '',
    copy.intro,
    '',
    daysList,
    `📍 ${resortLabel}`,
    '',
    copy.closing,
    '',
    copy.signoff,
  ].join('\n');

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Florencia Ski <onboarding@resend.dev>',
      to: params.email,
      subject: copy.subject,
      text,
    });
    return true;
  } catch (err) {
    console.error('confirmation email error:', err);
    await logEmailFailure({
      type: 'booking_confirmation',
      bookingRequestId: params.bookingId,
      recipient: params.email,
      error: err,
    });
    return false;
  }
}
