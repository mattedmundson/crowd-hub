'use client';

import React from 'react';

interface HundredDayGridProps {
  completedChallenges: number[]; // Array of completed challenge numbers (e.g., [1, 2, 3, 5, 6])
  currentChallenge?: number; // Current challenge number (optional, for highlighting)
  totalChallenges?: number; // Total challenges in this theme (defaults to 100)
  size?: 'small' | 'medium' | 'large';
}

export function HundredDayGrid({ 
  completedChallenges = [], 
  currentChallenge,
  totalChallenges = 100,
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
  
  // Calculate grid dimensions based on total challenges
  const gridSize = Math.ceil(Math.sqrt(totalChallenges));
  const totalWidth = (config.circle * gridSize) + (config.gap * (gridSize - 1));
  const totalHeight = totalWidth; // Square grid
  
  // Create array of challenges 1 to totalChallenges
  const challenges = Array.from({ length: totalChallenges }, (_, i) => i + 1);
  
  // Check if a challenge is completed
  const isChallengeCompleted = (challenge: number) => {
    return completedChallenges.includes(challenge);
  };
  
  // Get position for a challenge (1-based)
  const getChallengePosition = (challenge: number) => {
    const index = challenge - 1; // Convert to 0-based
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    const x = col * (config.circle + config.gap) + (config.circle / 2);
    const y = row * (config.circle + config.gap) + (config.circle / 2);
    return { x, y };
  };
  
  // Find consecutive streaks
  const getStreaks = () => {
    const sortedChallenges = [...completedChallenges].sort((a, b) => a - b);
    const streaks: number[][] = [];
    let currentStreak: number[] = [];
    
    for (let i = 0; i < sortedChallenges.length; i++) {
      const challenge = sortedChallenges[i];
      
      if (currentStreak.length === 0) {
        currentStreak = [challenge];
      } else if (challenge === currentStreak[currentStreak.length - 1] + 1) {
        currentStreak.push(challenge);
      } else {
        if (currentStreak.length > 1) {
          streaks.push([...currentStreak]);
        }
        currentStreak = [challenge];
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
        const fromChallenge = streak[i];
        const toChallenge = streak[i + 1];
        const fromPos = getChallengePosition(fromChallenge);
        const toPos = getChallengePosition(toChallenge);
        
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
        
        {/* Challenge circles */}
        {challenges.map((challenge) => {
          const position = getChallengePosition(challenge);
          const isCompleted = isChallengeCompleted(challenge);
          const isCurrent = challenge === currentChallenge;
          
          return (
            <g key={challenge}>
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