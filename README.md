
<!--#echo json="package.json" key="name" underline="=" -->
read-data-file
==============
<!--/#echo -->

<!--#echo json="package.json" key="description" -->
Read data/config files in various formats (parsers list is configurable).
<!--/#echo -->


Usage
-----

see [test/usage.mjs](test/usage.mjs)



API
---

This module exports one function:

### readDataFile(path)

Return a promise for data read from the file at path `path`.

### readDataFile.cfg(opts)

Make a custom version of `readDataFile`, with customization given as
the config object `opts`, which supports the config options described below.




Config options
--------------

They are carried as same-named properties on the read function.
It's a good idea to `.cfg()` your own custom read function instead of
globally reconfiguring the default read function.


### readersByFext

A dictionary that maps filename extensions to either
  * a (promising) reader function.
  * a string for indirect lookup. Only one level of indirection is supported.
    You can use this to alias extensions, e.g. `{ htm: 'html' }`.
  * `false`: Disable reading for this extension, even if the original config
    would know a reader for it.

Default readers: none


### parsersByFext

Like `readersByFext` but for looking up a (potentially promising) parser.

Default parsers:

<!--#include file="rdf.mjs" outdent="  " code="javascript"
  start="  parsersByFext: {" stop="  }," -->
<!--#verbatim lncnt="9" -->
```javascript
  ceson: cesonParser,
  ini(data) { return iniLib.parse(data); },
  json: jsonParser,
  json5(data) { return json5Lib.parse(data); },
  toml(data) { return tomlLib.parse(data); },
  yaml(data) { return yamlLib.safeLoad(data); },
  yml: 'yaml',
```
<!--/include-->






<!--#toc stop="scan" -->



Known issues
------------

* v1.x was an alias for `require(&#39;fs-read-data&#39;).readFile`,
  but that package turned out to have some seriously questionable defaults,
  had no way to add parsers, and seemed abandoned by its maintainer.
* Needs more/better tests and docs.




&nbsp;


License
-------
<!--#echo json="package.json" key=".license" -->
ISC
<!--/#echo -->
