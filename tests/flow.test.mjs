import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {detectBoard} from '../detector.js';
import {solve} from '../solver.js';
const require=createRequire(import.meta.url);
const {PNG}=require('pngjs');
const {chromium}=require('playwright');
const fixtures=['IMG_4186.png','second_level.png'];
for(const fixture of fixtures) test(`extract and solve ${fixture}`,()=>{
  const board=detectBoard(PNG.sync.read(readFileSync(new URL(`../screenshots/${fixture}`,import.meta.url))));
  assert.equal(board.size,8);assert.equal(board.palette.length,8);
  const result=solve(board.colors);assert.ok(result);
  assert.equal(new Set(result).size,8);
  assert.equal(new Set(result.map((c,r)=>board.colors[r][c])).size,8);
  assert.ok(result.every((c,r)=>!r||Math.abs(c-result[r-1])>=2));
  if(fixture===fixtures[0])assert.deepEqual(result,[3,7,4,2,5,1,6,0]);
  console.log(fixture,result);
});
test('blank input is rejected',()=>assert.throws(()=>detectBoard({width:100,height:100,data:new Uint8ClampedArray(40000).fill(255)}),/Could not read/));
test('desktop and mobile viewport upload-to-overlay flow',async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  mkdirSync('test-results',{recursive:true});
  try {
    const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    for(const viewport of [{width:1280,height:1000},{width:390,height:844}]) {
      await page.setViewportSize(viewport);await page.goto('http://127.0.0.1:4173');
      assert.equal(await page.locator('#solve').isDisabled(),true);
      for(const fixture of fixtures) {
        await page.locator('#photo').setInputFiles(`screenshots/${fixture}`);
        await page.waitForFunction(()=>!document.querySelector('#solve').disabled);
        assert.equal(await page.locator('#preview').isVisible(),true);
        await page.locator('#solve').click();
        await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Solved'));
        const status=await page.locator('#status').innerText();assert.match(status,/Solved 8 × 8/);
        if(fixture===fixtures[0])assert.match(await page.locator('#preview').getAttribute('aria-label'),/4, 8, 5, 3, 6, 2, 7, 1/);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
        await page.screenshot({path:`test-results/${viewport.width}-${fixture}`,fullPage:true});
      }
      await page.locator('#photo').setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('not an image')});
      await page.waitForFunction(()=>document.querySelector('#status').classList.contains('error'));
      assert.equal(await page.locator('#solve').isDisabled(),true);
    }
    assert.deepEqual(errors,[]);
  }finally{await browser.close();}
});
