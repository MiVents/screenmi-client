const {
    app,
    BrowserWindow,
    ipcMain,
    net
} = require('electron')

const fetch = require('electron-fetch').default

const _global = {
    url: {
        api: '',
        login: 'http://localhost:3000/api/screen/signin'
    }
}

const functions = {
    fetch: config => {
        // let config = {
        //     url : '.../'
        //     data : {}
        // }
        return new Promise(
            async (resolve, reject) => {
                console.log(config.data ? config.data : {})
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
    }
}

let mainWindow;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
    })

    // and load the index.html of the app.
    mainWindow.loadFile(`./src/index.html`)

    // Open the DevTools.
    mainWindow.webContents.openDevTools()

    ipcMain.on('init', (event, arg) => {

        // If there isn't a stored secret key ask the user
        setTimeout(() => {
            event.sender.send('init-reply', true)
        }, 500);

        // If there is a stored secret key get that one

        // Request to ScreenMi API for playlist 

    })

    // Request to ScreenMi API for playlist
    ipcMain.on('login', async (event, arg) => {
        try {
            let result = await functions.fetch({
                url: _global.url.login,
                data: {
                    secret: arg
                }
            })
            event.sender.send('login-reply', result)
        } catch (err) {
            console.error(err)
        }
    })
    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
}

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