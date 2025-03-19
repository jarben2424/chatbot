'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { CampaignsHeader } from '@/components/campaigns/campaigns-header';
import { Progress } from '@/components/ui/progress';

export default function OptimizationPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [optimizationStep, setOptimizationStep] = useState(1); // 1: Analyzing, 2: Matching, 3: Optimizing
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    async function getSession() {
      try {
        const res = await fetch('/api/auth/session');
        const sessionData = await res.json();
        if (!sessionData || !sessionData.user) {
          window.location.href = '/sign-in';
          return;
        }
        setSession(sessionData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching session:', error);
        setLoading(false);
      }
    }

    getSession();
  }, []);

  useEffect(() => {
    // Simulate the optimization process with steps and progress
    const simulateOptimization = () => {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 1;
          if (newProgress >= 100) {
            clearInterval(interval);
            
            // Move to next step or finish
            setOptimizationStep((prevStep) => {
              if (prevStep < 3) {
                setProgress(0); // Reset progress for next step
                return prevStep + 1;
              } else {
                // Optimization complete, navigate to step 4
                setTimeout(() => {
                  router.push('/campaigns/create/step4');
                }, 500);
                return prevStep;
              }
            });
          }
          return newProgress;
        });
      }, 30);
      
      return () => clearInterval(interval);
    };
    
    if (!loading && session) {
      simulateOptimization();
    }
  }, [loading, session, router, optimizationStep]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session?.user) {
    return null;
  }

  const stepText = {
    1: 'Analyzing',
    2: 'Matching',
    3: 'Optimizing'
  };

  return (
    <div className="relative flex h-[100dvh]">
      <SidebarProvider>
        <div className="flex w-full">
          <AppSidebar user={session.user} />
          <div className="flex-1">
            <CampaignsHeader title="Create Campaign" />
            <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center">
              <div className="bg-white rounded-xl shadow-lg p-10 max-w-md w-full mx-auto text-center">
                {/* Circular Animation */}
                <div className="relative mx-auto mb-5">
                  {/* Outer rings */}
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-100 animate-pulse"></div>
                  <div className="absolute inset-2 rounded-full border-4 border-indigo-200 animate-pulse delay-75"></div>
                  <div className="absolute inset-4 rounded-full border-4 border-indigo-300 animate-pulse delay-150"></div>
                  
                  {/* Center circle */}
                  <div className="relative h-20 w-20 bg-indigo-600 rounded-full mx-auto flex items-center justify-center">
                    <div className="h-10 w-10 bg-indigo-500 rounded-full animate-ping absolute opacity-75"></div>
                    <div className="h-10 w-10 bg-indigo-600 rounded-full relative"></div>
                  </div>
                </div>
                
                <h2 className="text-xl font-bold mb-2">AI Optimization in Progress</h2>
                <p className="text-gray-600 mb-6">
                  Our advanced AI is analyzing customer patterns and optimizing offer matching to maximize engagement and redemption rates
                </p>
                
                {/* Progress indicator */}
                <div className="flex justify-between items-center mb-2 text-sm text-gray-500 font-medium">
                  <span className={optimizationStep >= 1 ? "text-indigo-600" : ""}>Analyzing</span>
                  <span className={optimizationStep >= 2 ? "text-indigo-600" : ""}>Matching</span>
                  <span className={optimizationStep >= 3 ? "text-indigo-600" : ""}>Optimizing</span>
                </div>
                <Progress value={progress} className="h-1.5 mb-2" />
                <p className="text-sm text-gray-500">{stepText[optimizationStep as keyof typeof stepText]}...</p>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
} 