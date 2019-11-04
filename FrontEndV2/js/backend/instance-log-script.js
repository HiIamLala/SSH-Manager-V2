var table;
Date.prototype.toManualString = function(){
    let d = this;
    return (d.getDate()<10?"0"+d.getDate():d.getDate())  + "/" + ((d.getMonth()+1)<10?"0"+(d.getMonth()+1):(d.getMonth()+1)) + "/" + d.getFullYear() + " " +
    (d.getHours()<10?"0"+d.getHours():d.getHours()) + ":" + (d.getMinutes()<10?"0"+d.getMinutes():d.getMinutes()) + ":" + (d.getSeconds()<10?"0"+d.getSeconds():d.getSeconds());
}
$(document).ready(function () {
    initProjectDetail();
    initInstanceDetail();
    initLogList();
    $.fn.dataTable.ext.search.push(
        function (settings, data, dataIndex) {
            var min = new Date($('#min').val());
            var max = new Date($('#max').val());
            var startDate = new Date(parseInt(data[0].split(' ')[0].split('/')[2]),parseInt(data[0].split(' ')[0].split('/')[1])-1,parseInt(data[0].split(' ')[0].split('/')[0]),parseInt(data[0].split(' ')[1].split(':')[0]),parseInt(data[0].split(' ')[1].split(':')[1]),parseInt(data[0].split(' ')[1].split(':')[2]));
            if (min == "Invalid Date" && max == "Invalid Date") return true;
            if (min == "Invalid Date" && startDate <= max) return true;
            if (max == "Invalid Date" && startDate >= min) return true;
            if (startDate <= max && startDate >= min) return true;
            return false;
        }
    );
});

function reAuth(){
    $('#loader').fadeIn(500);
    var Auth = JSON.parse(window.localStorage.getItem("Auth"));
    var xhttp = new XMLHttpRequest();
    var data = JSON.stringify({ "username": Auth.username, "refreshToken": Auth.RefreshToken });
    xhttp.onloadend = function () {
        if (this.status == 200) {
        var result = JSON.parse(this.responseText);
        if (result.errorType) {
            window.localStorage.removeItem('Auth');
            window.location.href = ('login.html');
        }
        else {
            var auth = result.body.AuthenticationResult;
            auth.username = Auth.username;
            auth.timeAcquired = new Date().getTime();
            window.localStorage.setItem('Auth', JSON.stringify(auth));
            window.location.reload();
        }
        }
        else {
            window.localStorage.removeItem('Auth');
            window.location.href = ('login.html');
        }
    };
    xhttp.open("POST", BackEndPoint+"/reauth", true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(data);
}

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

function initProjectDetail(){
    var xhttp = new XMLHttpRequest();
    xhttp.onloadend = function () {
        if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
            var result = JSON.parse(this.responseText).body;
            var Auth = JSON.parse(window.localStorage.getItem("Auth"));
            if (Auth.isAdmin || Auth.username == result.ProjectManager) {
                $('#del-project').css('display', 'block');
                $('#mod-project').css('display','block');
                $('#modify-users-project').css('display', 'block');
            }
            
            $('#project-name').html(`Project ${result.ProjectName}`);
            $('#project-detail').html(`
                <ul>
                    <li>
                        Company name: ${result.CompanyName}
                    </li>
                    <li>
                        Project manager: ${result.ProjectManager}
                    </li>
                <ul>
            `);
        }
        else {
            reAuth();
        }
    };
    xhttp.open('GET', BackEndPoint+'/projectdetail?id=' + parseURLParams(window.location.href).projectid, true);
    xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
    xhttp.send();
}

function initInstanceDetail() {
    projectID = parseURLParams(window.location.href).projectid;
    instanceID = parseURLParams(window.location.href).instanceid;
    var xhttp = new XMLHttpRequest();
    xhttp.onloadend = function(){
        if(this.status == 200 && JSON.parse(this.responseText).statusCode == 200){
            var result = JSON.parse(this.responseText).body;
            $('#instance-name').html(`Instance name: ${result.InstanceName}`);
            $('#instance-detail').html(`
                <ul>
                    <li>
                        IP address: ${result.IPAddress}
                    </li>
                    <li>
                        ARN: ${result.ARN}
                    </li>
                <ul>
            `);
        }
        else if(JSON.parse(this.responseText).statusCode == 403){
            window.history.back();
        }
        else if(this.status == 401){
            reAuth();
        }
        else{
            noti(new Date().getTime(),`<font color="red">Error</font>`,this.responseText);
        }
    }
    xhttp.open("GET",BackEndPoint+`/getinstancedetail?projectid=${projectID}&instanceid=${instanceID}`,true);
    xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
    xhttp.send();
} 

function initLogList(){
    var xhttp = new XMLHttpRequest();
    xhttp.onloadend = function () {
        if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
            if(Object.keys(JSON.parse(this.responseText).body).length > 0){
                var projectID = parseURLParams(window.location.href).projectid;
                var instanceID = parseURLParams(window.location.href).instanceid;
                $("#dataTable-body").html("");
                var result = JSON.parse(this.responseText).body[projectID[0]][instanceID[0]];
                var log_list = [];
                if (Object.keys(result).length > 0) {
                    Object.keys(result).forEach(user => {
                        Object.keys(result[user]).forEach(log=>{
                            var size = result[user][log].size;
                            if(result[user][log].size  > 1024*1024){
                                size = (parseInt(result[user][log].size) / (1024*1024)).toFixed(2) + " MB";
                            }
                            else if(result[user][log].size  > 1024){
                                size = (parseInt(result[user][log].size) / 1024).toFixed(2) + " KB";
                            }
                            else {
                                size += " Byte";
                            }
                            log_list.push([new Date(log).toManualString(), user, result[user][log].name, size]);
                        })
                    });
                    if ($.fn.dataTable.isDataTable('#dataTable')) {
                        table.destroy();
                    }
                    table = $('#dataTable').DataTable({
                        data: log_list,
                        "columnDefs": [
                            {
                                "targets": -1,
                                "data": null,
                                "defaultContent": `<button type="button" class="btn btn-primary" data-toggle="modal" data-target="#myModal">Show Log</button>`
                            },
                            {
                                type: 'date-euro', targets: 0 
                            },
                            {
                                type: 'file-size', targets: 3
                            }
                        ],
                    });
                }
                else {
                    $('#dataTable-body').html(`
                    <tr>
                        <td colspan="5">
                            This instance doesn't has any ssh session yet.
                        </td>
                    </tr>
                    `);
                }
            }
            else{
                $('#dataTable-body').html(`
                    <tr>
                        <td colspan="5">
                            This instance doesn't has any ssh session yet.
                        </td>
                    </tr>
                    `);
            }
        }
        else if (JSON.parse(this.responseText).statusCode == 403) {
            noti(new Date().getTime(), `<font color="red">Forbidden</font>`, "You don't have permission");
        }
        else if (this.status == 401) {
            reAuth();
        }
        else {
            noti(new Date().getTime(), `<font color="red">Error</font>`, this.responseText);
        }
    };
    xhttp.open('GET', BackEndPoint+`/listinstancelog?projectid=${parseURLParams(window.location.href).projectid}&instanceid=${parseURLParams(window.location.href).instanceid}`, true);
    xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
    xhttp.send();
    $('#dataTable tbody').unbind();
    $('#dataTable tbody').on('click', 'button', function () {
        var projectID = parseURLParams(window.location.href).projectid;
        var instanceID = parseURLParams(window.location.href).instanceid;
        var username = $(this).parents('tr')["0"].cells["1"].innerText;
        var logname = $(this).parents('tr')["0"].cells["2"].innerText;
        window.open(`ssh-log.html?projectid=${projectID}&instanceid=${instanceID}&username=${username}&logname=${logname}`, "_blank", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=800,height=600");
    });
}

function noti(id, header, content) {
    $("#noti-holder").append(`<div id="${id}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header">
            <strong class="mr-auto">${header}</strong>
            <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
        <div class="toast-body">
            ${content}.
        </div>
    </div>`
    );
    $(`#${id}`).toast({delay:10000});
    $(`#${id}`).toast("show");
}

function millis2HumanReadable(check){
    let now = new Date();
    let diff = now.getTime() - check.getTime();
    if(diff<2000)
        return "Recently"
    else if(diff<60000)
        return parseInt(diff/1000) + " seconds ago";
    else if(diff<3600000)
        return parseInt(diff/60000) + " minutes ago";
    else if(diff<86400000)
        return parseInt(diff/3600000) + " hours ago";
    else
        return parseInt(diff/86400000) + " days ago";
}