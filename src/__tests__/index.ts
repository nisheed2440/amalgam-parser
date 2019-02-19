import entities from 'entities';

import { AmalgamParser } from '..';
import { ComponentHandler, LinkObject, ScriptObject, ScriptStylesHook, StylesScriptArray } from '../interfaces';

let sampleHTML: string;
let headScriptsStyles: StylesScriptArray;
let bodyScriptsStyles: StylesScriptArray;
let headScriptsStylesHook: ScriptStylesHook;
let bodyScriptsStylesHook: ScriptStylesHook;
let componentHandler: ComponentHandler;
let templateSanitizer;

describe('Initialization', () => {
  beforeEach(() => {
    sampleHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
    <div data-controller="header"></div>
</body>
</html>
`;

    headScriptsStyles = ['test.js', 'test.css', '<script src="test.js"></script>'];
    bodyScriptsStyles = ['test.js', 'test.css', '<script src="test.js"></script>'];
    headScriptsStylesHook = (data = []) => data;
    bodyScriptsStylesHook = (data = []) => data;
    componentHandler = (_node, html) => Promise.resolve(html);
  });

  test('should initialize with default options', done => {
    const parser = new AmalgamParser();
    parser.parse(sampleHTML).then(parsedOutput => {
      expect(parsedOutput).toBe(sampleHTML);
      done();
    });
  });
  test('should initialize with custom options', () => {
    const parser = new AmalgamParser({
      headScriptsStyles,
      bodyScriptsStyles,
      bodyScriptsStylesHook,
      headScriptsStylesHook,
      componentHandler,
    });
    expect(parser.options.headScriptsStyles).toEqual(headScriptsStyles);
    expect(parser.options.bodyScriptsStyles).toEqual(bodyScriptsStyles);
  });
});

describe('Styles and scripts utilities', () => {
  // tslint:disable:no-string-literal
  const parser = new AmalgamParser();

  describe('Validate head script or styles', () => {
    test('should return true for meta tags', () => {
      expect(parser['isValidHeadElement'](`<meta charset="UTF-8">`)).toBe(true);
    });
    test('should return true for link tags', () => {
      expect(parser['isValidHeadElement'](`<link href="test.css" as="style" rel="preload">`)).toBe(true);
    });
    test('should return true for script tags', () => {
      expect(parser['isValidHeadElement'](`<script src="test.js"></script>`)).toBe(true);
      expect(parser['isValidHeadElement'](`<script>var test = 'test'</script>`)).toBe(true);
    });
    test('should return true for style tags', () => {
      expect(parser['isValidHeadElement'](`<style>.body {background-color: red}</style>`)).toBe(true);
    });
    // tslint:enable:no-string-literal
  });

  describe('Validate body script or styles', () => {
    // tslint:disable:no-string-literal
    test('should return false for meta tags', () => {
      expect(parser['isValidBodyElement'](`<meta charset="UTF-8">`)).toBe(false);
    });
    test('should return false for link tags', () => {
      expect(parser['isValidBodyElement'](`<link href="test.css" as="style" rel="preload">`)).toBe(false);
    });
    test('should return true for script tags', () => {
      expect(parser['isValidBodyElement'](`<script src="test.js"></script>`)).toBe(true);
      expect(parser['isValidBodyElement'](`<script>var test = 'test'</script>`)).toBe(true);
    });
    test('should return true for style tags', () => {
      expect(parser['isValidBodyElement'](`<style>.body {background-color: red}</style>`)).toBe(true);
    });
    // tslint:enable:no-string-literal
  });

  describe('Create link tags', () => {
    test('should create link tag from valid string', () => {
      expect(parser.createLinkElement(`hello.css`)).toBe(`<link rel="stylesheet" href="hello.css">`);
    });
    test('should create link tag from valid object', () => {
      const linkObj: LinkObject = {
        src: 'hello.css',
      };
      expect(parser.createLinkElement(linkObj)).toBe(`<link rel="stylesheet" href="hello.css">`);
    });
    test('should create preload link tag from valid object', () => {
      const linkObj: LinkObject = {
        src: 'test.js',
        rel: 'preload',
        as: 'script',
      };
      expect(parser.createLinkElement(linkObj)).toBe(`<link rel="preload" href="test.js" as="script">`);
    });
    test('should return empty for invalid strings', () => {
      const linkObj: LinkObject = {
        src: 'test.js',
      };
      expect(parser.createLinkElement(linkObj)).toBe('');
      expect(parser.createLinkElement('test.js')).toBe('');
    });
  });

  describe('Create script tags', () => {
    test('should create script tag from valid string', () => {
      expect(parser.createScriptElement(`test.js`)).toBe(`<script src="test.js"></script>`);
    });
    test('should create script tag from valid object', () => {
      const scriptObj: ScriptObject = {
        src: 'test.js',
      };
      expect(parser.createScriptElement(scriptObj)).toBe(`<script src="test.js"></script>`);
    });
    test('should create script tag from valid object with async or defer', () => {
      const scriptObj: ScriptObject = {
        src: 'test.js',
        async: true,
        defer: true,
      };
      expect(parser.createScriptElement(scriptObj)).toBe(`<script src="test.js" async defer></script>`);
    });
    test('should return empty for invalid strings', () => {
      const scriptObj: ScriptObject = {
        src: 'hello.css',
      };
      expect(parser.createScriptElement(scriptObj)).toBe('');
      expect(parser.createScriptElement('hello.css')).toBe('');
    });
  });
});

describe('Template assets updater', () => {
  beforeEach(() => {
    sampleHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>Document</title>
    </head>
    <body></body>
    </html>
    `;
    headScriptsStyles = ['test.head.js', 'test.head.css', '<meta charset="UTF-8">'];
    bodyScriptsStyles = ['test.body.js', 'test.body.css', '<script>var test = "test"</script>'];
  });

  test('should add output of script and style arrays to template', done => {
    const parser = new AmalgamParser({
      headScriptsStyles,
      bodyScriptsStyles,
    });
    parser.parse(sampleHTML).then(parsedOutput => {
      expect(parsedOutput).toContain(`<script src="test.head.js"></script>`);
      expect(parsedOutput).toContain(`<link rel="stylesheet" href="test.head.css">`);
      expect(parsedOutput).toContain(`<meta charset="UTF-8">`);

      expect(parsedOutput).toContain(`<script src="test.body.js"></script>`);
      expect(parsedOutput).toContain(`<script>var test = "test"</script>`);
      expect(parsedOutput).not.toContain(`<link rel="stylesheet" href="test.body.css">`);
      done();
    });
  });

  test('should modify and add output of script and style arrays to template', done => {
    const parser = new AmalgamParser({
      headScriptsStyles,
      bodyScriptsStyles,
      headScriptsStylesHook: (items: StylesScriptArray) => {
        items.push('test.2.head.js');
        return items;
      },
      bodyScriptsStylesHook: (items: StylesScriptArray) => {
        items.push('test.2.body.js');
        return items;
      },
    });
    parser.parse(sampleHTML).then(parsedOutput => {
      expect(parsedOutput).toContain(`<script src="test.2.head.js"></script>`);
      expect(parsedOutput).toContain(`<script src="test.2.body.js"></script>`);
      done();
    });
  });
});

describe('Components handler', () => {
  beforeEach(() => {
    sampleHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>Document</title>
    </head>
    <body>
        <div data-controller="header"></div>
        <div data-controller="recommendations" data-json="{"cms-content":{"isAuthoring":"N","propertyId":"hpHero","target":"recommendations"}}" id="1544655611025a172ca8d-445f-42b1-bc7c-bfdb2c209266" data-isCSR="false">
		</div>
    </body>
    </html>
    `;
  });
  test('should modify input template using `data-controller` attribute', done => {
    componentHandler = (node, _html, headAssets, bodyAssets) => {
      let output = '';
      node.attrs.forEach(element => {
        if (element.name === 'data-controller') {
          output += `<div>${element.value}</div>`;
          headAssets.push(`${element.value}.css`);
          bodyAssets.push(`${element.value}.js`);
        }
      });
      return Promise.resolve(output);
    };
    const parser = new AmalgamParser({
      componentHandler,
    });
    parser.parse(sampleHTML).then(parsedOutput => {
      expect(parsedOutput).toContain('<div>header</div>');
      expect(parsedOutput).toContain('<link rel="stylesheet" href="header.css">');
      expect(parsedOutput).toContain('<script src="header.js"></script>');
      done();
    });
  });

  test('should modify input template using custom attribute', done => {
    templateSanitizer = (template: string) => {
      const replacer = (_match: any, _p1: any, p2: any) => {
        return `data-json="${entities.encode(`{${p2}}`)}"`;
      };
      const regex = new RegExp(/data-json=("{)+(.*)?(}")+/, 'ig');
      const result = template.replace(regex, replacer);
      return result;
    };
    componentHandler = (node, _html, headAssets, bodyAssets) => {
      let output = '';
      node.attrs.forEach(attr => {
        if (attr.name === 'data-controller') {
          output += `<div>${attr.value}</div>`;
          headAssets.push(`${attr.value}.css`);
          bodyAssets.push(`${attr.value}.js`);
        }
        if (attr.name === 'data-json') {
          output += `<script>var output = ${entities.decode(attr.value)}</script>`;
        }
      });
      return Promise.resolve(output);
    };
    const parser = new AmalgamParser({
      componentHandler,
      templateSanitizer,
    });
    parser.parse(sampleHTML).then(parsedOutput => {
      expect(parsedOutput).toContain('<div>header</div>');
      expect(parsedOutput).toContain('<div>recommendations</div>');
      expect(parsedOutput).toContain('<script>var output = {');
      done();
    });
  });
});
