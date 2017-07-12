
/**
 * Returns whether the argument is a currently present in the DOM HTMLNode or not
 * @param  {HTMLElement} el
 * @return {Boolean}
 */
const isElement = (el) => typeof el === 'object' && el !== null && el.nodeType > 0;

/**
 * Recursively Iterates through a DOM MicroData schema and builds a data object based on the itemprop attribute
 *
 * @private
 * @param  {HTMLElement} curDomNode
 * @param  {Object} [parentDataNode={}]
 * @return {Object}
 */
function parseNestedItemProps(curDomNode, parentDataNode = {}) {
  // scope to select direct children on chrome and safari
  // use shim for other browsers
  const directItemPropsEls = curDomNode.querySelectorAll(':scope > [itemprop]');

  const curNodeKey = curDomNode.getAttribute('itemprop');

  if (directItemPropsEls.length) {
    // This means the itemprop element has other nested itemprop elements
    // We iterate through them until we find the very last node
    // We keep the hierarchy mapping expressed in our object
    let childrenValues = {};

    if (!curNodeKey) {
      // If no curNodeKey we are on the root of the DOM tree so no need to create an extra level for now
      childrenValues = parentDataNode;
    } else if (parentDataNode[curNodeKey]) {
      // This means a property with the same name already exists in the object
      // The next iteration should insert children on this node then (merge)
      childrenValues = parentDataNode[curNodeKey];
    } else {
      // This itemprop is brand new. Set it to our empty object as the parent one
      // - will keep a symlink to it on next iteration
      parentDataNode[curNodeKey] = childrenValues;
    }

    // Recurvely iterate through all the nested direct children saving them to
    // the nested parent values object
    directItemPropsEls.forEach((el) => {
      parseNestedItemProps(el, childrenValues);
    });
  } else {
    // We reached the end of the current tree node

    // Save the relevant attributes for rendering
    const itemProps = {
      value: curDomNode.getAttribute('content') || (curDomNode.innerText || curDomNode.getAttribute('alt')),
      url: curDomNode.getAttribute('href'), // if not null it is a link
      src: curDomNode.getAttribute('src'), // if not null it is an image
    };

    if (parentDataNode[curNodeKey]) {
      // There is a node with the same property name
      // Insert both values as a brand new array
      parentDataNode[curNodeKey] = [parentDataNode[curNodeKey]].concat([itemProps]);
    } else {
      // This is the first node with this name
      // Create it with object as value instead of array
      parentDataNode[curNodeKey] = itemProps;
    }
  }

  return parentDataNode;
}

/**
 * Recursively iterates through a given object tree that represents a MicroData schema
 * - expressing its structure in a HTML Table
 *
 * @private
 * @param  {HTMLElement} parentTBody
 * @param  {Object} curSchema
 */
function generateTableBody(parentTBody, curSchema) {
  Object.keys(curSchema).forEach((key) => {
    // Isolate this nodes values
    const childObj = curSchema[key];

    // Each iteration will have a parent row
    const row = document.createElement('tr');

    // Construct our first column (attribute name)
    const propCell = document.createElement('td');
    const propCellText = document.createTextNode(key);
    propCell.appendChild(propCellText);

    row.appendChild(propCell);

    // Will be the second column (value)
    const valueCell = document.createElement('td');

    // If we have a property value, it means this is the last node
    if (!{}.hasOwnProperty.call(childObj, 'value')) { // never access from prototype
      // Not the last node
      // - https://s-media-cache-ak0.pinimg.com/originals/16/fb/a4/16fba460233355641ca32e6bfe8a0171.gif
      // This contains another nested item prop. Create a nested table and iterate again

      // Create an inner table
      const innerTbl = document.createElement('table');
      const innerTblTbody = document.createElement('tbody');

      generateTableBody(innerTblTbody, childObj);

      innerTbl.appendChild(innerTblTbody);
      valueCell.appendChild(innerTbl);
      // We tell this is a td with a nested table
      valueCell.className = 'td--nested';
    } else {
      // The last node!
      valueCell.appendChild(createLastNodeElement(childObj));
    }

    // Whatever happened before, we append it to our parent row
    row.appendChild(valueCell);

    parentTBody.append(row);
  });
}

/**
 * Helper method to express through an HTMLElement a specific itemprop data representation
 *
 * @private
 * @param  {String} [options.url]
 * @param  {String} [options.src]
 * @param  {String} [options.value]
 * @return {HTMLElement}
 */
function createLastNodeElement({ url, src, value }) {
  let valueCellText;

  if (url) {
    // This is a link type of itemprop
    valueCellText = document.createElement('a');
    valueCellText.href = url;
    valueCellText.append(document.createTextNode(value));
  } else if (src) {
    // This is an img type of itemprop
    valueCellText = document.createElement('img');
    valueCellText.src = src;
    valueCellText.alt = value;
  } else {
    // This is a simple textual node
    valueCellText = document.createTextNode(value);
  }

  return valueCellText;
}

/**
 * Helper method that appends our HTML Wrapper to the page's body
 *
 * @private
 * @param  {String} containerId
 * @param  {String} classNamespace
 * @return {HTMLElement}
 */
function appendContainerBody(containerId, classNamespace) {
  // get the reference for the body
  const body = document.getElementsByTagName('body')[0];

  const div = document.createElement('div');
  div.id = containerId;
  div.class = `${classNamespace}__container`;

  body.appendChild(div);

  return div;
}

/**
 * @class MicroSchemaParser
 */
class MicroSchemaParser {
  /**
   * @constructor
   * @param  {String} [options.schemaName='Product']
   * @param  {String} [options.containerId='jsSchemaParser']
   * @param  {String} [options.classNamespace='schema-parser']
   */
  constructor({ schemaName = 'Product', containerId = 'jsSchemaParser', classNamespace = 'schema-parser' } = {}) {
    this.schemaName = schemaName;
    this.containerId = containerId;
    this.classNamespace = classNamespace;

    this.parsedData = [];
    this.error = null;

    this.containerDomEl = null;
  }

  /**
   * True if class instance has parsed data ready to show
   *
   * @getter
   * @return {Boolean}
   */
  get hasData() {
    return this.parsedData && this.parsedData.length > 0;
  }

  /**
   * Returns the wrapper div. If not present creates it.
   *
   * @getter
   * @return {HTMLElement}
   */
  get containerEl() {
    // Append to body if not set yet
    if (!isElement(this.containerDomEl)) {
      this.containerDomEl = appendContainerBody(this.containerId, this.classNamespace);
    }

    return this.containerDomEl;
  }

  /**
   * @getter
   * @return {Boolean}
   */
  get isError() {
    return !!this.error;
  }

  /**
   * Parses page where this method is called looking for the constructor defined @schemaName
   *
   * @param  {HTMLElement} [rootElement=document]
   */
  parsePage(rootElement = document) {
    try {
      // Make sure whatever is passed as the rootElement is an html element present in the DOM
      if (!isElement(rootElement)) {
        throw new Error(rootElement, 'is not a valid node');
      }

      // Find elements with the right itemtype
      const itemTypeNodes = rootElement.querySelectorAll(`[itemtype$='${this.schemaName}']`);

      if (!itemTypeNodes || itemTypeNodes.length === 0) {
        throw new Error(`The schema type ${this.schemaName} was not found in this page`);
      }

      // Clear cur data before parsing again
      this.parsedData = [];

      // All good. Start iterating through the DOM
      itemTypeNodes.forEach((el) => {
        const itemTypeData = parseNestedItemProps(el);

        if (itemTypeData) {
          this.parsedData.push(itemTypeData);
        }

        return null;
      });

      if (!this.hasData) {
        throw new Error('Invalid schema types. Cannot parse.');
      }

      this.error = null;
    } catch (err) {
      this.error = err;
      console.error('Error at parsing the page schema html:', err);
    }
  }

  /**
   * When called removes all HTML inside our container
   */
  clearContainer() {
    while (this.containerEl.firstChild) {
      this.containerEl.removeChild(this.containerEl.firstChild);
    }
  }

  /**
   * Renders an error message in our container
   * @param  {String} [err] - if empty will default to instance's previously caught errors
   */
  renderError(err) {
    this.clearContainer();

    const errorSpan = document.createElement('span');
    errorSpan.className = `${this.classNamespace}__error`;

    errorSpan.textContent = `An error occurred: ${err || this.error}`;

    this.containerEl.appendChild(errorSpan);
  }

  /**
   * Renders a representation of our parsed data as a HTML Table
   */
  renderTable() {
    // Never proceed if we have an error
    if (this.isError) {
      this.renderError();
      return;
    }

    // parse method has not been called. Call it before rendering json.
    if (!this.hasData) {
      this.parsePage();
    }

    // Clear containers content
    this.clearContainer();

    // Iterate through each found schema
    // Each of them will be a table
    this.parsedData.forEach((schemaData, i) => {
      const tbl = document.createElement('table');
      tbl.className = `${this.classNamespace}__table`;

      // Table Head
      const tblHead = document.createElement('thead');
      const tblHeadRow = document.createElement('tr');
      const tblHeadTh = document.createElement('th');
      const tblHeadThText = document.createTextNode(`${this.schemaName} Table #${i}`);
      tblHeadTh.setAttribute('colspan', '2');
      tblHeadTh.appendChild(tblHeadThText);
      tblHeadRow.appendChild(tblHeadTh);
      tblHead.appendChild(tblHeadRow);

      const tblBody = document.createElement('tbody');

      generateTableBody(tblBody, schemaData);

      // put the <tbody> in the <table>
      tbl.appendChild(tblHead);
      tbl.appendChild(tblBody);
      // appends <table> into <container>
      this.containerEl.appendChild(tbl);
      // sets the border attribute of tbl to 0;
      tbl.setAttribute('border', '0');
    });
  }

  /**
   * Renders a representation of our parsed data as a JSON Object inside a HTML textarea
   */
  renderJSON() {
    // Never proceed if we have an error
    if (this.isError) {
      this.renderError();
      return;
    }

    // parse method has not been called. Call it before rendering json.
    if (!this.hasData) {
      this.parsePage();
    }

    // Clear containers content
    this.clearContainer();

    // Finaly show parsed jSON in a textarea
    const textArea = document.createElement('textarea');
    textArea.className = `${this.classNamespace}__textarea`;
    textArea.value = JSON.stringify(this.parsedData);
    this.containerEl.appendChild(textArea);
  }
}
