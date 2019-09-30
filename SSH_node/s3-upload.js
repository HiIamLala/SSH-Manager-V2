var error_log_stream = require('fs').createWriteStream("./log/error.txt", { flags: 'a' });
var AWS = require('aws-sdk');
AWS.config = new AWS.Config();
AWS.config.accessKeyId = "AKIA6PJJKSV6H7EXRAXY";
AWS.config.secretAccessKey = "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";
var s3 = new AWS.S3();

function upload(filepath){
    try{
        var time = getTime();
        var params = {
            Body: require('fs').readFileSync(filepath, "binary"),
            Bucket: "ssh-manager-log",
            Key: filepath.slice(6)
        };
        s3.putObject(params, function(err, data) {
            if (err) {
                console.log(time + "|" + err + "|SSH-LOG|"+ filepath);
                error_log_stream.write(time + "|" + err + "|SSH-LOG|"+ filepath + "\n");
            }
            else require('fs').unlinkSync(filepath);
        });
    }catch(err){
        console.log(time + "|" + err + "|SSH-LOG|"+ filepath)
        error_log_stream.write(time + "|" + err + "|SSH-LOG|"+ filepath + "\n");
    }
}

module.exports = {
    upload
};

function getTime() {
    var today = new Date();
    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    return date + ' ' + time;
}
