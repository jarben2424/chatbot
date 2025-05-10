'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LineChart, BarChart, PieChart } from 'recharts'; // Or your preferred chart library

export default function VisualizationPage() {
  const { id } = useParams();
  const [visualization, setVisualization] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the visualization data using the ID
    fetch(`/api/visualizations/${id}`)
      .then(res => res.json())
      .then(data => {
        setVisualization(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch visualization:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div>Loading visualization...</div>;
  if (!visualization) return <div>Visualization not found</div>;

  // Render the appropriate chart based on type
  const renderChart = () => {
    switch(visualization.type) {
      case 'line':
        return <LineChart data={visualization.data} />;
      case 'bar':
        return <BarChart data={visualization.data} />;
      case 'pie':
        return <PieChart data={visualization.data} />;
      default:
        return <div>Chart type not supported</div>;
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{visualization.title}</h1>
          <p className="text-muted-foreground">{visualization.description}</p>
        </div>
        <Button onClick={() => window.history.back()}>Back</Button>
      </div>
      
      <div className="border rounded-lg p-4 bg-card">
        {renderChart()}
      </div>
    </div>
  );
}