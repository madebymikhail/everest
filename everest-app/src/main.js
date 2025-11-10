import { app, BrowserWindow, globalShortcut, ipcMain, Menu, Tray, nativeImage } from 'electron'
import pkg from 'electron-updater'
import { fileURLToPath } from 'url'
import path, { dirname } from 'path'
import { spawn } from 'child_process'
import fetch from 'node-fetch'
import net from 'net'
import os from 'os'

const { autoUpdater } = pkg

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let overlay = null
let backendProcess = null
let tray = null

// ---- Backend Management ----
const BACKEND_PORT = 39245
const RESOURCE_DIR = !app.isPackaged
  ? path.join(__dirname, '../resources')
  : path.join(process.resourcesPath, 'resources')

const ASSETS_DIR = !app.isPackaged
  ? path.join(__dirname, '../assets')
  : path.join(process.resourcesPath, 'assets')

function getBackendBinary() {
  const platform = os.platform()
  if (platform === 'win32') return path.join(RESOURCE_DIR, 'EverestService.exe')
  if (platform === 'darwin') return path.join(RESOURCE_DIR, 'EverestService_mac')
  return path.join(RESOURCE_DIR, 'EverestService_linux')
}

function startBackend() {
  const backendPath = getBackendBinary()
  backendProcess = spawn(backendPath, [], {
    cwd: RESOURCE_DIR,
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe']
  })

  backendProcess.stdout.on('data', (data) => {
    console.log(`[PYTHON STDOUT]: ${data.toString().trim()}`)
  })

  backendProcess.stderr.on('data', (data) => {
    console.error(`[PYTHON STDERR]: ${data.toString().trim()}`)
  })

  backendProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`)
  })

  backendProcess.on('exit', (code, signal) => console.log(`Backend exited with code ${code}, signal ${signal}`))
  backendProcess.on('error', (err) => console.error('Backend failed to start:', err))

  console.log('Everest backend started.')
}

async function stopBackend() {
  if (!backendProcess) return console.log('[Backend] No backend running.')

  console.log('[Backend] Sending /shutdown...')
  try {
    const res = await fetch('http://127.0.0.1:39245/shutdown', { method: 'POST', timeout: 2000 })
    console.log('[Backend] Shutdown response:', res.status, await res.text())
  } catch (err) {
    console.warn('[Backend] Shutdown request failed:', err.message)
  }

  setTimeout(() => {
    if (!backendProcess.killed) {
      console.warn('[Backend] Process still alive, killing...')
      backendProcess.kill('SIGKILL')
    } else {
      console.log('[Backend] Backend exited cleanly.')
    }
    backendProcess = null
  }, 2000)
}

function waitForPort(port, callback) {
  const client = new net.Socket()
  client.once('error', () => setTimeout(() => waitForPort(port, callback), 500))
  client.connect(port, '127.0.0.1', () => {
    client.destroy()
    callback()
  })
}

// ---- Tray ----
function createTray() {
  const iconPath = process.platform === 'darwin'
    ? path.join(ASSETS_DIR, 'icon_status_mac.png')
    : path.join(ASSETS_DIR, 'icon_status.png')
  const trayIcon = nativeImage.createFromPath(iconPath)
    .resize({ width: 16, height: 16 })

  trayIcon.setTemplateImage(true)

  tray = new Tray(trayIcon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Overlay',
      click: () => toggleOverlay()
    },
    {
      label: 'Quit Everest',
      click: async () => {
        console.log('[Tray] Quit selected.')
        await stopBackend()
        app.quit()
      }
    }
  ])

  tray.setToolTip('Everest')
  tray.setContextMenu(contextMenu)

  if (process.platform === 'darwin') {
    // macOS: show menu bar menu on click
    tray.on('click', () => tray.popUpContextMenu())
  } else {
    // Windows/Linux: left click toggles overlay
    tray.on('click', () => toggleOverlay())
  }

  console.log('[Tray] Tray icon created.')
}

// ---- App Lifecycle ----
app.whenReady().then(() => {
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify()
  }
  
  startBackend()

  waitForPort(BACKEND_PORT, () => {
    overlay = new BrowserWindow({
      width: 650,
      height: 300,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      transparent: true,
      resizable: false,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true
      }
    })

    overlay.loadFile(path.join(__dirname, 'static/index.html'))
    createTray()

    globalShortcut.register('Ctrl+Space', toggleOverlay)
  })
})

autoUpdater.on('update-available', (info) => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Available',
    message: 'A new version of Everest is available. Downloading now...',
  })
})

autoUpdater.on('update-downloaded', (info) => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Update available',
    message: 'A new version of Everest is available. Install now?',
    buttons: ['Install', 'Cancel']
  }).then((result) => {
    if (result.response === 0) {
      console.log('Updating...')
      autoUpdater.quitAndInstall()
    } else {
      console.log('Update cancelled.')
    }
  })
})

ipcMain.on('hide-window', () => toggleOverlay())

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  stopBackend()
})

// ---- Overlay helper ----
function toggleOverlay() {
  if (!overlay) return
  if (overlay.isVisible()) overlay.hide()
  else {
    overlay.setOpacity(0)
    overlay.show()
    overlay.focus()
    let opacity = 0
    const fade = setInterval(() => {
      opacity += 0.1
      overlay?.setOpacity(opacity)
      if (opacity >= 1) clearInterval(fade)
    }, 10)
  }
}
