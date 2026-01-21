// Utility functions for k6 tests
// These functions help with common testing tasks

import http from 'k6/http';
import { check } from 'k6';
import { config, createAuthHeader } from '../config.ts';

// Interface for API responses
interface ApiResponse {
  status: number;
  body: any;
  headers: object;
  timings?: {
    duration?: number;
    waiting?: number;
    connecting?: number;
  };
}

// Interface for user login response
interface LoginResponse {
  user: {
    email: string;
    token: string;
    username: string;
    bio: string;
    image: string;
  };
}

/**
 * Register a new user
 * @param userData - User registration data
 * @returns Registration response
 */
export function registerUser(userData: any): ApiResponse {
  const payload = {
    user: {
      username: userData.username,
      email: userData.email,
      password: userData.password,
    },
  };

  const response = http.post(config.baseUrl + config.endpoints.register, JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(response, {
    'User registration successful': (r) => r.status === 200,
    'Response contains user data': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.user && body.user.token;
      } catch {
        return false;
      }
    },
  });

  return {
    status: response.status,
    body: response.body,
    headers: response.headers,
  };
}

/**
 * Login user and get authentication token
 * @param email - User email
 * @param password - User password
 * @returns Login response with token
 */
export function loginUser(email: string, password: string): LoginResponse | null {
  const payload = {
    user: {
      email: email,
      password: password,
    },
  };

  const response = http.post(config.baseUrl + config.endpoints.login, JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
  });

  const loginSuccessful = check(response, {
    'Login successful': (r) => r.status === 200,
    'Response contains token': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.user && body.user.token;
      } catch {
        return false;
      }
    },
  });

  if (loginSuccessful && response.status === 200) {
    return JSON.parse(response.body as string);
  }

  return null;
}

/**
 * Fetch all articles (public endpoint)
 * @param limit - Number of articles to fetch
 * @param offset - Number of articles to skip
 * @returns Articles response
 */
export function fetchArticles(limit: number = 20, offset: number = 0): ApiResponse {
  const url = `${config.baseUrl}${config.endpoints.articles}?limit=${limit}&offset=${offset}`;

  const response = http.get(url);

  check(response, {
    'Articles fetched successfully': (r) => r.status === 200,
    'Response contains articles': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.articles && Array.isArray(body.articles);
      } catch {
        return false;
      }
    },
  });

  return {
    status: response.status,
    body: response.body,
    headers: response.headers,
  };
}

/**
 * Create a new article (requires authentication)
 * @param token - Authentication token
 * @param articleData - Article data
 * @returns Article creation response
 */
export function createArticle(token: string, articleData: any): ApiResponse {
  const payload = {
    article: articleData,
  };

  const response = http.post(
    config.baseUrl + config.endpoints.createArticle,
    JSON.stringify(payload),
    createAuthHeader(token),
  );

  check(response, {
    'Article created successfully': (r) => r.status === 200,
    'Response contains article': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.article && body.article.slug;
      } catch {
        return false;
      }
    },
  });

  return {
    status: response.status,
    body: response.body,
    headers: response.headers,
  };
}

/**
 * Get available tags
 * @returns Tags response
 */
export function fetchTags(): ApiResponse {
  const response = http.get(config.baseUrl + config.endpoints.tags);

  check(response, {
    'Tags fetched successfully': (r) => r.status === 200,
    'Response contains tags': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.tags && Array.isArray(body.tags);
      } catch {
        return false;
      }
    },
  });

  return {
    status: response.status,
    body: response.body,
    headers: response.headers,
  };
}

/**
 * Generate random test data
 */
export function generateRandomUserData() {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 1000);

  return {
    username: `testuser_${timestamp}_${randomNum}`,
    email: `testuser_${timestamp}_${randomNum}@example.com`,
    password: 'testpassword123',
  };
}

/**
 * Generate random article data
 */
export function generateRandomArticle() {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 1000);

  return {
    title: `Test Article ${timestamp} ${randomNum}`,
    description: `This is a test article created at ${new Date().toISOString()}`,
    body: `This is the body of test article created during performance testing. Timestamp: ${timestamp}, Random: ${randomNum}`,
    tagList: ['performance', 'testing', 'k6', `tag${randomNum}`],
  };
}
