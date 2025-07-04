'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, BookOpen, Sun, Moon, MessageCircle } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: <BookOpen className="h-16 w-16 text-[#0498db] mx-auto mb-6" />,
      title: "Welcome to Your Journey",
      description: "Each day is designed as a spiritual journey with multiple sections to guide you through reflection and growth.",
      visual: (
        <div className="bg-gray-100 rounded-lg p-6 mt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#21252D] rounded-lg flex items-center justify-center text-white font-bold">1</div>
            <div className="flex-1">
              <div className="font-semibold">Opening Prayer</div>
              <div className="text-sm text-gray-600">Begin with meditation</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <div className="w-12 h-12 bg-[#21252D] rounded-lg flex items-center justify-center text-white font-bold">2</div>
            <div className="flex-1">
              <div className="font-semibold">Scripture</div>
              <div className="text-sm text-gray-600">Read and reflect</div>
            </div>
          </div>
          <div className="mt-3 text-center text-gray-500">...and more</div>
        </div>
      )
    },
    {
      icon: <MessageCircle className="h-16 w-16 text-[#0498db] mx-auto mb-6" />,
      title: "Three Reflection Types",
      description: "Each day includes three types of personal reflection to deepen your spiritual growth.",
      visual: (
        <div className="space-y-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-900">God's Message</span>
            </div>
            <p className="text-sm text-blue-700">What is God revealing to you through today's scripture?</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Sun className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold text-yellow-900">Morning Reflection</span>
            </div>
            <p className="text-sm text-yellow-700">Start your day with gratitude and intention.</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Moon className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-purple-900">Evening Reflection</span>
            </div>
            <p className="text-sm text-purple-700">End your day reflecting on God's goodness.</p>
          </div>
        </div>
      )
    },
    {
      icon: <div className="text-[#0498db] mx-auto mb-6 text-6xl">📱</div>,
      title: "Navigate Your Way",
      description: "Use the navigation icons in the top bar to jump between sections, or scroll naturally through your journey.",
      visual: (
        <div className="bg-[#21252D] rounded-lg p-6 mt-6">
          <div className="flex items-center justify-center gap-6">
            <div className="relative p-3 rounded-full bg-[#7DB9C5]/10">
              <BookOpen className="h-6 w-6 text-[#7DB9C5]" />
              <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                <div className="h-3 w-3 bg-white rounded-full flex items-center justify-center">
                  <div className="h-1 w-1 bg-green-500 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="relative p-3 rounded-full bg-[#7DB9C5]/10">
              <Sun className="h-6 w-6 text-[#7DB9C5]" />
            </div>
            <div className="relative p-3 rounded-full bg-[#7DB9C5]/10">
              <Moon className="h-6 w-6 text-[#7DB9C5]" />
            </div>
          </div>
          <p className="text-[#7DB9C5] text-center mt-4 text-sm">Click icons to navigate • Green checkmarks show completion</p>
        </div>
      )
    },
    {
      icon: <div className="text-[#0498db] mx-auto mb-6 text-6xl">🎯</div>,
      title: "Your Progress Matters",
      description: "Every day you complete builds your spiritual journey. Focus on consistency and growth, not perfection.",
      visual: (
        <div className="mt-6">
          <div className="bg-gray-100 rounded-lg p-6">
            <div className="text-center mb-4">
              <span className="text-2xl font-bold text-[#0498db]">15</span>
              <span className="text-gray-600 ml-2">days completed</span>
            </div>
            <div className="grid grid-cols-10 gap-2">
              {Array.from({ length: 25 }, (_, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-full border-2 ${
                    i < 15 
                      ? 'bg-[#0498db] border-[#0498db]' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-center text-sm text-gray-600 mt-4">Complete days at your own pace</p>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">Getting Started</h2>
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-[#0498db]' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center">
            {currentStepData.icon}
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {currentStepData.title}
            </h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              {currentStepData.description}
            </p>
          </div>
          
          {currentStepData.visual}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <span className="text-sm text-gray-500">
            {currentStep + 1} of {steps.length}
          </span>

          <button
            onClick={nextStep}
            className="flex items-center gap-2 px-6 py-2 bg-[#0498db] text-white rounded-full hover:bg-[#0498db]/90 transition-colors"
          >
            {currentStep === steps.length - 1 ? 'Start Journey' : 'Next'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}