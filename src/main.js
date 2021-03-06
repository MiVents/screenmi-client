const {
    app,
    BrowserWindow,
    ipcMain,
    net,
} = require('electron')
const Store = require('./Helpers/Store.js');

const fetch = require('electron-fetch').default

const _global = {
    url: {
        api: '',
        timeline: 'http://development.screenmi.nl/api/timeline',
        login: 'http://development.screenmi.nl/api/screen/signin',
        // login: 'http://localhost:3000/api/screen/signin',
        // timeline: 'http://localhost:3000/api/timeline'
    }
}

const store = new Store({
    configName: 'settings',
    defaults: {
        // 800x600 is the default size of our window
        windowBounds: {
            width: 800,
            height: 600
        }
    }
});

const functions = {
    fetchPost: config => {
        // let config = {
        //     url : '.../'
        //     data : {}
        // }
        return new Promise(
            async (resolve, reject) => {
                try {
                    fetch(config.url, {
                            method: 'POST',
                            body: JSON.stringify(config.data ? config.data : {}),
                            headers: {
                                "Content-type": "application/json; charset=UTF-8"
                            }
                        })
                        .then(res => res.json())
                        .then(json => resolve(json))
                        .catch(err => {
                            console.error(err)
                            reject(err)
                        })
                } catch (err) {
                    console.error(err)
                    reject(err)
                }
            }
        )
    },
    fetchGet: config => {
        // let config = {
        //     url : '.../'
        // }
        return new Promise(
            async (resolve, reject) => {
                try {
                    fetch(config.url, {
                            method: 'GET',
                            headers: {
                                "Content-type": "application/json; charset=UTF-8",
                                "Authorization": `Bearer ${store.get('token')}`
                            }
                        })
                        .then(res => res.json())
                        .then(json => resolve(json))
                        .catch(err => {
                            console.error(err)
                            // TODO: if code is not valid
                            reject(err)
                        })
                } catch (err) {
                    console.error(err)
                    reject(err)
                }
            }
        )
    }
}

let mainWindow;

function createWindow() {
    // Create the browser window.
    let {
        width,
        height,
        x,
        y
    } = store.get('windowBounds');

    // let bounds = screen.getPrimaryDisplay().bounds;
    // let x = bounds.x + ((bounds.width - width) / 2);
    // let y = bounds.y + ((bounds.height - height) / 2);

    mainWindow = new BrowserWindow({
        width,
        height,
        x,
        y,
        webPreferences: {
            nodeIntegration: true
        },
        frame: false
    })

    // and load the index.html of the app.
    mainWindow.loadFile(`./src/index.html`)

    // Open the DevTools.
    //mainWindow.webContents.openDevTools()

    ipcMain.on('init', (event, arg) => {
        // If there isn't a stored secret key ask the user
        let login = true;

        // If there is a stored secret key get that one
        let token = store.get("token");

        if (token) {
            login = false;
        }

        event.sender.send('init-reply', login)
    })

    // Token is not valid retry login
    ipcMain.on('retry-login', async (event, arg) => {
        store.set('token', null);
        mainWindow.loadFile(`./src/index.html`);
    })

    // Request to ScreenMi API for playlist
    ipcMain.on('login', async (event, arg) => {
        let result;
        try {
            result = await functions.fetchPost({
                url: _global.url.login,
                data: {
                    secret: arg
                }
            });

            if (result.code == 200) {
                // Store token
                store.set('token', result.data.token);
            }

            if (result.code !== 200) {
                console.error(result);
                result = {
                    error: true,
                    message: `Can't register this screen... Do you have the right secret?`
                }
            }
        } catch (error) {
            console.error(error)
            result = {
                error: true,
                message: `Can't register this screen... Do you have internet?`
            }
        } finally {
            event.sender.send('login-reply', result)
        }
    })

    // Render the playlist page
    ipcMain.on('render-playlist', async (event, arg) => {
        mainWindow.loadFile(`./src/playlist.html`);
    });

    ipcMain.on('load-playlist', async (event, arg) => {
        let result;
        try {
            result = await functions.fetchGet({
                url: _global.url.timeline,
            });
            store.set('remote', result.data)
        } catch (error) {
            console.error(error);
        } finally {
            event.sender.send('load-playlist-reply', result.data);
        }
    })

    // Emitted when the windows is resized
    mainWindow.on('resize', () => {
        // The event doesn't pass us the window size, so we call the `getBounds` method which returns an object with
        // the height, width, and x and y coordinates.
        let {
            width,
            height
        } = mainWindow.getBounds();
        // Now that we have them, save them using the `set` method.
        store.set('windowBounds', {
            width,
            height
        });
    });

    // Emitted when the windows is moved
    mainWindow.on('move', () => {
        // The event doesn't pass us the window size, so we call the `getBounds` method which returns an object with
        // the height, width, and x and y coordinates.
        let {
            width,
            height,
            x,
            y
        } = mainWindow.getBounds();
        // Now that we have them, save them using the `set` method.
        store.set('windowBounds', {
            width,
            height,
            x,
            y
        });
    });

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
}

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})