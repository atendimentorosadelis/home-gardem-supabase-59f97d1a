import React from 'react';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface FAQItem {
  question: string;
  answer: React.ReactNode[];
}

interface FAQPreviewAccordionProps {
  items: FAQItem[];
  className?: string;
}

export const FAQPreviewAccordion = ({ items, className }: FAQPreviewAccordionProps) => {
  if (items.length === 0) return null;

  return (
    <div className={cn("w-full py-6", className)}>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/15 border border-primary/25 rounded-full mb-3">
          <MessageCircle className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Perguntas Frequentes</h3>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">Separei as dúvidas mais comuns sobre este assunto. 😊</p>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {items.map((item, index) => (
          <AccordionItem key={`faq-preview-${index}`} value={`item-${index}`} className={cn("bg-card rounded-lg overflow-hidden transition-all duration-300", "shadow-sm hover:shadow-md border border-border/50", "data-[state=open]:shadow-lg data-[state=open]:ring-2 data-[state=open]:ring-primary data-[state=open]:border-primary/50")}>
            <AccordionTrigger className="w-full px-4 py-3 text-left flex justify-between items-center group hover:no-underline">
              <span className="text-sm font-semibold text-foreground pr-4 group-hover:text-primary transition-colors leading-snug text-left">{item.question}</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="w-10 h-0.5 bg-primary rounded-full mb-3"></div>
              <div className="text-muted-foreground leading-relaxed text-sm space-y-2">
                {item.answer.map((paragraph, pIdx) => (<div key={pIdx}>{paragraph}</div>))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-6 text-center p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <p className="text-sm text-foreground">Se gostou desse artigo, ele foi feito com carinho! <span className="font-medium">Deixe seu like e compartilhe.</span> 💚</p>
      </div>
    </div>
  );
};

export default FAQPreviewAccordion;
