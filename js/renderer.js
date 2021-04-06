const ipc = require('electron').ipcRenderer;
const storage = require('electron-json-storage');
const fs = require('fs');
const http = require('follow-redirects').http;
const remote = require('electron').remote;
const defaultDataPath = storage.getDefaultDataPath();
const shelljs = require('shelljs')

var mcdir = defaultDataPath + '/minecraft';
var versionsdir = mcdir + '/versions';
var clientdir = versionsdir + '/Cosmo'
var libdir = mcdir + '/libraries';
var cosmolibdir = libdir + '/com/cosmo/Cosmo/LOCAL'
const win = remote.getCurrentWindow();

// On load
createValidTreeStructure();
update();

// On ready
document.onreadystatechange = (event) => {
    if (document.readyState == "complete") {
        handleWindowControls();
    }
};

window.onbeforeunload = (event) => {
    win.removeAllListeners();
}

// Functions 
function handleWindowControls() {
    // Make minimise/maximise/restore/close buttons work when they are clicked
    document.getElementById('min-button').addEventListener("click", event => {
        ipc.send('min')
    });

    document.getElementById('max-button').addEventListener("click", event => {
        ipc.send('max')
    });

    document.getElementById('restore-button').addEventListener("click", event => {
        ipc.send('unmax')
    });

    document.getElementById('close-button').addEventListener("click", event => {
        ipc.send('close')
    });

    ipc.send('version');
    ipc.on('version-reply', (event, arg) => {
        const titlespan = document.getElementById('titlespan');
        titlespan.innerHTML = ("Cosmolauncher v" + arg);
    })
    // Toggle maximise/restore buttons when maximisation/unmaximisation occurs
    toggleMaxRestoreButtons();
    win.on('maximize', toggleMaxRestoreButtons);
    win.on('unmaximize', toggleMaxRestoreButtons);

    function toggleMaxRestoreButtons() {
        if (win.isMaximized()) {
            document.body.classList.add('maximized');
        } else {
            document.body.classList.remove('maximized');
        }
    }
}


function download(url, dest, cb) {
    var file = fs.createWriteStream(dest);
    var request = http.get(url, function (response) {
        response.pipe(file);
        file.on('finish', function () {
            file.close(cb);
        });
    });
}
function update() {
    let lastupdate;
    const timeNow = Date.now()
    const today = new Date(timeNow).toLocaleDateString()
    if (fs.existsSync(defaultDataPath + "/lastupdate.txt")) {
       lastupdate = fs.readFileSync(defaultDataPath + "/lastupdate.txt", 'utf-8');
       fs.writeFileSync(defaultDataPath + "/lastupdate.txt", today);
    } else {
        fs.writeFileSync(defaultDataPath + "/lastupdate.txt", today);
    }
    if (lastupdate != today) {
        updateClient()
    }
}
function updateClient() {
    document.addEventListener("DOMContentLoaded", function (event) {
        launchbutton = document.getElementById("launch");
        launchbutton.disabled = true;
        launchbutton.innerHTML = "Updating!";
        download("http://raw.githubusercontent.com/legendary-cookie/cosmo/main/Cosmo.json", clientdir + '/Cosmo.json', function (error) {
            if (error) throw error;
        })
        download("http://raw.githubusercontent.com/legendary-cookie/cosmo/main/Cosmo.bin", cosmolibdir + '/Cosmo-LOCAL.jar', function (error) {
            if (error) throw error;
            launchbutton.disabled = false;
            launchbutton.innerHTML = "Launch";
        })
        download("http://raw.githubusercontent.com/legendary-cookie/cosmo/main/launchwrapper-1.12.jar", libdir + '/net/minecraft/launchwrapper/1.12/launchwrapper-1.12.jar', function (error) {
            if (error) throw error;
        })
    });
}

function createValidTreeStructure() {
    if (!fs.existsSync(mcdir)) {
        fs.mkdirSync(mcdir, { recursive: true });
    }
    if (!fs.existsSync(versionsdir)) {
        fs.mkdirSync(versionsdir, { recursive: true });
    }
    if (!fs.existsSync(clientdir)) {
        fs.mkdirSync(clientdir, { recursive: true });
    }
    shelljs.mkdir('-p', cosmolibdir)
    shelljs.mkdir('-p', libdir + '/net/minecraft/launchwrapper/1.12/')
}