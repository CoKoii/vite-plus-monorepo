import Handlebars from "handlebars";

// 独立 Handlebars 实例，供各模板文件复用，避免污染全局注册表
export const handlebars = Handlebars.create();

// 通用行内样式，供各模板复用
export const paragraphStyle =
  "margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #374151;";
export const noteStyle = "margin: 0 0 8px; font-size: 12px; color: #9ca3af;";

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
export const layout = handlebars.compile(`<!DOCTYPE html>
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
                {{projectName}}
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

// 把模板正文嵌入公共布局。layout 用 {{{body}}}（三花括号，不转义），
// 因此必须把渲染结果作为 { body } 传入，而不是直接当上下文，否则正文为空。
export function render(body: string, projectName: string): string {
  return layout({ body, projectName });
}
