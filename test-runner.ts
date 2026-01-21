// Test Runner Script - Easy way to run different k6 tests
// This script helps you choose and run the appropriate test type

import exec from 'k6/execution';

// Available test configurations
const testConfigs = {
  load: {
    name: 'Load Test',
    description: 'Simulates normal expected traffic patterns',
    file: './tests/load-test.ts',
    duration: '~16 minutes',
    users: '10-20 concurrent users',
    purpose: 'Baseline performance measurement',
  },

  stress: {
    name: 'Stress Test',
    description: 'Tests application limits under high load',
    file: './tests/stress-test.ts',
    duration: '~22 minutes',
    users: '20-100 concurrent users',
    purpose: 'Find breaking point and recovery behavior',
  },

  spike: {
    name: 'Spike Test',
    description: 'Tests sudden dramatic increases in load',
    file: './tests/spike-test.ts',
    duration: '~8 minutes',
    users: '10-200 concurrent users (spikes)',
    purpose: 'Validate behavior during traffic spikes',
  },

  volume: {
    name: 'Volume Test',
    description: 'Tests application with large amounts of data',
    file: './tests/volume-test.ts',
    duration: '~28 minutes',
    users: '5-25 concurrent users',
    purpose: 'Database and data handling performance',
  },

  soak: {
    name: 'Soak Test (Endurance)',
    description: 'Tests long-term stability and memory leaks',
    file: './tests/soak-test.ts',
    duration: '~40 minutes (extend for production)',
    users: '20 concurrent users (steady)',
    purpose: 'Long-term stability and resource management',
  },

  api: {
    name: 'Comprehensive API Test',
    description: 'Tests all API endpoints systematically',
    file: './tests/api-test.ts',
    duration: '~12 minutes',
    users: '10 concurrent users',
    purpose: 'API functionality and data integrity',
  },
};

// Print usage information
export function setup() {
  console.log('🚀 K6 Performance Testing Suite');
  console.log('==================================');
  console.log('');
  console.log('Available Tests:');
  console.log('');

  Object.keys(testConfigs).forEach((key) => {
    const config = testConfigs[key as keyof typeof testConfigs];
    console.log(`📋 ${config.name}`);
    console.log(`   Description: ${config.description}`);
    console.log(`   Duration: ${config.duration}`);
    console.log(`   Users: ${config.users}`);
    console.log(`   Purpose: ${config.purpose}`);
    console.log('');
  });

  console.log('💡 How to run individual tests:');
  console.log('');
  console.log('   k6 run tests/load-test.ts      # Load Testing');
  console.log('   k6 run tests/stress-test.ts    # Stress Testing');
  console.log('   k6 run tests/spike-test.ts     # Spike Testing');
  console.log('   k6 run tests/volume-test.ts    # Volume Testing');
  console.log('   k6 run tests/soak-test.ts      # Soak Testing');
  console.log('   k6 run tests/api-test.ts       # API Testing');
  console.log('');
  console.log('🎯 Recommended Testing Sequence for New Applications:');
  console.log('');
  console.log('1. Start with API Test to validate basic functionality');
  console.log('2. Run Load Test to establish baseline performance');
  console.log('3. Execute Stress Test to find system limits');
  console.log('4. Perform Spike Test to validate traffic spike handling');
  console.log('5. Run Volume Test if you handle large datasets');
  console.log('6. Execute Soak Test for long-term stability (production)');
  console.log('');
  console.log('⚠️  This runner script is for information only.');
  console.log('   Please run individual test files directly.');

  // This script doesn't actually run tests - just provides information
  exec.test.abort('This is an information script. Run individual test files instead.');

  return {};
}

export default function () {
  // This function won't execute due to the abort above
}
