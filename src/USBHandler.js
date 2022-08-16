const { BrowserWindow, Notification, ipcMain, app } = require("electron");
const fs = require("fs");
var usbDetect = require('usb-detection');
const settings = require("electron-settings");
const { exec } = require("child_process");
const window = BrowserWindow.getAllWindows()[0];
const { createWindow } = require("./index");
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
            output.log("Device found, but not starting because auto-start setting is turned off.");
            return;
        }

        // Check if the file exists
        if (fs.existsSync("./HACconfiguration.xml"))
        {
            fs.copyFileSync(`./HACconfiguration.xml`, `./temp.xml`,);
        } else
        {
            showNotification(`No HACconfiguration.xml found!\nOpen the GUI, go to File > Load config file, and select a file.`);
            return output.log(`No HACconfiguration.xml found!\n\nGo to File > Load config file, and select a file`);
        }

        output.log("Device found, waiting for Windows...");

        showNotification("Device found, waiting for Windows...");
        setTimeout(() =>
        {
            output.log("Starting FT_Prog...");
            exec(`cd "${process.cwd()}" && "C:/Program Files (x86)/FTDI/FT_Prog/FT_Prog-CmdLine.exe" SCAN PROG 0 ./temp.xml`, (error, stdout, stderr) =>
            {
                fs.rmSync("./temp.xml");
                if (error)
                {
                    output.log(`Error: ${error.message}`);
                    if (error.message.includes("Command failed"))
                    {
                        output.log("\nPlease try again.\nOtherwise, check if the HACconfiguration.xml is correct and that the device is plugged in correctly.");
                    }
                    showNotification("Error! Click here to open the GUI.");
                } else if (stderr)
                {
                    output.log(`stderr: ${stderr}`);
                    showNotification("Error from FT_Prog!");
                } else if (stdout)
                {
                    output.log(`stdout: ${stdout}`);
                    output.log(`Done`);
                    clearOnUnplug = true;

                    showNotification("Done");

                    window.webContents.send("addValue");
                } else
                {
                    output.log("Failed!");
                    clearOnUnplug = true;

                    showNotification("Failed!");
                }
            });
        }, 4000);
    } else if (device.manufacturer == "Support Professionals Ltd")
    {
        output.log("Device already programmed. {{clear}}");
        clearOnUnplug = true;
        if (settings.getSync("AlreadyProgrammedNotif") && !window.isFocused())
        {
            showNotification("Device already programmed");
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
    output.log("Clearing device...");
    exec(`"C:/Program Files (x86)/FTDI/FT_Prog/FT_Prog-CmdLine.exe" SCAN ERAS 0`, (error, stdout, stderr) =>
    {
        if (error)
        {
            output.log(`Error: ${error.message}`);
            if (error.message.includes("Command failed"))
            {
                output.log("\nCheck if the device is plugged in correctly.");
            }
            return;
        }
        output.log(stdout);

        if (stdout.includes("erased successfully"))
        {
            output.log("\nCleared device.");
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