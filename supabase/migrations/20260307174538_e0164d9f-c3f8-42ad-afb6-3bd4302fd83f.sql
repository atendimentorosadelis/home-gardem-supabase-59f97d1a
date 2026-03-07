-- Enable extensions required for cron-triggered edge function calls
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Ensure only one autopilot scheduler job exists
select cron.unschedule(jobid)
from cron.job
where jobname = 'autopilot-minute-trigger';

-- Trigger AutoPilot edge function every minute.
-- The function itself will decide whether current day/time matches configured schedules.
select cron.schedule(
  'autopilot-minute-trigger',
  '* * * * *',
  $$
  select
    net.http_post(
      url:='https://xfhtixubllcdockbkbwm.supabase.co/functions/v1/auto-generate-article',
      headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmaHRpeHVibGxjZG9ja2JrYndtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MjY4ODAsImV4cCI6MjA4NzMwMjg4MH0.JRQHxGOZ-7L0C2D1m_vRmKHDfvdJaEhF3OuU32QSQFI"}'::jsonb,
      body:='{"source":"pg_cron"}'::jsonb
    ) as request_id;
  $$
);

-- RPC used by dashboard hook to inspect cron runs
create or replace function public.get_cron_job_history()
returns table (
  runid bigint,
  job_pid integer,
  status text,
  return_message text,
  start_time timestamptz,
  end_time timestamptz,
  duration_ms integer
)
language sql
security definer
set search_path = public, extensions
as $$
  select
    jrd.runid,
    jrd.job_pid,
    jrd.status,
    jrd.return_message,
    jrd.start_time,
    jrd.end_time,
    case
      when jrd.end_time is null then null
      else floor(extract(epoch from (jrd.end_time - jrd.start_time)) * 1000)::integer
    end as duration_ms
  from cron.job_run_details jrd
  join cron.job j on j.jobid = jrd.jobid
  where j.jobname = 'autopilot-minute-trigger'
  order by jrd.start_time desc
  limit 100;
$$;

grant execute on function public.get_cron_job_history() to authenticated;