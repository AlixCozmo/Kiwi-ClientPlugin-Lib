console.log("init");

function InjectScript(path, loop, eventname, listener=false) {
    // this function injects a script onto the page and returns the data that the script returns
    let datareturn;
    let fDataReturn = function(e) {
        datareturn = ScriptEventChild(e.detail)
    };
    let script = document.createElement('script');
    if (listener == false) {
        if (loop == true) {
            string = 'setInterval(function() { var data = TEXTHERE; document.dispatchEvent(new CustomEvent("EVENTNAME", {detail: data})); console.log(data) }, 1000);';
        }
        else {
            string = 'var data = TEXTHERE; document.dispatchEvent(new CustomEvent("EVENTNAME", {detail: data})); console.log(data)';
        }
    }
    else {
        if (loop == true) {
            string = 'setInterval(function() { var data = window.kiwi.on("TEXTHERE", document.dispatchEvent(new CustomEvent("EVENTNAME", {detail: data}))); console.log(data) }, 1000);';
        }
        else {
            string = 'var data = window.kiwi.on("TEXTHERE", function() { document.dispatchEvent(new CustomEvent("EVENTNAME", {detail: data})); console.log(data) })';
        }
    }
    string = string.replace('TEXTHERE', path); // replaces TEXTHERE with the path
    string = string.replace('EVENTNAME', eventname); // replaces TEXTHERE with the path
    script.textContent = string;
    document.addEventListener(eventname, fDataReturn);
    (document.head || document.documentElement).appendChild(script);
    if (loop == false) {
        script.parentNode.removeChild(script);
        document.removeEventListener(eventname, fDataReturn);
    }
    return datareturn;
    
}

function ScriptEventChild(datareturn) {
    ReturnedData = datareturn;
    return datareturn;
}

var ClientLib = {
    GetSettings: GetSettings,
    GetLayout: GetLayout,
    GetVersion: GetVersion,
    GetMessages: GetMessages,
    GetTime: GetTime,
    GetLength: GetLength


}
function GetSettings() {
    return InjectScript('kiwi.state.getSettings("settings")', false, "settingsevent")
}

function CommandListener() {
    return InjectScript('input.command.[/test]', false, "listenerevent", true)
}

function GetLatestCommand() { // get the latest run command
    var HistoryNum = InjectScript('window.kiwi.state.getBufferByName(1, "#ratchat").input_history_pos', false, "latestcommandevent")
    var string = 'window.kiwi.state.getBufferByName(1, "#ratchat").input_history[HistoryNum]';
    string = string.replace('HistoryNum', (HistoryNum-1)); // replace HistoryNum with the number. -1 to HistoryNum because it starts at 0
    return InjectScript(string, false, "latestcommandevent")
}

function GetLayout() {
    return InjectScript('kiwi.state.getSetting("settings.buffers.messageLayout")', false, "layoutevent")
}

function GetVersion() {
    return InjectScript('kiwi.version', false, "versionevent")
}

function GetMessages(channel, index) {
    let string = 'kiwi.state.getBufferByName(1, "CHANNEL").messagesObj.messages[LENGTH].message';
    string = string.replace('CHANNEL', channel);
    string = string.replace('LENGTH', index);
    return InjectScript(string, false, "messageevent")
    //messagestring[0] = InjectMessageScript(channel, length);
    //return messagestring;
}

function GetLength(channel, length) {
    let string = 'window.kiwi.state.getBufferByName(1, "CHANNEL").messagesObj.messages.length';
    string = string.replace('CHANNEL', channel);
    string = string.replace('LENGTH', length);
    return InjectScript(string, false, "lengthevent")
}

function GetTime(channel, length) {
    let string = 'kiwi.state.getBufferByName(1, "CHANNEL").messagesObj.messages[LENGTH].time';
    string = string.replace('CHANNEL', channel);
    string = string.replace('LENGTH', length);
    return InjectScript(string, false, "timeevent")
}

window.ClientLib = ClientLib;