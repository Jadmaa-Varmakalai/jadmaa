import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9229;
const TMP_PROFILE = path.join(process.env.TEMP || 'C:\\Temp', 'chrome-cdp-profile');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function capture() {
  console.log('Launching headless Chrome...');
  const proc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    `--user-data-dir=${TMP_PROFILE}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check'
  ], { stdio: 'ignore' });

  try {
    let wsUrl = null;
    for (let i = 0; i < 20; i++) {
      await sleep(500);
      try {
        const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
        if (res.ok) {
          const data = await res.json();
          wsUrl = data.webSocketDebuggerUrl;
          if (wsUrl) break;
        }
      } catch (e) {}
    }

    if (!wsUrl) throw new Error('Could not connect to Chrome DevTools port');
    console.log('Connected to Chrome DevTools WebSocket:', wsUrl);

    async function takeScreenshot({ url, width, height, mobile, outputPath, waitMs = 4000, scrollY = 0 }) {
      console.log(`Taking screenshot of ${url} at ${width}x${height} (mobile=${mobile})...`);
      const ws = new WebSocket(wsUrl);
      let id = 1;
      const callbacks = new Map();

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && callbacks.has(msg.id)) {
          const { resolve, reject } = callbacks.get(msg.id);
          callbacks.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
      };

      await new Promise((res, rej) => {
        ws.onopen = res;
        ws.onerror = rej;
      });

      function send(method, params = {}, sessionId = undefined) {
        return new Promise((resolve, reject) => {
          const reqId = id++;
          callbacks.set(reqId, { resolve, reject });
          const payload = { id: reqId, method, params };
          if (sessionId) payload.sessionId = sessionId;
          ws.send(JSON.stringify(payload));
        });
      }

      console.log('Creating target...');
      const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

      console.log('Setting device metrics...');
      await send('Page.enable', {}, sessionId);
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 2,
        mobile: !!mobile
      }, sessionId);

      if (mobile) {
        await send('Emulation.setUserAgentOverride', {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        }, sessionId);
      }

      console.log('Navigating to', url);
      await send('Page.navigate', { url }, sessionId);
      await sleep(waitMs);

      if (scrollY > 0) {
        await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${scrollY})` }, sessionId);
        await sleep(1000);
      }

      console.log('Capturing screenshot...');
      const { data } = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
      fs.writeFileSync(outputPath, Buffer.from(data, 'base64'));
      console.log(`Saved screenshot to ${outputPath} (${fs.statSync(outputPath).size} bytes)`);

      await send('Target.closeTarget', { targetId });
      ws.close();
    }

    const outDir = 'C:\\Users\\PRASANNA\\.gemini\\antigravity\\brain\\421b4e89-9bc8-4713-b503-6aca4fd0bbac';
    
    // 1. Mobile Home (390 x 844)
    await takeScreenshot({
      url: 'https://jadmaa.com',
      width: 390,
      height: 844,
      mobile: true,
      outputPath: path.join(outDir, 'verified_mobile_home.png'),
      waitMs: 4000
    });

    // 2. Desktop About (1280 x 800)
    await takeScreenshot({
      url: 'https://jadmaa.com/about',
      width: 1280,
      height: 900,
      mobile: false,
      outputPath: path.join(outDir, 'verified_desktop_about.png'),
      waitMs: 4000
    });

    // 3. Mobile Desktop Mode About (980 x 844)
    await takeScreenshot({
      url: 'https://jadmaa.com/about',
      width: 980,
      height: 900,
      mobile: false,
      outputPath: path.join(outDir, 'verified_mobile_desktop_about.png'),
      waitMs: 4000
    });

    // 4. Mobile Desktop Mode About Wellness (980 x 844, scrolled down)
    await takeScreenshot({
      url: 'https://jadmaa.com/about',
      width: 980,
      height: 900,
      mobile: false,
      outputPath: path.join(outDir, 'verified_mobile_desktop_wellness.png'),
      waitMs: 4000,
      scrollY: 1800
    });

    console.log('All screenshots captured successfully!');
  } finally {
    proc.kill();
  }
}

capture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
