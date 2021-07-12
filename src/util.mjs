// -*- coding: utf-8, tab-width: 2 -*-

import dictLookupKeySuffixParts from 'dict-lookup-key-suffix-parts-200120-pmb';
import isFunc from 'is-fn';
import promisify from 'pify';

// Reader stuff
import promisedFs from 'nofs';
import unbom from 'unbom';
import zlib from 'zlib';


const gzipMagicNumber = '\x1F\x8B';


function addIf(x, a) { return (x && (x + a)); }


function dictLookupDotParts(dict, parts) {
  return dictLookupKeySuffixParts(dict, parts, { glue: '.' });
}


const util = {

  dictLookupDotParts,

  errUnsupportedFext(path) {
    const err = new Error("No reader or parser configured for this file's"
      + ' filename extension: ' + path);
    err.name = 'ReadDataFileUnsupportedFext';
    err.filename = path;
    throw err;
  },

  bufferStartsWith(bufHas, binstrExpected) {
    const actual = bufHas.slice(0, binstrExpected.length).toString('binary');
    return (actual === binstrExpected);
  },

  calcFextChopLen(fexts) { return addIf(fexts.join('.').length, 1); },
  gunzipPr: promisify(zlib.gunzip),
  readBlob(path) { return (this.data || promisedFs.readFile(path)); },

  async readGzipFile(path) {
    const data = (this.data || await util.readBlob.call(this, path));
    if (util.bufferStartsWith(data, gzipMagicNumber)) {
      return util.gunzipPr(data);
    }
    throw new Error("Input data doesn't look like it's gzipped.");
  },

  async readUtf8Text(path) {
    const data = (this.data || await util.readBlob.call(this, path));
    return unbom(data).toString('UTF-8');
  },

  autoDecodeText(blob, rdf) {
    let enc = rdf.defaultTextEncoding;
    const unBOMed = unbom(blob);
    if (unBOMed.length < blob.length) { enc = 'UTF-8'; }
    return unBOMed.toString(enc);
  },

  wrapTextParser(func, fext, rdf) {
    if (!isFunc(func)) {
      const err = new TypeError('Cannot wrap non-function for fext "' + fext
        + '": ' + String(func));
      err.name = 'NON_FUNC_TEXT_PARSER';
      err.fext = fext;
      throw err;
    }
    function wrap(blob) {
      // console.debug('wrapped text parser', fext, '<<', blob);
      const text = util.autoDecodeText(blob, rdf);
      const data = wrap.impl.call(this, text);
      // console.debug('wrapped text parser', fext, '>>', data);
      return data;
    }
    wrap.impl = func;
    wrap.fext = fext;
    return wrap;
  },

  findUnpackers(unpackersByFext, origDotParts) {
    let cdp = origDotParts;
    let nPackerFexts = 0;
    const unp = [];
    while (cdp.length > 0) {
      const match = dictLookupDotParts(unpackersByFext, cdp);
      const func = match.val;
      if (!isFunc(func)) { break; }
      nPackerFexts += match.nUsed;
      const { nSkip } = match;
      cdp = cdp.slice(0, nSkip);
      const ctxSeed = {
        func,
        fexts: origDotParts.slice(nSkip),
      };
      unp.push(ctxSeed);
    }
    Object.assign(unp, {
      nPackerFexts,
      contentDotParts: cdp,
    });
    return unp;
  },

};


export default util;
