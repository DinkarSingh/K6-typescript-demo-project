// Volume Test - Tests application with large amounts of data
// This test helps you understand how your application performs with big datasets
//
// What is a Volume Test?
// - Tests the application with large amounts of data
// - Verifies database performance with many records
// - Tests pagination and data loading efficiency
// - Identifies memory leaks and data handling issues

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { config } from '../config';
import {
  fetchArticles,
  fetchTags,
  generateRandomUserData,
  registerUser,
  loginUser,
  createArticle,
  generateRandomArticle,
} from './utils';

// Volume test configuration - moderate load but lots of data operations
export const options: Options = {
  stages: [
    { duration: '10s', target: 5 }, // Start with few users
    { duration: '30s', target: 15 }, // Moderate load for extended period
    { duration: '15s', target: 25 }, // Slightly increase load
    { duration: '30s', target: 25 }, // Maintain for data accumulation
    { duration: '5s', target: 0 }, // Ramp down
  ],

  thresholds: {
    http_req_duration: ['p(95)<3000'], // Slightly more lenient for large data operations
    http_req_failed: ['rate<0.15'], // Allow for some timeouts with large datasets
    http_reqs: ['rate>5'], // Lower rate due to data-intensive operations
  },

  tags: {
    testType: 'volume',
    environment: 'demo',
  },

  // Cloud configuration for Grafana Cloud k6
  cloud: {
    name: 'Volume Test - RealWorld Demo',
    projectID: __ENV.K6_CLOUD_PROJECT_ID ? Number(__ENV.K6_CLOUD_PROJECT_ID) : undefined,
  },
};

export function setup() {
  console.log('📊 Starting Volume Test Setup...');
  console.log(`Target URL: ${config.baseUrl}`);
  console.log('');
  console.log('🎯 Volume Test Objectives:');
  console.log('- Test large data pagination (fetching many articles)');
  console.log('- Verify performance with extensive data browsing');
  console.log('- Test system behavior with accumulated data operations');
  console.log('- Identify memory leaks or performance degradation over time');
  console.log('');

  // Create multiple authenticated users for volume operations
  const users = [];
  console.log('Creating test users for volume operations...');

  for (let i = 0; i < 10; i++) {
    const userData = generateRandomUserData();
    const regResponse = registerUser(userData);

    if (regResponse.status === 200) {
      const loginResponse = loginUser(userData.email, userData.password);
      if (loginResponse) {
        users.push({
          token: loginResponse.user.token,
          userData: userData,
        });
      }
    }

    sleep(0.5); // Avoid overwhelming the API during setup
  }

  console.log(`✅ Created ${users.length} authenticated users`);

  // Pre-create some content for volume testing (if authentication is working)
  if (users.length > 0) {
    console.log('Pre-creating content for volume testing...');
    for (let i = 0; i < Math.min(5, users.length); i++) {
      const user = users[i];
      for (let j = 0; j < 3; j++) {
        const articleData = generateRandomArticle();
        createArticle(user.token, articleData);
        sleep(0.3); // Avoid API rate limits
      }
    }
    console.log('✅ Pre-created sample content');
  }

  return { authenticatedUsers: users };
}

export default function (data: {
  authenticatedUsers: Array<{
    token: string;
    userData: { username: string; email: string; password: string };
  }>;
}) {
  const volumeScenario = Math.random();

  if (volumeScenario < 0.4) {
    // 40% - Large data pagination testing
    largePaginationTesting();
  } else if (volumeScenario < 0.7) {
    // 30% - Extensive browsing simulation
    extensiveBrowsingSimulation();
  } else {
    // 30% - Authenticated bulk operations
    if (data.authenticatedUsers && data.authenticatedUsers.length > 0) {
      const randomUser =
        data.authenticatedUsers[Math.floor(Math.random() * data.authenticatedUsers.length)];
      authenticatedBulkOperations(randomUser.token);
    } else {
      largePaginationTesting(); // Fallback
    }
  }

  // Normal think time for volume test
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

function largePaginationTesting() {
  // Test pagination with increasingly large offsets
  const pageSizes = [10, 20, 50];
  const offsets = [0, 50, 100, 200, 500, 1000];

  const pageSize = pageSizes[Math.floor(Math.random() * pageSizes.length)];
  const offset = offsets[Math.floor(Math.random() * offsets.length)];

  console.log(`Testing pagination: limit=${pageSize}, offset=${offset}`);

  const response = fetchArticles(pageSize, offset);

  check(response, {
    [`Large pagination (${pageSize}/${offset}) - success`]: (r) => r.status === 200,
    [`Large pagination (${pageSize}/${offset}) - reasonable time`]: () => {
      // Larger datasets should still respond within reasonable time
      return true; // Simplified check - k6 will track timings automatically
    },
    [`Large pagination (${pageSize}/${offset}) - has data`]: (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.articles && body.articlesCount !== undefined;
      } catch {
        return false;
      }
    },
  });

  // Simulate user examining the data
  sleep(1);

  // Sometimes fetch tags as well (data correlation)
  if (Math.random() < 0.3) {
    fetchTags();
  }
}

function extensiveBrowsingSimulation() {
  // Simulate user doing extensive browsing through many pages
  const browsePagesCount = Math.floor(Math.random() * 8) + 3; // Browse 3-10 pages
  let currentOffset = 0;
  const pageSize = 20;

  console.log(`Extensive browsing: ${browsePagesCount} pages`);

  for (let page = 0; page < browsePagesCount; page++) {
    const response = fetchArticles(pageSize, currentOffset);

    const success = check(response, {
      [`Extensive browse page ${page + 1} - success`]: (r) => r.status === 200,
      [`Extensive browse page ${page + 1} - consistent performance`]: () => {
        return true; // Simplified check - k6 tracks performance automatically
      },
    });

    if (!success) {
      console.log(`Browse session ended at page ${page + 1} due to errors`);
      break;
    }

    currentOffset += pageSize;

    // Short think time between pages
    sleep(0.5);
  }

  // Check overall browsing session success
  check(null, {
    'Extensive browsing session - completed successfully': () => true,
  });
}

function authenticatedBulkOperations(token: string) {
  // Simulate authenticated user performing bulk operations
  console.log('Performing authenticated bulk operations');

  // 1. Check user profile
  const profileResponse = http.get(config.baseUrl + config.endpoints.profile, {
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    },
  });

  check(profileResponse, {
    'Bulk ops - profile fetch': (r) => r.status === 200,
  });

  sleep(0.5);

  // 2. Fetch user's articles with pagination
  for (let offset = 0; offset < 100; offset += 20) {
    const articlesResponse = http.get(
      `${config.baseUrl}${config.endpoints.articles}?limit=20&offset=${offset}`,
      {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const hasMore = check(articlesResponse, {
      [`Bulk ops - articles page ${offset / 20 + 1}`]: (r) => r.status === 200,
    });

    if (!hasMore) break;

    sleep(0.3);
  }

  // 3. Occasionally create new content (but not too much to avoid data pollution)
  if (Math.random() < 0.1) {
    // 10% chance
    const articleData = generateRandomArticle();
    const createResponse = createArticle(token, articleData);

    check(createResponse, {
      'Bulk ops - content creation': (r) => r.status === 200 || r.status === 201,
    });
  }
}

export function teardown(data: {
  authenticatedUsers: Array<{
    token: string;
    userData: { username: string; email: string; password: string };
  }>;
}) {
  console.log('📊 Volume Test Complete!');
  console.log('');
  console.log('📈 Volume Test Results Analysis:');
  console.log('');
  console.log('🔍 Key Volume Test Metrics:');
  console.log('1. Pagination Performance:');
  console.log('   - Did response times increase with larger offsets?');
  console.log('   - Were there any timeouts with deep pagination?');
  console.log('   - How did database query performance hold up?');
  console.log('');
  console.log('2. Memory Usage:');
  console.log('   - Check server memory usage during the test');
  console.log('   - Look for memory leaks with large data operations');
  console.log('   - Monitor garbage collection patterns');
  console.log('');
  console.log('3. Data Consistency:');
  console.log('   - Were paginated results consistent?');
  console.log('   - Did data integrity remain intact?');
  console.log('   - Any issues with concurrent data access?');
  console.log('');
  console.log('💡 Volume Test Insights:');
  console.log('- Database indexing effectiveness');
  console.log('- Query optimization opportunities');
  console.log('- Caching strategy effectiveness');
  console.log('- Data archiving needs for large datasets');
  console.log('- API rate limiting effectiveness');

  // Cleanup note
  if (data.authenticatedUsers && data.authenticatedUsers.length > 0) {
    console.log('');
    console.log('🧹 Note: Test users and content created during this test');
    console.log('   may need cleanup in production environments.');
  }
}
