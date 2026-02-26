import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { invokeEdgeFunction } from '@/lib/edge-functions';
import { ArrowLeft, Loader2, Save, X, Plus, Eye, Globe, FileText, Upload, ImageIcon, Trash2, RefreshCw, ExternalLink, Link2, MousePointer, TrendingUp, Palette, Home, Flower2, Building2, Leaf, Hammer, Recycle, Sofa, Sparkles, Lightbulb, PartyPopper, Heart, LucideIcon, Pencil, Copy, Check, Facebook, Image, Download, Share2 } from 'lucide-react';
import { ImageQueueStatus } from '@/components/dashboard/ImageQueueStatus';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { useAffiliateClickStats } from '@/hooks/use-affiliate-clicks';
import { useEmotionalConclusion } from '@/hooks/use-emotional-conclusion';
import { resizeImage, getImageDimensions } from '@/utils/imageUtils';
import { useSendNewsletter } from '@/hooks/use-send-newsletter';
import { TitleExcerptSuggestionButton } from '@/components/dashboard/TitleExcerptSuggestions';

const BANNER_DIMENSIONS = {
  desktop: { width: 1300, height: 250 },
  mobile: { width: 728, height: 90 }
};

const CATEGORIES: { name: string; slug: string; icon: LucideIcon }[] = [
  // Design Interno
  { name: 'Sala', slug: 'sala', icon: Sofa },
  { name: 'Sala de Jantar', slug: 'sala-de-jantar', icon: Home },
  { name: 'Lareira', slug: 'lareira', icon: Home },
  { name: 'Área Gourmet', slug: 'area-gourmet', icon: Home },
  { name: 'Quarto', slug: 'quarto', icon: Home },
  { name: 'Banheiro', slug: 'banheiro', icon: Home },
  { name: 'Escritório', slug: 'escritorio', icon: Home },
  { name: 'Cozinha', slug: 'cozinha', icon: Home },
  { name: 'Varanda', slug: 'varanda', icon: Home },
  { name: 'Área de Serviço', slug: 'area-de-servico', icon: Home },
  { name: 'Piscina', slug: 'piscina', icon: Home },
  // Jardim
  { name: 'Jardim', slug: 'jardim', icon: Flower2 },
  { name: 'Decoração de Jardim', slug: 'decoracao-jardim', icon: Flower2 },
  { name: 'Cuidados com Plantação', slug: 'cuidados-plantacao', icon: Leaf },
  { name: 'Jardim Vertical', slug: 'jardim-vertical', icon: Leaf },
  { name: 'Suculentas e Cactos', slug: 'suculentas-cactos', icon: Leaf },
  { name: 'Horta de Ervas', slug: 'horta-de-ervas', icon: Leaf },
  { name: 'Flores Ornamentais', slug: 'flores-ornamentais', icon: Flower2 },
  { name: 'Paisagismo', slug: 'paisagismo', icon: Flower2 },
  { name: 'Hidroponia', slug: 'hidroponia', icon: Leaf },
  { name: 'Jardim Sustentável', slug: 'jardim-sustentavel', icon: Recycle },
  { name: 'Decoração de Halloween', slug: 'decoracao-halloween', icon: PartyPopper },
  { name: 'Nomes e Cuidados Plantas e Flores', slug: 'nomes-cuidados-plantas-flores', icon: Flower2 },
  { name: 'Hortas, Ervas e Cuidados', slug: 'hortas-ervas-cuidados', icon: Leaf },
  // Arquitetura
  { name: 'Arquitetura', slug: 'arquitetura', icon: Building2 },
  { name: 'Colonial', slug: 'colonial', icon: Building2 },
  { name: 'Industrial', slug: 'industrial', icon: Building2 },
  { name: 'Moderno', slug: 'moderno', icon: Building2 },
  { name: 'Neolítico', slug: 'neolitico', icon: Building2 },
  { name: 'Europeu', slug: 'europeu', icon: Building2 },
  { name: 'Nórdico', slug: 'nordico', icon: Building2 },
  { name: 'Neo Clássico', slug: 'neo-classico', icon: Building2 },
  // Genéricas
  { name: 'Design Interno', slug: 'design-interno', icon: Home },
  { name: 'Decoração', slug: 'decoracao', icon: Palette },
  { name: 'Plantas de Interior', slug: 'plantas-interior', icon: Leaf },
  { name: 'DIY e Projetos', slug: 'diy-projetos', icon: Hammer },
  { name: 'Sustentabilidade', slug: 'sustentabilidade', icon: Recycle },
  { name: 'Móveis e Organização', slug: 'moveis-organizacao', icon: Sofa },
  { name: 'Tendências', slug: 'tendencias', icon: Sparkles },
  { name: 'Iluminação', slug: 'iluminacao', icon: Lightbulb },
  { name: 'Datas Comemorativas', slug: 'datas-comemorativas', icon: PartyPopper },
];

const IMAGE_PROMPTS = [
  { label: 'Capa', type: 'cover', promptSuffix: 'hero photograph, 16:9 aspect ratio, professional lighting' },
  { label: 'Imagem 1', type: 'gallery', promptSuffix: 'detailed close-up shot, macro photography' },
  { label: 'Imagem 2', type: 'gallery', promptSuffix: 'ambient lifestyle scene, cozy atmosphere' },
  { label: 'Imagem 3', type: 'gallery', promptSuffix: 'practical application view, instructional style' },
  { label: 'Imagem 4', type: 'gallery', promptSuffix: 'alternative perspective, creative angle' },
  { label: 'Imagem 5', type: 'gallery', promptSuffix: 'beautiful home setting, interior design context' },
];

interface ArticleData {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string | null;
  body: string | null;
  category: string | null;
  category_slug: string | null;
  tags: string[] | null;
  keywords: string | null;
  status: string | null;
  cover_image: string | null;
  gallery_images: string[] | null;
  read_time: string | null;
  published_at: string | null;
  affiliate_banner_enabled: boolean | null;
  affiliate_banner_image: string | null;
  affiliate_banner_image_mobile: string | null;
  affiliate_banner_url: string | null;
  main_subject: string | null;
  visual_context: string | null;
  gallery_prompts: string[] | null;
}

interface ImageCardProps {
  image: string;
  label: string;
  isGenerating: boolean;
  isUploading?: boolean;
  isCover?: boolean;
  isSelectable?: boolean;
  onClick?: () => void;
  onGenerate: () => void;
  onRemove: () => void;
  onUpload: (file: File) => void;
}

const ImageCard = ({ image, label, isGenerating, isUploading, isCover, isSelectable, onClick, onGenerate, onRemove, onUpload }: ImageCardProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSelectable) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isSelectable) return;
    const file = e.dataTransfer.files?.[0];
    if (file) onUpload(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleClick = () => {
    if (isSelectable && onClick && !isGenerating && !isUploading) {
      onClick();
    }
  };

  const isLoading = isGenerating || isUploading;

  return (
    <div
      className={`relative group ${isSelectable ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      {!isSelectable && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      )}
      <div
        className={`${isCover ? 'aspect-video' : 'aspect-[4/3]'} rounded-lg overflow-hidden bg-muted border-2 transition-all ${isDragging ? 'border-primary border-solid bg-primary/10' : 'border-border/50 border-solid'} ${isSelectable ? 'hover:border-primary hover:ring-2 hover:ring-primary/30' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {image ? (
          <img src={image} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50">
            <ImageIcon className="h-8 w-8 mb-2" />
            <span className="text-xs">{label}</span>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && !isSelectable && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={onGenerate} className="bg-primary hover:bg-primary/90">
                <RefreshCw className="h-4 w-4 mr-1" />
                {image ? 'Refazer' : 'Gerar'}
              </Button>
              {image && (
                <Button size="sm" variant="destructive" onClick={onRemove}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              className="w-full max-w-[140px]"
            >
              <Upload className="h-4 w-4 mr-1" />
              Upload
            </Button>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1 text-center">
        {label}
        {isSelectable && <span className="block text-[10px] text-primary/70">Clique para Editar</span>}
      </p>
    </div>
  );
};

// Copy for Facebook Card Component
const CopyForFacebookCard = ({
  title, excerpt, body, coverImage, galleryImages, category, slug, emotionalConclusion, tags
}: {
  title: string; excerpt: string; body: string; coverImage: string;
  galleryImages: string[]; category: string; slug: string; emotionalConclusion: string | null;
  tags: string[];
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const siteUrl = 'https://homegardenmanual.com';
  const articleUrl = category && slug ? `${siteUrl}/${category}/${slug}` : '';

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copiado!');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const copyImageToClipboard = async (imageUrl: string, field: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setCopiedField(field);
      toast.success('Imagem copiada!');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback: copy URL
      await copyToClipboard(imageUrl, field);
    }
  };

  const stripMarkdown = (text: string) => {
    return text
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^[-*]\s/gm, '• ')
      .replace(/^\d+\.\s/gm, '')
      .trim();
  };

  const allImages = [coverImage, ...galleryImages].filter(Boolean);

  const CopyButton = ({ field, onClick, label }: { field: string; onClick: () => void; label: string }) => (
    <Button
      size="sm"
      variant={copiedField === field ? "default" : "outline"}
      className="w-full justify-start gap-2 text-xs h-8"
      onClick={onClick}
    >
      {copiedField === field ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copiedField === field ? 'Copiado!' : label}
    </Button>
  );

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Facebook className="h-4 w-4 text-blue-600" />
          Copiar para Facebook
        </CardTitle>
        <CardDescription>Copie cada parte do artigo para postar nas redes sociais</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {title && (
          <CopyButton field="title" onClick={() => copyToClipboard(title, 'title')} label="Copiar Título" />
        )}
        {excerpt && (
          <CopyButton field="excerpt" onClick={() => copyToClipboard(excerpt, 'excerpt')} label="Copiar Resumo" />
        )}
        {body && (
          <CopyButton field="body" onClick={() => {
            const hashtags = tags && tags.length > 0
              ? '\n\n' + tags.map(t => `#${t.toLowerCase().replace(/\s+/g, '')}`).join(' ')
              : '';
            copyToClipboard(stripMarkdown(body) + hashtags, 'body');
          }} label="Copiar Texto Completo" />
        )}
        {emotionalConclusion && (
          <CopyButton field="conclusion" onClick={() => copyToClipboard(emotionalConclusion, 'conclusion')} label="Copiar Conclusão Emocional" />
        )}
        {articleUrl && (
          <CopyButton field="url" onClick={() => copyToClipboard(articleUrl, 'url')} label="Copiar URL do Artigo" />
        )}

        {/* Images */}
        {allImages.length > 0 && (
          <div className="pt-2 border-t border-border/50 mt-2">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Image className="h-3 w-3" /> Imagens ({allImages.length})
            </p>
            <div className="grid grid-cols-3 gap-2">
              {allImages.map((img, idx) => (
                <div key={idx} className="relative group cursor-pointer" onClick={() => copyImageToClipboard(img, `img-${idx}`)}>
                  <div className="aspect-square rounded-md overflow-hidden border border-border/50">
                    <img src={img} alt={`Imagem ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute inset-0 bg-background/80 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {copiedField === `img-${idx}` ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4 text-foreground" />
                    )}
                  </div>
                  {idx === 0 && <span className="absolute top-0.5 left-0.5 text-[8px] bg-primary text-primary-foreground px-1 rounded">Capa</span>}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Clique na imagem para copiar</p>
          </div>
        )}

        {/* Copy All for Facebook */}
        <div className="pt-2 border-t border-border/50">
          <Button
            size="sm"
            className="w-full gap-2"
            onClick={() => {
              const parts = [
                title ? `🏡 ${title}` : '',
                '',
                excerpt || '',
                '',
                emotionalConclusion ? `💚 ${emotionalConclusion}` : '',
                '',
                articleUrl ? `📖 Leia mais: ${articleUrl}` : '',
              ].filter((line, i, arr) => !(line === '' && arr[i - 1] === '')).join('\n').trim();
              copyToClipboard(parts, 'all');
            }}
          >
            {copiedField === 'all' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copiedField === 'all' ? 'Tudo Copiado!' : 'Copiar Tudo para Facebook'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Social Media Ready Post Cards
const SocialMediaPostCards = ({
  title, excerpt, coverImage, category, slug, emotionalConclusion, tags
}: {
  title: string; excerpt: string; coverImage: string;
  category: string; slug: string; emotionalConclusion: string | null;
  tags: string[];
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copyingImage, setCopyingImage] = useState<string | null>(null);

  const siteUrl = 'https://homegardenmanual.com';
  const articleUrl = category && slug ? `${siteUrl}/${category}/${slug}` : '';

  const copyText = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copiado!');
      setTimeout(() => setCopiedField(null), 2500);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const copyImageToClipboard = async (url: string, field: string) => {
    setCopyingImage(field);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      // Convert to PNG for clipboard compatibility
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      const loaded = new Promise<void>((resolve) => { img.onload = () => resolve(); });
      img.src = URL.createObjectURL(blob);
      await loaded;
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(img.src);
      const pngBlob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), 'image/png')
      );
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob })
      ]);
      setCopiedField(field);
      toast.success('Imagem copiada para a memória!');
      setTimeout(() => setCopiedField(null), 2500);
    } catch {
      toast.error('Não foi possível copiar a imagem. Tente baixar.');
    } finally {
      setCopyingImage(null);
    }
  };

  const handleDownload = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success('Imagem baixada!');
    } catch {
      toast.error('Erro ao baixar imagem.');
    }
  };

  const getJpgUrl = (w: number, h: number) =>
    coverImage ? `https://wsrv.nl/?url=${encodeURIComponent(coverImage)}&w=${w}&h=${h}&fit=cover&output=jpg&q=90` : '';

  const fbImageUrl = getJpgUrl(1200, 630);
  const igImageUrl = getJpgUrl(1080, 1350);

  const articleHashtags = tags.length > 0
    ? tags.map(t => `#${t.replace(/\s+/g, '').toLowerCase()}`).join(' ')
    : '#decoração #casa #jardim #design #homedecor #homegardenmanual';

  const fbPostText = [
    `🏡 ${title}`,
    '',
    excerpt ? `✨ ${excerpt}` : '',
    '',
    emotionalConclusion ? `💚 ${emotionalConclusion}` : '',
    '',
    articleUrl ? `📖 Leia mais: ${articleUrl}` : '',
    '',
    articleHashtags,
  ].filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n').trim();

  const igPostText = [
    `🌿 ${title}`,
    '',
    excerpt ? `✨ ${excerpt}` : '',
    '',
    emotionalConclusion ? `💚 ${emotionalConclusion}` : '',
    '',
    articleUrl ? `🔗 Link na bio: ${articleUrl}` : '',
    '',
    articleHashtags,
  ].filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n').trim();

  const CopyBtn = ({ field, onClick, label, icon }: { field: string; onClick: () => void; label: string; icon?: React.ReactNode }) => (
    <Button
      size="sm"
      variant={copiedField === field ? "default" : "outline"}
      className="gap-1.5 text-xs h-8"
      onClick={onClick}
      disabled={copyingImage === field}
    >
      {copyingImage === field ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : copiedField === field ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        icon || <Copy className="h-3.5 w-3.5" />
      )}
      {copiedField === field ? 'Copiado!' : label}
    </Button>
  );

  if (!coverImage) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Share2 className="h-4 w-4 text-blue-500" />
            Posts para Redes Sociais
          </CardTitle>
          <CardDescription>Gere a imagem de capa primeiro</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Facebook / WhatsApp Post */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Facebook className="h-4 w-4 text-blue-600" />
            Post Facebook / WhatsApp
          </CardTitle>
          <CardDescription>Pronto para copiar e postar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Preview text */}
          <div className="bg-background rounded-lg border border-border/50 p-3 text-xs text-foreground whitespace-pre-line max-h-[160px] overflow-y-auto">
            {fbPostText}
          </div>
          <CopyBtn field="fb-text" onClick={() => copyText(fbPostText, 'fb-text')} label="Copiar Texto" />

          {/* Image with copy */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Imagem 1200×630 (JPG)</p>
            <div className="relative rounded-lg overflow-hidden border border-border/30">
              <img src={fbImageUrl} alt="Facebook" className="w-full object-contain" style={{ maxHeight: '180px' }} />
            </div>
            <div className="flex gap-2">
              <CopyBtn field="fb-img" onClick={() => copyImageToClipboard(fbImageUrl, 'fb-img')} label="Copiar Imagem" icon={<Copy className="h-3.5 w-3.5" />} />
              <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => handleDownload(fbImageUrl, `facebook-${slug || 'post'}.jpg`)}>
                <Download className="h-3.5 w-3.5" />
                Baixar
              </Button>
            </div>
          </div>

          {/* URL */}
          {articleUrl && (
            <div className="flex items-center gap-2 pt-1 border-t border-border/30">
              <Input value={articleUrl} readOnly className="h-8 text-xs bg-muted/30" />
              <CopyBtn field="fb-url" onClick={() => copyText(articleUrl, 'fb-url')} label="Copiar" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instagram Post */}
      <Card className="border-pink-500/30 bg-gradient-to-br from-pink-500/5 to-purple-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">📸</span>
            Post Instagram
          </CardTitle>
          <CardDescription>Formato retrato para feed e Reels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Preview text */}
          <div className="bg-background rounded-lg border border-border/50 p-3 text-xs text-foreground whitespace-pre-line max-h-[160px] overflow-y-auto">
            {igPostText}
          </div>
          <CopyBtn field="ig-text" onClick={() => copyText(igPostText, 'ig-text')} label="Copiar Legenda" />

          {/* Image with copy */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Imagem 1080×1350 (JPG)</p>
            <div className="relative rounded-lg overflow-hidden border border-border/30 flex justify-center bg-muted/20">
              <img src={igImageUrl} alt="Instagram" className="object-contain" style={{ maxHeight: '280px' }} />
            </div>
            <div className="flex gap-2">
              <CopyBtn field="ig-img" onClick={() => copyImageToClipboard(igImageUrl, 'ig-img')} label="Copiar Imagem" icon={<Copy className="h-3.5 w-3.5" />} />
              <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => handleDownload(igImageUrl, `instagram-${slug || 'post'}.jpg`)}>
                <Download className="h-3.5 w-3.5" />
                Baixar
              </Button>
            </div>
          </div>

          {/* URL */}
          {articleUrl && (
            <div className="flex items-center gap-2 pt-1 border-t border-border/30">
              <Input value={articleUrl} readOnly className="h-8 text-xs bg-muted/30" />
              <CopyBtn field="ig-url" onClick={() => copyText(articleUrl, 'ig-url')} label="Copiar" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default function ArticleEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { sendNewsletterIfEnabled } = useSendNewsletter();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [keywords, setKeywords] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>(['', '', '', '', '']);
  const [readTime, setReadTime] = useState('5 min');
  const [status, setStatus] = useState('draft');
  const [generatingImageIndex, setGeneratingImageIndex] = useState<number | null>(null);
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  const [affiliateBannerEnabled, setAffiliateBannerEnabled] = useState(false);
  const [affiliateBannerImage, setAffiliateBannerImage] = useState('');
  const [affiliateBannerImageMobile, setAffiliateBannerImageMobile] = useState('');
  const [affiliateBannerUrl, setAffiliateBannerUrl] = useState('');
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingBannerMobile, setIsUploadingBannerMobile] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const bannerMobileInputRef = useRef<HTMLInputElement>(null);

  const [editingIndex, setEditingIndex] = useState<number>(0);
  const [galleryIndices, setGalleryIndices] = useState<number[]>([1, 2, 3, 4, 5]);

  const { data: article, isLoading } = useQuery({
    queryKey: ['article-edit', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await (supabase as any)
        .from('content_articles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as ArticleData | null;
    },
    enabled: !!id,
  });

  const { data: clickStats } = useAffiliateClickStats(id, 30);

  const {
    conclusion: emotionalConclusion,
    isGenerating: isGeneratingConclusion,
    fetchConclusion,
    generateConclusion,
    updateConclusion,
  } = useEmotionalConclusion(id);

  const [isEditingConclusion, setIsEditingConclusion] = useState(false);
  const [editedConclusionText, setEditedConclusionText] = useState('');
  const [isSavingConclusion, setIsSavingConclusion] = useState(false);

  useEffect(() => {
    if (id) fetchConclusion();
  }, [id, fetchConclusion]);

  useEffect(() => {
    if (article) {
      setTitle(article.title || '');
      setSlug(article.slug || '');
      setExcerpt(article.excerpt || '');
      setBody(article.body || '');
      setCategory(article.category_slug || '');
      setTags(article.tags || []);
      setKeywords(article.keywords || '');
      setCoverImage(article.cover_image || '');
      setReadTime(article.read_time || '5 min');
      setStatus(article.status || 'draft');
      setAffiliateBannerEnabled(article.affiliate_banner_enabled || false);
      setAffiliateBannerImage(article.affiliate_banner_image || '');
      setAffiliateBannerImageMobile(article.affiliate_banner_image_mobile || '');
      setAffiliateBannerUrl(article.affiliate_banner_url || '');
      const gallery = article.gallery_images as string[] || [];
      const filledGallery = [...gallery, '', '', '', '', ''].slice(0, 5);
      setGalleryImages(filledGallery);
    }
  }, [article]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Article ID is required');
      const selectedCategory = CATEGORIES.find(c => c.slug === category);
      const cleanGallery = galleryImages.filter(img => img !== '');

      const updates = {
        title,
        slug,
        excerpt,
        body,
        category: selectedCategory?.name || null,
        category_slug: category || null,
        tags,
        keywords,
        cover_image: coverImage || null,
        gallery_images: cleanGallery.length > 0 ? cleanGallery : [],
        read_time: readTime,
        status,
        published_at: status === 'published' ? (article?.published_at || new Date().toISOString()) : null,
        affiliate_banner_enabled: affiliateBannerEnabled,
        affiliate_banner_image: affiliateBannerImage || null,
        affiliate_banner_image_mobile: affiliateBannerImageMobile || null,
        affiliate_banner_url: affiliateBannerUrl || null,
      };

      const { error } = await (supabase as any)
        .from('content_articles')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Send newsletter if article is being published for the first time
      if (status === 'published' && article?.status !== 'published') {
        await sendNewsletterIfEnabled({
          id: id!,
          title,
          slug,
          excerpt,
          category: selectedCategory?.name || null,
          cover_image: coverImage || null,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      queryClient.invalidateQueries({ queryKey: ['article-edit', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['published-articles'] });
      queryClient.invalidateQueries({ queryKey: ['blog-articles'] });
      queryClient.invalidateQueries({ queryKey: ['blog-categories'] });
      toast.success('Artigo salvo com sucesso!');
    },
    onError: (error) => {
      console.error('Save error:', error);
      toast.error('Erro ao salvar artigo');
    },
  });

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value));
    }
  };

  const handleAddTag = () => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const calculateReadTime = () => {
    const wordCount = body.split(/\s+/).filter(Boolean).length;
    const minutes = Math.ceil(wordCount / 200);
    setReadTime(`${minutes} min`);
  };

  const getArticleUrl = () => {
    if (category && slug) return `/${category}/${slug}`;
    return null;
  };

  const extractMainSubjectFromTitle = (titleText: string): string => {
    const lowerTitle = titleText.toLowerCase();
    const subjectMap: Record<string, string> = {
      'lareira': 'modern indoor fireplace with warm flames',
      'lareiras': 'elegant fireplaces with dancing flames',
      'área gourmet': 'outdoor gourmet area with built-in BBQ and bar',
      'espaço gourmet': 'outdoor gourmet space with cooking station',
      'jardim vertical': 'lush vertical garden with cascading plants',
      'jardins verticais': 'vertical gardens with tropical foliage',
      'pergolado': 'beautiful wooden pergola with climbing vines',
      'pergolados': 'elegant pergolas in outdoor setting',
      'piscina': 'beautiful swimming pool with clear blue water',
      'churrasqueira': 'outdoor BBQ grill area with stone counter',
      'varanda': 'cozy balcony with comfortable seating',
      'terraço': 'spacious terrace with modern furniture',
      'suculentas': 'colorful arrangement of succulent plants',
      'cactos': 'collection of cacti and succulents',
      'orquídeas': 'beautiful orchids in decorative pots',
      'rosas': 'garden with blooming roses',
      'cozinha': 'modern kitchen with beautiful cabinets',
      'quarto': 'beautiful bedroom with comfortable bed',
      'banheiro': 'modern bathroom with elegant fixtures',
      'sala de jantar': 'elegant dining room with modern table',
      'sala de estar': 'cozy living room with stylish furniture',
      'escritório': 'home office with elegant desk setup',
      'lavanderia': 'organized laundry room with modern appliances',
      'halloween': 'halloween decorated home with pumpkins and spooky decor',
    };
    for (const [pt, en] of Object.entries(subjectMap)) {
      if (lowerTitle.includes(pt)) return en;
    }
    return '';
  };

  const uploadImageToIndex = async (file: File, index: number) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }
    setUploadingImageIndex(index);
    try {
      const fileExt = file.name.split('.').pop();
      const folder = index === 0 ? 'covers' : 'gallery';
      const fileName = `${id}-${index}-${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('article-images')
        .getPublicUrl(filePath);
      if (index === 0) {
        setCoverImage(publicUrl);
      } else {
        const newGallery = [...galleryImages];
        newGallery[index - 1] = publicUrl;
        setGalleryImages(newGallery);
      }
      toast.success('Imagem carregada com sucesso!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao carregar imagem');
    } finally {
      setUploadingImageIndex(null);
    }
  };

  const generateSingleImage = async (index: number) => {
    if (!title) {
      toast.error('Adicione um título antes de gerar a imagem');
      return;
    }
    setGeneratingImageIndex(index);
    try {
      const promptConfig = IMAGE_PROMPTS[index];
      const savedPrompt = index > 0 && article?.gallery_prompts?.[index - 1];
      const customPrompt = savedPrompt || `${title}, ${promptConfig.promptSuffix}`;
      const finalMainSubject = article?.main_subject || extractMainSubjectFromTitle(title);

      const { data, error } = await invokeEdgeFunction('generate-article-image', {
        title,
        category: category || 'decoracao',
        tags: tags || [],
        type: promptConfig.type,
        customPrompt,
        slug: slug || generateSlug(title),
        mainSubject: finalMainSubject,
        visualContext: article?.visual_context || '',
        articleId: id,
        regenerate: true,
        imageIndex: index > 0 ? index - 1 : 0,
      });

      if (error) throw error;
      if (data?.success && data?.imageUrl) {
        if (index === 0) {
          setCoverImage(data.imageUrl);
        } else {
          const newGallery = [...galleryImages];
          newGallery[index - 1] = data.imageUrl;
          setGalleryImages(newGallery);
        }
        queryClient.invalidateQueries({ queryKey: ['article-edit', id] });
        toast.success(`${promptConfig.label} gerada com sucesso!`);
      } else {
        throw new Error(data?.error || 'Erro ao gerar imagem');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Erro ao gerar imagem com IA');
    } finally {
      setGeneratingImageIndex(null);
    }
  };

  const generateAllImages = async () => {
    if (!title) {
      toast.error('Adicione um título antes de gerar as imagens');
      return;
    }
    setIsGeneratingAll(true);
    let successCount = 0;
    let errorCount = 0;
    try {
      for (let i = 0; i < 6; i++) {
        setGeneratingImageIndex(i);
        try {
          const promptConfig = IMAGE_PROMPTS[i];
          const savedPrompt = i > 0 && article?.gallery_prompts?.[i - 1];
          const customPrompt = savedPrompt || `${title}, ${promptConfig.promptSuffix}`;
          const finalMainSubject = article?.main_subject || extractMainSubjectFromTitle(title);

          toast.loading(`Gerando imagem ${i + 1}/6...`, { id: `img-${i}` });

          const { data, error } = await invokeEdgeFunction('generate-article-image', {
            title,
            category: category || 'decoracao',
            tags: tags || [],
            type: promptConfig.type,
            customPrompt,
            slug: slug || generateSlug(title),
            mainSubject: finalMainSubject,
            visualContext: article?.visual_context || '',
            articleId: id,
            regenerate: true,
            imageIndex: i > 0 ? i - 1 : 0,
          });

          if (error) {
            toast.error(`Imagem ${i + 1}/6 falhou: ${error.message}`, { id: `img-${i}` });
            errorCount++;
            continue;
          }

          if (data?.success && data?.imageUrl) {
            if (i === 0) {
              setCoverImage(data.imageUrl);
            } else {
              setGalleryImages(prev => {
                const newGallery = [...prev];
                newGallery[i - 1] = data.imageUrl;
                return newGallery;
              });
            }
            successCount++;
            const fallbackInfo = data.usedFallback ? ' (via Cloudflare)' : '';
            toast.success(`Imagem ${i + 1}/6 gerada${fallbackInfo}`, { id: `img-${i}` });
          } else {
            toast.error(`Imagem ${i + 1}/6 falhou`, { id: `img-${i}` });
            errorCount++;
            continue;
          }

          if (i < 5) {
            const delayTime = data?.usedFallback ? 5000 : 2000;
            await new Promise(resolve => setTimeout(resolve, delayTime));
          }
        } catch (imgError) {
          toast.error(`Imagem ${i + 1}/6 erro`, { id: `img-${i}` });
          errorCount++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['article-edit', id] });

      if (successCount === 6) {
        toast.success('Todas as 6 imagens foram geradas com sucesso!');
      } else if (successCount > 0) {
        toast.warning(`${successCount} imagens geradas, ${errorCount} falharam`);
      } else {
        toast.error('Falha ao gerar todas as imagens');
      }
    } catch (error) {
      console.error('Error in generateAllImages:', error);
      toast.error('Erro ao gerar imagens');
    } finally {
      setGeneratingImageIndex(null);
      setIsGeneratingAll(false);
    }
  };

  const removeImage = (index: number) => {
    if (index === 0) {
      setCoverImage('');
    } else {
      const newGallery = [...galleryImages];
      newGallery[index - 1] = '';
      setGalleryImages(newGallery);
    }
  };

  const swapWithCover = (galleryIndex: number) => {
    const galleryImage = galleryImages[galleryIndex];
    const currentCover = coverImage;
    setCoverImage(galleryImage);
    const newGallery = [...galleryImages];
    newGallery[galleryIndex] = currentCover;
    setGalleryImages(newGallery);
    const currentEditingIdx = editingIndex;
    const clickedGalleryIdx = galleryIndices[galleryIndex];
    setEditingIndex(clickedGalleryIdx);
    const newGalleryIndices = [...galleryIndices];
    newGalleryIndices[galleryIndex] = currentEditingIdx;
    setGalleryIndices(newGalleryIndices);
  };

  const uploadAffiliateBanner = async (file: File, type: 'desktop' | 'mobile') => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 10MB');
      return;
    }
    if (type === 'desktop') setIsUploadingBanner(true);
    else setIsUploadingBannerMobile(true);
    try {
      const expectedDimensions = BANNER_DIMENSIONS[type];
      const dimensions = await getImageDimensions(file);
      let webpBlob: Blob;
      if (dimensions.width !== expectedDimensions.width || dimensions.height !== expectedDimensions.height) {
        toast.info(`Redimensionando de ${dimensions.width}×${dimensions.height} para ${expectedDimensions.width}×${expectedDimensions.height}...`);
        webpBlob = await resizeImage(file, expectedDimensions.width, expectedDimensions.height, 0.85);
      } else {
        const { convertToWebP } = await import('@/utils/imageUtils');
        webpBlob = await convertToWebP(file, 0.85);
      }
      const suffix = type === 'mobile' ? '-mobile' : '';
      const fileName = `${id}-banner${suffix}-${Date.now()}.webp`;
      const filePath = `banners/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(filePath, webpBlob, { upsert: true, contentType: 'image/webp' });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('article-images')
        .getPublicUrl(filePath);
      if (type === 'desktop') setAffiliateBannerImage(publicUrl);
      else setAffiliateBannerImageMobile(publicUrl);
      toast.success(`Banner ${type === 'desktop' ? 'desktop' : 'mobile'} carregado com sucesso!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao carregar banner');
    } finally {
      if (type === 'desktop') setIsUploadingBanner(false);
      else setIsUploadingBannerMobile(false);
    }
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAffiliateBanner(file, 'desktop');
    if (bannerInputRef.current) bannerInputRef.current.value = '';
  };

  const handleBannerMobileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAffiliateBanner(file, 'mobile');
    if (bannerMobileInputRef.current) bannerMobileInputRef.current.value = '';
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!article) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
          <p>Artigo não encontrado</p>
          <Button variant="link" onClick={() => navigate('/admin/articles')}>
            Voltar para lista
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const galleryCount = galleryImages.filter(Boolean).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/articles')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Editar Artigo</h1>
              <p className="text-sm text-muted-foreground">
                Modifique o conteúdo e as configurações do artigo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getArticleUrl() && status === 'published' && (
              <Button variant="outline" asChild>
                <a href={getArticleUrl()!} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </a>
              </Button>
            )}
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Conteúdo</CardTitle>
                <CardDescription>Título, resumo e corpo do artigo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="title">Título</Label>
                    <TitleExcerptSuggestionButton
                      type="title"
                      currentTitle={title}
                      currentExcerpt={excerpt}
                      body={body}
                      category={category}
                      onSelectTitle={(newTitle) => handleTitleChange(newTitle)}
                    />
                  </div>
                  <Input id="title" value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Digite o título do artigo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="url-do-artigo" />
                  <p className="text-xs text-muted-foreground">URL: /{category || 'categoria'}/{slug || 'slug'}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="excerpt">Resumo</Label>
                    <TitleExcerptSuggestionButton
                      type="excerpt"
                      currentTitle={title}
                      currentExcerpt={excerpt}
                      body={body}
                      category={category}
                      onSelectExcerpt={(newExcerpt) => setExcerpt(newExcerpt)}
                    />
                    <TitleExcerptSuggestionButton
                      type="both"
                      currentTitle={title}
                      currentExcerpt={excerpt}
                      body={body}
                      category={category}
                      onSelectBoth={(newTitle, newExcerpt) => {
                        handleTitleChange(newTitle);
                        setExcerpt(newExcerpt);
                      }}
                    />
                  </div>
                  <Textarea id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Breve descrição do artigo para listagens e SEO" rows={3} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="body">Conteúdo</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={calculateReadTime}>
                      Calcular tempo de leitura
                    </Button>
                  </div>
                  <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Escreva o conteúdo do artigo aqui..." rows={20} className="font-mono text-sm" />
                  <p className="text-xs text-muted-foreground">
                    Suporta formatação: ## para títulos, - para listas, **texto** para negrito
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Imagens do Artigo */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Imagens do Artigo</CardTitle>
                    <CardDescription>Capa e galeria • Passe o mouse sobre cada imagem para gerar ou refazer individualmente</CardDescription>
                  </div>
                  <Button
                    onClick={generateAllImages}
                    disabled={isGeneratingAll || generatingImageIndex !== null || !title}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isGeneratingAll ? 'animate-spin' : ''}`} />
                    {isGeneratingAll ? 'Gerando...' : 'Gerar Todas'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Imagem de Capa */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    {editingIndex === 0 ? "Capa do Artigo" : `Imagem ${editingIndex}`}
                  </Label>
                  <div className="max-w-2xl">
                    <ImageCard
                      image={coverImage}
                      label={editingIndex === 0 ? "Capa" : `Imagem ${editingIndex}`}
                      isGenerating={generatingImageIndex === editingIndex}
                      isUploading={uploadingImageIndex === editingIndex}
                      isCover
                      onGenerate={() => generateSingleImage(editingIndex)}
                      onRemove={() => removeImage(editingIndex)}
                      onUpload={(file) => uploadImageToIndex(file, editingIndex)}
                    />
                  </div>
                </div>

                {/* Galeria */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Galeria ({galleryCount}/5)</Label>
                  <p className="text-xs text-muted-foreground">Clique em uma imagem para trazê-la para a área de edição</p>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {galleryImages.map((img, idx) => {
                      const originalIndex = galleryIndices[idx];
                      return (
                        <ImageCard
                          key={idx}
                          image={img}
                          label={originalIndex === 0 ? "Capa" : `Imagem ${originalIndex}`}
                          isGenerating={generatingImageIndex === originalIndex}
                          isUploading={uploadingImageIndex === originalIndex}
                          isSelectable
                          onClick={() => swapWithCover(idx)}
                          onGenerate={() => generateSingleImage(originalIndex)}
                          onRemove={() => removeImage(originalIndex)}
                          onUpload={(file) => uploadImageToIndex(file, originalIndex)}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Image Queue Status */}
                {id && <ImageQueueStatus articleId={id} />}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card className="border-border/50">
              <CardHeader><CardTitle>Status</CardTitle></CardHeader>
              <CardContent>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">
                      <div className="flex items-center gap-2"><FileText className="h-4 w-4" />Rascunho</div>
                    </SelectItem>
                    <SelectItem value="published">
                      <div className="flex items-center gap-2"><Globe className="h-4 w-4" />Publicado</div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Category */}
            <Card className="border-border/50">
              <CardHeader><CardTitle>Categoria</CardTitle></CardHeader>
              <CardContent>
                <Select value={category || undefined} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <SelectItem key={cat.slug} value={cat.slug}>
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            {cat.name}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Tags</CardTitle>
                <CardDescription>Adicione tags para organização</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Nova tag" />
                  <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Keywords */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Palavras-chave (SEO)</CardTitle>
                <CardDescription>Separadas por vírgula</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="decoração, plantas, jardim..." rows={3} />
              </CardContent>
            </Card>

            {/* Read Time */}
            <Card className="border-border/50">
              <CardHeader><CardTitle>Tempo de Leitura</CardTitle></CardHeader>
              <CardContent>
                <Input value={readTime} onChange={(e) => setReadTime(e.target.value)} placeholder="5 min" />
              </CardContent>
            </Card>

            {/* Emotional Conclusion */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-rose-500" />
                  Conclusão Emocional
                </CardTitle>
                <CardDescription>Texto poético gerado por IA para o card final do artigo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {emotionalConclusion ? (
                  <div className="space-y-3">
                    {isEditingConclusion ? (
                      <>
                        <Textarea
                          value={editedConclusionText}
                          onChange={(e) => setEditedConclusionText(e.target.value)}
                          rows={6}
                          className="text-sm leading-relaxed"
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <Button size="sm" variant="outline" onClick={() => setIsEditingConclusion(false)}>
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            disabled={isSavingConclusion}
                            onClick={async () => {
                              setIsSavingConclusion(true);
                              const success = await updateConclusion(editedConclusionText);
                              setIsSavingConclusion(false);
                              if (success) setIsEditingConclusion(false);
                            }}
                          >
                            {isSavingConclusion ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Salvar
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="relative p-4 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-800/30 group">
                          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                            {emotionalConclusion.conclusion_text}
                          </p>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setEditedConclusionText(emotionalConclusion.conclusion_text);
                              setIsEditingConclusion(true);
                            }}
                            title="Editar conclusão"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            Gerada em {new Date(emotionalConclusion.generated_at).toLocaleDateString('pt-BR')}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateConclusion(title)}
                            disabled={isGeneratingConclusion}
                          >
                            {isGeneratingConclusion ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                            Regenerar
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Heart className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Nenhuma conclusão emocional gerada ainda
                    </p>
                    <Button
                      onClick={() => generateConclusion(title)}
                      disabled={isGeneratingConclusion}
                      className="bg-rose-500 hover:bg-rose-600"
                    >
                      {isGeneratingConclusion ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                      Gerar Conclusão Emocional
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Copiar para Facebook */}
            <CopyForFacebookCard
              title={title}
              excerpt={excerpt}
              body={body}
              coverImage={coverImage}
              galleryImages={galleryImages}
              category={category}
              slug={slug}
              emotionalConclusion={emotionalConclusion?.conclusion_text || null}
              tags={tags}
            />

            {/* Social Media Ready Posts */}
            <SocialMediaPostCards
              title={title}
              excerpt={excerpt}
              coverImage={coverImage}
              category={category}
              slug={slug}
              emotionalConclusion={emotionalConclusion?.conclusion_text || null}
              tags={tags}
            />

            {/* Affiliate Banner */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Banner de Afiliado
                    </CardTitle>
                    <CardDescription>Exibir banner clicável no final do artigo</CardDescription>
                  </div>
                  <Switch checked={affiliateBannerEnabled} onCheckedChange={setAffiliateBannerEnabled} />
                </div>
              </CardHeader>
              {affiliateBannerEnabled && (
                <CardContent className="space-y-4">
                  {/* Desktop Banner */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      🖥️ Banner Desktop
                      <span className="text-xs text-muted-foreground font-normal">(1300×250px)</span>
                    </Label>
                    <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerFileChange} className="hidden" />
                    <div
                      className="relative w-[150px] h-[125px] rounded-lg overflow-hidden bg-muted border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors cursor-pointer group"
                      onClick={() => bannerInputRef.current?.click()}
                    >
                      {affiliateBannerImage ? (
                        <>
                          <img src={affiliateBannerImage} alt="Banner desktop preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            <Button size="sm" variant="secondary" className="h-7 text-xs px-2">
                              <Upload className="h-3 w-3 mr-1" />Trocar
                            </Button>
                            <Button size="sm" variant="destructive" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); setAffiliateBannerImage(''); }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50">
                          {isUploadingBanner ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Upload className="h-5 w-5 mb-1" /><span className="text-[10px]">Upload</span></>}
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">Convertido automaticamente para WebP</p>
                  </div>

                  {/* Mobile Banner */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      📱 Banner Mobile
                      <span className="text-xs text-muted-foreground font-normal">(728×90px)</span>
                    </Label>
                    <input ref={bannerMobileInputRef} type="file" accept="image/*" onChange={handleBannerMobileFileChange} className="hidden" />
                    <div
                      className="relative w-[81px] h-[100px] rounded-lg overflow-hidden bg-muted border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors cursor-pointer group"
                      onClick={() => bannerMobileInputRef.current?.click()}
                    >
                      {affiliateBannerImageMobile ? (
                        <>
                          <img src={affiliateBannerImageMobile} alt="Banner mobile preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            <Button size="sm" variant="secondary" className="h-6 text-[10px] px-1"><Upload className="h-3 w-3" /></Button>
                            <Button size="sm" variant="destructive" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); setAffiliateBannerImageMobile(''); }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50">
                          {isUploadingBannerMobile ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="h-4 w-4 mb-1" /><span className="text-[9px]">Upload</span></>}
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">Convertido automaticamente para WebP</p>
                  </div>

                  {/* Affiliate URL */}
                  <div className="space-y-2">
                    <Label htmlFor="affiliateUrl" className="flex items-center gap-1">
                      <Link2 className="h-3 w-3" />
                      URL do Link de Afiliado
                    </Label>
                    <Input id="affiliateUrl" value={affiliateBannerUrl} onChange={(e) => setAffiliateBannerUrl(e.target.value)} placeholder="https://exemplo.com/produto?ref=seu-codigo" />
                    <p className="text-xs text-muted-foreground">Link para onde o usuário será direcionado ao clicar no banner</p>
                  </div>

                  {/* Click Stats */}
                  {clickStats && (clickStats.totalClicks > 0 || affiliateBannerImage) && (
                    <div className="pt-4 border-t border-border/50">
                      <Label className="flex items-center gap-1 mb-3">
                        <TrendingUp className="h-3 w-3" />
                        Estatísticas (últimos 30 dias)
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary">
                            <MousePointer className="h-5 w-5" />
                            {clickStats.totalClicks}
                          </div>
                          <p className="text-xs text-muted-foreground">Cliques Totais</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-foreground">{clickStats.uniqueClicks}</div>
                          <p className="text-xs text-muted-foreground">Cliques Únicos</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
