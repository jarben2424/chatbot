'use client';

import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Users, FilterX, MessageSquareText, PlusCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Sample customer data
const customersData = [
  { 
    id: 1, 
    name: 'John Smith', 
    email: 'john.smith@example.com', 
    location: 'New York, NY', 
    status: 'Active', 
    lastPurchase: '2025-03-05',
    totalSpent: '$4,295.75'
  },
  { 
    id: 2, 
    name: 'Sarah Johnson', 
    email: 'sarah.j@example.com', 
    location: 'San Francisco, CA', 
    status: 'Active', 
    lastPurchase: '2025-03-08',
    totalSpent: '$8,942.50'
  },
  { 
    id: 3, 
    name: 'Michael Brown', 
    email: 'michael.b@example.com', 
    location: 'Chicago, IL', 
    status: 'Inactive', 
    lastPurchase: '2025-01-12',
    totalSpent: '$1,250.00'
  },
  { 
    id: 4, 
    name: 'Emily Davis', 
    email: 'emily.d@example.com', 
    location: 'Austin, TX', 
    status: 'Active', 
    lastPurchase: '2025-03-01',
    totalSpent: '$3,756.25'
  },
  { 
    id: 5, 
    name: 'Robert Wilson', 
    email: 'robert.w@example.com', 
    location: 'Miami, FL', 
    status: 'Active', 
    lastPurchase: '2025-02-15',
    totalSpent: '$6,125.80'
  },
  { 
    id: 6, 
    name: 'Amanda Taylor', 
    email: 'amanda.t@example.com', 
    location: 'Seattle, WA', 
    status: 'Inactive', 
    lastPurchase: '2024-11-03',
    totalSpent: '$875.30'
  },
  { 
    id: 7, 
    name: 'Daniel Harris', 
    email: 'daniel.h@example.com', 
    location: 'Denver, CO', 
    status: 'Active', 
    lastPurchase: '2025-03-10',
    totalSpent: '$5,267.90'
  },
  { 
    id: 8, 
    name: 'Jessica Miller', 
    email: 'jessica.m@example.com', 
    location: 'Boston, MA', 
    status: 'Active', 
    lastPurchase: '2025-03-07',
    totalSpent: '$2,945.60'
  }
];

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [segmentName, setSegmentName] = useState('');
  const [spendOperator, setSpendOperator] = useState('greaterThan');
  const [spendAmount, setSpendAmount] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
  
  const filteredCustomers = customersData.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSegment = () => {
    // Here you would implement the segment creation logic
    console.log('Creating segment with name:', segmentName);
    if (naturalLanguageQuery) {
      console.log('Natural language query:', naturalLanguageQuery);
    } else {
      console.log('Filters:', {
        spend: { operator: spendOperator, amount: spendAmount },
        location: locationFilter,
        status: statusFilter
      });
    }
    // Close the sheet (would be handled by the SheetClose component)
  };

  return (
    <div className="flex flex-col p-8 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">View and manage your customer database</p>
        </div>
      </div>
      
      <Card className="w-full mb-8">
        <CardHeader>
          <CardTitle>Customer Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Total Customers</span>
            <span className="text-2xl font-bold">8</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Active Customers</span>
            <span className="text-2xl font-bold">6</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Average Spend</span>
            <span className="text-2xl font-bold">$4,182.39</span>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between items-center mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            className="pl-8 w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Segment
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Create Customer Segment</SheetTitle>
              <SheetDescription>
                Create a segment based on customer attributes using filters or natural language.
              </SheetDescription>
            </SheetHeader>
            
            <div className="py-6">
              <div className="mb-4">
                <Label htmlFor="segment-name">Segment Name</Label>
                <Input 
                  id="segment-name" 
                  placeholder="e.g., High Value East Coast Customers" 
                  className="mt-1"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                />
              </div>
              
              <Tabs defaultValue="rules" className="mt-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="rules" className="flex items-center">
                    <FilterX className="mr-2 h-4 w-4" />
                    Rules-Based
                  </TabsTrigger>
                  <TabsTrigger value="natural" className="flex items-center">
                    <MessageSquareText className="mr-2 h-4 w-4" />
                    Natural Language
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="rules" className="space-y-4 mt-4">
                  <div>
                    <Label>Total Spend</Label>
                    <div className="flex gap-2 mt-1">
                      <Select value={spendOperator} onValueChange={setSpendOperator}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Operator" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="greaterThan">Greater than</SelectItem>
                          <SelectItem value="lessThan">Less than</SelectItem>
                          <SelectItem value="between">Between</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input 
                        placeholder="Amount" 
                        value={spendAmount}
                        onChange={(e) => setSpendAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Location</Label>
                    <Input 
                      placeholder="e.g., New York, East Coast" 
                      className="mt-1"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label>Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="any">Any</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                
                <TabsContent value="natural" className="space-y-4 mt-4">
                  <div>
                    <Label>Describe your segment in natural language</Label>
                    <Textarea 
                      placeholder="e.g., Active customers from the west coast who spent more than $5,000 in the last month" 
                      className="mt-1 h-32"
                      value={naturalLanguageQuery}
                      onChange={(e) => setNaturalLanguageQuery(e.target.value)}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            <SheetFooter>
              <SheetClose asChild>
                <Button variant="outline">Cancel</Button>
              </SheetClose>
              <Button onClick={handleCreateSegment}>Create Segment</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Purchase</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.location}</TableCell>
                  <TableCell>
                    <Badge variant={customer.status === 'Active' ? 'default' : 'secondary'}>
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{customer.lastPurchase}</TableCell>
                  <TableCell className="text-right">{customer.totalSpent}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
