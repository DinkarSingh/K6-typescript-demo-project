# K6 Performance Testing Suite

A comprehensive performance testing framework using K6 to test the RealWorld Demo application (https://demo.realworld.show/).

## 📋 Overview

This testing suite provides multiple types of performance tests to thoroughly evaluate your application under different conditions:

- **Load Testing** - Normal expected traffic patterns
- **Stress Testing** - High load beyond normal capacity
- **Spike Testing** - Sudden dramatic load increases
- **Volume Testing** - Large amounts of data operations
- **Soak Testing** - Long-term stability and endurance
- **API Testing** - Comprehensive endpoint validation

## 🏗️ Project Structure

```
k6_performance_test/
├── config.ts                 # Central configuration file
├── test-runner.ts            # Test information and runner guide
├── package.json              # Node.js dependencies
└── tests/
    ├── utils.ts              # Shared utility functions
    ├── load-test.ts          # Load testing (normal traffic)
    ├── stress-test.ts        # Stress testing (high load)
    ├── spike-test.ts         # Spike testing (sudden increases)
    ├── volume-test.ts        # Volume testing (large data)
    ├── soak-test.ts          # Soak testing (endurance)
    └── api-test.ts           # API testing (comprehensive)
```

## 🚀 Quick Start

### Prerequisites

1. **Install K6**: https://k6.io/docs/get-started/installation/
2. **Node.js**: For TypeScript support (already set up)

### Running Tests

#### 1. API Test (Start Here!)

_Validates basic functionality and API endpoints_

```bash
k6 run tests/api-test.ts
```

- **Duration**: ~12 minutes
- **Users**: 10 concurrent
- **Purpose**: Validate API functionality before performance testing

#### 2. Load Test

_Establishes baseline performance under normal conditions_

```bash
k6 run tests/load-test.ts
```

- **Duration**: ~16 minutes
- **Users**: 10-20 concurrent
- **Purpose**: Understand normal performance characteristics

#### 3. Stress Test

_Finds your application's breaking point_

```bash
k6 run tests/stress-test.ts
```

- **Duration**: ~22 minutes
- **Users**: 20-100 concurrent
- **Purpose**: Identify maximum sustainable load

#### 4. Spike Test

_Tests behavior during sudden traffic increases_

```bash
k6 run tests/spike-test.ts
```

- **Duration**: ~8 minutes
- **Users**: 10-200 concurrent (sudden spikes)
- **Purpose**: Validate traffic spike handling

#### 5. Volume Test

_Tests performance with large amounts of data_

```bash
k6 run tests/volume-test.ts
```

- **Duration**: ~28 minutes
- **Users**: 5-25 concurrent
- **Purpose**: Database and data handling performance

#### 6. Soak Test (Advanced)

_Long-term stability and memory leak detection_

```bash
k6 run tests/soak-test.ts
```

- **Duration**: ~40 minutes (extend for production)
- **Users**: 20 concurrent (steady)
- **Purpose**: Long-term stability analysis

## 📊 Understanding Results

### Key Metrics to Monitor

#### Response Times

- **http_req_duration**: How long requests take
- **p(95)**: 95% of requests complete within this time
- **p(99)**: 99% of requests complete within this time

#### Throughput

- **http_reqs**: Requests per second
- **data_received/sent**: Network throughput

#### Reliability

- **http_req_failed**: Percentage of failed requests
- **checks**: Percentage of validation checks that passed

### Performance Thresholds

Each test has specific performance thresholds:

```typescript
// Example Load Test Thresholds
thresholds: {
  http_req_duration: ['p(95)<2000'],  // 95% under 2 seconds
  http_req_failed: ['rate<0.1'],      // Less than 10% failures
  http_reqs: ['rate>10'],             // At least 10 req/sec
}
```

## 🎯 Test Types Explained

### 1. Load Test - Normal Traffic Simulation

**When to use**: Always run this first to establish baseline performance.

**What it tests**:

- Normal user behavior patterns
- Typical response times
- System stability under expected load
- Resource utilization patterns

**Scenarios**:

- 60% users browse articles
- 20% users browse articles and tags
- 20% users perform authenticated actions

### 2. Stress Test - Beyond Normal Capacity

**When to use**: After load test, to find your limits.

**What it tests**:

- Maximum sustainable load
- Performance degradation patterns
- System recovery after stress
- Error handling under pressure

**Load Pattern**:

- Gradual ramp from 20 → 50 → 100 users
- Tests breaking points and recovery

### 3. Spike Test - Sudden Load Increases

**When to use**: To prepare for viral content, flash sales, etc.

**What it tests**:

- Behavior during sudden 20x load increase
- Auto-scaling responsiveness
- Circuit breaker effectiveness
- Recovery after spike ends

**Scenarios Simulated**:

- Viral social media posts
- Flash sales or limited offers
- Breaking news events
- Product launches

### 4. Volume Test - Large Data Operations

**When to use**: Applications handling large datasets.

**What it tests**:

- Database performance with many records
- Pagination efficiency
- Memory usage with large responses
- Data consistency under load

**Focus Areas**:

- Deep pagination performance
- Large page size handling
- Bulk data operations
- Long-running data queries

### 5. Soak Test - Long-term Stability

**When to use**: Before production deployment.

**What it tests**:

- Memory leaks over time
- Resource accumulation
- Performance degradation
- Long-term system stability

**Duration**: 30 minutes (demo) → 4-24 hours (production)

### 6. API Test - Comprehensive Validation

**When to use**: First test to run, validates functionality.

**What it tests**:

- All API endpoints systematically
- Authentication and authorization
- Data integrity and validation
- Error handling and edge cases
- Complete user workflows

## 🛠️ Configuration

### Central Configuration (`config.ts`)

All test settings are centralized in `config.ts`:

```typescript
export const config = {
  baseUrl: 'https://demo.realworld.show',
  endpoints: {
    articles: '/api/articles',
    login: '/api/users/login',
    // ... more endpoints
  },
  thresholds: {
    load: {
      /* load test thresholds */
    },
    stress: {
      /* stress test thresholds */
    },
    // ... per test type
  },
};
```

### Customizing Tests

#### Change Target URL

Edit `config.ts`:

```typescript
baseUrl: 'https://your-api.com';
```

#### Adjust Load Patterns

Edit individual test files:

```typescript
stages: [
  { duration: '2m', target: 20 }, // Your desired pattern
  { duration: '5m', target: 20 },
  { duration: '2m', target: 0 },
];
```

#### Modify Thresholds

Edit `config.ts` thresholds section:

```typescript
load: {
  http_req_duration: ['p(95)<1000'], // Stricter: under 1s
  http_req_failed: ['rate<0.05'],    // Stricter: under 5%
}
```

## 📈 Best Practices

### Testing Sequence for New Applications

1. **API Test** → Validate basic functionality
2. **Load Test** → Establish baseline performance
3. **Stress Test** → Find system limits
4. **Spike Test** → Validate spike handling
5. **Volume Test** → (If applicable) Test data handling
6. **Soak Test** → Long-term stability (production)

### Interpreting Results

#### ✅ Good Results

- Consistent response times
- Low error rates (< 1%)
- Stable throughput
- Quick recovery after stress

#### ⚠️ Warning Signs

- Gradually increasing response times
- Error rates > 5%
- Timeouts under normal load
- Memory leaks in soak tests

#### ❌ Critical Issues

- Service unavailability
- Data corruption
- Cascading failures
- System crashes

### Production Considerations

#### Soak Test Duration

- **Development**: 30-60 minutes
- **Staging**: 2-4 hours
- **Production Validation**: 8-24 hours

#### Load Test Scaling

- Start with 10% of expected production load
- Gradually increase to 100% and beyond
- Test with production-like data volumes

## 🔍 Monitoring & Analysis

### During Tests

Monitor these system metrics alongside k6 results:

- CPU and memory usage
- Database performance
- Network I/O
- Error logs
- Response time distributions

### After Tests

1. **Response Time Analysis**

   - Look for trends and patterns
   - Identify slow endpoints
   - Check for performance degradation

2. **Error Analysis**

   - Categorize error types
   - Identify error patterns
   - Check error recovery

3. **Resource Analysis**
   - Memory usage patterns
   - CPU utilization
   - Database connection pools
   - File handles and network connections

## 🚨 Troubleshooting

### Common Issues

#### "Connection Refused" Errors

- Check if target URL is accessible
- Verify network connectivity
- Check if application is running

#### "Too Many Requests" (429) Errors

- Expected during stress/spike tests
- May indicate rate limiting (good!)
- Reduce load or adjust test timing

#### TypeScript Compilation Errors

- Ensure @types/k6 is installed: `npm install --save-dev @types/k6`
- Check import paths in test files

#### High Memory Usage During Tests

- Normal for volume/soak tests
- Monitor k6 process memory
- Reduce concurrent users if needed

### Performance Issues

#### Slow Response Times

1. Check network latency to target
2. Verify target system resources
3. Review database performance
4. Check for resource contention

#### Inconsistent Results

1. Run tests multiple times
2. Check for external factors (network, other load)
3. Verify test environment stability
4. Use longer test durations for accuracy

## 📚 Additional Resources

### K6 Documentation

- **Official Docs**: https://k6.io/docs/
- **API Reference**: https://k6.io/docs/javascript-api/
- **Examples**: https://k6.io/docs/examples/

### Performance Testing Best Practices

- **Load Testing Guide**: https://k6.io/docs/testing-guides/
- **Performance Monitoring**: https://k6.io/docs/results-visualization/
- **CI/CD Integration**: https://k6.io/docs/integrations/

### RealWorld API Documentation

- **API Spec**: https://github.com/gothinkster/realworld/tree/master/api
- **Demo Site**: https://demo.realworld.show/

---

## 🎉 Getting Started Checklist

- [ ] Install k6 on your system
- [ ] Run `npm install` to set up TypeScript support
- [ ] Start with API test: `k6 run tests/api-test.ts`
- [ ] Run load test: `k6 run tests/load-test.ts`
- [ ] Review and understand the results
- [ ] Customize tests for your specific needs
- [ ] Set up monitoring for your target application
- [ ] Create a testing schedule for regular validation

**Happy Performance Testing! 🚀**#   K 6 - t y p e s c r i p t - d e m o - p r o j e c t 
 
 
