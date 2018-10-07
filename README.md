
<!--#echo json="package.json" key="name" underline="=" -->
read-data-file
==============
<!--/#echo -->

<!--#echo json="package.json" key="description" -->
Alias for require(&#39;fs-read-data&#39;).readFile, which promises to read and
parse one data file (json, js, yaml, ini, toml).
<!--/#echo -->


… because that neat function should really be available with just
one simple `import` statement.
Its docs claim it would be that easy, so [maybe it's just a bug][maybe-bug]
and this package might become obsolete soon.




&nbsp;

  [maybe-bug]: https://github.com/tufan-io/fs-read-data/issues/1

License
-------
<!--#echo json="package.json" key=".license" -->
ISC
<!--/#echo -->
