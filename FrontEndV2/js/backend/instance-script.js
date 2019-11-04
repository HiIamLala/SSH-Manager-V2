$(document).ready(function () {
    try {
        if(JSON.parse(window.localStorage.getItem("Auth")).isAdmin){
            $('#instance-preload').css("display", "block");
            var xhttp = new XMLHttpRequest();
            xhttp.onloadend = function () {
                $('#instance-preload').css("display", "none");
                if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
                    $("#dataTable-body").html("");
                    var result = JSON.parse(this.responseText).body;
                    var instance_list = [];
                    result.forEach(element => {
                        Object.keys(element.Instances).forEach(instance => {
                            instance_list.push([element.ID, element.ProjectProps.ProjectName, instance, element.Instances[instance].InstanceProps.InstanceName, element.Instances[instance].InstanceProps.IPAddress]);
                        })
                    });
                    $('#dataTable').DataTable({
                        data: instance_list,
                        "columnDefs": [{
                            "targets": -1,
                            "data": null,
                            "defaultContent": `<button id="project-more-info" type="button" class="btn btn-primary" data-toggle="modal" data-target="#myModal">Modify</button>`
                        },
                        {
                            "targets": -2,
                            "data": null,
                            "defaultContent": `<button id="project-more-info" type="button" class="btn btn-primary" data-toggle="modal" data-target="#myModal">Show Log</button>`
                        }]
                    });
                    $('#dataTable tbody').on('click', 'button', function () {
                        var projectID = $(this).parents('tr')["0"].cells["0"].innerText;
                        var instanceID = $(this).parents('tr')["0"].cells["2"].innerText;
                        if(event.target.innerText == "Modify"){
                            $("#instance-user-preload").css("display","block");
                            var xhttp = new XMLHttpRequest();
                            xhttp.onloadend = function(){
                                if(this.status == 200 && JSON.parse(this.responseText).statusCode == 200){
                                    $("#modify-instance-project").val(projectID);
                                    $("#modify-instance-id").val(instanceID);
                                    getlistuserofproject(projectID);
                                    $('#confirm-modify-instance').html("Update");
                                    $('#confirm-modify-instance').removeClass("btn-danger");
                                    $('#confirm-modify-instance').prop('disabled', false);
                                    $('#wrapper').addClass('blur');
                                    $('#modify-instance-panel').fadeIn(1000);
                                    var result = JSON.parse(this.responseText).body;
                                    $("#modify-instance-name").val(result.InstanceName);
                                    $("#modify-instance-ip").val(result.IPAddress);
                                    $("#modify-instance-arn").val(result.ARN);
                                    $("#modify-instance-ssh-user").val(result.InstanceUser);
                                }
                                else if(JSON.parse(this.responseText).statusCode == 403){
                                    noti(new Date().getTime(),`<font color="red">Forbidden</font>`,"You don't have permission on any instance");
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
                        else{
                            window.location.href = (`instance-log.html?projectid=${projectID}&instanceid=${instanceID}`);
                        }
                    });
                }
                else {
                    noti(new Date().getTime(),`<font color="red">Forbidden</font>`,"You don't have permission on any instance");
                }
            };
            xhttp.open("GET", BackEndPoint+"/listallinstances", true);
            xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
            xhttp.send();
            $("#confirm-modify-instance").on('click',function(){
                var xhttp = new XMLHttpRequest();
                var users = [];
                $('#instance-list-user-data').find(':checked').each((index,element)=>{
                    users.push(element.getAttribute('username'));
                });
                var data = JSON.stringify({
                    "projectID": parseURLParams(window.location.href).id,
                    "instanceID": $("#modify-instance-id").val(),
                    "users": users
                })
                xhttp.onloadend = function(){
                    if(this.status == 200 && JSON.parse(this.responseText).statusCode == 200){
                        modifyInstanceProps();
                    }
                    else if(JSON.parse(this.responseText).statusCode == 403){
                        noti(new Date().getTime(),`<font color="red">Forbidden</font>`,"You don't have permission on this instance");
                    }
                    else if(this.status == 401){
                        reAuth();
                    }
                    else{
                        noti(new Date().getTime(),`<font color="red">Error</font>`,this.responseText);
                    }
                }
                xhttp.open('POST',BackEndPoint+'/updateinstanceusers',true);
                xhttp.setRequestHeader("Content-Type", "application/json");
                xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
                xhttp.send(data);
            });
        }
        else{
            window.location.href = ('access-denied.html');
        }
    }
    catch (err) {
        console.log(err);
        //window.location.href = ('login.html');
    }
});

function getlistuserofproject(projectID){
    $("#instance-list-user-data").css("display","none");
    $("#instance-list-user-data").html("");
    var xhttp = new XMLHttpRequest();
    xhttp.onloadend = function(){
        if(this.status==200 && JSON.parse(this.responseText).statusCode==200) {
            function createUser(user_name){
                $("#instance-list-user-data").append(`
                <span class="list-wrap">
                    <input type="checkbox" id="instance-user-${user_name}" username="${user_name}"/>
                    <label for="instance-user-${user_name}" class="list">
                        <i class="fa fa-check"></i>
                    ${user_name}
                    </label>
                </span>`
                );
            }
            data = JSON.parse(this.responseText).body;
            Object.keys(data).forEach(element => {
                createUser(element);
            });
            getlistuserofinstance(projectID, $("#modify-instance-id").val());
        }
        else{
            reAuth();
        }
    };
    xhttp.open('GET', BackEndPoint+"/listprojectusers?id=" + projectID, true);
    xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
    xhttp.send();
}

function getlistuserofinstance(projectID, instance_id){
    var xhttp = new XMLHttpRequest();
    xhttp.onloadend = function(){
        $('#confirm-modify-instance').prop('disabled', false);
        $('#instance-user-preload').css("display","none");
        $("#instance-list-user-data").css("display","block");
        if(this.status==200 && JSON.parse(this.responseText).statusCode == 200) {
            function checkUser(user_name){
                $(`#instance-user-${user_name}`).prop('checked', true);
            }
            data = JSON.parse(this.responseText).body;
            data.forEach(element => {
                checkUser(element);
            });
        }
        else{
            reAuth();
        }
    };
    xhttp.open("GET",  BackEndPoint+`/listinstanceusers?projectid=${projectID}&instanceid=${instance_id}`, true);
    xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
    xhttp.send();
}

function reAuth() {
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