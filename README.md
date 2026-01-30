# K6 Performance Testing Suite

A comprehensive performance testing framework using k6 with TypeScript, featuring Grafana Cloud integration, GitHub Actions CI/CD, and multiple test types for the RealWorld Demo application.

## 📋 Table of Contents

- [Project Setup](#-project-setup)
- [Test Configuration](#-test-configuration)
- [Test Execution](#-test-execution)
- [GitHub Actions CI/CD](#-github-actions-cicd)
- [Grafana Cloud Test Reporting](#-grafana-cloud-test-reporting)
- [Test Types](#-test-types)
- [Troubleshooting](#-troubleshooting)

---

## 🛠️ Project Setup

### Prerequisites

- **Node.js** 18 or higher
- **npm** (comes with Node.js)
- **k6** - Download from [k6.io/downloads](https://k6.io/docs/get-started/installation/)

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd K6-typescript-demo-project
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the tests:**
   ```bash
   npm run build
   ```

### Project Structure

```
K6-typescript-demo-project/
├── tests/
│   ├── api-test.ts           # API endpoint validation
│   ├── load-test.ts          # Normal traffic simulation
│   ├── stress-test.ts        # High load testing
│   ├── spike-test.ts         # Sudden traffic spikes
│   ├── volume-test.ts        # Large data operations
│   ├── soak-test.ts          # Long-term stability
│   └── utils.ts              # Shared utility functions
├── dist/                     # Compiled JavaScript (auto-generated)
├── .github/workflows/
│   └── k6-ci.yml             # GitHub Actions workflow
├── config.ts                 # Centralized test configuration
├── tsconfig.json             # TypeScript configuration
├── webpack.config.js         # Build configuration
├── .env                      # Local environment variables (gitignored)
├── .env.example              # Environment template
└── package.json              # Dependencies and scripts
```

### Dependencies

**Core:**
- `@types/k6` - TypeScript definitions for k6
- `typescript` - TypeScript compiler
- `webpack` - Bundles TypeScript into k6-compatible JavaScript

**Development:**
- `eslint` - Code linting
- `prettier` - Code formatting
- `dotenv` - Environment variable management

---

## ⚙️ Test Configuration

### Central Configuration (`config.ts`)

All tests use a centralized configuration file that defines endpoints, thresholds, and test parameters.

**Key configuration sections:**

```typescript
export const config = {
  baseUrl: 'https://demo.realworld.show',
  
  endpoints: {
    articles: '/api/articles',
    login: '/api/users/login',
    register: '/api/users',
    tags: '/api/tags',
    // ... more endpoints
  },
  
  thresholds: {
    load: {
      http_req_duration: ['p(95)<2000'],
      http_req_failed: ['rate<0.1'],
      http_reqs: ['rate>10'],
    },
    // ... thresholds for each test type
  }
};
```

### Test Options

Each test file includes k6 options for load patterns and cloud configuration:

```typescript
export const options = {
  // Load pattern
  stages: [
    { duration: '30s', target: 10 },  // Ramp up
    { duration: '1m', target: 10 },   // Steady state
    { duration: '30s', target: 0 },   // Ramp down
  ],
  
  // Performance thresholds
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.1'],
  },
  
  // Grafana Cloud configuration
  cloud: {
    name: 'Load Test - RealWorld Demo',
    projectID: __ENV.K6_CLOUD_PROJECT_ID ? Number(__ENV.K6_CLOUD_PROJECT_ID) : undefined,
  },
};
```

### Environment Variables

Create a `.env` file for local Grafana Cloud configuration:

```env
# Grafana Cloud k6 Configuration
GRAFANA_CLOUD_API_TOKEN=your_api_token_here
GRAFANA_CLOUD_HOST=https://ingest.k6.io
GRAFANA_CLOUD_PROJECT_ID=write_your_project_id
```

**Important:** Never commit `.env` to version control. Use `.env.example` as a template.

---

## 🧪 Test Execution

### Local Testing (Without Cloud Reporting)

Run tests locally to validate functionality:

```bash
# Individual tests
npm run test:api          # API validation
npm run test:load         # Load testing
npm run test:stress       # Stress testing
npm run test:spike        # Spike testing
npm run test:volume       # Volume testing
npm run test:soak         # Soak testing

# Batch execution
npm run test:quick        # API + Load + Spike (fastest)
npm run test:all          # All tests (~7 minutes)
```

### Cloud Testing (With Grafana Reporting)

Send test results to Grafana Cloud for visualization:

```bash
# Individual cloud tests
npm run cloud:api         # Upload API test results
npm run cloud:load        # Upload Load test results
npm run cloud:stress      # Upload Stress test results
npm run cloud:spike       # Upload Spike test results
npm run cloud:volume      # Upload Volume test results
npm run cloud:soak        # Upload Soak test results

# All tests with cloud reporting
npm run cloud:all         # Upload all test results
```

### Direct k6 Commands

After building (`npm run build`), you can run k6 directly:

```bash
# Local execution
k6 run dist/api-test.js

# Cloud execution (requires env vars)
k6 cloud dist/api-test.js

# Custom options
k6 run --vus 20 --duration 2m dist/load-test.js
```

### Validation & Development

```bash
# Type checking and linting
npm run validate          # TypeScript + ESLint
npm run typecheck         # TypeScript compilation check
npm run lint              # ESLint check
npm run lint:fix          # Auto-fix linting issues

# Code formatting
npm run format            # Format all files
npm run format:check      # Check formatting

# Build
npm run build             # Build once
npm run build:watch       # Build and watch for changes
```

---

## 🔄 GitHub Actions CI/CD

### Workflow Overview

The CI/CD pipeline automatically runs on:
- **Push** to `main`, `master`, or `develop` branches
- **Pull requests** targeting these branches

### Pipeline Jobs

**1. Setup** (🔧 Initialize & Setup)
- Checks out code
- Sets up Node.js 18
- Installs dependencies
- Builds tests
- Installs k6

**2. Validation** (✅ Validation)
- TypeScript compilation
- Validates all test files exist

**3. Test Execution** (🧪 Run K6 Tests)
- Runs all 6 test types in parallel (matrix strategy)
- Verifies Grafana Cloud configuration
- Uploads results to Grafana Cloud
- Tests: `[api, load, stress, spike, volume, soak]`

**4. Summary** (📊 Test Summary)
- Displays completion status
- Provides Grafana dashboard link

### Required GitHub Secrets

Configure these in: **Settings** → **Secrets and variables** → **Actions**

| Secret Name | Value | Description |
|------------|-------|-------------|
| `GRAFANA_CLOUD_API_TOKEN` | Your k6 Personal API token | Authentication for Grafana Cloud |
| `GRAFANA_CLOUD_HOST` | `https://ingest.k6.io` | k6 Cloud API endpoint |
| `GRAFANA_CLOUD_PROJECT_ID` | `Your Grafana project ID` | Your Grafana k6 project ID |

### Workflow File Location

Located at: `.github/workflows/k6-ci.yml`

Key workflow step:

```yaml
- name: 🧪 Run ${{ matrix.test }} test and send to Grafana Cloud
  env:
    K6_CLOUD_TOKEN: ${{ secrets.GRAFANA_CLOUD_API_TOKEN }}
    K6_CLOUD_HOST: ${{ secrets.GRAFANA_CLOUD_HOST }}
    K6_CLOUD_PROJECT_ID: ${{ secrets.GRAFANA_CLOUD_PROJECT_ID }}
  run: k6 cloud dist/${{ matrix.test }}-test.js
```

### Viewing CI/CD Results

1. Go to your repository's **Actions** tab
2. Click on the workflow run
3. View individual test job results
4. Check the summary for Grafana dashboard link

---

## 📊 Grafana Cloud Test Reporting

### Initial Setup

#### Step 1: Get Your k6 API Token

1. Navigate to your Grafana Cloud k6 project settings:
   - **Testing & synthetics** → **Performance** → **Settings** → **Personal token**
   - Direct URL: `https://yourprofile.grafana.net/a/k6-app/settings/api-token`

2. Click **"Regenerate API token"** button

3. Copy the generated token (long hexadecimal string)

#### Step 2: Configure Local Environment

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your credentials:
   ```env
   GRAFANA_CLOUD_API_TOKEN=your_actual_token_here
   GRAFANA_CLOUD_HOST=https://ingest.k6.io
   GRAFANA_CLOUD_PROJECT_ID=6527709
   ```

   **Critical:** The host **must** be `https://ingest.k6.io` (API endpoint, not web UI URL)

#### Step 3: Configure GitHub Repository

For automated CI/CD reporting:

1. Go to repository **Settings** → **Secrets and variables** → **Actions**

2. Click **"New repository secret"** and add each secret:

   **Secret 1:**
   - Name: `GRAFANA_CLOUD_API_TOKEN`
   - Value: Your k6 Personal API token

   **Secret 2:**
   - Name: `GRAFANA_CLOUD_HOST`
   - Value: `https://ingest.k6.io`

   **Secret 3:**
   - Name: `GRAFANA_CLOUD_PROJECT_ID`
   - Value: `6527709`

3. **Important:** Ensure no extra spaces before/after values

#### Step 4: Test the Setup

Run a test locally to verify configuration:

```bash
npm run cloud:api
```

**Expected output:**
```
Init   [   0% ] Loading test script...
Init   [   0% ] Building the archive...
Init   [ 100% ] Uploading to Grafana Cloud...

Test finished
```

#### Step 5: View Results

Access your test results at:
```
https://dinkarsingh.grafana.net/a/k6-app/projects/6527709
```

### Understanding Grafana Dashboards

#### Key Metrics Displayed:

**Performance Metrics:**
- Response time percentiles (p90, p95, p99)
- Request rate (requests/second)
- Data transfer rates (sent/received)

**Reliability Metrics:**
- HTTP error rates
- Check failure rates
- Threshold violations

**Load Pattern:**
- Virtual users over time
- Request distribution
- Stage transitions

#### Analyzing Test Results:

**1. Response Time Trends**
- Look for degradation over time
- Compare p95 vs p99 (consistency indicator)
- Identify slow endpoints

**2. Error Analysis**
- Check error rate percentage
- Review error types and patterns
- Correlate errors with load levels

**3. Threshold Compliance**
- Green ✓ = Passed thresholds
- Red ✗ = Failed thresholds
- Review failed thresholds for performance issues

**4. Comparing Test Runs**
- Select multiple runs for comparison
- Track performance improvements/regressions
- Identify trends across deployments

---

## 🎯 Test Types

| Test | Duration | VUs | Purpose |
|------|----------|-----|---------|
| **API Test** | 1 min | 10 | Validates endpoints, authentication, data integrity |
| **Load Test** | 1 min | 10-20 | Normal traffic patterns, baseline metrics |
| **Stress Test** | 1 min | 20-100 | Finding breaking points, system limits |
| **Spike Test** | 1 min | 10-200 | Sudden traffic increases, auto-scaling |
| **Volume Test** | 1.5 min | 5-25 | Large data operations, database performance |
| **Soak Test** | 1.5 min | 20 | Long-term stability, memory leaks |

**Total execution time:** ~7 minutes for all tests

### Test Details

#### 1. API Test
**Focus:** Comprehensive endpoint validation
- User registration and authentication
- Article CRUD operations
- Tag management
- Error handling and edge cases

#### 2. Load Test
**Focus:** Normal operating conditions
- 60% users browse articles
- 20% users browse articles and tags
- 20% users perform authenticated actions

#### 3. Stress Test
**Focus:** System breaking points
- Progressive load increase (20 → 100 users)
- Aggressive user behaviors
- System recovery observation

#### 4. Spike Test
**Focus:** Sudden traffic surges
- Rapid scaling (10 → 200 users)
- System resilience testing
- Auto-scaling validation

#### 5. Volume Test
**Focus:** Large data handling
- Deep pagination testing
- Bulk operations
- Database query performance

#### 6. Soak Test
**Focus:** Long-term stability
- Steady load over extended period
- Memory leak detection
- Resource accumulation monitoring

---

### Validation Commands

```bash
# Verify environment configuration
cat .env

# Test Grafana Cloud connection
npm run cloud:api

# Check build output
npm run build
ls -la dist/

# Validate code quality
npm run validate
```

---

## 📚 Resources

- **k6 Documentation:** [k6.io/docs](https://k6.io/docs/)
- **Grafana Cloud k6:** [grafana.com/docs/grafana-cloud/testing/k6](https://grafana.com/docs/grafana-cloud/testing/k6/)
- **k6 Cloud REST API:** [k6.io/docs/cloud/cloud-reference/cloud-rest-api](https://k6.io/docs/cloud/cloud-reference/cloud-rest-api/)
- **RealWorld API Spec:** [github.com/gothinkster/realworld](https://github.com/gothinkster/realworld/tree/master/api)

