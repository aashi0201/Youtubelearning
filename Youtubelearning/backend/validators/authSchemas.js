const { z } = require("zod");

const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(60),
    email: z.string().trim().email(),
    username: z.string().trim().min(3).max(30).optional(),
    password: z.string().min(8),
  }),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

const loginSchema = z.object({
  body: z
    .object({
      email: z.string().trim().min(1).optional(),
      username: z.string().trim().min(1).optional(),
      identifier: z.string().trim().min(1).optional(),
      password: z.string().min(1),
    })
    .refine((data) => Boolean(data.email || data.username || data.identifier), {
      message: "Email or username is required",
    }),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

const forgotPasswordSchema = z.object({
  body: z
    .object({
      email: z.string().trim().min(1).optional(),
      username: z.string().trim().min(1).optional(),
    })
    .refine((data) => Boolean(data.email || data.username), {
      message: "Email or username is required",
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
