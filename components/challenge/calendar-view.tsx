'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, CheckCircle, Circle, Clock, Calendar as CalendarIcon } from 'lucide-react';
import type { CalendarDay } from '@/lib/services/progress';

interface CalendarViewProps {
  calendarData: CalendarDay[];
  currentMonth?: string;
  onDayClick?: (day: CalendarDay) => void;
  onMonthChange?: (month: string) => void;
}

export function CalendarView({
  calendarData,
  currentMonth,
  onDayClick,
  onMonthChange,
}: CalendarViewProps) {
  const [selectedMonth, setSelectedMonth] = useState(
    currentMonth || new Date().toISOString().slice(0, 7)
  );

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedMonth + '-01');
    const newDate = new Date(currentDate);
    
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    
    const newMonth = newDate.toISOString().slice(0, 7);
    setSelectedMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const getStatusIcon = (status: CalendarDay['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'today':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'missed':
        return <Circle className="h-4 w-4 text-red-300" />;
      case 'future':
        return <Circle className="h-4 w-4 text-gray-300" />;
      default:
        return <Circle className="h-4 w-4 text-gray-300" />;
    }
  };

  const getStatusColor = (status: CalendarDay['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 hover:bg-green-100 dark:bg-green-950 dark:border-green-800';
      case 'today':
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-950 dark:border-blue-800';
      case 'missed':
        return 'bg-red-50 border-red-200 hover:bg-red-100 dark:bg-red-950 dark:border-red-800';
      case 'future':
        return 'bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800';
    }
  };

  const formatMonthYear = (monthString: string) => {
    const date = new Date(monthString + '-01');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDaysInMonth = () => {
    const date = new Date(selectedMonth + '-01');
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Get first day of month and last day
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of week for first day (0 = Sunday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Create array of all days to display (including padding)
    const days = [];
    
    // Add padding days from previous month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = calendarData.find(d => d.date === dateString);
      days.push(dayData || null);
    }
    
    return days;
  };

  const days = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Challenge Calendar
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMonthChange('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="min-w-40 text-center font-medium">
              {formatMonthYear(selectedMonth)}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMonthChange('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-blue-500" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1">
            <Circle className="h-4 w-4 text-red-300" />
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-1">
            <Circle className="h-4 w-4 text-gray-300" />
            <span>Future</span>
          </div>
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Week day headers */}
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {days.map((day, index) => (
            <div key={index} className="aspect-square">
              {day ? (
                <button
                  onClick={() => onDayClick?.(day)}
                  className={`w-full h-full p-1 rounded-lg border transition-colors ${getStatusColor(day.status)} ${
                    onDayClick ? 'cursor-pointer' : 'cursor-default'
                  }`}
                  disabled={day.status === 'future'}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="text-xs font-medium mb-1">
                      {new Date(day.date).getDate()}
                    </div>
                    {getStatusIcon(day.status)}
                    {day.day_number && (
                      <Badge variant="outline" className="text-xs mt-1 px-1 py-0">
                        {day.day_number}
                      </Badge>
                    )}
                  </div>
                </button>
              ) : (
                <div className="w-full h-full" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}