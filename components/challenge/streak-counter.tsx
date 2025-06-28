'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Trophy, Target } from 'lucide-react';

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  totalDaysCompleted: number;
  currentDay: number;
  completionRate: number;
  variant?: 'compact' | 'detailed';
}

export function StreakCounter({
  currentStreak,
  longestStreak,
  totalDaysCompleted,
  currentDay,
  completionRate,
  variant = 'detailed',
}: StreakCounterProps) {
  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-red-500';
    if (streak >= 14) return 'text-orange-500';
    if (streak >= 7) return 'text-yellow-500';
    return 'text-blue-500';
  };

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return 'Start your streak today!';
    if (streak === 1) return 'Great start!';
    if (streak < 7) return 'Building momentum!';
    if (streak < 14) return 'One week strong!';
    if (streak < 30) return 'Amazing consistency!';
    return 'Incredible dedication!';
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Flame className={`h-5 w-5 ${getStreakColor(currentStreak)}`} />
          <span className="font-semibold">{currentStreak}</span>
          <span className="text-sm text-muted-foreground">day streak</span>
        </div>
        
        <Badge variant="outline" className="text-xs">
          {Math.round(completionRate * 100)}% complete
        </Badge>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Current Streak */}
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Flame className={`h-8 w-8 ${getStreakColor(currentStreak)}`} />
          </div>
          <div className="text-2xl font-bold">{currentStreak}</div>
          <div className="text-sm text-muted-foreground">Current Streak</div>
          <div className="text-xs text-muted-foreground mt-1">
            {getStreakMessage(currentStreak)}
          </div>
        </CardContent>
      </Card>

      {/* Longest Streak */}
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold">{longestStreak}</div>
          <div className="text-sm text-muted-foreground">Best Streak</div>
          <div className="text-xs text-muted-foreground mt-1">
            {longestStreak === currentStreak && currentStreak > 0 
              ? 'Personal record!' 
              : 'Keep going!'}
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Target className="h-8 w-8 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{Math.round(completionRate * 100)}%</div>
          <div className="text-sm text-muted-foreground">Complete</div>
          <div className="text-xs text-muted-foreground mt-1">
            {totalDaysCompleted} of {currentDay} days
          </div>
        </CardContent>
      </Card>
    </div>
  );
}