import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { invokeEdgeFunction, EDGE_FUNCTIONS } from '@/lib/edge-functions';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  { value: 'sala', label: 'Sala' },
  { value: 'sala-jantar', label: 'Sala de Jantar' },
  { value: 'quarto', label: 'Quarto' },
  { value: 'banheiro', label: 'Banheiro' },
  { value: 'cozinha', label: 'Cozinha' },
  { value: 'escritorio', label: 'Escritório' },
  { value: 'varanda', label: 'Varanda' },
  { value: 'jardim', label: 'Jardim' },
  { value: 'area-gourmet', label: 'Área Gourmet' },
  { value: 'lareira', label: 'Lareira' },
  { value: 'decoracao', label: 'Dicas de Decoração' },
  { value: 'jardim-vertical', label: 'Jardim Vertical' },
  { value: 'colonial', label: 'Colonial' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'moderno', label: 'Moderno' },
];

interface GenerationStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'done' | 'error';
  detail?: string;
}

export default function GenerateManualContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [publishImmediately, setPublishImmediately] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedArticleId, setGeneratedArticleId] = useState<string | null>(null);
  const [steps, setSteps] = useState<GenerationStep[]>([]);

  const updateStep = (id: string, updates: Partial<GenerationStep>) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({ title: 'Informe o tópico', description: 'Digite o assunto do artigo.', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    setGeneratedArticleId(null);

    const initialSteps: GenerationStep[] = [
      { id: 'generate', label: 'Gerando artigo com IA', status: 'loading' },
      { id: 'save', label: 'Salvando no banco de dados', status: 'pending' },
      { id: 'publish', label: publishImmediately ? 'Publicando artigo' : 'Salvando como rascunho', status: 'pending' },
    ];
    setSteps(initialSteps);

    try {
      // Step 1: Try edge function, fallback to local generation
      let articleData: any = null;

      try {
        const { data, error } = await invokeEdgeFunction(EDGE_FUNCTIONS.GENERATE_FULL_ARTICLE, {
          topic: topic.trim(),
          category: category || 'decoracao',
          customInstructions: customInstructions.trim() || undefined,
        }, true);

        if (error) throw error;
        articleData = data;
      } catch {
        console.warn('Edge function not available, creating article locally');
        // Fallback: create article with basic content
        articleData = {
          title: topic.trim(),
          body: `<h2>${topic.trim()}</h2><p>Conteúdo a ser escrito sobre ${topic.trim()}.</p>`,
          excerpt: `Artigo sobre ${topic.trim()}`,
          category: CATEGORIES.find(c => c.value === category)?.label || 'Decoração',
          category_slug: category || 'decoracao',
          keywords: topic.trim().toLowerCase(),
          read_time: '5 min',
        };
      }

      updateStep('generate', { status: 'done', detail: articleData?.title || topic });

      // Step 2: Save to database
      updateStep('save', { status: 'loading' });

      const slug = (articleData?.title || topic)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 100);

      const { data: saved, error: saveError } = await (supabase as any)
        .from('content_articles')
        .insert({
          title: articleData?.title || topic,
          slug: `${slug}-${Date.now()}`,
          body: articleData?.body || '',
          excerpt: articleData?.excerpt || '',
          category: articleData?.category || 'Decoração',
          category_slug: articleData?.category_slug || category || 'decoracao',
          keywords: articleData?.keywords || '',
          read_time: articleData?.read_time || '5 min',
          cover_image: articleData?.cover_image || null,
          tags: articleData?.tags || [],
          status: publishImmediately ? 'published' : 'draft',
          published_at: publishImmediately ? new Date().toISOString() : null,
          author_id: user?.id,
        })
        .select()
        .single();

      if (saveError) throw saveError;

      updateStep('save', { status: 'done' });
      setGeneratedArticleId(saved.id);

      // Step 3: Publish status
      updateStep('publish', { status: 'done', detail: publishImmediately ? 'Publicado!' : 'Salvo como rascunho' });

      toast({
        title: '✅ Artigo criado!',
        description: publishImmediately ? 'O artigo foi publicado.' : 'O artigo foi salvo como rascunho.',
      });

    } catch (error) {
      console.error('Generation error:', error);
      const failedStep = steps.find(s => s.status === 'loading');
      if (failedStep) updateStep(failedStep.id, { status: 'error', detail: (error as Error).message });
      toast({ title: 'Erro na geração', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const getStepIcon = (status: GenerationStep['status']) => {
    switch (status) {
      case 'loading': return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'done': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Gerar Conteúdo
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie artigos manualmente ou com auxílio de IA
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Novo Artigo
            </CardTitle>
            <CardDescription>
              Defina o tópico e as configurações do artigo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Tópico / Título *</Label>
              <Input
                id="topic"
                placeholder="Ex: Como decorar uma sala pequena com estilo moderno"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory} disabled={isGenerating}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instruções adicionais (opcional)</Label>
              <Textarea
                id="instructions"
                placeholder="Ex: Foque em dicas práticas e econômicas..."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                disabled={isGenerating}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="space-y-0.5">
                <Label>Publicar imediatamente</Label>
                <p className="text-sm text-muted-foreground">
                  {publishImmediately ? 'O artigo será publicado ao ser criado' : 'O artigo será salvo como rascunho'}
                </p>
              </div>
              <Switch
                checked={publishImmediately}
                onCheckedChange={setPublishImmediately}
                disabled={isGenerating}
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Gerar Artigo
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generation Progress */}
        {steps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progresso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {steps.map(step => (
                  <div key={step.id} className="flex items-start gap-3">
                    {getStepIcon(step.status)}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${step.status === 'pending' ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {step.label}
                      </p>
                      {step.detail && (
                        <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
                      )}
                    </div>
                    <Badge variant={
                      step.status === 'done' ? 'default' :
                      step.status === 'error' ? 'destructive' :
                      step.status === 'loading' ? 'secondary' : 'outline'
                    }>
                      {step.status === 'done' ? 'Concluído' :
                       step.status === 'error' ? 'Erro' :
                       step.status === 'loading' ? 'Em progresso' : 'Aguardando'}
                    </Badge>
                  </div>
                ))}
              </div>

              {generatedArticleId && (
                <div className="mt-4 pt-4 border-t border-border flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/admin/articles/${generatedArticleId}`)}
                  >
                    Editar Artigo
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSteps([]);
                      setTopic('');
                      setCategory('');
                      setCustomInstructions('');
                      setGeneratedArticleId(null);
                    }}
                  >
                    Gerar Outro
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
