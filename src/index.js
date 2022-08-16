const { app, BrowserWindow, Tray, Menu, ipcMain, nativeTheme, shell, dialog } = require('electron');
const settings = require("electron-settings");
const path = require('path');
const fs = require("fs");
const USBDetect = require('usb-detection');
const { autoUpdater } = require("electron-updater");
autoUpdater.checkForUpdates();

if (require('electron-squirrel-startup'))
{
    app.exit();
}

const iconPath = app.isPackaged ? path.join(process.resourcesPath, "./src/icon.ico") : "./src/icon.ico";

//? Set defaults
if (!settings.hasSync("AlreadyProgrammedNotif"))
{
    settings.setSync({
        AlreadyProgrammedNotif: false,
        Autostart: false,
        clearOnUnplug: true,
        backgroundRun: true
    });
}

const createWindow = () =>
{
    if (BrowserWindow.getAllWindows().length > 0)
    {
        BrowserWindow.getAllWindows()[0].show();
        return;
    }
    // Create the browser window.
    const win = new BrowserWindow({
        width: 600,
        height: 600,
        minWidth: 516,
        minHeight: 499,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, './app/preload.js'),
            sandbox: false,
            devTools: true
        },
        darkTheme: false,
        icon: iconPath,
        title: "HAC Programmer"
    });

    nativeTheme.themeSource = "light";

    // and load the index.html of the app.
    win.loadFile(path.join(__dirname, './app/index.html'));
    ipcMain.once("loaded", () =>
    {
        win.show();
    });


    ipcMain.on("UIControls", (ev, data) =>
    {
        switch (data)
        {
            case "devtools":
                if (win.webContents.isDevToolsOpened())
                {
                    win.webContents.closeDevTools();
                } else
                {
                    win.webContents.openDevTools();
                }
                break;
            case 'reload':
                win.reload();
                break;
            default:
                break;
        }
    });

    //? Hide the window when closed
    win.on('close', function (evt)
    {
        evt.preventDefault();
        if (settings.getSync("backgroundRun"))
        {
            win.hide();
            win.webContents.closeDevTools();
        } else
        {
            app.exit();
        }
    });
};

module.exports = {
    createWindow
};

function showWindow ()
{
    BrowserWindow.getAllWindows()[0].show();
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock)
{
    app.exit();
    return;
}

app.on('second-instance', () =>
{
    // Someone tried to run a second instance, we should focus our window.
    showWindow();
});

app.on('ready', () =>
{
    createWindow();
    app.name = "HAC Programmer";
    app.setAppUserModelId(app.name);

    if (!fs.existsSync("C:/Program Files (x86)/FTDI/FT_Prog/FT_Prog-CmdLine.exe"))
    {
        var box = dialog.showMessageBoxSync({
            title: "HAC Programmer",
            message: "FT_Prog not found!",
            detail: "Would you like to go to the download page?",
            buttons: ["No (Quits program)", "Yes"],
            defaultId: 1,
            noLink: true,
            type: "warning"
        });
        if (box == 1)
        {
            shell.openExternal("https://ftdichip.com/utilities/#ft_prog");
        } else
        {
            app.exit();
        }
    }

    //! Maybe come back to this, but for now it requires the device to be plugged in. Other methods require admin
    // //? Check driver
    // //* Command is this:
    // //* Get-WmiObject Win32_PnPSignedDriver -Filter "DeviceName = 'GymManager HAC'"
    // //* But encoded to be able to run it in 1 line
    // exec(`powershell.exe -EncodedCommand "RwBlAHQALQBXAG0AaQBPAGIAagBlAGMAdAAgAFcAaQBuADMAMgBfAFAAbgBQAFMAaQBnAG4AZQBkAEQAcgBpAHYAZQByACAALQBGAGkAbAB0AGUAcgAgACIARABlAHYAaQBjAGUATgBhAG0AZQAgAD0AIAAnAEcAeQBtAE0AYQBuAGEAZwBlAHIAIABIAEEAQwAnACIA"`,
    //     (err, stdout, stderr) =>
    //     {
    //         if (!stdout && !err)
    //         {
    //             var box = dialog.showMessageBoxSync({
    //                 type: "warning",
    //                 title: "HAC Programmer",
    //                 message: "Gymmanager HAC driver not found!",
    //                 detail: "Please request the driver from support.",
    //                 buttons: ["Quit", "Continue anyway"],
    //                 defaultId: 1,
    //                 noLink: true
    //             });
    //             if (box == 0) {
    //                 app.exit()
    //             }
    //         }
    //     });

    require("./USBHandler");

    let tray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Open GUI', type: 'normal', click: showWindow },
        { label: 'Quit', type: 'normal', click: app.exit }
    ]);
    tray.setToolTip('HAC Programmer');
    tray.setContextMenu(contextMenu);

    tray.on("click", showWindow);
});

app.on('activate', () =>
{
    showWindow();
});



//? Menu bar
const menu = Menu.buildFromTemplate([
    {
        label: 'File',
        submenu: [
            {
                label: 'Load config file',
                click: loadConfigFile
            },
            {
                label: 'Open stored config file location',
                click: openFilePath
            },
            {
                label: 'Open FT_Prog location',
                click: () =>
                {
                    shell.showItemInFolder(fs.realpathSync("C:/Program Files (x86)/FTDI/FT_Prog/FT_Prog.exe"));
                }
            },
            {
                type: "separator"
            },
            {
                label: 'Restart',
                click: () =>
                {
                    app.exit();
                    app.relaunch();
                }
            },
            {
                label: 'Quit',
                click: () =>
                {
                    app.exit();
                }
            }
        ]
    },
    {
        label: "Settings",
        submenu: [
            {
                label: 'Notify when device is already programmed.',
                type: 'checkbox',
                id: "AlreadyProgrammedNotif",
                checked: settings.getSync("AlreadyProgrammedNotif"),
                click: () =>
                {
                    settings.setSync("AlreadyProgrammedNotif", !settings.getSync("AlreadyProgrammedNotif"));
                }
            },
            {
                label: 'Start programming in the background.',
                type: 'checkbox',
                id: "Autostart",
                checked: settings.getSync("Autostart"),
                click: () =>
                {
                    settings.setSync("Autostart", !settings.getSync("Autostart"));
                }
            },
            {
                label: 'Clear output console on unplug.',
                type: 'checkbox',
                id: "clearOnUnplug",
                checked: settings.getSync("clearOnUnplug"),
                click: () =>
                {
                    settings.setSync("clearOnUnplug", !settings.getSync("clearOnUnplug"));
                }
            },
            {
                label: 'Run in background.',
                type: 'checkbox',
                id: "backgroundRun",
                checked: settings.getSync("backgroundRun"),
                click: () =>
                {
                    settings.setSync("backgroundRun", !settings.getSync("backgroundRun"));
                }
            },
            {
                type: 'separator'
            },
            {
                label: 'Reset to defaults',
                type: 'normal',
                click: () =>
                {
                    settings.setSync({
                        AlreadyProgrammedNotif: false,
                        Autostart: false,
                        clearOnUnplug: true,
                        backgroundRun: true
                    });
                    menu.items[1].submenu.items.forEach((item) =>
                    {
                        if (item.type == "checkbox")
                        {
                            item.checked = settings.getSync(item.id);
                        }
                    });
                }
            }
        ]
    },
    {
        label: "Info",
        type: "normal",
        click: (ev) =>
        {
            var win = BrowserWindow.getAllWindows()[0];
            dialog.showMessageBox(win, {
                title: "HAC Programmer",
                message: "HAC Programmer",
                type: "info",
                detail:
                `Version: ${app.getVersion()}

                Requirements status:
                - FT_Prog exists: ${fs.existsSync("C:/Program Files (x86)/FTDI/FT_Prog/FT_Prog-CmdLine.exe")}
                - HACconfiguration.xml exists: ${fs.existsSync("./HACconfiguration.xml")}

                Versions:
                - Electron: ${process.versions["electron"]}
                - USB-Detection: ${USBDetect.version}

                Made with Electron and disdain for node-gyp.`.replace(/    /g, ""),
                buttons: ["Open GitHub page", "OK"],
                defaultId: 1,
                cancelId: 1,
                noLink: true
            }).then((val) =>
            {
                if (val.response == 0)
                {
                    shell.openExternal("https://github.com/Joery-M/HAC-Programmer");
                }
            });

        }
    }
]);
Menu.setApplicationMenu(menu);

function openFilePath ()
{
    if (!fs.existsSync("./HACconfiguration.xml"))
    {
        dialog.showMessageBox(BrowserWindow.getAllWindows()[0], {
            message: "No HACconfiguration.xml found",
            detail: "Please go to File > Load config file to load a config file.",
        });
        return;
    }
    shell.showItemInFolder(fs.realpathSync("./HACconfiguration.xml"));
}

async function loadConfigFile ()
{
    var win = BrowserWindow.getAllWindows()[0];
    var filePicker = await dialog.showOpenDialog(win, {
        properties: ['openFile', 'dontAddToRecent'],
        filters: [{ name: "FTDI Config files", extensions: ["xml"] }]
    });

    if (filePicker.canceled == true)
    {
        return;
    }

    fs.copyFileSync(filePicker.filePaths[0], "./HACconfiguration.xml");
    win.webContents.send('log', "Config loaded.");
}