// // Call the dataTables jQuery plugin
// $(document).ready(function() {
//   try {
//     var xhttp = new XMLHttpRequest();
//     console.log("OK");
//     xhttp.onloadend = function () {
//         if (this.status == 200 && JSON.parse(this.responseText).statusCode == 200) {
//             $("#dataTable-body").html("");
//             var result = JSON.parse(this.responseText).body;
//             var project_list = [];
//             result.forEach(element => {
//               project_list.push([element.ID,element.ProjectProps.ProjectName,element.ProjectProps.CompanyName,element.ProjectProps.ProjectManager]);
//             });
//             $('#dataTable').DataTable({
//               data: project_list,
//               "columnDefs": [{
//                 "targets": -1,
//                 "data": null,
//                 "defaultContent": "<button>Click!</button>"
//               }]
//             });
//         }
//         else if (this.status == 401) {
//             window.location.replace("/login");
//         }
//         else {
//             window.location.replace("/login");
//         }
//     };
//     xhttp.open("GET", "https://v7gmuisen3.execute-api.ap-southeast-1.amazonaws.com/beta/listprojects", true);
//     xhttp.setRequestHeader("token", JSON.parse(window.localStorage.getItem("Auth")).IdToken);
//     xhttp.send();
// }
// catch (err) {
//     console.log(err);
//     window.location.replace('/login');
// }
// });
