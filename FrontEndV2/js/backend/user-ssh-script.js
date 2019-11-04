$(document).ready(function () {
    try {
        $('#project-preload').css("display", "block");
        var xhttp = new XMLHttpRequest();
        xhttp.onloadend = function () {
            $('#project-preload')
            ;
            if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
                $("#project-list").html("");
                var result = JSON.parse(this.responseText).body;
                var list_project = [];
                result.forEach(element => {
                    $("#project-list").append(`
                    <nav style="border-radius: 5px;" id="project-${element.ID}" project-id="${element.ID}" class="load-instances project-item navbar navbar-expand navbar-light bg-light mb-4">
                        <div class="row" style="width:100%" project-id="${element.ID}">
                            <div class="col-lg-6" project-id="${element.ID}">
                                <div project-id="${element.ID}" class="font-weight-bolder" id="navbarDropdown" role="button" aria-haspopup="true" aria-expanded="false">${element.ProjectProps.ProjectName}</div>
                            </div>
                            <div class="col-lg-6" project-id="${element.ID}">    
                                <ul project-id="${element.ID}">
                                    <li project-id="${element.ID}">
                                        <div project-id="${element.ID}" class="small mb-1">Company name: ${element.ProjectProps.CompanyName}</div>
                                    </li>
                                    <li project-id="${element.ID}">
                                        <div project-id="${element.ID}" class="small mb-1">Project manager: ${element.ProjectProps.ProjectManager}</div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </nav>
                    `);
                    list_project.push(document.getElementById(`project-${element.ID}`));
                });
                toggleHandler(list_project);
                $(".load-instances").click(evt => {
                    $('#instance-table').html("");
                    $('#instance-preload').css("display", "block");
                    var projectID = $(evt.target).attr("project-id");
                    var xhttp = new XMLHttpRequest();
                    xhttp.onloadend = function () {
                        $('#instance-preload').css("display", "none");
                        if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
                            var result = JSON.parse(this.responseText).body;
                            if (Object.keys(result).length > 0) {
                                Object.keys(result).forEach(ele => {
                                    $('#instance-table').append(`
                                        <tr>
                                            <td>${ele}</td>
                                            <td>${result[ele].InstanceProps.InstanceName}</td>
                                            <td>${result[ele].InstanceProps.IPAddress}</td>
                                            <td>
                                                <button project-id="${projectID}" instance-id="${ele}" type="button" class="ssh btn btn-primary connect-butt">Connect</button>
                                            </td>
                                        </tr>
                                    `)
                                });
                            }
                            else {
                                $('#instance-table').html(`
                                <tr>
                                    <td colspan="4">
                                        You are not assigned to any instances. Please contact your administrator.
                                    </td>
                                </tr>
                                `);
                            }
                            $('.ssh').click(evt => {
                                if(JSON.parse(window.localStorage.getItem("Auth")).isAdmin){
                                    var token = `${new Date().getTime()}@${JSON.parse(window.localStorage.getItem("Auth")).username}@${evt.target.getAttribute("project-id")}@${evt.target.getAttribute("instance-id")}`
                                    window.open(`ssh-client.html?access=${JSON.parse(window.localStorage.getItem('Auth')).AccessToken}&token=${token}`, "_blank", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=800,height=600");
                                }
                                else{
                                    var project_id = evt.target.getAttribute("project-id");
                                    var instance_id = evt.target.getAttribute("instance-id");
                                    var xhttp = new XMLHttpRequest();
                                    xhttp.onloadend = function () {
                                        if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
                                            var token = JSON.parse(this.responseText).body;
                                            window.open(`ssh-client.html?access=${JSON.parse(window.localStorage.getItem('Auth')).AccessToken}&token=${token}`, "_blank", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=800,height=600");
                                        }
                                        else if(this.status == 401){
                                            reAuth();
                                        }
                                        else{
                                            noti(new Date().getTime(),"Error","Can't contact to Server. Contact administrator for more information")
                                        }
                                    }
                                    xhttp.open("GET", BackEndPoint+`/sshconnect?projectid=${project_id}&instanceid=${instance_id}`);
                                    xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
                                    xhttp.send();
                                }
                            })
                        }
                        else if (JSON.parse(this.responseText).statusCode == 204) {
                            $('#instance-table').html(`
                            <tr>
                                <td colspan="4">
                                    You are not assigned to any instances. Please contact your administrator.
                                </td>
                            </tr>
                            `);
                        }
                        else if(this.status == 401){
                            reAuth();
                        }
                        else{
                            console.log(this);
                        }
                    };
                    xhttp.open("GET", BackEndPoint+`/listprojectinstances?id=${projectID}`, true);
                    xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
                    xhttp.send();
                });
            }
            else if (this.status == 200 && JSON.parse(this.responseText).statusCode == 204){
                $("#project-list").html("You are not assigned to any projects. Please contact your administrator.")
            }
            else{
                reAuth();
            }
        };
        xhttp.open("GET", BackEndPoint+"/listprojects", true);
        xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
        xhttp.send();
    }
    catch (err) {
        console.log(err);
        window.location.href = ('login.html');
    }
});

var toggleHandler = list => {
    Array.from(list).forEach(ele => {
        ele.onclick = evt => {
            Array.from(list).forEach(ele2 => {
                ele2.classList.remove("active");
            });
            ele.classList.add("active");
        };
    });
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