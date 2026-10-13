const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, 'story.js'), 'utf8');
const start = source.indexOf('    const clamp =');
const end = source.indexOf('    let width =', start);
const model = vm.runInNewContext(`${source.slice(start, end)}; ({ cargoAt, truckPositions, cranePose })`);

test('both trucks exist and remain stationary during loading and waiting', () => {
  for (const p of [0, .045, .13, .18, .21]) assert.equal(model.truckPositions(p).origin, 500);
  for (const p of [.39, .42, .5, .8, 1]) assert.equal(model.truckPositions(p).origin, 1700);
  for (const p of [0, .62, .79, .8, .81, .89, .92]) assert.equal(model.truckPositions(p).destination, 4030);
  assert.match(source, /wheel\(x \+ dx, 471, \(x - startX\) \/ 18\)/);
  assert.doesNotMatch(source, /p \* 130/);
});
test('all crane handoffs retain position and retract continuously', () => {
  for (const [a, b, c] of [[0,.18,.215],[.42,.59,.615],[.81,.92,.938],[.955,1,1.01]]) {
    for (const p of [a,b,c]) {
      const left = model.cranePose(p-1e-7,a,b,c), right = model.cranePose(p+1e-7,a,b,c);
      assert.ok(Math.hypot(left.x-right.x,left.y-right.y)<.01, `jump at ${p}`);
    }
    assert.equal(model.cranePose(c,a,b,c).x, model.cargoAt(b).x);
    assert.equal(model.cranePose(c,a,b,c).y, model.cargoAt(b).y-85);
  }
});
test('cargo stays on trailers while driving', () => {
  for(let p=.22;p<=.39;p+=.001) assert.equal(model.cargoAt(p).x,model.truckPositions(p).origin);
  for(let p=.92;p<=.955;p+=.0001) assert.equal(model.cargoAt(p).x,model.truckPositions(p).destination);
});
test('final unloading clears cab before truck leaves and before lateral transfer', () => {
  for(let p=.955;p<=1;p+=.00005) {
    const cargo=model.cargoAt(p), truck=model.truckPositions(p).destination;
    const overlapX=cargo.x+205>truck+220 && cargo.x<truck+302;
    const overlapY=cargo.y+90>382 && cargo.y-12<463;
    assert.ok(!(overlapX&&overlapY), `cab intersects cargo at ${p}`);
  }
  assert.equal(model.cargoAt(1).y+90,475);
  assert.ok(model.truckPositions(1).destination>model.cargoAt(1).x+205);
});
test('reverse scrubbing yields identical deterministic states', () => {
  const samples=Array.from({length:1001},(_,i)=>i/1000);
  const expected=samples.map(p=>JSON.stringify([model.cargoAt(p),model.truckPositions(p),model.cranePose(p,.42,.59,.615)]));
  samples.reverse().forEach(p=>assert.equal(JSON.stringify([model.cargoAt(p),model.truckPositions(p),model.cranePose(p,.42,.59,.615)]),expected[Math.round(p*1000)]));
});
