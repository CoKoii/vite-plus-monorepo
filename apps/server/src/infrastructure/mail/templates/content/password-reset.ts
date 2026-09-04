import { handlebars, paragraphStyle, render } from "../layout";

interface PasswordResetContext {
  resetUrl: string;
}

const template = handlebars.compile(`<p style="${paragraphStyle}">
  我们收到了您的密码重置请求。
</p>
<p style="${paragraphStyle}">
  请点击下方按钮设置新密码，链接有效期为 30 分钟：
</p>
{{> button label="重置密码" url=resetUrl}}`);

export function renderPasswordReset(context: PasswordResetContext, projectName: string): string {
  return render(template(context), projectName);
}
