var error_log_stream = require('fs').createWriteStream("./log/error.txt", { flags: 'a' });
var AWS = require('aws-sdk');
AWS.config = new AWS.Config();
AWS.config.accessKeyId = "AKIA6PJJKSV6H7EXRAXY";
AWS.config.secretAccessKey = "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";
var dbconverter = AWS.DynamoDB.Converter;
var db = new AWS.DynamoDB({
    region: "ap-southeast-1"
});


function ssh(token, callback) {
    try {
        var time = getTime();
        var props = token.split("@");
        if (new Date().getTime() <= parseInt(props[0])) {
            var username = props[1];
            var projectID = props[2];
            var instanceID = props[3];
            var params = {
                TableName: "SSHM_Projects",
                Key: {
                    'ID': { N: String(projectID) }
                },
                ProjectionExpression: '#Instances.#Instance.#Users.#Username',
                ExpressionAttributeNames: {
                    "#Instances": "Instances",
                    "#Instance": String(instanceID),
                    "#Users": "Users",
                    "#Username": username
                }
            };
            db.getItem(params, function (err, data) {
                if (err) {
                    error_log_stream.write(time + "|" + err + "|SSH|" + token);
                    callback(err, null);
                }
                else if (dbconverter.unmarshall(data.Item).Instances[instanceID].Users[username].SSHToken === token) {
                    clearToken(projectID, instanceID, username, (err, result) => {
                        if (err) {
                            error_log_stream.write(time + "|" + err + "|SSH|" + token);
                            callback(err, null);
                        }
                        else {
                            getInstanceDetail(result.projectID,result.instanceID,(err2,result2)=>{
                                if(err2){
                                    error_log_stream.write(time + "|" + err + "|SSH|" + token);
                                    callback(err, null);
                                }
                                else{
                                    callback(null, result2);
                                }
                            })
                        }
                    });
                }
                else {
                    callback("Bad token", null);
                }
            });
        }
        else {
            error_log_stream.write(time + "| Expired token | " + token);
            callback("Expired token", "Expired token");
        }
    }
    catch (err) {
        error_log_stream.write(time + "|" + err + "|SSH|" + token);
    }
}

function clearToken(projectID, instanceID, username, callback) {
    var time = getTime();
    var token = "Null";
    var params = {
        TableName: "SSHM_Projects",
        Key: {
            'ID': { N: String(projectID) }
        },
        ReturnValues: "UPDATED_NEW",
        UpdateExpression: "SET #Instances.#InstanceID.#Users.#Username.#SSHToken = :Token, #Instances.#InstanceID.#Users.#Username.#LastSSH = :now",
        ExpressionAttributeNames: {
            "#Instances": "Instances",
            "#Users": "Users",
            "#InstanceID": instanceID,
            "#Username": username,
            "#SSHToken": "SSHToken",
            "#LastSSH": "LastSSH"
        },
        ExpressionAttributeValues: {
            ":Token": { "S": token },
            ":now": { "S": new Date().toISOString() }
        }
    };
    db.updateItem(params, function (err, data) {
        if (err) {
            error_log_stream.write(time + "|Clear token fail|" + projectID + "|" + instanceID + "|" + username);
            callback(err, null);
        }
        else {
            callback(null, {
                "username": username,
                "projectID": projectID,
                "instanceID": instanceID
            });
        }
    });
}

function getInstanceDetail(projectID, instanceID, callback) {
    var time = getTime();
    var params = {
        TableName: "SSHM_Projects",
        Key: {
            'ID': { N: String(projectID) }
        },
        ProjectionExpression: '#Instances.#Instance.#InstanceProps, #Instances.#Instance.#SSHKey',
        ExpressionAttributeNames: {
            "#Instances": "Instances",
            "#Instance": String(instanceID),
            "#InstanceProps": "InstanceProps",
            "#SSHKey": "SSHKey"
        }
    };
    db.getItem(params, function (err, data) {
        if (err) {
            error_log_stream.write(time + "|Get instance detail fail|" + projectID + "|" + instanceID);
            callback(err, null);
        }
        else {
            callback(null, dbconverter.unmarshall(data.Item).Instances[instanceID]);
        }
    });
}

function getTime() {
    var today = new Date();
    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    return date + ' ' + time;
}

module.exports = {
    ssh
};
