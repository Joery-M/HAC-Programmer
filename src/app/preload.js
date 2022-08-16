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


ipcRenderer.on("log", (_ev, data) =>
{
    var output = document.querySelector("#output");

    var text = data.replace(/\n/g, "<br>");
    text = text.replace(/{{clear}}/g, '<a onclick="clearDevice()" href="javascript:void(0);">Clear device?</a>');

    output.innerHTML += text + "<br>";

    output.scroll({ top: 1000 });
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