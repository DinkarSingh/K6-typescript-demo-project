// Configuration file for k6 performance tests
// This file contains all the settings and endpoints for our tests

export const config = {
  // Base URL for our target application
  baseUrl: 'https://demo.realworld.show',

  // API endpoints we'll be testing
  endpoints: {
    // Public endpoints (no authentication needed)
    articles: '/api/articles',
    tags: '/api/tags',

    // User authentication endpoints
    login: '/api/users/login',
    register: '/api/users',

    // User profile endpoints
    profile: '/api/user',
    profiles: '/api/profiles',

    // Article management endpoints
    createArticle: '/api/articles',
    favoriteArticle: (slug: string) => `/api/articles/${slug}/favorite`,
    followUser: (username: string) => `/api/profiles/${username}/follow`,
  },

  // Test data for creating users and articles
  testData: {
    // User credentials for testing
    testUser: {
      email: `testuser${Date.now()}@example.com`,
      password: 'testpassword123',
      username: `testuser${Date.now()}`,
    },

    // Sample article data
    sampleArticle: {
      title: 'Performance Test Article',
      description: 'This is a test article created during performance testing',
      body: 'This article body is used for testing purposes. It contains sample content to test article creation endpoints.',
      tagList: ['performance', 'testing', 'k6'],
    },
  },

  // Performance thresholds for different types of tests
  thresholds: {
    // Load test thresholds (normal usage)
    load: {
      http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
      http_req_failed: ['rate<0.1'], // Less than 10% failures
      http_reqs: ['rate>10'], // At least 10 requests per second
    },

    // Stress test thresholds (high load)
    stress: {
      http_req_duration: ['p(95)<5000'], // 95% of requests under 5s
      http_req_failed: ['rate<0.2'], // Less than 20% failures
    },

    // Spike test thresholds (sudden load)
    spike: {
      http_req_duration: ['p(95)<10000'], // 95% of requests under 10s
      http_req_failed: ['rate<0.3'], // Less than 30% failures
    },
  },
};

// Helper function to get full URL
export function getFullUrl(endpoint: string): string {
  return config.baseUrl + endpoint;
}

// Helper function to create authorization header
export function createAuthHeader(token: string): object {
  return {
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    },
  };
}
