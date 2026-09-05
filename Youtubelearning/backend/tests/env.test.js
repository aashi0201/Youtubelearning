const assert = require("assert");
const env = require("../config/env");

function runEnvTests() {
  console.log("Running Environment Configuration Tests...");

  const status = env.getConfigStatus();
  assert.strictEqual(typeof status.nodeEnv, "string", "nodeEnv should be a string");
  assert.strictEqual(typeof status.databaseProvider, "string", "databaseProvider should be a string");
  assert.strictEqual(typeof status.mongoConfigured, "boolean", "mongoConfigured should be a boolean");
  assert.strictEqual(typeof status.aiProvider, "string", "aiProvider should be a string");

  console.log("✅ Environment Configuration Tests Passed!");
}

try {
  runEnvTests();
} catch (error) {
  console.error("❌ Environment Test Failed:", error);
  process.exit(1);
}
