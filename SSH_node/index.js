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
                if(session_prop.token && session_prop.access){
                    query.ssh(session_prop.access[0], session_prop.token[0], (err, result) => {
                        if(err){
                            client.emit('data',err);
                            client.disconnect();
                        }
                        else if(result){
                            var project_id = session_prop.token[0].split("@")[2];
                            var instance_id = session_prop.token[0].split("@")[3];
                            var username = session_prop.token[0].split("@")[1];
                            var ssh_session = `${new Date().getTime()}@${username}@${project_id}@${instance_id}`;
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
                            if(result.InstanceProps.Bastion && parseInt(result.InstanceProps.Bastion)){
                                var bastionID = parseInt(result.InstanceProps.Bastion);
                                query.getInstanceDetail(project_id,bastionID,(bastionErr,bastionResult)=>{
                                    if(bastionErr){
                                        client.emit('data',bastionErr);
                                        client.disconnect();
                                    }
                                    else if(bastionResult){
                                        var conn1 = new SSHClient();
                                        var conn2 = new SSHClient();
                                        if(bastionResult.SSHPassword){
                                            conn1.on('ready', function() {
                                                conn1.forwardOut('127.0.0.1', 12346, result.InstanceProps.IPAddress, 22, function(err, bastionStream) {
                                                    if (err) {
                                                        client.emit('data',err);
                                                        client.disconnect();
                                                        conn1.end();
                                                    }
                                                    else{
                                                        client.emit('data',"Connected to bastion host.");
                                                        if(result.SSHPassword){
                                                            conn2.connect({
                                                                sock: bastionStream,
                                                                username: result.InstanceProps.InstanceUser,
                                                                password: result.SSHPassword,
                                                            });
                                                        }
                                                        else{
                                                            conn2.connect({
                                                                sock: bastionStream,
                                                                username: result.InstanceProps.InstanceUser,
                                                                privateKey: result.SSHKey,
                                                            });
                                                        }
                                                    }
                                                });
                                            }).connect({
                                                host: bastionResult.InstanceProps.IPAddress,
                                                username: bastionResult.InstanceProps.InstanceUser,
                                                password: bastionResult.SSHPassword,
                                            });
                                        }
                                        else{
                                            conn1.on('ready', function() {
                                                conn1.forwardOut('127.0.0.1', 12346, result.InstanceProps.IPAddress, 22, function(err, bastionStream) {
                                                    if (err) {
                                                        client.emit('data',err);
                                                        client.disconnect();
                                                        conn1.end();
                                                    }
                                                    else{
                                                        client.emit('data',"Connected to bastion host.");
                                                        if(result.SSHPassword){
                                                            conn2.connect({
                                                                sock: bastionStream,
                                                                username: result.InstanceProps.InstanceUser,
                                                                password: result.SSHPassword,
                                                            });
                                                        }
                                                        else{
                                                            conn2.connect({
                                                                sock: bastionStream,
                                                                username: result.InstanceProps.InstanceUser,
                                                                privateKey: result.SSHKey,
                                                            });
                                                        }
                                                    }
                                                });
                                            }).connect({
                                                host: bastionResult.InstanceProps.IPAddress,
                                                username: bastionResult.InstanceProps.InstanceUser,
                                                privateKey: bastionResult.SSHKey,
                                            });
                                        }

                                        conn2.on('ready', function() {
                                            conn2.shell(function(err, stream) {
                                                if (err) {
                                                    conn1.end();
                                                    client.emit('data',err);
                                                }
                                                else{
                                                    console.log(ssh_session);
                                                    client.emit('session', ssh_session);
                                                    client.join(ssh_session);
                                                    result_log_stream.write(`[{"${new Date().getTime()}":"User: ${username}|Project: ${project_id}|Instance: ${instance_id}|Connect established\\n"}`);
                                                    client.on('data', function (data) {
                                                        usercmd_log_stream.write(data);
                                                        stream.write(data);
                                                    });
                                                    client.on('setsize', function (data) {
                                                        stream.setWindow(data.rows, data.cols);
                                                    });
                                                    client.on('disconnect', function () {
                                                        stream.close();
                                                        conn2.end();
                                                    });
                                                    client.on('error', function () {
                                                        client.disconnect();
                                                        stream.close();
                                                        conn2.end();
                                                    });
                                                    stream.on('close', function (instance_id) {
                                                        console.log('Stream :: close');
                                                        conn2.end();
                                                        result_log_stream.write("]");
                                                        result_log_stream.close();
                                                        usercmd_log_stream.close();
                                                        s3.upload(file_name);
                                                    }).on('data', function (data) {
                                                        result_log_stream.write(`,{"${new Date().getTime()}":${JSON.stringify(data.toString('binary'))}}`);
                                                        io.to(ssh_session).emit('data', data.toString('binary'));
                                                    });
                                                }
                                            });
                                        }).on('close', function () {
                                            conn1.end();
                                            io.to(ssh_session).emit('data', '\r\n*** SSH CONNECTION CLOSED ***\r\n');
                                            client.disconnect();
                                        }).on('error', function (err) {
                                            conn1.end();
                                            io.to(ssh_session).emit('data', '\r\n*** SSH CONNECTION ERROR: ' + err.message + ' ***\r\n');
                                            client.disconnect();
                                        });
                                    }
                                    else{
                                        client.emit('data',"Bad request");
                                        client.disconnect();
                                    }
                                });
                            }
                            else{
                                var conn = new SSHClient();
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
                                if(result.SSHPassword){
                                    conn.on('ready', function () {
                                        client.on('disconnect', function () {
                                            console.log("Client " + address + " disconnected");
                                            conn.end();
                                        });
                                        client.on('error', function () {
                                            console.log("Client " + address + " error. Disconnected");
                                            client.disconnect();
                                            conn.end();
                                        });
                                        console.log(`SSH ${ssh_session} :: ready`);
                                        conn.shell(function (err, stream) {
                                            if (err)
                                                return client.emit('data', '\r\n*** SSH SHELL ERROR: ' + err.message + ' ***\r\n');
                                            else {
                                                console.log(ssh_session);
                                                client.emit('session', ssh_session);
                                                client.join(ssh_session);
                                                result_log_stream.write(`[{"${new Date().getTime()}":"User: ${username}|Project: ${project_id}|Instance: ${instance_id}|Connect established\\n"}`);
                                                client.on('data', function (data) {
                                                    usercmd_log_stream.write(data);
                                                    stream.write(data);
                                                });
                                                client.on('setsize', function (data) {
                                                    stream.setWindow(data.rows, data.cols);
                                                });
                                                client.on('disconnect', function () {
                                                    stream.close();
                                                    conn.end();
                                                });
                                                client.on('error', function () {
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
                                                    result_log_stream.write(`,{"${new Date().getTime()}":${JSON.stringify(data.toString('binary'))}}`);
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
                                        host: result.InstanceProps.IPAddress,
                                        port: 22,
                                        username: result.InstanceProps.InstanceUser,
                                        password: result.SSHPassword
                                    });
                                }
                                else{
                                    conn.on('ready', function () {
                                        client.on('disconnect', function () {
                                            console.log("Client " + address + " disconnected");
                                            conn.end();
                                        });
                                        client.on('error', function () {
                                            console.log("Client " + address + " error. Disconnected");
                                            client.disconnect();
                                            conn.end();
                                        });
                                        console.log(`SSH ${ssh_session} :: ready`);
                                        conn.shell(function (err, stream) {
                                            if (err)
                                                return client.emit('data', '\r\n*** SSH SHELL ERROR: ' + err.message + ' ***\r\n');
                                            else {
                                                console.log(ssh_session);
                                                client.emit('session', ssh_session);
                                                client.join(ssh_session);
                                                result_log_stream.write(`[{"${new Date().getTime()}":"User: ${username}|Project: ${project_id}|Instance: ${instance_id}|Connect established\\n"}`);
                                                client.on('data', function (data) {
                                                    usercmd_log_stream.write(data);
                                                    stream.write(data);
                                                });
                                                client.on('setsize', function (data) {
                                                    stream.setWindow(data.rows, data.cols);
                                                });
                                                client.on('disconnect', function () {
                                                    stream.close();
                                                    conn.end();
                                                });
                                                client.on('error', function () {
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
                                                    result_log_stream.write(`,{"${new Date().getTime()}":${JSON.stringify(data.toString('binary'))}}`);
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
                                        host: result.InstanceProps.IPAddress,
                                        port: 22,
                                        username: result.InstanceProps.InstanceUser,
                                        privateKey: result.SSHKey
                                    });
                                }
                            }
                        }
                        else{
                            client.emit('data',"Bad request");
                            client.disconnect();
                        }
                    });
                }
                else{
                    client.emit('data',"Missing SSH token");
                    client.disconnect();
                }
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


