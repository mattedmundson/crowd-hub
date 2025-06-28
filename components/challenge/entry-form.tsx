'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Save, CheckCircle, Wifi, WifiOff, Clock, Edit2 } from 'lucide-react';

interface EntryFormProps {
  dayNumber: number;
  entryType: 'morning' | 'evening';
  initialValue?: string;
  placeholder?: string;
  onSave: (content: string) => Promise<void>;
  onMarkOffline?: () => Promise<void>;
  isOnline?: boolean;
  canEdit?: boolean;
  onEdit?: () => void;
}

export function EntryForm({
  dayNumber,
  entryType,
  initialValue = '',
  placeholder = "What's on your heart today?",
  onSave,
  onMarkOffline,
  isOnline = true,
  canEdit = false,
  onEdit,
}: EntryFormProps) {
  const [content, setContent] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Update content when initialValue changes
  useEffect(() => {
    setContent(initialValue);
  }, [initialValue]);

  // Manual save function
  const handleManualSave = async () => {
    if (!content.trim()) return;
    
    try {
      setSaving(true);
      setSaveError(null);
      await onSave(content);
      setLastSaved(new Date());
    } catch (error) {
      setSaveError('Failed to save. Please try again.');
      console.error('Manual save error:', error);
    } finally {
      setSaving(false);
    }
  };

  // Handle offline completion
  const handleOfflineComplete = async () => {
    if (!onMarkOffline) return;
    
    try {
      setSaving(true);
      await onMarkOffline();
      setLastSaved(new Date());
    } catch (error) {
      setSaveError('Failed to mark as completed offline.');
      console.error('Offline complete error:', error);
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
            {entryType === 'morning' ? '🌅' : '🌙'} {entryType === 'morning' ? 'Morning' : 'Evening'} Entry
            <Badge variant="outline">Day {dayNumber}</Badge>
          </CardTitle>
          
          {canEdit && onEdit && (
            <button
              onClick={onEdit}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
              title={`Edit ${entryType} prompt`}
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
            
            {/* Save status */}
            {saving && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3 animate-spin" />
                <span>Saving...</span>
              </div>
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
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="min-h-32 resize-none"
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
          
          <div className="flex items-center gap-2">
            {onMarkOffline && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOfflineComplete}
                disabled={saving}
              >
                Done offline
              </Button>
            )}
            
            <Button
              onClick={handleManualSave}
              disabled={saving || !content.trim()}
              size="sm"
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
        
        {!isOnline && (
          <div className="text-sm text-orange-600 bg-orange-50 dark:bg-orange-950 p-2 rounded">
            You&apos;re offline. Your entries will be saved locally and synced when you&apos;re back online.
          </div>
        )}
      </CardContent>
    </Card>
  );
}