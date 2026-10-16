// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import equal from 'equal-pmb';
import absdir from 'absdir';

// ¦mjsUsageDemo¦+
import readDataFile from '../rdf.mjs';
import nativeCats from './cats.json' with { type: 'json' };
// ¦mjsUsageDemo¦- importPkgName

const addTestDirPath = absdir(import.meta, '.');

async function shouldReject(pr) {
  try {
    await pr;
    return false;
  } catch (err) {
    return err;
  }
}


// ¦mjsUsageDemo¦+
function toNativeObjects(x) { return JSON.parse(JSON.stringify(x)); }

async function verifyOneFixture(expected, filename, customRdf) {
  const data = await (customRdf || readDataFile)(addTestDirPath(filename));
  equal.named(filename, () => equal(toNativeObjects(data), expected));
  console.log('+OK correct data for', filename);
}

function dictToList(keyKey, dict) {
  return Object.keys(dict).sort().map(k => ({ [keyKey]: k, ...dict[k] }));
}

async function verifyAllFixtures() {
  const verifyCatsDict = verifyOneFixture.bind(null, nativeCats);
  await verifyCatsDict('cats.json');

  await verifyCatsDict('cats.ceson');
  await verifyCatsDict('cats.ini');
  await verifyCatsDict('cats.json.gz');
  await verifyCatsDict('cats.json5');
  await verifyCatsDict('cats.toml');
  await verifyCatsDict('cats.yaml.gz');
  await verifyCatsDict('cats.yaml');
  await verifyCatsDict('cats.yml');

  const verifyCatsList = verifyOneFixture.bind(null,
    dictToList('name', nativeCats));
  await verifyCatsList('cats.jsonl');
  await verifyCatsList('cats.ndjson');

  const noIni = readDataFile.cfg({ parsersByFext: { ini: false } });
  await shouldReject(verifyCatsDict('cats.ini', noIni)).then((rej) => {
    equal.named('noIni', () => equal(rej.name, 'ReadDataFileUnsupportedFext'));
    console.log('+OK ini parser disabled');
  });
}
// ¦mjsUsageDemo¦-





verifyAllFixtures().then(() => console.info('+OK usage test passed.'));
