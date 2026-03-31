const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
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
      webSecurity: false
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
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
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
    const apiPath = `/v1beta/models/${mdl}:generateContent?key=${apiKey}`;
    const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) };
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

ipcMain.handle('save:write', (_e, slot, data) => {
  const dir = savesDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `save_${slot}.json`), JSON.stringify(data, null, 2));
  return { success: true };
});

ipcMain.handle('save:read', (_e, slot) => {
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
  const fp = path.join(savesDir(), `save_${slot}.json`);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
  return { success: true };
});

// ── Settings ──────────────────────────────────────────────────────────────────
const settingsPath = () => path.join(app.getPath('userData'), 'settings.json');

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
          resolve({
            hasUpdate:      semverGt(latest, current),
            latestVersion:  latest,
            currentVersion: current,
            releaseUrl:     release.html_url ||
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
  shell.openExternal(url);
});
