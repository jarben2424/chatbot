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
        <div className="bg-gray-800 text-white p-3 rounded-md shadow-lg text-sm border border-gray-700">
          <p className="mb-2 font-bold">{label}</p>
          <p className="flex justify-between"><span>AOV:</span> <span className="font-medium">$22.24</span></p>
          <p className="flex justify-between"><span>Items per order:</span> <span className="font-medium">1.92</span></p>
        </div>
      );
    }
    
    return (
      <div className="bg-gray-800 text-white p-3 rounded-md shadow-lg text-sm border border-gray-700">
        <p className="mb-2 font-bold">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} className="flex justify-between">
            <span>
              {entry.name === 'aov' ? 'AOV' : 
               entry.name === 'itemsPerOrder' ? 'Items per order' : 
               entry.name === 'returnRate' ? 'Return Rate' : 
               entry.name === 'frequency' ? 'Frequency' : 
               entry.name === 'totalSales' ? 'Total Sales' :
               entry.name === 'totalDiscounts' ? 'Total Discounts' : 
               entry.name}:
            </span>
            <span className="font-medium ml-4">
              {entry.name === 'aov' ? ` $${Number(entry.value).toFixed(2)}` : 
               entry.name === 'returnRate' ? ` ${(Number(entry.value) * 100).toFixed(1)}%` : 
               entry.name === 'totalSales' || entry.name === 'totalDiscounts' ? 
               ` $${Number(entry.value).toLocaleString()}` :
               ` ${Number(entry.value).toFixed(2)}`}
            </span>
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
            <div className="flex-1 overflow-auto bg-slate-50/30">
              <div className="h-full p-6 max-w-7xl mx-auto">
                {/* Filters Section */}
                <div className="flex flex-wrap gap-2 mb-8">
                  <Button variant="outline" className="flex items-center gap-2 bg-white hover:bg-slate-50 shadow-sm">
                    <Filter className="h-4 w-4" />
                    Past three months
                    <X className="h-4 w-4 ml-2 opacity-70" />
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2 bg-white hover:bg-slate-50 shadow-sm">
                    <MapPin className="h-4 w-4" />
                    All Locations
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2 bg-white hover:bg-slate-50 shadow-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    All Channels
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2 bg-white hover:bg-slate-50 shadow-sm">
                    <RefreshCw className="h-4 w-4" />
                    Refresh Data
                  </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card className="p-6 bg-white shadow-md hover:shadow-lg transition-shadow">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Sales</h3>
                      <div className="text-3xl font-bold mb-1">$5.3M</div>
                      <div className="text-xs text-muted-foreground mb-3">December 17, 2024</div>
                      <div className="flex flex-col space-y-1">
                        <div>
                          <Badge variant="outline" className="text-green-600 bg-green-50 font-medium border-green-200 px-2 py-1">
                            ↑ 4.23%
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">vs. previous quarter: $5.1M</div>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-6 bg-white shadow-md hover:shadow-lg transition-shadow">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Orders</h3>
                      <div className="text-3xl font-bold mb-1">$239.8k</div>
                      <div className="text-xs text-muted-foreground mb-3">December 17, 2024</div>
                      <div className="flex flex-col space-y-1">
                        <div>
                          <Badge variant="outline" className="text-green-600 bg-green-50 font-medium border-green-200 px-2 py-1">
                            ↑ 0.82%
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">vs. previous quarter: $237.9k</div>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-6 bg-white shadow-md hover:shadow-lg transition-shadow">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Average Order Value</h3>
                      <div className="text-3xl font-bold mb-1">$21.96</div>
                      <div className="text-xs text-muted-foreground mb-3">December 17, 2024</div>
                      <div className="flex flex-col space-y-1">
                        <div>
                          <Badge variant="outline" className="text-green-600 bg-green-50 font-medium border-green-200 px-2 py-1">
                            ↑ 3.39%
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">vs. previous quarter: $21.24</div>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-6 bg-white shadow-md hover:shadow-lg transition-shadow">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Average Orders Per Customer</h3>
                      <div className="text-3xl font-bold mb-1">1.67</div>
                      <div className="text-xs text-muted-foreground mb-3">December 17, 2024</div>
                      <div className="flex flex-col space-y-1">
                        <div>
                          <Badge variant="outline" className="text-red-600 bg-red-50 font-medium border-red-200 px-2 py-1">
                            ↓ 4.39%
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">vs. previous quarter: 1.74</div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* First Chart: Sales and Orders */}
                <Card className="p-6 mb-8 bg-white shadow-md">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold">Sales and Orders</h3>
                    <div className="flex items-center space-x-4 mt-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                        <span className="text-sm">Sales</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
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
                          right: 30,
                          bottom: 20,
                          left: 30,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: '#666' }} axisLine={{ stroke: '#e0e0e0' }} />
                        <YAxis 
                          yAxisId="left"
                          orientation="left"
                          stroke="#6366f1"
                          tickFormatter={(value) => `$${value/1000}k`}
                          tick={{ fill: '#666' }}
                          axisLine={{ stroke: '#e0e0e0' }}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          stroke="#10b981"
                          tick={{ fill: '#666' }}
                          axisLine={{ stroke: '#e0e0e0' }}
                        />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'sales' ? `$${Number(value).toLocaleString()}` : Number(value).toLocaleString(),
                            name === 'sales' ? 'Sales' : 'Orders'
                          ]} 
                          contentStyle={{ borderRadius: '6px', border: '1px solid #e0e0e0' }}
                        />
                        <Legend />
                        <Bar 
                          yAxisId="left"
                          dataKey="sales" 
                          fill="#818cf8"
                          name="Sales"
                          barSize={24} 
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="orders" 
                          stroke="#10b981"
                          name="Orders"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
                          activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                
                {/* Second Chart: AOV and Items per order */}
                <Card className="p-6 mb-8 bg-white shadow-md">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold">AOV and Items per order</h3>
                    <div className="flex items-center space-x-4 mt-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm">AOV</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
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
                          right: 40,
                          bottom: 20,
                          left: 40,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          tick={{
                            fontSize: 10,
                            fill: '#666'
                          }}
                          tickFormatter={(value) => {
                            // Show dates at regular intervals for readability
                            const day = parseInt(value.split(" ")[1]);
                            return (day % 7 === 0 || day === 18) ? value : "";
                          }}
                          height={40}
                          axisLine={{ stroke: '#e0e0e0' }}
                        />
                        <YAxis 
                          yAxisId="left"
                          orientation="left"
                          domain={[0, 60]}
                          tickFormatter={(value) => `$${value.toFixed(0)}`}
                          label={{ value: 'AOV', angle: -90, position: 'insideLeft', offset: -25, style: { textAnchor: 'middle', fill: '#666' } }}
                          tick={{ fill: '#666' }}
                          axisLine={{ stroke: '#e0e0e0' }}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          domain={[0, 5]}
                          label={{ value: 'Items/Order', angle: 90, position: 'insideRight', offset: -15, style: { textAnchor: 'middle', fill: '#666' } }}
                          tick={{ fill: '#666' }}
                          axisLine={{ stroke: '#e0e0e0' }}
                        />
                        <Tooltip content={CustomTooltip} />
                        <Legend />
                        <Bar 
                          yAxisId="left"
                          dataKey="aov" 
                          fill="#3b82f6"
                          name="AOV"
                          barSize={6} 
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="itemsPerOrder" 
                          stroke="#f59e0b"
                          name="Items per order"
                          strokeWidth={3}
                          dot={{ r: 2, fill: "#f59e0b", strokeWidth: 0 }}
                          activeDot={{ r: 4, fill: "#f59e0b", stroke: "#fff", strokeWidth: 2 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                
                {/* Third Chart: Return Rate vs Frequency */}
                <Card className="p-6 mb-8 bg-white shadow-md">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold">Return Rate vs Frequency</h3>
                    <div className="flex items-center space-x-4 mt-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                        <span className="text-sm">Return Rate</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-violet-500"></div>
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
                          right: 40,
                          bottom: 20,
                          left: 40,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          tick={{
                            fontSize: 10,
                            fill: '#666'
                          }}
                          tickFormatter={(value) => {
                            // Show dates at regular intervals for readability
                            const day = parseInt(value.split(" ")[1]);
                            return (day % 7 === 0 || day === 18) ? value : "";
                          }}
                          height={40}
                          axisLine={{ stroke: '#e0e0e0' }}
                        />
                        <YAxis 
                          yAxisId="left"
                          orientation="left"
                          domain={[0, 6]}
                          label={{ value: 'Frequency', angle: -90, position: 'insideLeft', offset: -25, style: { textAnchor: 'middle', fill: '#666' } }}
                          tick={{ fill: '#666' }}
                          axisLine={{ stroke: '#e0e0e0' }}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          domain={[0, 0.08]}
                          tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                          label={{ value: 'Return Rate', angle: 90, position: 'insideRight', offset: -15, style: { textAnchor: 'middle', fill: '#666' } }}
                          tick={{ fill: '#666' }}
                          axisLine={{ stroke: '#e0e0e0' }}
                        />
                        <Tooltip content={CustomTooltip} />
                        <Legend />
                        <Bar 
                          yAxisId="left"
                          dataKey="frequency" 
                          fill="#8b5cf6"
                          name="Frequency"
                          barSize={6} 
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="returnRate" 
                          stroke="#f43f5e"
                          name="Return Rate"
                          strokeWidth={3}
                          dot={{ r: 2, fill: "#f43f5e", strokeWidth: 0 }}
                          activeDot={{ r: 4, fill: "#f43f5e", stroke: "#fff", strokeWidth: 2 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                
                {/* Fourth Chart: Total Sales and Total Discounts */}
                <Card className="p-6 bg-white shadow-md">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold">Total Sales and Total Discounts</h3>
                    <div className="flex items-center space-x-4 mt-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-teal-700"></div>
                        <span className="text-sm">Total Sales</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-teal-300"></div>
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
                          right: 40,
                          bottom: 65,
                          left: 40,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          tick={{
                            fontSize: 9,
                            fill: '#666',
                            textAnchor: 'end',
                            transform: 'rotate(-45)'
                          }}
                          height={65}
                          axisLine={{ stroke: '#e0e0e0' }}
                          tickFormatter={(value) => {
                            // Format the date to be more concise
                            return value.replace(', 2024', '').replace(', 2025', '');
                          }}
                        />
                        <YAxis 
                          yAxisId="left"
                          orientation="left"
                          domain={[0, 900000]}
                          tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                          label={{ value: 'Total Sales', angle: -90, position: 'insideLeft', offset: -25, style: { textAnchor: 'middle', fill: '#666' } }}
                          tick={{ fill: '#666' }}
                          axisLine={{ stroke: '#e0e0e0' }}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          domain={[0, 40000]}
                          tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                          label={{ value: 'Total Discounts', angle: 90, position: 'insideRight', offset: -10, style: { textAnchor: 'middle', fill: '#666' } }}
                          tick={{ fill: '#666' }}
                          axisLine={{ stroke: '#e0e0e0' }}
                        />
                        <Tooltip content={CustomTooltip} />
                        <Legend />
                        <Bar 
                          yAxisId="left"
                          dataKey="totalSales" 
                          fill="#0f766e"
                          barSize={20} 
                          name="Total Sales"
                        />
                        <Bar 
                          yAxisId="right"
                          dataKey="totalDiscounts" 
                          fill="#5eead4"
                          barSize={20}
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