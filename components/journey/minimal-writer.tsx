'use client';

import { useState, useEffect, useRef } from 'react';
import { Save, ChevronDown } from 'lucide-react';

interface MinimalWriterProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => Promise<void>;
  onNext?: () => void;
  placeholder?: string;
}

export function MinimalWriter({ 
  value, 
  onChange, 
  onSave,
  onNext,
  placeholder = "Start writing..."
}: MinimalWriterProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [initialValue, setInitialValue] = useState(value);
  const [hasExistingContent, setHasExistingContent] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Set initial state
  useEffect(() => {
    setInitialValue(value);
    setHasExistingContent(!!value.trim());
  }, []);

  // Track changes to show save icon
  useEffect(() => {
    // Only show unsaved changes if the value differs from initial
    const hasChanged = value !== initialValue;
    setHasUnsavedChanges(hasChanged);
    
    // If we have changes, we're not in saved state
    if (hasChanged) {
      setIsSaved(false);
    }
  }, [value, initialValue]);

  // Auto-focus on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      adjustTextareaHeight();
    }
  }, []);

  // Auto-resize textarea based on content
  useEffect(() => {
    adjustTextareaHeight();
  }, [value]);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      // Set height to scrollHeight to fit all content
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSave = async () => {
    if (!hasUnsavedChanges || isSaving) return;
    
    setIsSaving(true);
    try {
      await onSave();
      setHasUnsavedChanges(false);
      setIsSaved(true);
      setInitialValue(value); // Update initial value after save
      setHasExistingContent(true);
      
      // Don't reset saved state - keep showing arrow
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  const getSaveIcon = () => {
    if (isSaving) {
      return <Save className="h-6 w-6 animate-pulse" />;
    }
    
    // Show arrow if:
    // 1. Content exists and no unsaved changes, OR
    // 2. Just saved
    if ((hasExistingContent && !hasUnsavedChanges) || isSaved) {
      return <ChevronDown className="h-6 w-6" />;
    }
    
    // Show save icon when there are unsaved changes
    return <Save className="h-6 w-6" />;
  };

  const getSaveButtonState = () => {
    if (isSaving) return 'opacity-50 cursor-not-allowed';
    if (isSaved) return 'text-green-500';
    if (hasUnsavedChanges) return 'text-primary hover:text-primary/80';
    if (hasExistingContent) return 'text-muted-foreground hover:text-foreground'; // Arrow state
    return 'text-gray-400';
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-4xl space-y-8">
        {/* Writing Area */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={12}
          className={`
            w-full resize-none overflow-hidden
            bg-transparent border-none outline-none
            text-2xl md:text-3xl leading-relaxed
            font-light text-[#0498db] placeholder-gray-400/50
            caret-[#0498db]
            selection:bg-[#0498db]/20
            ${value ? '' : 'animate-pulse-cursor'}
          `}
          style={{
            lineHeight: '1.6',
            fontFamily: 'inherit'
          }}
        />
        
        {/* Save/Next Button - At end of content */}
        <div className="flex justify-center pt-8">
          <button
            onClick={() => {
              // If showing arrow, handle navigation
              if ((hasExistingContent && !hasUnsavedChanges) || isSaved) {
                onNext?.();
              } else if (hasUnsavedChanges) {
                handleSave();
              }
            }}
            disabled={isSaving || (!hasUnsavedChanges && !hasExistingContent)}
            className={`
              p-4 rounded-full transition-all duration-300
              bg-white/10 backdrop-blur-sm border border-white/20
              hover:bg-white/20 hover:scale-110
              ${getSaveButtonState()}
              ${((hasExistingContent && !hasUnsavedChanges) || isSaved) ? 'hover:animate-bounce' : ''}
            `}
            title={
              isSaving ? 'Saving...' : 
              isSaved ? 'Continue' : 
              hasUnsavedChanges ? 'Save (⌘+S)' : 
              hasExistingContent ? 'Continue' :
              'No changes'
            }
          >
            {getSaveIcon()}
          </button>
        </div>
      </div>

      {/* Custom CSS for flashing cursor animation */}
      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        .animate-pulse-cursor::placeholder {
          animation: blink 1s infinite;
        }
      `}</style>
    </div>
  );
}