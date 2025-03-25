'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CampaignHeader } from '../../../_components/campaign-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CoffeeIcon, 
  DollarSignIcon, 
  ShoppingBagIcon, 
  UtensilsIcon,
  IceCreamIcon,
  CalendarIcon,
  GiftIcon,
  TagIcon,
  UserPlusIcon,
  StarIcon,
  HeartIcon,
  ClockIcon,
  PercentIcon,
  BadgePercentIcon,
  SmartphoneIcon,
  TruckIcon,
  PlusCircleIcon,
  XCircleIcon,
  SearchIcon,
  FilterIcon
} from 'lucide-react';

// Sample offers data with added value property
const availableOffers = [
  {
    id: 'offer-1',
    title: 'Free Large Drink',
    description: 'Free large drink with any purchase of $15 or more',
    icon: CoffeeIcon,
    popular: true,
    value: 'low',
    category: 'food-beverage'
  },
  {
    id: 'offer-2',
    title: 'BOGO Sandwich',
    description: 'Buy one sandwich, get one free (of equal or lesser value)',
    icon: UtensilsIcon,
    popular: true,
    value: 'medium',
    category: 'food-beverage'
  },
  {
    id: 'offer-3',
    title: '$5 Off $25+',
    description: 'Save $5 on any purchase of $25 or more',
    icon: DollarSignIcon,
    popular: false,
    value: 'low',
    category: 'discount'
  },
  {
    id: 'offer-4',
    title: '20% Off Entire Order',
    description: 'Save 20% on your entire order (max discount $30)',
    icon: ShoppingBagIcon,
    popular: true,
    value: 'high',
    category: 'discount'
  },
  {
    id: 'offer-5',
    title: 'Free Delivery',
    description: 'Free delivery on any order of $20 or more',
    icon: TruckIcon,
    popular: false,
    value: 'medium',
    category: 'service'
  },
  {
    id: 'offer-6',
    title: '$10 Off First Order',
    description: 'New customers save $10 on their first order',
    icon: DollarSignIcon,
    popular: false,
    value: 'medium',
    category: 'discount'
  },
  {
    id: 'offer-7',
    title: 'Free Dessert',
    description: 'Complimentary dessert with any entrée purchase',
    icon: IceCreamIcon,
    popular: true,
    value: 'low',
    category: 'food-beverage'
  },
  {
    id: 'offer-8',
    title: 'Loyalty Points 2X',
    description: 'Earn double loyalty points on all purchases',
    icon: StarIcon,
    popular: true,
    value: 'medium',
    category: 'loyalty'
  },
  {
    id: 'offer-9',
    title: 'Happy Hour Special',
    description: '50% off all drinks between 4-6pm daily',
    icon: ClockIcon,
    popular: true,
    value: 'high',
    category: 'food-beverage'
  },
  {
    id: 'offer-10',
    title: 'Birthday Gift',
    description: 'Free item of choice during customer\'s birthday month',
    icon: GiftIcon,
    popular: false,
    value: 'medium',
    category: 'loyalty'
  },
  {
    id: 'offer-11',
    title: 'Weekend Special',
    description: 'Get 15% off your entire order on weekends',
    icon: CalendarIcon,
    popular: false,
    value: 'medium',
    category: 'discount'
  },
  {
    id: 'offer-12',
    title: 'Family Bundle Discount',
    description: '25% off family-sized meal bundles',
    icon: HeartIcon,
    popular: true,
    value: 'high',
    category: 'discount'
  },
  {
    id: 'offer-13',
    title: 'Refer a Friend',
    description: 'Get $15 credit when a referred friend makes their first purchase',
    icon: UserPlusIcon,
    popular: true,
    value: 'high',
    category: 'loyalty'
  },
  {
    id: 'offer-14',
    title: 'Seasonal Menu Item',
    description: '30% off our featured seasonal menu items',
    icon: UtensilsIcon,
    popular: false,
    value: 'medium',
    category: 'food-beverage'
  },
  {
    id: 'offer-15',
    title: 'First-Time App User',
    description: 'Get $8 off your first order through our mobile app',
    icon: SmartphoneIcon,
    popular: true,
    value: 'medium',
    category: 'service'
  },
  {
    id: 'offer-16',
    title: 'Combo Meal Deal',
    description: 'Save $3 when you buy a sandwich, side, and drink',
    icon: UtensilsIcon,
    popular: false,
    value: 'low',
    category: 'food-beverage'
  },
  {
    id: 'offer-17',
    title: 'Lunch Rush Special',
    description: '10% off all orders placed between 11am-1pm',
    icon: ClockIcon,
    popular: false,
    value: 'low',
    category: 'discount'
  },
  {
    id: 'offer-18',
    title: 'Buy 2 Get 1 Free',
    description: 'Buy any 2 items, get a 3rd item free (equal or lesser value)',
    icon: ShoppingBagIcon,
    popular: true,
    value: 'high',
    category: 'food-beverage'
  },
  {
    id: 'offer-19',
    title: 'Premium Membership Offer',
    description: 'Exclusive 25% discount for premium membership customers',
    icon: BadgePercentIcon,
    popular: false,
    value: 'high',
    category: 'loyalty'
  },
  {
    id: 'offer-20',
    title: 'New Menu Item Promotion',
    description: '40% off our newest menu items for a limited time',
    icon: TagIcon,
    popular: true,
    value: 'medium',
    category: 'food-beverage'
  },
];

const offerValueLabels = {
  low: 'Low Value (< $5)',
  medium: 'Medium Value ($5-$15)',
  high: 'High Value (> $15)'
};

const offerCategoryLabels = {
  'food-beverage': 'Food & Beverage',
  'discount': 'Discounts',
  'service': 'Services',
  'loyalty': 'Loyalty & Rewards'
};

export default function CampaignOffersPage() {
  const [selectedOfferIds, setSelectedOfferIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [valueFilter, setValueFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [filteredOffers, setFilteredOffers] = useState(availableOffers);
  const router = useRouter();
  
  // Get selected offers objects from IDs
  const selectedOffers = availableOffers.filter(offer => 
    selectedOfferIds.includes(offer.id)
  );
  
  // Apply filters
  useEffect(() => {
    let result = availableOffers;
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(offer => 
        offer.title.toLowerCase().includes(term) || 
        offer.description.toLowerCase().includes(term)
      );
    }
    
    // Apply value filter
    if (valueFilter && valueFilter !== 'all-values') {
      result = result.filter(offer => offer.value === valueFilter);
    }
    
    // Apply category filter
    if (categoryFilter && categoryFilter !== 'all-categories') {
      result = result.filter(offer => offer.category === categoryFilter);
    }
    
    // Filter out already selected offers
    result = result.filter(offer => !selectedOfferIds.includes(offer.id));
    
    setFilteredOffers(result);
  }, [searchTerm, valueFilter, categoryFilter, selectedOfferIds]);
  
  const addOffer = (id: string) => {
    setSelectedOfferIds(prev => [...prev, id]);
  };
  
  const removeOffer = (id: string) => {
    setSelectedOfferIds(prev => prev.filter(offerId => offerId !== id));
  };

  const handleBack = () => {
    router.push('/campaigns/create');
  };
  
  const handleNext = () => {
    // In a production app, we would save the selected offers
    // to a global state or backend before proceeding
    router.push('/campaigns/create/segment');
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setValueFilter('');
    setCategoryFilter('');
  };
  
  const step = 2;
  const hasSelectedOffers = selectedOfferIds.length > 0;

  // Render an offer card
  const renderOfferCard = (offer: typeof availableOffers[0], isSelected: boolean = false) => {
    const OfferIcon = offer.icon;
    
    return (
      <div 
        key={offer.id}
        className="border rounded-lg p-4 mb-3 hover:bg-muted/5 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {OfferIcon && <OfferIcon className="h-5 w-5 text-primary mt-0.5" />}
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <span className="font-medium">{offer.title}</span>
                {offer.popular && (
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100 border-none text-xs">
                    Popular
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {offerValueLabels[offer.value as keyof typeof offerValueLabels]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {offer.description}
              </p>
              <Badge variant="outline" className="mt-2 text-xs">
                {offerCategoryLabels[offer.category as keyof typeof offerCategoryLabels]}
              </Badge>
            </div>
          </div>
          <div className="flex items-center self-stretch ml-4 pl-2">
            {isSelected ? (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/20"
                onClick={() => removeOffer(offer.id)}
              >
                <XCircleIcon className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/20"
                onClick={() => addOffer(offer.id)}
              >
                <PlusCircleIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <CampaignHeader />
        <div className="flex-1 flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full pb-24">
          <div className="mb-4 md:mb-8">
            <h1 className="text-3xl font-bold">Create Campaign</h1>
            <p className="text-muted-foreground">Step {step} of 5 - Select Offers</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 flex-1">
            {/* LEFT COLUMN - Selected Offers */}
            <div className="flex flex-col">
              <Card className="flex-1">
                <CardHeader className="pb-3">
                  <CardTitle>Selected Offers ({selectedOffers.length})</CardTitle>
                  <CardDescription>
                    These offers will be included in your campaign
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedOffers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center">
                      <p className="text-muted-foreground">No offers selected yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add offers from the available list
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {selectedOffers.map(offer => renderOfferCard(offer, true))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* RIGHT COLUMN - Available Offers */}
            <div className="flex flex-col">
              <Card className="flex-1">
                <CardHeader className="pb-3">
                  <CardTitle>Available Offers</CardTitle>
                  <CardDescription>
                    Select offers to add to your campaign
                  </CardDescription>
                  <div className="pt-2 space-y-3">
                    <div className="relative">
                      <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search offers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex-1 min-w-[180px]">
                        <Select value={valueFilter} onValueChange={setValueFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Filter by value" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all-values">All Values</SelectItem>
                            <SelectItem value="low">Low Value ({"<"} $5)</SelectItem>
                            <SelectItem value="medium">Medium Value ($5-$15)</SelectItem>
                            <SelectItem value="high">High Value ({">"}$15)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 min-w-[180px]">
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Filter by category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all-categories">All Categories</SelectItem>
                            <SelectItem value="food-beverage">Food & Beverage</SelectItem>
                            <SelectItem value="discount">Discounts</SelectItem>
                            <SelectItem value="service">Services</SelectItem>
                            <SelectItem value="loyalty">Loyalty & Rewards</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {(searchTerm || valueFilter || categoryFilter) && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={clearFilters}
                          className="text-xs h-10"
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredOffers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center">
                      <p className="text-muted-foreground">No offers match your filters</p>
                      <Button 
                        variant="link" 
                        onClick={clearFilters}
                        className="mt-2"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2">
                      {filteredOffers.map(offer => renderOfferCard(offer))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Fixed navigation bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t py-4 px-6 flex justify-between z-10">
          <div className="max-w-7xl mx-auto w-full flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="gap-1"
            >
              <ChevronLeftIcon className="h-4 w-4" /> Back
            </Button>
            <Button 
              onClick={handleNext} 
              disabled={!hasSelectedOffers}
              className="gap-1"
            >
              Next Step <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
