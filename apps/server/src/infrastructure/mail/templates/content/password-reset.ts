import { handlebars, paragraphStyle, render } from "../layout/index.ts";

interface PasswordResetContext {
  resetUrl: string;
}

const template = handlebars.compile(`<p style="${paragraphStyle}">
  我们收到了你的密码重置请求。
</p>
<p style="${paragraphStyle}">
  点击下方按钮设置新密码，链接 30 分钟内有效：
</p>
{{> button label="重设密码" url=resetUrl}}`);

export function renderPasswordReset(context: PasswordResetContext): string {
  return render(template(context));
}
