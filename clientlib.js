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
    GetLength: GetLength,
    GetMessages: GetMessages


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

function GetMessages(channel, amount, Filter=true) { // like GetMessage, but gets x amount of messages
    // Filter is a boolean that filters out messages that are caused by commands being run. such as "-"
    MessagesArray = [];
    c = GetMessagesAmount(channel); // get the amount of messages in the channel
    c = c - 1; // subtract 1 from the amount of messages
    if (c < amount) { // if there are less than 5 messages, get the amount of messages available
        amount = c;
    }
    for (let i = 0; i <= amount; i++) { // loop through the amount of messages
        temp = GetMessage(channel, i)
        if (temp == "-") { // if the message is a command, skip it
            continue;
        }
        MessagesArray.push(temp); // get the message and push it to the array
    }
    return MessagesArray; // return the array
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
    if (command == "/messages") {

        //GlobalInt +=1;
        MessagesArray = GetMessages(ActiveChannel, 5);
        for (let i = 0; i < (MessagesArray.length); i++) {
            LocalEcho(("Replay: " + MessagesArray[i]));
        }
        return "Messages command has been run";
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

window.ClientLib = ClientLib;