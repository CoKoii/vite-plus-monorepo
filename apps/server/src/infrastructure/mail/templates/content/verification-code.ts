import { handlebars, noteStyle, paragraphStyle, render } from "../layout";

interface VerificationCodeContext {
  code: string;
  actionUrl?: string;
  actionLabel?: string;
}

const template = handlebars.compile(`<p style="${paragraphStyle}">
  你好，
</p>
<p style="${paragraphStyle}">
  您的验证码为：
</p>
<p style="margin: 0 0 16px; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #111827; text-align: center;">
  {{code}}
</p>
<p style="${noteStyle}">
  验证码有效期为 5 分钟，请勿泄露给他人。
</p>
{{#if actionUrl}}{{> button label=actionLabel url=actionUrl}}{{/if}}`);

export function renderVerificationCode(
  context: VerificationCodeContext,
  projectName: string,
): string {
  return render(template(context), projectName);
}
