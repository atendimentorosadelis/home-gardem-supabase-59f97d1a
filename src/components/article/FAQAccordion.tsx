import React from 'react';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FAQItem {
  question: string;
  answer: React.ReactNode[];
}

interface FAQAccordionProps {
  items: FAQItem[];
  className?: string;
}

export const FAQAccordion = ({ items, className }: FAQAccordionProps) => {
  if (items.length === 0) return null;

  return (
    <div className={cn("w-full py-8 md:py-12", className)}>
      <div className="text-center mb-8 md:mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-primary/15 border border-primary/25 rounded-full mb-4">
          <MessageCircle className="w-7 h-7 md:w-8 md:h-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3 md:mb-4">
          Perguntas Frequentes
        </h2>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
          Separei as dúvidas mais comuns sobre este assunto. Se a sua não estiver aqui, deixe um comentário! 😊
        </p>
      </div>

      <Accordion type="single" collapsible className="space-y-3 md:space-y-4">
        {items.map((item, index) => (
          <AccordionItem
            key={`faq-item-${index}`}
            value={`item-${index}`}
            className={cn(
              "bg-card rounded-xl md:rounded-2xl overflow-hidden transition-all duration-300",
              "shadow-md hover:shadow-lg border border-border/50",
              "data-[state=open]:shadow-xl data-[state=open]:ring-2 data-[state=open]:ring-primary data-[state=open]:border-primary/50"
            )}
          >
            <AccordionTrigger
              className={cn(
                "w-full px-5 md:px-6 py-4 md:py-5 text-left flex justify-between items-center group",
                "hover:no-underline [&>svg]:text-muted-foreground [&[data-state=open]>svg]:text-primary"
              )}
            >
              <span className="text-base md:text-lg font-semibold text-foreground pr-6 md:pr-8 group-hover:text-primary transition-colors leading-snug text-left">
                {item.question}
              </span>
            </AccordionTrigger>

            <AccordionContent className="px-5 md:px-6 pb-5 md:pb-6">
              <div className="w-12 h-1 bg-primary rounded-full mb-4"></div>
              <div className="text-muted-foreground leading-relaxed text-sm md:text-base space-y-3">
                {item.answer.map((paragraph, pIdx) => (
                  <div key={pIdx}>{paragraph}</div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-8 md:mt-10 text-center p-5 md:p-6 bg-primary/5 border border-primary/20 rounded-xl md:rounded-2xl">
        <p className="text-base md:text-lg text-foreground">
          Se gostou desse artigo, ele foi feito com carinho! <span className="font-semibold">Deixe seu like e compartilhe.</span> Compartilhando você ajuda nosso blog a crescer! 💚
        </p>
      </div>
    </div>
  );
};
