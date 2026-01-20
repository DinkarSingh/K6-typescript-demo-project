// Load Test - Simulates normal expected traffic
// This test helps you understand how your application performs under normal conditions
// 
// What is a Load Test?
// - Simulates normal expected user traffic
// - Tests the application under typical load conditions  
// - Helps identify baseline performance metrics
// - Usually runs for extended periods to find performance degradation

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { config } from '../config.ts';
import { fetchArticles, fetchTags, loginUser, registerUser, generateRandomUserData } from './utils.ts';

// Test configuration
export const options: Options = {
  stages: [
    // Ramp-up: Gradually increase load to simulate real-world traffic growth
    { duration: '2m', target: 10 },   // Ramp up to 10 users over 2 minutes
    { duration: '5m', target: 10 },   // Stay at 10 users for 5 minutes  
    { duration: '2m', target: 20 },   // Ramp up to 20 users over 2 minutes
    { duration: '5m', target: 20 },   // Stay at 20 users for 5 minutes
    { duration: '2m', target: 0 },    // Ramp down to 0 users over 2 minutes
  ],
  
  // Performance thresholds - the test will fail if these are not met
  thresholds: config.thresholds.load,
  
  // Tags help organize test results
  tags: {
    testType: 'load',
    environment: 'demo'
  }
};

// Global variables to track test state
let userToken: string = '';

// This function runs once before all test iterations
export function setup() {
  console.log('🚀 Starting Load Test Setup...');
  console.log(`Target URL: ${config.baseUrl}`);
  console.log('This test simulates normal user traffic patterns');
  
  // Create a test user that will be used throughout the test
  const userData = generateRandomUserData();
  console.log(`Creating test user: ${userData.username}`);
  
  const registrationResponse = registerUser(userData);
  if (registrationResponse.status === 200) {
    const loginResponse = loginUser(userData.email, userData.password);
    if (loginResponse) {
      console.log('✅ Test user created and authenticated successfully');
      return { token: loginResponse.user.token, userData: userData };
    }
  }
  
  console.log('⚠️ Could not create test user, continuing without authentication');
  return { token: '', userData: userData };
}

// This is the main test function that runs for each virtual user
export default function(data: any) {
  // Simulate different user behaviors with weighted probabilities
  const userBehavior = Math.random();
  
  if (userBehavior < 0.6) {
    // 60% of users: Browse articles (most common behavior)
    browseArticles();
  } else if (userBehavior < 0.8) {
    // 20% of users: Browse articles and tags
    browseArticlesAndTags();
  } else {
    // 20% of users: Authenticated user actions (if token available)
    if (data.token) {
      authenticatedUserActions(data.token);
    } else {
      browseArticles(); // Fallback to browsing if no token
    }
  }
  
  // Simulate user think time (time between actions)
  sleep(Math.random() * 3 + 1); // Random sleep between 1-4 seconds
}

// Simulate a user browsing articles
function browseArticles() {
  // Fetch first page of articles
  const articlesResponse = fetchArticles(10, 0);
  
  check(articlesResponse, {
    'Browse articles - successful': (r) => r.status === 200,
  });
  
  // Simulate user scrolling and loading more articles
  if (Math.random() < 0.3) { // 30% chance to load more
    sleep(1); // Think time
    fetchArticles(10, 10); // Load next page
  }
}

// Simulate a user browsing articles and checking tags
function browseArticlesAndTags() {
  // First, look at available tags
  const tagsResponse = fetchTags();
  
  check(tagsResponse, {
    'Browse tags - successful': (r) => r.status === 200,
  });
  
  sleep(0.5); // Short think time
  
  // Then browse articles
  browseArticles();
}

// Simulate authenticated user actions
function authenticatedUserActions(token: string) {
  // Browse articles first (authenticated users also browse)
  browseArticles();
  
  sleep(1); // Think time
  
  // Get current user profile
  const profileResponse = http.get(
    config.baseUrl + config.endpoints.profile,
    {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  check(profileResponse, {
    'Get user profile - successful': (r) => r.status === 200,
  });
  
  // Occasionally create content (10% chance)
  if (Math.random() < 0.1) {
    sleep(2); // Think time for content creation
    // Note: We're not actually creating articles in load test to avoid data pollution
    // In a real scenario, you might create and then delete test articles
  }
}

// This function runs once after all test iterations complete
export function teardown(data: any) {
  console.log('🏁 Load Test Complete!');
  console.log('Check the results above to see how your application performed under normal load.');
  console.log('Key metrics to review:');
  console.log('- http_req_duration: How long requests took');
  console.log('- http_req_failed: Percentage of failed requests');  
  console.log('- http_reqs: Number of requests per second');
}