import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { COMMEMORATIVE_DATES } from '@/data/commemorative-dates';

export interface CommemorativeDateSetting {
  id: string;
  date_id: string;
  is_enabled: boolean;
  updated_at: string;
}

export function useCommemorativeDateSettings() {
  const [settings, setSettings] = useState<CommemorativeDateSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any).from('commemorative_date_settings').select('*').order('date_id');
      if (error) throw error;
      if (!data || data.length === 0) {
        const defaultSettings = COMMEMORATIVE_DATES.map(date => ({ date_id: date.id, is_enabled: true }));
        const { data: insertedData, error: insertError } = await (supabase as any).from('commemorative_date_settings').insert(defaultSettings).select();
        if (insertError) throw insertError;
        setSettings(insertedData as CommemorativeDateSetting[]);
      } else { setSettings(data as CommemorativeDateSetting[]); }
    } catch (error) { console.error('Error fetching commemorative date settings:', error); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const toggleSetting = async (dateId: string) => {
    const currentSetting = settings.find(s => s.date_id === dateId);
    if (!currentSetting) return;
    setIsSaving(true);
    try {
      const { error } = await (supabase as any).from('commemorative_date_settings').update({ is_enabled: !currentSetting.is_enabled }).eq('date_id', dateId);
      if (error) throw error;
      setSettings(prev => prev.map(s => s.date_id === dateId ? { ...s, is_enabled: !s.is_enabled } : s));
    } catch { toast({ title: 'Erro ao salvar', variant: 'destructive' }); }
    finally { setIsSaving(false); }
  };

  const enableAll = async () => {
    setIsSaving(true);
    try {
      const { error } = await (supabase as any).from('commemorative_date_settings').update({ is_enabled: true }).neq('date_id', '');
      if (error) throw error;
      setSettings(prev => prev.map(s => ({ ...s, is_enabled: true })));
      toast({ title: 'Todas as datas ativadas' });
    } catch { toast({ title: 'Erro ao salvar', variant: 'destructive' }); }
    finally { setIsSaving(false); }
  };

  const disableAll = async () => {
    setIsSaving(true);
    try {
      const { error } = await (supabase as any).from('commemorative_date_settings').update({ is_enabled: false }).neq('date_id', '');
      if (error) throw error;
      setSettings(prev => prev.map(s => ({ ...s, is_enabled: false })));
      toast({ title: 'Todas as datas desativadas' });
    } catch { toast({ title: 'Erro ao salvar', variant: 'destructive' }); }
    finally { setIsSaving(false); }
  };

  const isEnabled = (dateId: string): boolean => {
    const setting = settings.find(s => s.date_id === dateId);
    return setting?.is_enabled ?? true;
  };

  return { settings, isLoading, isSaving, toggleSetting, enableAll, disableAll, isEnabled, enabledDateIds: settings.filter(s => s.is_enabled).map(s => s.date_id), refetch: fetchSettings };
}
