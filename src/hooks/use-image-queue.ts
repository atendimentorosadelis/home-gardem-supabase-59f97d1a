// Stub - use-image-queue hook
import { useState } from 'react';

export interface QueueItem {
  id: string; article_id: string; image_type: 'cover' | 'gallery'; image_index: number;
  prompt: string; status: string; public_url: string | null; error_message: string | null;
  retry_count: number; created_at: string; updated_at: string;
}

export function useImageQueue(articleId: string) {
  return {
    queueItems: [] as QueueItem[],
    isLoading: false,
    isProcessing: false,
    retryItem: async (_id: string) => {},
    cancelItem: async (_id: string) => {},
    triggerQueueProcessing: async () => {},
    refetch: async () => {},
  };
}
