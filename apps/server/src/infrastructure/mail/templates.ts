import Handlebars from "handlebars";

// 独立 Handlebars 实例，避免污染全局注册表
const handlebars = Handlebars.create();

// 可复用片段：{{> button label="..." url="..."}}
handlebars.registerPartial(
  "button",
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding: 16px 0;">
  <tr>
    <td align="center">
      <a href="{{url}}" style="display: inline-block; padding: 12px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px;">{{label}}</a>
    </td>
  </tr>
</table>`,
);

// 公共布局：所有邮件共用页头页脚，{{{body}}} 插入模板正文
const layout = handlebars.compile(`<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
            <tr>
              <td style="padding: 24px 32px; background-color: #2563eb; color: #ffffff; font-size: 18px; font-weight: 600;">
                vite-plus-monorepo
              </td>
            </tr>
            <tr>
              <td style="padding: 32px;">
                {{{body}}}
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 32px; background-color: #f9fafb; color: #9ca3af; font-size: 12px;">
                本邮件由系统自动发送，请勿直接回复。
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`);

interface VerificationCodeContext {
  code: string;
  loginUrl: string;
}

const verificationCodeTemplate =
  handlebars.compile(`<p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #374151;">
  你好，
</p>
<p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #374151;">
  你的验证码是：
</p>
<p style="margin: 0 0 16px; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #111827; text-align: center;">
  {{code}}
</p>
<p style="margin: 0 0 8px; font-size: 12px; color: #9ca3af;">
  验证码 10 分钟内有效，请勿泄露给他人。
</p>
{{> button label="前往登录" url=loginUrl}}`);

export function renderVerificationCode(context: VerificationCodeContext): string {
  return layout(verificationCodeTemplate(context));
}
