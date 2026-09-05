const assert = require("assert");
const { registerSchema, loginSchema } = require("../validators/authSchemas");

function runAuthValidationTests() {
  console.log("Running Auth Validation Tests...");

  // Valid registration test
  const validReg = registerSchema.safeParse({
    body: {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    },
    params: {},
    query: {},
  });
  assert.strictEqual(validReg.success, true, "Valid registration should pass validation");

  // Invalid email test
  const invalidEmailReg = registerSchema.safeParse({
    body: {
      name: "Test User",
      email: "invalid-email-string",
      password: "password123",
    },
    params: {},
    query: {},
  });
  assert.strictEqual(invalidEmailReg.success, false, "Invalid email should fail validation");

  // Short password test
  const shortPassReg = registerSchema.safeParse({
    body: {
      name: "Test User",
      email: "test@example.com",
      password: "123",
    },
    params: {},
    query: {},
  });
  assert.strictEqual(shortPassReg.success, false, "Short password (<8 chars) should fail validation");

  // Valid login test
  const validLogin = loginSchema.safeParse({
    body: {
      email: "test@example.com",
      password: "password123",
    },
    params: {},
    query: {},
  });
  assert.strictEqual(validLogin.success, true, "Valid login should pass validation");

  console.log("✅ Auth Validation Tests Passed!");
}

try {
  runAuthValidationTests();
} catch (error) {
  console.error("❌ Auth Test Failed:", error);
  process.exit(1);
}
