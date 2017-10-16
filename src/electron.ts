const electron = require('electron');
const { app, BrowserWindow } = electron;
import { join } from 'path';
const WebSocket = require('ws');

if (process.argv.slice(1).some(val => val === '--serve')) {
  require('electron-reload')(__dirname, {
    electron: join(__dirname, '..', 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}

let ws = null;
let win: any = null;

function close() {
  if (ws != null) {
    ws.send(JSON.stringify({ event: 'shutdown', data: true }));
    ws.close();
  }
}

function createWindow(): void {
  win = new BrowserWindow({
    width: 800,
    height: 600
  });

  win.setMenu(null);

  win.loadURL(`file://${__dirname}/index.html`);

  win.on('closed', () => {
    win = null;
    close();
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  close();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});

const ipc = require('electron').ipcMain;
ws = new WebSocket('ws://127.0.0.1:8888/ui');

ws.on('open', () => {
  console.log('WebSocket Client Connected');
  ws.send(JSON.stringify({ event: 'connected', date: true }));
});

ws.on('close', () => {
  console.log('WebSocket Connection Closed');
  app.quit();
});

ws.on('message', msg => {
  console.log('Received: ', msg);
});
