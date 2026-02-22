import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { ExtendedPost } from "@/data/posts";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, ArrowLeft, Loader2, Eye, Copy, Check, Languages, Heart, Lightbulb, AlertTriangle, Quote as QuoteIcon, Sparkles, Star, ArrowRight as ArrowRightIcon, BookOpen, HelpCircle, ChevronDown, Leaf, Home, Wrench, Flower2, TreePine, Droplets, Sun, Scissors, Palette, Shield, Target, Zap, Award, TrendingUp, Gift, Compass, Layers, Settings, Flame, Wind, Cloud, Sprout, Bug, Thermometer, Ruler, PenTool, Puzzle, FileText, ExternalLink } from "lucide-react";
import { PostCard } from "@/components/home/PostCard";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import NotFound from "./NotFound";
import { ArticleHero } from "@/components/article/ArticleHero";
import { AIImageGallery } from "@/components/article/AIImageGallery";
import { ArticleYouTubeVideo } from "@/components/article/ArticleYouTubeVideo";
import { useArticleImages } from "@/hooks/use-article-images";
import { AnimatedLine } from "@/components/ui/animated-line";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { useArticleViewCount } from "@/hooks/use-article-views";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { formatDate, formatNumber } from "@/utils/formatDate";
import { useTranslatedContent } from "@/hooks/use-translated-content";
import { Button } from "@/components/ui/button";
import { useRegisterAffiliateClick } from "@/hooks/use-affiliate-clicks";
import { useArticleLikes } from "@/hooks/use-article-likes";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { cn } from "@/lib/utils";
import { useConfetti } from "@/hooks/use-confetti";
import { parseCurrencyInText } from "@/utils/currencyParser";
import { FAQAccordion } from "@/components/article/FAQAccordion";

// Affiliate Banner Component
const AffiliateBanner = ({
  articleId,
  desktopImageUrl,
  mobileImageUrl,
  linkUrl
}: {
  articleId: string;
  desktopImageUrl: string;
  mobileImageUrl: string | null;
  linkUrl: string | null;
}) => {
  const { mutate: registerClick } = useRegisterAffiliateClick();
  const handleClick = () => { registerClick(articleId); };

  return (
    <div className="my-8 flex justify-center">
      <a href={linkUrl || '#'} target="_blank" rel="noopener noreferrer sponsored" onClick={handleClick}
        className="block overflow-hidden rounded-xl border border-border/50 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30"
        aria-label="Oferta especial - Clique para saber mais">
        <img src={desktopImageUrl} alt="Oferta especial" className="hidden md:block w-full max-w-[1300px] h-auto object-contain" loading="lazy" />
        <img src={mobileImageUrl || desktopImageUrl} alt="Oferta especial" className="md:hidden w-full max-w-[728px] max-h-[90px] object-cover" loading="lazy" />
      </a>
    </div>
  );
};

// Likes Button Component
const LikesButton = ({
  articleId, initialLikes, likeArticle, hasLiked, isLiking, fireConfetti
}: {
  articleId: string | undefined;
  initialLikes: number;
  likeArticle: (id: string) => Promise<number | null>;
  hasLiked: (id: string) => boolean;
  isLiking: string | null;
  fireConfetti: () => void;
}) => {
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => { if (articleId) setIsLiked(hasLiked(articleId)); }, [articleId, hasLiked]);
  useEffect(() => { setLikesCount(initialLikes); }, [initialLikes]);

  const handleLike = async () => {
    if (isLiked || !articleId) return;
    fireConfetti();
    setLikesCount((prev) => prev + 1);
    setIsLiked(true);
    const newCount = await likeArticle(articleId);
    if (newCount !== null) { setLikesCount(newCount); } else { setLikesCount((prev) => prev - 1); setIsLiked(false); }
  };

  if (!articleId) return null;

  return (
    <button onClick={handleLike} disabled={isLiked || isLiking === articleId}
      className={cn("flex items-center gap-2 transition-all", isLiked ? "cursor-default" : "cursor-pointer hover:text-destructive")}>
      <Heart className={cn("h-4 w-4 transition-all", isLiked ? "text-destructive fill-destructive" : "text-primary")} />
      <span>{likesCount}</span>
    </button>
  );
};

const Article = () => {
  const { t, i18n } = useTranslation();
  const { categorySlug, postId } = useParams<{ categorySlug: string; postId: string }>();
  const [copied, setCopied] = useState(false);
  const { likeArticle, hasLiked, isLiking } = useArticleLikes();
  const { fireConfetti } = useConfetti();

  const getCategoryName = (slug: string): string => {
    const key = `categories.${slug}`;
    const translated = t(key);
    return translated !== key ? translated : t('categories.default');
  };

  // Fetch article from database
  const { data: dbArticle, isLoading: dbLoading } = useQuery({
    queryKey: ['article', categorySlug, postId],
    queryFn: async () => {
      if (!categorySlug || !postId) return null;
      const { data, error } = await supabase
        .from('content_articles')
        .select('*')
        .eq('category_slug', categorySlug)
        .eq('slug', postId)
        .eq('status', 'published')
        .maybeSingle();
      if (error) { console.error('Error fetching article:', error); return null; }
      return data;
    },
    enabled: !!categorySlug && !!postId,
  });

  // Fetch emotional conclusion from current Supabase
  const { data: emotionalConclusionData } = useQuery({
    queryKey: ['emotional-conclusion', dbArticle?.id],
    queryFn: async () => {
      if (!dbArticle?.id) return null;
      try {
        const { data, error } = await (supabase as any)
          .from('article_emotional_conclusions')
          .select('conclusion_text')
          .eq('article_id', dbArticle.id)
          .maybeSingle();
        if (error) return null;
        return data?.conclusion_text || null;
      } catch (err) {
        console.error('[Article] Error fetching emotional conclusion:', err);
        return null;
      }
    },
    enabled: !!dbArticle?.id,
  });

  // Fetch related articles
  const { data: relatedArticles = [] } = useQuery({
    queryKey: ['related-articles', categorySlug, postId],
    queryFn: async () => {
      if (!categorySlug || !postId) return [];
      let { data, error } = await supabase
        .from('content_articles')
        .select('*')
        .eq('category_slug', categorySlug)
        .eq('status', 'published')
        .not('cover_image', 'is', null)
        .neq('slug', postId)
        .order('published_at', { ascending: false })
        .limit(3);
      if (error) return [];
      if (!data || data.length < 3) {
        const existingSlugs = data?.map(a => a.slug) || [];
        const needed = 3 - (data?.length || 0);
        const { data: moreArticles, error: moreError } = await supabase
          .from('content_articles')
          .select('*')
          .eq('status', 'published')
          .not('cover_image', 'is', null)
          .neq('slug', postId)
          .neq('category_slug', categorySlug)
          .order('published_at', { ascending: false })
          .limit(needed);
        if (!moreError && moreArticles) {
          const filteredMore = moreArticles.filter(a => !existingSlugs.includes(a.slug));
          data = [...(data || []), ...filteredMore];
        }
      }
      return data || [];
    },
    enabled: !!categorySlug && !!postId,
  });

  const post: ExtendedPost | null = dbArticle ? {
    id: dbArticle.slug || dbArticle.id,
    title: dbArticle.title,
    excerpt: dbArticle.excerpt || '',
    category: getCategoryName(dbArticle.category_slug || ''),
    categorySlug: dbArticle.category_slug || categorySlug || '',
    image: dbArticle.cover_image || 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800',
    date: formatDate(dbArticle.published_at),
    readTime: dbArticle.read_time || '5 min',
    author: 'Home & Garden',
    tags: dbArticle.tags || [],
    content: dbArticle.body || '',
  } : null;

  const relatedPosts = relatedArticles.map(article => ({
    id: article.slug || article.id,
    uuid: article.id,
    title: article.title,
    excerpt: article.excerpt || '',
    category: getCategoryName(article.category_slug || ''),
    categorySlug: article.category_slug || '',
    image: article.cover_image || '/placeholder.svg',
    date: formatDate(article.published_at),
    readTime: article.read_time || '5 min',
    likesCount: article.likes_count || 0,
    viewsCount: 0,
  }));

  const { data: viewCount = 0 } = useArticleViewCount(postId);

  const { images: generatedImages, isLoading: imagesLoading, error: imagesError, regenerate } = useArticleImages({
    postId: post?.id || '',
    title: post?.title || '',
    category: post?.categorySlug || '',
    tags: post?.tags || [],
    count: 6,
  });

  const {
    translatedTitle, translatedExcerpt, translatedContent,
    isTranslating, isTranslated, showOriginal, toggleOriginal,
  } = useTranslatedContent({
    title: post?.title || '',
    excerpt: post?.excerpt || '',
    content: post?.content || '',
    slug: post?.id || postId || '',
    enabled: i18n.language !== 'pt-BR' && i18n.language !== 'pt',
  });

  const rawContent = translatedContent || post?.content || '';
  const displayContent = useMemo(() => parseCurrencyInText(rawContent), [rawContent, i18n.language]);

  // Register article view
  useEffect(() => {
    if (!post || !dbArticle) return;
    const registerView = async () => {
      try {
        const sessionHash = btoa(navigator.userAgent + new Date().toDateString());
        await supabase.from('article_views').insert({ article_id: dbArticle.id, ip_hash: sessionHash });
      } catch { /* ignore */ }
    };
    registerView();
  }, [post?.id, dbArticle?.id]);

  if (dbLoading) {
    return (<Layout><div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>);
  }

  if (!categorySlug || !postId || !post) {
    return <NotFound />;
  }

  const dbGalleryImages = dbArticle?.gallery_images as string[] | null;
  const hasDbImages = dbGalleryImages && dbGalleryImages.length > 0;
  const galleryImages = hasDbImages ? dbGalleryImages.map(url => ({ url, prompt: '' })) : generatedImages;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedTitle = encodeURIComponent(post.title);
  const encodedImage = encodeURIComponent(post.image);

  const shareUrls = {
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}&media=${encodedImage}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast.success(t('article.linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error(t('article.copyError')); }
  };

  const parseInlineBold = (text: string): React.ReactNode => {
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let keyIndex = 0;
    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push(text.substring(lastIndex, match.index));
      parts.push(<strong key={`bold-${keyIndex++}`} className="font-semibold text-foreground">{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) parts.push(text.substring(lastIndex));
    return parts.length > 0 ? parts : text;
  };

  const parseInlineAll = (text: string): React.ReactNode => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let keyIndex = 0;
    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push(<span key={`text-${keyIndex++}`}>{parseInlineBold(text.substring(lastIndex, match.index))}</span>);
      parts.push(<a key={`link-${keyIndex++}`} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium transition-colors">{match[1]}</a>);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) parts.push(<span key={`text-${keyIndex++}`}>{parseInlineBold(text.substring(lastIndex))}</span>);
    return parts.length > 0 ? parts : parseInlineBold(text);
  };

  const formatContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];
    let listType: 'ul' | 'ol' | null = null;
    let tipContent: string[] = [];
    let inTipBlock = false;
    let warningContent: string[] = [];
    let inWarningBlock = false;
    let quoteContent: string[] = [];
    let inQuoteBlock = false;
    let infoContent: string[] = [];
    let inInfoBlock = false;
    let tableRows: string[][] = [];
    let tableHeaders: string[] = [];
    let inTable = false;
    let introContent: React.ReactNode[] = [];
    let hasSeenFirstH2 = false;
    let currentH2Title: string | null = null;
    let currentH2Content: React.ReactNode[] = [];
    let currentH3Title: string | null = null;
    let currentH3Content: React.ReactNode[] = [];
    let faqItems: { question: string; answer: string[] }[] = [];
    let currentFaqQuestion: string | null = null;
    let currentFaqAnswer: string[] = [];
    let inFaqBlock = false;
    let inFaqSection = false;
    let faqGlobalCounter = 0;
    let h2IconIndex = 0;
    const h2Icons = [
      { icon: Leaf, color: "from-emerald-500 to-green-600" },
      { icon: TreePine, color: "from-green-600 to-emerald-700" },
      { icon: Flower2, color: "from-pink-500 to-rose-600" },
      { icon: Droplets, color: "from-blue-500 to-cyan-600" },
      { icon: Sun, color: "from-amber-500 to-orange-500" },
      { icon: Scissors, color: "from-slate-500 to-zinc-600" },
      { icon: Palette, color: "from-purple-500 to-violet-600" },
      { icon: Shield, color: "from-indigo-500 to-blue-600" },
      { icon: Target, color: "from-red-500 to-rose-600" },
      { icon: Zap, color: "from-yellow-500 to-amber-600" },
      { icon: Award, color: "from-teal-500 to-emerald-600" },
      { icon: TrendingUp, color: "from-green-500 to-lime-600" },
      { icon: Gift, color: "from-fuchsia-500 to-pink-600" },
      { icon: Compass, color: "from-cyan-500 to-teal-600" },
      { icon: Layers, color: "from-orange-500 to-red-500" },
    ];
    const getNextH2Icon = () => { const iconData = h2Icons[h2IconIndex % h2Icons.length]; h2IconIndex++; return iconData; };
    let currentH2IconData: { icon: typeof Leaf; color: string } | null = null;

    const flushH3Card = () => {
      if (currentH3Title && currentH3Content.length > 0) {
        currentH2Content.push(
          <div key={`h3-card-${currentH2Content.length}`} className="mt-4 md:mt-6 rounded-lg md:rounded-xl border border-border/30 bg-muted/20 p-4 md:p-6">
            <div className="flex items-start md:items-center gap-2.5 md:gap-3 mb-3 md:mb-4">
              <span className="flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-md md:rounded-lg bg-primary/15 border border-primary/20 flex-shrink-0 mt-0.5 md:mt-0">
                <ArrowRightIcon className="w-3 h-3 md:w-3.5 md:h-3.5 text-primary" />
              </span>
              <h3 className="text-base md:text-xl font-semibold text-foreground leading-tight">{currentH3Title}</h3>
            </div>
            <div className="space-y-2 md:space-y-3">{currentH3Content}</div>
          </div>
        );
        currentH3Title = null; currentH3Content = [];
      } else if (currentH3Title) {
        currentH2Content.push(
          <div key={`h3-standalone-${currentH2Content.length}`} className="flex items-center gap-3 mt-6 mb-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/15 border border-primary/20"><ArrowRightIcon className="w-3.5 h-3.5 text-primary" /></span>
            <h3 className="text-lg md:text-xl font-semibold text-foreground">{currentH3Title}</h3>
          </div>
        );
        currentH3Title = null; currentH3Content = [];
      }
    };

    const flushH2Card = () => {
      flushH3Card();
      if (currentH2Title && currentH2Content.length > 0) {
        const IconComponent = currentH2IconData?.icon || Leaf;
        const iconGradient = currentH2IconData?.color || "from-primary to-primary/70";
        elements.push(
          <div key={`h2-card-${elements.length}`} className="my-6 md:my-10 relative">
            <div className="absolute -top-4 left-4 md:left-8 right-4 md:right-8 h-px bg-gradient-to-r from-transparent via-border to-transparent hidden md:block" />
            <div className="rounded-xl md:rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-muted/10 p-4 md:p-8 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-16 md:w-24 h-16 md:h-24 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />
              <div className="relative z-10 flex items-start md:items-center gap-3 md:gap-4 mb-4 md:mb-6 pb-4 md:pb-5 border-b border-border/40">
                <div className={`flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br ${iconGradient} shadow-lg flex-shrink-0`}>
                  <IconComponent className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0"><h2 className="text-lg md:text-2xl font-bold text-foreground leading-tight">{currentH2Title}</h2></div>
              </div>
              <div className="relative z-10 space-y-3 md:space-y-4">{currentH2Content}</div>
            </div>
            <div className="absolute -bottom-4 left-4 md:left-8 right-4 md:right-8 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent hidden md:block" />
          </div>
        );
      }
      currentH2Title = null; currentH2Content = []; currentH2IconData = null;
    };

    const flushIntroCard = () => {
      if (introContent.length > 0) {
        elements.push(
          <div key={`intro-card-${elements.length}`} className="my-6 md:my-8 relative">
            <div className="relative overflow-hidden rounded-xl md:rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-muted/20 p-4 md:p-8">
              <div className="absolute top-0 right-0 w-16 md:w-20 h-16 md:h-20 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />
              <div className="absolute left-0 top-4 md:top-6 bottom-4 md:bottom-6 w-1 bg-gradient-to-b from-primary via-primary/60 to-primary/20 rounded-full" />
              <div className="flex items-center gap-2.5 md:gap-3 mb-4 md:mb-5 pl-3 md:pl-4 relative z-10">
                <div className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-md md:rounded-lg bg-primary/15 border border-primary/25"><BookOpen className="w-4 h-4 text-primary" /></div>
                <span className="text-xs md:text-sm font-semibold text-primary uppercase tracking-wider">Introdução</span>
              </div>
              <div className="space-y-3 md:space-y-4 relative z-10 pl-3 md:pl-4">{introContent}</div>
            </div>
          </div>
        );
        introContent = [];
      }
    };

    const flushFaq = () => { if (currentFaqQuestion) { faqItems.push({ question: currentFaqQuestion, answer: [...currentFaqAnswer] }); currentFaqQuestion = null; currentFaqAnswer = []; } };
    let faqBlockCounter = 0;
    const renderFaqBlock = () => {
      if (faqItems.length === 0) return;
      const currentBlockId = faqBlockCounter++;
      const itemsToRender = faqItems.map((item) => ({
        question: item.question,
        answer: item.answer.map((line, lineIdx) => (<p key={lineIdx}>{parseInlineAll(line)}</p>))
      }));
      elements.push(<FAQAccordion key={`faq-block-${currentBlockId}`} items={itemsToRender} />);
      faqItems = [];
    };

    const flushList = () => {
      if (listItems.length > 0 && listType) {
        const listElement = (
          <div key={`list-${elements.length}`} className="my-4 rounded-xl border border-border/30 bg-muted/20 p-4 md:p-6">
            <ul className="space-y-3">
              {listItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 mt-0.5">
                    {listType === 'ul' ? <Check className="w-3.5 h-3.5 text-primary" /> : <span className="text-xs font-bold text-primary">{idx + 1}</span>}
                  </span>
                  <span className="text-foreground/90 leading-relaxed pt-0.5">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );
        if (currentH3Title) currentH3Content.push(listElement);
        else if (currentH2Title) currentH2Content.push(listElement);
        else if (!hasSeenFirstH2) introContent.push(listElement);
        else elements.push(listElement);
        listItems = []; listType = null;
      }
    };

    const flushTip = () => {
      if (tipContent.length > 0) {
        const tipElement = (
          <div key={`tip-${elements.length}`} className="my-6 md:my-8 relative">
            <div className="relative overflow-hidden rounded-lg md:rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-card p-4 md:p-6">
              <div className="absolute left-0 top-3 md:top-4 bottom-3 md:bottom-4 w-1 bg-gradient-to-b from-primary via-primary/70 to-primary/40 rounded-full" />
              <div className="relative z-10 pl-3 md:pl-4">
                <div className="flex items-center gap-2.5 md:gap-3 mb-2.5 md:mb-3">
                  <div className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-md md:rounded-lg bg-primary/15 border border-primary/25"><Lightbulb className="w-4 h-4 text-primary" /></div>
                  <span className="text-sm md:text-base font-semibold text-primary">Dica do Keven</span>
                </div>
                <div className="text-foreground/90 text-sm md:text-base leading-relaxed">{tipContent.map((line, i) => (<p key={i} className="mb-2 last:mb-0">{parseInlineAll(line)}</p>))}</div>
              </div>
            </div>
          </div>
        );
        if (currentH3Title) currentH3Content.push(tipElement);
        else if (currentH2Title) currentH2Content.push(tipElement);
        else elements.push(tipElement);
        tipContent = [];
      }
    };

    const flushWarning = () => {
      if (warningContent.length > 0) {
        const warningElement = (
          <div key={`warning-${elements.length}`} className="my-5 md:my-6 relative">
            <div className="relative overflow-hidden rounded-lg md:rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-card to-card p-4 md:p-6">
              <div className="absolute left-0 top-3 md:top-4 bottom-3 md:bottom-4 w-1 bg-gradient-to-b from-amber-500 via-amber-500/70 to-amber-500/40 rounded-full" />
              <div className="relative z-10 pl-3 md:pl-4">
                <div className="flex items-center gap-2.5 md:gap-3 mb-2.5 md:mb-3">
                  <div className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-md md:rounded-lg bg-amber-500/10 border border-amber-500/20"><AlertTriangle className="w-4 h-4 text-amber-500" /></div>
                  <span className="text-sm md:text-base font-semibold text-amber-500">Atenção</span>
                </div>
                <div className="text-foreground/90 text-sm md:text-base leading-relaxed">{warningContent.map((line, i) => (<p key={i} className="mb-2 last:mb-0">{parseInlineAll(line)}</p>))}</div>
              </div>
            </div>
          </div>
        );
        if (currentH3Title) currentH3Content.push(warningElement);
        else if (currentH2Title) currentH2Content.push(warningElement);
        else elements.push(warningElement);
        warningContent = [];
      }
    };

    const flushQuote = () => {
      if (quoteContent.length > 0) {
        const quoteElement = (
          <div key={`quote-${elements.length}`} className="my-8 relative">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-muted/60 via-card to-card p-6 md:p-8 border border-border/40">
              <div className="absolute top-3 left-4 opacity-10"><QuoteIcon className="w-16 h-16 text-primary" /></div>
              <div className="absolute left-0 top-4 bottom-4 w-1 bg-gradient-to-b from-primary via-primary/60 to-primary/20 rounded-full" />
              <blockquote className="relative z-10 pl-6">
                <p className="text-xl md:text-2xl font-medium text-foreground italic leading-relaxed">
                  "{quoteContent.map((line, i) => (<span key={i}>{parseInlineAll(line)} </span>))}"
                </p>
                <footer className="mt-4 flex items-center gap-3">
                  <div className="w-10 h-0.5 bg-gradient-to-r from-primary to-transparent rounded-full" />
                  <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Reflexão</span>
                </footer>
              </blockquote>
            </div>
          </div>
        );
        if (currentH3Title) currentH3Content.push(quoteElement);
        else if (currentH2Title) currentH2Content.push(quoteElement);
        else elements.push(quoteElement);
        quoteContent = [];
      }
    };

    const flushInfo = () => {
      if (infoContent.length > 0) {
        const infoElement = (
          <div key={`info-${elements.length}`} className="my-5 md:my-6 relative">
            <div className="relative overflow-hidden rounded-lg md:rounded-xl border border-sky-500/20 bg-gradient-to-r from-sky-500/5 via-card to-card p-4 md:p-6">
              <div className="absolute left-0 top-3 md:top-4 bottom-3 md:bottom-4 w-1 bg-gradient-to-b from-sky-500 via-sky-500/70 to-sky-500/40 rounded-full" />
              <div className="relative z-10 pl-3 md:pl-4">
                <div className="flex items-center gap-2.5 md:gap-3 mb-2.5 md:mb-3">
                  <div className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-md md:rounded-lg bg-sky-500/10 border border-sky-500/20"><Sparkles className="w-4 h-4 text-sky-500" /></div>
                  <span className="text-sm md:text-base font-semibold text-sky-500">Você Sabia?</span>
                </div>
                <div className="text-foreground/90 text-sm md:text-base leading-relaxed">{infoContent.map((line, i) => (<p key={i} className="mb-2 last:mb-0">{parseInlineAll(line)}</p>))}</div>
              </div>
            </div>
          </div>
        );
        if (currentH3Title) currentH3Content.push(infoElement);
        else if (currentH2Title) currentH2Content.push(infoElement);
        else elements.push(infoElement);
        infoContent = [];
      }
    };

    const flushTable = () => {
      if (tableHeaders.length > 0 && tableRows.length > 0) {
        const tableElement = (
          <div key={`table-${elements.length}`} className="my-6 md:my-8 overflow-x-auto">
            <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card via-card to-muted/10 overflow-hidden min-w-[600px] md:min-w-0">
              <table className="w-full text-sm md:text-base">
                <thead><tr className="bg-muted/50 border-b border-border/50">{tableHeaders.map((header, idx) => (<th key={idx} className="px-3 md:px-4 py-3 md:py-4 text-left font-semibold text-foreground">{parseInlineAll(header)}</th>))}</tr></thead>
                <tbody>{tableRows.map((row, rowIdx) => (<tr key={rowIdx} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">{row.map((cell, cellIdx) => (<td key={cellIdx} className="px-3 md:px-4 py-3 md:py-4 text-muted-foreground">{parseInlineAll(cell)}</td>))}</tr>))}</tbody>
              </table>
            </div>
          </div>
        );
        if (currentH3Title) currentH3Content.push(tableElement);
        else if (currentH2Title) currentH2Content.push(tableElement);
        else if (!hasSeenFirstH2) introContent.push(tableElement);
        else elements.push(tableElement);
        tableHeaders = []; tableRows = []; inTable = false;
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (trimmedLine.toLowerCase().includes('dica:') || trimmedLine.toLowerCase().includes('💡 dica')) {
        flushList(); flushWarning(); flushQuote(); flushInfo();
        inTipBlock = true;
        const c = trimmedLine.replace(/^(💡\s*)?dica:?\s*/i, '').trim();
        if (c) tipContent.push(c); return;
      }
      if (trimmedLine.toLowerCase().includes('atenção:') || trimmedLine.toLowerCase().includes('⚠️ atenção') || trimmedLine.toLowerCase().includes('cuidado:')) {
        flushList(); flushTip(); flushQuote(); flushInfo();
        inWarningBlock = true;
        const c = trimmedLine.replace(/^(⚠️\s*)?(atenção|cuidado):?\s*/i, '').trim();
        if (c) warningContent.push(c); return;
      }
      if (trimmedLine.toLowerCase().includes('você sabia') || trimmedLine.toLowerCase().includes('✨ você sabia') || trimmedLine.toLowerCase().includes('curiosidade:')) {
        flushList(); flushTip(); flushWarning(); flushQuote();
        inInfoBlock = true;
        const c = trimmedLine.replace(/^(✨\s*)?(você sabia\??|curiosidade):?\s*/i, '').trim();
        if (c) infoContent.push(c); return;
      }
      if (trimmedLine.startsWith('>') || (trimmedLine.startsWith('"') && trimmedLine.endsWith('"'))) {
        flushList(); flushTip(); flushWarning(); flushInfo();
        const c = trimmedLine.replace(/^>\s*/, '').replace(/^"|"$/g, '').trim();
        if (c) { inQuoteBlock = true; quoteContent.push(c); } return;
      }

      if (inTipBlock && trimmedLine !== '' && !line.startsWith('#')) { tipContent.push(trimmedLine); return; }
      else if (inTipBlock && (trimmedLine === '' || line.startsWith('#'))) { flushTip(); inTipBlock = false; }
      if (inWarningBlock && trimmedLine !== '' && !line.startsWith('#')) { warningContent.push(trimmedLine); return; }
      else if (inWarningBlock && (trimmedLine === '' || line.startsWith('#'))) { flushWarning(); inWarningBlock = false; }
      if (inQuoteBlock && trimmedLine !== '' && !line.startsWith('#')) { quoteContent.push(trimmedLine); return; }
      else if (inQuoteBlock && (trimmedLine === '' || line.startsWith('#'))) { flushQuote(); inQuoteBlock = false; }
      if (inInfoBlock && trimmedLine !== '' && !line.startsWith('#')) { infoContent.push(trimmedLine); return; }
      else if (inInfoBlock && (trimmedLine === '' || line.startsWith('#'))) { flushInfo(); inInfoBlock = false; }

      if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
        const cells = trimmedLine.slice(1, -1).split('|').map(cell => cell.trim());
        const isSeparator = cells.every(cell => /^[-:\s]+$/.test(cell));
        if (isSeparator) { inTable = true; return; }
        if (!inTable && tableHeaders.length === 0) { tableHeaders = cells; return; }
        if (inTable) { tableRows.push(cells); return; }
      } else if (inTable) { flushTable(); }

      if (line.startsWith('### ')) {
        flushList(); flushTable(); flushTip(); flushWarning(); flushQuote(); flushInfo();
        flushH3Card();
        currentH3Title = line.replace('### ', '');
        return;
      }

      if (line.startsWith('## ')) {
        flushList(); flushTable(); flushTip(); flushWarning(); flushQuote(); flushInfo();
        if (inFaqBlock || inFaqSection) { flushFaq(); renderFaqBlock(); inFaqBlock = false; inFaqSection = false; }
        if (!hasSeenFirstH2) { flushIntroCard(); hasSeenFirstH2 = true; }
        flushH2Card();
        const h2Title = line.replace('## ', '');
        if (/FAQ|Perguntas\s+Frequentes/i.test(h2Title)) {
          inFaqSection = true;
          currentH2IconData = getNextH2Icon();
        } else {
          currentH2IconData = getNextH2Icon();
          currentH2Title = h2Title;
        }
        return;
      }

      if (line.startsWith('**') && line.endsWith('**') && line.indexOf('**', 2) === line.length - 2) {
        flushList();
        elements.push(<p key={index} className="font-semibold text-foreground text-lg mt-6 mb-3">{line.replace(/\*\*/g, '')}</p>);
        return;
      }

      if (line.startsWith('- ')) {
        if (listType !== 'ul') { flushList(); listType = 'ul'; }
        listItems.push(<span key={index}>{parseInlineAll(line.replace('- ', ''))}</span>);
        return;
      }

      const isNumberedBoldFaq = /^\d+\.\s+\*\*.*\?\*\*$/.test(trimmedLine);
      const isSimpleFaq = inFaqSection && trimmedLine.endsWith('?') && !trimmedLine.startsWith('-') && !trimmedLine.startsWith('#') && trimmedLine.length > 10 && trimmedLine.length < 200;
      const isFaqQuestion = isNumberedBoldFaq || isSimpleFaq;

      if (isFaqQuestion) {
        flushList(); flushTip(); flushWarning(); flushQuote(); flushInfo(); flushFaq();
        inFaqBlock = true;
        currentFaqQuestion = trimmedLine.replace(/^\d+\.\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
        return;
      }

      if (inFaqBlock) {
        const isNext = /^\d+\.\s+\*\*.*\?\*\*$/.test(trimmedLine) || (inFaqSection && trimmedLine.endsWith('?') && !trimmedLine.startsWith('-') && !trimmedLine.startsWith('#') && trimmedLine.length > 10 && trimmedLine.length < 200);
        if (isNext) { flushFaq(); currentFaqQuestion = trimmedLine.replace(/^\d+\.\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, ''); return; }
        else if (line.startsWith('#')) { flushFaq(); renderFaqBlock(); inFaqBlock = false; inFaqSection = false; }
        else if (trimmedLine !== '') {
          const isUnwantedFooter = /ainda tem d[uú]vidas\?|deixa sua pergunta/i.test(trimmedLine);
          if (!isUnwantedFooter) currentFaqAnswer.push(trimmedLine);
          return;
        } else { return; }
      }

      if (/^\d+\.\s/.test(line) && !inFaqBlock) {
        if (listType !== 'ol') { flushList(); listType = 'ol'; }
        listItems.push(<span key={index}>{parseInlineAll(line.replace(/^\d+\.\s/, ''))}</span>);
        return;
      }

      if (line.trim() !== '' && !inFaqBlock) {
        flushList();
        const paragraph = (<p key={index} className="text-muted-foreground text-lg leading-relaxed">{parseInlineAll(line)}</p>);
        if (currentH3Title) currentH3Content.push(paragraph);
        else if (currentH2Title) currentH2Content.push(paragraph);
        else if (!hasSeenFirstH2) introContent.push(paragraph);
        else elements.push(<p key={index} className="text-muted-foreground text-lg leading-relaxed mb-6">{parseInlineAll(line)}</p>);
      }
    });

    flushList(); flushTable(); flushTip(); flushWarning(); flushQuote(); flushInfo(); flushFaq(); renderFaqBlock(); flushH2Card(); flushIntroCard();
    return elements;
  };

  const splitContentForGallery = (content: string): { firstPart: string; secondPart: string } => {
    const lines = content.split('\n');
    const h2Indices: number[] = [];
    lines.forEach((line, idx) => { if (line.trim().startsWith('## ')) h2Indices.push(idx); });
    let splitIndex = Math.floor(lines.length / 3);
    if (h2Indices.length >= 3) splitIndex = h2Indices[2];
    else if (h2Indices.length >= 2) splitIndex = h2Indices[1];
    else if (h2Indices.length === 1) {
      const afterH2 = h2Indices[0] + 1;
      const nextEmptyIdx = lines.findIndex((line, idx) => idx > afterH2 + 5 && line.trim() === '');
      splitIndex = nextEmptyIdx > 0 ? nextEmptyIdx : Math.floor(lines.length / 2);
    }
    return { firstPart: lines.slice(0, splitIndex).join('\n'), secondPart: lines.slice(splitIndex).join('\n') };
  };

  const replaceEmotionalConclusion = (content: string, newConclusion: string | null): string => {
    if (!newConclusion) return content;
    const lines = content.split('\n');
    const processedLines: string[] = [];
    let foundConclusionBlock = false;
    let skipUntilNextSection = false;
    let insertedConclusion = false;

    const conclusionStartPatterns = [
      /^existe algo de mágico quando/i, /^poucos momentos na vida são tão/i, /^houve um tempo em que/i,
      /^nas entrelinhas do cotidiano/i, /^o silêncio de um lar revela/i, /^entre as paredes do que chamamos casa/i,
      /^a verdade sobre transformar um espaço é/i, /^quando olho para um ambiente que ganha vida/i,
      /^algo desperta em nós quando/i, /^o tempo ensinou que/i, /^debaixo de cada decisão de decorar há/i,
      /^certas escolhas carregam mais do que/i, /^na delicadeza dos detalhes mora/i,
      /^existe uma poesia silenciosa em/i, /^o que realmente transforma um espaço não é/i,
      /^por trás de cada ambiente há/i, /^a beleza das pequenas mudanças está em/i,
      /^alguns cantos de uma casa guardam/i, /^quando a luz atravessa um cômodo renovado/i,
      /^o segredo que poucos percebem é/i, /^cada escolha de design carrega/i,
      /^na jornada de criar um lar/i, /^o que torna um espaço especial é/i,
      /^às vezes,? um simples arranjo revela/i, /^a magia acontece quando entendemos que/i,
      /^entre cores e texturas existe/i, /^o verdadeiro significado de um lar vem de/i,
      /^quando nos permitimos sonhar com/i, /^a essência de um ambiente acolhedor está em/i,
      /^por trás de cada reforma bem-sucedida há/i, /^o que realmente importa ao criar/i,
      /^nas escolhas que fazemos para nosso lar/i, /^a transformação mais profunda acontece quando/i,
      /^o que muitos não percebem sobre decoração é/i, /^entre o sonho e a realidade de um ambiente/i,
      /^a verdadeira beleza de um espaço revela-se em/i, /^quando dedicamos atenção ao nosso lar/i,
      /^o encanto de um ambiente bem planejado é/i, /^nas sutilezas de cada detalhe decorativo/i,
      /^a arte de criar um espaço acolhedor começa quando/i, /^há uma sabedoria antiga em/i,
      /^o coração de uma casa pulsa quando/i, /^cada parede conta uma história sobre/i,
      /^a harmonia de um ambiente nasce de/i, /^existe uma conexão profunda entre/i,
      /^o lar se transforma em refúgio quando/i, /^a verdadeira elegância de um espaço vem de/i,
      /^quando permitimos que a luz dance pelos ambientes/i, /^a alma de uma decoração está em/i,
      /^o que diferencia um espaço comum de um extraordinário é/i,
      /^eu sei que/i, /^pode parecer/i, /^posso te dizer/i, /^olha,? eu/i, /^confesso que/i,
      /^a verdade é/i, /^ao mergulhar/i, /^durante meus estudos/i, /^foi somente durante/i,
      /^espero que essas dicas te ajudem/i, /^espero que este conteúdo/i, /^agora vamos às perguntas/i,
    ];

    const isConclusionStart = (text: string): boolean => {
      const trimmed = text.trim();
      if (trimmed.startsWith('#') || trimmed.length < 30) return false;
      return conclusionStartPatterns.some(pattern => pattern.test(trimmed));
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      const isNewH2 = trimmedLine.startsWith('## ');
      const isFaqSection = isNewH2 && /perguntas?\s*frequentes?|faq/i.test(trimmedLine);

      if (skipUntilNextSection) {
        if (isNewH2) {
          skipUntilNextSection = false;
          if (isFaqSection && !insertedConclusion) {
            processedLines.push('');
            processedLines.push(newConclusion);
            processedLines.push('');
            insertedConclusion = true;
          }
          processedLines.push(line);
          continue;
        }
        continue;
      }

      if (isConclusionStart(trimmedLine) && !foundConclusionBlock) {
        processedLines.push(newConclusion);
        foundConclusionBlock = true;
        insertedConclusion = true;
        skipUntilNextSection = true;
        continue;
      }

      processedLines.push(line);
    }

    if (!insertedConclusion && newConclusion) {
      processedLines.push('');
      processedLines.push(newConclusion);
    }

    return processedLines.join('\n');
  };

  const contentWithConclusion = replaceEmotionalConclusion(displayContent, emotionalConclusionData);
  const { firstPart, secondPart } = splitContentForGallery(contentWithConclusion);
  const displayTitle = translatedTitle || post.title;

  return (
    <Layout>
      <article className="min-h-screen">
        <ArticleHero image={post.image} title={post.title} />

        <div className="container mx-auto px-4 mt-[30px] relative z-10">
          <div className="max-w-4xl mx-auto">
            <AnimatedLine delay={0}>
              <Breadcrumb className="mb-8">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild><Link to="/" className="text-muted-foreground hover:text-primary transition-colors">{t('nav.home')}</Link></BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild><Link to={`/${post.categorySlug}`} className="text-muted-foreground hover:text-primary transition-colors">{post.category}</Link></BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem><BreadcrumbPage className="text-foreground line-clamp-1">{post.title}</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </AnimatedLine>

            <header className="mb-8 md:mb-12">
              <AnimatedLine delay={100}>
                <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-4 md:mb-6">
                  <Badge variant="default" className="bg-primary text-primary-foreground px-3 md:px-4 py-1 md:py-1.5 text-xs md:text-sm font-medium">{post.category}</Badge>
                  <span className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground"><Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />{post.date}</span>
                </div>
              </AnimatedLine>

              <AnimatedLine delay={200}>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4 mb-6 md:mb-8">
                  <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.15] md:leading-[1.1] tracking-tight flex-1">
                    {isTranslating ? (<span className="flex items-center gap-2 md:gap-3"><Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary flex-shrink-0" />{post.title}</span>) : displayTitle}
                  </h1>
                  {(isTranslated || isTranslating) && (
                    <div className="flex flex-row md:flex-col items-center md:items-end gap-2 flex-shrink-0">
                      <Badge variant="outline" className="gap-1.5 text-xs"><Languages className="h-3 w-3" />{isTranslating ? t('article.translating') : t('article.translated')}</Badge>
                      {isTranslated && (<Button variant="ghost" size="sm" onClick={toggleOriginal} className="text-xs h-7 px-2">{showOriginal ? t('article.showTranslation') : t('article.showOriginal')}</Button>)}
                    </div>
                  )}
                </div>
              </AnimatedLine>

              <AnimatedLine delay={300}>
                <div className="flex flex-wrap items-center gap-3 md:gap-6 text-xs md:text-sm text-muted-foreground pb-6 md:pb-8 border-b border-border">
                  <span className="flex items-center gap-1.5 md:gap-2"><Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />{post.readTime} {t('article.readingTime')}</span>
                  <span className="flex items-center gap-1.5 md:gap-2"><Eye className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />{formatNumber(viewCount)} {t('article.views')}</span>
                  <LikesButton articleId={dbArticle?.id} initialLikes={dbArticle?.likes_count || 0} likeArticle={likeArticle} hasLiked={hasLiked} isLiking={isLiking} fireConfetti={fireConfetti} />
                  <span className="flex items-center gap-1.5 md:gap-2"><User className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />{t('article.by')} <span className="text-foreground font-medium">{post.author}</span></span>
                </div>
              </AnimatedLine>

              <AnimatedLine delay={400}>
                <div className="flex items-center gap-3 md:gap-4 pt-4 md:pt-6">
                  <span className="text-xs md:text-sm text-muted-foreground">{t('article.share')}</span>
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <a href={shareUrls.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-colors" title={t('article.shareWhatsApp')}>
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </a>
                    <a href={shareUrls.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-foreground/10 hover:bg-foreground/20 transition-colors" title={t('article.shareTwitter')}>
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-foreground" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                    <a href={shareUrls.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#1877F2]/10 hover:bg-[#1877F2]/20 transition-colors" title={t('article.shareFacebook')}>
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                    <a href={shareUrls.pinterest} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#E60023]/10 hover:bg-[#E60023]/20 transition-colors" title={t('article.savePinterest')}>
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-[#E60023]" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/></svg>
                    </a>
                    <button onClick={copyToClipboard} className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors" title={t('article.copyLink')}>
                      {copied ? <Check className="w-4 h-4 md:w-5 md:h-5 text-primary" /> : <Copy className="w-4 h-4 md:w-5 md:h-5 text-primary" />}
                    </button>
                  </div>
                </div>
              </AnimatedLine>
            </header>

            <div className="prose prose-lg prose-invert max-w-none">{formatContent(firstPart)}</div>

            <AIImageGallery images={galleryImages} isLoading={!hasDbImages && imagesLoading} error={imagesError} onRegenerate={regenerate} count={6} />

            <div className="prose prose-lg prose-invert max-w-none mb-12">{formatContent(secondPart)}</div>

            <div className="flex flex-wrap gap-2 mb-8 pt-8 border-t border-border">
              {post.tags.map((tag) => (<Badge key={tag} variant="outline" className="text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors cursor-pointer">#{tag}</Badge>))}
            </div>

            <div className="my-10 pt-8 border-t border-border/50">
              <p className="text-muted-foreground text-base mb-3">Espero que esse conteúdo tenha sido útil pra você! Se tiver dúvidas, deixe nos comentários.</p>
              <p className="text-lg font-semibold text-foreground">Keven Costa Vieira</p>
              <p className="text-sm text-muted-foreground">Estudante de Arquitetura • PUC Minas</p>
            </div>

            <ArticleYouTubeVideo articleId={dbArticle?.id} />

            {dbArticle?.affiliate_banner_enabled && dbArticle?.affiliate_banner_image && (
              <AffiliateBanner articleId={dbArticle.id} desktopImageUrl={dbArticle.affiliate_banner_image} mobileImageUrl={(dbArticle as any).affiliate_banner_image_mobile} linkUrl={(dbArticle as any).affiliate_banner_url} />
            )}

            <Link to="/" className="group inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-16">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />{t('article.backToHome')}
            </Link>
          </div>
        </div>

        {relatedPosts.length > 0 && (
          <section className="relative py-20 overflow-hidden">
            <div className="absolute inset-0 bg-muted/30" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
            <div className="container mx-auto px-4 relative z-10">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t('article.relatedArticles')}</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">{t('article.relatedDescription')} {post.category.toLowerCase()}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {relatedPosts.map((relatedPost) => (<PostCard key={relatedPost.id} post={relatedPost} />))}
              </div>
            </div>
          </section>
        )}
      </article>
    </Layout>
  );
};

export default Article;
