# SSH-Manager-V2
SSH Management | Version 2

Project SSH Key Manager

Company: OSAM

Developer: @HiIamLala
           @Baorlog


###  HOW TO USE ###

*********** Generate resources & Deploy BackEnd ***********

Upload BackEnd/SSHM_JS.zip to S3
Use BackEnd/Cloudformation.json to deploy with parameter
Deploy API Gateway (Created by Cloudformation above) then Copy Endpoint URL
Copy ClientSecret in AppClient of UserPool with AWS Console then change Variable Environment of Lambda Function with copied ClientSecret

*********** Config and Deploy SSH Node ***********

Change in 2 files | SSH_node\database-query.js | variables | userPoolId     | to match with all the resources created above
       					                   | dynamodb_table |
       					                   | dbregion       |
-----------------------------------------------------------------------------------------------------------------------
                  | SSH_node\s3-upload.js      |           | ssh_bucket_log |

Deploy an EC2 instance and upload Folder SSH_node to EC2 instance
	install nodejs re
	change directory to SSH_node/
	run "npm install" //To install all modules required
	run "node index.js" or "npm start"
Open port 12345 in security group of instance

Attach Permission for EC2
	* Cognito Permission (with UserPool created above)
	* S3 Permission (with SSH Log Bucket created above)
	* DynamoDB Permission (with SSH-Manager table created above)

*********** Config and Deploy FrontEnd SSH Node ***********

Change Endpoint in | FrontEndV2\js\backend\index.js | with Endpoint URL above
		   | FrontEndV2\js\backend\login.js |
Change Endpoint URL | FrontEndV2\static\ssh-script.js | with IP of instance and port 12345      Ex: "http://{IpOfInstance}:12345
		    | FrontEndV2\static\ssh-join.js   |
Upload Folder FrontEndV2 to FrontEnd Server ( AWS S3, GCP Storage, Web Server, ...)