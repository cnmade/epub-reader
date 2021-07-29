const {app, BrowserWindow, ipcMain, remote} = require('electron');


let deeplinkingUrl = process.argv.length > 1 ? process.argv[1] : "";
// Handle creating/removing shortcuts on Windows when installing/uninstalling.



let MAIN_WINDOW_WEBPACK_ENTRY = "file:///./dist/index.html";

const createWindow = ()  => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,//是否启用节点集成
            nodeIntegrationInWorker: true,//是否在Web工作器中启用了Node集成
            contextIsolation: false,//electron为12x版本新增此行
            devTools: true,//是否开启 DevTools
            webSecurity: false//是否禁用同源策略(上线删除)
        },
        height: 860,
        width: 1200
    });

    mainWindow.removeMenu();
    // and load the index.html of the app.
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY + "?args=" + deeplinkingUrl);

    // Open the DevTools.
 //   mainWindow.webContents.openDevTools();
};


//退出

ipcMain.on('close-me', (evt, arg) => {
    app.quit()
})

//停用GPU 加速
app.disableHardwareAcceleration();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
app.on('second-instance', (e, argv) => {
    if (process.platform !== 'darwin') {
        // Find the arg that is our custom protocol url and store it
        deeplinkingUrl = argv.find((arg) => arg.startsWith('custom://'));

        remote.getCurrentWindow().loadURL(MAIN_WINDOW_WEBPACK_ENTRY + "?args=" + deeplinkingUrl);
    }

});


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
