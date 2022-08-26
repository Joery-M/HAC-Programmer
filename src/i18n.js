const path = require("path");
const electron = require('electron');
const fs = require('fs');
let loadedLanguage;
let app = electron.app ? electron.app : electron.remote.app;

if (!app.isReady())
{
    app.on('ready', () =>
    {
        loadLang();
    });
}else{
    loadLang();
}

module.exports = locale;

function locale (phrase, lang)
{
    if (lang !== undefined) {
        var prevLoadedLang = loadedLanguage
        loadedLanguage = JSON.parse(fs.readFileSync(path.join(__dirname, "./locales/", lang + '.json'), 'utf8'));
    }
    
    let translation = loadedLanguage[phrase];
    if (translation === undefined)
    {
        translation = phrase;
    }

    if (prevLoadedLang) {
        loadedLanguage = prevLoadedLang
    }
    return translation;
}

function loadLang (lang)
{
    if (fs.existsSync(path.join(__dirname, "./locales/", app.getLocale() + '.json')))
    {
        loadedLanguage = JSON.parse(fs.readFileSync(path.join(__dirname, "./locales/", app.getLocale() + '.json'), 'utf8'));
    }
    else
    {
        loadedLanguage = JSON.parse(fs.readFileSync(path.join(__dirname, "./locales/", 'en.json'), 'utf8'));
    }
}