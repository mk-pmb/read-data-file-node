// -*- coding: utf-8, tab-width: 2 -*-

import util from './util.mjs';

import blobParsersByFext from './blobParsersByFext.mjs';
import readersByFext from './readersByFext.mjs';
import textParsersByFext from './textParsersByFext.mjs';
import unpackersByFext from './unpackersByFext.mjs';


const defaultOpts = {

  minBaseParts: 1,
  maxFextParts: 2,

  readersByFext,
  unpackersByFext,
  blobParsersByFext,
  textParsersByFext,

  defaultReader: util.readUtf8Text,
  defaultTextEncoding: 'UTF-8',

};

export default defaultOpts;
