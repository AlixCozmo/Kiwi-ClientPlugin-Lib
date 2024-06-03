console.log("init");
//var GlobalInt = 0;
var ActiveChannel = "";
var lastcommandtimestamps = [];
var ActiveNetwork = ""
var CommandHistory = [];
var ConnectedNetworks = [];
var commands = [
    { command: "/test", data: "-t", description: "Executes a test operation" },
    { command: "/alias", data: "-a", description: "Manages aliases" },
    { command: "/messages", data: "-m", description: "Handles messages" },
    { command: "/deepl", data: "-d", description: "Translates text using DeepL" }
];

setInterval(function() {
    Main()
}, 1000);

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
                if (temp.startsWith("-")) {
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
    
  
    for (let i = 0; i < commands.length; i++) {
        if (temp === commands[i].data) {
            return commands[i].command; // if a command is found, return the command name
        }
    }
    return temp; // if no command is found, return the message
    
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
    let Message = "";
    c = GetMessagesAmount(channel); // get the amount of messages in the channel
    c = c - 1; // subtract 1 from the amount of messages
    if (c < amount) { // if there are less than 5 messages, get the amount of messages available
        amount = c;
    }
    for (let i = 0; i <= amount; i++) { // loop through the amount of messages
        Message = GetMessage(channel, i);
        temp2 = GetNick(channel, ActiveNetwork, i);
        if (temp2 == "*") { // if the message is a command, skip it
            continue;
        }
        MessagesArray.push(Message); // get the message and push it to the array
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

function InjectAliases() {
    // this function injects the aliases into 'Highlights' section in the settings
    const aliases = ["test", "messages", "deepl"];
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

function WriteToCommandStampHistory(stamp, lastcommandtimestamps) { // writes the timestamp to the history
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
    if (command == "/alias") {
        //GlobalInt +=1;
        InjectAliases();
        return "Alias command has been run";
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

function InjectAliases() {
    // this function injects the aliases into the page
    let string = "kiwi.state.exportState()"
    let state = InjectScript(string, false, "aliasevent", false, false);
    state = JSON.parse(state);
    oldalias = state.user_settings.aliases;
    if (oldalias == undefined) {
        oldalias = "# General aliases\n/p /part $1+\n/me /action $destination $1+\n/j /join $1+\n/q /query $1+\n/w /whois $1+\n/raw /quote $1+\n/connect /server $1+\n/cycle $channel? /lines /part $channel | /join $channel\n/active /back $1+\n/umode /mode $nick $1+\n\n# Op related aliases\n/op /quote mode $channel +o $1+\n/deop /quote mode $channel -o $1+\n/hop /quote mode $channel +h $1+\n/dehop /quote mode $channel -h $1+\n/voice /quote mode $channel +v $1+\n/devoice /quote mode $channel -v $1+\n/k /kick $channel $1+\n/bans /mode $channel +b\n/ban /quote mode $channel +b $1+\n/unban /quote mode $channel -b $1+\n\n# Misc aliases\n/slap /me slaps $1 around a bit with a large trout\n/tick /msg $channel ✔"
        // if there are no aliases, set the default aliases
    }
    
    for (let i = 0; i < commands.length; i++) { // loop through the commands
        if (oldalias.includes(commands[i].command)) {
            continue; // if the command is already in the aliases, skip it
        }
        oldalias += "\n";
        oldalias += commands[i].command; // add the command name to the aliases
        oldalias += " /echo "; // add a space after the command
        oldalias += commands[i].data; // add the command data to the aliases
    }
    
    state.user_settings.aliases = oldalias; // set the aliases to the new aliases
    let modifiedState = JSON.stringify(state); // convert the state to a string
    string = "kiwi.state.importState('JSON')"
    string = string.replace('JSON', modifiedState); // replace JSON with the modified state
    string = string.replaceAll("\\n", "\\\\n"); // replace newlines with escaped newlines
    return InjectScript(string, false, "aliasevent", false, true); // inject the aliases
    // how do i kill myself in the most painless way possible lmao 
}

window.ClientLib = ClientLib;