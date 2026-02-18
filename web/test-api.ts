/**
 * Frontend API Integration Test
 * 
 * Test that frontend can communicate with backend
 * Run after starting both backend and frontend
 */

import { apiClient } from "./src/lib/api-client";

async function testIntegration() {
  console.log("=".repeat(60));
  console.log("VoxNote 2.0 Frontend-Backend Integration Test");
  console.log("=".repeat(60));

  try {
    // Test 1: Health check
    console.log("\n[1/4] Testing backend health...");
    const health = await apiClient.healthCheck();
    console.log("✓ Backend is healthy");
    console.log(`  Status: ${health.status}`);
    console.log(`  Version: ${health.version}`);

    // Test 2: List meetings
    console.log("\n[2/4] Testing meetings endpoint...");
    const meetings = await apiClient.listMeetings(1, 0);
    console.log("✓ Meetings endpoint working");
    console.log(`  Total meetings/documents: ${meetings.length}`);

    // Test 3: Risk summary
    console.log("\n[3/4] Testing risk summary...");
    const risk = await apiClient.getRiskSummary();
    console.log("✓ Risk endpoint working");
    console.log(`  Total tasks: ${risk.total_tasks}`);
    console.log(`  Average risk score: ${risk.average_risk_score.toFixed(1)}`);

    // Test 4: Tasks
    console.log("\n[4/4] Testing tasks endpoint...");
    const tasks = await apiClient.listTasks({});
    console.log("✓ Tasks endpoint working");
    console.log(`  Total tasks: ${tasks.length}`);

    console.log("\n" + "=".repeat(60));
    console.log("✓ All Integration Tests Passed!");
    console.log("=".repeat(60));
    console.log("\nReady to use:");
    console.log("1. Go to /history to upload files");
    console.log("2. Go to /dashboard to see risk metrics");
    console.log("3. Go to /live to see real-time data");
    console.log("\n");
  } catch (error) {
    console.error("✗ Integration test failed:");
    console.error(error);
    process.exit(1);
  }
}

// Run if executed directly
if (typeof window === "undefined" && require.main === module) {
  testIntegration();
}

export { testIntegration };
