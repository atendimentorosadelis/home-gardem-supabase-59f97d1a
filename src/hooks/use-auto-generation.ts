import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export interface AutoGenerationConfig { id: string; enabled: boolean; topics: string[]; publish_immediately: boolean; daily_limit: number; random_all_topics: boolean; updated_at: string; updated_by: string | null; }
export interface AutoGenerationSchedule { id: string; day_of_week: number; time_slot: string; is_active: boolean; created_at: string; }
export interface AutoGenerationLog { id: string; article_id: string | null; topic_used: string; status: 'pending' | 'running' | 'success' | 'error' | 'skipped'; error_message: string | null; executed_at: string; duration_ms: number | null; }

export const AVAILABLE_TOPICS = [
  // Design Interno - Áreas Sociais
  { id: 'sala', label: 'Sala', category: 'Design Interno' },
  { id: 'sala-jantar', label: 'Sala de Jantar', category: 'Design Interno' },
  { id: 'lareira', label: 'Lareira', category: 'Design Interno' },
  { id: 'area-gourmet', label: 'Área Gourmet', category: 'Design Interno' },
  // Design Interno - Áreas Íntimas
  { id: 'quarto', label: 'Quarto', category: 'Design Interno' },
  { id: 'banheiro', label: 'Banheiro', category: 'Design Interno' },
  { id: 'escritorio', label: 'Escritório', category: 'Design Interno' },
  // Design Interno - Áreas de Serviço
  { id: 'cozinha', label: 'Cozinha', category: 'Design Interno' },
  { id: 'varanda', label: 'Varanda', category: 'Design Interno' },
  { id: 'area-servico', label: 'Área de Serviço', category: 'Design Interno' },
  { id: 'piscina', label: 'Piscina', category: 'Design Interno' },
  { id: 'dicas-de-pintura', label: 'Dicas de Pintura', category: 'Design Interno' },
  // Jardim
  { id: 'jardim', label: 'Jardim', category: 'Jardim' },
  { id: 'decoracao', label: 'Dicas de Decoração', category: 'Jardim' },
  { id: 'cuidados', label: 'Cuidados com a Plantação', category: 'Jardim' },
  { id: 'jardim-vertical', label: 'Jardim Vertical', category: 'Jardim' },
  { id: 'jardim-suculentas', label: 'Suculentas e Cactos', category: 'Jardim' },
  { id: 'jardim-ervas', label: 'Horta de Ervas', category: 'Jardim' },
  { id: 'jardim-flores', label: 'Flores Ornamentais', category: 'Jardim' },
  { id: 'jardim-paisagismo', label: 'Paisagismo', category: 'Jardim' },
  { id: 'jardim-hidroponia', label: 'Hidroponia', category: 'Jardim' },
  { id: 'jardim-sustentavel', label: 'Jardim Sustentável', category: 'Jardim' },
  { id: 'jardim-halloween', label: 'Halloween', category: 'Jardim' },
  { id: 'jardim-nomes-cuidados', label: 'Nomes e Cuidados Plantas e Flores', category: 'Jardim' },
  { id: 'jardim-hortas-ervas-cuidados', label: 'Hortas, Ervas e Cuidados', category: 'Jardim' },
  // Arquitetura
  { id: 'colonial', label: 'Colonial', category: 'Arquitetura' },
  { id: 'industrial', label: 'Industrial', category: 'Arquitetura' },
  { id: 'moderno', label: 'Moderno', category: 'Arquitetura' },
  { id: 'neolitico', label: 'Neolítico', category: 'Arquitetura' },
  { id: 'europeu', label: 'Europeu', category: 'Arquitetura' },
  { id: 'nordico', label: 'Nórdico', category: 'Arquitetura' },
  { id: 'neo-classico', label: 'Neo Clássico', category: 'Arquitetura' },
  // Carpintaria & Construção em Madeira
  { id: 'carpintaria-historia', label: 'História da Carpintaria', category: 'Carpintaria' },
  { id: 'carpintaria-wood-framing', label: 'Wood Framing & Timber Framing', category: 'Carpintaria' },
  { id: 'carpintaria-tipos-madeira', label: 'Tipos de Madeira', category: 'Carpintaria' },
  { id: 'carpintaria-isolamento', label: 'Isolamento Térmico', category: 'Carpintaria' },
  { id: 'carpintaria-aquecimento', label: 'Aquecimento & Piso Aquecido', category: 'Carpintaria' },
  { id: 'carpintaria-manutencao', label: 'Manutenção & Conservação', category: 'Carpintaria' },
  { id: 'carpintaria-eficiencia', label: 'Eficiência Energética & Acústica', category: 'Carpintaria' },
  { id: 'carpintaria-tecnicas', label: 'Técnicas Tradicionais vs Modernas', category: 'Carpintaria' },
];

export function useAutoGenerationConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: config, isLoading: isLoadingConfig, refetch: refetchConfig } = useQuery({
    queryKey: ['auto-generation-config'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('auto_generation_config').select('*').maybeSingle();
      if (error) throw error;
      if (!data) {
        const { data: newConfig, error: insertError } = await (supabase as any).from('auto_generation_config').insert({ enabled: false, topics: [], daily_limit: 3, publish_immediately: true }).select().single();
        if (insertError) throw insertError;
        return { ...newConfig, topics: Array.isArray(newConfig.topics) ? newConfig.topics : [] } as AutoGenerationConfig;
      }
      return { ...data, topics: Array.isArray(data.topics) ? data.topics : [] } as AutoGenerationConfig;
    },
  });
  const updateConfigMutation = useMutation({
    mutationFn: async (updates: Partial<AutoGenerationConfig>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any).from('auto_generation_config').update({ ...updates, updated_by: user?.id, updated_at: new Date().toISOString() }).eq('id', config?.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['auto-generation-config'] }); },
    onError: (error) => { toast({ title: 'Erro ao salvar configuração', description: error.message, variant: 'destructive' }); },
  });
  const toggleAutoPilot = async (enabled: boolean) => {
    await updateConfigMutation.mutateAsync({ enabled });
    toast({ title: enabled ? 'Piloto Automático Ativado!' : 'Piloto Automático Pausado' });
  };
  return { config, isLoadingConfig, refetchConfig, updateConfig: updateConfigMutation.mutateAsync, isUpdating: updateConfigMutation.isPending, toggleAutoPilot };
}

export function useAutoGenerationSchedules() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: schedules, isLoading: isLoadingSchedules, refetch: refetchSchedules } = useQuery({
    queryKey: ['auto-generation-schedules'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('auto_generation_schedules').select('*').order('day_of_week').order('time_slot');
      if (error) throw error;
      return data as AutoGenerationSchedule[];
    },
  });
  const addScheduleMutation = useMutation({
    mutationFn: async ({ day_of_week, time_slot }: { day_of_week: number; time_slot: string }) => {
      const { error } = await (supabase as any).from('auto_generation_schedules').insert({ day_of_week, time_slot, is_active: true });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['auto-generation-schedules'] }); toast({ title: 'Horário adicionado!' }); },
    onError: (error) => { toast({ title: 'Erro ao adicionar horário', description: error.message, variant: 'destructive' }); },
  });
  const removeScheduleMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await (supabase as any).from('auto_generation_schedules').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['auto-generation-schedules'] }); toast({ title: 'Horário removido!' }); },
  });
  const toggleScheduleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => { const { error } = await (supabase as any).from('auto_generation_schedules').update({ is_active }).eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['auto-generation-schedules'] }); },
  });
  return { schedules, isLoadingSchedules, refetchSchedules, addSchedule: addScheduleMutation.mutateAsync, removeSchedule: removeScheduleMutation.mutateAsync, toggleSchedule: toggleScheduleMutation.mutateAsync, isAdding: addScheduleMutation.isPending, isRemoving: removeScheduleMutation.isPending };
}

export function useAutoGenerationLogs(pageSize = 10) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const { data, isLoading: isLoadingLogs, refetch: refetchLogs } = useQuery({
    queryKey: ['auto-generation-logs', page, pageSize],
    queryFn: async () => {
      const { count } = await (supabase as any).from('auto_generation_logs').select('*', { count: 'exact', head: true });
      const { data, error } = await (supabase as any).from('auto_generation_logs').select('*').order('executed_at', { ascending: false }).range(page * pageSize, (page + 1) * pageSize - 1);
      if (error) throw error;
      return { logs: data as AutoGenerationLog[], totalCount: count || 0, totalPages: Math.ceil((count || 0) / pageSize) };
    },
  });
  useEffect(() => {
    const channel = supabase.channel('auto-generation-logs-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'auto_generation_logs' }, () => { refetchLogs(); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetchLogs]);
  const clearLogsMutation = useMutation({
    mutationFn: async () => { const { error } = await (supabase as any).from('auto_generation_logs').delete().neq('status', 'running'); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['auto-generation-logs'] }); setPage(0); toast({ title: 'Histórico limpo!' }); },
  });
  const todayCount = data?.logs?.filter((log: AutoGenerationLog) => { const today = new Date().toDateString(); return new Date(log.executed_at).toDateString() === today && log.status === 'success'; }).length || 0;
  return { logs: data?.logs, totalCount: data?.totalCount || 0, totalPages: data?.totalPages || 0, currentPage: page, setPage, isLoadingLogs, refetchLogs, todayCount, clearLogs: clearLogsMutation.mutateAsync, isClearing: clearLogsMutation.isPending };
}

export function useNextExecution(schedules: AutoGenerationSchedule[] | undefined) {
  const [nextExecution, setNextExecution] = useState<Date | null>(null);
  useEffect(() => {
    if (!schedules?.length) { setNextExecution(null); return; }
    const activeSchedules = schedules.filter(s => s.is_active);
    if (!activeSchedules.length) { setNextExecution(null); return; }
    const now = new Date(); const currentDay = now.getDay(); const currentTime = now.toTimeString().slice(0, 5);
    let nearestDate: Date | null = null;
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const checkDay = (currentDay + dayOffset) % 7;
      const daySchedules = activeSchedules.filter(s => s.day_of_week === checkDay).sort((a, b) => a.time_slot.localeCompare(b.time_slot));
      for (const schedule of daySchedules) {
        const scheduleTime = schedule.time_slot.slice(0, 5);
        if (dayOffset === 0 && scheduleTime <= currentTime) continue;
        const targetDate = new Date(now); targetDate.setDate(targetDate.getDate() + dayOffset);
        const [hours, minutes] = scheduleTime.split(':').map(Number); targetDate.setHours(hours, minutes, 0, 0);
        if (!nearestDate || targetDate < nearestDate) nearestDate = targetDate;
        break;
      }
      if (nearestDate) break;
    }
    setNextExecution(nearestDate);
  }, [schedules]);
  return nextExecution;
}
