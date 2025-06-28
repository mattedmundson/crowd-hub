'use client';

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface ProgressBarProps {
  currentDay: number;
  totalDays: number;
  completedDays: number;
  showDetails?: boolean;
  className?: string;
}

export function ProgressBar({
  currentDay,
  totalDays = 100,
  completedDays,
  showDetails = true,
  className = '',
}: ProgressBarProps) {
  const progressPercentage = Math.round((currentDay / totalDays) * 100);
  const completionRate = Math.round((completedDays / currentDay) * 100);
  const daysRemaining = Math.max(0, totalDays - currentDay + 1);
  

  return (
    <div className={`space-y-3 ${className}`}>
      {showDetails && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Day {currentDay} of {totalDays}
            </Badge>
            <span className="text-muted-foreground">
              {daysRemaining} days remaining
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {completedDays} completed
            </span>
            <Badge variant={completionRate >= 80 ? 'default' : 'secondary'}>
              {completionRate}% rate
            </Badge>
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <Progress 
          value={progressPercentage} 
          className="h-3"
        />
        
        {showDetails && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Started</span>
            <span className="font-medium">{progressPercentage}% through journey</span>
            <span>Complete</span>
          </div>
        )}
      </div>
      
      {showDetails && currentDay >= 100 && (
        <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-green-800 dark:text-green-200 font-semibold">
            🎉 Congratulations! You&apos;ve completed the 100-day challenge!
          </div>
          <div className="text-green-600 dark:text-green-400 text-sm mt-1">
            {completedDays} days of gratitude practice - what an achievement!
          </div>
        </div>
      )}
    </div>
  );
}