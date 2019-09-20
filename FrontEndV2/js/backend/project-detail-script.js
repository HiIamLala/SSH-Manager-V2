var table;
$(document).ready(function () {
    try {
        var Auth = JSON.parse(window.localStorage.getItem("Auth"));
        initProjectDetail();
        $('#create-instance').click(function () {
            document.getElementById("modify-instance-form").reset();
            $('#confirm-create-instance').html("Create");
            $('#confirm-create-instance').removeClass("btn-danger");
            $('#confirm-create-instance').prop('disabled', false);
            $('#wrapper').addClass('blur');
            $('#create-instance-panel').fadeIn(1000);
            $("form").on("change", ".file-upload-field", function () {
                $(this).parent(".file-upload-wrapper").attr("data-text", $(this).val().replace(/.*(\/|\\)/, ''));
            });
        });
        $('#confirm-create-instance').click(function () {
            var reader = new FileReader();
            reader.onload = function (e) {
                var key = reader.result;
                if ($("#create-instance-name").val() && $("#create-instance-ip").val() && $("#create-instance-arn").val() && $('#create-instance-ssh-user').val()) {
                    $('#confirm-create-instance').attr("disabled", "true");
                    var xhttp = new XMLHttpRequest();
                    var data = JSON.stringify({
                        "ID": parseInt(parseURLParams(window.location.href).id),
                        "instance_name": $("#create-instance-name").val(),
                        "instance_arn": $("#create-instance-arn").val(),
                        "instance_ip": $("#create-instance-ip").val(),
                        "instance_ssh": key,
                        "instance_user": $('#create-instance-ssh-user').val()
                    });
                    xhttp.onloadend = function () {
                        if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
                            noti(new Date().getTime(), "Success", "Create instance success<br>Instance ID: " + JSON.parse(this.responseText).body);
                            $('#wrapper').removeClass('blur');
                            $('#create-instance-panel').css('display', 'none');
                            initProjectInstances();
                        }
                        else {
                            $('#confirm-create-instance').html("Fail");
                            $('#confirm-create-instance').addClass("btn-danger");
                            $('#confirm-create-instance').attr("disabled", "true");
                        }
                    };
                    xhttp.open("POST", "https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/createinstance", true);
                    xhttp.setRequestHeader("Content-Type", "application/json");
                    xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
                    xhttp.send(data);
                } else {
                    window.alert("You have to fill all the field");
                }
            }
            reader.readAsText($('#create-instance-ssh-key')[0].files[0]);
        });
        $("#mod-project").on('click', function () {
            var xhttp = new XMLHttpRequest();
            xhttp.onloadend = function () {
                if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
                    var result = JSON.parse(this.responseText).body;
                    getlistuser(result.ProjectManager);
                    var Auth = JSON.parse(window.localStorage.getItem("Auth"));
                    if (Auth.isAdmin) {
                        $('#del-project').fadeIn(1000);
                        $('#mod-project').css('display', 'block');
                        $('#modify-users-project').fadeIn(1000);
                    }
                    $("#modify-project-company-name").val(result.CompanyName);
                    $("#modify-project-name").val(result.ProjectName);
                    $('#confirm-modify-project').html("Modify");
                    $('#confirm-modify-project').removeClass("btn-danger");
                    $('#confirm-modify-project').prop('disabled', false);
                    $('#wrapper').addClass('blur');
                    $('#modify-project').fadeIn(1000);
                }
                else {
                    reAuth();
                }
            };
            xhttp.open('GET', 'https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/projectdetail?id=' + parseURLParams(window.location.href).id, true);
            xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
            xhttp.send();
        });
        $('#confirm-modify-project').on('click', function () {
            var xhttp = new XMLHttpRequest();
            var data = JSON.stringify({
                "ID": parseInt(parseURLParams(window.location.href).id),
                "company_name": $("#modify-project-company-name").val(),
                "project_name": $("#modify-project-name").val(),
                "project_manager": $("#project-modify-manager").val()
            });
            xhttp.onloadend = function () {
                if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
                    noti(new Date().getTime(), "Success", "Modify project successfuly")
                    $('#wrapper').removeClass('blur');
                    $('#modify-project').fadeOut(1000, () => { $('#wrapper').removeClass('blur'); });
                    initProjectDetail();
                }
                else if (this.status == 200 && JSON.parse(this.responseText).statusCode == 403) {
                    noti(new Date().getTime(), `<font color="red">Forbidden</font>`, "You don't have permission to modify this project");
                    $("#mod-project").fadeOut(1000, () => { $('#wrapper').removeClass('blur'); });
                }
                else if (this.status == 401) {
                    reAuth();
                }
                else {
                    noti(new Date().getTime(), `<font color="red">Fail</font>`, this.responseText);
                }
            }
            xhttp.open("POST", "https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/update-project-detail", true);
            xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
            xhttp.setRequestHeader("Content-Type", "application/json");
            xhttp.send(data);
        });
        $('#del-project').click(function () {
            if (window.confirm("Are you sure want to delete this project? This can NOT be undone!")) {
                var xhttp = new XMLHttpRequest();
                xhttp.onloadend = function () {
                    if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
                        window.location.replace("admin-projects.html");
                    }
                    else {
                        noti(new Date().getTime(), `<font color="red">Fail</font>`, `Delete project ${parseURLParams(window.location.href).id} fail <br> ${JSON.parse(this.responseText).body}`);
                    }
                }
                xhttp.open("GET", "https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/removeproject?id=" + parseURLParams(window.location.href).id, true);
                xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
                xhttp.send();
            }
        });
        $('#dataTable tbody').on('click', 'button', function () {
            $("#instance-user-preload").css("display", "block");
            var projectID = parseURLParams(window.location.href).id;
            var instanceID = $(this).parents('tr')["0"].cells["0"].innerText;
            if (event.target.innerHTML == "Modify") {
                var xhttp = new XMLHttpRequest();
                xhttp.onloadend = function () {
                    if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
                        document.getElementById("modify-instance-form").reset();
                        $("#modify-instance-id").val(instanceID);
                        getlistuserofproject(projectID, instanceID);
                        $('#confirm-modify-instance').html("Update");
                        $('#confirm-modify-instance').removeClass("btn-danger");
                        $('#confirm-modify-instance').prop('disabled', false);
                        var result = JSON.parse(this.responseText).body;
                        $("#modify-instance-name").val(result.InstanceName);
                        $("#modify-instance-ip").val(result.IPAddress);
                        $("#modify-instance-arn").val(result.ARN);
                        $("#modify-instance-ssh-user").val(result.InstanceUser);
                        $('#modify-instance-panel').fadeIn(1000);
                        $('#wrapper').addClass('blur');
                    }
                    else if (JSON.parse(this.responseText).statusCode == 403) {
                        noti(new Date().getTime(), `<font color="red">Forbidden</font>`, "You don't have permission on this instance");
                        $('#wrapper').removeClass('blur');
                        $('#modify-instance-panel').fadeOut(1000, () => { $('#wrapper').removeClass('blur'); });
                        document.getElementById("modify-instance-form").reset();
                    }
                    else if (this.status == 401) {
                        reAuth();
                    }
                    else {
                        noti(new Date().getTime(), `<font color="red">Error</font>`, this.responseText);
                    }
                }
                xhttp.open("GET", `https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/getinstancedetail?projectid=${projectID}&instanceid=${instanceID}`, true);
                xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
                xhttp.send();
            }
            else {
                window.location.replace(`instance-log.html?projectid=${projectID}&instanceid=${instanceID}`);
            }
        });
        $("#confirm-modify-instance").on('click', function () {
            var xhttp = new XMLHttpRequest();
            var users = [];
            $('#instance-list-user-data').find(':checked').each((index, element) => {
                users.push(element.getAttribute('username'));
            });
            var data = JSON.stringify({
                "projectID": parseURLParams(window.location.href).id,
                "instanceID": $("#modify-instance-id").val(),
                "users": users
            })
            xhttp.onloadend = function () {
                if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
                    modifyInstanceProps();
                }
                else if (JSON.parse(this.responseText).statusCode == 403) {
                    noti(new Date().getTime(), `<font color="red">Forbidden</font>`, "You don't have permission on this instance");
                }
                else if (this.status == 401) {
                    reAuth();
                }
                else {
                    noti(new Date().getTime(), `<font color="red">Error</font>`, this.responseText);
                }
            }
            xhttp.open('POST', 'https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/updateinstanceusers', true);
            xhttp.setRequestHeader("Content-Type", "application/json");
            xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
            xhttp.send(data);
        });
        $('#modify-users-project').on("click", function () {
            getAllUser();
        });
        $('#delete-instance').on('click', function () {
            var xhttp = new XMLHttpRequest();
            xhttp.onloadend = function () {
                if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
                    noti(new Date().getTime(), "Success", `Deleted instance (id: ${$("#modify-instance-id").val()})`)
                    initProjectInstances();
                    $('#wrapper').removeClass('blur');
                    $('#modify-instance-panel').fadeOut(1000, () => { $('#wrapper').removeClass('blur'); });
                    document.getElementById("modify-instance-form").reset();
                }
                else if (JSON.parse(this.responseText).statusCode == 403) {
                    noti(new Date().getTime(), `<font color="red">Forbidden</font>`, "You don't have permission on this instance");
                    $('#wrapper').removeClass('blur');
                    $('#modify-instance-panel').fadeOut(1000, () => { $('#wrapper').removeClass('blur'); });
                    document.getElementById("modify-instance-form").reset();
                }
                else if (this.status == 401) {
                    reAuth();
                }
                else {
                    noti(new Date().getTime(), `<font color="red">Error</font>`, this.responseText);
                }
            }
            xhttp.open('GET', `https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/removeinstance?projectid=${parseURLParams(window.location.href).id}&instanceid=${$("#modify-instance-id").val()}`, true);
            xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
            xhttp.send();
        })
    }
    catch (err) {
        console.log(err);
        // window.location.replace("login.html");
    }
});

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

function initProjectInstances() {
    $('#instance-preload').css("display", "block");
    var xhttp = new XMLHttpRequest();
    xhttp.onloadend = function () {
        $('#instance-preload').css("display", "none");
        if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
            $("#dataTable-body").html("");
            var result = JSON.parse(this.responseText).body;
            var instance_list = [];
            if (Object.keys(result).length > 0) {
                Object.keys(result).forEach(instance => {
                    instance_list.push([instance, result[instance].InstanceProps.InstanceName, result[instance].InstanceProps.IPAddress]);
                });
                if ($.fn.dataTable.isDataTable('#dataTable')) {
                    table.destroy();
                }
                table = $('#dataTable').DataTable({
                    data: instance_list,
                    "columnDefs": [{
                        "targets": -1,
                        "data": null,
                        "defaultContent": `<button type="button" class="btn btn-primary" data-toggle="modal" data-target="#myModal">Modify</button>`
                    },
                    {
                        "targets": -2,
                        "data": null,
                        "defaultContent": `<button type="button" class="btn btn-primary" data-toggle="modal" data-target="#myModal">Show Log</button>`
                    }]
                });
            }
            else {
                $('#dataTable-body').html(`
                <tr>
                    <td colspan="4">
                        You are not assigned to any instances. Please contact your administrator.
                    </td>
                </tr>
                `);
            }
        }
        else if (JSON.parse(this.responseText).statusCode == 204) {
            $('#dataTable-body').html(`
                        <tr>
                            <td colspan="5">
                                This project doesn't have any instances. Only Administrator and Project manager can create new instance.
                            </td>
                        </tr>
                        `);
        }
        else if (this.status == 401) {
            reAuth();
        }
        else {
            console.log(this);
        }
    };
    xhttp.open("GET", "https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/listprojectinstances?id=" + parseURLParams(window.location.href).id, true);
    xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
    xhttp.send();
}

function initProjectDevelopers() {
    $('#dev-preload').css("display", "block");
    var xhttp = new XMLHttpRequest();
    xhttp.onloadend = function () {
        $('#dev-preload').css("display", "none");
        if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
            var result = JSON.parse(this.responseText).body;
            if (Object.keys(result).length > 0) {
                $('#dev-list').html('');
                Object.keys(result).forEach(ele => {
                    $('#dev-list').append(`
                        <li>
                            <h3>
                            ${ele}
                            </h3>
                            <ul>
                                <li>
                                    <h6>
                                    Day Added: <br> ${result[ele].DayAdded}
                                    </h6>
                                </li>
                            </ul
                        </li>
                    `);
                });
            }
            else {
                $('#dev-list').html("This project doesn't have any developers yet. Only administrator and Project manager can assign new one");
            }
        }
        else {
            reAuth();
        }
    };
    xhttp.open('GET', "https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/listprojectusers?id=" + parseURLParams(window.location.href).id, true);
    xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
    xhttp.send();
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
    $(`#${id}`).toast({ delay: 10000 });
    $(`#${id}`).toast("show");
}

function getAllUser() {
    $('#modify-users-project').unbind();
    $('#dev-list').css('display', 'none');
    $("#dev-list").html("");
    $('#dev-preload').css("display", "block");
    var xhttp = new XMLHttpRequest();
    xhttp.onloadend = function () {
        if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
            function createUser(user_name) {
                $("#dev-list").append(`
                <span class="list-wrap">
                    <input type="checkbox" id="project-user-${user_name}" username="${user_name}"/>
                    <label for="project-user-${user_name}" class="list">
                        <i class="fa fa-check"></i>
                    ${user_name}
                    </label>
                </span>`
                );
            }
            data = JSON.parse(this.responseText).body;
            data.forEach(element => {
                createUser(element);
            });
            var xhttp = new XMLHttpRequest();
            xhttp.onloadend = function () {
                $('#dev-preload').css("display", "none");
                if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
                    function checkUser(user_name) {
                        $(`#project-user-${user_name}`).prop('checked', true);
                    }
                    data = JSON.parse(this.responseText).body;
                    Object.keys(data).forEach(element => {
                        checkUser(element);
                    });
                    $('#dev-list').fadeIn(250);
                    $('#modify-users-project').on("click", function () {
                        var users = [];
                        $('#dev-list').find(':checked').each((index, element) => {
                            users.push(element.getAttribute('username'));
                        });
                        var xhttp = new XMLHttpRequest();
                        var data = JSON.stringify({
                            "projectID": parseURLParams(window.location.href).id,
                            "users": users
                        });
                        xhttp.onloadend = function () {
                            if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
                                noti(new Date().getTime(), "Success", "Project's developer list updated successfuly");
                                $('#modify-users-project').unbind();
                                $('#modify-users-project').on("click", function () {
                                    getAllUser();
                                });
                                initProjectDevelopers();
                            }
                            else if (JSON.parse(this.responseText).statusCode == 403) {
                                noti(new Date().getTime(), `<font color="red">Forbidden</font>`, "You don't have permission to change this project's developer list");
                                initProjectDevelopers();
                                $('#modify-users-project').unbind();
                                $('#modify-users-project').fadeOut(1000, () => { $('#wrapper').removeClass('blur'); });
                            }
                            else {
                                reAuth();
                            }
                        }
                        xhttp.open("POST", `https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/updateprojectusers`, true);
                        xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
                        xhttp.setRequestHeader("Content-Type", "application/json");
                        xhttp.send(data);
                    });
                }
                else {
                    reAuth();
                }
            };
            xhttp.open("GET", `https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/listprojectusers?id=${parseURLParams(window.location.href).id}`, true);
            xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
            xhttp.send();
        }
        else {
            reAuth();
        }
    };
    xhttp.open('GET', "https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/listalluser", true);
    xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
    xhttp.send();
}

function getlistuserofproject(projectID, instanceID) {
    $("#instance-list-user-data").css("display", "none");
    $("#instance-list-user-data").html("");
    var xhttp = new XMLHttpRequest();
    xhttp.onloadend = function () {
        if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
            function createUser(user_name) {
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
            getlistuserofinstance(instanceID);
        }
        else {
            reAuth();
        }
    };
    xhttp.open('GET', "https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/listprojectusers?id=" + projectID, true);
    xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
    xhttp.send();
}

function getlistuserofinstance(instance_id) {
    var xhttp = new XMLHttpRequest();
    xhttp.onloadend = function () {
        $('#confirm-modify-instance').prop('disabled', false);
        $('#instance-user-preload').css("display", "none");
        $("#instance-list-user-data").css("display", "block");
        if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
            function checkUser(user_name) {
                $(`#instance-user-${user_name}`).prop('checked', true);
            }
            data = JSON.parse(this.responseText).body;
            data.forEach(element => {
                checkUser(element);
            });
        }
        else {
            reAuth();
        }
    };
    xhttp.open("GET", `https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/listinstanceusers?projectid=${parseURLParams(window.location.href).id}&instanceid=${instance_id}`, true);
    xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
    xhttp.send();
}

function modifyInstanceProps() {
    var xhttp = new XMLHttpRequest();
    var data = JSON.stringify({
        "instanceProps": {
            "IPAddress": $("#modify-instance-ip").val(),
            "InstanceName": $("#modify-instance-name").val(),
            "ARN": $("#modify-instance-arn").val(),
            "InstanceUser": $("#modify-instance-ssh-user").val()
        },
        "instanceID": $("#modify-instance-id").val(),
        "projectID": parseURLParams(window.location.href).id
    });
    xhttp.onloadend = function () {
        if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
            $('#wrapper').removeClass('blur');
            $('#modify-instance-panel').fadeOut(1000, () => { $('#wrapper').removeClass('blur'); });
            initProjectInstances();
            noti(new Date().getTime(), "Success", `Instance update successfuly`);
        }
        else if (JSON.parse(this.responseText).statusCode == 403) {
            $('#confirm-modify-instance').html("Forbidden");
            $('#confirm-modify-instance').addClass("btn-danger");
            $('#confirm-modify-instance').prop('disabled', true);
        }
        else if (this.status == 401) {
            reAuth();
        }
        else {
            noti(new Date().getTime(), `<font color="red">Error</font>`, this.responseText);
        }
    }
    xhttp.open("POST", `https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/updateinstancedetail`, true);
    xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(data);
}
function getlistuser(user) {
    var xhttp = new XMLHttpRequest();
    xhttp.onloadend = function () {
        if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
            function createUser(user_name) {
                $("#project-modify-manager").append(`<option data-tokens="${user_name}">${user_name}</option>`);
            }
            data = JSON.parse(this.responseText).body;
            data.forEach(element => {
                createUser(element);
            });
            $('#project-modify-manager').selectpicker('refresh');
            $('#project-modify-manager').selectpicker('val', user);
        }
        else {
            reAuth();
        }
    };
    xhttp.open("GET", `https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/listalluser`, true);
    xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
    xhttp.send();
}

function initProjectDetail() {
    var xhttp = new XMLHttpRequest();
    xhttp.onloadend = function () {
        if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
            var result = JSON.parse(this.responseText).body;
            var Auth = JSON.parse(window.localStorage.getItem("Auth"));
            if (Auth.isAdmin || Auth.username == result.ProjectManager) {
                $('#del-project').css('display', 'block');
                $('#mod-project').css('display', 'block');
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
            initProjectInstances();
            initProjectDevelopers();
        }
        else {
            reAuth();
        }
    };
    xhttp.open('GET', 'https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/projectdetail?id=' + parseURLParams(window.location.href).id, true);
    xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
    xhttp.send();
}