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
    // Special tooltip for Dec 26
    if (label === "Dec 26") {
      return (
        <div className="bg-gray-800 text-white p-3 rounded-md shadow-lg text-sm border border-gray-700">
          <p className="mb-2 font-bold">{label}</p>
          <p className="flex justify-between"><span>AOV:</span> <span className="font-medium">$25.20</span></p>
          <p className="flex justify-between"><span>Items per order:</span> <span className="font-medium">2.05</span></p>
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
              {entry.name === 'aov' ? `$${Number(entry.value).toFixed(2)}` : 
               entry.name === 'returnRate' ? `${(Number(entry.value) * 100).toFixed(1)}%` : 
               entry.name === 'totalSales' || entry.name === 'totalDiscounts' ? 
               `$${Number(entry.value).toLocaleString()}` :
               `${Number(entry.value).toFixed(2)}`}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Sample data for the charts - Showing a full year of data (March 2024 to February 2025)
const salesOrdersData = [
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
  { name: 'Jan', sales: 420000, orders: 22000 },
  { name: 'Feb', sales: 400000, orders: 20000 },
];

// AOV and Items per order data - Weekly data points aligned with the 12-month period
const aovItemsData = [
  // March 2024
  { name: 'Mar 7', aov: 21.50, itemsPerOrder: 1.65 },
  { name: 'Mar 14', aov: 21.70, itemsPerOrder: 1.68 },
  { name: 'Mar 21', aov: 21.60, itemsPerOrder: 1.70 },
  { name: 'Mar 28', aov: 22.00, itemsPerOrder: 1.72 },
  // April 2024
  { name: 'Apr 4', aov: 22.20, itemsPerOrder: 1.75 },
  { name: 'Apr 11', aov: 22.40, itemsPerOrder: 1.78 },
  { name: 'Apr 18', aov: 22.30, itemsPerOrder: 1.76 },
  { name: 'Apr 25', aov: 22.50, itemsPerOrder: 1.80 },
  // May 2024
  { name: 'May 2', aov: 22.80, itemsPerOrder: 1.83 },
  { name: 'May 9', aov: 23.00, itemsPerOrder: 1.85 },
  { name: 'May 16', aov: 23.20, itemsPerOrder: 1.87 },
  { name: 'May 23', aov: 23.10, itemsPerOrder: 1.86 },
  { name: 'May 30', aov: 23.30, itemsPerOrder: 1.89 },
  // June 2024
  { name: 'Jun 6', aov: 23.10, itemsPerOrder: 1.87 },
  { name: 'Jun 13', aov: 23.00, itemsPerOrder: 1.85 },
  { name: 'Jun 20', aov: 22.90, itemsPerOrder: 1.84 },
  { name: 'Jun 27', aov: 22.80, itemsPerOrder: 1.83 },
  // July 2024
  { name: 'Jul 4', aov: 22.90, itemsPerOrder: 1.84 },
  { name: 'Jul 11', aov: 23.00, itemsPerOrder: 1.85 },
  { name: 'Jul 18', aov: 23.10, itemsPerOrder: 1.86 },
  { name: 'Jul 25', aov: 23.20, itemsPerOrder: 1.87 },
  // August 2024
  { name: 'Aug 1', aov: 23.10, itemsPerOrder: 1.86 },
  { name: 'Aug 8', aov: 23.00, itemsPerOrder: 1.85 },
  { name: 'Aug 15', aov: 22.90, itemsPerOrder: 1.83 },
  { name: 'Aug 22', aov: 22.80, itemsPerOrder: 1.82 },
  { name: 'Aug 29', aov: 22.70, itemsPerOrder: 1.81 },
  // September 2024
  { name: 'Sep 5', aov: 22.80, itemsPerOrder: 1.82 },
  { name: 'Sep 12', aov: 22.90, itemsPerOrder: 1.83 },
  { name: 'Sep 19', aov: 23.00, itemsPerOrder: 1.84 },
  { name: 'Sep 26', aov: 23.10, itemsPerOrder: 1.85 },
  // October 2024
  { name: 'Oct 3', aov: 23.30, itemsPerOrder: 1.86 },
  { name: 'Oct 10', aov: 23.50, itemsPerOrder: 1.88 },
  { name: 'Oct 17', aov: 23.70, itemsPerOrder: 1.90 },
  { name: 'Oct 24', aov: 23.80, itemsPerOrder: 1.91 },
  { name: 'Oct 31', aov: 24.00, itemsPerOrder: 1.93 },
  // November 2024
  { name: 'Nov 7', aov: 24.20, itemsPerOrder: 1.95 },
  { name: 'Nov 14', aov: 24.40, itemsPerOrder: 1.97 },
  { name: 'Nov 21', aov: 24.30, itemsPerOrder: 1.96 },
  { name: 'Nov 28', aov: 24.50, itemsPerOrder: 1.98 },
  // December 2024
  { name: 'Dec 5', aov: 24.70, itemsPerOrder: 2.00 },
  { name: 'Dec 12', aov: 24.90, itemsPerOrder: 2.02 },
  { name: 'Dec 19', aov: 25.00, itemsPerOrder: 2.03 },
  { name: 'Dec 26', aov: 25.20, itemsPerOrder: 2.05 },
  // January 2025
  { name: 'Jan 2', aov: 24.80, itemsPerOrder: 2.00 },
  { name: 'Jan 9', aov: 24.60, itemsPerOrder: 1.98 },
  { name: 'Jan 16', aov: 24.40, itemsPerOrder: 1.96 },
  { name: 'Jan 23', aov: 24.20, itemsPerOrder: 1.94 },
  { name: 'Jan 30', aov: 24.00, itemsPerOrder: 1.92 },
  // February 2025
  { name: 'Feb 6', aov: 23.80, itemsPerOrder: 1.90 },
  { name: 'Feb 13', aov: 23.60, itemsPerOrder: 1.88 },
  { name: 'Feb 20', aov: 23.40, itemsPerOrder: 1.86 },
  { name: 'Feb 27', aov: 23.20, itemsPerOrder: 1.84 },
];

// Return Rate vs Frequency data - Weekly data points aligned with the 12-month period
const returnRateData = [
  // March 2024
  { name: 'Mar 7', frequency: 3.2, returnRate: 0.050 },
  { name: 'Mar 14', frequency: 3.3, returnRate: 0.048 },
  { name: 'Mar 21', frequency: 3.4, returnRate: 0.047 },
  { name: 'Mar 28', frequency: 3.5, returnRate: 0.046 },
  // April 2024
  { name: 'Apr 4', frequency: 3.6, returnRate: 0.045 },
  { name: 'Apr 11', frequency: 3.7, returnRate: 0.044 },
  { name: 'Apr 18', frequency: 3.8, returnRate: 0.043 },
  { name: 'Apr 25', frequency: 3.9, returnRate: 0.042 },
  // May 2024
  { name: 'May 2', frequency: 4.0, returnRate: 0.041 },
  { name: 'May 9', frequency: 4.1, returnRate: 0.040 },
  { name: 'May 16', frequency: 4.2, returnRate: 0.039 },
  { name: 'May 23', frequency: 4.3, returnRate: 0.038 },
  { name: 'May 30', frequency: 4.4, returnRate: 0.037 },
  // June 2024
  { name: 'Jun 6', frequency: 4.3, returnRate: 0.038 },
  { name: 'Jun 13', frequency: 4.2, returnRate: 0.039 },
  { name: 'Jun 20', frequency: 4.1, returnRate: 0.040 },
  { name: 'Jun 27', frequency: 4.0, returnRate: 0.041 },
  // July 2024
  { name: 'Jul 4', frequency: 4.1, returnRate: 0.040 },
  { name: 'Jul 11', frequency: 4.2, returnRate: 0.039 },
  { name: 'Jul 18', frequency: 4.3, returnRate: 0.038 },
  { name: 'Jul 25', frequency: 4.4, returnRate: 0.037 },
  // August 2024
  { name: 'Aug 1', frequency: 4.3, returnRate: 0.038 },
  { name: 'Aug 8', frequency: 4.2, returnRate: 0.039 },
  { name: 'Aug 15', frequency: 4.1, returnRate: 0.040 },
  { name: 'Aug 22', frequency: 4.0, returnRate: 0.041 },
  { name: 'Aug 29', frequency: 3.9, returnRate: 0.042 },
  // September 2024
  { name: 'Sep 5', frequency: 4.0, returnRate: 0.041 },
  { name: 'Sep 12', frequency: 4.1, returnRate: 0.040 },
  { name: 'Sep 19', frequency: 4.2, returnRate: 0.039 },
  { name: 'Sep 26', frequency: 4.3, returnRate: 0.038 },
  // October 2024
  { name: 'Oct 3', frequency: 4.4, returnRate: 0.037 },
  { name: 'Oct 10', frequency: 4.5, returnRate: 0.036 },
  { name: 'Oct 17', frequency: 4.6, returnRate: 0.035 },
  { name: 'Oct 24', frequency: 4.7, returnRate: 0.034 },
  { name: 'Oct 31', frequency: 4.8, returnRate: 0.033 },
  // November 2024
  { name: 'Nov 7', frequency: 4.9, returnRate: 0.032 },
  { name: 'Nov 14', frequency: 5.0, returnRate: 0.031 },
  { name: 'Nov 21', frequency: 5.1, returnRate: 0.030 },
  { name: 'Nov 28', frequency: 5.2, returnRate: 0.029 },
  // December 2024
  { name: 'Dec 5', frequency: 5.3, returnRate: 0.028 },
  { name: 'Dec 12', frequency: 5.4, returnRate: 0.027 },
  { name: 'Dec 19', frequency: 5.5, returnRate: 0.026 },
  { name: 'Dec 26', frequency: 5.6, returnRate: 0.025 },
  // January 2025
  { name: 'Jan 2', frequency: 5.5, returnRate: 0.026 },
  { name: 'Jan 9', frequency: 5.4, returnRate: 0.027 },
  { name: 'Jan 16', frequency: 5.3, returnRate: 0.028 },
  { name: 'Jan 23', frequency: 5.2, returnRate: 0.029 },
  { name: 'Jan 30', frequency: 5.1, returnRate: 0.030 },
  // February 2025
  { name: 'Feb 6', frequency: 5.0, returnRate: 0.031 },
  { name: 'Feb 13', frequency: 4.9, returnRate: 0.032 },
  { name: 'Feb 20', frequency: 4.8, returnRate: 0.033 },
  { name: 'Feb 27', frequency: 4.7, returnRate: 0.034 },
];

// Total Sales and Total Discounts data - Monthly data aligned with the 12-month period
const salesDiscountsData = [
  { name: 'Mar 2024', totalSales: 325000, totalDiscounts: 13000 },
  { name: 'Apr 2024', totalSales: 380000, totalDiscounts: 15200 },
  { name: 'May 2024', totalSales: 400000, totalDiscounts: 16000 },
  { name: 'Jun 2024', totalSales: 380000, totalDiscounts: 15200 },
  { name: 'Jul 2024', totalSales: 400000, totalDiscounts: 16000 },
  { name: 'Aug 2024', totalSales: 380000, totalDiscounts: 15200 },
  { name: 'Sep 2024', totalSales: 380000, totalDiscounts: 15200 },
  { name: 'Oct 2024', totalSales: 450000, totalDiscounts: 18000 },
  { name: 'Nov 2024', totalSales: 450000, totalDiscounts: 18000 },
  { name: 'Dec 2024', totalSales: 450000, totalDiscounts: 18000 },
  { name: 'Jan 2025', totalSales: 420000, totalDiscounts: 16800 },
  { name: 'Feb 2025', totalSales: 400000, totalDiscounts: 16000 },
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
                    Past 12 months
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
                        <XAxis 
                          dataKey="name" 
                          tick={{ 
                            fontSize: 11, 
                            fill: '#666' 
                          }} 
                          axisLine={{ stroke: '#e0e0e0' }} 
                        />
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
                          bottom: 30,
                          left: 40,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          tick={{
                            fontSize: 11,
                            fill: '#666'
                          }}
                          tickFormatter={(value) => {
                            // Show bimonthly markers for better readability
                            if (value.includes('Mar') || value.includes('May') || 
                                value.includes('Jul') || value.includes('Sep') || 
                                value.includes('Nov') || value.includes('Jan')) {
                              return value.split(' ')[0];
                            }
                            return '';
                          }}
                          height={30}
                          axisLine={{ stroke: '#e0e0e0' }}
                        />
                        <YAxis 
                          yAxisId="left"
                          orientation="left"
                          domain={[0, 30]}
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
                          bottom: 30,
                          left: 40,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          tick={{
                            fontSize: 11,
                            fill: '#666'
                          }}
                          tickFormatter={(value) => {
                            // Show bimonthly markers for better readability
                            if (value.includes('Mar') || value.includes('May') || 
                                value.includes('Jul') || value.includes('Sep') || 
                                value.includes('Nov') || value.includes('Jan')) {
                              return value.split(' ')[0];
                            }
                            return '';
                          }}
                          height={30}
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
                <Card className="p-6 mb-8 bg-white shadow-md">
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
                  <div className="h-80 w-full flex items-center justify-center">
                    <div className="w-full" style={{ height: "320px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={salesDiscountsData}
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
                              fontSize: 11,
                              fill: '#666'
                            }}
                            tickFormatter={(value) => {
                              // Show bimonthly markers for better readability
                              if (value.includes('Mar') || value.includes('May') || 
                                  value.includes('Jul') || value.includes('Sep') || 
                                  value.includes('Nov') || value.includes('Jan')) {
                                return value.split(' ')[0];
                              }
                              return '';
                            }}
                            height={30}
                            axisLine={{ stroke: '#e0e0e0' }}
                          />
                          <YAxis 
                            yAxisId="left"
                            orientation="left"
                            domain={[0, 600000]}
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