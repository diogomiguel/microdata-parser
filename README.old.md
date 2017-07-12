# Exercise

The task is to create a bookmarklet that can analyse a web page, find product microdata and display the results. 

You should deliver an HTML page with the source of the JavaScript and a bookmarklet link that can be dragged up to the bookmarks bar. The exercise shouldn't take longer than an hour to complete. If you feel that there are any obvious areas for improvement that you could make if you had more time to spend on it, please note them in your HTML file.

You can use http://chriszarate.github.io/bookmarkleter/ to generate the bookmarklet link.

Your code must use pure JavaScript and not load any external scripts. The bookmarklet will be tested in a current version of Chrome for desktop.

Many online retailers use microdata to help web-crawlers extract important details about the products they offer. Visit http://schema.org/Product for the product schema documentation. For the purpose of this exercise only expect the 'microdata' schema to be available (not RDFa or JSON-LD).

Your bookmarklet should find the *first* occurrence of a `Product` microdata `itemtype` on the page, then search within it for elements with an `itemprop` attribute. You should build an HTML table, where the first column is the `itemprop` and the second column is the text value of the corresponding element.

The table should be attached to the DOM and fixed in position at the bottom-right of the browser viewport. The exact styling of the table is left up to the candidate, but it should be simple and high-contrast.
