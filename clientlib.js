console.log("init");
//var GlobalInt = 0;
var ActiveChannel = ""
var lastcommandtimestamps = [];
var ActiveNetwork = ""
var ConnectedNetworks = [];
setInterval(function() {
    Main()
}, 500);

function InjectScript(path, loop, eventname, listener=false, LocalSend=false) {
    // this function injects a script onto the page and returns the data that the script returns
    let datareturn;
    let fDataReturn = function(e) {
        datareturn = ScriptEventChild(e.detail)
    };
    let script = document.createElement('script');
    if (listener == false) {
        if (loop == true) {
            string = 'setInterval(function() { var data = TEXTHERE; document.dispatchEvent(new CustomEvent("EVENTNAME", {detail: data})); }, 1000);';
        }
        else {
            string = 'var data = TEXTHERE; document.dispatchEvent(new CustomEvent("EVENTNAME", {detail: data}));';
        }
    }
    else {
        if (loop == true) {
            string = 'setInterval(function() { var data = window.kiwi.on("TEXTHERE", document.dispatchEvent(new CustomEvent("EVENTNAME", {detail: data}))); }, 1000);';
        }
        else {
            string = 'var data = window.kiwi.on("TEXTHERE", function() { document.dispatchEvent(new CustomEvent("EVENTNAME", {detail: data}));})';
        }
    }
    if (LocalSend == true) {
        string = 'TEXTHERE';
    }
    string = string.replace('TEXTHERE', path); // replaces TEXTHERE with the path
    if (LocalSend == false) {
        string = string.replace('EVENTNAME', eventname); // replaces TEXTHERE with the path
    }
    script.textContent = string;
    if (LocalSend == false) {
        document.addEventListener(eventname, fDataReturn);
    }
    (document.head || document.documentElement).appendChild(script);
    if (loop == false) {
        if (LocalSend == false) {
            script.parentNode.removeChild(script);
        }
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
    GetMessage: GetMessage,
    GetTime: GetTime,
    GetLength: GetLength


}
function GetSettings() {
    return InjectScript('kiwi.state.getSettings("settings")', false, "settingsevent")
}

function CommandListener() {
    return InjectScript('input.command.[/test]', false, "listenerevent", true)
}

function GetLatestCommand(channel, networkid) { // get the latest run command
    let i = GetMessagesAmount(channel);
    let a = i - 5;
    let found = false; // if nick has been found
    while (a < 0) { // makes sure that the loop doesn't go below 0
        a++;
    }
    for (; a < i; a++) { // loops through the last 5 messages to find the last command timestamp
        if (GetNick(channel, networkid, a) == "*") {
            currentstamp = GetTime(channel, a);
            if (CheckStampHistory(currentstamp, lastcommandtimestamps)) {
                temp = GetMessage(channel, a)
                if (temp == "-") {
                    WriteToCommandStampHistory(currentstamp, lastcommandtimestamps);
                    found = true;
                    continue
                }
            }
        }
    }
    if (!found) {
        return "No command has been run yet"; // return this message if no command is found
    }
    string = 'window.kiwi.state.getBufferByName(NETWORKID, "CHANNEL").input_history_pos'
    string = string.replace('CHANNEL', channel);
    string = string.replace('NETWORKID', ActiveNetwork);
    var HistoryNum = InjectScript(string, false, "latestcommandevent")
    //HistoryNum += GlobalInt;
    if (HistoryNum == 0) {
        return "No command has been run yet";
    }
    var string = 'window.kiwi.state.getBufferByName(NETWORKID, "CHANNEL").input_history[HistoryNum]';
    string = string.replace('CHANNEL', channel);
    string = string.replace('NETWORKID', ActiveNetwork);
    string = string.replace('HistoryNum', (HistoryNum-1)); // replace HistoryNum with the number. -1 to HistoryNum because it starts at 0
    temp = InjectScript(string, false, "latestcommandevent")
    if (temp == undefined) {
        return "No command has been run yet";
    }
    else {
        return temp;
    }
}

function GetLayout() {
    return InjectScript('kiwi.state.getSetting("settings.buffers.messageLayout")', false, "layoutevent")
}

function GetVersion() {
    return InjectScript('kiwi.version', false, "versionevent")
}

function GetMessage(channel, index) {
    let string = 'kiwi.state.getBufferByName(NETWORKID, "CHANNEL").messagesObj.messages[LENGTH].message';
    string = string.replace('CHANNEL', channel);
    string = string.replace('LENGTH', index);
    string = string.replace('NETWORKID', ActiveNetwork);
    return InjectScript(string, false, "messageevent")
    //messagestring[0] = InjectMessageScript(channel, length);
    //return messagestring;
}

function GetLength(channel, length) {
    let string = 'window.kiwi.state.getBufferByName(NETWORKID, "CHANNEL").messagesObj.messages.length';
    string = string.replace('CHANNEL', channel);
    string = string.replace('LENGTH', length);
    string = string.replace('NETWORKID', ActiveNetwork);
    return InjectScript(string, false, "lengthevent")
}

function GetMessagesAmount(channel) { // gets the amount of messages in a channel, this should 
    // preferrably be used with -1 since it starts at 0
    let string = 'window.kiwi.state.getBufferByName(NETWORKID, "CHANNEL").messagesObj.messages.length';
    string = string.replace('CHANNEL', channel);
    string = string.replace('NETWORKID', ActiveNetwork);
    return InjectScript(string, false, "lengthamountevent")
}

function GetTime(channel, length) {
    let string = 'kiwi.state.getBufferByName(NETWORKID, "CHANNEL").messagesObj.messages[LENGTH].time';
    string = string.replace('CHANNEL', channel);
    string = string.replace('LENGTH', length);
    string = string.replace('NETWORKID', ActiveNetwork);
    return InjectScript(string, false, "timeevent")
}

function GetActiveChannel() {
    let string = 'kiwi.state.getActiveBuffer().name';
    return InjectScript(string, false, "activechannelevent")
}

function GetActiveNetwork() {
    let string = 'kiwi.state.getActiveNetwork().id';
    return InjectScript(string, false, "activechannelevent")
}

function GetNick(channel, networkid, messageid) {
    let string = 'kiwi.state.getBufferByName(NETWORKID, "CHANNEL").messagesObj.messages[MESSAGEID].nick';
    string = string.replace('CHANNEL', channel);
    string = string.replace('NETWORKID', networkid);
    string = string.replace('MESSAGEID', messageid);
    temp = InjectScript(string, false, "nickevent");
    //console.log(temp);
    return temp;
}

function LocalEcho(text) { // sends a message locally
    temp = 'window.kiwi.emit("input.raw", "/echo TEXTHERE")';
    temp = temp.replace('TEXTHERE', text);
    InjectScript(temp, false, "localevent", false, true)
}

function Main() {
    ActiveNetwork = GetActiveNetwork();
    ActiveChannel = GetActiveChannel();
    // this is the main function that runs every 10 seconds
    if (ActiveChannel == "" || ActiveChannel == undefined || ActiveChannel == null) {
        console.warn("No active channels found");
        return;
    }
    //console.log("Channel: " + ActiveChannel);
    temp = GetLatestCommand(ActiveChannel, ActiveNetwork);
    temp = CommandParser(temp);
    if (temp == undefined) {
        return;
    }
    else {
        LocalEcho(temp);
    }

}

function WriteToCommandStampHistory(stamp, lastcommandtimestamps) {
    if (lastcommandtimestamps.length > 5) {
        lastcommandtimestamps.shift();
    }
    lastcommandtimestamps.push(stamp);
}

function CheckStampHistory(stamp, lastcommandtimestamps) { // returns false if the stamp is already in the history
    for (let i = 0; i < lastcommandtimestamps.length; i++) {
        if (stamp == lastcommandtimestamps[i]) {
            return false;
        }
    }
    return true;
}

function CommandParser(command) {
    // this function parses the command given to it
    if (command == "/test") {
        //GlobalInt +=1;
        return "Test command has been run";
    }
    if (command == "/deepl") {
        //GlobalInt +=1;
        return "hello!";
    }
}

function GetConnectedNetworks() {
    ConnectedNetworks = [];
    networks = InjectScript('kiwi.state.networks', false, "networkevent")
    for (let i = 0; i < networks.length; i++) {
        string = i + ".state";
        if (InjectScript(string, false, "networkevent") == "connected") {
            ConnectedNetworks.push(networks[i]);
        }
    }
}

function GrabChannels() {
    // Gets the currently active channels and places them into the activechannels array
    //console.log("grabchannels");
    let element = document.getElementsByClassName("kiwi-statebrowser-channel-name");
    //let element=document.getElementsByClassName("kiwi-statebrowser kiwi-theme-bg");
    let text = "";
    let words = "";
    activechannels.length = 0;
    // empties the array so that a bunch of same data doesn't flood the array.
    for (let elementnumber = 0; elementnumber < element.length; elementnumber++) {
        text = element[elementnumber].innerText;
        words = text.split(" ");
        for (let wordnumber = 0; wordnumber < words.length; wordnumber++) {
            //console.log("wordslength: " + words.length);
            if (words[wordnumber].startsWith("#")) {
                if (words[wordnumber].endsWith("a") || words[wordnumber].endsWith("b") || words[wordnumber].endsWith("c") || 
                words[wordnumber].endsWith("d") || words[wordnumber].endsWith("e") || words[wordnumber].endsWith("f") || 
                words[wordnumber].endsWith("g") || words[wordnumber].endsWith("h") || words[wordnumber].endsWith("i") || 
                words[wordnumber].endsWith("j") || words[wordnumber].endsWith("k") || words[wordnumber].endsWith("l") || 
                words[wordnumber].endsWith("m") || words[wordnumber].endsWith("n") || words[wordnumber].endsWith("o") || 
                words[wordnumber].endsWith("p") || words[wordnumber].endsWith("q") || words[wordnumber].endsWith("r") || 
                words[wordnumber].endsWith("s") || words[wordnumber].endsWith("t") || words[wordnumber].endsWith("u") || 
                words[wordnumber].endsWith("v") || words[wordnumber].endsWith("w") || words[wordnumber].endsWith("x") || 
                words[wordnumber].endsWith("y") || words[wordnumber].endsWith("z") || words[wordnumber].endsWith("0") || 
                words[wordnumber].endsWith("1") || words[wordnumber].endsWith("2") || words[wordnumber].endsWith("3") || 
                words[wordnumber].endsWith("4") || words[wordnumber].endsWith("5") || words[wordnumber].endsWith("6") || 
                words[wordnumber].endsWith("7") || words[wordnumber].endsWith("8") || words[wordnumber].endsWith("9")) {
                    activechannels.length = activechannels.length++;
                    activechannels.push(words[wordnumber]);
                    continue;

                }
            }
        }
    }
}

window.ClientLib = ClientLib;