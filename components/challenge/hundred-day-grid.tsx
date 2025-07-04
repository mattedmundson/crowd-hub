'use client';

import React from 'react';

interface HundredDayGridProps {
  completedDays: number[]; // Array of completed day numbers (e.g., [1, 2, 3, 5, 6])
  currentDay?: number; // Current day number (optional, for highlighting)
  totalChallenges?: number; // Total challenges in this theme (defaults to 100)
  size?: 'small' | 'medium' | 'large';
  showReviews?: boolean; // Whether to show review days
}

export function HundredDayGrid({ 
  completedDays = [], 
  currentDay,
  totalChallenges = 100,
  size = 'medium',
  showReviews = true
}: HundredDayGridProps) {
  const brandBlue = '#0498db';
  const reviewColor = '#7DB9C5'; // Lighter blue for review days
  
  // Size configurations
  const sizeConfig = {
    small: {
      circle: 16,
      gap: 6,
      strokeWidth: 1.5,
      fontSize: '10px'
    },
    medium: {
      circle: 24,
      gap: 8,
      strokeWidth: 2,
      fontSize: '12px'
    },
    large: {
      circle: 32,
      gap: 10,
      strokeWidth: 2.5,
      fontSize: '14px'
    }
  };
  
  const config = sizeConfig[size];
  
  // Calculate total elements including review days
  const reviewInterval = 5;
  const numberOfReviews = showReviews ? Math.floor(totalChallenges / reviewInterval) : 0;
  const totalElements = totalChallenges + numberOfReviews;
  
  // Create array of all elements (challenges + reviews)
  const elements: Array<{ type: 'challenge' | 'review', challengeNumber?: number, dayNumber: number }> = [];
  let challengeCount = 0;
  let dayCount = 1;
  
  while (challengeCount < totalChallenges) {
    // Add 5 challenges (or remaining challenges)
    const challengesInThisBlock = Math.min(reviewInterval, totalChallenges - challengeCount);
    for (let i = 0; i < challengesInThisBlock; i++) {
      challengeCount++;
      elements.push({ 
        type: 'challenge', 
        challengeNumber: challengeCount, 
        dayNumber: dayCount++ 
      });
    }
    
    // Add review day if we have more challenges and reviews are enabled
    if (showReviews && challengeCount < totalChallenges && challengeCount % reviewInterval === 0) {
      elements.push({ 
        type: 'review', 
        dayNumber: dayCount++ 
      });
    }
  }
  
  // Calculate grid dimensions
  const gridColumns = 6; // 5 challenges + 1 review = perfect visual grouping per row
  const totalRows = Math.ceil(elements.length / gridColumns);
  
  // Split elements for two-column desktop layout
  const leftColumnRows = Math.ceil(totalRows / 2);
  const rightColumnRows = totalRows - leftColumnRows;
  
  const leftElements = elements.slice(0, leftColumnRows * gridColumns);
  const rightElements = elements.slice(leftColumnRows * gridColumns);
  
  const singleGridWidth = (config.circle * gridColumns) + (config.gap * (gridColumns - 1));
  const leftGridHeight = (config.circle * leftColumnRows) + (config.gap * (leftColumnRows - 1));
  const rightGridHeight = rightElements.length > 0 ? (config.circle * rightColumnRows) + (config.gap * (rightColumnRows - 1)) : 0;
  
  // Check if a day is completed
  const isDayCompleted = (dayNumber: number) => {
    return completedDays.includes(dayNumber);
  };
  
  // Create grid component
  const createGrid = (gridElements: typeof elements, offsetIndex: number = 0) => {
    const gridRows = Math.ceil(gridElements.length / gridColumns);
    const gridHeight = (config.circle * gridRows) + (config.gap * (gridRows - 1));
    
    // Get position for an element within this specific grid
    const getElementPosition = (index: number) => {
      const row = Math.floor(index / gridColumns);
      const col = index % gridColumns;
      const x = col * (config.circle + config.gap) + (config.circle / 2);
      const y = row * (config.circle + config.gap) + (config.circle / 2);
      return { x, y };
    };
    
    // Find consecutive streaks for this grid only
    const getStreaks = () => {
      const elementDays = gridElements.map(el => el.dayNumber);
      const relevantCompletedDays = completedDays.filter(day => elementDays.includes(day));
      const sortedDays = [...relevantCompletedDays].sort((a, b) => a - b);
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
    
    // Generate streak lines for this grid
    const generateStreakLines = () => {
      const lines: JSX.Element[] = [];
      
      streaks.forEach((streak, streakIndex) => {
        for (let i = 0; i < streak.length - 1; i++) {
          const fromDay = streak[i];
          const toDay = streak[i + 1];
          
          // Find indices of these days in our grid elements array
          const fromIndex = gridElements.findIndex(el => el.dayNumber === fromDay);
          const toIndex = gridElements.findIndex(el => el.dayNumber === toDay);
          
          if (fromIndex !== -1 && toIndex !== -1) {
            const fromPos = getElementPosition(fromIndex);
            const toPos = getElementPosition(toIndex);
            
            lines.push(
              <line
                key={`streak-${streakIndex}-${i}-${offsetIndex}`}
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
        }
      });
      
      return lines;
    };
    
    return (
      <svg 
        width={singleGridWidth} 
        height={gridHeight}
        className="overflow-visible"
      >
        {/* Streak lines (drawn first, behind circles) */}
        {generateStreakLines()}
        
        {/* Element circles */}
        {gridElements.map((element, index) => {
          const position = getElementPosition(index);
          const isCompleted = isDayCompleted(element.dayNumber);
          const isCurrent = element.dayNumber === currentDay;
          const isReview = element.type === 'review';
          
          return (
            <g key={`element-${offsetIndex}-${index}`}>
              {/* Challenge day: Circle, Review day: Rounded rectangle */}
              {isReview ? (
                <rect
                  x={position.x - (config.circle / 2)}
                  y={position.y - (config.circle / 2)}
                  width={config.circle}
                  height={config.circle}
                  rx={config.circle / 4}
                  ry={config.circle / 4}
                  fill={isCompleted ? reviewColor : 'white'}
                  stroke={reviewColor}
                  strokeWidth={isCurrent ? config.strokeWidth * 1.5 : config.strokeWidth}
                  className="transition-all duration-300"
                />
              ) : (
                <circle
                  cx={position.x}
                  cy={position.y}
                  r={config.circle / 2}
                  fill={isCompleted ? brandBlue : 'white'}
                  stroke={brandBlue}
                  strokeWidth={isCurrent ? config.strokeWidth * 1.5 : config.strokeWidth}
                  className="transition-all duration-300"
                />
              )}
            </g>
          );
        })}
      </svg>
    );
  };
  
  return (
    <div className="flex items-center justify-center">
      {/* Mobile: Single column */}
      <div className="block md:hidden">
        {createGrid(elements)}
      </div>
      
      {/* Desktop: Two columns */}
      <div className="hidden md:flex gap-10 items-start">
        <div className="flex-shrink-0">
          {createGrid(leftElements, 0)}
        </div>
        {rightElements.length > 0 && (
          <div className="flex-shrink-0">
            {createGrid(rightElements, leftElements.length)}
          </div>
        )}
      </div>
    </div>
  );
}