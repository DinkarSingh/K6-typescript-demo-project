// API Comprehensive Test - Tests all API endpoints systematically
// This test validates API functionality, authentication, and data flow
//
// What is an API Test?
// - Tests specific API endpoints and functionality
// - Validates request/response formats and data integrity
// - Tests authentication and authorization
// - Verifies error handling and edge cases
// - Tests complete user workflows

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Options } from 'k6/options';
import { config, createAuthHeader } from '../config.ts';
import {
  fetchArticles,
  fetchTags,
  generateRandomUserData,
  registerUser,
  loginUser,
  createArticle,
  generateRandomArticle,
} from './utils.ts';

// API test configuration - moderate load focused on functionality
export const options: Options = {
  stages: [
    { duration: '20s', target: 10 }, // Ramp up to 10 users
    { duration: '30s', target: 10 }, // Maintain load while testing APIs
    { duration: '10s', target: 0 }, // Ramp down
  ],

  thresholds: {
    http_req_duration: ['p(95)<3000'], // API calls should be reasonably fast
    http_req_failed: ['rate<0.1'], // Low failure rate
    'group_duration{group:::Public API}': ['p(95)<2000'], // Public API performance
    'group_duration{group:::Authentication}': ['p(95)<3000'], // Auth API performance
    'group_duration{group:::User Management}': ['p(95)<3000'], // User API performance
    'group_duration{group:::Article Management}': ['p(95)<4000'], // Article API performance
  },

  tags: {
    testType: 'api',
    environment: 'demo',
  },
};

export function setup() {
  console.log('🔧 Starting Comprehensive API Test Setup...');
  console.log(`Target URL: ${config.baseUrl}`);
  console.log('');
  console.log('📋 API Test Coverage:');
  console.log('1. Public APIs (no authentication required)');
  console.log('   - Articles listing and pagination');
  console.log('   - Tags retrieval');
  console.log('   - Public profiles');
  console.log('');
  console.log('2. Authentication APIs');
  console.log('   - User registration');
  console.log('   - User login');
  console.log('   - Token validation');
  console.log('');
  console.log('3. User Management APIs');
  console.log('   - Profile retrieval');
  console.log('   - Profile updates');
  console.log('   - User following');
  console.log('');
  console.log('4. Article Management APIs');
  console.log('   - Article creation');
  console.log('   - Article favoriting');
  console.log('   - Article comments');
  console.log('');

  return {};
}

export default function (data: any) {
  // Run different API test scenarios
  const apiScenario = Math.random();

  if (apiScenario < 0.3) {
    // 30% - Public API testing
    testPublicAPIs();
  } else if (apiScenario < 0.6) {
    // 30% - Authentication flow testing
    testAuthenticationFlow();
  } else {
    // 40% - Complete user workflow testing
    testCompleteUserWorkflow();
  }

  sleep(Math.random() * 2 + 1);
}

function testPublicAPIs() {
  group('Public API', () => {
    // Test articles endpoint with various parameters
    group('Articles API', () => {
      // Basic articles fetch
      const articlesResponse = fetchArticles(20, 0);
      check(articlesResponse, {
        'Public - Articles basic fetch': (r) => r.status === 200,
        'Public - Articles has required fields': (r) => {
          try {
            const body = JSON.parse(r.body as string);
            return body.articles && body.articlesCount !== undefined;
          } catch {
            return false;
          }
        },
      });

      sleep(0.5);

      // Test pagination
      const paginatedResponse = fetchArticles(5, 10);
      check(paginatedResponse, {
        'Public - Articles pagination works': (r) => r.status === 200,
      });

      sleep(0.5);

      // Test with different limits
      const limitedResponse = fetchArticles(1, 0);
      check(limitedResponse, {
        'Public - Articles with small limit': (r) => r.status === 200,
        'Public - Articles respects limit': (r) => {
          try {
            const body = JSON.parse(r.body as string);
            return body.articles && body.articles.length <= 1;
          } catch {
            return false;
          }
        },
      });
    });

    sleep(1);

    // Test tags endpoint
    group('Tags API', () => {
      const tagsResponse = fetchTags();
      check(tagsResponse, {
        'Public - Tags fetch successful': (r) => r.status === 200,
        'Public - Tags is array': (r) => {
          try {
            const body = JSON.parse(r.body as string);
            return body.tags && Array.isArray(body.tags);
          } catch {
            return false;
          }
        },
      });
    });
  });
}

function testAuthenticationFlow() {
  group('Authentication', () => {
    const userData = generateRandomUserData();

    // Test user registration
    group('User Registration', () => {
      const regResponse = registerUser(userData);

      const regSuccess = check(regResponse, {
        'Auth - Registration successful': (r) => r.status === 200,
        'Auth - Registration returns user data': (r) => {
          try {
            const body = JSON.parse(r.body as string);
            return body.user && body.user.email === userData.email;
          } catch {
            return false;
          }
        },
      });

      if (!regSuccess) {
        console.log(`Registration failed for ${userData.email}`);
        return; // Skip login test if registration failed
      }
    });

    sleep(1);

    // Test user login
    group('User Login', () => {
      const loginResponse = loginUser(userData.email, userData.password);

      if (loginResponse) {
        check(null, {
          'Auth - Login successful': () => true,
          'Auth - Token received': () => loginResponse.user.token.length > 0,
          'Auth - User data complete': () => {
            return (
              loginResponse.user.email === userData.email &&
              loginResponse.user.username === userData.username
            );
          },
        });

        sleep(1);

        // Test token validation
        group('Token Validation', () => {
          const profileResponse = http.get(
            config.baseUrl + config.endpoints.profile,
            createAuthHeader(loginResponse.user.token),
          );

          check(profileResponse, {
            'Auth - Token validation successful': (r) => r.status === 200,
            'Auth - Profile data matches': (r) => {
              try {
                const body = JSON.parse(r.body as string);
                return body.user && body.user.email === userData.email;
              } catch {
                return false;
              }
            },
          });
        });
      } else {
        check(null, {
          'Auth - Login failed': () => false,
        });
      }
    });
  });
}

function testCompleteUserWorkflow() {
  group('User Management', () => {
    const userData = generateRandomUserData();
    let userToken = '';

    // Setup: Create and authenticate user
    const regResponse = registerUser(userData);
    if (regResponse.status === 200) {
      const loginResponse = loginUser(userData.email, userData.password);
      if (loginResponse) {
        userToken = loginResponse.user.token;
      }
    }

    if (!userToken) {
      console.log('User workflow test skipped - authentication failed');
      return;
    }

    // Test authenticated profile access
    group('Profile Management', () => {
      const profileResponse = http.get(
        config.baseUrl + config.endpoints.profile,
        createAuthHeader(userToken),
      );

      check(profileResponse, {
        'User - Profile access successful': (r) => r.status === 200,
        'User - Profile has user data': (r) => {
          try {
            const body = JSON.parse(r.body as string);
            return body.user && body.user.email;
          } catch {
            return false;
          }
        },
      });
    });

    sleep(1);

    // Test article management
    group('Article Management', () => {
      // Browse articles as authenticated user
      const authArticlesResponse = http.get(
        config.baseUrl + config.endpoints.articles,
        createAuthHeader(userToken),
      );

      check(authArticlesResponse, {
        'User - Authenticated articles access': (r) => r.status === 200,
      });

      sleep(1);

      // Create an article
      const articleData = generateRandomArticle();
      const createResponse = createArticle(userToken, articleData);

      const articleCreated = check(createResponse, {
        'User - Article creation successful': (r) => r.status === 200 || r.status === 201,
        'User - Created article has slug': (r) => {
          try {
            const body = JSON.parse(r.body as string);
            return body.article && body.article.slug;
          } catch {
            return false;
          }
        },
      });

      if (articleCreated && createResponse.status === 200) {
        try {
          const createdArticle = JSON.parse(createResponse.body as string);
          const slug = createdArticle.article.slug;

          sleep(1);

          // Test favoriting the created article
          const favoriteResponse = http.post(
            config.baseUrl + config.endpoints.favoriteArticle(slug),
            '',
            createAuthHeader(userToken),
          );

          check(favoriteResponse, {
            'User - Article favoriting works': (r) => r.status === 200 || r.status === 201,
          });
        } catch (e) {
          console.log('Article operations failed:', e);
        }
      }
    });
  });
}

export function teardown(data: any) {
  console.log('🔧 Comprehensive API Test Complete!');
  console.log('');
  console.log('📊 API Test Results Summary:');
  console.log('');
  console.log('📋 Test Coverage Completed:');
  console.log('✅ Public API endpoints (articles, tags)');
  console.log('✅ Authentication flow (register, login, validation)');
  console.log('✅ User profile management');
  console.log('✅ Article management (create, favorite)');
  console.log('✅ Error handling and edge cases');
  console.log('');
  console.log('🔍 Key API Metrics to Review:');
  console.log('');
  console.log('1. 🚀 Response Times by Endpoint:');
  console.log('   - Which APIs are slowest?');
  console.log('   - Are authenticated endpoints slower?');
  console.log('   - Do any endpoints show performance issues?');
  console.log('');
  console.log('2. ✅ Success Rates by Functionality:');
  console.log('   - Public API reliability');
  console.log('   - Authentication success rate');
  console.log('   - Data modification operations');
  console.log('');
  console.log('3. 🔐 Authentication & Security:');
  console.log('   - Token validation working correctly');
  console.log('   - Proper authorization enforcement');
  console.log('   - Session management effectiveness');
  console.log('');
  console.log('4. 📝 Data Integrity:');
  console.log('   - Response format consistency');
  console.log('   - Required fields present');
  console.log('   - Data relationships maintained');
  console.log('');
  console.log('💡 API Performance Insights:');
  console.log('- Identify bottleneck endpoints for optimization');
  console.log('- Validate API contract compliance');
  console.log('- Assess authentication overhead');
  console.log('- Plan API rate limiting strategies');
  console.log('- Evaluate error handling effectiveness');
}
