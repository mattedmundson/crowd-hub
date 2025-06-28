'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Save, CheckCircle, Wifi, WifiOff, Edit2 } from 'lucide-react';

interface GodMessageFormProps {
  dayNumber: number;
  initialValue?: string;
  onSave: (content: string) => Promise<void>;
  isOnline?: boolean;
  canEdit?: boolean;
  onEdit?: () => void;
}

export function GodMessageForm({
  dayNumber,
  initialValue = '',
  onSave,
  isOnline = true,
  canEdit = false,
  onEdit,
}: GodMessageFormProps) {
  const [content, setContent] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Update content when initialValue changes
  useEffect(() => {
    setContent(initialValue);
  }, [initialValue]);

  // Manual save function
  const handleSave = async () => {
    if (!content.trim()) return;
    
    try {
      setSaving(true);
      setSaveError(null);
      await onSave(content);
      setLastSaved(new Date());
    } catch (error) {
      setSaveError('Failed to save. Please try again.');
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Saved just now';
    if (diffMinutes === 1) return 'Saved 1 minute ago';
    if (diffMinutes < 60) return `Saved ${diffMinutes} minutes ago`;
    
    return `Saved at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            🙏 What is God saying to you?
            <Badge variant="outline">Day {dayNumber}</Badge>
          </CardTitle>
          
          {canEdit && onEdit && (
            <button
              onClick={onEdit}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Edit God's message prompt"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
          
          <div className="flex items-center gap-2">
            {/* Online/Offline indicator */}
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-orange-500" />
            )}
            
            {lastSaved && !saving && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="h-3 w-3" />
                <span>{formatLastSaved(lastSaved)}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          After reading the scripture and reflection, what do you sense God might be saying to you personally?
        </p>
        
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What is God speaking to your heart about this scripture?"
          className="min-h-24 resize-none"
          disabled={saving}
        />
        
        {saveError && (
          <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950 p-2 rounded">
            {saveError}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {content.length} characters
          </div>
          
          <Button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            size="sm"
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
        
        {!isOnline && (
          <div className="text-sm text-orange-600 bg-orange-50 dark:bg-orange-950 p-2 rounded">
            You&apos;re offline. Your entry will be saved locally and synced when you&apos;re back online.
          </div>
        )}
      </CardContent>
    </Card>
  );
}