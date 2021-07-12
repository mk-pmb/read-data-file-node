// -*- coding: utf-8, tab-width: 2 -*-

import pathLib from 'path';

import getOwn from 'getown';
import isFunc from 'is-fn';
import mapObj from 'map-assoc-core';
import mergeOpts from 'merge-options';
import pEachSeries from 'p-each-series';
import vTry from 'vtry';

import util from './util.mjs';


function makeReaderFunc() {
  const f = function readDataFile(path) { return f.readFile(path); };
  return f;
}


function augmentReaderCtx(ctx) {
  // console.debug('augmentReaderCtx:', ctx);
  const { path, fexts } = ctx;
  let basepath = path;
  if (fexts) {
    fexts.glued = fexts.join('.');
    if (fexts.glued) {
      const fextsLen = fexts.glued.length + 1;
      basepath = path.slice(-fextsLen);
    }
  }
  return { ...ctx, basepath };
}


function explainFextMatch(m) {
  if (!m) { return 'default'; }
  if (m.key) { return '.' + m.key; }
  return 'fallback';
}


const methods = {

  cfg(how) {
    const parent = this;
    const custom = makeReaderFunc();
    Object.assign(custom, mergeOpts({ ...parent }, { ...how }));
    Object.assign(custom, mapObj(custom.methods, f => f.bind(custom)));
    return custom;
  },

  splitFexts(path) {
    // e.g. cats.json.rot13.gz -> [gz, rot13, json]
    const basename = pathLib.parse(path).base;
    if (!basename) { return []; }
    let fexts = basename;
    let { minBaseParts } = this;
    if (minBaseParts >= 1) {
      // Ensure that chunk #1 won't be empty.
      fexts = fexts.replace(/^\.+/, '');
    } else {
      // With no minimum amount of base parts, chunk #1 can never be
      // considered an extension because it never has a dot in front
      // of it. (Because that dot would belong to the first extension.)
      minBaseParts = 1;
    }
    fexts = fexts.split(/\./).slice(minBaseParts).slice(-this.maxFextParts);
    const chopLen = util.calcFextChopLen(fexts);
    fexts.basename = basename.slice(-chopLen);
    fexts.basepath = path.slice(-chopLen);
    return fexts;
  },


  findDataFlowSteps(path) {
    // console.debug('findDataFlowSteps()', path);
    const rdf = this;
    const allDotParts = rdf.splitFexts(path);
    const unpackers = util.findUnpackers(rdf.unpackersByFext, allDotParts);
    const { contentDotParts } = unpackers;

    const handlers = {};
    let isDataFile = false;

    function findHandler(role, dict) {
      const match = util.dictLookupDotParts(dict, contentDotParts);
      // console.debug('findHandler:', contentDotParts, dict, '->', match);
      if (isFunc(match.val)) {
        handlers[role] = match;
        isDataFile = true;
      } else {
        handlers[role] = false;
      }
    }
    findHandler('reader', rdf.readersByFext);
    findHandler('parser', rdf.mergeParsersByFext());
    if (!isDataFile) { return false; }

    const steps = { unpackers, ...handlers };
    return steps;
  },


  mergeParsersByFext() {
    const rdf = this;
    const merged = { ...rdf.blobParsersByFext };
    const dupeErrMsg = ('Name conflict between blob parser and text parser '
      + 'for filename extension ');
    mapObj(rdf.textParsersByFext, function tp(spec, fext) {
      const conflict = getOwn(merged, fext);
      if (conflict === spec) { return; }
      if (conflict !== undefined) {
        const err = new Error(dupeErrMsg + fext);
        err.name = 'MERGE_PARSERS_DUPE_FEXT';
        err.fext = fext;
        throw err;
      }
      if (isFunc(spec)) {
        merged[fext] = util.wrapTextParser(spec, fext, rdf);
      } else {
        merged[fext] = spec;
      }
      // console.debug('mergedTextParser:', fext);
    });
    return merged;
  },


  async readFile(path) {
    const rdf = this;
    const steps = this.findDataFlowSteps(path);
    // console.debug('findDataFlowSteps result:', path, 'steps =', steps);
    if (!steps) {
      const err = new Error('Cannot figure out how to read ' + path);
      err.inputFile = path;
      throw err;
    }

    const readerMatch = steps.reader;
    const readerFailMsg = `Read data from file "${path}" using ${
      explainFextMatch(readerMatch)} reader`;
    const readerFunc = (readerMatch.val || util.readBlob);
    const readerCtx = augmentReaderCtx({
      rdf,
      func: readerFunc,
      data: undefined,  // reader shall read from file system.
      path,
      fexts: readerMatch.partsUsed,
    });

    let data = await vTry.pr(readerFunc.bind(readerCtx),
      readerFailMsg)(path);

    async function delegatedUnpack(unpacker) {
      const unpackerFailMsg = `Unpack data from file "${path}" using ${
        explainFextMatch(unpacker)} unpacker`;
      const { func } = unpacker;
      const unpkCtx = {
        ...readerCtx,
        data,
        func,
      };
      // console.debug('unpack', unpacker.fexts, '<<', data);
      const unp = await vTry.pr(func.bind(unpkCtx), unpackerFailMsg)(path);
      // console.debug('unpack', unpacker.fexts, '>>', unp);
      if (unp !== undefined) { data = unp; }
    }
    await pEachSeries(steps.unpackers, delegatedUnpack);

    if (steps.parser) {
      const parserFailMsg = `Parse data from file "${path}" using ${
        explainFextMatch(steps.parser)} parser`;
      data = await vTry.pr(steps.parser.val, parserFailMsg)(data);
    }

    return data;
  },

};


export default methods;
