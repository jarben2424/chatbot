// A simple toast hook for notifications
import { useState } from "react";

type ToastVariant = "default" | "destructive" | "success";

type ToastProps = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type Toast = ToastProps & {
  id: string;
  open: boolean;
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      id,
      open: true,
      variant: "default",
      duration: 5000,
      ...props,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss
    setTimeout(() => {
      setToasts((prev) => 
        prev.map(t => t.id === id ? { ...t, open: false } : t)
      );
      
      // Remove from array after animation
      setTimeout(() => {
        setToasts((prev) => prev.filter(t => t.id !== id));
      }, 300);
    }, newToast.duration);

    return id;
  };

  return { toast, toasts };
}
