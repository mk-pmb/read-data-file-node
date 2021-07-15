
<!--#echo json="package.json" key="name" underline="=" -->
read-data-file
==============
<!--/#echo -->

<!--#echo json="package.json" key="description" -->
Read data/config files in various formats (parsers list is configurable).
<!--/#echo -->


Usage
-----

:TODO:



API
---

This module exports one function:

### readDataFile(path)

Return a promise for data read from the file at path `path`.
If no reader and parser can be determined from config, the promise will be
rejected with error name `ReadDataFileUnsupportedFext`.



### readDataFile.cfg(opts)

Make a custom version of `readDataFile`, with customization given as
the config object `opts`, which supports the config options described
in chapter "Config Options" below.



### readDataFile.util
A collection of some internally used utility functions you might find helpful.
Explained in the "Utility Functions" chapter below.



Utility Functions
-----------------

### errUnsupportedFext(path)

Throw the error named `ReadDataFileUnsupportedFext`, as if the config
wouldn't support this file's extensions.



### readBlob(path)

&rarr; Promise

Read a file as a raw buffer.



### readText(path)

&rarr; Promise

Read a file as encoded text, using the `defaultTextEncoding` (see options).
Uses `readBlob` underneath.




Config Options
--------------

They are carried as same-named properties on the read function.
It's a good idea to `.cfg()` your own custom read function instead of
globally reconfiguring the default read function.


### blobParsersByFext

A dictionary that maps filename extensions to either

* a (promising) parser function.
  It will be invoked with just one argument, a Buffer.
* a string for indirect lookup. Only one level of indirection is supported.
  You can use this to alias extensions, e.g. `{ htm: 'html' }`.
* `false`: Unregister this extension's parser in case there was one configured
  in the original config. More specific or more general extension mappings may
  still apply.
  * To forcibly unsupport this extension and more general extensions,
    you may register the `errUnsupportedFext` utility function as the parser.

RDF will use the parser that matches most specifically.

You can set a global fallback parser for the empty string extension,
which will make any file be considered a data file.
Example: With `blobParsersByFext[''] = String`, any file that does not have a
more specific parser, will be read as just text.

Default blob parsers: see [src/blobParsersByFext.mjs](src/blobParsersByFext.mjs)



### textParsersByFext

Like `blobParsersByFext`, but parser functions defined here will be
invoked with a (primitive) string as their only argument.

Internally, both parser dictionaries will be merged.
Any name conflict in their keys will be an error.

Default text parsers: see [src/textParsersByFext.mjs](src/textParsersByFext.mjs)



### readersByFext

Like `blobParsersByFext` but for looking up a (potentially promising) reader.
Readers are expected to read files or buffers
and return buffers that may then be parsed by a parser.
For API details, see chapter "Reader invocation" below.

Their main purpose is to deal with charsets and similar encoding.
In case the input is a buffer and the concept of charsets is not
applicable to their kind of data, a reader's work might consist
of just returning that buffer.

Readers do not affect the search strategy for parsers.
(Unlike unpackers, they don't "take away" filename extensions.)

Compare the `defaultReader` option.

Default readers: see [src/readersByFext.mjs](src/readersByFext.mjs)



### unpackersByFext

Like `readersByFext` but for looking up a (potentially promising) unpacker.
Unpackers are expected to read files or (maybe in future versions) buffers,
and return buffers that may then be read by a reader.
They are invoked the same as readers, see chapter "Reader invocation" below.

Their main purpose is to deal with compression, encryption or similar
packaging.

RDF tries to unpack as many layers of packaging as possible.
To do so, it creates a _list of potentially unpackable extensions_ (LPUE),
which initially holds all filename extensions.
Each time an unpacker is found, the extensions used to find it are removed
from the LPUE, and the search is repeated.
Once no more unpacker is found, the remaining LPUE is used to find
a reader and parser.


#### Default unpackers:

<!--#include file="rdf.mjs" outdent="  " code="javascript"
  start="  unpackersByFext: {" stop="  }," -->
<!--#verbatim lncnt="3" -->
```javascript
  gz: util.readGzipFile,
```
<!--/include-->



### defaultReader

How to read contents of files that have a parser configured but no reader.
(This implies `readersByFext['']` is not set, or is `false`.)

Defaults to the `readText` utiliry function.

Configuring `defaultReader` outside of `readersByFext` does not imply any
claim about which files are data files.
By contrast, setting `readersByFext[''] = someFunc` will claim that all
files are data files, and `someFunc` will be able to read them in a
useful way.



### defaultTextEncoding

Which encoding to assume for text files that don't declare their own encoding.

Currently, only `UTF-8` and `latin-1` are supported.

Default: `'UTF-8'`



### maxFextParts

Positive integer, how many dot parts to check.

Defaults to the minimum required for the default config.

Increase if you use more complex extensions like
`something.override.ini.rot13.gz`, which would be 4 dot parts
(`override`, `ini`, `rot13`, `gz`) after the base name.



### minBaseParts

Unsigned integer, how many leading, potentially dot-separated parts of
a file name are to be considered part of the base name.
Those are thus excluded from extension detection.
If set to 1 or greater, all leading dots will be part of the basename.

Defaults to 1.

Examples:

* `minBaseParts = 0`
  * `foo.json.gz` will have basename `foo` and two extension.
    Config lookup priority will be `'json.gz', 'gz', ''`.
  * `.htaccess` will have an empty basename and one extension.
    Config lookup priority will be `'htaccess', ''`.
  * `.xsel.log` will have an empty basename and two extensions.
    Config lookup priority will be `'xsel.log', 'log', ''`.

* `minBaseParts = 1`
  * `foo.json.gz` as above.
  * `.htaccess` will have basename `.htaccess` and no extension.
    Config will be looked up for the empty extension `''` only.
  * `.xsel.log` will have basename `.xsel` and one extension.
    Config lookup priority will be `'log', ''`.

* `minBaseParts = 2`
  * `foo.json.gz` will have basename `foo.json` and one extension.
    Config lookup priority will be `'gz', ''`.
  * `.htaccess` will have basename `.htaccess` and no extension.
    Config will be looked up for the empty extension `''` only.
  * `.xsel.log` will have basename `.xsel.log` and no extension.
    Config will be looked up for the empty extension `''` only.



Reader invocation
-----------------

A reader is invoked with a single argument `path` and a special context
(`this`) object that has these keys:

* `rdf`: The `readDataFile` function responsible for the invocation.
  Useful for checking config, or invoking `rdf.util.readBlob(path)`.
* `func`: The reader function, as seen from `rdf`'s point of view,
  which might be a wrapped, bound, decorated, etc.
  version of the original reader function.
* `data`: `undefined` if the reader shall read from the file system.
  Otherwise, an unpacker's output, which should be a buffer.
* `path`: Same as the first argument. The path to the file to read,
  or from which `data` has been read.
  The path may be absolute or relative, direct or indirect, whatever.
* `fexts`: An array of the file name extension(s) that caused choosing
  this reader.
* `basepath`: Like `path` but without the `fexts` and (if any) their dots.
  Can be used to easily find auxiliary companion files,
  e.g. if your `pic.jpeg` should have a description in `pic.txt`.






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
