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
                    <div project-id="${element.ID}" class="font-weight-bolder" id="navbarDropdown" role="button" aria-haspopup="true" aria-expanded="false">${element.ProjectProps.ProjectName}</div>
                        <ul project-id="${element.ID}">
                            <li project-id="${element.ID}">
                                <div project-id="${element.ID}" class="small mb-1">Company name: ${element.ProjectProps.CompanyName}</div>
                            </li>
                            <li project-id="${element.ID}">
                                <div project-id="${element.ID}" class="small mb-1">Project manager: ${element.ProjectProps.ProjectManager}</div>
                            </li>
                        </ul>
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
                                var project_id = evt.target.getAttribute("project-id");
                                var instance_id = evt.target.getAttribute("instance-id");
                                var xhttp = new XMLHttpRequest();
                                xhttp.onloadend = function () {
                                    if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
                                        var token = JSON.parse(this.responseText).body;
                                        var win = window.open(`ssh-client.html?access=${JSON.parse(window.localStorage.getItem('Auth')).AccessToken}&token=${token}`, "Title", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=800,height=600");
                                    }
                                    else {
                                        console.log(this);
                                    }
                                }
                                xhttp.open("GET", `https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/sshconnect?projectid=${project_id}&instanceid=${instance_id}`);
                                xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
                                xhttp.send();
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
                    xhttp.open("GET", `https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/listprojectinstances?id=${projectID}`, true);
                    xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
                    xhttp.send();
                });
            }
            else if(this.status == 401){
                reAuth();
            }
            else if (this.status == 200 && JSON.parse(this.responseText).statusCode == 204){
                $("#project-list").html("You are not assigned to any projects. Please contact your administrator.")
            }
            else{
                console.log(this);
            }
        };
        xhttp.open("GET", "https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/listprojects", true);
        xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
        xhttp.send();
    }
    catch (err) {
        console.log(err);
        window.location.replace('login.html');
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
                window.location.replace('login.html');
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
            window.location.replace('login.html');
        }
    };
    xhttp.open("POST", "https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/reauth", true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(data);
}