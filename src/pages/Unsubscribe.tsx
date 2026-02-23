import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-email">("loading");

  useEffect(() => {
    if (!email) {
      setStatus("no-email");
      return;
    }

    const unsubscribe = async () => {
      try {
        const { error } = await supabase
          .from("newsletter_subscribers")
          .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
          .eq("email", email);

        if (error) throw error;
        setStatus("success");
      } catch (err) {
        console.error("Unsubscribe error:", err);
        setStatus("error");
      }
    };

    unsubscribe();
  }, [email]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {status === "loading" && (
          <p className="text-muted-foreground text-lg">Processando...</p>
        )}

        {status === "success" && (
          <>
            <h1 className="text-2xl font-bold text-foreground">Inscrição cancelada</h1>
            <p className="text-muted-foreground">
              O e-mail <strong>{email}</strong> foi removido da nossa newsletter. Sentiremos sua falta! 🌱
            </p>
            <Link
              to="/"
              className="inline-block mt-4 px-6 py-2 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
            >
              Voltar ao site
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-2xl font-bold text-foreground">Erro ao cancelar</h1>
            <p className="text-muted-foreground">
              Não foi possível cancelar sua inscrição. Tente novamente mais tarde.
            </p>
            <Link
              to="/"
              className="inline-block mt-4 px-6 py-2 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
            >
              Voltar ao site
            </Link>
          </>
        )}

        {status === "no-email" && (
          <>
            <h1 className="text-2xl font-bold text-foreground">Link inválido</h1>
            <p className="text-muted-foreground">
              Este link de cancelamento não contém um e-mail válido.
            </p>
            <Link
              to="/"
              className="inline-block mt-4 px-6 py-2 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
            >
              Voltar ao site
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
