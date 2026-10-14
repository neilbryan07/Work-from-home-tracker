const electron = require('electron');
const url = require('url');
const path = require('path');
const {app, BrowserWindow, Menu, ipcMain, globalShortcut} = electron;
const Store = require('electron-store');
// prod = PRODUCTION | development = DEVELOPMENT 
process.env.APP_ENV = 'prod';

let loginPage = null;
let landingPage = null;

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (loginPage && (landingPage == null)) {
            if (loginPage.isMinimized()) {
                loginPage.restore()
            }
            loginPage.focus()
        }
        if (landingPage) {
            if (landingPage.isMinimized()) {
                landingPage.restore()
            }
            landingPage.focus()
        }
    })

    // listen app to ready
    app.on('ready', function(){
        app.allowRendererProcessReuse = true;
        // create new window
        if (process.env.APP_ENV == 'development') {
            loginPage = new BrowserWindow({
                width: 415,
                height: 510,
                title: 'NBPO Tracker',
                webPreferences: {nodeIntegration: true}
            });
        } else {
            loginPage = new BrowserWindow({
                width: 400,
                height: 450,
                frame: false,
                resizable: false,
                title: 'NBPO Tracker',
                webPreferences: {nodeIntegration: true}
            });
        }
        
        // load html to window
        loginPage.loadURL(url.format({
            pathname: path.join(__dirname, './views/loginPage.html'),
            protocol: 'file:',
            slashes: true
        }));
        // close app when main window is closed
        loginPage.on('close', function(){
            app.quit();
        });

        // build menu from template
        const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
        // insert menu
        Menu.setApplicationMenu(mainMenu);
        // ===========UNCOMMENT FOR MANUAL CAPTURE SCREEN AND DEVTOOLS============= 
        // const store = new Store();
        // globalShortcut.register(process.platform === 'darwin' ? 'Alt+Cmd+M' : 'Ctrl+Shift+M', () => {
        //     if (store.get('screenshot_setting') == undefined) {
        //         store.set('screenshot_setting', 'Auto');
        //     } else {
        //         if (store.get('screenshot_setting') == 'Auto') {
        //             store.set('screenshot_setting', 'Manual');
        //         } else {
        //             store.set('screenshot_setting', 'Auto');
        //         }
        //     }
        //     if (landingPage) {
        //         landingPage.webContents.send('screenshotLan:setting');
        //     } else {
        //         loginPage.webContents.send('screenshotLog:setting');
        //     }
        // });
        // globalShortcut.register('CommandOrControl+I', () => {
        //     if (landingPage) {
        //         landingPage.webContents.openDevTools();
        //     } else {
        //         loginPage.webContents.openDevTools();
        //     }
        // });
    });

    // catch login:success
    ipcMain.on('login:success', function(e){
        // create new window
        if (!landingPage) {
            if (process.env.APP_ENV == 'development') {
                landingPage = new BrowserWindow({
                    width: 365,
                    height: 620,
                    title: 'NBPO Tracker',
                    webPreferences: {nodeIntegration: true}
                });
            } else {
                landingPage = new BrowserWindow({
                    width: 350,
                    height: 560,
                    frame: false,
                    resizable: false,
                    title: 'NBPO Tracker',
                    webPreferences: {nodeIntegration: true}
                });
            }
            
            // load html to window
            landingPage.loadURL(url.format({
                pathname: path.join(__dirname, './views/landingPage.html'),
                protocol: 'file:',
                slashes: true
            }));
            loginPage.hide();
        }
        
        // garbage collection handle
        landingPage.on('closed', function(){
            landingPage = null;
            loginPage.show(); 
        });
    });

    // create menu template
    const mainMenuTemplate = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Quit',
                    accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                    click() {
                        app.quit();
                    }
                },
                {
                    label: 'DevTools',
                    click(item, focusedWindow){
                        focusedWindow.toggleDevTools();
                    }
                }
            ]
        }
    ];
}

