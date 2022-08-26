const { BrowserWindow, Notification, ipcMain, app } = require("electron");
const fs = require("fs");
var usbDetect = require('usb-detection');
const settings = require("electron-settings");
const { exec } = require("child_process");
const window = BrowserWindow.getAllWindows()[0];
const { createWindow } = require("./index");
const translate = require("./i18n");
const path = require("path");

const iconPath = app.isPackaged ? path.join(process.resourcesPath, "./src/icon.ico") : "./src/icon.ico";

usbDetect.startMonitoring();
var clearOnUnplug = false;
var curNotif;

const output = {
    log: (...msg) =>
    {
        window.webContents.send('log', msg.join(" "));
    },
    clear: () =>
    {
        if (settings.getSync("clearOnUnplug"))
        {
            window.webContents.send('clear');
        } else
        {
            window.webContents.send('log', "");
        }
    }
};

usbDetect.on("add", (device) =>
{
    if (device.manufacturer == "FTDI")
    {
        if (!settings.getSync("Autostart") && !window.isFocused())
        {
            output.log(translate("Device found, but not starting because auto-start setting is turned off."));
            return;
        }

        // Check if the file exists
        if (fs.existsSync("./HACconfiguration.xml"))
        {
            fs.copyFileSync(`./HACconfiguration.xml`, `./temp.xml`,);
        } else
        {
            showNotification(translate("No HACconfiguration.xml found")+`!\n` + translate(`NoConfigNotif`));
            return output.log(translate(`NoConfigLog`));
        }

        output.log(translate("Device found wait"));

        showNotification(translate("Device found wait"));
        setTimeout(() =>
        {
            output.log(translate("FT_Prog starting"));
            exec(`cd "${process.cwd()}" && "C:/Program Files (x86)/FTDI/FT_Prog/FT_Prog-CmdLine.exe" SCAN PROG 0 ./temp.xml`, (error, stdout, stderr) =>
            {
                fs.rmSync("./temp.xml");
                if (error)
                {
                    output.log(`Error: ${error.message}`);
                    if (error.message.includes("Command failed"))
                    {
                        output.log(translate("cmdFail"));
                    }
                    showNotification(translate("cmdFailGUIopen"));
                } else if (stderr)
                {
                    output.log(`stderr: ${stderr}`);
                    showNotification(translate("progError"));
                } else if (stdout)
                {
                    output.log(`stdout: ${stdout}`);
                    output.log(translate("Done"));
                    clearOnUnplug = true;

                    showNotification(translate("Done"));

                    window.webContents.send("addValue");
                } else
                {
                    output.log(translate("Failed!"));
                    clearOnUnplug = true;

                    showNotification(translate("Failed!"));
                }
            });
        }, 4000);
    } else if (device.manufacturer == "Support Professionals Ltd")
    {
        output.log(translate("Device already programmed.") + ` {{clear}}\n`+translate("Serial number is")+`: {{serial:${device.serialNumber}}}`);
        clearOnUnplug = true;
        if (settings.getSync("AlreadyProgrammedNotif") && !window.isFocused())
        {
            showNotification(translate("Device already programmed."));
        }
    } else
    {
        output.log("Device not known to this program.");
        clearOnUnplug = true;
    }
});
usbDetect.on("remove", (device) =>
{
    if (clearOnUnplug)
    {
        output.clear();

        clearOnUnplug = false;
        if (curNotif)
        {
            curNotif.close();
        }
    }
});

ipcMain.on("clearDevice", () =>
{
    output.clear();
    output.log(translate("Clearing device..."));
    exec(`"C:/Program Files (x86)/FTDI/FT_Prog/FT_Prog-CmdLine.exe" SCAN ERAS 0`, (error, stdout, stderr) =>
    {
        if (error)
        {
            output.log(`Error: ${error.message}`);
            if (error.message.includes("Command failed"))
            {
                output.log("\n" + translate("Check if the device is plugged in correctly."));
            }
            return;
        }
        output.log(stdout);

        if (stdout.includes("erased successfully"))
        {
            output.log("\n" + translate("Cleared device."));
        }
    });
});

function showNotification (msg)
{
    if (window.isFocused())
    {
        return;
    }
    if (curNotif)
    {
        curNotif.close();
    }
    var notif = new Notification({ silent: true, body: msg, icon: iconPath, title: "HAC programmer" });
    notif.on("click", createWindow);
    notif.show();
    curNotif = notif;
    notif.on("close", (ev) =>
    {
        notif.close();
        curNotif = undefined;
    });
}

app.on("before-quit", () =>
{
    usbDetect.stopMonitoring();
});