import { useMemo, useState, useEffect } from 'react';
import { startOfDay, differenceInDays } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { COMMEMORATIVE_DATES, ALERT_DAYS_BEFORE, getEventDate, type CommemorativeDate } from '@/data/commemorative-dates';

export interface ActiveCommemorativeDate extends CommemorativeDate {
  daysUntil: number;
  isToday: boolean;
  eventDate: Date;
}

export function useCommemorativeDates() {
  const [enabledDateIds, setEnabledDateIds] = useState<string[]>([]);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await (supabase as any).from('commemorative_date_settings').select('date_id, is_enabled').eq('is_enabled', true);
        if (error) throw error;
        setEnabledDateIds(data?.map((s: any) => s.date_id) || COMMEMORATIVE_DATES.map(d => d.id));
      } catch {
        setEnabledDateIds(COMMEMORATIVE_DATES.map(d => d.id));
      } finally { setIsLoadingSettings(false); }
    };
    fetchSettings();

    const channel = supabase.channel('commemorative-date-settings-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'commemorative_date_settings' }, () => fetchSettings()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const activeDates = useMemo(() => {
    if (isLoadingSettings) return [];
    const today = startOfDay(new Date());
    const currentYear = today.getFullYear();
    const active: ActiveCommemorativeDate[] = [];
    const enabledDates = COMMEMORATIVE_DATES.filter(d => enabledDateIds.includes(d.id));

    for (const date of enabledDates) {
      let eventDate = startOfDay(getEventDate(date, currentYear));
      let daysUntil = differenceInDays(eventDate, today);
      if (daysUntil < 0) {
        eventDate = startOfDay(getEventDate(date, currentYear + 1));
        daysUntil = differenceInDays(eventDate, today);
      }
      if (daysUntil >= 0 && daysUntil <= ALERT_DAYS_BEFORE) {
        active.push({ ...date, daysUntil, isToday: daysUntil === 0, eventDate });
      }
    }
    return active.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [enabledDateIds, isLoadingSettings]);

  return { activeDates, hasActiveDate: activeDates.length > 0, nearestDate: activeDates[0] || null, isLoadingSettings, enabledDateIds };
}
