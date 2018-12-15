import parse5 from 'parse5';

import { ElementNode, LinkObject, ParserOptions, ScriptObject, StylesScriptArray } from './interfaces';

// <([^\s]+)(.*|\s*)?data-component="([^"]+?)"(.*|\s*)?>(.*|\s*)?<\/\1>

export class AmalgamParser {
  readonly options: ParserOptions = {
    headScriptsStyles: [],
    bodyScriptsStyles: [],
    headScriptsStylesHook: (headScriptsStyles: StylesScriptArray) => headScriptsStyles,
    bodyScriptsStylesHook: (bodyScriptsStyles: StylesScriptArray) => bodyScriptsStyles,
    componentHandler: (_node: ElementNode, html: string) => Promise.resolve(html),
    templateSanitizer: (template: string) => template,
  };

  readonly componentRegex: RegExp = new RegExp(
    / <([^\s]+)(.*|\s*)?data-component="([^"]+?)"(.*|\s*)?>(.*|\s*)?<\/\1>/,
    'gi',
  );

  readonly headHTMLRegex: RegExp = new RegExp(/<(meta|link)[\s\S]*?>/, 'ig');

  readonly bodyHTMLRegex: RegExp = new RegExp(/<(script|style)[\s\S]*?>[\s\S]*?<\/\1>/, 'ig');

  readonly jsFileRegex: RegExp = new RegExp(/\.js$/, 'i');

  readonly cssFileRegex: RegExp = new RegExp(/\.css$/, 'i');

  constructor(parserOptions?: ParserOptions) {
    this.options = { ...this.options, ...parserOptions };
  }

  async parse(template: string): Promise<string> {
    let outputTemplate: string = this.options.templateSanitizer ? this.options.templateSanitizer(template) : template;
    const matchedComponents: string[] = outputTemplate.match(this.componentRegex) || [];
    await Promise.all(
      matchedComponents.map(async html => {
        const htmlInput = html.trim();
        const htmlEl: any = parse5.parseFragment(htmlInput);
        const htmlOutput: string = this.options.componentHandler
          ? await this.options.componentHandler(
              htmlEl.childNodes[0],
              htmlInput,
              this.options.headScriptsStyles || [],
              this.options.bodyScriptsStyles || [],
            )
          : htmlInput;
        const inputRegex: RegExp = new RegExp(htmlInput, 'gi');
        outputTemplate = outputTemplate.replace(inputRegex, htmlOutput);
      }),
    );
    return this.htmlAssetsUpdater(outputTemplate);
  }

  isValidHeadElement(str: string) {
    return !!str.match(this.headHTMLRegex) || this.isValidBodyElement(str);
  }

  isValidBodyElement(str: string) {
    return !!str.match(this.bodyHTMLRegex);
  }

  createScriptElement(input: string | ScriptObject): string {
    if (typeof input === 'string') {
      if (this.isValidJSFile(input)) {
        return this.createScriptElement({
          src: input,
          async: false,
          defer: false,
        });
      } else {
        return '';
      }
    } else if (input && !this.isValidJSFile(input.src)) {
      return '';
    }
    return `<script src="${input.src}"${input.async ? ' async' : ''}${input.defer ? ' defer' : ''}></script>`;
  }

  createLinkElement(input: string | LinkObject): string {
    if (typeof input === 'string') {
      if (this.isValidCSSFile(input)) {
        return this.createLinkElement({
          src: input,
        });
      } else {
        return '';
      }
    } else if (input && !this.isValidCSSFile(input.src) && input.rel !== 'preload') {
      return '';
    }
    return `<link rel="${input.rel ? input.rel : 'stylesheet'}" href="${input.src}"${
      input.as ? ` as="${input.as}"` : ''
    }>`;
  }

  htmlAssetsUpdater(template: string) {
    let headAssets = '';
    let bodyAssets = '';
    let headScriptsStyles: StylesScriptArray = [...(this.options.headScriptsStyles || [])];
    let bodyScriptsStyles: StylesScriptArray = [...(this.options.bodyScriptsStyles || [])];
    headScriptsStyles = this.options.headScriptsStylesHook
      ? this.options.headScriptsStylesHook(headScriptsStyles)
      : headScriptsStyles;
    bodyScriptsStyles = this.options.bodyScriptsStylesHook
      ? this.options.bodyScriptsStylesHook(bodyScriptsStyles)
      : bodyScriptsStyles;

    headScriptsStyles.forEach(item => {
      if (typeof item === 'string' && this.isValidHeadElement(item)) {
        headAssets += item;
      } else {
        headAssets += this.createLinkElement(item);
        headAssets += this.createScriptElement(item);
      }
    });

    bodyScriptsStyles.forEach(item => {
      if (typeof item === 'string' && this.isValidBodyElement(item)) {
        bodyAssets += item;
      } else {
        bodyAssets += this.createScriptElement(item);
      }
    });

    template = template.replace(/<\/head>/, `${headAssets}</head>`);
    template = template.replace(/<\/body>/, `${bodyAssets}</body>`);
    return template;
  }

  private isValidJSFile(src: string) {
    return this.jsFileRegex.test(src);
  }

  private isValidCSSFile(src: string) {
    return this.cssFileRegex.test(src);
  }
}
