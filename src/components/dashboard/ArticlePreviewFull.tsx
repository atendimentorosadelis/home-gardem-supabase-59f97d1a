import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Clock, Tag, Link2, Lightbulb, AlertTriangle, Sparkles, Quote as QuoteIcon, Check, ArrowRight, BookOpen, HelpCircle } from 'lucide-react';
import type { GeneratedArticle } from '@/hooks/use-full-article-generation';
import { FAQPreviewAccordion } from './FAQPreviewAccordion';
import { TitleExcerptSuggestionButton } from './TitleExcerptSuggestions';

interface ArticlePreviewFullProps {
  article: GeneratedArticle;
  onUpdateTitle?: (title: string) => void;
  onUpdateExcerpt?: (excerpt: string) => void;
}

export function ArticlePreviewFull({ article, onUpdateTitle, onUpdateExcerpt }: ArticlePreviewFullProps) {
  // Parse inline bold **text** to JSX
  const parseInlineBold = (text: string): React.ReactNode => {
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let keyIndex = 0;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <strong key={`bold-${keyIndex++}`} className="font-semibold text-foreground">
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // Parse inline markdown (links and bold)
  const parseInlineAll = (text: string): React.ReactNode => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let keyIndex = 0;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${keyIndex++}`}>{parseInlineBold(text.substring(lastIndex, match.index))}</span>);
      }
      parts.push(
        <a
          key={`link-${keyIndex++}`}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-medium"
        >
          {match[1]}
        </a>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(<span key={`text-${keyIndex++}`}>{parseInlineBold(text.substring(lastIndex))}</span>);
    }

    return parts.length > 0 ? parts : parseInlineBold(text);
  };

  // Format content with proper FAQ accordion support
  const formatContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];
    let listType: 'ul' | 'ol' | null = null;
    let tipContent: string[] = [];
    let inTipBlock = false;
    let warningContent: string[] = [];
    let inWarningBlock = false;
    let infoContent: string[] = [];
    let inInfoBlock = false;

    // Table tracking
    let tableRows: string[][] = [];
    let tableHeaders: string[] = [];
    let inTable = false;

    // FAQ tracking - using stable counters
    let faqItems: { question: string; answer: string[] }[] = [];
    let currentFaqQuestion: string | null = null;
    let currentFaqAnswer: string[] = [];
    let inFaqBlock = false;
    let inFaqSection = false;
    let faqBlockCounter = 0;

    const flushList = () => {
      if (listItems.length > 0 && listType) {
        elements.push(
          <div key={`list-${elements.length}`} className="my-4 rounded-lg border border-border/30 bg-muted/20 p-4">
            <ul className="space-y-2">
              {listItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded bg-primary/20 mt-0.5">
                    {listType === 'ul' ? (
                      <Check className="w-3 h-3 text-primary" />
                    ) : (
                      <span className="text-xs font-bold text-primary">{idx + 1}</span>
                    )}
                  </span>
                  <span className="text-foreground/90 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );
        listItems = [];
        listType = null;
      }
    };

    const flushTip = () => {
      if (tipContent.length > 0) {
        elements.push(
          <div key={`tip-${elements.length}`} className="my-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Dica do Keven</span>
            </div>
            <div className="text-foreground/90 text-sm">
              {tipContent.map((line, i) => (
                <p key={i} className="mb-1 last:mb-0">{parseInlineAll(line)}</p>
              ))}
            </div>
          </div>
        );
        tipContent = [];
      }
    };

    const flushWarning = () => {
      if (warningContent.length > 0) {
        elements.push(
          <div key={`warning-${elements.length}`} className="my-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-amber-500">Atenção</span>
            </div>
            <div className="text-foreground/90 text-sm">
              {warningContent.map((line, i) => (
                <p key={i} className="mb-1 last:mb-0">{parseInlineAll(line)}</p>
              ))}
            </div>
          </div>
        );
        warningContent = [];
      }
    };

    const flushInfo = () => {
      if (infoContent.length > 0) {
        elements.push(
          <div key={`info-${elements.length}`} className="my-4 rounded-lg border border-sky-500/20 bg-sky-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-sky-500" />
              <span className="text-sm font-semibold text-sky-400">Você sabia?</span>
            </div>
            <div className="text-foreground/90 text-sm">
              {infoContent.map((line, i) => (
                <p key={i} className="mb-1 last:mb-0">{parseInlineAll(line)}</p>
              ))}
            </div>
          </div>
        );
        infoContent = [];
      }
    };

    const flushFaq = () => {
      // Add current FAQ item to collection
      if (currentFaqQuestion) {
        faqItems.push({ question: currentFaqQuestion, answer: [...currentFaqAnswer] });
        currentFaqQuestion = null;
        currentFaqAnswer = [];
      }
    };

    const flushTable = () => {
      if (tableHeaders.length > 0 && tableRows.length > 0) {
        elements.push(
          <div key={`table-${elements.length}`} className="my-4 overflow-x-auto">
            <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border/50">
                    {tableHeaders.map((header, idx) => (
                      <th
                        key={idx}
                        className="px-3 py-2 text-left font-semibold text-foreground"
                      >
                        {parseInlineAll(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className="border-b border-border/30 last:border-0"
                    >
                      {row.map((cell, cellIdx) => (
                        <td
                          key={cellIdx}
                          className="px-3 py-2 text-muted-foreground"
                        >
                          {parseInlineAll(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

        tableHeaders = [];
        tableRows = [];
        inTable = false;
      }
    };

    const renderFaqBlock = () => {
      if (faqItems.length === 0) return;

      // Create stable copy with current block counter
      const currentBlockId = faqBlockCounter++;
      const itemsToRender = faqItems.map((item, idx) => ({
        question: item.question,
        answer: item.answer.map((line, lineIdx) => (
          <p key={lineIdx}>{parseInlineAll(line)}</p>
        ))
      }));

      elements.push(
        <FAQPreviewAccordion
          key={`faq-block-${currentBlockId}`}
          items={itemsToRender}
        />
      );

      // Clear items after rendering
      faqItems = [];
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Skip empty lines
      if (trimmedLine === '') {
        if (inTipBlock) { flushTip(); inTipBlock = false; }
        if (inWarningBlock) { flushWarning(); inWarningBlock = false; }
        if (inInfoBlock) { flushInfo(); inInfoBlock = false; }

        // Handle empty line in FAQ block
        if (inFaqBlock) {
          let nextLineIdx = index + 1;
          while (nextLineIdx < lines.length && lines[nextLineIdx].trim() === '') {
            nextLineIdx++;
          }
          const nextLine = lines[nextLineIdx]?.trim() || '';

          // If next non-empty line is not a FAQ question, end the FAQ block
          if (!/^\d+\.\s.*\?$/.test(nextLine)) {
            flushFaq();
            renderFaqBlock();
            inFaqBlock = false;
          }
        }
        return;
      }

      // Tip blocks
      if (trimmedLine.toLowerCase().includes('dica:') || trimmedLine.toLowerCase().includes('💡 dica')) {
        flushList();
        inTipBlock = true;
        const content = trimmedLine.replace(/^(💡\s*)?dica:?\s*/i, '').trim();
        if (content) tipContent.push(content);
        return;
      }
      if (inTipBlock && !line.startsWith('#')) {
        tipContent.push(trimmedLine);
        return;
      }

      // Warning blocks
      if (trimmedLine.toLowerCase().includes('atenção:') || trimmedLine.toLowerCase().includes('⚠️')) {
        flushList();
        inWarningBlock = true;
        const content = trimmedLine.replace(/^⚠️ ?Atenção:?\s*/i, '').trim();
        if (content) warningContent.push(content);
        return;
      }
      if (inWarningBlock && !line.startsWith('#')) {
        warningContent.push(trimmedLine);
        return;
      }

      // Info blocks
      if (trimmedLine.toLowerCase().includes('você sabia') || trimmedLine.toLowerCase().includes('✨')) {
        flushList();
        inInfoBlock = true;
        const content = trimmedLine.replace(/^✨ ?Você sabia\??\s*/i, '').trim();
        if (content) infoContent.push(content);
        return;
      }
      if (inInfoBlock && !line.startsWith('#')) {
        infoContent.push(trimmedLine);
        return;
      }

      // Table detection - markdown tables with | separators
      if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
        const cells = trimmedLine
          .slice(1, -1)
          .split('|')
          .map(cell => cell.trim());

        const isSeparator = cells.every(cell => /^[-:\s]+$/.test(cell));

        if (isSeparator) {
          inTable = true;
          return;
        }

        if (!inTable && tableHeaders.length === 0) {
          tableHeaders = cells;
          return;
        }

        if (inTable) {
          tableRows.push(cells);
          return;
        }
      } else if (inTable) {
        flushTable();
      }

      // H2 Headers
      if (line.startsWith('## ')) {
        flushList();
        flushTable();
        flushTip();
        flushWarning();
        flushInfo();

        // Flush FAQ if we were in one
        if (inFaqBlock || inFaqSection) {
          flushFaq();
          renderFaqBlock();
          inFaqBlock = false;
          inFaqSection = false;
        }

        const h2Title = line.replace('## ', '');
        const isFaqTitle = /FAQ|Perguntas\s+Frequentes/i.test(h2Title);

        if (isFaqTitle) {
          inFaqSection = true;
        }

        elements.push(
          <h2 key={index} className="text-lg font-bold text-foreground mt-6 mb-3 flex items-center gap-2">
            {isFaqTitle ? (
              <HelpCircle className="w-4 h-4 text-primary" />
            ) : (
              <BookOpen className="w-4 h-4 text-primary" />
            )}
            {h2Title}
          </h2>
        );
        return;
      }

      // H3 Headers
      if (line.startsWith('### ')) {
        flushList();
        if (inFaqBlock) {
          flushFaq();
          renderFaqBlock();
          inFaqBlock = false;
        }
        elements.push(
          <h3 key={index} className="text-base font-semibold text-foreground mt-4 mb-2 flex items-center gap-2">
            <ArrowRight className="w-3 h-3 text-primary" />
            {line.replace('### ', '')}
          </h3>
        );
        return;
      }

      // List items (unordered)
      if (line.startsWith('- ')) {
        if (listType !== 'ul') {
          flushList();
          listType = 'ul';
        }
        listItems.push(<span key={index}>{parseInlineAll(line.replace('- ', ''))}</span>);
        return;
      }

      // FAQ detection - multiple formats
      const isNumberedBoldFaq = /^\d+\.\s+\*\*.*\?\*\*$/.test(trimmedLine);
      const isSimpleFaq = inFaqSection &&
                          trimmedLine.endsWith('?') &&
                          !trimmedLine.startsWith('-') &&
                          !trimmedLine.startsWith('#') &&
                          trimmedLine.length > 10 &&
                          trimmedLine.length < 200;
      const isFaqQuestion = isNumberedBoldFaq || isSimpleFaq;

      if (isFaqQuestion) {
        flushList();
        flushTip();
        flushWarning();
        flushInfo();

        flushFaq();

        inFaqBlock = true;
        currentFaqQuestion = trimmedLine
          .replace(/^\d+\.\s*/, '')
          .replace(/^\*\*/, '')
          .replace(/\*\*$/, '')
          .trim();
        return;
      }

      // Collect FAQ answer content
      if (inFaqBlock) {
        const isNextNumberedBoldFaq = /^\d+\.\s+\*\*.*\?\*\*$/.test(trimmedLine);
        const isNextSimpleFaq = inFaqSection &&
                                trimmedLine.endsWith('?') &&
                                !trimmedLine.startsWith('-') &&
                                trimmedLine.length > 10;
        const isNextFaqQuestion = isNextNumberedBoldFaq || isNextSimpleFaq;

        if (isNextFaqQuestion) {
          flushFaq();
          currentFaqQuestion = trimmedLine
            .replace(/^\d+\.\s*/, '')
            .replace(/^\*\*/, '')
            .replace(/\*\*$/, '');
          return;
        } else if (line.startsWith('#')) {
          flushFaq();
          renderFaqBlock();
          inFaqBlock = false;
          inFaqSection = false;
        } else if (trimmedLine !== '') {
          currentFaqAnswer.push(trimmedLine);
          return;
        }
      }

      // Numbered items (not FAQ)
      if (/^\d+\.\s/.test(line) && !inFaqBlock) {
        if (listType !== 'ol') {
          flushList();
          listType = 'ol';
        }
        listItems.push(<span key={index}>{parseInlineAll(line.replace(/^\d+\.\s/, ''))}</span>);
        return;
      }

      // Regular paragraphs
      if (trimmedLine !== '' && !inFaqBlock) {
        flushList();
        elements.push(
          <p key={index} className="text-muted-foreground text-sm leading-relaxed mb-3">
            {parseInlineAll(line)}
          </p>
        );
      }
    });

    // Final flush
    flushList();
    flushTable();
    flushTip();
    flushWarning();
    flushInfo();
    flushFaq();
    renderFaqBlock();

    return elements;
  };

  return (
    <div className="space-y-6">
      {/* Cover Image */}
      {article.coverImage && (
        <div className="relative aspect-video rounded-lg overflow-hidden border border-border/50">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <Badge className="mb-2">{article.category}</Badge>
            <h1 className="text-2xl font-bold text-white">{article.title}</h1>
          </div>
        </div>
      )}

      {/* Metadata */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Metadados do Artigo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="flex items-center gap-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Título</label>
                {onUpdateTitle && (
                  <TitleExcerptSuggestionButton
                    type="title"
                    currentTitle={article.title}
                    currentExcerpt={article.excerpt}
                    body={article.content}
                    category={article.category}
                    onSelectTitle={onUpdateTitle}
                  />
                )}
              </div>
              <p className="mt-1 font-medium">{article.title}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Slug</label>
              <p className="mt-1 font-mono text-sm text-muted-foreground">{article.slug}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Categoria</label>
              <div className="mt-1">
                <Badge variant="secondary">{article.category}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Leitura</label>
                <div className="mt-1 flex items-center gap-1 text-sm">
                  <Clock className="h-3.5 w-3.5" />
                  {article.readTime}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resumo</label>
              {onUpdateExcerpt && (
                <TitleExcerptSuggestionButton
                  type="excerpt"
                  currentTitle={article.title}
                  currentExcerpt={article.excerpt}
                  body={article.content}
                  category={article.category}
                  onSelectExcerpt={onUpdateExcerpt}
                />
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{article.excerpt}</p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" />
              Tags
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {article.tags.map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Keywords (SEO)</label>
            <p className="mt-1 text-sm text-muted-foreground font-mono">{article.keywords}</p>
          </div>

          {article.externalLinks.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Link2 className="h-3.5 w-3.5" />
                Links Externos
              </label>
              <div className="mt-2 space-y-1">
                {article.externalLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {link.text}
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Preview */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Conteúdo do Artigo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {formatContent(article.content)}
          </div>
        </CardContent>
      </Card>

      {/* Gallery Preview */}
      {article.galleryImages.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Galeria de Imagens ({article.galleryImages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {article.galleryImages.map((img, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg overflow-hidden border border-border/50"
                >
                  <img
                    src={img}
                    alt={`Galeria ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
