'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Quote, Edit2 } from 'lucide-react';

interface PromptDisplayProps {
  dayNumber: number;
  isReviewDay?: boolean;
  scriptureReference?: string | null;
  scriptureText?: string | null;
  contextText?: string | null;
  morningPrompt: string;
  eveningReflection?: string | null;
  showEvening?: boolean;
  canEdit?: boolean;
  onEdit?: (type: string) => void;
}

export function PromptDisplay({
  dayNumber,
  isReviewDay = false,
  scriptureReference,
  scriptureText,
  contextText,
  morningPrompt,
  eveningReflection,
  showEvening = false,
  canEdit = false,
  onEdit,
}: PromptDisplayProps) {
  if (isReviewDay) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              <BookOpen className="h-3 w-3 mr-1" />
              Week {Math.ceil(dayNumber / 7)} Review
            </Badge>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
              Time for Weekly Reflection
            </h3>
            <p className="text-amber-800 dark:text-amber-200 leading-relaxed">
              {morningPrompt}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Scripture Section */}
      {scriptureReference && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 relative">
          <CardContent className="p-6">
            {canEdit && onEdit && (
              <button
                onClick={() => onEdit('scripture')}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
                title="Edit scripture"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <Quote className="h-3 w-3 mr-1" />
                {scriptureReference}
              </Badge>
            </div>
            
            {scriptureText && (
              <blockquote className="text-blue-900 dark:text-blue-100 font-medium leading-relaxed mb-4 pl-4 border-l-4 border-blue-300 dark:border-blue-700">
                {scriptureText.split('\n').map((paragraph, index) => (
                  <p key={index} className={index > 0 ? 'mt-3' : ''}>
                    {paragraph}
                  </p>
                ))}
              </blockquote>
            )}
            
            {contextText && (
              <div className="text-blue-800 dark:text-blue-200 leading-relaxed text-sm">
                {contextText.split('\n').map((paragraph, index) => (
                  <p key={index} className={index > 0 ? 'mt-2' : ''}>
                    {paragraph}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Morning Prompt */}
      <Card className="relative">
        <CardContent className="p-6">
          {canEdit && onEdit && (
            <button
              onClick={() => onEdit('morning')}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Edit morning prompt"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline">
              Morning Reflection
            </Badge>
          </div>
          
          <div className="text-foreground leading-relaxed text-lg">
            {morningPrompt.split('\n').map((paragraph, index) => (
              <p key={index} className={index > 0 ? 'mt-3' : ''}>
                {paragraph}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Evening Reflection */}
      {showEvening && eveningReflection && (
        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800 relative">
          <CardContent className="p-6">
            {canEdit && onEdit && (
              <button
                onClick={() => onEdit('evening')}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
                title="Edit evening reflection"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                Evening Reflection
              </Badge>
            </div>
            
            <div className="text-purple-900 dark:text-purple-100 leading-relaxed">
              {eveningReflection.split('\n').map((paragraph, index) => (
                <p key={index} className={index > 0 ? 'mt-3' : ''}>
                  {paragraph}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}