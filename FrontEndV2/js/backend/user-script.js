var table;
$(document).ready(function () {
    var Auth = JSON.parse(window.localStorage.getItem("Auth"));
    if(Auth.isAdmin){
        $('#create-user').css('display','block');
        $('#create-user').on('click',function(){
            $('#wrapper').addClass('blur');
            $('#create-user-panel').fadeIn(1000);
        });
        $('#confirm-create-user').on('click',function(){
            var username = $('#create-user-username').val();
            var email = $('#create-user-email').val();
            var fullname = $('#create-user-name').val();
            var phone = $('#create-user-phone').val();
            var data = JSON.stringify({
                'username': username,
                'email': email,
                'fullname': fullname,
                'phone':phone
            });
            if(username && email){
                var xhttp = new XMLHttpRequest();
                xhttp.onloadend = function(){
                    if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
                        var result = JSON.parse(this.responseText).body;
                        noti(new Date().getTime(),"Success", result);
                        $('#wrapper').removeClass('blur');
                        $('#create-user-panel').fadeOut(1000,()=>{$('#wrapper').removeClass('blur');});
                    }
                    else if (this.status == 200 && JSON.parse(this.responseText).statusCode == 403){
                        noti(new Date().getTime(),"<font color='red'>Forbidden</font>", "You don't have permission");
                        $('#wrapper').removeClass('blur');
                        $('#create-user-panel').fadeOut(1000,()=>{$('#wrapper').removeClass('blur');});
                    }
                    else if(JSON.parse(this.responseText).errorType) {
                        noti(new Date().getTime(),"<font color='red'>Fail</font>", JSON.parse(this.responseText).errorMessage);
                    }
                    else{
                        noti(new Date().getTime(),"<font color='red'>Fail</font>", this.responseText);
                    }
                }
                xhttp.open("POST", "https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/register", true);
                xhttp.setRequestHeader("Content-Type", "application/json");
                xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
                xhttp.send(data);
            }
        });
    }
    else{
        $('#delete-user').css('display','none');
        $('#confirm-modify-user').css('display','none');
    }
    initeUserList();
});

function initeUserList() {
    $('#user-preload').css("display", "block");
    var xhttp = new XMLHttpRequest();
    xhttp.onloadend = function () {
        $('#user-preload').css("display", "none");
        if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
            var result = JSON.parse(this.responseText).body;
            var user_list = [];
            result.forEach(element => {
                element.Attributes = mapAttribute(element.Attributes);
                user_list.push([element.Username, element.Attributes["name"] || "No value", element.Attributes["email"] || "No value", element.Attributes["phone_number"] || "No value"]);
            });
            if ($.fn.dataTable.isDataTable('#dataTable')) {
                table.destroy();
            }
            table = $('#dataTable').DataTable({
                data: user_list,
                "columnDefs": [{
                    "targets": -1,
                    "data": null,
                    "defaultContent": `<button id="project-more-info" type="button" class="btn btn-primary" data-toggle="modal" data-target="#myModal">More Info</button>`
                }]
            });
            $('#dataTable tbody').on('click', 'button', function () {
                var username = $(this).parents('tr')["0"].cells["0"].innerText;
                if (event.target.innerText == "More Info") {
                    $('#wrapper').addClass('blur');
                    $("#modify-user-username").val(username);
                    var xhttp = new XMLHttpRequest();
                    xhttp.onloadend = function () {
                        if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
                            var result = JSON.parse(this.responseText).body;
                            result.UserAttributes = mapAttribute(result.UserAttributes);
                            $('#modify-user').fadeIn(1000);
                            $("#modify-user-create-date").val(result["UserCreateDate"]);
                            $("#modify-user-last-modify").val(result["UserLastModifiedDate"]);
                            $("#modify-user-name").val(result.UserAttributes['name']||"");
                            $("#modify-user-phone").val(result.UserAttributes['phone_number']||"");
                            $('#confirm-modify-user').unbind();
                            $('#confirm-modify-user').on('click',function(){
                                var data = JSON.stringify({
                                    "username": username,
                                    "props": {
                                        "phone_number": $("#modify-user-phone").val(),
                                        "name": $("#modify-user-name").val()
                                    }
                                });
                                var xhttp = new XMLHttpRequest();
                                xhttp.onloadend = function(){
                                    if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
                                        noti(new Date().getTime(),"Success", `Update user ${username} detail successfully`);
                                        $('#modify-user').fadeOut(500,()=>{$('#wrapper').removeClass('blur');});
                                        initeUserList();
                                    }
                                    else if(this.status == 200 && JSON.parse(this.responseText).statusCode == 403){
                                        noti(new Date().getTime(),"<font color='red'>Fail</font>", "You don't have permission");
                                        $('#wrapper').removeClass('blur');
                                        $('#modify-user').fadeOut(500,()=>{$('#wrapper').removeClass('blur');});
                                    }
                                    else{
                                        reAuth();
                                    }
                                }
                                xhttp.open("POST", "https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/updateuserdetail", true);
                                xhttp.setRequestHeader("Content-Type", "application/json");
                                xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
                                xhttp.send(data);
                            });
                            $('#delete-user').unbind();
                            $('#delete-user').on('click',function(){
                                var xhttp = new XMLHttpRequest();
                                xhttp.onloadend = function(){
                                    if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
                                        noti(new Date().getTime(),"Deleted", `Delete user ${username} successfully`);
                                        $('#modify-user').fadeOut(500,()=>{$('#wrapper').removeClass('blur');});
                                        initeUserList();
                                    }
                                    else if(this.status == 200 && JSON.parse(this.responseText).statusCode == 403){
                                        noti(new Date().getTime(),"<font color='red'>Fail</font>", "You don't have permission");
                                        $('#wrapper').removeClass('blur');
                                        $('#modify-user').fadeOut(500,()=>{$('#wrapper').removeClass('blur');});
                                    }
                                    else{
                                        //reAuth();
                                        console.log(this);
                                    }
                                }
                                xhttp.open("GET", "https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/removeuser?username="+username, true);
                                xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
                                xhttp.send();
                            });
                        }
                        else if(this.status==401){
                            reAuth();
                        }
                        else {
                            noti(new Date().getTime(),"<font color='red'>Fail</font>", JSON.parse(this.responseText).errorMessage);
                        }
                    }
                    xhttp.open("GET", `https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/getuserdetail?username=${username}`, true);
                    xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
                    xhttp.send();
                }
            });
        }
        else {
            reAuth();
        }
    };
    xhttp.open("GET", `https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/getalluserdetail`, true);
    xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
    xhttp.send();
};

function mapAttribute(Attributes) {
    var result = {};
    Attributes.forEach(ele => {
        result[ele["Name"]] = ele["Value"];
    });
    return result;
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
    xhttp.open("POST", "https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/reauth", true);
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