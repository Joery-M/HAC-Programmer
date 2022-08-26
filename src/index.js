const { app, BrowserWindow, Tray, Menu, ipcMain, nativeTheme, shell, dialog } = require('electron');
const settings = require("electron-settings");
const path = require('path');
const fs = require("fs");
const USBDetect = require('usb-detection');
const { autoUpdater } = require("electron-updater");
const translate = require("./i18n");
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

    ipcMain.handle("translate", (ev, string) =>
    {
        return (translate(string));
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
app.commandLine.appendSwitch("lang", settings.getSync("lang") ?? "en");
app.on('ready', () =>
{
    createWindow();
    app.name = "HAC Programmer";
    app.setAppUserModelId(app.name);

    if (!fs.existsSync("C:/Program Files (x86)/FTDI/FT_Prog/FT_Prog-CmdLine.exe"))
    {
        var box = dialog.showMessageBoxSync({
            title: "HAC Programmer",
            message: translate("FT_Prog not found!"),
            detail: translate("downloadFTpage"),
            buttons: translate("downloadFToptions"),
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
        { label: translate('Open GUI'), type: 'normal', click: showWindow },
        { label: translate('Quit'), type: 'normal', click: app.exit }
    ]);
    tray.setToolTip('HAC Programmer');
    tray.setContextMenu(contextMenu);

    tray.on("click", showWindow);


    //? Menu bar
    const menu = Menu.buildFromTemplate([
        {
            label: translate('File'),
            submenu: [
                {
                    label: translate('Load config file'),
                    click: loadConfigFile
                },
                {
                    label: translate('Open stored config file location'),
                    click: openFilePath
                },
                {
                    label: translate('Open FT_Prog location'),
                    click: () =>
                    {
                        shell.showItemInFolder(fs.realpathSync("C:/Program Files (x86)/FTDI/FT_Prog/FT_Prog.exe"));
                    }
                },
                {
                    type: "separator"
                },
                {
                    label: translate('Restart'),
                    click: () =>
                    {
                        app.exit();
                        app.relaunch();
                    }
                },
                {
                    label: translate('Quit'),
                    click: () =>
                    {
                        app.exit();
                    }
                }
            ]
        },
        {
            label: translate("Settings"),
            submenu: [
                {
                    label: translate('Notify when device is already programmed.'),
                    type: 'checkbox',
                    id: "AlreadyProgrammedNotif",
                    checked: settings.getSync("AlreadyProgrammedNotif"),
                    click: () =>
                    {
                        settings.setSync("AlreadyProgrammedNotif", !settings.getSync("AlreadyProgrammedNotif"));
                    }
                },
                {
                    label: translate('Start programming in the background.'),
                    type: 'checkbox',
                    id: "Autostart",
                    checked: settings.getSync("Autostart"),
                    click: () =>
                    {
                        settings.setSync("Autostart", !settings.getSync("Autostart"));
                    }
                },
                {
                    label: translate('Clear output console on unplug.'),
                    type: 'checkbox',
                    id: "clearOnUnplug",
                    checked: settings.getSync("clearOnUnplug"),
                    click: () =>
                    {
                        settings.setSync("clearOnUnplug", !settings.getSync("clearOnUnplug"));
                    }
                },
                {
                    label: translate('Run in background.'),
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
                    label: translate('Reset to defaults'),
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
            label: translate("Language"),
            type: "submenu",
            submenu: [
                {
                    label: "English",
                    type: "radio",
                    checked: app.getLocale() == "en",
                    click: languageSelect
                },
                {
                    label: "Nederlands",
                    type: "radio",
                    checked: app.getLocale() == "nl",
                    click: languageSelect
                },
                {
                    label: "Français",
                    type: "radio",
                    checked: app.getLocale() == "fr",
                    click: languageSelect
                }
            ]
        },
        {
            label: "Info",
            type: "normal",
            click: (ev) =>
            {
                var win = BrowserWindow.getAllWindows()[0];

                var detailMessage = translate("infoMsg");

                detailMessage = detailMessage.replace(/{{appVer}}/g, app.getVersion());
                detailMessage = detailMessage.replace(/{{ftProgExist:(.*):(.*)}}/g, fs.existsSync("C:/Program Files (x86)/FTDI/FT_Prog/FT_Prog-CmdLine.exe") ? "$1" : "$2");
                detailMessage = detailMessage.replace(/{{configExist:(.*):(.*)}}/g, fs.existsSync("./HACconfiguration.xml") ? "$1" : "$2");
                detailMessage = detailMessage.replace(/{{electronVer}}/g, process.versions["electron"]);
                detailMessage = detailMessage.replace(/{{usbVer}}/g, USBDetect.version);
                dialog.showMessageBox(win, {
                    title: "HAC Programmer",
                    message: "HAC Programmer",
                    type: "info",
                    detail: detailMessage.replace(/    /g, ""),
                    buttons: translate("infoButtons"),
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


    /**
     * @param {Electron.MenuItem} item
     */
    function languageSelect (item)
    {
        var lang = item.label;

        var codes = { "English": "en", "Nederlands": "nl", "Français": "fr" };

        var code = codes[lang];

        var msgbox = dialog.showMessageBoxSync(BrowserWindow.getAllWindows()[0], {
            message: translate("changeLangMsg", code).replace("{{lang}}", lang),
            detail: translate("changeLangDet", code),
            buttons: translate("yesNoButtons", code),
            noLink: true
        });

        if (msgbox == 0)
        {
            settings.setSync("lang", code);
            app.exit();
            app.relaunch();
        } else
        {
            var langFull = Object.keys(codes).find(key => codes[key] === app.getLocale().split("-")[0]);
            //? Reset checked to previous
            // console.log(menu.items[2].submenu.items.find((mItem) =>
            // {
            //     console.log(mItem.label, app.getLocale().split("-")[0]);
            //     mItem.label == app.getLocale().split("-")[0];
            // })[0]);
            menu.items[2].submenu.items.find((mItem) => mItem.label == langFull).checked = true;

            // menu.items[2].submenu.items.forEach((mItem, i) =>
            // {
            //     if (codes[mItem.label] == app.getLocale().split("-")[0])
            //     {
            //         mItem.checked = true;
            //     }
            // });
        }
    }
});

app.on('activate', () =>
{
    showWindow();
});

function openFilePath ()
{
    if (!fs.existsSync("./HACconfiguration.xml"))
    {
        dialog.showMessageBox(BrowserWindow.getAllWindows()[0], {
            message: translate("No HACconfiguration.xml found"),
            detail: translate("Please go to File > Load config file to load a config file."),
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
    win.webContents.send('log', translate("Config loaded."));
}