// -*- coding: utf-8, tab-width: 2 -*-

// Parser stuff
import cesonParser from 'ceson/parse.js';
import iniLib from 'ini';
import json5Lib from 'json5';
import tomlLib from 'toml';
import yamlLib from 'js-yaml';

const textParsersByFext = {
  ceson(tx) { return cesonParser(tx, { synErr: true }); },
  ini(tx) { return iniLib.parse(tx); },
  json: JSON.parse,
  json5(tx) { return json5Lib.parse(tx); },
  jsonl: 'ndjson',
  ldjson: 'ndjson',
  ndjson(data) { return data.split(/\n/).filter(Boolean).map(JSON.parse); },
  toml(tx) { return tomlLib.parse(tx); },
  yaml(tx) { return yamlLib.safeLoad(tx); },
  yml: 'yaml',
};

export default textParsersByFext;
