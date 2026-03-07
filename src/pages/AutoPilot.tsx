import { useState } from 'react';
import { Bot, Zap, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, Plus, Trash2, Power, Play, FileText, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PermissionGate } from '@/components/PermissionGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { AutoPilotCircleProgress } from '@/components/dashboard/AutoPilotCircleProgress';
import { AutoPilotGenerationProgress } from '@/components/dashboard/AutoPilotGenerationProgress';
import { useToast } from '@/hooks/use-toast';
import { invokeEdgeFunction } from '@/lib/edge-functions';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useAutoGenerationConfig,
  useAutoGenerationSchedules,
  useAutoGenerationLogs,
  useNextExecution,
  AVAILABLE_TOPICS,
  AutoGenerationLog,
} from '@/hooks/use-auto-generation';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom', fullLabel: 'Domingo' },
  { value: 1, label: 'Seg', fullLabel: 'Segunda' },
  { value: 2, label: 'Ter', fullLabel: 'Terça' },
  { value: 3, label: 'Qua', fullLabel: 'Quarta' },
  { value: 4, label: 'Qui', fullLabel: 'Quinta' },
  { value: 5, label: 'Sex', fullLabel: 'Sexta' },
  { value: 6, label: 'Sáb', fullLabel: 'Sábado' },
];

const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
];

function AutoPilotContent() {
  const { toast } = useToast();
  const { config, isLoadingConfig, updateConfig, isUpdating, toggleAutoPilot } = useAutoGenerationConfig();
  const { schedules, isLoadingSchedules, addSchedule, removeSchedule, isAdding } = useAutoGenerationSchedules();
  const {
    logs,
    isLoadingLogs,
    todayCount,
    refetchLogs,
    totalCount,
    totalPages,
    currentPage,
    setPage,
    clearLogs,
    isClearing,
  } = useAutoGenerationLogs(10);
  const nextExecution = useNextExecution(schedules);

  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedTime, setSelectedTime] = useState<string>('08:00');
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [generationResult, setGenerationResult] = useState<{ success?: boolean; title?: string; message?: string } | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleTestNow = async () => {
    if (!config?.random_all_topics && (!config?.topics || config.topics.length === 0)) {
      toast({
        title: 'Nenhum tema selecionado',
        description: 'Selecione pelo menos um tema ou ative "Tema Aleatório Total" antes de testar.',
        variant: 'destructive',
      });
      return;
    }

    setIsTestRunning(true);
    toast({
      title: '🚀 Iniciando geração manual',
      description: 'Um artigo será gerado com um tema aleatório...',
    });

    try {
      const { data, error } = await invokeEdgeFunction('auto-generate-article', {
        force: true,
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: '✅ Artigo gerado com sucesso!',
          description: `"${data.title}" foi ${config.publish_immediately ? 'publicado' : 'salvo como rascunho'}.`,
        });
      } else {
        toast({
          title: 'Geração não realizada',
          description: data?.message || 'Verifique os logs para mais detalhes.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Test generation error:', error);
      toast({
        title: 'Erro na geração',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsTestRunning(false);
      refetchLogs();
    }
  };

  const handleToggleTopic = async (topicId: string) => {
    if (!config) return;

    const currentTopics = config.topics || [];
    const newTopics = currentTopics.includes(topicId)
      ? currentTopics.filter(t => t !== topicId)
      : [...currentTopics, topicId];

    await updateConfig({ topics: newTopics });
  };

  const handleAddSchedule = async () => {
    await addSchedule({ day_of_week: selectedDay, time_slot: selectedTime });
  };

  const groupedTopics = AVAILABLE_TOPICS.reduce((acc, topic) => {
    if (!acc[topic.category]) acc[topic.category] = [];
    acc[topic.category].push(topic);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_TOPICS>);

  if (isLoadingConfig || isLoadingSchedules) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25 shrink-0">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Piloto Automático</h1>
            <p className="text-sm text-muted-foreground">Gere artigos automaticamente em horários agendados</p>
          </div>
        </div>

        {/* Main Toggle Card */}
        <Card className={cn(
          "relative overflow-hidden transition-all duration-500 border-2",
          config?.enabled
            ? "border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-transparent shadow-xl shadow-emerald-500/10"
            : "border-border"
        )}>
          {config?.enabled && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-green-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
          )}

          <CardContent className="relative p-4 sm:p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <button
                  onClick={() => toggleAutoPilot(!config?.enabled)}
                  disabled={isUpdating}
                  className={cn(
                    "relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center transition-all duration-500 cursor-pointer group shrink-0",
                    config?.enabled
                      ? "bg-gradient-to-br from-emerald-500 to-green-600 shadow-2xl shadow-emerald-500/50 hover:shadow-emerald-500/60 hover:scale-105"
                      : "bg-muted hover:bg-muted/80 hover:scale-105"
                  )}
                >
                  {isUpdating ? (
                    <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 text-white animate-spin" />
                  ) : (
                    <>
                      <Power className={cn(
                        "h-8 w-8 sm:h-10 sm:w-10 transition-all duration-300",
                        config?.enabled ? "text-white" : "text-muted-foreground"
                      )} />
                      {config?.enabled && (
                        <div className="absolute inset-0 rounded-2xl animate-ping bg-emerald-500/30" style={{ animationDuration: '2s' }} />
                      )}
                    </>
                  )}
                </button>

                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-3">
                    <span className={cn(
                      "text-2xl sm:text-3xl font-bold transition-colors duration-300",
                      config?.enabled ? "text-emerald-500" : "text-foreground"
                    )}>
                      {config?.enabled ? 'ATIVO' : 'PAUSADO'}
                    </span>
                    {config?.enabled && (
                      <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 animate-pulse" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {config?.enabled
                      ? 'Gerando artigos automaticamente'
                      : 'Clique para ativar a geração automática'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl sm:text-3xl font-bold text-foreground">{todayCount}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Artigos hoje</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl sm:text-3xl font-bold text-foreground">{config?.daily_limit || 5}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Limite diário</div>
                </div>
                {nextExecution && config?.enabled && (
                  <div className="text-center p-3 rounded-lg bg-emerald-500/10">
                    <div className="text-lg sm:text-xl font-bold text-emerald-500">
                      {format(nextExecution, 'HH:mm')}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {format(nextExecution, 'EEE', { locale: ptBR })}
                    </div>
                  </div>
                )}
                <div className="col-span-2 sm:col-span-1 flex items-center justify-center">
                  <Button
                    onClick={handleTestNow}
                    disabled={isTestRunning}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg"
                    size="lg"
                  >
                    {isTestRunning ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Testar Agora
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Topics Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Temas Habilitados
              </CardTitle>
              <CardDescription>
                Selecione os temas para geração aleatória
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(groupedTopics).map(([category, topics]) => (
                <div key={category} className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                    {category}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {topics.map((topic) => (
                      <div
                        key={topic.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all",
                          config?.topics?.includes(topic.id)
                            ? "border-emerald-500 bg-emerald-500/10"
                            : "border-border hover:border-muted-foreground/50"
                        )}
                        onClick={() => handleToggleTopic(topic.id)}
                      >
                        <Checkbox
                          checked={config?.topics?.includes(topic.id) || false}
                          onCheckedChange={() => handleToggleTopic(topic.id)}
                          className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                        />
                        <Label className="cursor-pointer text-sm flex-1">
                          {topic.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Settings */}
              <div className="pt-4 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 pr-4">
                    <Label className="flex items-center gap-2">
                      <Zap className={cn("h-4 w-4", (config as any)?.random_all_topics ? "text-emerald-500" : "text-muted-foreground")} />
                      Tema Aleatório Total
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(config as any)?.random_all_topics ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          <strong>Ligado:</strong> Sorteia de <strong>todos os temas existentes</strong> automaticamente
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">
                          <strong>Desligado:</strong> Usa apenas os temas selecionados acima
                        </span>
                      )}
                    </p>
                  </div>
                  <Switch
                    checked={(config as any)?.random_all_topics || false}
                    onCheckedChange={(checked) => updateConfig({ random_all_topics: checked } as any)}
                    disabled={isUpdating}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1 pr-4">
                    <Label className="flex items-center gap-2">
                      {config?.publish_immediately ? (
                        <Send className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <FileText className="h-4 w-4 text-amber-500" />
                      )}
                      Publicar automaticamente
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {config?.publish_immediately ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          <strong>Ligado:</strong> Artigos são publicados imediatamente no site
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">
                          <strong>Desligado:</strong> Artigos são salvos como rascunho para revisão
                        </span>
                      )}
                    </p>
                  </div>
                  <Switch
                    checked={config?.publish_immediately || false}
                    onCheckedChange={(checked) => updateConfig({ publish_immediately: checked })}
                    disabled={isUpdating}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Limite diário</Label>
                    <p className="text-xs text-muted-foreground">Máximo de artigos por dia</p>
                  </div>
                  <Select
                    value={String(config?.daily_limit || 5)}
                    onValueChange={(value) => updateConfig({ daily_limit: parseInt(value) })}
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 5, 10, 15, 20].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-500" />
                Agendamento Semanal
              </CardTitle>
              <CardDescription>
                Configure os horários de geração automática
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={String(selectedDay)} onValueChange={(v) => setSelectedDay(parseInt(v))}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={String(day.value)}>
                        {day.fullLabel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger className="flex-1 sm:w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button onClick={handleAddSchedule} disabled={isAdding} size="icon" className="shrink-0">
                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Schedule Grid - Desktop */}
              <div className="hidden sm:block border rounded-lg overflow-hidden">
                <div className="grid grid-cols-8 bg-muted/50 text-center text-xs font-medium">
                  <div className="p-2 border-r">Hora</div>
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="p-2 border-r last:border-r-0">
                      {day.label}
                    </div>
                  ))}
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {TIME_SLOTS.map((time) => {
                    const timeSchedules = schedules?.filter(s => s.time_slot.startsWith(time)) || [];
                    if (timeSchedules.length === 0) return null;

                    return (
                      <div key={time} className="grid grid-cols-8 border-t text-center">
                        <div className="p-2 border-r text-xs text-muted-foreground flex items-center justify-center">
                          {time}
                        </div>
                        {DAYS_OF_WEEK.map((day) => {
                          const schedule = timeSchedules.find(s => s.day_of_week === day.value);
                          return (
                            <div key={day.value} className="p-1 border-r last:border-r-0 flex items-center justify-center">
                              {schedule && (
                                <button
                                  onClick={() => removeSchedule(schedule.id)}
                                  className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110",
                                    schedule.is_active
                                      ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/50"
                                      : "bg-muted text-muted-foreground"
                                  )}
                                  title="Clique para remover"
                                >
                                  <Clock className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                {(!schedules || schedules.length === 0) && (
                  <div className="p-8 text-center text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum horário agendado</p>
                    <p className="text-xs">Adicione horários usando o formulário acima</p>
                  </div>
                )}
              </div>

              {/* Mobile Schedule List */}
              <div className="sm:hidden space-y-2">
                {schedules && schedules.length > 0 ? (
                  schedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          schedule.is_active
                            ? "bg-emerald-500 text-white"
                            : "bg-muted text-muted-foreground"
                        )}>
                          <Clock className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {DAYS_OF_WEEK.find(d => d.value === schedule.day_of_week)?.fullLabel}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            às {schedule.time_slot.slice(0, 5)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSchedule(schedule.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-muted-foreground border rounded-lg">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum horário agendado</p>
                  </div>
                )}
              </div>

              {schedules && schedules.length > 0 && (
                <p className="text-xs text-muted-foreground text-center hidden sm:block">
                  {schedules.length} horário(s) agendado(s) • Clique no ícone para remover
                </p>
              )}

              <AutoPilotCircleProgress
                nextExecution={nextExecution}
                isEnabled={config?.enabled || false}
              />
            </CardContent>
          </Card>
        </div>

        {/* Execution Logs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-emerald-500" />
                  Histórico de Execuções
                  {totalCount > 0 && (
                    <Badge variant="secondary" className="ml-2">{totalCount}</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Últimas gerações automáticas realizadas
                </CardDescription>
              </div>

              {logs && logs.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isClearing}>
                      {isClearing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Limpar Histórico
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Limpar histórico de execuções?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação irá remover todos os registros de execução do piloto automático.
                        Execuções em andamento não serão afetadas. Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => clearLogs()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Limpar Histórico
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingLogs ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : logs && logs.length > 0 ? (
              <>
                <div className="space-y-2">
                  {logs.map((log) => (
                    <LogItem key={log.id} log={log} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Página {currentPage + 1} de {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
                        disabled={currentPage >= totalPages - 1}
                      >
                        Próxima
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhuma execução registrada ainda</p>
                <p className="text-sm">As execuções aparecerão aqui quando o piloto automático estiver ativo</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function AutoPilot() {
  return (
    <PermissionGate permission="can_use_autopilot">
      <AutoPilotContent />
    </PermissionGate>
  );
}

function LogItem({ log }: { log: AutoGenerationLog }) {
  const statusConfig = {
    success: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Sucesso' },
    error: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Erro' },
    skipped: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Pulado' },
    running: { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Executando' },
    pending: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Pendente' },
  };

  const config = statusConfig[log.status];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-lg", config.bg)}>
      <Icon className={cn("h-5 w-5 shrink-0", config.color, log.status === 'running' && "animate-spin")} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{log.topic_used}</span>
          <Badge variant="outline" className="text-xs">
            {config.label}
          </Badge>
        </div>
        {log.error_message && (
          <p className="text-xs text-destructive truncate">{log.error_message}</p>
        )}
      </div>

      <div className="text-right shrink-0">
        <div className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(log.executed_at), { addSuffix: true, locale: ptBR })}
        </div>
        {log.duration_ms && (
          <div className="text-xs text-muted-foreground">
            {(log.duration_ms / 1000).toFixed(1)}s
          </div>
        )}
      </div>
    </div>
  );
}
