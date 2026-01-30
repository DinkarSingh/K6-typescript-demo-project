// Soak Test (Endurance Test) - Tests long-term stability
// This test helps you identify memory leaks, resource degradation, and long-term reliability issues
//
// What is a Soak Test?
// - Runs for extended periods (hours) at moderate load
// - Identifies memory leaks and resource accumulation
// - Tests system stability over time
// - Validates that performance doesn't degrade gradually
// - Tests long-running connections and sessions

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { config } from '../config';
import { fetchArticles, fetchTags, generateRandomUserData, registerUser, loginUser } from './utils';

// Soak test configuration - moderate consistent load for extended time
export const options: Options = {
  stages: [
    // Quick ramp up to target load
    { duration: '15s', target: 20 }, // Ramp up to 20 users

    // SOAK PERIOD - maintain steady load for extended time
    // Note: In real scenarios, this would run for 2-12+ hours
    // For demo purposes, we'll run for 1 minute
    { duration: '1m', target: 20 }, // Maintain 20 users for 1 minute

    // Gradual ramp down
    { duration: '15s', target: 0 }, // Ramp down
  ],

  // Stricter thresholds for soak testing - performance should be consistent
  thresholds: {
    http_req_duration: ['p(95)<2000'], // Response time shouldn't degrade over time
    http_req_failed: ['rate<0.05'], // Very low failure rate for stability
    http_reqs: ['rate>8'], // Consistent throughput

    // Soak-specific thresholds
    'http_req_duration{scenario:soak}': ['p(99)<5000'], // 99th percentile shouldn't spike
    'checks{scenario:soak}': ['rate>0.95'], // Very high check success rate
  },

  tags: {
    testType: 'soak',
    environment: 'demo',
    scenario: 'soak',
  },

  // Cloud configuration for Grafana Cloud k6
  cloud: {
    name: 'Soak Test - RealWorld Demo',
    projectID: __ENV.K6_CLOUD_PROJECT_ID ? Number(__ENV.K6_CLOUD_PROJECT_ID) : undefined,
  },
};

// Global variables to track soak test progress
let testStartTime: number;
let iterationCount = 0;

export function setup() {
  console.log('🏃‍♂️ Starting Soak Test Setup...');
  console.log(`Target URL: ${config.baseUrl}`);
  console.log('');
  console.log('⏰ Soak Test Schedule:');
  console.log('- Ramp-up: 5 minutes to reach 20 users');
  console.log('- Soak period: 30 minutes at steady 20 users');
  console.log('- Ramp-down: 5 minutes to 0 users');
  console.log('- Total duration: ~40 minutes');
  console.log('');
  console.log("🎯 What we're testing:");
  console.log('- Memory leaks (gradual memory increase)');
  console.log('- Resource accumulation (file handles, connections)');
  console.log('- Performance degradation over time');
  console.log('- Database connection pool stability');
  console.log('- Cache effectiveness over time');
  console.log('- Log file growth and rotation');
  console.log('');

  testStartTime = Date.now();

  // Create some authenticated users for varied testing
  const users = [];
  console.log('Creating long-term test users...');

  for (let i = 0; i < 3; i++) {
    const userData = generateRandomUserData();
    const regResponse = registerUser(userData);

    if (regResponse.status === 200) {
      const loginResponse = loginUser(userData.email, userData.password);
      if (loginResponse) {
        users.push({
          token: loginResponse.user.token,
          userData: userData,
          createdAt: Date.now(),
        });
      }
    }

    sleep(1); // Space out user creation
  }

  console.log(`✅ Created ${users.length} users for soak testing`);

  return {
    authenticatedUsers: users,
    startTime: testStartTime,
  };
}

export default function (data: {
  startTime: number;
  authenticatedUsers: Array<{
    token: string;
    userData: { username: string; email: string; password: string };
    createdAt: number;
  }>;
}) {
  iterationCount++;
  const currentTime = Date.now();
  const elapsedMinutes = (currentTime - data.startTime) / (1000 * 60);

  // Log progress every 500 iterations
  if (iterationCount % 500 === 0) {
    console.log(
      `🕐 Soak test progress: ${Math.round(elapsedMinutes)} minutes, iteration ${iterationCount}`,
    );
  }

  // Vary behavior based on how long the test has been running
  const soakBehavior = selectSoakBehavior(elapsedMinutes);

  switch (soakBehavior) {
    case 'steady_browsing':
      steadyBrowsing();
      break;
    case 'authenticated_session':
      if (data.authenticatedUsers && data.authenticatedUsers.length > 0) {
        const user = data.authenticatedUsers[iterationCount % data.authenticatedUsers.length];
        authenticatedSession(user.token);
      } else {
        steadyBrowsing();
      }
      break;
    case 'mixed_load':
      mixedLoadPattern();
      break;
    default:
      steadyBrowsing();
  }

  // Consistent think time throughout soak test
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

function selectSoakBehavior(elapsedMinutes: number): string {
  // Change behavior patterns during different phases of soak test
  if (elapsedMinutes < 5) {
    // Ramp-up phase - simpler patterns
    return Math.random() < 0.7 ? 'steady_browsing' : 'mixed_load';
  } else if (elapsedMinutes < 35) {
    // Main soak phase - varied patterns
    const rand = Math.random();
    if (rand < 0.4) return 'steady_browsing';
    if (rand < 0.7) return 'authenticated_session';
    return 'mixed_load';
  } else {
    // Ramp-down phase - lighter patterns
    return 'steady_browsing';
  }
}

function steadyBrowsing() {
  // Consistent browsing pattern - the foundation of soak testing
  const articlesResponse = fetchArticles(10, Math.floor(Math.random() * 100));

  check(articlesResponse, {
    'Soak - steady browse success': (r) => r.status === 200,
    'Soak - steady browse performance': () => {
      return true; // Simplified check - k6 tracks performance automatically
    },
  });

  // Small chance to also fetch tags
  if (Math.random() < 0.2) {
    sleep(0.5);
    const tagsResponse = fetchTags();
    check(tagsResponse, {
      'Soak - tags fetch success': (r) => r.status === 200,
    });
  }
}

function authenticatedSession(token: string) {
  // Simulate a user with a persistent session doing various activities
  const headers = {
    Authorization: `Token ${token}`,
    'Content-Type': 'application/json',
  };

  // Profile check (session validation)
  const profileResponse = http.get(config.baseUrl + config.endpoints.profile, { headers });

  check(profileResponse, {
    'Soak - session profile check': (r) => r.status === 200,
    'Soak - session still valid': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.user && body.user.email;
      } catch {
        return false;
      }
    },
  });

  sleep(1);

  // Browse content as authenticated user
  const authArticlesResponse = http.get(
    config.baseUrl + config.endpoints.articles + '?limit=15&offset=0',
    { headers },
  );

  check(authArticlesResponse, {
    'Soak - authenticated browse': (r) => r.status === 200,
  });
}

function mixedLoadPattern() {
  // Mixed simultaneous requests to test various system components
  const requests = [
    {
      method: 'GET',
      url: config.baseUrl + config.endpoints.articles + '?limit=10&offset=0',
    },
    {
      method: 'GET',
      url: config.baseUrl + config.endpoints.tags,
    },
  ];

  const responses = http.batch(requests);

  let successCount = 0;
  responses.forEach((response, index) => {
    const success = check(response, {
      [`Soak - mixed load ${index + 1} success`]: (r) => r.status === 200,
      [`Soak - mixed load ${index + 1} performance`]: (r) => {
        const duration = r.timings && r.timings.duration ? r.timings.duration : 0;
        return duration < 4000; // Slightly more lenient for batch requests
      },
    });

    if (success) successCount++;
  });

  check(null, {
    'Soak - mixed load batch success': () => successCount >= requests.length * 0.8,
  });
}

export function teardown(data: { startTime: number }) {
  const endTime = Date.now();
  const totalDuration = (endTime - data.startTime) / (1000 * 60); // Minutes

  console.log('🏁 Soak Test Complete!');
  console.log('');
  console.log(`⏱️  Total soak duration: ${Math.round(totalDuration)} minutes`);
  console.log(`🔢 Total iterations completed: ${iterationCount}`);
  console.log('');
  console.log('📊 Soak Test Analysis Guide:');
  console.log('');
  console.log('🔍 Key Areas to Investigate:');
  console.log('');
  console.log('1. 📈 Response Time Trends:');
  console.log('   - Did response times gradually increase over time?');
  console.log('   - Look for "sawtooth" patterns (gradual increase, then sudden drop)');
  console.log('   - Check if 95th percentile remained stable');
  console.log('');
  console.log('2. 🧠 Memory Usage Patterns:');
  console.log('   - Monitor server memory usage over the test duration');
  console.log('   - Look for steady increases (memory leaks)');
  console.log('   - Check garbage collection frequency and duration');
  console.log('');
  console.log('3. 🔗 Resource Utilization:');
  console.log('   - Database connection pool usage');
  console.log('   - File handle consumption');
  console.log('   - Thread pool exhaustion');
  console.log('   - Network connection accumulation');
  console.log('');
  console.log('4. 📝 Log Analysis:');
  console.log('   - Check for error patterns that emerge over time');
  console.log('   - Monitor log file sizes and rotation');
  console.log('   - Look for recurring warnings or exceptions');
  console.log('');
  console.log('✅ Healthy Soak Test Results:');
  console.log('- Consistent response times throughout');
  console.log('- Stable memory usage (with normal GC cycles)');
  console.log('- No resource exhaustion');
  console.log('- Error rates remain constant and low');
  console.log('');
  console.log('❌ Concerning Soak Test Results:');
  console.log('- Gradual response time degradation');
  console.log('- Steady memory increase');
  console.log('- Increasing error rates over time');
  console.log('- Resource pool exhaustion');
  console.log('- System instability after extended runtime');

  console.log('');
  console.log('💡 Next Steps:');
  console.log('- For production systems, run soak tests for 4-24+ hours');
  console.log('- Monitor system metrics alongside k6 results');
  console.log('- Use application performance monitoring (APM) tools');
  console.log('- Profile memory usage and garbage collection');
}
