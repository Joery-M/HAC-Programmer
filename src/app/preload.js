const { ipcRenderer, contextBridge } = require("electron");

document.addEventListener("DOMContentLoaded", () =>
{
    ipcRenderer.send("loaded");

    //? Wait for css to load
    setTimeout(() =>
    {
        calcTableHeight();
    }, 0);
});

contextBridge.exposeInMainWorld("calcTableHeight", calcTableHeight);

document.addEventListener("keydown", (ev) =>
{
    if (ev.key.toLowerCase() == "i" && ev.shiftKey && ev.ctrlKey)
    {
        ipcRenderer.send("UIControls", "devtools");
    };
    if (ev.key.toLowerCase() == "r" && ev.ctrlKey)
    {
        if (ev.shiftKey)
        {
            location.href = location.href;
        } else
        {
            location.reload();
        }
    };
});


addEventListener("resize", calcTableHeight);
function calcTableHeight ()
{
    var tbody = document.querySelector("tbody");
    var output = document.querySelector("#output");
    tbody.style.maxHeight = (window.innerHeight - 165 - output.clientHeight) + "px";
}


ipcRenderer.on("log", async (_ev, data) =>
{
    var output = document.querySelector("#output");

    // replace newline with a break
    var text = data.replace(/\n/g, "<br>");
    // clear button
    text = text.replace(/{{clear}}/g, `<a onclick="clearDevice()" href="javascript:void(0);">${await translate("Clear device?")}</a>`);
    // copy button
    text = text.replace(/{{serial:(.*)}}/g, `<a onclick="copySerial('$1')" href="javascript:void(0);" title="Click to copy">$1</a>`);

    output.innerHTML += text + "<br>";

    output.scroll({ top: output.scrollHeight });
});


ipcRenderer.on("clear", () =>
{
    var output = document.querySelector("#output");
    output.innerText = "";
});


contextBridge.exposeInMainWorld("clearDevice", () =>
{
    ipcRenderer.send("clearDevice");
});

contextBridge.exposeInMainWorld("onAddValue", (func) =>
{
    ipcRenderer.on("addValue", func);
});

contextBridge.exposeInMainWorld("copySerial", (serial) =>
{
    navigator.clipboard.writeText(serial);
});

contextBridge.exposeInMainWorld("translate", translate);

async function translate(phrase) {
    return await ipcRenderer.invoke("translate", phrase)
}
