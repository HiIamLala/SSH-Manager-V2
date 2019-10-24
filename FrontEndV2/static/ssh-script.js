var term;
var socket;
var session;
var keyCode = {
    "\\": 28,
    "[": 27,
    "]": 29,
    "^": 30,
    "_": 31,
}

document.addEventListener("DOMContentLoaded", function(){
    //Prevent browser default key
    window.addEventListener("beforeunload", function (e) {
        var confirmationMessage = 'Are you sure to leave this SSH session?\n'
                                + 'If you want to use key combination. User Alt instead of Ctrl \n(Example: [Alt + W] instead of [Ctrl + W])';
        (e || window.event).returnValue = confirmationMessage; //Gecko + IE
        return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
    });
    var credentials = parseURLParams(window.location.href); 
    Terminal.applyAddon(fit);
    var terminalContainer = document.getElementById('terminal');
    term = new Terminal({
        cursorBlink: true ,
        theme: {
            background: '#121212',
        },
    });
    term.open(terminalContainer);
    window.onresize = function(event) {
        term.fit();
        socket.emit('setsize',{rows:term.rows,cols:term.cols});
    };
    socket = io.connect("http://3.0.94.16:12345");
    socket.emit("setup_new_connection",JSON.stringify(credentials));
    socket.on('connect', function () {
        term.write('\r\n*** Connected to backend***\r\n');
        term.fit();
        socket.emit('setsize',{rows:term.rows,cols:term.cols});
        socket.on('session',function(data){
            socket.emit('setsize',{rows:term.rows,cols:term.cols});
            session = data;
            document.getElementById('session').value = data;
            document.getElementById('session').setAttribute('session',data);
            document.getElementById('session-container').addEventListener('click',function(event){
                document.getElementById('session').value = "https://storage.googleapis.com/ssh-management/ssh-join.html?session=" + document.getElementById('session').getAttribute('session');
                document.getElementById('session').disabled=false;
                document.getElementById('session').select();
                document.execCommand('copy');
                document.getElementById('session').disabled=true;
                document.getElementById('session').value = "copied";
                setTimeout(()=>{document.getElementById('session').value = document.getElementById('session').getAttribute('session')},2000);
            });
        });

        //copy from screen
        document.getElementById('terminal').onmouseup = function(data){
            if(term.hasSelection()){
                copyStringToClipboard(term.getSelection());
                $('#copied').fadeIn(100, ()=>{
                    setTimeout(()=>{$('#copied').fadeOut(100)},1000);
                });
            }
        };

        // Browser -> Backend
        term.on('data', function (data) {
            if(event.ctrlKey || event.altKey) {
                event.preventDefault();
                event.stopPropagation();
                if(event.keyCode>=65 && event.keyCode<=91)
                    socket.emit('data', new TextDecoder("utf-8").decode(new Uint8Array([event.keyCode - 64])));
                else{
                    socket.emit('data', new TextDecoder("utf-8").decode(new Uint8Array([keyCode[event.key]])));
                }
            }
            else{
                socket.emit('data', data);
            }
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