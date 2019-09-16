// Call the dataTables jQuery plugin
var table;
$(document).ready(function () {
  try {
    getlistuser();
    initProjectList();
    $('#add-project').click(function () {
      $('#confirm-create-project').html("Create");
      $('#confirm-create-project').removeClass("btn-danger");
      $('#confirm-create-project').prop('disabled', false);
      $('#wrapper').addClass('blur');
      $('#create-project').fadeIn(1000);
    });
    $('#confirm-create-project').click(function () {
      if ($("#create-project-name").val() && $("#project-create-manager").val() != "" && $("#create-project-company-name").val()) {
        $('#confirm-create-project').attr("disabled", "true");
        var xhttp = new XMLHttpRequest();
        var data = JSON.stringify({
          "projectprops": {
            "ProjectName": $("#create-project-name").val(),
            "ProjectManager": $("#project-create-manager").val(),
            "CompanyName": $("#create-project-company-name").val()
          }
        });
        xhttp.onloadend = function () {
          if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
            $('#wrapper').removeClass('blur');
            $('#create-project').css('display', 'none');
            initProjectList();
          }
          else {
            $('#confirm-create-project').html("Fail");
            $('#confirm-create-project').addClass("btn-danger");
            $('#confirm-create-project').attr("disabled", "true");
          }
        };
        xhttp.open("POST", "https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/createproject", true);
        xhttp.setRequestHeader("Content-Type", "application/json");
        xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
        xhttp.send(data);
      } else {
        window.alert("You have to fill all the field");
      }
    });
  }
  catch (err) {
    console.log(err);
    //window.location.replace('login.html');
  }
});

function getlistuser() {
  var xhttp = new XMLHttpRequest();
  xhttp.onloadend = function () {
    if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
      function createUser(user_name) {
        $("#project-create-manager").append(`<option data-tokens="${user_name}">${user_name}</option>`);
      }
      data = JSON.parse(this.responseText).body;
      data.forEach(element => {
        createUser(element);
      });
      $('#project-create-manager').selectpicker('refresh');
    }
    else if (this.status == 401) {
      reAuth();
    }
    else {
      console.log(this);
    }
  };
  xhttp.open("GET", `https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/listalluser`, true);
  xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
  xhttp.send();
}

function initProjectList() {
  $('#project-preload').css("display", "block");
  var xhttp = new XMLHttpRequest();
  xhttp.onloadend = function () {
    $('#project-preload').css("display", "none");
    if (this.status == 200 && (JSON.parse(this.responseText).statusCode == 200 || JSON.parse(this.responseText).statusCode == 204)) {
      $("#dataTable-body").html("");
      var result = JSON.parse(this.responseText).body;
      var project_list = [];
      result.forEach(element => {
        project_list.push([element.ID, element.ProjectProps.ProjectName, element.ProjectProps.CompanyName, element.ProjectProps.ProjectManager]);
      });
      if ($.fn.dataTable.isDataTable('#dataTable')) {
        table.destroy();
      }
      table = $('#dataTable').DataTable({
        data: project_list,
        "columnDefs": [{
          "targets": -1,
          "data": null,
          "defaultContent": `<button id="project-more-info" type="button" class="btn btn-primary" data-toggle="modal" data-target="#myModal">More Info</button>`
        }]
      });
      $('#dataTable tbody').on('click', 'button', function () {
        var projectID = $(this).parents('tr')["0"].cells["0"].innerText;
        // show project detail
        window.location.replace('project.html?id=' + projectID);
      });
    }
    else {
      reAuth();
    }
  };
  xhttp.open("GET", "https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/listprojects", true);
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
