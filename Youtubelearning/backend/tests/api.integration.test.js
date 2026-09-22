const assert = require("assert");
const { sanitizeVideoId, sanitizePlaylistId, extractVideoIdFromUrl } = require("../utils/extractors");
const { signToken, verifyToken } = require("../utils/jwt");

async function runApiIntegrationTests() {
  console.log("Running API & Utility Integration Tests...");

  // 1. Test video ID sanitization
  const cleanId = sanitizeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  assert.strictEqual(cleanId.length, 11, "Sanitized video ID should be 11 chars");

  const extracted = extractVideoIdFromUrl("https://youtu.be/dQw4w9WgXcQ?t=42");
  assert.strictEqual(extracted, "dQw4w9WgXcQ", "Extracted video ID should match youtube URL parameter");

  // 2. Test playlist ID sanitization
  const cleanPlaylist = sanitizePlaylistId("PL1234567890abcdef_123");
  assert.strictEqual(cleanPlaylist, "PL1234567890abcdef_123");

  // 3. Test JWT Sign & Verify
  const mockUser = {
    _id: "507f191e810c19729de860ea",
    email: "test@example.com",
    name: "Test User",
    role: "student",
  };

  const token = signToken(mockUser);
  assert.ok(typeof token === "string" && token.length > 20, "JWT token should be generated");

  const decoded = verifyToken(token);
  assert.strictEqual(decoded.email, mockUser.email, "Decoded JWT email must match");
  assert.strictEqual(decoded.id, mockUser._id, "Decoded JWT user ID must match");

  console.log("✅ All API & Utility Integration Tests Passed Successfully!");
}

if (require.main === module) {
  runApiIntegrationTests().catch((err) => {
    console.error("❌ Test Failed:", err);
    process.exit(1);
  });
}

module.exports = runApiIntegrationTests;
