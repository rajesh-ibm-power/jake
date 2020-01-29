let assert = require('assert');
let fs = require('fs');
let exec = require('child_process').execSync;
let utils = require('utilities');

let cleanUpAndNext = function (callback) {
  utils.file.rmRf('./foo', {
    silent: true
  });
  callback && callback();
};

suite('fileTask', function () {
  this.timeout(7000);

  setup(function (next) {
    process.chdir('./test');
    cleanUpAndNext(next);
  });

  teardown(function () {
    process.chdir('../');
  });

  test('where a file-task prereq does not change with --always-make', function () {
    let out;
    out = exec('./node_modules/.bin/jake -q fileTest:foo/from-src1.txt').toString().trim();
    assert.equal('fileTest:foo/src1.txt task\nfileTest:foo/from-src1.txt task',
      out);
    out = exec('./node_modules/.bin/jake -q -B fileTest:foo/from-src1.txt').toString().trim();
    assert.equal('fileTest:foo/src1.txt task\nfileTest:foo/from-src1.txt task',
      out);
    cleanUpAndNext();
  });

  test('concating two files', function () {
    let out;
    out = exec('./node_modules/.bin/jake -q fileTest:foo/concat.txt').toString().trim();
    assert.equal('fileTest:foo/src1.txt task\ndefault task\nfileTest:foo/src2.txt task\n' +
          'fileTest:foo/concat.txt task', out);
    // Check to see the two files got concat'd
    let data = fs.readFileSync(process.cwd() + '/foo/concat.txt');
    assert.equal('src1src2', data.toString());
    cleanUpAndNext();
  });

  test('where a file-task prereq does not change', function () {
    let out;
    out = exec('./node_modules/.bin/jake -q fileTest:foo/from-src1.txt').toString().trim();
    assert.equal('fileTest:foo/src1.txt task\nfileTest:foo/from-src1.txt task', out);
    out = exec('./node_modules/.bin/jake -q fileTest:foo/from-src1.txt').toString().trim();
    // Second time should be a no-op
    assert.equal('', out);
    cleanUpAndNext();
  });

  test('where a file-task prereq does change', function (next) {
    exec('mkdir -p ./foo');
    exec('touch ./foo/from-src1.txt');
    setTimeout(() => {
      fs.writeFileSync('./foo/src1.txt', '-SRC');
      let out = exec('./node_modules/.bin/jake -q fileTest:foo/from-src1.txt').toString().trim();
      assert.equal('fileTest:foo/from-src1.txt task', out);
      cleanUpAndNext(next);
    }, 1000);
  });

  test('a preexisting file', function () {
    let prereqData = 'howdy';
    exec('mkdir -p ./foo');
    fs.writeFileSync('foo/prereq.txt', prereqData);
    let out;
    out =exec('./node_modules/.bin/jake -q fileTest:foo/from-prereq.txt').toString().trim();
    assert.equal('fileTest:foo/from-prereq.txt task', out);
    let data = fs.readFileSync(process.cwd() + '/foo/from-prereq.txt');
    assert.equal(prereqData, data.toString());
    out = exec('./node_modules/.bin/jake -q fileTest:foo/from-prereq.txt').toString().trim();
    // Second time should be a no-op
    assert.equal('', out);
    cleanUpAndNext();
  });

  test('a preexisting file with --always-make flag', function () {
    let prereqData = 'howdy';
    exec('mkdir -p ./foo');
    fs.writeFileSync('foo/prereq.txt', prereqData);
    let out;
    out = exec('./node_modules/.bin/jake -q fileTest:foo/from-prereq.txt').toString().trim();
    assert.equal('fileTest:foo/from-prereq.txt task', out);
    let data = fs.readFileSync(process.cwd() + '/foo/from-prereq.txt');
    assert.equal(prereqData, data.toString());
    out = exec('./node_modules/.bin/jake -q -B fileTest:foo/from-prereq.txt').toString().trim();
    assert.equal('fileTest:foo/from-prereq.txt task', out);
    cleanUpAndNext();
  });

  test('nested directory-task', function () {
    exec('./node_modules/.bin/jake -q fileTest:foo/bar/baz/bamf.txt');
    let data = fs.readFileSync(process.cwd() + '/foo/bar/baz/bamf.txt');
    assert.equal('w00t', data);
    cleanUpAndNext();
  });

});

