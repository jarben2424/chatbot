'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface WelcomeAnimationProps {
  onComplete?: () => void;
  closeSidePanel?: () => void;
}

export function WelcomeAnimation({ onComplete, closeSidePanel }: WelcomeAnimationProps) {
  const [displayText, setDisplayText] = useState('');
  const [isFading, setIsFading] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const { resolvedTheme } = useTheme();
  
  const phrases = [
    "I'm your personal agent assistant",
    "Let me know how I can be of service"
  ];
  
  // Track if we've already called closeSidePanel
  const sidePanelClosedRef = useRef(false);

  // Handle typing animation
  useEffect(() => {
    // Close the sidebar when animation starts
    if (closeSidePanel && !sidePanelClosedRef.current) {
      closeSidePanel();
      sidePanelClosedRef.current = true;
    }
    
    let currentPhraseIndex = 0;
    let currentCharIndex = 0;
    let timerId: NodeJS.Timeout;
    
    const typeNextCharacter = () => {
      if (currentPhraseIndex >= phrases.length) {
        // All phrases typed, wait then fade out
        timerId = setTimeout(() => {
          setIsFading(true);
          setAnimationComplete(true);
          if (onComplete) {
            timerId = setTimeout(onComplete, 500); // Call onComplete after fade animation
          }
        }, 2000);
        return;
      }
      
      const currentPhrase = phrases[currentPhraseIndex];
      
      if (currentCharIndex <= currentPhrase.length) {
        setDisplayText(currentPhrase.substring(0, currentCharIndex));
        currentCharIndex++;
        timerId = setTimeout(typeNextCharacter, 50); // Speed of typing
      } else {
        // End of phrase reached
        if (currentPhraseIndex < phrases.length - 1) {
          // Move to next phrase after a pause
          currentPhraseIndex++;
          currentCharIndex = 0;
          timerId = setTimeout(typeNextCharacter, 1000); // Pause between phrases
        } else {
          // All phrases completed
          timerId = setTimeout(() => {
            setIsFading(true);
            setAnimationComplete(true);
            if (onComplete) {
              timerId = setTimeout(onComplete, 500);
            }
          }, 2000);
        }
      }
    };
    
    // Start typing animation
    timerId = setTimeout(typeNextCharacter, 500); // Small initial delay
    
    // Listen for user input in multiple possible chat inputs
    // Adjusting to look for various chat input selectors common in the codebase
    const possibleChatInputs = [
      document.getElementById('chat-input'),
      document.querySelector('textarea[placeholder*="message"]'),
      document.querySelector('input[placeholder*="message"]'),
      document.querySelector('.chat-input'),
      document.querySelector('[data-testid="chat-input"]'),
      document.querySelector('textarea[name="chat-input"]')
    ];
    
    const handleInput = () => {
      if (!animationComplete) {
        setIsFading(true);
        setAnimationComplete(true);
        if (onComplete) {
          setTimeout(onComplete, 500);
        }
      }
    };
    
    // Add input listeners to all possible chat inputs
    possibleChatInputs.forEach(input => {
      if (input) {
        input.addEventListener('input', handleInput);
      }
    });
    
    // Cleanup
    return () => {
      clearTimeout(timerId);
      possibleChatInputs.forEach(input => {
        if (input) {
          input.removeEventListener('input', handleInput);
        }
      });
    };
  }, [phrases, onComplete, closeSidePanel, animationComplete]);
  
  // If animation is complete and faded out, don't render anything
  if (animationComplete && isFading) {
    return null;
  }
  
  return (
    <div className={cn(
      "absolute left-1/2 transform -translate-x-1/2 text-center transition-opacity duration-500 z-10",
      "mt-2", // Adjusted spacing to be closer to the logo
      isFading ? "opacity-0" : "opacity-100"
    )}>
      <p className={cn(
        "text-lg font-medium whitespace-pre-wrap max-w-md px-4",
        // Using the project's text color system
        resolvedTheme === 'dark' ? "text-white" : "text-gray-800"
      )}>
        {displayText}
      </p>
    </div>
  );
} 