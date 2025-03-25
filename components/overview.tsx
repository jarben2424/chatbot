import React, { useEffect, useState } from 'react';

export const Overview = () => {
  const [greeting, setGreeting] = useState('');
  const [question, setQuestion] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [typingComplete, setTypingComplete] = useState(false);
  const [hideCursorCompletely, setHideCursorCompletely] = useState(false);
  
  // Text to be typed
  const greetingText = 'Hello Ethan,';
  const questionText = 'What can I help you with?';
  
  // Typing animation effect
  useEffect(() => {
    // Type out greeting first
    let greetingIndex = 0;
    const typeGreeting = setInterval(() => {
      if (greetingIndex <= greetingText.length) {
        setGreeting(greetingText.slice(0, greetingIndex));
        greetingIndex++;
      } else {
        clearInterval(typeGreeting);
        
        // Start typing question with delay
        setTimeout(() => {
          let questionIndex = 0;
          const typeQuestion = setInterval(() => {
            if (questionIndex <= questionText.length) {
              setQuestion(questionText.slice(0, questionIndex));
              questionIndex++;
            } else {
              clearInterval(typeQuestion);
              setTypingComplete(true);
              
              // Add a short 200ms delay before hiding the cursor
              setTimeout(() => {
                setHideCursorCompletely(true);
              }, 200);
            }
          }, 60);
          
          return () => clearInterval(typeQuestion);
        }, 400);
      }
    }, 60);
    
    return () => clearInterval(typeGreeting);
  }, []);
  
  return (
    <div className="flex items-center justify-center h-[calc(100vh-240px)]">
      <div className="text-center max-w-xl mx-auto">
        <h1 className="text-4xl font-semibold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent mb-4">
          {greeting}
          {!question && <span className={`inline-block w-0.5 h-8 bg-indigo-400 ml-1 align-middle ${hideCursorCompletely ? 'hidden' : 'opacity-100'}`}></span>}
        </h1>
        
        {question && (
          <p className="text-2xl text-gray-500 dark:text-gray-400">
            {question}
            <span className={`inline-block w-0.5 h-6 bg-gray-500 dark:bg-gray-400 ml-1 align-middle ${hideCursorCompletely ? 'hidden' : 'opacity-100'}`}></span>
          </p>
        )}
      </div>
    </div>
  );
};
