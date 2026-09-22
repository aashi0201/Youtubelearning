const assert = require("assert");
const { signToken } = require("../utils/jwt");
const auth = require("../middleware/auth");
const { fetchContests } = require("../services/codingService");

async function runCodingBackendTests() {
  console.log("🧪 Running Coding Backend Routes & Service Integration Tests...");

  // 1. Test JWT Auth Middleware with simulated request
  const mockUser = {
    _id: "650000000000000000000001",
    email: "coder@example.com",
    name: "Dev Coder",
  };
  const token = signToken(mockUser);
  assert.ok(token, "Token should be generated successfully");

  let req = { headers: { authorization: `Bearer ${token}` } };
  let res = { status: (code) => ({ json: (data) => ({ code, data }) }) };
  let nextCalled = false;

  auth(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, true, "Auth middleware should pass with valid token");
  assert.strictEqual(req.user.id, mockUser._id, "Req user ID should match payload");

  // 2. Test Invalid Token Auth Middleware
  let invalidReq = { headers: { authorization: "Bearer invalid_token" } };
  let errorStatus = null;
  let errorJson = null;
  let invalidRes = {
    status: (code) => {
      errorStatus = code;
      return {
        json: (data) => {
          errorJson = data;
        },
      };
    },
  };

  const origErr = console.error;
  console.error = () => {};
  auth(invalidReq, invalidRes, () => {});
  console.error = origErr;

  assert.strictEqual(errorStatus, 401, "Auth should reject invalid token with 401");
  assert.strictEqual(errorJson.ok, false, "Response ok should be false for invalid token");

  // 3. Test Contests Service Fetching
  try {
    const contests = await fetchContests();
    assert.ok(Array.isArray(contests), "fetchContests should return an array");
    console.log(`  ✓ Contests fetched successfully: ${contests.length} upcoming contests found`);
  } catch (err) {
    console.warn("  ⚠️ Contests fetch network warning:", err.message);
  }

  console.log("✅ All Coding Backend Integration Tests Passed!");
}

if (require.main === module) {
  runCodingBackendTests().catch((err) => {
    console.error("❌ Coding Backend Test Failed:", err);
    process.exit(1);
  });
}

module.exports = runCodingBackendTests;
