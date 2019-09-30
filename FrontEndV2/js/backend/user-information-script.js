$(document).ready(function () {
    $('#confirm-change-pass').on('click',function(){
        var prePass = $('#prePass').val();
        var newPass =  $('#newPass').val();
        var confirmNewPass =  $('#confirm-newPass').val();
        if(prePass != "" && newPass !="" && confirmNewPass != ""){
            if(newPass == confirmNewPass){
                var data = JSON.stringify({
                    'accessToken': JSON.parse(window.localStorage.getItem('Auth')).AccessToken,
                    'prePass': prePass,
                    'newPass': newPass,
                });
                var xhttp = new XMLHttpRequest();
                xhttp.onloadend = function(){
                    if(this.status == 200 && JSON.parse(this.responseText).statusCode == 200){
                        noti(new Date().getTime(),"Success", "Your password has been changed");
                    }
                    else if(JSON.parse(this.responseText).errorType == "NotAuthorizedException"){
                        $('#change-pass-noti').html("Previous password incorrect");
                    }
                    else if(JSON.parse(this.responseText).errorType == "LimitExceededException"){
                        $('#change-pass-noti').html("Too many attemps. Please try again later");
                    }
                    else{
                        console.log(this);
                    }
                }
                xhttp.open("POST", "https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/changepassword", true);
                xhttp.setRequestHeader("Content-Type", "application/json");
                xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
                xhttp.send(data);
            }
            else{
                $('#change-pass-noti').html("New password missmatch with retype password");
            }
        }
        else{
            $('#change-pass-noti').html("You have to fill all the field");
        }
    });
});

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