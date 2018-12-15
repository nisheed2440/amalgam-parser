<a name="AmalgamParser"></a>

## AmalgamParser
Class representing the amalgam parser

**Kind**: global class  

* [AmalgamParser](#AmalgamParser)
    * [.parse(template)](#AmalgamParser+parse) ⇒ <code>Promise</code>
    * [.createScriptElement(input)](#AmalgamParser+createScriptElement) ⇒ <code>string</code>
    * [.createLinkElement(input)](#AmalgamParser+createLinkElement) ⇒ <code>string</code>

<a name="AmalgamParser+parse"></a>

### amalgamParser.parse(template) ⇒ <code>Promise</code>
Function to parse the input template

**Kind**: instance method of [<code>AmalgamParser</code>](#AmalgamParser)  
**Returns**: <code>Promise</code> - A promise which when resolved gives the output template string  

| Param | Type | Description |
| --- | --- | --- |
| template | <code>string</code> | The input template to be parsed |

<a name="AmalgamParser+createScriptElement"></a>

### amalgamParser.createScriptElement(input) ⇒ <code>string</code>
Function to create a script element string to be placed in the template

**Kind**: instance method of [<code>AmalgamParser</code>](#AmalgamParser)  
**Returns**: <code>string</code> - The output html element as a string  

| Param | Type | Description |
| --- | --- | --- |
| input | <code>string</code> \| <code>object</code> | The input string or object to be parsed |

<a name="AmalgamParser+createLinkElement"></a>

### amalgamParser.createLinkElement(input) ⇒ <code>string</code>
Function to create a link element string to be placed in the template

**Kind**: instance method of [<code>AmalgamParser</code>](#AmalgamParser)  
**Returns**: <code>string</code> - The output html element as a string  

| Param | Type | Description |
| --- | --- | --- |
| input | <code>string</code> \| <code>object</code> | The input string or object to be parsed |

