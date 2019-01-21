const {
    app,
    BrowserWindow,
    ipcMain,
    net
} = require('electron')

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

    ipcMain.on('screen-active-async', (event, arg) => {

        // If there isn't a stored secret key ask the user
        setTimeout(() => {
            event.sender.send('screen-active-async-reply', true)
        }, 5000);

        // If there is a stored secret key get that one

        // Request to ScreenMi API for playlist 

    })

    ipcMain.on('input-secret-async', (event, arg) => {
        let result;
        // Request to ScreenMi API for playlist
        var postData = JSON.stringify({
            'secret' : arg
        });
        const request = net.request(`http://localhost:3000/api/screen/signin`,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        })
        request.on('response', (response) => {
            result = response;
            console.log(`STATUS: ${response.statusCode}`)
            response.on('data', (chunk) => {
                console.log(`BODY: ${chunk}`)
            })
            response.on('end', () => {
                event.sender.send('input-secret-async-reply', result)
            })
        })
        request.end()


        // If request is 200 OK store the secret key somewhere

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