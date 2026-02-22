import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export function PushNotificationSettings() {
  const [enabled, setEnabled] = useState(false);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Notificações Push
        </CardTitle>
        <CardDescription>
          Configure suas notificações push
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="push-toggle" className="font-medium">Ativar notificações</Label>
            <p className="text-sm text-muted-foreground">Receba notificações sobre novos artigos e atualizações</p>
          </div>
          <Switch id="push-toggle" checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </CardContent>
    </Card>
  );
}
