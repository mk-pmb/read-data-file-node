// -*- coding: utf-8, tab-width: 2 -*-

import util from './util.mjs';

const unpackersByFext = {
  base64(x) { return Buffer.from(String(x), 'base64'); },
  gz: util.readGzipFile,
};

export default unpackersByFext;
