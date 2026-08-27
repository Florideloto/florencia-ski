'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { DayPicker } from 'react-day-picker';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, getDay, isWithinInterval, isBefore, parseISO } from 'date-fns';
import type { BlockedDate, BookingRequest, Review } from '@/lib/types';
import Logo from '@/components/Logo';
import StarRating from '@/components/reviews/StarRating';
import 'react-day-picker/style.css';

const SEASON_START = new Date(2026, 11, 1);
const SEASON_END = new Date(2027, 1, 28);

const WEEKDAYS = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 0, label: 'Sun' },
] as const;

function mergeDays(current: Date[], additions: Date[]): Date[] {
  const map = new Map<string, Date>();
  for (const d of current) map.set(format(d, 'yyyy-MM-dd'), d);
  for (const d of additions) map.set(format(d, 'yyyy-MM-dd'), d);
  return Array.from(map.values()).sort((a, b) => a.getTime() - b.getTime());
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const locale = useLocale();

  const [tab, setTab] = useState<'availability' | 'bookings' | 'reviews'>('availability');
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  const [blockNote, setBlockNote] = useState('');
  const [month, setMonth] = useState<Date>(SEASON_START);
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) router.push(`/${locale}/admin/login`);
  }, [router, locale]);

  const fetchBlockedDates = useCallback(async () => {
    const { data } = await supabase
      .from('blocked_dates')
      .select('*')
      .gte('date', '2026-12-01')
      .lte('date', '2027-02-28')
      .order('date', { ascending: true });
    setBlockedDates(data ?? []);
  }, []);

  const fetchBookings = useCallback(async () => {
    const { data } = await supabase
      .from('booking_requests')
      .select('*, slot:availability_slots(*), booking_request_slots(slot:availability_slots(*))')
      .order('created_at', { ascending: false });
    const withSlots = (data ?? []).map((b) => ({
      ...b,
      slots: (b.booking_request_slots ?? []).map((r: { slot: unknown }) => r.slot).filter(Boolean),
    }));
    setBookings(withSlots);
  }, []);

  const fetchReviews = useCallback(async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
    setReviews(data ?? []);
  }, []);

  useEffect(() => {
    checkAuth().then(async () => {
      await Promise.all([fetchBlockedDates(), fetchBookings(), fetchReviews()]);
      setLoading(false);
    });
  }, [checkAuth, fetchBlockedDates, fetchBookings, fetchReviews]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push(`/${locale}/admin/login`);
  }

  function toggleWeekday(id: number) {
    setSelectedWeekdays((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  }

  function addDateRange() {
    if (!rangeFrom || !rangeTo) return;
    const start = parseISO(rangeFrom);
    const end = parseISO(rangeTo);
    if (isBefore(end, start)) return;
    const days = eachDayOfInterval({ start, end }).filter((d) =>
      isWithinInterval(d, { start: SEASON_START, end: SEASON_END })
    );
    setSelectedDays((prev) => mergeDays(prev, days));
    setRangeFrom('');
    setRangeTo('');
  }

  function addWeekdaysInMonth() {
    if (selectedWeekdays.length === 0) return;
    const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
      .filter((d) => selectedWeekdays.includes(getDay(d)))
      .filter((d) => isWithinInterval(d, { start: SEASON_START, end: SEASON_END }));
    setSelectedDays((prev) => mergeDays(prev, days));
  }

  async function addBlockedDates() {
    if (selectedDays.length === 0) return;
    setSaving(true);
    setMessage('');

    const rows = selectedDays.map((day) => ({
      date: format(day, 'yyyy-MM-dd'),
      note: blockNote,
    }));

    const { error } = await supabase.from('blocked_dates').upsert(rows, {
      onConflict: 'date',
      ignoreDuplicates: false,
    });

    if (error) {
      setMessage('Error blocking days: ' + error.message);
    } else {
      setMessage(`✓ ${rows.length} day(s) blocked.`);
      setSelectedDays([]);
      setBlockNote('');
      await fetchBlockedDates();
    }
    setSaving(false);
  }

  async function removeBlockedDate(id: string) {
    await supabase.from('blocked_dates').delete().eq('id', id);
    await fetchBlockedDates();
  }

  async function updateBookingStatus(id: string, status: 'confirmed' | 'cancelled') {
    const booking = bookings.find((b) => b.id === id);
    await supabase.from('booking_requests').update({ status }).eq('id', id);
    if (booking) {
      const wasConfirmed = booking.status === 'confirmed';
      const slotIds = booking.slots && booking.slots.length > 0
        ? booking.slots.map((s) => s.id)
        : [booking.slot_id];
      if (status === 'confirmed') {
        await supabase.from('availability_slots').update({ is_booked: true }).in('id', slotIds);
      } else if (status === 'cancelled' && wasConfirmed) {
        await supabase.from('availability_slots').update({ is_booked: false }).in('id', slotIds);
      }
    }
    await fetchBookings();
  }

  async function approveReview(id: string) {
    await supabase.from('reviews').update({ approved: true }).eq('id', id);
    await fetchReviews();
  }

  async function deleteReview(id: string, imageUrl: string | null) {
    if (imageUrl) {
      const marker = '/object/public/reviews/';
      const markerIndex = imageUrl.indexOf(marker);
      if (markerIndex !== -1) {
        const path = imageUrl.slice(markerIndex + marker.length);
        await supabase.storage.from('reviews').remove([path]);
      }
    }
    await supabase.from('reviews').delete().eq('id', id);
    await fetchReviews();
  }

  const blockedDateSet = new Set(blockedDates.map((b) => b.date));

  const agendaRows = bookings
    .filter((b) => b.status !== 'cancelled')
    .flatMap((b) => {
      const bookingSlots = b.slots && b.slots.length > 0 ? b.slots : b.slot ? [b.slot] : [];
      return bookingSlots.map((s) => ({
        key: `${b.id}-${s.id}`,
        date: s.date,
        start_time: s.start_time,
        end_time: s.end_time,
        clientName: b.client_name,
        resort: b.resort === 'Other' ? b.resort_other : b.resort,
        status: b.status,
      }));
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const takenDates = new Set(agendaRows.filter((r) => r.status === 'confirmed').map((r) => r.date));

  const statusColor = {
    pending: 'text-yellow-400',
    confirmed: 'text-green-400',
    cancelled: 'text-red-400',
  } as const;

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <p className="text-brand-subtext">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Top bar */}
      <header className="bg-brand-navy border-b border-brand-border px-6 py-4 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-6">
          <a
            href={`/${locale}`}
            className="text-xs text-brand-subtext hover:text-white tracking-widest uppercase transition-colors"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            ← View Site
          </a>
          <button
            onClick={handleSignOut}
            className="text-xs text-brand-subtext hover:text-white tracking-widest uppercase transition-colors"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1
          className="text-white text-3xl mb-8"
          style={{ fontFamily: 'var(--font-barlow)', fontWeight: 900, textTransform: 'uppercase' }}
        >
          Admin Dashboard
        </h1>

        {/* Tabs */}
        <div className="flex gap-px mb-8 bg-brand-border w-fit">
          {(['availability', 'bookings', 'reviews'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-2.5 text-xs tracking-widest uppercase font-semibold transition-colors ${
                tab === t ? 'bg-brand-ice text-brand-dark' : 'bg-brand-navy text-brand-subtext hover:text-white'
              }`}
              style={{ fontFamily: 'var(--font-barlow)', fontWeight: 700 }}
            >
              {t === 'availability' && `Availability (${blockedDates.length} blocked)`}
              {t === 'bookings' && `Bookings (${bookings.filter(b => b.status === 'pending').length} pending)`}
              {t === 'reviews' && `Reviews (${reviews.filter(r => !r.approved).length} pending)`}
            </button>
          ))}
        </div>

        {/* Availability tab */}
        {tab === 'availability' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Block days */}
            <div className="bg-brand-navy border border-brand-border p-6">
              <h2
                className="text-white text-lg mb-1"
                style={{ fontFamily: 'var(--font-barlow)', fontWeight: 800, textTransform: 'uppercase' }}
              >
                Block Days
              </h2>
              <p className="text-brand-subtext text-xs mb-6">
                Every day is bookable by default. Pick days below to mark them unavailable.
              </p>

              <DayPicker
                mode="multiple"
                selected={selectedDays}
                onSelect={(days) => setSelectedDays(days ?? [])}
                month={month}
                onMonthChange={setMonth}
                startMonth={SEASON_START}
                endMonth={SEASON_END}
                modifiers={{
                  blocked: (date) => blockedDateSet.has(format(date, 'yyyy-MM-dd')),
                  taken: (date) => takenDates.has(format(date, 'yyyy-MM-dd')),
                }}
                modifiersClassNames={{
                  blocked: '!text-red-400 !font-bold',
                  taken: '!text-yellow-400 !font-bold',
                }}
                classNames={{
                  root: 'w-full',
                  month_caption: 'flex justify-between items-center mb-4',
                  caption_label: 'text-white text-sm tracking-widest uppercase font-semibold',
                  nav: 'flex gap-2',
                  button_previous: 'text-brand-subtext hover:text-white p-1',
                  button_next: 'text-brand-subtext hover:text-white p-1',
                  chevron: 'fill-brand-ice',
                  weekday: 'text-brand-subtext text-xs text-center py-2',
                  day_button: 'w-full h-full flex items-center justify-center text-sm rounded-none text-white disabled:opacity-25',
                  selected: '!bg-brand-ice !text-brand-dark font-bold',
                  today: 'underline',
                }}
              />

              <div className="flex items-center gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-xs text-brand-subtext">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Blocked
                </span>
                <span className="flex items-center gap-1.5 text-xs text-brand-subtext">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /> Booked
                </span>
              </div>

              {/* Quick select: date range + recurring weekdays */}
              <div className="mt-4 pt-5 border-t border-brand-border flex flex-col gap-4">
                <div>
                  <label className="text-xs text-brand-subtext uppercase tracking-widest mb-2 block" style={{ fontFamily: 'var(--font-barlow)' }}>
                    Add Date Range
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={rangeFrom}
                      onChange={(e) => setRangeFrom(e.target.value)}
                      min={format(SEASON_START, 'yyyy-MM-dd')}
                      max={format(SEASON_END, 'yyyy-MM-dd')}
                      className="flex-1 bg-brand-dark border border-brand-border px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-ice"
                    />
                    <span className="text-brand-subtext text-xs">to</span>
                    <input
                      type="date"
                      value={rangeTo}
                      onChange={(e) => setRangeTo(e.target.value)}
                      min={rangeFrom || format(SEASON_START, 'yyyy-MM-dd')}
                      max={format(SEASON_END, 'yyyy-MM-dd')}
                      className="flex-1 bg-brand-dark border border-brand-border px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-ice"
                    />
                    <button
                      type="button"
                      onClick={addDateRange}
                      disabled={!rangeFrom || !rangeTo}
                      className="shrink-0 px-4 py-2 border border-brand-ice text-brand-ice text-xs tracking-widest uppercase font-bold hover:bg-brand-ice hover:text-brand-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-brand-subtext uppercase tracking-widest mb-2 block" style={{ fontFamily: 'var(--font-barlow)' }}>
                    Add Recurring Weekdays — {format(month, 'MMMM yyyy')}
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {WEEKDAYS.map((w) => {
                      const active = selectedWeekdays.includes(w.id);
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => toggleWeekday(w.id)}
                          className={`px-3 py-1.5 text-xs tracking-widest uppercase font-semibold border transition-colors ${
                            active
                              ? 'border-brand-ice bg-brand-ice/10 text-white'
                              : 'border-brand-border text-brand-subtext hover:border-white hover:text-white'
                          }`}
                        >
                          {w.label}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={addWeekdaysInMonth}
                    disabled={selectedWeekdays.length === 0}
                    className="w-full px-4 py-2 border border-brand-ice text-brand-ice text-xs tracking-widest uppercase font-bold hover:bg-brand-ice hover:text-brand-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Add All Selected Weekdays in {format(month, 'MMMM')}
                  </button>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-1.5">
                <label className="text-xs text-brand-subtext uppercase tracking-widest" style={{ fontFamily: 'var(--font-barlow)' }}>
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={blockNote}
                  onChange={(e) => setBlockNote(e.target.value)}
                  placeholder="e.g. Vacation, booked via Instagram"
                  className="bg-brand-dark border border-brand-border px-4 py-2.5 text-white text-sm placeholder:text-brand-muted focus:outline-none focus:border-brand-ice transition-colors"
                />
              </div>

              {message && (
                <p className="mt-3 text-sm text-brand-ice">{message}</p>
              )}

              <button
                onClick={addBlockedDates}
                disabled={saving || selectedDays.length === 0}
                className="mt-4 w-full py-3 bg-brand-ice text-brand-dark text-sm tracking-widest uppercase font-bold hover:bg-white disabled:opacity-50 transition-all"
                style={{ fontFamily: 'var(--font-barlow)', fontWeight: 700 }}
              >
                {saving
                  ? 'Saving…'
                  : `Block ${selectedDays.length} Day${selectedDays.length !== 1 ? 's' : ''}`}
              </button>
            </div>

            {/* Blocked days + agenda */}
            <div className="flex flex-col gap-8">
              <div className="bg-brand-navy border border-brand-border p-6">
                <h2
                  className="text-white text-lg mb-6"
                  style={{ fontFamily: 'var(--font-barlow)', fontWeight: 800, textTransform: 'uppercase' }}
                >
                  Blocked Days
                </h2>

                {blockedDates.length === 0 ? (
                  <p className="text-brand-subtext text-sm">No days blocked — everything is open.</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                    {blockedDates.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between px-4 py-2.5 border border-brand-border hover:border-red-400/50"
                      >
                        <div>
                          <p className="text-white text-sm font-medium">{b.date}</p>
                          {b.note && <p className="text-brand-subtext text-xs">{b.note}</p>}
                        </div>
                        <button
                          onClick={() => removeBlockedDate(b.id)}
                          className="text-brand-muted hover:text-red-400 transition-colors p-1"
                          aria-label="Unblock day"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-brand-navy border border-brand-border p-6">
                <h2
                  className="text-white text-lg mb-6"
                  style={{ fontFamily: 'var(--font-barlow)', fontWeight: 800, textTransform: 'uppercase' }}
                >
                  Upcoming Bookings
                </h2>

                {agendaRows.length === 0 ? (
                  <p className="text-brand-subtext text-sm">No bookings yet.</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
                    {agendaRows.map((row) => (
                      <div key={row.key} className="flex items-center justify-between px-4 py-2.5 border border-brand-border">
                        <div>
                          <p className="text-white text-sm font-medium">
                            {row.date} · {row.start_time.slice(0, 5)}–{row.end_time.slice(0, 5)}
                          </p>
                          <p className="text-brand-subtext text-xs">
                            {row.clientName}
                            {row.resort && ` · 📍 ${row.resort}`}
                          </p>
                        </div>
                        <span className={`text-xs font-semibold uppercase tracking-wider shrink-0 ml-3 ${statusColor[row.status]}`}>
                          {row.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bookings tab */}
        {tab === 'bookings' && (
          <div className="bg-brand-navy border border-brand-border">
            {bookings.length === 0 ? (
              <div className="p-10 text-center text-brand-subtext">No booking requests yet.</div>
            ) : (
              <div className="divide-y divide-brand-border">
                {bookings.map((booking) => (
                  <div key={booking.id} className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-white font-semibold">{booking.client_name}</h3>
                          <span className={`text-xs font-semibold uppercase tracking-wider ${statusColor[booking.status]}`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-brand-subtext text-sm">{booking.client_email}</p>
                        {booking.client_phone && (
                          <p className="text-brand-subtext text-sm">{booking.client_phone}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-brand-subtext">
                          <span className="px-2 py-1 bg-brand-dark border border-brand-border">
                            {booking.service_type}
                          </span>
                          {booking.resort && (
                            <span className="px-2 py-1 bg-brand-dark border border-brand-border">
                              📍 {booking.resort === 'Other' ? booking.resort_other : booking.resort}
                            </span>
                          )}
                          {booking.duration && (
                            <span className="px-2 py-1 bg-brand-dark border border-brand-border">
                              {booking.duration}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-col gap-0.5 text-xs text-brand-subtext">
                          {(booking.slots && booking.slots.length > 0 ? booking.slots : booking.slot ? [booking.slot] : [])
                            .slice()
                            .sort((a, b) => a.date.localeCompare(b.date))
                            .map((s) => (
                              <span key={s.id}>{s.date} · {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}</span>
                            ))}
                        </div>
                        {booking.message && (
                          <p className="mt-2 text-sm text-brand-subtext italic">&ldquo;{booking.message}&rdquo;</p>
                        )}
                      </div>

                      {booking.status !== 'cancelled' && (
                        <div className="flex gap-2 shrink-0">
                          {booking.status === 'pending' && (
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              className="px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 text-xs tracking-widest uppercase font-semibold hover:bg-green-500/20 transition-colors"
                              style={{ fontFamily: 'var(--font-barlow)' }}
                            >
                              Confirm
                            </button>
                          )}
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                            className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs tracking-widest uppercase font-semibold hover:bg-red-500/20 transition-colors"
                            style={{ fontFamily: 'var(--font-barlow)' }}
                          >
                            {booking.status === 'confirmed' ? 'Cancel & Reopen' : 'Cancel'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reviews tab */}
        {tab === 'reviews' && (
          <div className="bg-brand-navy border border-brand-border">
            {reviews.length === 0 ? (
              <div className="p-10 text-center text-brand-subtext">No reviews yet.</div>
            ) : (
              <div className="divide-y divide-brand-border">
                {reviews.map((review) => (
                  <div key={review.id} className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {review.image_url && (
                          // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail, no need for next/image optimization here
                          <img
                            src={review.image_url}
                            alt={review.reviewer_name}
                            className="w-16 h-16 object-cover border border-brand-border shrink-0"
                          />
                        )}
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-white font-semibold">{review.reviewer_name}</h3>
                            <span
                              className={`text-xs font-semibold uppercase tracking-wider ${
                                review.approved ? 'text-green-400' : 'text-yellow-400'
                              }`}
                            >
                              {review.approved ? 'Approved' : 'Pending'}
                            </span>
                          </div>
                          <StarRating rating={review.rating} size="sm" />
                          <p className="mt-1 text-sm text-brand-subtext italic max-w-lg">&ldquo;{review.text}&rdquo;</p>
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        {!review.approved && (
                          <button
                            onClick={() => approveReview(review.id)}
                            className="px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 text-xs tracking-widest uppercase font-semibold hover:bg-green-500/20 transition-colors"
                            style={{ fontFamily: 'var(--font-barlow)' }}
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => deleteReview(review.id, review.image_url)}
                          className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs tracking-widest uppercase font-semibold hover:bg-red-500/20 transition-colors"
                          style={{ fontFamily: 'var(--font-barlow)' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
