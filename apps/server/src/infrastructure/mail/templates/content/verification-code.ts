import { handlebars, noteStyle, paragraphStyle, render } from "../layout/index.ts";

interface VerificationCodeContext {
  code: string;
  loginUrl: string;
}

const template = handlebars.compile(`<p style="${paragraphStyle}">
  你好，
</p>
<p style="${paragraphStyle}">
  你的验证码是：
</p>
<p style="margin: 0 0 16px; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #111827; text-align: center;">
  {{code}}
</p>
<p style="${noteStyle}">
  验证码 10 分钟内有效，请勿泄露给他人。
</p>
{{> button label="前往登录" url=loginUrl}}`);

export function renderVerificationCode(context: VerificationCodeContext): string {
  return render(template(context));
}
