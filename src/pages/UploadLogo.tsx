import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function UploadLogo() {
  const [status, setStatus] = useState('Uploading logo...');

  useEffect(() => {
    const upload = async () => {
      try {
        const res = await fetch('/logo-email.png');
        if (!res.ok) { setStatus('Failed to fetch logo'); return; }
        const blob = await res.blob();
        setStatus(`Fetched logo: ${blob.size} bytes, type: ${blob.type}`);
        
        const { data, error } = await supabase.storage
          .from('site-assets')
          .upload('logo-email.png', blob, { contentType: 'image/png', upsert: true });
        
        if (error) { setStatus(`Upload error: ${error.message}`); return; }
        
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/site-assets/logo-email.png`;
        setStatus(`SUCCESS! Logo uploaded to: ${publicUrl}`);
      } catch (e: any) { setStatus(`Error: ${e.message}`); }
    };
    upload();
  }, []);

  return <div style={{padding: 40, fontSize: 18}}><p id="upload-status">{status}</p></div>;
}
