if(!require('fs').existsSync('./log')){
    require('fs').mkdirSync('./log');
}
var SSHClient = require('ssh2').Client;
var port = 12345;
const query = require("./database-query");
const s3 = require('./s3-upload');
var init = function(){
    try{
        var io = require('socket.io')(port);
        console.log('Listening on port ' + port);
        io.on('connection', function (client) {
            var dateTime = new Date().toISOString();
            var address = client.request.connection.remoteAddress
            console.log(address + " has connected.");
            client.on('join_ssh_session',function(data){
                client.join(data);
                client.emit('data','You have joined session ' + data);
            })
            client.on('setup_new_connection', function (data) {
                session_prop = JSON.parse(data);
                query.ssh(session_prop.token[0], (err, result) => {
                    if(err){
                        client.emit('error',"Server error! Try again later");
                    }
                    else if(result){
                        var project_id = session_prop.token[0].split("@")[2];
                        var instance_id = session_prop.token[0].split("@")[3];
                        var username = session_prop.token[0].split("@")[1];
                        var conn = new SSHClient();
                        var ssh_session = `${new Date().getTime()}@${username}@${project_id}@${instance_id}`;
                        console.log(ssh_session);
                        client.emit('session', ssh_session);
                        client.join(ssh_session);
                        if(!require('fs').existsSync("./log/" + project_id)){
                            require('fs').mkdirSync("./log/" + project_id);
                            require('fs').mkdirSync("./log/" + project_id + "/" + instance_id);
                            require('fs').mkdirSync("./log/" + project_id + "/" + instance_id + "/" + username);
                        }
                        else{
                            if(!require('fs').existsSync("./log/" + project_id + "/" + instance_id)){
                                require('fs').mkdirSync("./log/" + project_id + "/" + instance_id);
                                require('fs').mkdirSync("./log/" + project_id + "/" + instance_id + "/" + username);
                            }
                            else{
                                if(!require('fs').existsSync("./log/" + project_id + "/" + instance_id + "/" + username)){
                                    require('fs').mkdirSync("./log/" + project_id + "/" + instance_id + "/" + username);
                                }
                            }
                        }
                        var file_name = "./log/" + project_id + "/" + instance_id + "/" + username + "/" + dateTime + "_output.rec";
                        var result_log_stream = require('fs').createWriteStream(file_name, { flags: 'a' });
                        var usercmd_log_stream = require('fs').createWriteStream("./log/" + project_id + "/" + instance_id + "/" + dateTime + "-usercmd.txt", { flags: 'a' });
                        conn.on('ready', function () {
                            console.log(`SSH ${ssh_session} :: ready`);
                            conn.shell(function (err, stream) {
                                if (err)
                                    return client.emit('data', '\r\n*** SSH SHELL ERROR: ' + err.message + ' ***\r\n');
                                else {
                                    result_log_stream.write('[{"time":' + new Date().getTime() + ', "value": "User connect established"}');
                                    client.on('data', function (data) {
                                        usercmd_log_stream.write(data);
                                        stream.write(data);
                                    });
                                    client.on('setsize', function (data) {
                                        console.log("Client request change size to " + data.rows + " rows " + data.cols + " cols");
                                        stream.setWindow(data.rows, data.cols);
                                    });
                                    client.on('disconnect', function () {
                                        console.log("Client " + address + " disconnected");
                                        stream.close();
                                        conn.end();
                                    });
                                    client.on('error', function () {
                                        console.log("Client " + address + " error. Disconnected");
                                        client.disconnect();
                                        stream.close();
                                        conn.end();
                                    });
                                    stream.on('close', function (instance_id) {
                                        console.log('Stream :: close');
                                        conn.end();
                                        result_log_stream.write("]");
                                        result_log_stream.close();
                                        usercmd_log_stream.close();
                                        s3.upload(file_name);
                                    }).on('data', function (data) {
                                        result_log_stream.write("," + JSON.stringify({ time: new Date().getTime(), value: data.toString('binary') }));
                                        io.to(ssh_session).emit('data', data.toString('binary'));
                                    });
                                }
                            });
                        }).on('close', function () {
                            io.to(ssh_session).emit('data', '\r\n*** SSH CONNECTION CLOSED ***\r\n');
                            client.disconnect();
                        }).on('error', function (err) {
                            io.to(ssh_session).emit('data', '\r\n*** SSH CONNECTION ERROR: ' + err.message + ' ***\r\n');
                            client.disconnect();
                        }).connect({
                            host: result.InstanceProps.IPAddress ,
                            port: 22,
                            username:  result.InstanceProps.InstanceUser,
                            privateKey: result.SSHKey
                        });
                    }
                    else{
                        console.log("Bad request");
                        client.emit('error',"Bad request");
                    }
                })
            });
        });
    }catch(err){
        console.log(err);
        init();
    }
};

init();

function getTime() {
    var today = new Date();
    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    var time = today.getHours() + "-" + today.getMinutes() + "-" + today.getSeconds();
    return date + '-' + time;
}
