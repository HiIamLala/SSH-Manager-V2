var term;
var rec;
var speed = 1;
var play;
var playbar;
var current = 0;
const BackEndPoint = "https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta";

window.onkeypress = (event) => {
    event.preventDefault();
}

document.addEventListener("DOMContentLoaded", function () {
    //copy from screen
    document.getElementById('terminal').onmouseup = function(data){
        if(term.hasSelection()){
            copyStringToClipboard(term.getSelection());
            $('#copied').fadeIn(100, ()=>{
                setTimeout(()=>{$('#copied').fadeOut(100)},1000);
            });
        }
    };
    playbar = document.getElementById('play');
    document.getElementById("speed").oninput = function(){
        clearTimeout(play);
        speed = this.value/10;
        render(rec,current);
    };
    playbar.oninput = function(){
        clearTimeout(play);
        term.clear();
        term.write(rec[Math.floor(playbar.value*(rec.length-1)/100)].value);
    }
    playbar.onmouseup = function(){
        clearTimeout(play);
        term.clear();
        render(rec,playbar.value*rec.length/100);
    }
    Terminal.applyAddon(fit);
    var terminalContainer = document.getElementById('terminal');
    term = new Terminal({
        cursorBlink: true ,
        theme: {
            background: '#121212',
        },});
    term.open(terminalContainer);
    term.fit();
    window.onresize = function (event) {
        term.fit();
    };
    var projectID = parseURLParams(window.location.href).projectid;
    var instanceID = parseURLParams(window.location.href).instanceid;
    var username = parseURLParams(window.location.href).username;
    var logname = parseURLParams(window.location.href).logname;
    var log = "";
    term.write(`Receiving log (0%)...\n`);
    var xhttp = new XMLHttpRequest();
    xhttp.onloadend = function(){
        if(this.status == 200 && JSON.parse(this.responseText).statusCode == 200){
            term.reset();
            if(parseInt(JSON.parse(this.responseText).nextoffset) > parseInt(JSON.parse(this.responseText).size)) term.write(`Receiving log (100 %)...\n`);
            else term.write(`Receiving log (${(parseInt(JSON.parse(this.responseText).nextoffset) * 100 / parseInt(JSON.parse(this.responseText).size)).toFixed(2)}%)...\n`);
            log += JSON.parse(this.responseText).body;
            if(parseInt(JSON.parse(this.responseText).nextoffset)>parseInt(JSON.parse(this.responseText).size)){
                term.reset();
                rec = initLog(JSON.parse(log));
                render(rec,current);
            }
            else{
                getLogData(log,projectID,instanceID,username,logname,JSON.parse(this.responseText).nextoffset);
            }
        }
        else if(JSON.parse(this.responseText).statusCode == 403){
            term.write("Forbidden. You don't have permission to read this log");
        }
        else{
            console.log(this);
        }
    }
    xhttp.open("GET",BackEndPoint+`/getlogdata?projectid=${projectID}&instanceid=${instanceID}&username=${username}&logname=${logname}&offset=0`,true);
    xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
    xhttp.send();

    function getLogData(log,projectID,instanceID,username,logname,offset){
        var xhttp = new XMLHttpRequest();
        xhttp.onloadend = function(){
        if(this.status == 200 && JSON.parse(this.responseText).statusCode == 200){
            term.reset();
            if(parseInt(JSON.parse(this.responseText).nextoffset) > parseInt(JSON.parse(this.responseText).size)) term.write(`Receiving log (100 %)...\n`);
            else term.write(`Receiving log (${(parseInt(JSON.parse(this.responseText).nextoffset) * 100 / parseInt(JSON.parse(this.responseText).size)).toFixed(2)}%)...\n`);
            log += JSON.parse(this.responseText).body;
            if(parseInt(JSON.parse(this.responseText).nextoffset)>parseInt(JSON.parse(this.responseText).size)){
                term.reset();
                rec = initLog(JSON.parse(log));
                render(rec,current);
            }
            else{
                getLogData(log,projectID,instanceID,username,logname,JSON.parse(this.responseText).nextoffset);
            }
        }
        else if(JSON.parse(this.responseText).statusCode == 403){
            term.write("Forbidden. You don't have permission to read this log");
        }
        else{
            console.log(this);
        }
    }
    xhttp.open("GET", BackEndPoint+`/getlogdata?projectid=${projectID}&instanceid=${instanceID}&username=${username}&logname=${logname}&offset=${offset}`, true);
    xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
    xhttp.send();
    }
});

function initLog(rec){
    term.reset();
    var res = [];
    if(Array.isArray(rec)){
        rec.forEach(ele=>{
            res.push({
                "time": Object.keys(ele)[0],
                "value": ele[Object.keys(ele)[0]]
            })
        })
    }
    else{
        Object.keys(rec).forEach(time=>{
            res.push({
                "time": time,
                "value": rec[time]
            })
        })
    }
    return res;
}

function render(rec,i) {
    i = Math.floor(i);
    if(i==0){
        term.reset();
        term.write(rec[i].value);
        i++;
        playbar.value = i*100/rec.length;
        render(rec,i);
    }
    else if(i<rec.length){
        play = setTimeout(function(){
            term.write(rec[i].value);
            i++;
            current = i;
            playbar.value = i*100/rec.length;
            render(rec,i);
        },(rec[i].time-rec[i-1].time)/speed);
    }
};

function parseURLParams(url) {
    var queryStart = url.indexOf("?") + 1,
        queryEnd = url.indexOf("#") + 1 || url.length + 1,
        query = url.slice(queryStart, queryEnd - 1),
        pairs = query.replace(/\+/g, " ").split("&"),
        parms = {}, i, n, v, nv;

    if (query === url || query === "") return;

    for (i = 0; i < pairs.length; i++) {
        nv = pairs[i].split("=", 2);
        n = decodeURIComponent(nv[0]);
        v = decodeURIComponent(nv[1]);

        if (!parms.hasOwnProperty(n)) parms[n] = [];
        parms[n].push(nv.length === 2 ? v : null);
    }
    return parms;
}

function copyStringToClipboard (str) {
    var el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style = {position: 'absolute', left: '-9999px'};
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
 }