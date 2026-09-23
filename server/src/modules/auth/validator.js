const { z } = require('zod');

const phoneSchema = z.string().trim().min(8).max(30).regex(/^[+0-9() .-]+$/, 'Số điện thoại không hợp lệ');
const passwordSchema = z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự').max(128);
const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9._-]{2,29}$/, 'Tên đăng nhập phải gồm 3–30 ký tự chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang');
const emailSchema = z.string().trim().toLowerCase().email('Email không hợp lệ').max(191);
const loginIdentifierSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Cần nhập tên đăng nhập hoặc email')
  .max(191)
  .refine(
    (value) => emailSchema.safeParse(value).success || usernameSchema.safeParse(value).success,
    'Tên đăng nhập hoặc email không hợp lệ'
  );

const registerSchema = z.object({
  username: usernameSchema.nullish(),
  email: emailSchema.nullish(),
  password: passwordSchema,
  fullName: z.string().trim().min(2).max(120),
  phone: phoneSchema.optional(),
  role: z.enum(['STUDENT', 'LANDLORD']).default('STUDENT')
}).strict().refine(
  (value) => Boolean(value.username || value.email),
  { message: 'Cần cung cấp tên đăng nhập hoặc email', path: ['username'] }
);

const loginSchema = z.object({
  identifier: loginIdentifierSchema.optional(),
  // Giữ tương thích với các ứng dụng khách cũ đang gửi trường `email`.
  email: emailSchema.optional(),
  password: z.string().min(1).max(128)
}).strict().refine(
  (value) => Boolean(value.identifier || value.email),
  { message: 'Cần nhập tên đăng nhập hoặc email', path: ['identifier'] }
);

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema
}).strict();

module.exports = { registerSchema, loginSchema, passwordChangeSchema, usernameSchema };
