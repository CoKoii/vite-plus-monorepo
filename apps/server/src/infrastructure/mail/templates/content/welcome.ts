import { handlebars, paragraphStyle, render } from "../layout/index.ts";

interface WelcomeContext {
  username: string;
  loginUrl: string;
}

const template = handlebars.compile(`<p style="${paragraphStyle}">
  你好，{{username}}，
</p>
<p style="${paragraphStyle}">
  欢迎加入 vite-plus-monorepo，祝你使用愉快。如需帮助，随时联系我们。
</p>
{{> button label="开始使用" url=loginUrl}}`);

export function renderWelcome(context: WelcomeContext): string {
  return render(template(context));
}
