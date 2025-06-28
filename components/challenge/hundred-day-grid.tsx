'use client';

import React from 'react';

interface HundredDayGridProps {
  completedDays: number[]; // Array of completed day numbers (e.g., [1, 2, 3, 5, 6])
  currentDay?: number; // Current day (optional, for highlighting)
  size?: 'small' | 'medium' | 'large';
}

export function HundredDayGrid({ 
  completedDays = [], 
  currentDay,
  size = 'medium' 
}: HundredDayGridProps) {
  const brandBlue = '#0498db';
  
  // Size configurations
  const sizeConfig = {
    small: {
      circle: 20,
      gap: 8,
      strokeWidth: 1.5,
      fontSize: '10px'
    },
    medium: {
      circle: 30,
      gap: 10,
      strokeWidth: 2,
      fontSize: '12px'
    },
    large: {
      circle: 40,
      gap: 12,
      strokeWidth: 2.5,
      fontSize: '14px'
    }
  };
  
  const config = sizeConfig[size];
  const gridSize = 10;
  const totalWidth = (config.circle * gridSize) + (config.gap * (gridSize - 1));
  const totalHeight = totalWidth; // Square grid
  
  // Create array of days 1-100
  const days = Array.from({ length: 100 }, (_, i) => i + 1);
  
  // Check if a day is completed
  const isDayCompleted = (day: number) => {
    console.log('Checking day', day, 'in completedDays:', completedDays);
    return completedDays.includes(day);
  };
  
  // Get position for a day (1-based)
  const getDayPosition = (day: number) => {
    const index = day - 1; // Convert to 0-based
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    const x = col * (config.circle + config.gap) + (config.circle / 2);
    const y = row * (config.circle + config.gap) + (config.circle / 2);
    return { x, y };
  };
  
  // Find consecutive streaks
  const getStreaks = () => {
    const sortedDays = [...completedDays].sort((a, b) => a - b);
    const streaks: number[][] = [];
    let currentStreak: number[] = [];
    
    for (let i = 0; i < sortedDays.length; i++) {
      const day = sortedDays[i];
      
      if (currentStreak.length === 0) {
        currentStreak = [day];
      } else if (day === currentStreak[currentStreak.length - 1] + 1) {
        currentStreak.push(day);
      } else {
        if (currentStreak.length > 1) {
          streaks.push([...currentStreak]);
        }
        currentStreak = [day];
      }
    }
    
    // Don't forget the last streak
    if (currentStreak.length > 1) {
      streaks.push(currentStreak);
    }
    
    return streaks;
  };
  
  const streaks = getStreaks();
  
  // Generate streak lines
  const generateStreakLines = () => {
    const lines: JSX.Element[] = [];
    
    streaks.forEach((streak, streakIndex) => {
      for (let i = 0; i < streak.length - 1; i++) {
        const fromDay = streak[i];
        const toDay = streak[i + 1];
        const fromPos = getDayPosition(fromDay);
        const toPos = getDayPosition(toDay);
        
        lines.push(
          <line
            key={`streak-${streakIndex}-${i}`}
            x1={fromPos.x}
            y1={fromPos.y}
            x2={toPos.x}
            y2={toPos.y}
            stroke={brandBlue}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
          />
        );
      }
    });
    
    return lines;
  };
  
  return (
    <div className="flex items-center justify-center">
      <svg 
        width={totalWidth} 
        height={totalHeight}
        className="overflow-visible"
      >
        {/* Streak lines (drawn first, behind circles) */}
        {generateStreakLines()}
        
        {/* Day circles */}
        {days.map((day) => {
          const position = getDayPosition(day);
          const isCompleted = isDayCompleted(day);
          const isCurrent = day === currentDay;
          
          return (
            <g key={day}>
              {/* Circle */}
              <circle
                cx={position.x}
                cy={position.y}
                r={config.circle / 2}
                fill={isCompleted ? brandBlue : 'white'}
                stroke={brandBlue}
                strokeWidth={isCurrent ? config.strokeWidth * 1.5 : config.strokeWidth}
                className="transition-all duration-300"
              />
              
              
            </g>
          );
        })}
      </svg>
    </div>
  );
}