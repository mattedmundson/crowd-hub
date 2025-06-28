'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUserRole } from '@/lib/hooks/useUserRole';

interface PromptData {
  id: string;
  day_number: number;
  scripture_reference: string | null;
  scripture_text: string | null;
  context_text: string | null;
  morning_prompt: string;
  evening_reflection: string | null;
}

export default function EditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role: userRole, loading: roleLoading } = useUserRole();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [promptData, setPromptData] = useState<PromptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDay, setCurrentDay] = useState(1);
  
  // Form state
  const [scriptureReference, setScriptureReference] = useState('');
  const [scriptureText, setScriptureText] = useState('');
  const [contextText, setContextText] = useState('');
  const [morningPrompt, setMorningPrompt] = useState('');
  const [eveningReflection, setEveningReflection] = useState('');

  const day = searchParams.get('day');
  const challengeId = searchParams.get('challengeId');

  useEffect(() => {
    // Wait for userRole to be loaded before checking permissions
    if (roleLoading) {
      return; // Still loading role
    }

    // Check permissions
    if (userRole !== 'admin' && userRole !== 'editor') {
      router.push('/dashboard/gratitude');
      return;
    }

    if (!challengeId) {
      setError('Missing challenge ID');
      setLoading(false);
      return;
    }

    // Set initial day from URL or default to 1
    const initialDay = day ? parseInt(day) : 1;
    setCurrentDay(initialDay);
    loadPromptData(initialDay);
  }, [day, challengeId, userRole, roleLoading]);

  const loadPromptData = async (dayNumber: number) => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('challenge_prompts')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('day_number', dayNumber)
        .single();

      if (error) {
        console.error('Error loading prompt data:', error);
        setError('Failed to load prompt data');
        return;
      }

      setPromptData(data);
      
      // Initialize form fields
      setScriptureReference(data.scripture_reference || '');
      setScriptureText(data.scripture_text || '');
      setContextText(data.context_text || '');
      setMorningPrompt(data.morning_prompt || '');
      setEveningReflection(data.evening_reflection || '');
      
    } catch (error) {
      console.error('Error loading prompt data:', error);
      setError('Failed to load prompt data');
    } finally {
      setLoading(false);
    }
  };

  const handleDayChange = (newDay: number) => {
    if (newDay >= 1 && newDay <= 100) {
      setCurrentDay(newDay);
      loadPromptData(newDay);
      
      // Update URL without page reload
      const url = new URL(window.location.href);
      url.searchParams.set('day', newDay.toString());
      window.history.replaceState({}, '', url);
    }
  };

  const scrollToDay = (day: number) => {
    const container = scrollContainerRef.current;
    if (container) {
      const dayElement = container.querySelector(`[data-day="${day}"]`);
      if (dayElement) {
        dayElement.scrollIntoView({ behavior: 'smooth', inline: 'center' });
      }
    }
  };

  useEffect(() => {
    // Scroll to current day when component mounts or day changes
    setTimeout(() => scrollToDay(currentDay), 100);
  }, [currentDay]);

  const handleSave = async () => {
    if (!promptData) return;

    try {
      setSaving(true);
      setError(null);
      
      const supabase = createClient();
      
      const updateData = {
        scripture_reference: scriptureReference,
        scripture_text: scriptureText,
        context_text: contextText,
        morning_prompt: morningPrompt,
        evening_reflection: eveningReflection,
      };

      const { error } = await supabase
        .from('challenge_prompts')
        .update(updateData)
        .eq('id', promptData.id);

      if (error) {
        console.error('Error saving prompt data:', error);
        setError('Failed to save changes');
        return;
      }

      // Show success feedback (could add a toast here)
      setError(null);
      
    } catch (error) {
      console.error('Error saving prompt data:', error);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const renderDayCircles = () => {
    const days = Array.from({ length: 100 }, (_, i) => i + 1);
    
    return (
      <div 
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {days.map((day) => (
          <button
            key={day}
            data-day={day}
            onClick={() => handleDayChange(day)}
            className={`flex-shrink-0 w-12 h-12 rounded-full border-2 font-semibold transition-all ${
              day === currentDay
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-border hover:border-primary/50'
            }`}
          >
            {day}
          </button>
        ))}
      </div>
    );
  };

  if (loading || roleLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error && !promptData) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center gap-2 text-red-600 mb-4">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
        <Button onClick={() => router.push('/dashboard/gratitude/today')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Today
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard/gratitude/today')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold">Edit Challenge Content</h1>
            <p className="text-muted-foreground">
              Day {currentDay} of 100 - Edit all content for this day
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {userRole?.toUpperCase()}
          </Badge>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>

      {/* Day Navigation */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <h3 className="text-lg font-semibold">Select Day</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDayChange(currentDay - 1)}
              disabled={currentDay <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium">Day {currentDay}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDayChange(currentDay + 1)}
              disabled={currentDay >= 100}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {renderDayCircles()}
      </div>

      {/* Content Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Column 1: Scripture (Red) */}
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-800 dark:text-red-200 flex items-center gap-2">
              📖 Scripture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-red-700 dark:text-red-300">
                Reference
              </label>
              <Input
                value={scriptureReference}
                onChange={(e) => setScriptureReference(e.target.value)}
                placeholder="e.g., Philippians 4:13"
                className="bg-white dark:bg-red-950/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-red-700 dark:text-red-300">
                Bible Verse
              </label>
              <Textarea
                value={scriptureText}
                onChange={(e) => setScriptureText(e.target.value)}
                placeholder="Enter the scripture text..."
                className="min-h-32 bg-white dark:bg-red-950/30"
              />
            </div>
          </CardContent>
        </Card>

        {/* Column 2: Context */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center gap-2">
              📝 Context
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium mb-1 text-blue-700 dark:text-blue-300">
                Understanding the Context
              </label>
              <Textarea
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                placeholder="Provide context for understanding the scripture..."
                className="min-h-48 bg-white dark:bg-blue-950/30"
              />
            </div>
          </CardContent>
        </Card>

        {/* Column 3: Morning Prompt */}
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2">
              🌅 Morning Prompt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium mb-1 text-amber-700 dark:text-amber-300">
                Morning Reflection
              </label>
              <Textarea
                value={morningPrompt}
                onChange={(e) => setMorningPrompt(e.target.value)}
                placeholder="Enter the morning reflection prompt..."
                className="min-h-48 bg-white dark:bg-amber-950/30"
              />
            </div>
          </CardContent>
        </Card>

        {/* Column 4: Evening Prompt */}
        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-purple-800 dark:text-purple-200 flex items-center gap-2">
              🌙 Evening Prompt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium mb-1 text-purple-700 dark:text-purple-300">
                Evening Reflection
              </label>
              <Textarea
                value={eveningReflection}
                onChange={(e) => setEveningReflection(e.target.value)}
                placeholder="Enter the evening reflection prompt..."
                className="min-h-48 bg-white dark:bg-purple-950/30"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-6 flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950 p-3 rounded border border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Mobile Save Button */}
      <div className="mt-6 md:hidden">
        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>
    </div>
  );
}