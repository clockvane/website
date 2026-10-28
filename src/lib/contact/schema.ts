import * as z from 'zod/mini';
import { contactCopy } from '../../content/contact';

export const limits = { name: 100, reply: 254, message: 3000 } as const;
export const fieldNames = ['name', 'reply', 'message'] as const;
export type FieldName = (typeof fieldNames)[number];
export type FieldErrors = Partial<Record<FieldName, string>>;
const errors = contactCopy.errors;
const singleLine = /^[^\u0000-\u001f\u007f<>]*$/u;
const email = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/u;
const phone = /^\+[1-9][\d ()-]{6,24}$/u;

export const enquirySchema = z.object({
  name: z
    .string()
    .check(
      z.trim(),
      z.minLength(1, errors.name),
      z.maxLength(limits.name, errors.nameLong),
      z.regex(singleLine, errors.nameCharacters),
    ),
  reply: z.string().check(
    z.trim(),
    z.minLength(1, errors.reply),
    z.maxLength(limits.reply, errors.replyLong),
    z.regex(singleLine, errors.replyCharacters),
    z.refine(
      (value) =>
        email.test(value) ||
        (phone.test(value) &&
          value.replace(/\D/g, '').length >= 7 &&
          value.replace(/\D/g, '').length <= 15),
      {
        error: (issue) =>
          typeof issue.input === 'string' && issue.input.includes('@')
            ? errors.email
            : errors.phone,
      },
    ),
  ),
  message: z
    .string()
    .check(
      z.trim(),
      z.minLength(1, errors.message),
      z.minLength(10, errors.messageShort),
      z.maxLength(limits.message, errors.messageLong),
      z.regex(
        /^[^\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f<>]*$/u,
        errors.messageCharacters,
      ),
    ),
});
export type Enquiry = z.infer<typeof enquirySchema>;

export function validateEnquiry(input: unknown) {
  const parsed = enquirySchema.safeParse(input);
  if (parsed.success) return { ok: true as const, value: parsed.data };
  const fields: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (fieldNames.includes(field as FieldName) && !fields[field as FieldName])
      fields[field as FieldName] = issue.message;
  }
  return { ok: false as const, fields };
}
