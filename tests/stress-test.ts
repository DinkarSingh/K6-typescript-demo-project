// Stress Test - Tests application limits under high load
// This test helps you understand when your application starts to break down
//
// What is a Stress Test?
// - Tests beyond normal operating capacity
// - Identifies the breaking point of your application
// - Tests how the system recovers from high stress
// - Helps plan for peak traffic scenarios

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { config } from '../config.ts';
import { fetchArticles, fetchTags, generateRandomUserData, registerUser, loginUser } from './utils.ts';

// Stress test configuration - higher load than normal
export const options: Options = {
  stages: [
    // Gradual ramp-up to high load
    { duration: '2m', target: 20 },   // Ramp up to 20 users  
    { duration: '5m', target: 50 },   // Ramp up to 50 users
    { duration: '10m', target: 100 }, // Ramp up to 100 users (high stress)
    { duration: '3m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Quick ramp down
  ],
  
  // More lenient thresholds for stress testing
  thresholds: config.thresholds.stress,
  
  tags: {
    testType: 'stress',
    environment: 'demo'
  }
};

export function setup() {
  console.log('🔥 Starting Stress Test Setup...');
  console.log(`Target URL: ${config.baseUrl}`);
  console.log('This test will push your application to its limits!');
  console.log('We will gradually increase load to 100 concurrent users');
  
  // Pre-create some test users for stress testing
  const testUsers = [];
  for (let i = 0; i < 5; i++) {
    const userData = generateRandomUserData();
    const regResponse = registerUser(userData);
    if (regResponse.status === 200) {
      const loginResponse = loginUser(userData.email, userData.password);
      if (loginResponse) {
        testUsers.push({
          token: loginResponse.user.token,
          userData: userData
        });
      }
    }
  }
  
  console.log(`✅ Created ${testUsers.length} test users for stress testing`);
  return { testUsers: testUsers };
}

export default function(data: any) {
  // More aggressive user behavior patterns during stress test
  const behaviorType = Math.random();
  
  if (behaviorType < 0.4) {
    // 40% - Rapid article browsing (high read load)
    rapidArticleBrowsing();
  } else if (behaviorType < 0.7) {
    // 30% - Mixed browsing with shorter think times
    mixedBrowsingStress();
  } else {
    // 30% - Authenticated stress actions
    if (data.testUsers && data.testUsers.length > 0) {
      const randomUser = data.testUsers[Math.floor(Math.random() * data.testUsers.length)];
      authenticatedStressActions(randomUser.token);
    } else {
      rapidArticleBrowsing();
    }
  }
  
  // Shorter sleep times to create more stress
  sleep(Math.random() * 1 + 0.5); // 0.5 to 1.5 seconds
}

function rapidArticleBrowsing() {
  // Rapid fire requests to simulate heavy browsing
  for (let i = 0; i < 3; i++) {
    const offset = i * 10;
    const response = fetchArticles(10, offset);
    
    check(response, {
      [`Rapid browse page ${i + 1} - success`]: (r) => r.status === 200,
    });
    
    // Very short think time
    sleep(0.2);
  }
}

function mixedBrowsingStress() {
  // Simultaneous requests for different resources
  const responses = http.batch([
    {
      method: 'GET',
      url: config.baseUrl + config.endpoints.articles,
    },
    {
      method: 'GET', 
      url: config.baseUrl + config.endpoints.tags,
    },
    {
      method: 'GET',
      url: config.baseUrl + config.endpoints.articles + '?limit=5&offset=0',
    }
  ]);
  
  // Check all batch responses
  for (let i = 0; i < responses.length; i++) {
    check(responses[i], {
      [`Batch request ${i + 1} - success`]: (r) => r.status === 200,
    });
  }
}

function authenticatedStressActions(token: string) {
  // Authenticated user making multiple requests quickly
  const headers = {
    'Authorization': `Token ${token}`,
    'Content-Type': 'application/json'
  };
  
  // Batch authenticated requests
  const responses = http.batch([
    {
      method: 'GET',
      url: config.baseUrl + config.endpoints.profile,
      headers: headers
    },
    {
      method: 'GET',
      url: config.baseUrl + config.endpoints.articles,
      headers: headers  
    },
    {
      method: 'GET',
      url: config.baseUrl + config.endpoints.articles + '?limit=20&offset=0',
      headers: headers
    }
  ]);
  
  let successCount = 0;
  responses.forEach((response, index) => {
    const success = check(response, {
      [`Authenticated batch ${index + 1} - success`]: (r) => r.status === 200 || r.status === 201,
    });
    if (success) successCount++;
  });
  
  // Track success rate during stress
  check(null, {
    'Authenticated stress batch - majority success': () => successCount >= responses.length * 0.7,
  });
}

export function teardown(data: any) {
  console.log('🏁 Stress Test Complete!');
  console.log('');
  console.log('📊 Stress Test Results Analysis:');
  console.log('- Check if your application maintained acceptable response times under stress');
  console.log('- Look for the point where error rates started increasing');
  console.log('- Verify that the application recovered properly during ramp-down');
  console.log('');
  console.log('🔍 Key Stress Test Insights:');
  console.log('- Maximum sustainable load before performance degrades');
  console.log('- Error patterns under high stress');
  console.log('- Resource bottlenecks (CPU, memory, database connections)');
  console.log('- System recovery time after stress period');
}