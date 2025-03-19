'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CommandPaletteModal } from './command-palette-modal';

type CommandPaletteContextType = {
  isOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextType>({
  isOpen: false,
  openCommandPalette: () => {},
  closeCommandPalette: () => {},
  toggleCommandPalette: () => {},
});

export const useCommandPalette = () => useContext(CommandPaletteContext);

interface CommandPaletteProviderProps {
  children: ReactNode;
}

export function CommandPaletteProvider({ children }: CommandPaletteProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const openCommandPalette = () => setIsOpen(true);
  const closeCommandPalette = () => setIsOpen(false);
  const toggleCommandPalette = () => setIsOpen(prev => !prev);
  
  // Add global keyboard shortcut for Command+K
  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
    };

    document.addEventListener('keydown', handleGlobalKeydown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeydown);
    };
  }, [toggleCommandPalette]);
  
  const handleSelectCommand = (command: any) => {
    // When a command is selected from the palette, we'll need to handle it
    // For now, we'll just simulate typing the command into the chat input
    const inputElement = document.querySelector('[data-testid="multimodal-input"]') as HTMLTextAreaElement;
    
    if (inputElement) {
      // Set the input value
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )?.set;
      
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(inputElement, command.action);
        
        // Trigger input event
        const inputEvent = new Event('input', { bubbles: true });
        inputElement.dispatchEvent(inputEvent);
        
        // Focus the input
        inputElement.focus();
        
        // Automatically submit the command
        setTimeout(() => {
          const submitEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true
          });
          inputElement.dispatchEvent(submitEvent);
        }, 100);
      }
    }
    
    closeCommandPalette();
  };
  
  return (
    <CommandPaletteContext.Provider 
      value={{ isOpen, openCommandPalette, closeCommandPalette, toggleCommandPalette }}
    >
      {children}
      <CommandPaletteModal 
        isOpen={isOpen} 
        onClose={closeCommandPalette} 
        onSelectCommand={handleSelectCommand} 
      />
    </CommandPaletteContext.Provider>
  );
} 