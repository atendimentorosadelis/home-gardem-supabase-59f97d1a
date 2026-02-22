import {
  PartyPopper, Heart, Flower2, Egg, Gift, Flame, Flag, Baby,
  Ghost, TreePine, Wheat, Sparkles, Star, type LucideIcon
} from 'lucide-react';

export interface CommemorativeDate {
  id: string;
  label: string;
  labelEn: string;
  icon: LucideIcon;
  month: number;
  day: number | null;
  getDate?: (year: number) => Date;
  category: 'jardim' | 'decoracao' | 'geral';
  topicSuggestion: string;
  color: string;
}

function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function getNthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  const firstDay = new Date(year, month - 1, 1);
  const firstWeekday = firstDay.getDay();
  const day = 1 + ((weekday - firstWeekday + 7) % 7) + (n - 1) * 7;
  return new Date(year, month - 1, day);
}

function getLastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  const lastDay = new Date(year, month, 0);
  const lastWeekday = lastDay.getDay();
  const diff = (lastWeekday - weekday + 7) % 7;
  return new Date(year, month - 1, lastDay.getDate() - diff);
}

function getCarnivalDate(year: number): Date {
  const easter = getEasterDate(year);
  return new Date(easter.getTime() - 47 * 24 * 60 * 60 * 1000);
}

export const COMMEMORATIVE_DATES: CommemorativeDate[] = [
  { id: 'ano-novo', label: 'Ano Novo', labelEn: 'New Year', icon: PartyPopper, month: 1, day: 1, category: 'geral', topicSuggestion: 'Decoração e plantas para renovar a casa no ano novo', color: 'yellow' },
  { id: 'carnaval', label: 'Carnaval', labelEn: 'Carnival', icon: Sparkles, month: 2, day: null, getDate: getCarnivalDate, category: 'decoracao', topicSuggestion: 'Decoração tropical e colorida para o Carnaval', color: 'purple' },
  { id: 'valentines-day', label: "Valentine's Day", labelEn: "Valentine's Day", icon: Heart, month: 2, day: 14, category: 'decoracao', topicSuggestion: "Jardim romântico e flores para o Valentine's Day", color: 'pink' },
  { id: 'dia-mulher', label: 'Dia da Mulher', labelEn: "Women's Day", icon: Flower2, month: 3, day: 8, category: 'jardim', topicSuggestion: 'As melhores flores para presentear no Dia da Mulher', color: 'pink' },
  { id: 'st-patricks', label: "St. Patrick's Day", labelEn: "St. Patrick's Day", icon: Sparkles, month: 3, day: 17, category: 'jardim', topicSuggestion: "Plantas verdes e trevos para decorar no St. Patrick's Day", color: 'green' },
  { id: 'pascoa', label: 'Páscoa', labelEn: 'Easter', icon: Egg, month: 4, day: null, getDate: getEasterDate, category: 'decoracao', topicSuggestion: 'Decoração de Páscoa para jardim e casa', color: 'purple' },
  { id: 'dia-maes', label: 'Dia das Mães', labelEn: "Mother's Day", icon: Heart, month: 5, day: null, getDate: (year) => getNthWeekdayOfMonth(year, 5, 0, 2), category: 'jardim', topicSuggestion: 'Plantas e flores para presentear no Dia das Mães', color: 'pink' },
  { id: 'memorial-day', label: 'Memorial Day', labelEn: 'Memorial Day', icon: Flag, month: 5, day: null, getDate: (year) => getLastWeekdayOfMonth(year, 5, 1), category: 'geral', topicSuggestion: 'Jardim patriótico para o Memorial Day', color: 'blue' },
  { id: 'dia-namorados-br', label: 'Dia dos Namorados', labelEn: "Valentine's Day (BR)", icon: Heart, month: 6, day: 12, category: 'decoracao', topicSuggestion: 'Jardim romântico para o Dia dos Namorados', color: 'red' },
  { id: 'festa-junina', label: 'Festa Junina', labelEn: 'June Festival', icon: Flame, month: 6, day: 24, category: 'decoracao', topicSuggestion: 'Decoração junina para jardim e varanda', color: 'orange' },
  { id: 'independence-day-us', label: '4 de Julho', labelEn: '4th of July', icon: Flag, month: 7, day: 4, category: 'decoracao', topicSuggestion: 'Decoração patriótica americana para o jardim', color: 'blue' },
  { id: 'dia-pais', label: 'Dia dos Pais', labelEn: "Father's Day", icon: Gift, month: 8, day: null, getDate: (year) => getNthWeekdayOfMonth(year, 8, 0, 2), category: 'jardim', topicSuggestion: 'Horta e ferramentas para presentear no Dia dos Pais', color: 'blue' },
  { id: 'independencia-br', label: 'Independência do Brasil', labelEn: 'Brazil Independence Day', icon: Flag, month: 9, day: 7, category: 'geral', topicSuggestion: 'Decoração verde e amarela para o jardim', color: 'green' },
  { id: 'labor-day', label: 'Labor Day', labelEn: 'Labor Day', icon: Star, month: 9, day: null, getDate: (year) => getNthWeekdayOfMonth(year, 9, 1, 1), category: 'geral', topicSuggestion: 'Preparando o jardim para o outono', color: 'blue' },
  { id: 'dia-criancas', label: 'Dia das Crianças', labelEn: "Children's Day", icon: Baby, month: 10, day: 12, category: 'jardim', topicSuggestion: 'Jardim seguro e divertido para crianças', color: 'cyan' },
  { id: 'halloween', label: 'Halloween', labelEn: 'Halloween', icon: Ghost, month: 10, day: 31, category: 'decoracao', topicSuggestion: 'Decoração de Halloween para jardim e entrada', color: 'orange' },
  { id: 'thanksgiving', label: 'Thanksgiving', labelEn: 'Thanksgiving', icon: Wheat, month: 11, day: null, getDate: (year) => getNthWeekdayOfMonth(year, 11, 4, 4), category: 'decoracao', topicSuggestion: 'Mesa e decoração de Thanksgiving com plantas', color: 'amber' },
  { id: 'natal', label: 'Natal', labelEn: 'Christmas', icon: TreePine, month: 12, day: 25, category: 'decoracao', topicSuggestion: 'Decoração natalina para jardim e fachada', color: 'red' },
];

export const ALERT_DAYS_BEFORE = 3;

export function getEventDate(date: CommemorativeDate, year?: number): Date {
  const currentYear = year || new Date().getFullYear();
  if (date.getDate) return date.getDate(currentYear);
  return new Date(currentYear, date.month - 1, date.day!);
}
