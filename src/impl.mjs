// -*- coding: utf-8, tab-width: 2 -*-

import opts from './opts.mjs';
import util from './util.mjs';
import methods from './mthd.mjs';

const defaultImpl = {
  ...opts,
  util,
  methods,
};

export default defaultImpl;
