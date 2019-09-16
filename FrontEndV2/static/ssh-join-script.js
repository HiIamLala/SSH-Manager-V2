var term;
var socket;
var session;
document.addEventListener("DOMContentLoaded", function(){
    Terminal.applyAddon(fit);
    var terminalContainer = document.getElementById('terminal');
    term = new Terminal({
        cursorBlink: true ,
        theme: {
            background: '#121212'
        },
    });
    term.open(terminalContainer);
    window.onresize = function(event) {
        term.fit();
        socket.emit('setsize',{rows:term.rows,cols:term.cols});
    };
    socket = io.connect("http://35.198.208.93:12345");
    socket.on('connect', function () {
        document.getElementById('session').addEventListener("keyup", function(event) {
            if (event.keyCode === 13) {
                document.getElementById('terminal').classList.remove('blur');
                document.getElementById('session').blur();
                document.getElementById('session-container').style.display = "none";
                socket.emit("join_ssh_session",document.getElementById('session').value);
            }
        });
        term.write('\r\n*** Connected to backend***\r\n');
        term.fit();
        socket.emit('setsize',{rows:term.rows,cols:term.cols});
        socket.on('session',function(data){
            session = data;
            console.log(`This session id: ${data}`);
        });
        
        // Browser -> Backend
        term.on('data', function (data) {
            socket.emit('data', data);
        });
    
        // Backend -> Browser
        socket.on('data', function (data) {
            term.write(data);
        });
    
        socket.on('disconnect', function () {
            term.write('\r\n*** Disconnected from backend***\r\n');
        });
    });
});

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
