// -*- coding: utf-8, tab-width: 2 -*-

import pathLib from 'path';

import getOwn from 'getown';
import ifFun from 'if-fun';
import isStr from 'is-string';
import mapObj from 'map-assoc-core';
import mergeOpts from 'merge-options';
import promisedFs from 'nofs';
import stripBom from 'strip-bom';

import cesonParser from 'ceson/parse';
import iniLib from 'ini';
import json5Lib from 'json5';
import jsonParser from 'json-parse-pmb';
import tomlLib from 'toml';
import yamlLib from 'js-yaml';


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
    yaml(data) { return yamlLib.safeLoad(data); },
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

    findBestReaderAndParser(path) {
      const { readersByFext, parsersByFext } = this;
      const basename = pathLib.parse(path).base;
      const dotParts = basename.split(/\./).slice(1).reverse();
      // ^-- e.g. cats.json.rot13.gz -> [gz, rot13, json]
      let fext;
      let reader;
      let parser;
      dotParts.forEach(function lookup(dotPart) {
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

    async readFile(path) {
      const rop = this.findBestReaderAndParser(path);
      if (!rop) { return this.unsupportedFext(path); }
      const { reader, parser } = rop;
      const content = await ifFun(reader, this.defaultReader)(path);
      const data = await ifFun(parser, identity)(content);
      return data;
    },

  },

};


const rdf = defaultImpl.methods.cfg.call(defaultImpl);
export default rdf;
