/** 统一邮箱的存储和查询格式。 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
