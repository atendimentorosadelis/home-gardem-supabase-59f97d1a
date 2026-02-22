// Stub - ImageQueueStatus component
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface ImageQueueStatusProps {
  articleId: string;
  onImageReady?: (imageUrl: string, imageType: 'cover' | 'gallery', imageIndex: number) => void;
}

export function ImageQueueStatus({ articleId }: ImageQueueStatusProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Fila de Imagens</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">Nenhuma imagem na fila para este artigo.</p>
      </CardContent>
    </Card>
  );
}
