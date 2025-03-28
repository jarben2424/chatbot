'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  BrainCircuitIcon,
  Sparkles,
  CheckCircleIcon,
  FilterIcon,
  CoffeeIcon,
  DollarSignIcon,
  ShoppingBagIcon,
  UtensilsIcon,
  IceCreamIcon,
  StarIcon,
  HeartIcon,
  UsersIcon,
  UserPlusIcon,
  TruckIcon,
  SparklesIcon,
  ArrowDownIcon,
} from 'lucide-react';
import { useCampaignState } from '@/app/(campaigns)/_context/campaign-context';

// Sample customer data
const customers = [
  {
    id: 'c-1',
    name: 'Emma Thompson',
    email: 'emma.t@example.com',
    avatar: '/avatars/emma.jpg',
    totalSpent: 782.45,
    lastOrder: '2025-03-18',
    behavior: 'Frequents weekends, loves desserts',
    matchedOffer: {
      id: 'offer-4',
      title: '20% Off Entire Order',
      description: 'Save 20% on your entire order (max discount $30)',
      icon: ShoppingBagIcon,
      matchScore: 94,
      matchReason: 'Based on high spending pattern and weekend visits',
      cost: 8.50
    }
  },
  {
    id: 'c-2',
    name: 'James Wilson',
    email: 'jwilson@example.com',
    avatar: '/avatars/james.jpg',
    totalSpent: 437.20,
    lastOrder: '2025-03-22',
    behavior: 'Weekday lunch orders, sandwich preference',
    matchedOffer: {
      id: 'offer-2',
      title: 'BOGO Sandwich',
      description: 'Buy one sandwich, get one free (of equal or lesser value)',
      icon: UtensilsIcon,
      matchScore: 97,
      matchReason: 'Based on lunch ordering patterns and sandwich preference',
      cost: 7.99
    }
  },
  {
    id: 'c-3',
    name: 'Sophia Chen',
    email: 'sophia.c@example.com',
    avatar: '/avatars/sophia.jpg',
    totalSpent: 612.75,
    lastOrder: '2025-03-17',
    behavior: 'Mostly evening orders, family-sized meals',
    matchedOffer: {
      id: 'offer-4',
      title: '20% Off Entire Order',
      description: 'Save 20% on your entire order (max discount $30)',
      icon: ShoppingBagIcon,
      matchScore: 95,
      matchReason: 'Based on family meal ordering patterns and high total value',
      cost: 12.50
    }
  },
  {
    id: 'c-4',
    name: 'Michael Rodriguez',
    email: 'm.rodriguez@example.com',
    avatar: '/avatars/michael.jpg',
    totalSpent: 87.30,
    lastOrder: '2025-03-21',
    behavior: 'First-time customer, ordered beverages',
    matchedOffer: {
      id: 'offer-1',
      title: 'Free Large Drink',
      description: 'Free large drink with any purchase of $15 or more',
      icon: CoffeeIcon,
      matchScore: 89,
      matchReason: 'Ideal for new customers with beverage preferences',
      cost: 2.95
    }
  },
  {
    id: 'c-5',
    name: 'Olivia Johnson',
    email: 'olivia.j@example.com',
    avatar: '/avatars/olivia.jpg',
    totalSpent: 895.60,
    lastOrder: '2025-03-20',
    behavior: 'Multiple weekly orders, high average order value',
    matchedOffer: {
      id: 'offer-4',
      title: '20% Off Entire Order',
      description: 'Save 20% on your entire order (max discount $30)',
      icon: ShoppingBagIcon,
      matchScore: 99,
      matchReason: 'Based on high frequency ordering and total spend value',
      cost: 15.75
    }
  },
  {
    id: 'c-6',
    name: 'Daniel Kim',
    email: 'daniel.k@example.com',
    avatar: '/avatars/daniel.jpg',
    totalSpent: 362.15,
    lastOrder: '2025-03-19',
    behavior: 'Weekday lunch orders, frequent loyalty member',
    matchedOffer: {
      id: 'offer-2',
      title: 'BOGO Sandwich',
      description: 'Buy one sandwich, get one free (of equal or lesser value)',
      icon: UtensilsIcon,
      matchScore: 96,
      matchReason: 'Based on weekday lunch patterns and order preferences',
      cost: 7.99
    }
  },
  {
    id: 'c-7',
    name: 'Sarah Williams',
    email: 's.williams@example.com',
    avatar: '/avatars/sarah.jpg',
    totalSpent: 423.90,
    lastOrder: '2024-12-15',
    behavior: 'Previously ordered weekly, now inactive',
    matchedOffer: {
      id: 'offer-3',
      title: '$5 Off $25+',
      description: 'Save $5 on any purchase of $25 or more',
      icon: DollarSignIcon,
      matchScore: 91,
      matchReason: 'Targeted at winning back formerly regular customers',
      cost: 5.00
    }
  },
  {
    id: 'c-8',
    name: 'Ethan Garcia',
    email: 'ethan.g@example.com',
    avatar: '/avatars/ethan.jpg',
    totalSpent: 547.35,
    lastOrder: '2025-03-16',
    behavior: 'Multiple weekend orders, high value transactions',
    matchedOffer: {
      id: 'offer-4',
      title: '20% Off Entire Order',
      description: 'Save 20% on your entire order (max discount $30)',
      icon: ShoppingBagIcon,
      matchScore: 93,
      matchReason: 'Based on weekend ordering patterns and high order value',
      cost: 10.50
    }
  },
  {
    id: 'c-9',
    name: 'Isabella Martinez',
    email: 'i.martinez@example.com',
    avatar: '/avatars/isabella.jpg',
    totalSpent: 243.67,
    lastOrder: '2025-03-15',
    behavior: 'Orders vegetarian meals, weekday afternoons',
    matchedOffer: {
      id: 'offer-3',
      title: '$5 Off $25+',
      description: 'Save $5 on any purchase of $25 or more',
      icon: DollarSignIcon,
      matchScore: 98,
      matchReason: 'Perfect match for afternoon ordering pattern in specified price range',
      cost: 4.50
    }
  },
  {
    id: 'c-10',
    name: 'Brandon Taylor',
    email: 'b.taylor@example.com',
    avatar: '/avatars/brandon.jpg',
    totalSpent: 1320.85,
    lastOrder: '2025-03-19',
    behavior: 'Orders for office groups, high-value corporate account',
    matchedOffer: {
      id: 'offer-4',
      title: '20% Off Entire Order',
      description: 'Save 20% on your entire order (max discount $30)',
      icon: ShoppingBagIcon,
      matchScore: 95,
      matchReason: 'Well-suited for office ordering patterns and high order value',
      cost: 30.00
    }
  },
  {
    id: 'c-11',
    name: 'Ava Patel',
    email: 'ava.p@example.com',
    avatar: '/avatars/ava.jpg',
    totalSpent: 198.40,
    lastOrder: '2025-03-14',
    behavior: 'Orders breakfast items, early morning customer',
    matchedOffer: {
      id: 'offer-1',
      title: 'Free Large Drink',
      description: 'Free large drink with any purchase of $15 or more',
      icon: CoffeeIcon,
      matchScore: 97,
      matchReason: 'Perfectly aligned with early morning ordering habits',
      cost: 2.50
    }
  },
  {
    id: 'c-12',
    name: 'Noah Washington',
    email: 'n.washington@example.com',
    avatar: '/avatars/noah.jpg',
    totalSpent: 75.20,
    lastOrder: '2025-03-05',
    behavior: 'New customer, ordered twice, delivery only',
    matchedOffer: {
      id: 'offer-3',
      title: '$5 Off $25+',
      description: 'Save $5 on any purchase of $25 or more',
      icon: DollarSignIcon,
      matchScore: 94,
      matchReason: 'Targeting new customer with appropriate discount level',
      cost: 5.00
    }
  },
  {
    id: 'c-13',
    name: 'Charlotte Brown',
    email: 'c.brown@example.com',
    avatar: '/avatars/charlotte.jpg',
    totalSpent: 532.10,
    lastOrder: '2025-02-28',
    behavior: 'Orders healthy options, regular monthly customer',
    matchedOffer: {
      id: 'offer-3',
      title: '$5 Off $25+',
      description: 'Save $5 on any purchase of $25 or more',
      icon: DollarSignIcon,
      matchScore: 92,
      matchReason: 'Matches monthly ordering pattern in appropriate price range',
      cost: 5.00
    }
  },
  {
    id: 'c-14',
    name: 'Mason Davis',
    email: 'm.davis@example.com',
    avatar: '/avatars/mason.jpg',
    totalSpent: 687.35,
    lastOrder: '2025-03-10',
    behavior: 'Weekend dinner orders, often includes desserts',
    matchedOffer: {
      id: 'offer-1',
      title: 'Free Large Drink',
      description: 'Free large drink with any purchase of $15 or more',
      icon: CoffeeIcon,
      matchScore: 96,
      matchReason: 'Complements weekend dinner orders nicely',
      cost: 3.50
    }
  },
  {
    id: 'c-15',
    name: 'Zoe Anderson',
    email: 'z.anderson@example.com',
    avatar: '/avatars/zoe.jpg',
    totalSpent: 319.75,
    lastOrder: '2025-03-23',
    behavior: 'Orders specialty drinks, evening customer',
    matchedOffer: {
      id: 'offer-1',
      title: 'Free Large Drink',
      description: 'Free large drink with any purchase of $15 or more',
      icon: CoffeeIcon,
      matchScore: 99,
      matchReason: 'Perfectly aligned with specialty drink preferences',
      cost: 4.25
    }
  },
  {
    id: 'c-16',
    name: 'Liam Murphy',
    email: 'liam.m@example.com',
    avatar: '/avatars/liam.jpg',
    totalSpent: 156.25,
    lastOrder: '2025-01-05',
    behavior: 'Occasional customer, large order preference',
    matchedOffer: {
      id: 'offer-4',
      title: '20% Off Entire Order',
      description: 'Save 20% on your entire order (max discount $30)',
      icon: ShoppingBagIcon,
      matchScore: 90,
      matchReason: 'Targets occasional customers with higher value single orders',
      cost: 5.00
    }
  },
  {
    id: 'c-17',
    name: 'Harper Lee',
    email: 'harper.l@example.com',
    avatar: '/avatars/harper.jpg',
    totalSpent: 78.45,
    lastOrder: '2025-03-01',
    behavior: 'Student, orders late night, small orders',
    matchedOffer: {
      id: 'offer-3',
      title: '$5 Off $25+',
      description: 'Save $5 on any purchase of $25 or more',
      icon: DollarSignIcon,
      matchScore: 98,
      matchReason: 'Perfect for student budget and typical order value',
      cost: 5.00
    }
  },
  {
    id: 'c-18',
    name: 'Elijah Nguyen',
    email: 'e.nguyen@example.com',
    avatar: '/avatars/elijah.jpg',
    totalSpent: 428.90,
    lastOrder: '2025-03-12',
    behavior: 'Orders international cuisine, explores menu',
    matchedOffer: {
      id: 'offer-2',
      title: 'BOGO Sandwich',
      description: 'Buy one sandwich, get one free (of equal or lesser value)',
      icon: UtensilsIcon,
      matchScore: 93,
      matchReason: 'Encourages menu exploration with value-oriented offer',
      cost: 8.50
    }
  },
  {
    id: 'c-19',
    name: 'Amelia Scott',
    email: 'a.scott@example.com',
    avatar: '/avatars/amelia.jpg',
    totalSpent: 763.25,
    lastOrder: '2025-03-21',
    behavior: 'Regular weekend orders, family meals, special requests',
    matchedOffer: {
      id: 'offer-4',
      title: '20% Off Entire Order',
      description: 'Save 20% on your entire order (max discount $30)',
      icon: ShoppingBagIcon,
      matchScore: 97,
      matchReason: 'Perfect for weekend family meal ordering pattern',
      cost: 12.50
    }
  },
  {
    id: 'c-20',
    name: 'Benjamin Adams',
    email: 'b.adams@example.com',
    avatar: '/avatars/benjamin.jpg',
    totalSpent: 951.10,
    lastOrder: '2025-03-20',
    behavior: 'High spender, loyal customer, seasonal items',
    matchedOffer: {
      id: 'offer-4',
      title: '20% Off Entire Order',
      description: 'Save 20% on your entire order (max discount $30)',
      icon: ShoppingBagIcon,
      matchScore: 98,
      matchReason: 'Rewards loyal high-value customer status',
      cost: 15.75
    }
  },
  {
    id: 'c-21',
    name: 'Mila Thomas',
    email: 'm.thomas@example.com',
    avatar: '/avatars/mila.jpg',
    totalSpent: 285.70,
    lastOrder: '2025-02-01',
    behavior: 'Monthly customer, mostly soups and salads',
    matchedOffer: {
      id: 'offer-3',
      title: '$5 Off $25+',
      description: 'Save $5 on any purchase of $25 or more',
      icon: DollarSignIcon,
      matchScore: 91,
      matchReason: 'Matches typical order value for this monthly visitor',
      cost: 5.00
    }
  },
  {
    id: 'c-22',
    name: 'Lucas Robinson',
    email: 'lucas.r@example.com',
    avatar: '/avatars/lucas.jpg',
    totalSpent: 103.45,
    lastOrder: '2025-03-15',
    behavior: 'New loyalty member, lunchtime orders',
    matchedOffer: {
      id: 'offer-2',
      title: 'BOGO Sandwich',
      description: 'Buy one sandwich, get one free (of equal or lesser value)',
      icon: UtensilsIcon,
      matchScore: 95,
      matchReason: 'Perfect for lunchtime orders and sandwich preferences',
      cost: 7.99
    }
  },
  {
    id: 'c-23',
    name: 'Scarlett Wright',
    email: 's.wright@example.com',
    avatar: '/avatars/scarlett.jpg',
    totalSpent: 520.15,
    lastOrder: '2024-12-20',
    behavior: 'Holiday season orderer, inactive, catering',
    matchedOffer: {
      id: 'offer-4',
      title: '20% Off Entire Order',
      description: 'Save 20% on your entire order (max discount $30)',
      icon: ShoppingBagIcon,
      matchScore: 94,
      matchReason: 'Great for re-engaging seasonal customers with large orders',
      cost: 9.25
    }
  },
  {
    id: 'c-24',
    name: 'Henry Campbell',
    email: 'h.campbell@example.com',
    avatar: '/avatars/henry.jpg',
    totalSpent: 432.80,
    lastOrder: '2025-03-18',
    behavior: 'Breakfast and lunch orders, consistent weekday customer',
    matchedOffer: {
      id: 'offer-1',
      title: 'Free Large Drink',
      description: 'Free large drink with any purchase of $15 or more',
      icon: CoffeeIcon,
      matchScore: 92,
      matchReason: 'Well-suited for breakfast and lunch ordering preferences',
      cost: 2.50
    }
  },
  {
    id: 'c-25',
    name: 'Abigail Turner',
    email: 'a.turner@example.com',
    avatar: '/avatars/abigail.jpg',
    totalSpent: 273.50,
    lastOrder: '2025-03-22',
    behavior: 'Mobile app user, quick pickup orders, specific preferences',
    matchedOffer: {
      id: 'offer-2',
      title: 'BOGO Sandwich',
      description: 'Buy one sandwich, get one free (of equal or lesser value)',
      icon: UtensilsIcon,
      matchScore: 96,
      matchReason: 'Perfect for quick pickup lunch orders',
      cost: 7.99
    }
  }
];

// Matching process steps
const matchingSteps = [
  {
    name: 'Analyzing customer data',
    detail: 'Processing purchase history, frequency, and preferences'
  },
  {
    name: 'Identifying behavioral patterns',
    detail: 'Finding trends in ordering times, product selections, and spend'
  },
  {
    name: 'Calculating offer relevance',
    detail: 'Matching offer attributes to customer preferences'
  },
  {
    name: 'Optimizing for engagement',
    detail: 'Selecting offers with highest predicted response rate'
  },
  {
    name: 'Finalizing personalized matches',
    detail: 'Assigning the most compelling offer to each customer'
  }
];

export default function CampaignMatchingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [displayCount, setDisplayCount] = useState(5);
  const { toast } = useToast();
  const { campaignState, updateCampaign } = useCampaignState();

  const router = useRouter();
  
  // Directly check current and previous routes to completely control animation visibility
  useEffect(() => {
    // Only show animation when we have explicit confirmation we're coming from the segment page
    // This requires both the animation flag AND the previousStep being 'segment'
    const isComingFromSegment = campaignState.showMatchingAnimation && 
                               !campaignState.matchingComplete &&
                               campaignState.previousStep === 'segment';
    
    setLoading(isComingFromSegment);
    
    if (isComingFromSegment) {
      // Reset the loading animation
      setProgress(0);
      
      // Calculate number of steps and total duration
      const totalSteps = matchingSteps.length;
      const totalDuration = 5000; // 5 seconds total
      const stepDuration = totalDuration / totalSteps;
      const progressIncrementsPerStep = 25; // Each step adds 25% progress (100% / 4 steps)
      
      // Progress bar increment interval - more frequent updates for smoother animation
      const interval = setInterval(() => {
        setProgress(prev => {
          // Calculate which step we're on based on elapsed time
          const elapsedTime = Date.now() - startTime;
          const currentStepIndex = Math.min(Math.floor(elapsedTime / stepDuration), totalSteps - 1);
          
          // Target progress should be proportional to the current step
          const targetProgress = ((currentStepIndex + 1) * progressIncrementsPerStep);
          
          // Increment progressively toward target
          const increment = Math.max(1, Math.floor((targetProgress - prev) / 5));
          const newProgress = Math.min(prev + increment, targetProgress);
          
          return newProgress;
        });
      }, 100);
      
      // Track start time for calculations
      const startTime = Date.now();
      
      // Step change interval - change steps at regular intervals
      const stepInterval = setInterval(() => {
        setCurrentStep(prev => {
          const next = prev + 1;
          if (next >= matchingSteps.length) {
            clearInterval(stepInterval);
            return prev;
          }
          return next;
        });
      }, stepDuration);
      
      // End loading after total duration
      const timeout = setTimeout(() => {
        clearInterval(interval);
        clearInterval(stepInterval);
        setProgress(100);
        setLoading(false);
        
        // Mark matching as complete in the campaign state and turn off animation flag
        updateCampaign({ 
          matchingComplete: true,
          showMatchingAnimation: false, // Disable animation flag after completion
          previousStep: 'matching', // Update the previous step
          matchCount: customers.length
        });
      }, totalDuration);
      
      return () => {
        clearInterval(interval);
        clearInterval(stepInterval);
        clearTimeout(timeout);
      };
    } else {
      // We're not coming from segment, make sure loading is false and progress is complete
      setLoading(false);
      setProgress(100);
      
      // If we're not showing the animation but previousStep isn't set, update it
      if (campaignState.previousStep !== 'matching') {
        updateCampaign({
          previousStep: 'matching'
        });
      }
    }
  }, [campaignState.showMatchingAnimation, campaignState.matchingComplete, campaignState.previousStep, updateCampaign]);

  const [filteredCustomers, setFilteredCustomers] = useState(customers);
  
  // Filter customers based on search term only
  useEffect(() => {
    let result = customers;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(customer => 
        customer.name.toLowerCase().includes(term) || 
        customer.email.toLowerCase().includes(term) ||
        customer.behavior.toLowerCase().includes(term)
      );
    }
    
    setFilteredCustomers(result);
  }, [searchTerm]);
  
  const handleFinish = async () => {
    setLoading(true);
    
    try {
      // In a real application, this would update the campaign status to 'ready'
      // This would use the actual campaign ID from state/context
      
      // Simulate API call to update campaign status
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: "Campaign created successfully!",
        variant: "default",
      });
      
      // Redirect to integration page (step 5) instead of campaigns home
      router.push("/campaigns/create/integration");
    } catch (error) {
      console.error("Error completing campaign:", error);
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleBack = () => {
    router.push('/campaigns/create/segment');
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  // Render a customer card with their matched offer
  const renderCustomerCard = (customer: typeof customers[0]) => {
    const OfferIcon = customer.matchedOffer.icon;
    
    return (
      <div key={customer.id}>
        <div className="flex items-stretch gap-2">
          {/* Customer Card */}
          <Card className="flex-1">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {customer.name.charAt(0)}{customer.name.split(' ')[1]?.charAt(0)}
                  </AvatarFallback>
                  <AvatarImage src={customer.avatar} />
                </Avatar>
                <div>
                  <h3 className="font-medium text-sm">{customer.name}</h3>
                  <p className="text-xs text-muted-foreground">{customer.email}</p>
                </div>
              </div>
              
              <div className="mt-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Spent:</span>
                  <span className="font-medium">${customer.totalSpent.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Order:</span>
                  <span>{formatDate(customer.lastOrder)}</span>
                </div>
                <div className="mt-2 text-muted-foreground">
                  {customer.behavior}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Match connector */}
          <div className="flex flex-col items-center justify-center px-1.5 relative">
            {/* Horizontal connector lines with gradient */}
            <div className="absolute top-1/2 left-0 w-[calc(50%-11px)] h-0.5 bg-gradient-to-r from-primary/10 to-primary/40 transform -translate-y-1/2"></div>
            <div className="absolute top-1/2 right-0 w-[calc(50%-11px)] h-0.5 bg-gradient-to-l from-primary/10 to-primary/40 transform -translate-y-1/2"></div>
            
            <div className="flex items-center justify-center">
              <div className="relative z-10">
                <div className="w-11 h-11 rounded-full bg-gradient-to-r from-primary to-primary/90 text-white flex items-center justify-center text-sm font-bold shadow-md border-2 border-white">
                  {customer.matchedOffer.matchScore}%
                </div>
              </div>
            </div>
          </div>
          
          {/* Offer Card */}
          <Card className="flex-1">
            <CardContent className="p-3">
              <div className="flex items-start gap-2 mb-2">
                <div className="rounded-full bg-primary/10 p-1.5 mt-0.5 flex-shrink-0">
                  {OfferIcon && <OfferIcon className="h-4 w-4 text-primary" />}
                </div>
                <div>
                  <h3 className="font-medium text-sm">{customer.matchedOffer.title}</h3>
                  <p className="text-xs text-muted-foreground">{customer.matchedOffer.description}</p>
                </div>
              </div>
              
              <div className="mt-3 pl-2 border-l-2 border-primary/30">
                <p className="text-xs italic text-muted-foreground">"{customer.matchedOffer.matchReason}"</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };
  
  const step = 4;
  
  // Calculate summary statistics
  const calculateSummaryStats = () => {
    // Count offers by title
    const offerCounts = customers.reduce((acc, customer) => {
      const title = customer.matchedOffer.title;
      if (!acc[title]) {
        acc[title] = 0;
      }
      acc[title]++;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate average cost
    const totalCost = customers.reduce((sum, customer) => sum + customer.matchedOffer.cost, 0);
    const averageCost = totalCost / customers.length;
    
    return {
      offerCounts,
      averageCost
    };
  };
  
  const stats = calculateSummaryStats();
  const displayedCustomers = filteredCustomers.slice(0, displayCount);
  const hasMoreToLoad = filteredCustomers.length > displayCount;
  
  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 5);
  };
  
  const handleCompleteCampaign = async () => {
    // First, explicitly turn off the animation and set the navigation flag
    updateCampaign({
      matchingComplete: true,
      showMatchingAnimation: false,
      isNavigatingToIntegration: true,
      previousStep: 'matching' // Ensure we track that we're coming from matching page
    });
    
    // Make sure loading state is off immediately
    setLoading(false);
    
    try {
      const matchedCustomers = filteredCustomers.length;
      
      // Update campaign status to 'ready' instead of 'active'
      const response = await fetch("/api/campaigns", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: campaignState.id,
          status: "ready",
          matchingComplete: true,
          matchCount: matchedCustomers,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update campaign");
      }
      
      toast({
        title: "Success",
        description: "Campaign created successfully!",
        variant: "default",
      });
      
      // Redirect to integration page after state is updated
      router.push("/campaigns/create/integration");
    } catch (error) {
      console.error("Error completing campaign:", error);
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    }
  };
  
  // Rendering loading animation
  const renderLoadingAnimation = () => {
    return (
      <>
        <div className="w-full text-center mb-8">
          <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-3">
            <BrainCircuitIcon className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold">Personalizing Your Campaign</h2>
          <p className="text-muted-foreground mt-2">
            Hang AI is analyzing your customer data and matching each person with the most relevant offer
          </p>
        </div>
        
        <div className="w-full mb-10">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{Math.min(progress, 100)}%</span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-2" />
        </div>
        
        <div className="w-full border rounded-xl p-6 bg-card">
          <h3 className="font-medium mb-4 flex items-center">
            <Sparkles className="h-4 w-4 text-primary mr-2" /> 
            <span>Currently processing</span>
          </h3>
          
          <div className="space-y-4">
            {matchingSteps.map((step, index) => (
              <div 
                key={index}
                className={`flex items-start gap-3 transition-opacity duration-300 ${
                  index === currentStep ? 'opacity-100' : (index < currentStep ? 'opacity-50' : 'opacity-30')
                }`}
              >
                <div className={`rounded-full flex items-center justify-center h-5 w-5 flex-shrink-0 mt-0.5 ${
                  index < currentStep ? 'bg-primary text-white' : 'bg-muted'
                }`}>
                  {index < currentStep ? (
                    <CheckCircleIcon className="h-4 w-4" />
                  ) : (
                    <span className="text-xs">{index + 1}</span>
                  )}
                </div>
                <div>
                  <p className={`text-sm font-medium ${index === currentStep ? 'text-primary' : ''}`}>
                    {step.name}
                    {index === currentStep && (
                      <span className="inline-flex ml-2 space-x-1">
                        <span className="animate-[bounce_1s_infinite_0ms]">.</span>
                        <span className="animate-[bounce_1s_infinite_200ms]">.</span>
                        <span className="animate-[bounce_1s_infinite_400ms]">.</span>
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center">
                <UsersIcon className="h-3.5 w-3.5 mr-1.5" />
                Processing {campaignState.audienceSize || 25} customers
              </span>
              <span className="bg-muted px-2 py-0.5 rounded text-xs text-muted-foreground">
                {Math.min(Math.ceil((campaignState.audienceSize || 25) * progress / 100), campaignState.audienceSize || 25)}/{campaignState.audienceSize || 25} completed
              </span>
            </div>
          </div>
        </div>
      </>
    );
  };
  
  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        {/* If we're navigating to integration page, don't render anything */}
        {campaignState.isNavigatingToIntegration ? (
          <div className="flex-1"></div>
        ) : loading ? (
          <div className="flex-1 flex flex-col items-center justify-start py-16 max-w-2xl mx-auto">
            {renderLoadingAnimation()}
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full pb-24">
            <div className="mb-4 md:mb-8">
              <h1 className="text-3xl font-bold">Create Campaign</h1>
              <p className="text-muted-foreground">Step {step} of 5 - Customer Matching</p>
            </div>
            
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-primary">Personalization Complete</h3>
                  <p className="text-sm">
                    Hang AI has matched each customer with the most relevant offer based on their purchasing patterns, 
                    preferences, and engagement history. These personalized matches are designed to maximize conversion 
                    and customer satisfaction.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Offer Distribution</CardTitle>
                    <CardDescription className="text-xs">Based on offers selected in Step 3</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(stats.offerCounts).map(([offer, count]) => (
                        <div key={offer} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                            <span className="text-sm">{offer}</span>
                          </div>
                          <Badge variant="outline" className="bg-primary/5">
                            {count} customer{count !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Campaign Economics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Average Reward Cost</div>
                        <div className="text-2xl font-bold text-primary">
                          ${stats.averageCost.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Total Campaign Budget</div>
                        <div className="text-2xl font-bold">
                          ${(stats.averageCost * customers.length).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div className="relative max-w-md w-full">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            {/* Hang AI pill above match percentage column */}
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-primary to-primary/90 text-white text-xs font-medium shadow-sm">
                <SparklesIcon className="h-3.5 w-3.5" />
                <span>Matched by Hang AI</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto pr-1">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No customers match your search criteria</p>
                </div>
              ) : (
                <div className="space-y-4 pb-24">
                  {displayedCustomers.map(customer => renderCustomerCard(customer))}
                  
                  {hasMoreToLoad && (
                    <div className="flex justify-center mt-8 mb-8">
                      <Button 
                        variant="outline" 
                        onClick={handleLoadMore}
                        className="text-primary border-primary/20 hover:bg-primary/5"
                      >
                        Load 5 More Customers
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Fixed navigation bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t py-4 px-6 flex justify-between z-10">
          <div className="max-w-7xl mx-auto w-full flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="gap-1"
              disabled={loading}
            >
              <ChevronLeftIcon className="h-4 w-4" /> Back
            </Button>
            <Button 
              onClick={handleFinish} 
              disabled={loading}
              className="gap-1 bg-primary hover:bg-primary/90 text-white"
            >
              {loading ? "Processing..." : "Complete Campaign"} <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
