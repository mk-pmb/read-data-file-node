// -*- coding: utf-8, tab-width: 2 -*-

import pathLib from 'path';

import getOwn from 'getown';
import ifFun from 'if-fun';
import isStr from 'is-string';
import mapObj from 'map-assoc-core';
import mergeOpts from 'merge-options';
import promisedFs from 'nofs';
import stripBom from 'strip-bom';

import cesonParser from 'ceson/parse.js';
import iniLib from 'ini';
import json5Lib from 'json5';
import jsonParser from 'json-parse-pmb';
import tomlLib from 'toml';
import yamlSafeLoad from 'safeload-yaml-pmb';


function makeReaderFunc() {
  const f = function readDataFile(path) { return f.readFile(path); };
  return f;
}


function dlookup(dict, key) {
  let val = getOwn(dict, key);
  if (isStr(val)) { val = getOwn(dict, val); }
  return val;
}


function identity(x) { return x; }


const defaultImpl = {

  // #BEGIN# default opts
  parsersByFext: {
    ceson: cesonParser,
    ini(data) { return iniLib.parse(data); },
    json: jsonParser,
    json5(data) { return json5Lib.parse(data); },
    toml(data) { return tomlLib.parse(data); },
    yaml(data) { return yamlSafeLoad(data); },
    yml: 'yaml',
  },

  readersByFext: {
    // qar(path) { return this.readFile(path + '.meta.json'); },
  },
  // #ENDOF# default opts

  methods: {

    cfg(how) {
      const parent = this;
      const custom = makeReaderFunc();
      Object.assign(custom, mergeOpts({ ...parent }, { ...how }));
      Object.assign(custom, mapObj(custom.methods, f => f.bind(custom)));
      return custom;
    },

    parseFilenameDotParts(path, opt) {
      const fmtOvr = opt.format;
      if (fmtOvr) { return fmtOvr.split(/\./).reverse(); }
      if (fmtOvr === undefined) {
        const m = /^<fmt=([\w\.]+)>(?=[\S\s])/.exec(path);
        if (m) {
          const dp = m[1].split(/\./).reverse();
          dp.realPath = path.slice(m[0].length);
          return dp;
        }
      }
      const basename = pathLib.parse(path).base;
      return basename.split(/\./).slice(1).reverse();
    },

    findBestReaderAndParser(pathDotParts) {
      const { readersByFext, parsersByFext } = this;
      // ^-- e.g. cats.json.rot13.gz -> [gz, rot13, json]
      let fext;
      let reader;
      let parser;
      pathDotParts.forEach(function lookup(dotPart) {
        fext = dotPart + (fext ? '.' + fext : '');
        if (reader === undefined) { reader = dlookup(readersByFext, fext); }
        if (parser === undefined) { parser = dlookup(parsersByFext, fext); }
      });
      if (reader || parser) { return { reader, parser }; }
      return false;
    },

    async defaultReader(path) {
      const text = stripBom(await promisedFs.readFile(path,
        { encoding: 'UTF-8' }));
      return text;
    },

    unsupportedFext(path) {
      const err = new Error("No reader or parser configured for this file's"
        + ' filename extension: ' + path);
      err.name = 'ReadDataFileUnsupportedFext';
      err.path = path;
      throw err;
    },

    async readFile(path, origOpt) {
      const opt = { ...origOpt };
      const dotParts = this.parseFilenameDotParts(path, opt);
      const realPath = (dotParts.realPath || path);
      const rop = this.findBestReaderAndParser(dotParts);
      if (!rop) { return this.unsupportedFext(realPath); }
      const { reader, parser } = rop;
      const content = await ifFun(reader, this.defaultReader)(realPath);
      const data = await ifFun(parser, identity)(content);
      return data;
    },

  },

};


const rdf = defaultImpl.methods.cfg.call(defaultImpl);
export default rdf;
