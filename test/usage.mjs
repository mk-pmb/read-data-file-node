// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import equal from 'equal-pmb';
import absdir from 'absdir';

// ¦mjsUsageDemo¦+
import readDataFile from '..';
import nativeCats from './cats.json';
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
async function verifyOneFixture(filename, customRdf) {
  const data = await (customRdf || readDataFile)(addTestDirPath(filename));
  equal(data, nativeCats);
  console.log('+OK correct data for', filename);
}

async function verifyAllFixtures() {
  await verifyOneFixture('cats.json');

  await verifyOneFixture('cats.ceson');
  await verifyOneFixture('cats.ini');
  await verifyOneFixture('cats.json.gz');
  await verifyOneFixture('cats.json5');
  await verifyOneFixture('cats.toml');
  await verifyOneFixture('cats.yaml.gz');
  await verifyOneFixture('cats.yaml');
  await verifyOneFixture('cats.yml');

  const noIni = readDataFile.cfg({ parsersByFext: { ini: false } });
  await shouldReject(verifyOneFixture('cats.ini', noIni)).then((rej) => {
    equal(rej.name, 'ReadDataFileUnsupportedFext');
    console.log('+OK ini parser disabled');
  });
}
// ¦mjsUsageDemo¦-





verifyAllFixtures().then(() => console.info('+OK usage test passed.'));
