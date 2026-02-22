import { useState } from "react";
import { supabase } from "@/lib/supabase";

function generateAnonymousId(): string {
  const stored = localStorage.getItem("anonymous_like_id");
  if (stored) return stored;

  const newId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  localStorage.setItem("anonymous_like_id", newId);
  return newId;
}

export function useArticleLikes() {
  const [isLiking, setIsLiking] = useState<string | null>(null);

  const likeArticle = async (articleId: string): Promise<number | null> => {
    if (isLiking) return null;

    setIsLiking(articleId);

    try {
      const anonymousId = generateAnonymousId();

      const { data, error } = await (supabase as any).rpc("increment_article_likes", {
        p_article_id: articleId,
        p_ip_hash: anonymousId,
      });

      if (error) {
        console.error("Error liking article:", error);
        return null;
      }

      const likedArticles = JSON.parse(localStorage.getItem("liked_articles") || "[]");
      if (!likedArticles.includes(articleId)) {
        likedArticles.push(articleId);
        localStorage.setItem("liked_articles", JSON.stringify(likedArticles));
      }

      return data as number;
    } catch (err) {
      console.error("Error liking article:", err);
      return null;
    } finally {
      setIsLiking(null);
    }
  };

  const hasLiked = (articleId: string): boolean => {
    const likedArticles = JSON.parse(localStorage.getItem("liked_articles") || "[]");
    return likedArticles.includes(articleId);
  };

  return { likeArticle, hasLiked, isLiking };
}
