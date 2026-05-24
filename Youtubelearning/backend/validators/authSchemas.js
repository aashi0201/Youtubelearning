const { z } = require("zod");

const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(60),
    email: z.string().trim().email(),
    password: z.string().min(8),
  }),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
    password: z.string().min(1),
  }),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
  }),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

const resetPasswordSchema = z.object({
  body: z.object({
    password: z.string().min(8),
  }),
  params: z.object({
    token: z.string().min(20),
  }),
  query: z.object({}).passthrough(),
});

const googleSchema = z.object({
  body: z.object({
    credential: z.string().min(20),
  }),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleSchema,
};
