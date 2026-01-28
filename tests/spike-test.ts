// Spike Test - Tests sudden dramatic increases in load
// This test helps you understand how your application handles traffic spikes
//
// What is a Spike Test?
// - Simulates sudden dramatic increases in user load
// - Tests how quickly the system can scale up to handle spikes
// - Verifies system behavior when load suddenly drops
// - Common scenarios: viral content, flash sales, social media mentions

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { config } from '../config.ts';
import { fetchArticles, fetchTags } from './utils.ts';

// Spike test configuration - sudden dramatic load changes
export const options: Options = {
  stages: [
    // Normal baseline load
    { duration: '10s', target: 10 }, // Start with normal load

    // SPIKE! Sudden massive increase
    { duration: '10s', target: 200 }, // Sudden spike to 200 users
    { duration: '15s', target: 200 }, // Maintain spike

    // Quick drop back to normal
    { duration: '5s', target: 10 }, // Quick drop back to baseline
    { duration: '5s', target: 10 }, // Maintain baseline

    // Another smaller spike
    { duration: '5s', target: 100 }, // Second spike to 100 users
    { duration: '5s', target: 100 }, // Maintain second spike

    // Final ramp down
    { duration: '5s', target: 0 }, // Ramp down to zero
  ],

  // Very lenient thresholds for spike testing (spikes are expected to cause issues)
  thresholds: config.thresholds.spike,

  tags: {
    testType: 'spike',
    environment: 'demo',
  },
};

export function setup() {
  console.log('⚡ Starting Spike Test Setup...');
  console.log(`Target URL: ${config.baseUrl}`);
  console.log('');
  console.log('🎯 Spike Test Scenario:');
  console.log('- Start with 10 users (normal traffic)');
  console.log('- SPIKE to 200 users in 30 seconds! (20x increase)');
  console.log('- Maintain spike load for 1 minute');
  console.log('- Drop back to 10 users quickly');
  console.log('- Second spike to 100 users');
  console.log('- Final ramp down');
  console.log('');
  console.log('This simulates scenarios like:');
  console.log('- Viral social media posts');
  console.log('- Flash sales or limited-time offers');
  console.log('- News events driving sudden traffic');
  console.log('- Product launches');

  return {};
}

export default function (data: any) {
  // During spike test, users behave more erratically
  const spikeScenario = Math.random();

  if (spikeScenario < 0.5) {
    // 50% - Aggressive browsing (spike behavior)
    aggressiveBrowsing();
  } else if (spikeScenario < 0.8) {
    // 30% - Quick hit and run (common during viral spikes)
    quickHitAndRun();
  } else {
    // 20% - Heavy resource consumption
    heavyResourceConsumption();
  }

  // Minimal think time during spikes (users are eager/impatient)
  sleep(Math.random() * 0.5 + 0.1); // 0.1 to 0.6 seconds
}

function aggressiveBrowsing() {
  // Rapid sequential requests (user frantically browsing)
  const requests = [
    config.baseUrl + config.endpoints.articles,
    config.baseUrl + config.endpoints.articles + '?limit=20&offset=0',
    config.baseUrl + config.endpoints.tags,
    config.baseUrl + config.endpoints.articles + '?limit=10&offset=20',
  ];

  for (let i = 0; i < requests.length; i++) {
    const response = http.get(requests[i]);

    check(response, {
      [`Aggressive browse ${i + 1} - response received`]: (r) => r.status > 0, // Any response is better than timeout
      [`Aggressive browse ${i + 1} - success or graceful failure`]: (r) => r.status < 500, // Server errors are bad during spikes
    });

    // Minimal pause between requests
    sleep(0.1);
  }
}

function quickHitAndRun() {
  // Single quick request and leave (bounce behavior during spikes)
  const response = http.get(config.baseUrl + config.endpoints.articles + '?limit=5&offset=0');

  check(response, {
    'Quick hit - got response': (r) => r.status > 0,
    'Quick hit - not server error': (r) => r.status < 500,
    'Quick hit - reasonably fast': (r) => r.timings.duration < 5000, // Under 5 seconds is acceptable during spike
  });

  // No additional sleep - hit and run!
}

function heavyResourceConsumption() {
  // Simultaneous batch requests (heavy users during spike)
  const batchRequests = [
    {
      method: 'GET',
      url: config.baseUrl + config.endpoints.articles + '?limit=50&offset=0', // Large page size
    },
    {
      method: 'GET',
      url: config.baseUrl + config.endpoints.tags,
    },
    {
      method: 'GET',
      url: config.baseUrl + config.endpoints.articles + '?limit=20&offset=50',
    },
    {
      method: 'GET',
      url: config.baseUrl + config.endpoints.articles + '?limit=20&offset=100',
    },
  ];

  const responses = http.batch(batchRequests);

  let responseCount = 0;
  let successCount = 0;

  responses.forEach((response, index) => {
    if (response.status > 0) responseCount++;

    const isSuccess = check(response, {
      [`Heavy load batch ${index + 1} - got response`]: (r) => r.status > 0,
      [`Heavy load batch ${index + 1} - acceptable status`]: (r) =>
        r.status === 200 || r.status === 429, // 429 = rate limited (acceptable during spike)
    });

    if (isSuccess) successCount++;
  });

  // Overall batch success check
  check(null, {
    'Heavy load batch - got most responses': () => responseCount >= batchRequests.length * 0.7,
    'Heavy load batch - acceptable success rate': () => successCount >= batchRequests.length * 0.5,
  });
}

export function teardown(data: any) {
  console.log('⚡ Spike Test Complete!');
  console.log('');
  console.log('📊 Spike Test Results Analysis:');
  console.log('');
  console.log('🔍 Key Questions to Answer:');
  console.log('1. How did response times change during the spike?');
  console.log('2. Did the application stay available or start returning errors?');
  console.log('3. How quickly did the system recover after the spike ended?');
  console.log('4. Were there any cascading failures?');
  console.log('');
  console.log('💡 Expected Behaviors During Spikes:');
  console.log('✅ GOOD: Gradual response time increase but system stays available');
  console.log('✅ GOOD: Rate limiting (HTTP 429) instead of crashes');
  console.log('✅ GOOD: Quick recovery when load drops');
  console.log('❌ BAD: Complete service unavailability');
  console.log('❌ BAD: Cascading failures that persist after spike ends');
  console.log('❌ BAD: Data corruption or inconsistencies');
  console.log('');
  console.log('🚀 Spike Test Insights:');
  console.log('- Maximum spike load your system can handle');
  console.log('- How auto-scaling (if any) responded to sudden load');
  console.log('- Whether circuit breakers or rate limiting kicked in');
  console.log('- Recovery patterns and time to normal operation');
}
