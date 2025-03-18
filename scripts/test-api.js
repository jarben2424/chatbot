/**
 * Test script to validate API endpoints
 * 
 * Run with: node scripts/test-api.js
 */

const fetch = require('node-fetch');

// Base URL for API calls
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testApis() {
  console.log('Testing API endpoints...');
  console.log('BASE_URL:', BASE_URL);
  
  try {
    // Test auth check endpoint
    console.log('\n--- Testing /api/auth/check ---');
    const authResponse = await fetch(`${BASE_URL}/api/auth/check`, {
      method: 'GET',
      credentials: 'include',
    });
    
    console.log('Status:', authResponse.status);
    const authData = await authResponse.json();
    console.log('Response:', authData);
    
    if (authResponse.ok) {
      console.log('✅ Auth check successful');
      console.log('User ID:', authData.userId);
    } else {
      console.log('❌ Auth check failed:', authData.message);
      console.log('Please log in before running tests');
      return;
    }
    
    // Test saving a chat generated metric
    console.log('\n--- Testing /api/chat-generated-metrics POST ---');
    const testMetric = {
      question: 'Test metric - How many orders do we have?',
      sqlQuery: 'SELECT COUNT(*) FROM orders',
      category: 'general',
      visualizationType: 'highlight',
    };
    
    const saveResponse = await fetch(`${BASE_URL}/api/chat-generated-metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMetric),
      credentials: 'include',
    });
    
    console.log('Status:', saveResponse.status);
    const saveData = await saveResponse.json();
    
    if (saveResponse.ok) {
      console.log('✅ Metric saved successfully');
      console.log('Metric ID:', saveData.id);
      
      // Test adding to dashboard
      console.log('\n--- Testing /api/user-dashboard-metrics POST ---');
      const dashboardResponse = await fetch(`${BASE_URL}/api/user-dashboard-metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceType: 'chat_generated_metric',
          sourceId: saveData.id,
          category: 'general',
        }),
        credentials: 'include',
      });
      
      console.log('Status:', dashboardResponse.status);
      const dashboardData = await dashboardResponse.json();
      
      if (dashboardResponse.ok) {
        console.log('✅ Metric added to dashboard successfully');
        console.log('Dashboard Metric ID:', dashboardData.id);
      } else {
        console.log('❌ Failed to add metric to dashboard:');
        console.log(dashboardData);
      }
    } else {
      console.log('❌ Failed to save metric:');
      console.log(saveData);
    }
  } catch (error) {
    console.error('Error during API tests:', error);
  }
}

testApis().catch(console.error); 