const { app, BrowserWindow, ipcMain, Menu, globalShortcut, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http  = require('http');

// ── Auto-update config ────────────────────────────────────────────────────────
// Set these to your GitHub username and repository name.
const GITHUB_OWNER = 'nisaChampagne';
const GITHUB_REPO  = 'artificial-realms';

function semverGt(a, b) {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return true;
    if ((pa[i] || 0) < (pb[i] || 0)) return false;
  }
  return false;
}

// App version
ipcMain.handle('app:version', () => app.getVersion());

// Handle Squirrel events on Windows
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 750,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    frame: false,
    backgroundColor: '#0a0a0f',
    titleBarStyle: 'hidden',
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
}

app.whenReady().then(() => {
  // Restore clipboard shortcuts that are lost with frame: false
  const menu = Menu.buildFromTemplate([
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);

  createWindow();

  globalShortcut.register('CommandOrControl+Shift+I', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.webContents.toggleDevTools();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── AI Chat ──────────────────────────────────────────────────────────────────
ipcMain.handle('ai:chat', async (_event, messages, apiKey, model, provider) => {
  const prov = provider || 'openai';
  if (prov === 'anthropic')  return _chatAnthropic(messages, apiKey, model);
  if (prov === 'gemini')     return _chatGemini(messages, apiKey, model);
  if (prov === 'ollama')     return _chatOllama(messages, model);
  return _chatOpenAI(messages, apiKey, model);
});

function _chatOpenAI(messages, apiKey, model) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: model || 'gpt-4o', messages, max_tokens: 1200, temperature: 0.85 });
    const headers = {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${apiKey}`,
      'Content-Length': Buffer.byteLength(body),
    };
    const req = https.request({ hostname: 'api.openai.com', path: '/v1/chat/completions', method: 'POST', headers }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            const msg = parsed.error.message || JSON.stringify(parsed.error);
            if (msg.includes('quota') || msg.includes('billing') || res.statusCode === 429)
              return reject('Quota / billing error. Add payment at: platform.openai.com/settings/billing');
            if (res.statusCode === 401) return reject('Invalid OpenAI key. Check Settings.');
            return reject(msg);
          }
          resolve(parsed.choices[0].message.content);
        } catch { reject('Failed to parse OpenAI response'); }
      });
    });
    req.on('error', err => reject(err.message));
    req.write(body); req.end();
  });
}

function _chatAnthropic(messages, apiKey, model) {
  return new Promise((resolve, reject) => {
    const sysMsg = messages.find(m => m.role === 'system');
    const convo  = messages.filter(m => m.role !== 'system');
    const payload = {
      model:      model || 'claude-sonnet-4-5',
      max_tokens: 1200,
      system:     sysMsg?.content || '',
      messages:   convo,
      temperature: 0.85,
    };
    const body = JSON.stringify(payload);
    const headers = {
      'Content-Type':    'application/json',
      'x-api-key':       apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Length':  Buffer.byteLength(body),
    };
    const req = https.request({ hostname: 'api.anthropic.com', path: '/v1/messages', method: 'POST', headers }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            if (res.statusCode === 401) return reject('Invalid Anthropic key. Check Settings.');
            if (res.statusCode === 429) return reject('Anthropic rate limit reached. Try again shortly.');
            return reject(parsed.error.message || JSON.stringify(parsed.error));
          }
          resolve(parsed.content?.[0]?.text || '');
        } catch { reject('Failed to parse Anthropic response'); }
      });
    });
    req.on('error', err => reject(err.message));
    req.write(body); req.end();
  });
}

function _chatGemini(messages, apiKey, model) {
  return new Promise((resolve, reject) => {
    const sysMsg  = messages.find(m => m.role === 'system');
    const convo   = messages.filter(m => m.role !== 'system');
    const contents = convo.map(m => ({
      role:  m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const payload = {
      contents,
      ...(sysMsg ? { systemInstruction: { parts: [{ text: sysMsg.content }] } } : {}),
      generationConfig: { maxOutputTokens: 1200, temperature: 0.85 },
    };
    const body    = JSON.stringify(payload);
    const mdl     = model || 'gemini-2.0-flash';
    const apiPath = `/v1beta/models/${mdl}:generateContent`;
    const headers = { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey, 'Content-Length': Buffer.byteLength(body) };
    const req = https.request({ hostname: 'generativelanguage.googleapis.com', path: apiPath, method: 'POST', headers }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            if (res.statusCode === 401 || res.statusCode === 403) return reject('Invalid Gemini key. Check Settings.');
            if (res.statusCode === 429) return reject('Gemini rate limit reached. Try again shortly.');
            return reject(parsed.error.message || JSON.stringify(parsed.error));
          }
          resolve(parsed.candidates?.[0]?.content?.parts?.[0]?.text || '');
        } catch { reject('Failed to parse Gemini response'); }
      });
    });
    req.on('error', err => reject(err.message));
    req.write(body); req.end();
  });
}

function _chatOllama(messages, model) {
  return new Promise((resolve, reject) => {
    const payload = { model: model || 'llama3', messages, stream: false, options: { temperature: 0.85 } };
    const body    = JSON.stringify(payload);
    const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) };
    const req = http.request({ hostname: '127.0.0.1', port: 11434, path: '/api/chat', method: 'POST', headers }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(`Ollama error: ${parsed.error}`);
          resolve(parsed.message?.content || '');
        } catch { reject('Failed to parse Ollama response. Is Ollama running on port 11434?'); }
      });
    });
    req.on('error', () => reject('Cannot connect to Ollama. Make sure Ollama is running: https://ollama.ai'));
    req.write(body); req.end();
  });
}

// ── AI Image Generation (portrait) ───────────────────────────────────────────
ipcMain.handle('ai:image', async (_event, prompt, apiKey) => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model:           'dall-e-3',
      prompt,
      n:               1,
      size:            '1024x1024',
      response_format: 'url',
    });
    const headers = {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${apiKey}`,
      'Content-Length': Buffer.byteLength(body),
    };
    const req = https.request({ hostname: 'api.openai.com', path: '/v1/images/generations', method: 'POST', headers }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            if (res.statusCode === 401) return reject('Invalid OpenAI key for image generation.');
            if (res.statusCode === 429) return reject('Quota / billing error. Check platform.openai.com');
            return reject(parsed.error.message || JSON.stringify(parsed.error));
          }
          resolve(parsed.data?.[0]?.url || null);
        } catch { reject('Failed to parse image response'); }
      });
    });
    req.on('error', err => reject(err.message));
    req.write(body); req.end();
  });
});

// ── Save / Load ───────────────────────────────────────────────────────────────
const savesDir = () => path.join(app.getPath('userData'), 'saves');

function isValidSlot(slot) {
  return typeof slot === 'string' && /^[a-zA-Z0-9_-]+$/.test(slot);
}

ipcMain.handle('save:write', (_e, slot, data) => {
  if (!isValidSlot(slot)) throw new Error('Invalid save slot');
  const dir = savesDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `save_${slot}.json`), JSON.stringify(data, null, 2));
  return { success: true };
});

ipcMain.handle('save:read', (_e, slot) => {
  if (!isValidSlot(slot)) return null;
  const fp = path.join(savesDir(), `save_${slot}.json`);
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
});

ipcMain.handle('save:list', () => {
  const dir = savesDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.startsWith('save_') && f.endsWith('.json'))
    .map(f => {
      try {
        const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        return {
          slot: f.replace('save_', '').replace('.json', ''),
          character: d.character?.name || 'Unknown',
          level: d.character?.level || 1,
          class: d.character?.class || '',
          race: d.character?.race || '',
          savedAt: d.savedAt || 'Unknown',
          scene: d.currentScene || 'Unknown',
        };
      } catch { return null; }
    }).filter(Boolean);
});

ipcMain.handle('save:delete', (_e, slot) => {
  if (!isValidSlot(slot)) throw new Error('Invalid save slot');
  const fp = path.join(savesDir(), `save_${slot}.json`);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
  return { success: true };
});

// ── Settings ──────────────────────────────────────────────────────────────────
const settingsPath = () => path.join(app.getPath('userData'), 'settings.json');

// ── Provider connection test ─────────────────────────────────────────────────
ipcMain.handle('provider:ping', async (_e, provider, apiKey, model) => {
  if (provider === 'ollama') {
    return new Promise((resolve) => {
      const req = http.request(
        { hostname: '127.0.0.1', port: 11434, path: '/api/tags', method: 'GET' },
        (res) => {
          let data = '';
          res.on('data', c => { data += c; });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              const models = (parsed.models || []).map(m => m.name);
              const active = model ? models.some(n => n.startsWith(model)) : true;
              resolve({ ok: true, models, active, detail: active ? `${model} is ready` : `Model "${model}" not found. Available: ${models.slice(0,4).join(', ') || 'none'}` });
            } catch { resolve({ ok: false, error: 'Unexpected response from Ollama' }); }
          });
        }
      );
      req.on('error', () => resolve({ ok: false, error: 'Ollama not running on port 11434' }));
      req.setTimeout(3000, () => { req.destroy(); resolve({ ok: false, error: 'Connection timed out' }); });
      req.end();
    });
  }

  if (provider === 'openai') {
    return new Promise((resolve) => {
      const req = https.request(
        { hostname: 'api.openai.com', path: '/v1/models', method: 'GET',
          headers: { Authorization: `Bearer ${apiKey}` } },
        (res) => {
          let data = '';
          res.on('data', c => { data += c; });
          res.on('end', () => {
            if (res.statusCode === 200) return resolve({ ok: true, detail: 'OpenAI key is valid' });
            if (res.statusCode === 401) return resolve({ ok: false, error: 'Invalid API key' });
            if (res.statusCode === 429) return resolve({ ok: false, error: 'Rate limited / quota exceeded' });
            resolve({ ok: false, error: `HTTP ${res.statusCode}` });
          });
        }
      );
      req.on('error', err => resolve({ ok: false, error: err.message }));
      req.setTimeout(5000, () => { req.destroy(); resolve({ ok: false, error: 'Connection timed out' }); });
      req.end();
    });
  }

  if (provider === 'anthropic') {
    return new Promise((resolve) => {
      const body = JSON.stringify({ model: model || 'claude-haiku-3', max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] });
      const req = https.request(
        { hostname: 'api.anthropic.com', path: '/v1/messages', method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey,
            'anthropic-version': '2023-06-01', 'Content-Length': Buffer.byteLength(body) } },
        (res) => {
          let data = '';
          res.on('data', c => { data += c; });
          res.on('end', () => {
            if (res.statusCode === 400 || res.statusCode === 200) return resolve({ ok: true, detail: 'Anthropic key is valid' });
            if (res.statusCode === 401) return resolve({ ok: false, error: 'Invalid API key' });
            if (res.statusCode === 429) return resolve({ ok: false, error: 'Rate limited' });
            resolve({ ok: false, error: `HTTP ${res.statusCode}` });
          });
        }
      );
      req.on('error', err => resolve({ ok: false, error: err.message }));
      req.setTimeout(5000, () => { req.destroy(); resolve({ ok: false, error: 'Connection timed out' }); });
      req.write(body); req.end();
    });
  }

  if (provider === 'gemini') {
    return new Promise((resolve) => {
      const mdl  = model || 'gemini-2.0-flash';
      const path = `/v1beta/models/${mdl}`;
      const req = https.request(
        { hostname: 'generativelanguage.googleapis.com', path, method: 'GET', headers: { 'x-goog-api-key': apiKey } },
        (res) => {
          let data = '';
          res.on('data', c => { data += c; });
          res.on('end', () => {
            if (res.statusCode === 200) return resolve({ ok: true, detail: `Gemini key valid — ${mdl} available` });
            if (res.statusCode === 400) return resolve({ ok: true, detail: 'Gemini key is valid' });
            if (res.statusCode === 401 || res.statusCode === 403) return resolve({ ok: false, error: 'Invalid API key' });
            resolve({ ok: false, error: `HTTP ${res.statusCode}` });
          });
        }
      );
      req.on('error', err => resolve({ ok: false, error: err.message }));
      req.setTimeout(5000, () => { req.destroy(); resolve({ ok: false, error: 'Connection timed out' }); });
      req.end();
    });
  }

  return { ok: false, error: 'Unknown provider' };
});

ipcMain.handle('settings:get', () => {
  const fp = settingsPath();
  if (!fs.existsSync(fp)) return {};
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch { return {}; }
});

ipcMain.handle('settings:set', (_e, settings) => {
  fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2));
  return { success: true };
});

// ── Window Controls ───────────────────────────────────────────────────────────
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on('window:close', () => mainWindow?.close());

// ── Auto-Update ───────────────────────────────────────────────────────────────
ipcMain.handle('update:check', () => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path:     `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
      method:   'GET',
      headers:  { 'User-Agent': 'artificial-realms-updater' },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try {
          const release = JSON.parse(data);
          if (!release.tag_name) return resolve({ hasUpdate: false });
          const latest  = release.tag_name.replace(/^v/, '');
          const current = app.getVersion();
          if (!semverGt(latest, current)) return resolve({ hasUpdate: false });
          const assets  = Array.isArray(release.assets) ? release.assets : [];
          const exeAsset = assets.find(a => typeof a.name === 'string' && a.name.endsWith('.exe'));
          if (!exeAsset) return resolve({ hasUpdate: false });
          resolve({
            hasUpdate:       true,
            latestVersion:   latest,
            currentVersion:  current,
            exeDownloadUrl:  exeAsset.browser_download_url,
            releaseUrl:      release.html_url ||
                             `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
          });
        } catch { resolve({ hasUpdate: false }); }
      });
    });
    req.on('error', () => resolve({ hasUpdate: false }));
    req.end();
  });
});

ipcMain.handle('update:open-release', (_e, url) => {
  if (typeof url === 'string' && url.startsWith(`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/`)) {
    shell.openExternal(url);
  }
});

ipcMain.handle('update:download', (_e, url) => {
  return new Promise((resolve, reject) => {
    const os   = require('os');
    const dest = path.join(os.tmpdir(), 'ArtificialRealms-Update.exe');
    const file = fs.createWriteStream(dest);

    const doRequest = (requestUrl) => {
      const parsedUrl = new URL(requestUrl);
      if (parsedUrl.protocol !== 'https:') {
        file.close();
        return reject(new Error('Download URL must use HTTPS'));
      }
      const options = {
        hostname: parsedUrl.hostname,
        path:     parsedUrl.pathname + parsedUrl.search,
        method:   'GET',
        headers:  { 'User-Agent': 'artificial-realms-updater' },
      };
      const req = https.request(options, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          const location = res.headers.location || '';
          if (!location.startsWith('https://')) {
            file.close();
            return reject(new Error('Redirect to non-HTTPS blocked'));
          }
          return doRequest(location);
        }
        if (res.statusCode !== 200) {
          file.close();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const total = parseInt(res.headers['content-length'] || '0', 10);
        let received = 0;
        res.on('data', chunk => {
          received += chunk.length;
          if (total > 0 && mainWindow) {
            mainWindow.webContents.send('update:progress', Math.round((received / total) * 100));
          }
        });
        res.pipe(file);
        file.on('finish', () => {
          file.close(() => resolve(dest));
        });
      });
      req.on('error', (err) => { file.close(); reject(err); });
      req.end();
    };

    doRequest(url);
  });
});

ipcMain.handle('update:install', (_e, filePath) => {
  const { spawn } = require('child_process');
  spawn(filePath, ['/SILENT', '/CLOSEAPPLICATIONS', '/RESTARTAPPLICATIONS'], {
    detached: true,
    stdio: 'ignore',
  }).unref();
  setTimeout(() => app.quit(), 1000);
});

ipcMain.handle('update:releases', () => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path:     `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`,
      method:   'GET',
      headers:  { 'User-Agent': 'artificial-realms-updater' },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try {
          const releases = JSON.parse(data);
          resolve(Array.isArray(releases) ? releases : []);
        } catch { resolve([]); }
      });
    });
    req.on('error', () => resolve([]));
    req.end();
  });
});
