import { handlebars, paragraphStyle, render } from "../layout";

interface WelcomeContext {
  username: string;
  loginUrl: string;
  projectName: string;
}

const template = handlebars.compile(`<p style="${paragraphStyle}">
  您好，{{username}}：
</p>
<p style="${paragraphStyle}">
  欢迎加入 {{projectName}}，祝您使用愉快。如需帮助，请联系我们。
</p>
{{> button label="开始使用" url=loginUrl}}`);

export function renderWelcome(
  context: Omit<WelcomeContext, "projectName">,
  projectName: string,
): string {
  return render(template({ ...context, projectName }), projectName);
}
