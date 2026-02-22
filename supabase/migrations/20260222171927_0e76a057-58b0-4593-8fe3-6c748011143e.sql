INSERT INTO email_templates (name, subject, body, html_template, description, category, is_default, is_active, template_type)
VALUES
(
  'Clássico Verde',
  'Re: Contato',
  'Resposta de contato',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f0f4f0;font-family:Georgia,serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f0;padding:40px 20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);"><tr><td style="background:linear-gradient(135deg,#2d5016,#4a7c28);padding:30px;text-align:center;"><img src="{{logo_url}}" alt="{{site_name}}" width="180" style="display:block;margin:0 auto 10px;" /><p style="color:rgba(255,255,255,0.8);margin:0;font-size:14px;">Seu guia completo de jardinagem</p></td></tr><tr><td style="padding:40px 30px;"><h2 style="color:#2d5016;margin:0 0 20px;font-size:22px;">Olá, {{name}}!</h2><div style="color:#444;font-size:15px;line-height:1.8;">{{content}}</div><div style="margin:25px 0;padding:15px 20px;background:#f8faf5;border-left:4px solid #4a7c28;border-radius:0 8px 8px 0;"><p style="margin:0 0 5px;font-weight:bold;color:#2d5016;font-size:13px;">Sua mensagem original:</p><p style="margin:0;color:#666;font-size:14px;font-style:italic;">{{original_message}}</p></div></td></tr><tr><td style="background:#2d5016;padding:25px;text-align:center;"><div style="margin-bottom:15px;">{{social_icons}}</div><p style="color:rgba(255,255,255,0.7);margin:0;font-size:12px;">© {{year}} {{site_name}}</p><p style="margin:8px 0 0;"><a href="{{unsubscribe_url}}" style="color:rgba(255,255,255,0.5);font-size:11px;">Cancelar inscrição</a></p></td></tr></table></td></tr></table></body></html>',
  'Template clássico com tons de verde e estilo elegante',
  'contact_reply',
  true,
  true,
  'contact_reply'
),
(
  'Moderno Minimalista',
  'Re: Contato',
  'Resposta de contato',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Helvetica,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);"><tr><td style="background:#fafafa;padding:25px;text-align:center;border-bottom:1px solid #eee;"><img src="{{logo_url}}" alt="{{site_name}}" width="160" style="display:block;margin:0 auto;" /></td></tr><tr><td style="padding:40px 30px;"><h2 style="color:#333;margin:0 0 20px;font-size:20px;font-weight:600;">Olá, {{name}}</h2><div style="color:#555;font-size:15px;line-height:1.8;">{{content}}</div><div style="margin:25px 0;padding:15px;background:#fafafa;border-radius:8px;border:1px solid #eee;"><p style="margin:0 0 5px;font-weight:600;color:#333;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Mensagem original</p><p style="margin:0;color:#777;font-size:14px;">{{original_message}}</p></div></td></tr><tr><td style="background:#333;padding:25px;text-align:center;"><div style="margin-bottom:15px;">{{social_icons}}</div><p style="color:rgba(255,255,255,0.5);margin:0;font-size:12px;">© {{year}} {{site_name}}</p></td></tr></table></td></tr></table></body></html>',
  'Design limpo e minimalista com fundo branco',
  'contact_reply',
  false,
  true,
  'contact_reply'
),
(
  'Natureza Vibrante',
  'Re: Contato',
  'Resposta de contato',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#1a1a2e;font-family:Helvetica,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a2e;padding:40px 20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#16213e;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.3);"><tr><td style="background:linear-gradient(135deg,#84cc16,#22c55e);padding:30px;text-align:center;"><img src="{{logo_url}}" alt="{{site_name}}" width="180" style="display:block;margin:0 auto 10px;" /><p style="color:rgba(255,255,255,0.9);margin:0;font-size:14px;">🌿 Natureza e Jardim</p></td></tr><tr><td style="padding:40px 30px;"><h2 style="color:#84cc16;margin:0 0 20px;font-size:22px;">Olá, {{name}}! 🌱</h2><div style="color:#cbd5e1;font-size:15px;line-height:1.8;">{{content}}</div><div style="margin:25px 0;padding:15px 20px;background:rgba(132,204,22,0.1);border-left:4px solid #84cc16;border-radius:0 8px 8px 0;"><p style="margin:0 0 5px;font-weight:bold;color:#84cc16;font-size:13px;">💬 Sua mensagem:</p><p style="margin:0;color:#94a3b8;font-size:14px;font-style:italic;">{{original_message}}</p></div></td></tr><tr><td style="background:linear-gradient(135deg,#22c55e,#84cc16);padding:25px;text-align:center;"><div style="margin-bottom:15px;">{{social_icons}}</div><p style="color:rgba(255,255,255,0.7);margin:0;font-size:12px;">© {{year}} {{site_name}}</p></td></tr></table></td></tr></table></body></html>',
  'Cores vibrantes da natureza com fundo escuro',
  'contact_reply',
  false,
  true,
  'contact_reply'
),
(
  'Elegante Escuro',
  'Re: Contato',
  'Resposta de contato',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#111;font-family:Georgia,serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#111;padding:40px 20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:12px;overflow:hidden;border:1px solid #333;"><tr><td style="background:linear-gradient(135deg,#374151,#111827);padding:30px;text-align:center;"><img src="{{logo_url}}" alt="{{site_name}}" width="180" style="display:block;margin:0 auto 10px;" /><p style="color:rgba(255,255,255,0.6);margin:0;font-size:14px;">Elegância e Sofisticação</p></td></tr><tr><td style="padding:40px 30px;"><h2 style="color:#e5e7eb;margin:0 0 20px;font-size:22px;">Olá, {{name}}</h2><div style="color:#9ca3af;font-size:15px;line-height:1.8;">{{content}}</div><div style="margin:25px 0;padding:15px 20px;background:rgba(255,255,255,0.05);border-left:4px solid #6b7280;border-radius:0 8px 8px 0;"><p style="margin:0 0 5px;font-weight:bold;color:#d1d5db;font-size:13px;">Sua mensagem original:</p><p style="margin:0;color:#6b7280;font-size:14px;font-style:italic;">{{original_message}}</p></div></td></tr><tr><td style="background:#111827;padding:25px;text-align:center;"><div style="margin-bottom:15px;">{{social_icons}}</div><p style="color:rgba(255,255,255,0.4);margin:0;font-size:12px;">© {{year}} {{site_name}}</p></td></tr></table></td></tr></table></body></html>',
  'Template profissional com tema escuro elegante',
  'contact_reply',
  false,
  true,
  'contact_reply'
),
(
  'Jardim Floral',
  'Re: Contato',
  'Resposta de contato',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#fff7ed;font-family:Georgia,serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff7ed;padding:40px 20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);"><tr><td style="background:linear-gradient(135deg,#f59e0b,#ea580c);padding:30px;text-align:center;"><img src="{{logo_url}}" alt="{{site_name}}" width="180" style="display:block;margin:0 auto 10px;" /><p style="color:rgba(255,255,255,0.9);margin:0;font-size:14px;">🌻 Jardim e Flores</p></td></tr><tr><td style="padding:40px 30px;"><h2 style="color:#92400e;margin:0 0 20px;font-size:22px;">Olá, {{name}}! 🌸</h2><div style="color:#78350f;font-size:15px;line-height:1.8;">{{content}}</div><div style="margin:25px 0;padding:15px 20px;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;"><p style="margin:0 0 5px;font-weight:bold;color:#92400e;font-size:13px;">🌼 Sua mensagem:</p><p style="margin:0;color:#a16207;font-size:14px;font-style:italic;">{{original_message}}</p></div></td></tr><tr><td style="background:linear-gradient(135deg,#ea580c,#f59e0b);padding:25px;text-align:center;"><div style="margin-bottom:15px;">{{social_icons}}</div><p style="color:rgba(255,255,255,0.7);margin:0;font-size:12px;">© {{year}} {{site_name}}</p></td></tr></table></td></tr></table></body></html>',
  'Template quente com tons de âmbar e laranja floral',
  'contact_reply',
  false,
  true,
  'contact_reply'
),
(
  'Aurora Botânica',
  'Re: Contato',
  'Resposta de contato',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#0f172a;font-family:Helvetica,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.4);"><tr><td style="background:linear-gradient(135deg,#6366f1,#14b8a6,#22c55e);padding:30px;text-align:center;"><img src="{{logo_url}}" alt="{{site_name}}" width="180" style="display:block;margin:0 auto 10px;" /><p style="color:rgba(255,255,255,0.9);margin:0;font-size:14px;">✨ Aurora Botânica</p></td></tr><tr><td style="padding:40px 30px;"><h2 style="background:linear-gradient(135deg,#6366f1,#14b8a6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0 0 20px;font-size:24px;">Olá, {{name}}! 🌿</h2><div style="color:#cbd5e1;font-size:15px;line-height:1.8;">{{content}}</div><div style="margin:25px 0;padding:15px 20px;background:rgba(99,102,241,0.1);border-left:4px solid #6366f1;border-radius:0 8px 8px 0;"><p style="margin:0 0 5px;font-weight:bold;color:#818cf8;font-size:13px;">💬 Sua mensagem:</p><p style="margin:0;color:#94a3b8;font-size:14px;font-style:italic;">{{original_message}}</p></div></td></tr><tr><td style="background:linear-gradient(135deg,#6366f1,#14b8a6,#22c55e);padding:25px;text-align:center;"><div style="margin-bottom:15px;">{{social_icons}}</div><p style="color:rgba(255,255,255,0.7);margin:0;font-size:12px;">© {{year}} {{site_name}}</p></td></tr></table></td></tr></table></body></html>',
  'Template com gradiente aurora boreal e estilo botânico',
  'contact_reply',
  false,
  true,
  'contact_reply'
);