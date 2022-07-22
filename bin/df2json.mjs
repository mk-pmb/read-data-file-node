#!/usr/bin/env node
// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

import pEachSeries from 'p-each-series';

import readDataFile from '../rdf.mjs';

pEachSeries(process.argv.slice(2), async function repack(arg) {
  const data = await readDataFile(arg);
  console.log(JSON.stringify(data, null, 2));
});
