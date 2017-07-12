## Overview

Code for bookmarklet that can analyse a web page, find product microdata and display the results.

Many online retailers use microdata to help web-crawlers extract important details about the products they offer. Visit http://schema.org/Product for the product schema documentation. For the purpose of this exercise only expect the 'microdata' schema to be available (not RDFa or JSON-LD).

The bookmarklet by default finds the first *first* occurrence of a `Product` microdata `itemtype`on the page but this could be configured to show more than one.

After parsing the results can be rendered into a table or as JSON object.

## How to run

1. Go to [index.html](index.html) and add the bookmarklet link in there to your bookmarks
2. Add script.js to your page and instantiate *MicroSchemaParser* class:
```js
const productMicroParser = new MicroSchemaParser();
productMicroParser.renderTable();
```

## Options

You can pass those options at instantiation.

* **schemaName** *string* [`Product`]: schema type to find and parse
* **containerId** *string* [`jsSchemaParser`]: custom id of main HTML element wrapper
* **classNamespace** *string* [`schema-parser`]: change this to avoid clashes with page's CSS
* **maxTables** *number* [`1`]: will parse up to this number of occurrences

## Improvements

* Change CSS injection to local
* Improve CSS style clashes
* Add toggle table option
* Add button to toggle to JSON
* Create styling for JSON presentation
* On error make it disappear after x seconds
* ...
