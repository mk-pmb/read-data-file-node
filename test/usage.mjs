// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import absdir from 'absdir';
import equal from 'equal-pmb';
import pEachSeries from 'p-each-series';
import promisedFs from 'nofs';
import vTry from 'vtry';

// ¦mjsUsageDemo¦+
import readDataFile from '../rdf.mjs';
import nativeCats from './cats.json';
// ¦mjsUsageDemo¦- importPkgName

const testDirPath = absdir(import.meta, '.');

function testDirGlob(pat) {
  return promisedFs.glob(pat, { cwd: testDirPath('.') });
}

async function shouldReject(pr) {
  try {
    await pr;
    return false;
  } catch (err) {
    return err;
  }
}


const brokenFexts = [
  '.yaml.gz.base64.txt',
  '.yml',
];


// ¦mjsUsageDemo¦+
function verifyOneFixture(filename) {
  const broken = brokenFexts.reduce(function check(yes, fext) {
    if (yes) { return yes; }
    if (filename.endsWith(fext)) { return fext; }
    return false;
  }, false);
  if (broken) {
    return console.warn('W: skip:', { brokenFext: broken, filename });
  }

  let want = nativeCats;
  if (filename.endsWith('.ndjson')) {
    want = Object.keys(want).sort().map(k => ({ name: k, ...want[k] }));
  }

  const customRdf = null;
  const testDescr = `Verify ${filename} with ${(customRdf || false).name
    || 'default'} read function`;
  async function runTest() {
    const readerFunc = (customRdf || readDataFile);
    const data = await readerFunc(testDirPath(filename));
    equal(data, want);
    console.log('+OK correct data for', filename);
  }
  return vTry.pr(runTest, testDescr)();
}

async function verifyAllFixtures() {
  const allCatsFiles = await testDirGlob('cats.*');
  equal(allCatsFiles.length, 11);
  await pEachSeries(allCatsFiles.sort(), verifyOneFixture);

  const noIni = readDataFile.cfg({ textParsersByFext: { ini: false } });
  await shouldReject(
    verifyOneFixture('cats.iniX', noIni)
  ).then((rej) => {
    console.debug('noIni rej:', rej);
    console.warn('W: ignoring noIni test');
    // equal(rej.name, 'ReadDataFileUnsupportedFext');
    // console.log('+OK ini parser disabled');
  });
}
// ¦mjsUsageDemo¦-





verifyAllFixtures().then(() => console.info('+OK usage test passed.'));
