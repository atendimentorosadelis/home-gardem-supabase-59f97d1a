import { Home, Users, Lightbulb, Sparkles, LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCountUp } from "@/hooks/use-count-up";

interface StatItem {
  icon: LucideIcon;
  numericValue: number | null;
  suffix: string;
  textValue?: string;
  labelKey: string;
  descriptionKey: string;
}

const stats: StatItem[] = [
  { icon: Home, numericValue: 500, suffix: "+", labelKey: "stats.decorIdeas", descriptionKey: "stats.decorIdeasDesc" },
  { icon: Users, numericValue: 10, suffix: "k+", labelKey: "stats.monthlyReaders", descriptionKey: "stats.monthlyReadersDesc" },
  { icon: Lightbulb, numericValue: 50, suffix: "+", labelKey: "stats.diyProjects", descriptionKey: "stats.diyProjectsDesc" },
  { icon: Sparkles, numericValue: null, suffix: "", textValue: "∞", labelKey: "stats.dailyInspiration", descriptionKey: "stats.dailyInspirationDesc" },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const { count, ref } = useCountUp({ end: value, duration: 2000 });
  return <span ref={ref}>{count}{suffix}</span>;
}

export function Stats() {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="group p-6 bg-card rounded-2xl border border-border hover:border-primary/50 transition-all hover:glow-green-sm">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-foreground">
                  {stat.numericValue !== null ? <AnimatedCounter value={stat.numericValue} suffix={stat.suffix} /> : stat.textValue}
                </p>
                <p className="text-sm font-medium text-foreground">{t(stat.labelKey)}</p>
                <p className="text-xs text-muted-foreground">{t(stat.descriptionKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
