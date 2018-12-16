import parse5 from 'parse5';

import { ElementNode, LinkObject, ParserOptions, ScriptObject, StylesScriptArray } from './interfaces';

/**
 * @class AmalgamParser
 * @classdesc Class representing the amalgam parser
 */
export class AmalgamParser {
  /**
   * The parser options
   * @memberof AmalgamParser
   * @instance
   * @readonly
   */
  readonly options: ParserOptions = {
    headScriptsStyles: [],
    bodyScriptsStyles: [],
    headScriptsStylesHook: (headScriptsStyles: StylesScriptArray) => headScriptsStyles,
    bodyScriptsStylesHook: (bodyScriptsStyles: StylesScriptArray) => bodyScriptsStyles,
    componentHandler: (_node: ElementNode, html: string) => Promise.resolve(html),
    templateSanitizer: (template: string) => template,
  };
  /**
   * Regex to get the component by the data-component property
   * @memberof AmalgamParser
   * @instance
   * @readonly
   */
  readonly componentRegex: RegExp = new RegExp(
    /<([^\s]+)(.*|\s*)?data-component="([^"]+?)"(.*|\s*)?>(.*|\s*)?<\/\1>/,
    'gi',
  );
  /**
   * Regex to check if input string are valid to be injected in head tag
   * @memberof AmalgamParser
   * @instance
   * @readonly
   */
  readonly headHTMLRegex: RegExp = new RegExp(/<(meta|link)[\s\S]*?>/, 'ig');
  /**
   * Regex to check if input string are valid to be injected in body tag
   * @memberof AmalgamParser
   * @instance
   * @readonly
   */
  readonly bodyHTMLRegex: RegExp = new RegExp(/<(script|style)[\s\S]*?>[\s\S]*?<\/\1>/, 'ig');
  /**
   * Regex to check if input string ends with `.js`
   * @memberof AmalgamParser
   * @instance
   * @readonly
   */
  readonly jsFileRegex: RegExp = new RegExp(/\.js$/, 'i');
  /**
   * Regex to check if input string ends with `.css`
   * @memberof AmalgamParser
   * @instance
   * @readonly
   */
  readonly cssFileRegex: RegExp = new RegExp(/\.css$/, 'i');

  constructor(parserOptions?: ParserOptions) {
    this.options = { ...this.options, ...parserOptions };
  }
  /**
   * Function to parse the input template
   * @memberof AmalgamParser
   * @instance
   * @param {string} template The input template to be parsed
   * @returns {Promise} A promise which when resolved gives the output template string
   */
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
        outputTemplate = outputTemplate.replace(htmlInput, htmlOutput);
      }),
    );
    return this.htmlAssetsUpdater(outputTemplate);
  }
  /**
   * Function to create a script element string to be placed in the template
   * @memberof AmalgamParser
   * @instance
   * @param {string | object} input The input string or object to be parsed
   * @returns {string} The output html element as a string
   */
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
  /**
   * Function to create a link element string to be placed in the template
   * @memberof AmalgamParser
   * @instance
   * @param {string | object} input The input string or object to be parsed
   * @returns {string} The output html element as a string
   */
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
  /**
   * Function to update input template with the script and styles array specified for head and body
   * @private
   * @param {string} template The input template to be updated
   */
  private htmlAssetsUpdater(template: string) {
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
  /**
   * Function to test if input string can be placed in the head of the template
   * @private
   * @param {string} str The input string to be checked
   * @returns {boolean}
   */
  private isValidHeadElement(str: string) {
    return !!str.match(this.headHTMLRegex) || this.isValidBodyElement(str);
  }
  /**
   * Function to test if input string can be placed in the body of the template
   * @private
   * @param {string} str The input string to be checked
   * @returns {boolean}
   */
  private isValidBodyElement(str: string) {
    return !!str.match(this.bodyHTMLRegex);
  }
  /**
   * Function to check if the input string end with `.js`
   * @private
   * @param src The input string to be tested
   * @returns {boolean}
   */
  private isValidJSFile(src: string) {
    return this.jsFileRegex.test(src);
  }
  /**
   * Function to check if the input string end with `.css`
   * @private
   * @param src The input string to be tested
   * @returns {boolean}
   */
  private isValidCSSFile(src: string) {
    return this.cssFileRegex.test(src);
  }
}
