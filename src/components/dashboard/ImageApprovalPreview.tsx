import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

interface ImageApprovalPreviewProps {
  coverImage?: string;
  galleryImages: string[];
  galleryPrompts: string[];
  visualContext: string;
  mainSubject: string;
  title: string;
  categorySlug: string;
  tags: string[];
  onImagesApproved: (coverImage: string | undefined, galleryImages: string[]) => void;
  onCancel: () => void;
}

export function ImageApprovalPreview({ coverImage, galleryImages, onImagesApproved, onCancel }: ImageApprovalPreviewProps) {
  const [approved, setApproved] = useState(false);

  const handleApproveAll = () => {
    setApproved(true);
    onImagesApproved(coverImage, galleryImages);
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          Aprovação de Imagens
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {coverImage && (
          <div className="space-y-2">
            <Badge>Capa</Badge>
            <div className="rounded-lg overflow-hidden border border-border/50">
              <img src={coverImage} alt="Capa" className="w-full h-48 object-cover" />
            </div>
          </div>
        )}

        {galleryImages.length > 0 && (
          <div className="space-y-2">
            <Badge variant="outline">Galeria ({galleryImages.length})</Badge>
            <div className="grid grid-cols-3 gap-2">
              {galleryImages.map((img, i) => (
                <div key={i} className="rounded-lg overflow-hidden border border-border/50">
                  <img src={img} alt={`Galeria ${i + 1}`} className="w-full h-24 object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button onClick={handleApproveAll} disabled={approved} className="flex-1">
            {approved ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
            {approved ? 'Aprovado' : 'Aprovar Todas'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Pular
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
