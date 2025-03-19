'use client';

import { useEffect, useState } from 'react';

export function Overview() {
  const [displayedGreeting, setDisplayedGreeting] = useState('');
  const [displayedQuestion, setDisplayedQuestion] = useState('');
  const [greetingComplete, setGreetingComplete] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const greeting = 'Hello Brian,';
  const question = 'What can I help you with?';
  
  useEffect(() => {
    let greetingTimer: NodeJS.Timeout;
    let questionTimer: NodeJS.Timeout;
    let greetingIndex = 0;
    let questionIndex = 0;
    
    // Start typing the greeting
    const typeGreeting = () => {
      if (greetingIndex < greeting.length) {
        setDisplayedGreeting(greeting.substring(0, greetingIndex + 1));
        greetingIndex++;
        greetingTimer = setTimeout(typeGreeting, 70); // Adjust typing speed here
      } else {
        // Mark greeting as complete to show cursor on second line
        setGreetingComplete(true);
        
        // After greeting is done, start typing the question
        setTimeout(() => {
          typeQuestion();
        }, 300); // Slight pause before starting the question
      }
    };
    
    // Type the question
    const typeQuestion = () => {
      if (questionIndex < question.length) {
        setDisplayedQuestion(question.substring(0, questionIndex + 1));
        questionIndex++;
        questionTimer = setTimeout(typeQuestion, 50); // Slightly faster typing for question
      } else {
        // Mark animation as complete, but we'll still show the cursor
        setAnimationComplete(true);
      }
    };
    
    // Start the animation
    typeGreeting();
    
    // Cleanup timers on unmount
    return () => {
      clearTimeout(greetingTimer);
      clearTimeout(questionTimer);
    };
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center -mt-60">
      {/* Logo in top right - fixed position to ensure full visibility */}
      <div className="fixed top-4 right-6 z-30">
        <div className="w-32 h-auto">
          {/* Image will render on client side */}
          <img
            src="/images/Hang-Logo-Full-RichBlack.png"
            alt="Hang AI"
            width={128}
            height={38}
            className="w-full h-auto"
          />
        </div>
      </div>

      {/* Centered greeting - positioned to allow proper spacing with input box */}
      <div className="w-full max-w-xl px-6">
        <div className="flex flex-col gap-2 text-left">
          <h1 className="text-3xl md:text-4xl font-medium">
            {displayedGreeting}
            {!greetingComplete && <span className="inline-block animate-blink">|</span>}
          </h1>
          <p className="text-3xl md:text-4xl text-muted-foreground">
            {displayedQuestion}
            {/* Only show cursor on second line after greeting is complete */}
            {greetingComplete && <span className="inline-block animate-blink">|</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
