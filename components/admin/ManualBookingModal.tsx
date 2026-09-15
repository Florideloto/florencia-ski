'use client';

import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { RESORTS, RESORT_LABELS } from '@/lib/resortColors';
import type { Resort } from '@/lib/types';
import 'react-day-picker/style.css';

const SEASON_START = new Date(2026, 11, 1);
const SEASON_END = new Date(2027, 1, 28);

type ServiceType = 'private' | 'kids' | 'offPiste';
type Duration = 'half' | 'full';

interface DaySelection {
  date: string;
  duration: Duration;
}

interface Props {
  disabledDates: Set<string>;
  onClose: () => void;
  onCreated: () => void;
}

function parseYMD(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export default function ManualBookingModal({ disabledDates, onClose, onCreated }: Props) {
  const [days, setDays] = useState<DaySelection[]>([]);
  const [month, setMonth] = useState<Date>(SEASON_START);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState<ServiceType>('private');
  const [resort, setResort] = useState<Resort>('Hakuba');
  const [resortOther, setResortOther] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleSelectDays(selected: Date[] | undefined) {
    const keys = (selected ?? []).map((d) => format(d, 'yyyy-MM-dd'));
    setDays((prev) => {
      const kept = prev.filter((d) => keys.includes(d.date));
      const keptKeys = new Set(kept.map((d) => d.date));
      const added = keys.filter((k) => !keptKeys.has(k)).map((k) => ({ date: k, duration: 'full' as Duration }));
      return [...kept, ...added].sort((a, b) => a.date.localeCompare(b.date));
    });
  }

  function setDuration(date: string, duration: Duration) {
    setDays((prev) => prev.map((d) => (d.date === date ? { ...d, duration } : d)));
  }

  function removeDay(date: string) {
    setDays((prev) => prev.filter((d) => d.date !== date));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (days.length === 0 || !name || (resort === 'Other' && !resortOther)) {
      setError('Completá al menos un día, el nombre, y el resort.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/bookings/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({
          slots: days.map((d) => ({
            date: d.date,
            start_time: '09:00:00',
            end_time: d.duration === 'half' ? '12:00:00' : '16:00:00',
          })),
          name,
          email,
          phone,
          service,
          resort,
          resort_other: resort === 'Other' ? resortOther : '',
          message,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(
          body.error === 'One or more days are no longer available'
            ? 'Uno o más días elegidos ya no están disponibles.'
            : 'No se pudo crear la reserva. Intentá de nuevo.'
        );
        setSaving(false);
        return;
      }
      onCreated();
      onClose();
    } catch {
      setError('No se pudo crear la reserva. Revisá tu conexión.');
      setSaving(false);
    }
  }

  const selectedDates = days.map((d) => parseYMD(d.date));

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-brand-navy border border-brand-border max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h2
            className="text-white text-lg"
            style={{ fontFamily: 'var(--font-barlow)', fontWeight: 800, textTransform: 'uppercase' }}
          >
            Nueva Reserva Manual
          </h2>
          <button onClick={onClose} className="text-brand-subtext hover:text-white text-xl leading-none">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid md:grid-cols-2 gap-6">
          {/* Calendar */}
          <div>
            <label className="text-xs text-brand-subtext tracking-widest uppercase mb-2 block" style={{ fontFamily: 'var(--font-barlow)' }}>
              Día(s)
            </label>
            <DayPicker
              mode="multiple"
              selected={selectedDates}
              onSelect={handleSelectDays}
              month={month}
              onMonthChange={setMonth}
              startMonth={SEASON_START}
              endMonth={SEASON_END}
              disabled={(date) => disabledDates.has(format(date, 'yyyy-MM-dd'))}
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

            {days.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                {days.map((d) => (
                  <div key={d.date} className="flex items-center justify-between gap-2 border border-brand-border px-3 py-2">
                    <span className="text-white text-sm">{d.date}</span>
                    <div className="flex border border-brand-border">
                      <button
                        type="button"
                        onClick={() => setDuration(d.date, 'half')}
                        className={`px-2 py-1 text-xs uppercase font-bold ${d.duration === 'half' ? 'bg-brand-ice text-brand-dark' : 'text-brand-subtext'}`}
                      >
                        3h
                      </button>
                      <button
                        type="button"
                        onClick={() => setDuration(d.date, 'full')}
                        className={`px-2 py-1 text-xs uppercase font-bold border-l border-brand-border ${d.duration === 'full' ? 'bg-brand-ice text-brand-dark' : 'text-brand-subtext'}`}
                      >
                        Día Completo
                      </button>
                    </div>
                    <button type="button" onClick={() => removeDay(d.date)} className="text-brand-subtext hover:text-red-400 px-1">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Client details */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-brand-subtext tracking-widest uppercase" style={{ fontFamily: 'var(--font-barlow)' }}>
                Nombre *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-brand-dark border border-brand-border px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-ice"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-brand-subtext tracking-widest uppercase" style={{ fontFamily: 'var(--font-barlow)' }}>
                Email (opcional — si lo cargás, le llega el mail de confirmación)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-brand-dark border border-brand-border px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-ice"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-brand-subtext tracking-widest uppercase" style={{ fontFamily: 'var(--font-barlow)' }}>
                Teléfono / WhatsApp
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-brand-dark border border-brand-border px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-ice"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-brand-subtext tracking-widest uppercase" style={{ fontFamily: 'var(--font-barlow)' }}>
                Servicio
              </label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value as ServiceType)}
                className="bg-brand-dark border border-brand-border px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-ice"
              >
                <option value="private">Clase Privada</option>
                <option value="kids">Clase para Niños</option>
                <option value="offPiste">Fuera de Pista / Backcountry</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-brand-subtext tracking-widest uppercase" style={{ fontFamily: 'var(--font-barlow)' }}>
                Resort
              </label>
              <select
                value={resort}
                onChange={(e) => setResort(e.target.value as Resort)}
                className="bg-brand-dark border border-brand-border px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-ice"
              >
                {RESORTS.map((r) => (
                  <option key={r} value={r}>{RESORT_LABELS[r]}</option>
                ))}
              </select>
              {resort === 'Other' && (
                <input
                  value={resortOther}
                  onChange={(e) => setResortOther(e.target.value)}
                  placeholder="Aclará cuál"
                  className="mt-1.5 bg-brand-dark border border-brand-border px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-ice"
                />
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-brand-subtext tracking-widest uppercase" style={{ fontFamily: 'var(--font-barlow)' }}>
                Nota (opcional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                className="bg-brand-dark border border-brand-border px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-ice resize-none"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 bg-brand-ice text-brand-dark text-sm tracking-widest uppercase font-bold hover:bg-white disabled:opacity-50 transition-all"
              style={{ fontFamily: 'var(--font-barlow)', fontWeight: 700 }}
            >
              {saving ? 'Guardando…' : 'Crear Reserva Confirmada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
