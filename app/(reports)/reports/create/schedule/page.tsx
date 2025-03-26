'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarIcon,
  ClockIcon,
  CalendarDaysIcon,
  CalendarRangeIcon
} from 'lucide-react';
import { useReportState } from '../../../_context/report-context';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

const scheduleTypes = [
  {
    id: 'daily',
    name: 'Daily',
    description: 'Send this report every day',
    icon: CalendarIcon,
  },
  {
    id: 'weekly',
    name: 'Weekly',
    description: 'Send this report once per week',
    icon: CalendarDaysIcon,
  },
  {
    id: 'monthly',
    name: 'Monthly',
    description: 'Send this report once per month',
    icon: CalendarRangeIcon,
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Create a custom schedule for this report',
    icon: ClockIcon,
  },
];

export default function SchedulePage() {
  const { reportState, updateReport } = useReportState();
  const [selectedSchedule, setSelectedSchedule] = useState(reportState.schedule || 'weekly');
  const [customSchedule, setCustomSchedule] = useState(reportState.customSchedule || '');
  const [weeklyDay, setWeeklyDay] = useState<string>('monday');
  const [monthlyDay, setMonthlyDay] = useState<string>('1');
  const router = useRouter();

  // Load saved data from localStorage if available
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('reportData');
      if (savedData) {
        const { schedule, customSchedule } = JSON.parse(savedData);
        if (schedule) setSelectedSchedule(schedule);
        if (customSchedule) setCustomSchedule(customSchedule);
      }
    } catch (error) {
      console.error('Error loading saved report data:', error);
    }
  }, []);

  const handlePrevStep = () => {
    router.push('/reports/create');
  };

  const handleNextStep = () => {
    // Prepare custom schedule details based on selection
    let finalCustomSchedule = '';
    
    if (selectedSchedule === 'weekly') {
      finalCustomSchedule = `Every ${weeklyDay}`;
    } else if (selectedSchedule === 'monthly') {
      finalCustomSchedule = `Day ${monthlyDay} of each month`;
    } else if (selectedSchedule === 'custom') {
      finalCustomSchedule = customSchedule;
    }
    
    // Save schedule to the report context
    updateReport({
      schedule: selectedSchedule,
      customSchedule: finalCustomSchedule,
    });
    
    // Save to localStorage for persistence across steps
    try {
      const existingData = localStorage.getItem('reportData');
      const reportData = existingData ? JSON.parse(existingData) : {};
      
      localStorage.setItem('reportData', JSON.stringify({
        ...reportData,
        schedule: selectedSchedule,
        customSchedule: finalCustomSchedule,
      }));
    } catch (error) {
      console.error('Error saving report data to localStorage:', error);
    }
    
    // Proceed to the next step (recipients)
    router.push('/reports/create/recipients');
  };

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <div className="flex-1 flex flex-col p-8 max-w-4xl mx-auto w-full pb-24">
        <div className="mb-4 md:mb-8">
          <h1 className="text-3xl font-bold">Report Schedule</h1>
          <p className="text-muted-foreground">Step 2 of 3</p>
        </div>
        
        <div className="mb-8">
          <Label className="text-base mb-2 block">How often should this report be sent?</Label>
          <RadioGroup 
            value={selectedSchedule} 
            onValueChange={setSelectedSchedule} 
            className="grid gap-4 md:grid-cols-2"
          >
            {scheduleTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div 
                  key={type.id}
                  className={`flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedSchedule === type.id 
                      ? 'border-gray-800 bg-gray-100 shadow-sm'
                      : 'hover:bg-gray-100 border-gray-200'
                  }`}
                  onClick={() => setSelectedSchedule(type.id)}
                >
                  <RadioGroupItem 
                    value={type.id} 
                    id={type.id} 
                    className="mt-1 text-gray-800 border-gray-800" 
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center">
                      <Icon className="w-5 h-5 text-gray-800 mr-2" />
                      <Label 
                        htmlFor={type.id} 
                        className="font-medium cursor-pointer"
                      >
                        {type.name}
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        </div>
        
        {/* Custom schedule options based on selection */}
        {selectedSchedule === 'weekly' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Weekly Schedule Options</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="weekday">Day of the week</Label>
              <Select value={weeklyDay} onValueChange={setWeeklyDay}>
                <SelectTrigger id="weekday" className="w-full md:w-[250px] mt-1.5">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monday">Monday</SelectItem>
                  <SelectItem value="tuesday">Tuesday</SelectItem>
                  <SelectItem value="wednesday">Wednesday</SelectItem>
                  <SelectItem value="thursday">Thursday</SelectItem>
                  <SelectItem value="friday">Friday</SelectItem>
                  <SelectItem value="saturday">Saturday</SelectItem>
                  <SelectItem value="sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}
        
        {selectedSchedule === 'monthly' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Monthly Schedule Options</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="monthday">Day of the month</Label>
              <Select value={monthlyDay} onValueChange={setMonthlyDay}>
                <SelectTrigger id="monthday" className="w-full md:w-[250px] mt-1.5">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}
        
        {selectedSchedule === 'custom' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Custom Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="custom-schedule">Describe your custom schedule</Label>
              <Input
                id="custom-schedule"
                placeholder="e.g. Every other Monday, First day of each quarter"
                value={customSchedule}
                onChange={(e) => setCustomSchedule(e.target.value)}
                className="mt-1.5"
              />
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Fixed navigation bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t py-4 px-6 flex justify-between z-10">
        <div className="max-w-7xl mx-auto w-full flex justify-between">
          <Button variant="outline" onClick={handlePrevStep} className="gap-1">
            <ChevronLeftIcon className="h-4 w-4" /> Previous
          </Button>
          <Button 
            onClick={handleNextStep} 
            disabled={selectedSchedule === 'custom' && customSchedule.trim() === ''}
            className="gap-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Next Step <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
