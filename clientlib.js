console.log("init");

function InjectScript(path, loop) {
    // this function injects a script onto the page and returns the data that the script returns
    let datareturn;
    let fDataReturn = function(e) {
        datareturn = ScriptEventChild(e.detail)
    };
    let script = document.createElement('script');
    let string = 'setInterval(function() { var data = TEXTHERE; document.dispatchEvent(new CustomEvent("InjectEvent", {detail: data})); console.log(data) }, 1000);';
    string = string.replace('TEXTHERE', path); // replaces TEXTHERE with the path
    script.textContent = string;
    (document.head || document.documentElement).appendChild(script);
    document.addEventListener('InjectEvent', fDataReturn);
    script.parentNode.removeChild(script);
    document.removeEventListener('InjectEvent', fDataReturn);
    return datareturn;
    //if (loop == false) {
    
    //    script.parentNode.removeChild(script);
    //    document.removeEventListener('InjectEvent', fDataReturn);
    //    return datareturn;
    //}
    
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
    return InjectScript('kiwi.state.getSettings("settings")', false)
}

function CommandListener() {
    return InjectScript('window.kiwi.on("input.command.test", console.log("TEST"))')
}

function GetLatestCommand() { // get the latest run command
    var HistoryNum = InjectScript('window.kiwi.state.getBufferByName(1, "#ratchat").input_history_pos', false)
    var string = 'window.kiwi.input_history[HistoryNum]';
    string = string.replace('HistoryNum', (HistoryNum-1)); // replace HistoryNum with the number. -1 to HistoryNum because it starts at 0
    return InjectScript(string, false)
}

function GetLayout() {
    return InjectScript('kiwi.state.getSetting("settings.buffers.messageLayout")', false)
}

function GetVersion() {
    return InjectScript('kiwi.version', false)
}

function GetMessages(channel, length) {
    let string = 'kiwi.state.getBufferByName(1, "CHANNEL").messagesObj.messages[LENGTH].message';
    string = string.replace('CHANNEL', channel);
    string = string.replace('LENGTH', length);
    return InjectScript(string, false)
}

function GetLength(channel, length) {
    let string = 'window.kiwi.state.getBufferByName(1, "CHANNEL").messagesObj.messages.length';
    string = string.replace('CHANNEL', channel);
    string = string.replace('LENGTH', length);
    return InjectScript(string, false)
}

function GetTime(channel, length) {
    let string = 'kiwi.state.getBufferByName(1, "CHANNEL").messagesObj.messages[LENGTH].time';
    string = string.replace('CHANNEL', channel);
    string = string.replace('LENGTH', length);
    return InjectScript(string, false)
}

window.ClientLib = ClientLib;