'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, BookOpen, Users } from 'lucide-react';

interface ChallengeCardProps {
  title: string;
  description: string;
  totalDays: number;
  category: string;
  participantCount?: number;
  onStart?: () => void;
  isActive?: boolean;
}

export function ChallengeCard({
  title,
  description,
  totalDays,
  category,
  participantCount,
  onStart,
  isActive = true,
}: ChallengeCardProps) {
  return (
    <Card className={`cursor-pointer transition-all hover:shadow-md ${!isActive ? 'opacity-60' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{title}</CardTitle>
          <Badge variant="secondary" className="capitalize">
            {category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground leading-relaxed">{description}</p>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{totalDays} days</span>
          </div>
          
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>Daily reflection</span>
          </div>
          
          {participantCount && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{participantCount.toLocaleString()} participants</span>
            </div>
          )}
        </div>
        
        {onStart && isActive && (
          <button
            onClick={onStart}
            className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md font-medium transition-colors"
          >
            Start Challenge
          </button>
        )}
        
        {!isActive && (
          <div className="text-center py-2 text-muted-foreground">
            Challenge not available
          </div>
        )}
      </CardContent>
    </Card>
  );
}