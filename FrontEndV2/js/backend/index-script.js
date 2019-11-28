const BackEndPoint = "NEED CHANGE";
document.addEventListener("DOMContentLoaded", function () {
    try{
        var Auth = JSON.parse(window.localStorage.getItem("Auth"));
        if(Auth.timeAcquired == undefined || Auth.timeAcquired+Auth.ExpiresIn*1000 >= new Date().getTime){
            var xhttp = new XMLHttpRequest();
            var data = JSON.stringify({"username":Auth.username,"refreshToken":Auth.RefreshToken});
            xhttp.onloadend = function(){
                if (this.status == 200) {
                    var result = JSON.parse(this.responseText);
                    if(result.errorType){
                        window.localStorage.removeItem('Auth');
                        window.location.href = ('login.html');
                    }
                    else{
                        var auth = result.body.AuthenticationResult;
                        auth.username = Auth.username;
                        auth.timeAcquired = new Date().getTime();
                        window.localStorage.setItem('Auth',JSON.stringify(auth));
                    }
                }
                else{
                    window.localStorage.removeItem('Auth');
                    window.location.href = ('login.html');
                }
            };
            xhttp.open("POST", BackEndPoint+"/reauth", true);
            xhttp.setRequestHeader("Content-Type","application/json");
            xhttp.send(data);
        }
        if(Auth.isAdmin){
            $('#greeting').html(`Hello, ${Auth.username} (Admin)`);
        }
        else{
            $('#greeting').html(`Hello, ${Auth.username}`);
            $('a[href="instances.html"]').css("display","none");
        }
        $('#logout-butt').click(ev=>{
            window.localStorage.removeItem('Auth');
        });
    }
    catch(err) {
        console.log(err);
        window.location.href = ('login.html');
    }
});