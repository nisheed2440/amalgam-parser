export interface LinkObject {
  src: string;
  rel?: string;
  as?: string;
}

export interface ScriptObject {
  src: string;
  async?: boolean;
  defer?: boolean;
}

export interface ElementAttribute {
  name: string;
  value: string;
}

export interface ElementNode {
  nodeName: string;
  tagName: string;
  attrs: ElementAttribute[];
  namespaceURI: string;
  childNodes: ElementNode[];
  parentNode: string;
}

export type StylesScriptArray = Array<string | LinkObject | ScriptObject>;

export type ScriptStylesHook = (stylesScriptsArray: StylesScriptArray) => StylesScriptArray;

export type ComponentHandler = (
  node: ElementNode,
  matchedHtml: string,
  headScriptsStyles: StylesScriptArray,
  bodyScriptsStyles: StylesScriptArray,
) => Promise<string>;

export interface ParserOptions {
  headScriptsStyles?: StylesScriptArray;
  bodyScriptsStyles?: StylesScriptArray;
  headScriptsStylesHook?: ScriptStylesHook;
  bodyScriptsStylesHook?: ScriptStylesHook;
  componentHandler?: ComponentHandler;
  templateSanitizer?: (template: string) => string;
}
