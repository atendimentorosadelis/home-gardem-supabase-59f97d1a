import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface CronJobExecution {
  runid: number; job_pid: number; status: string; return_message: string | null;
  start_time: string; end_time: string | null; duration_ms: number | null;
}

export function useCronJobHistory() {
  return useQuery({
    queryKey: ['cron-job-history'],
    queryFn: async (): Promise<CronJobExecution[]> => {
      const { data, error } = await (supabase as any).rpc('get_cron_job_history');
      if (error) { console.error('Error fetching cron history:', error); return []; }
      return (data as CronJobExecution[]) || [];
    },
    refetchInterval: 30000,
  });
}
