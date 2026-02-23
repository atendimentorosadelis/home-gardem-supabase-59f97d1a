CREATE TABLE public.image_backup_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  total_images integer NOT NULL DEFAULT 0,
  backed_up integer NOT NULL DEFAULT 0,
  failed integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  duration_ms integer NULL
);

ALTER TABLE public.image_backup_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage backup logs" ON public.image_backup_logs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
