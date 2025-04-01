'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { CampaignsHeader } from '@/components/campaigns/campaigns-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { RefreshCw, ChevronRight, ChevronLeft, Users, Zap, Sparkles, Brain } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalStorage } from 'usehooks-ts';
import { toast } from 'sonner';

// Sample audience segments data
const segments = [
  {
    id: 'high-value',
    name: 'High Value Customers',
    description: 'Customers who spent over $1000',
    count: 1250
  },
  {
    id: 'recent-purchasers',
    name: 'Recent Purchasers',
    description: 'Customers who made a purchase in last 30 days',
    count: 3420
  },
  {
    id: 'at-risk',
    name: 'At Risk Customers',
    description: "Customers who haven't purchased in 90 days",
    count: 890
  }
];

// Sample offers data
const offers = [
  {
    id: 'summer-discount',
    name: '20% Summer Discount',
    description: 'Summer sale discount for all products'
  },
  {
    id: 'free-shipping',
    name: 'Free Shipping',
    description: 'Free shipping on orders over $50'
  },
  {
    id: 'loyalty-bonus',
    name: 'Loyalty Bonus',
    description: 'Special bonus points for loyal customers'
  }
];

// Enhanced optimization modal with OpusThink integration
function OptimizationModal({ 
  isOpen, 
  onComplete, 
  selectedSegmentId, 
  useOpusThink 
}: { 
  isOpen: boolean; 
  onComplete: () => void; 
  selectedSegmentId: string | null;
  useOpusThink: boolean;
}) {
  const [progress, setProgress] = useState(0);
  const [insightText, setInsightText] = useState('');
  const [thinkingStep, setThinkingStep] = useState('');
  
  useEffect(() => {
    if (!isOpen) return;
    
    let animationFrameId: number;
    let timeoutId: NodeJS.Timeout;
    
    // Get segment data
    const segment = segments.find(s => s.id === selectedSegmentId);
    
    // Create thinking steps for OpusThink mode
    if (useOpusThink) {
      const thinkingSteps = [
        `Analyzing ${segment?.name || 'segment'} characteristics...`,
        `Evaluating demographic profiles and purchasing patterns...`,
        `Calculating predicted response rates for each offer...`,
        `Evaluating seasonal trends and purchase history...`,
        `Determining optimal offer-to-customer matches...`,
        `Calculating projected conversion improvements...`,
        `Finalizing personalized recommendations...`
      ];
      
      // Show thinking steps in sequence
      let currentStepIndex = 0;
      const thinkingInterval = setInterval(() => {
        if (currentStepIndex < thinkingSteps.length) {
          setThinkingStep(thinkingSteps[currentStepIndex]);
          currentStepIndex++;
        } else {
          clearInterval(thinkingInterval);
        }
      }, 700);
      
      // Simulate deep analysis insights
      setTimeout(() => {
        if (segment?.id === 'high-value') {
          setInsightText('Analysis indicates Loyalty Bonus will increase engagement by 42% for High Value segment.');
        } else if (segment?.id === 'recent-purchasers') {
          setInsightText('Free Shipping offer projected to drive 27% higher repeat purchases for Recent Purchasers.');
        } else if (segment?.id === 'at-risk') {
          setInsightText('20% Summer Discount shows highest recovery potential of 35% for At Risk customers.');
        }
      }, 3000);
      
      // Clean up
      return () => {
        clearInterval(thinkingInterval);
      };
    }
    
    // Original progress animation logic
    const startTime = Date.now();
    const duration = useOpusThink ? 6000 : 5000; // Slightly longer for OpusThink
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      
      let newProgress;
      const t = Math.min(1, elapsed / duration);
      if (t < 0.5) {
        // Slower at the beginning
        newProgress = 4 * t * t * t;
      } else {
        // Faster in the middle, slower at the end
        newProgress = 1 - Math.pow(-2 * t + 2, 3) / 2;
      }
      
      newProgress = Math.min(1, newProgress) * 100;
      setProgress(newProgress);
      
      if (newProgress < 100) {
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        timeoutId = setTimeout(onComplete, 400);
      }
    };
    
    animationFrameId = requestAnimationFrame(updateProgress);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timeoutId);
    };
  }, [isOpen, onComplete, selectedSegmentId, useOpusThink]);
  
  // Get a descriptive text based on progress
  const getStepText = () => {
    if (useOpusThink && thinkingStep) {
      return thinkingStep;
    }
    
    if (progress < 33) {
      return 'Analyzing customer data...';
    } else if (progress < 66) {
      return 'Matching offers to segment...';
    } else {
      return 'Optimizing campaign performance...';
    }
  };
  
  // Get the icon based on progress
  const getStepIcon = () => {
    if (useOpusThink) {
      return (
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotateY: [0, 180, 360],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Brain className="h-8 w-8" />
        </motion.div>
      );
    }
    
    if (progress < 33) {
      return (
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="h-8 w-8" />
        </motion.div>
      );
    } else if (progress < 66) {
      return (
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Zap className="h-8 w-8" />
        </motion.div>
      );
    } else {
      return (
        <motion.div 
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          <Sparkles className="h-8 w-8" />
        </motion.div>
      );
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full m-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="text-center">
              {/* Optimization Animation */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-indigo-100"></div>
                
                {/* Pulsing circle animation */}
                <motion.div 
                  className="absolute inset-2 rounded-full bg-indigo-50"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    opacity: [0.7, 0.9, 0.7] 
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut" 
                  }}
                ></motion.div>
                
                {/* Main circle */}
                <div className={`absolute inset-3 rounded-full ${useOpusThink ? 'bg-gradient-to-br from-purple-500 to-purple-700' : 'bg-gradient-to-br from-indigo-500 to-indigo-700'} flex items-center justify-center text-white`}>
                  {getStepIcon()}
                </div>
              </div>
              
              <h2 className="text-xl font-semibold mb-2 text-gray-800">
                {useOpusThink ? 'OpusThink Analysis' : 'Optimizing Your Campaign'}
              </h2>
              
              <p className="text-gray-600 mb-6">
                {useOpusThink 
                  ? 'Advanced AI is performing deep analysis on your customer data and offers'
                  : 'Our AI is analyzing data patterns to create personalized experiences'
                }
              </p>
              
              {/* OpusThink insights */}
              {useOpusThink && insightText && (
                <div className="mb-6 p-3 bg-purple-50 border border-purple-100 rounded-lg text-sm text-purple-700">
                  <p className="font-medium">OpusThink Insight:</p>
                  <p>{insightText}</p>
                </div>
              )}
              
              {/* Step Indicators - visually show position in the process */}
              <div className="flex justify-between mb-3 text-sm text-gray-500 font-medium">
                <div className={progress >= 33 ? `${useOpusThink ? "text-purple-600" : "text-indigo-600"} font-medium` : ""}>Analyzing</div>
                <div className={progress >= 66 ? `${useOpusThink ? "text-purple-600" : "text-indigo-600"} font-medium` : ""}>Matching</div>
                <div className={progress >= 95 ? `${useOpusThink ? "text-purple-600" : "text-indigo-600"} font-medium` : ""}>Optimizing</div>
              </div>
              
              {/* Progress bar */}
              <div className="h-3 w-full bg-gray-100 rounded-full mb-4 overflow-hidden">
                <div 
                  className={`h-full ${useOpusThink ? 'bg-purple-600' : 'bg-indigo-600'} rounded-full`}
                  style={{ 
                    width: `${progress}%`,
                  }}
                />
              </div>
              
              <p className={`text-sm ${useOpusThink ? 'text-purple-600' : 'text-indigo-600'} font-medium`}>
                {getStepText()}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function TargetAudiencePage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [showOptimization, setShowOptimization] = useState(false);
  
  // Get the OpusThink setting from localStorage
  const [opusThinkEnabled] = useLocalStorage('opus-think-enabled', false);

  useEffect(() => {
    // Load data from localStorage
    const previousOffers = localStorage.getItem('selectedOffers');
    const previousSegment = localStorage.getItem('selectedSegment');
    
    if (previousSegment) {
      setSelectedSegment(previousSegment);
    }
    
    async function getSession() {
      try {
        const res = await fetch('/api/auth/session');
        const sessionData = await res.json();
        if (!sessionData || !sessionData.user) {
          window.location.href = '/sign-in';
          return;
        }
        setSession(sessionData);
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
      }
    }

    getSession();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session?.user) {
    return null; // This will never render as we redirect in useEffect
  }

  const handleOptimizeCampaign = () => {
    // Save segment selection for step 4
    if (selectedSegment) {
      localStorage.setItem('selectedSegment', selectedSegment);
      
      // If OpusThink is enabled, save that we used it
      if (opusThinkEnabled) {
        localStorage.setItem('usedOpusThink', 'true');
        
        // Show toast when using OpusThink
        toast.success('OpusThink mode activated for advanced analysis', {
          description: 'Using Claude 3 Opus for intelligent offer matching',
          duration: 3000
        });
      }
    }
    
    // Show the optimization modal
    setShowOptimization(true);
  };
  
  const handleOptimizationComplete = () => {
    // Navigate to step 4 after optimization is complete
    router.push('/campaigns/create/step4');
  };

  return (
    <div className="relative flex h-[100dvh]">
      <SidebarProvider>
        <div className="flex w-full">
          <AppSidebar user={session.user} />
          <div className="flex-1">
            <CampaignsHeader title="Create Campaign" />
            <div className="flex-1 overflow-auto bg-slate-50/30">
              <div className="mx-auto max-w-4xl px-4 py-8">
                {/* Progress Steps */}
                <div className="relative mb-10">
                  {/* Line connecting steps */}
                  <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 -z-10"></div>
                  <div className="absolute top-6 left-0 w-1/2 h-1 bg-indigo-600 -z-10"></div>
                  
                  <div className="flex justify-between">
                    {/* Step 1 - Completed */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-md transition-all duration-300">
                        <span className="text-base font-medium">✓</span>
                      </div>
                      <span className="text-sm font-medium text-indigo-600">Campaign Type</span>
                    </div>
                    
                    {/* Step 2 - Completed */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-md transition-all duration-300">
                        <span className="text-base font-medium">✓</span>
                      </div>
                      <span className="text-sm font-medium text-indigo-600">Select Offers</span>
                    </div>
                    
                    {/* Step 3 - Current */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-md transition-all duration-300">
                        <span className="text-base font-medium">3</span>
                      </div>
                      <span className="text-sm font-medium text-indigo-600">Target Audience</span>
                    </div>
                    
                    {/* Step 4 - Upcoming */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 text-gray-400 flex items-center justify-center mb-3 transition-all duration-300">
                        <span className="text-base font-medium">4</span>
                      </div>
                      <span className="text-sm text-gray-500">Review & Sync</span>
                    </div>
                  </div>
                </div>
                
                {/* Audience Selection */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-medium mb-1">Target Audience</h3>
                      <p className="text-sm text-gray-500">Select a customer segment for your campaign</p>
                    </div>
                    <Button variant="outline" size="sm" className="border-indigo-200 hover:bg-indigo-50 text-indigo-600">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </Button>
                  </div>
                  
                  <div className="space-y-4 mt-6">
                    {segments.map((segment) => (
                      <div 
                        key={segment.id}
                        className={`p-4 border rounded-lg flex items-center justify-between cursor-pointer transition-all ${
                          selectedSegment === segment.id 
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' 
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                        onClick={() => setSelectedSegment(segment.id)}
                      >
                        <div className="flex items-start">
                          <div className="mr-4">
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                              <Users className="h-5 w-5 text-indigo-600" />
                            </div>
                          </div>
                          <div>
                            <h3 className="font-medium">{segment.name}</h3>
                            <p className="text-sm text-gray-500">{segment.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-700 mr-4">
                            {segment.count.toLocaleString()} users
                          </div>
                          <div 
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              selectedSegment === segment.id 
                                ? 'bg-indigo-600 text-white' 
                                : 'border-2 border-gray-300'
                            }`}
                          >
                            {selectedSegment === segment.id && <span className="text-xs">✓</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedSegment && (
                    <div className="mt-4 py-3 px-4 bg-indigo-50 rounded-lg text-sm text-indigo-800">
                      <p>Selected segment: {segments.find(s => s.id === selectedSegment)?.name}</p>
                    </div>
                  )}
                </div>
                
                {/* OpusThink indicator */}
                {opusThinkEnabled && (
                  <div className="mb-8 p-4 bg-purple-50 border border-purple-100 rounded-lg flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg mr-3">
                      <Brain className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-purple-800">OpusThink Mode Active</h3>
                      <p className="text-sm text-purple-600">Using advanced AI to optimize offer-to-customer matching</p>
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex justify-between">
                  <Link href="/campaigns/create/step2">
                    <Button variant="outline" className="bg-white hover:bg-slate-50 border-gray-200">
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Back
                    </Button>
                  </Link>
                  
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={handleOptimizeCampaign}
                    disabled={!selectedSegment}
                  >
                    Optimize Campaign
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
      
      {/* Optimization Modal with OpusThink integration */}
      <OptimizationModal 
        isOpen={showOptimization} 
        onComplete={handleOptimizationComplete}
        selectedSegmentId={selectedSegment}
        useOpusThink={opusThinkEnabled}
      />
    </div>
  );
} 