'use client';

import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, CheckCircle2, Filter, MapPin, RefreshCw, X } from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Area
} from 'recharts';
import { useState, useEffect } from 'react';

// Custom tooltip component to avoid TypeScript errors
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Special tooltip for Dec 27
    if (label === "Dec 27") {
      return (
        <div className="bg-gray-800 text-white p-2 rounded shadow-lg text-sm">
          <p className="mb-1 font-bold">Dec 27</p>
          <p>AOV: $22.24</p>
          <p>Items per order: 1.92</p>
        </div>
      );
    }
    
    return (
      <div className="bg-gray-800 text-white p-2 rounded shadow-lg text-sm">
        <p className="mb-1 font-bold">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`}>
            {entry.name === 'aov' ? 'AOV' : 
             entry.name === 'itemsPerOrder' ? 'Items per order' : 
             entry.name === 'returnRate' ? 'Return Rate' : 
             entry.name === 'frequency' ? 'Frequency' : entry.name}: 
            {entry.name === 'aov' ? ` $${Number(entry.value).toFixed(2)}` : 
             entry.name === 'returnRate' ? ` ${(Number(entry.value) * 100).toFixed(1)}%` : 
             ` ${Number(entry.value).toFixed(2)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Sample data for the charts
const salesOrdersData = [
  { name: 'Jan', sales: 250000, orders: 12000 },
  { name: 'Feb', sales: 250000, orders: 13000 },
  { name: 'Mar', sales: 325000, orders: 15000 },
  { name: 'Apr', sales: 380000, orders: 17000 },
  { name: 'May', sales: 400000, orders: 20000 },
  { name: 'Jun', sales: 380000, orders: 19000 },
  { name: 'Jul', sales: 400000, orders: 20000 },
  { name: 'Aug', sales: 380000, orders: 18000 },
  { name: 'Sep', sales: 380000, orders: 19000 },
  { name: 'Oct', sales: 450000, orders: 23000 },
  { name: 'Nov', sales: 450000, orders: 23000 },
  { name: 'Dec', sales: 450000, orders: 23000 },
  { name: 'Jan', sales: 400000, orders: 18000 },
  { name: 'Feb', sales: 50000, orders: 2000 },
];

// AOV and Items per order data
const aovItemsData = Array.from({ length: 58 }, (_, i) => ({
  name: i < 30 ? `Dec ${18 + i}` : `Jan ${i - 29}`,
  aov: 20 + Math.random() * 5,
  itemsPerOrder: 1.5 + Math.random() * 0.5,
  // Adding a special point for Dec 27 to match the screenshot
  ...(i === 9 && { aov: 28, itemsPerOrder: 1.92 })
}));

// Return Rate vs Frequency data
const returnRateData = Array.from({ length: 58 }, (_, i) => {
  // First generate high frequency data for most days
  let frequency = i < 50 ? 5 + Math.random() : (5 - i * 0.1 + Math.random() * 1);
  // Then apply decline at the end  
  frequency = Math.max(0.5, frequency);
  
  // Generate return rate that shows inverse relationship with frequency at the end
  let returnRate;
  if (i < 50) {
    returnRate = 0.05 + Math.random() * 0.02; // 5-7% for most of the time
  } else {
    returnRate = 0.05 + (58 - i) * 0.005; // Increasing as frequency decreases
  }
  
  return {
    name: i < 30 ? `Dec ${18 + i}` : `Jan ${i - 29}`,
    frequency: frequency,
    returnRate: returnRate
  };
});

// Total Sales and Total Discounts data
const salesDiscountsData = [
  { name: 'December 16, 2024', totalSales: 280000, totalDiscounts: 12000 },
  { name: 'December 23, 2024', totalSales: 290000, totalDiscounts: 13000 },
  { name: 'December 30, 2024', totalSales: 350000, totalDiscounts: 15000 },
  { name: 'January 6, 2025', totalSales: 410000, totalDiscounts: 16000 },
  { name: 'January 13, 2025', totalSales: 425000, totalDiscounts: 15000 },
  { name: 'January 20, 2025', totalSales: 405000, totalDiscounts: 15500 },
  { name: 'January 27, 2025', totalSales: 415000, totalDiscounts: 16000 },
  { name: 'February 3, 2025', totalSales: 400000, totalDiscounts: 15000 },
  { name: 'February 10, 2025', totalSales: 405000, totalDiscounts: 14000 },
  { name: 'February 17, 2025', totalSales: 465000, totalDiscounts: 14500 },
  { name: 'February 24, 2025', totalSales: 455000, totalDiscounts: 15000 },
  { name: 'March 3, 2025', totalSales: 470000, totalDiscounts: 15000 },
  { name: 'March 10, 2025', totalSales: 425000, totalDiscounts: 14000 },
  { name: 'March 17, 2025', totalSales: 70000, totalDiscounts: 2500 },
];

export default function SalesOverviewPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="relative flex h-[100dvh]">
      <SidebarProvider>
        <div className="flex w-full">
          <AppSidebar user={session.user} />
          <div className="flex-1">
            <DashboardHeader title="Sales Overview" />
            <div className="flex-1 overflow-auto">
              <div className="h-full px-4 py-6">
                {/* Filters Section */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Past three months
                    <X className="h-4 w-4 ml-2" />
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    All Locations
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    All Channels
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh Data
                  </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card className="p-6">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-muted-foreground">Total Sales</h3>
                      <div className="text-3xl font-bold">$5.3M</div>
                      <div className="text-xs text-muted-foreground">December 17, 2024</div>
                      <div className="flex items-center space-x-1 mt-2">
                        <Badge variant="outline" className="text-green-500 bg-green-50">
                          ↑ 4.23%
                        </Badge>
                        <span className="text-xs text-muted-foreground">vs. previous quarter: $5.1M</span>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-6">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-muted-foreground">Total Orders</h3>
                      <div className="text-3xl font-bold">$239.8k</div>
                      <div className="text-xs text-muted-foreground">December 17, 2024</div>
                      <div className="flex items-center space-x-1 mt-2">
                        <Badge variant="outline" className="text-green-500 bg-green-50">
                          ↑ 0.82%
                        </Badge>
                        <span className="text-xs text-muted-foreground">vs. previous quarter: $237.9k</span>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-6">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-muted-foreground">Average Order Value</h3>
                      <div className="text-3xl font-bold">$21.96</div>
                      <div className="text-xs text-muted-foreground">December 17, 2024</div>
                      <div className="flex items-center space-x-1 mt-2">
                        <Badge variant="outline" className="text-green-500 bg-green-50">
                          ↑ 3.39%
                        </Badge>
                        <span className="text-xs text-muted-foreground">vs. previous quarter: $21.24</span>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-6">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-muted-foreground">Average Orders Per Customer</h3>
                      <div className="text-3xl font-bold">1.67</div>
                      <div className="text-xs text-muted-foreground">December 17, 2024</div>
                      <div className="flex items-center space-x-1 mt-2">
                        <Badge variant="outline" className="text-red-500 bg-red-50">
                          ↓ 4.39%
                        </Badge>
                        <span className="text-xs text-muted-foreground">vs. previous quarter: 1.74</span>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* First Chart: Sales and Orders */}
                <Card className="p-6 mb-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">Sales and Orders</h3>
                    <div className="flex items-center space-x-4 mt-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm">Sales</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm">Orders</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={salesOrdersData}
                        margin={{
                          top: 20,
                          right: 20,
                          bottom: 20,
                          left: 20,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis 
                          yAxisId="left"
                          orientation="left"
                          stroke="#8884d8"
                          tickFormatter={(value) => `$${value/1000}k`}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          stroke="#82ca9d"
                        />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'sales' ? `$${Number(value).toLocaleString()}` : Number(value).toLocaleString(),
                            name === 'sales' ? 'Sales' : 'Orders'
                          ]} 
                        />
                        <Bar 
                          yAxisId="left"
                          dataKey="sales" 
                          fill="#8dd1e1"
                          barSize={20} 
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="orders" 
                          stroke="#1e40af"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                
                {/* Second Chart: AOV and Items per order */}
                <Card className="p-6 mb-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">AOV and Items per order</h3>
                    <div className="flex items-center space-x-4 mt-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm">AOV</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm">Items per order</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={aovItemsData}
                        margin={{
                          top: 20,
                          right: 30,
                          bottom: 20,
                          left: 20,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          tick={{fontSize: 10}}
                          tickFormatter={(value) => {
                            // Show only some of the dates for readability
                            return value.includes("Dec 18") ? "Dec 18" : 
                                   value.includes("Feb 12") ? "Feb 12" : "";
                          }}
                        />
                        <YAxis 
                          yAxisId="left"
                          orientation="left"
                          domain={[0, 60]}
                          tickFormatter={(value) => `$${value.toFixed(2)}`}
                          label={{ value: 'Amount', angle: -90, position: 'insideLeft' }}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          domain={[0, 5]}
                          label={{ value: 'Amount', angle: 90, position: 'insideRight' }}
                        />
                        <Tooltip content={CustomTooltip} />
                        <Bar 
                          yAxisId="left"
                          dataKey="aov" 
                          fill="#82ca9d"
                          barSize={8} 
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="itemsPerOrder" 
                          stroke="#1e40af"
                          strokeWidth={2}
                          dot={{ r: 2 }}
                          activeDot={{ r: 4 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                
                {/* Third Chart: Return Rate vs Frequency */}
                <Card className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">Return Rate vs Frequency</h3>
                    <div className="flex items-center space-x-4 mt-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm">Return Rate</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm">Frequency</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={returnRateData}
                        margin={{
                          top: 20,
                          right: 30,
                          bottom: 20,
                          left: 20,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          tick={{fontSize: 10}}
                          tickFormatter={(value) => {
                            // Show only some of the dates for readability
                            return value.includes("Dec 18") ? "Dec 18" : 
                                   value.includes("Feb 12") ? "Feb 12" : "";
                          }}
                        />
                        <YAxis 
                          yAxisId="left"
                          orientation="left"
                          domain={[0, 6]}
                          label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          domain={[0, 0.08]}
                          tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                          label={{ value: 'Return Rate', angle: 90, position: 'insideRight' }}
                        />
                        <Tooltip content={CustomTooltip} />
                        <Bar 
                          yAxisId="left"
                          dataKey="frequency" 
                          fill="#82ca9d"
                          barSize={8} 
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="returnRate" 
                          stroke="#1e40af"
                          strokeWidth={2}
                          dot={{ r: 2 }}
                          activeDot={{ r: 4 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                
                {/* Fourth Chart: Total Sales and Total Discounts */}
                <Card className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">Total Sales and Total Discounts</h3>
                    <div className="flex items-center space-x-4 mt-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-800"></div>
                        <span className="text-sm">Total Sales</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                        <span className="text-sm">Total Discounts</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={salesDiscountsData}
                        margin={{
                          top: 20,
                          right: 30,
                          bottom: 60,
                          left: 20,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          tick={{fontSize: 9, angle: -45, textAnchor: 'end'}}
                          height={60}
                        />
                        <YAxis 
                          yAxisId="left"
                          orientation="left"
                          domain={[0, 900000]}
                          tickFormatter={(value) => `$${value.toLocaleString()}`}
                          label={{ value: 'Total Sales', angle: -90, position: 'insideLeft' }}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          domain={[0, 40000]}
                          tickFormatter={(value) => `$${value.toLocaleString()}`}
                          label={{ value: 'Total Discounts', angle: 90, position: 'insideRight' }}
                        />
                        <Tooltip 
                          formatter={(value, name) => [
                            `$${Number(value).toLocaleString()}`,
                            name === 'totalSales' ? 'Total Sales' : 'Total Discounts'
                          ]}
                        />
                        <Bar 
                          yAxisId="left"
                          dataKey="totalSales" 
                          fill="#1e4235"
                          barSize={24} 
                          name="Total Sales"
                        />
                        <Bar 
                          yAxisId="right"
                          dataKey="totalDiscounts" 
                          fill="#60b394"
                          barSize={24}
                          name="Total Discounts" 
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
} 