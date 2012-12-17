Frantic-S3-Browser
==================

Frantic-S3-Browser is a file browser and uploader for Amazon S3. Fully HTML5 based,
no server needed.

You can serve Frantic-S3-Browser from a single bucket and then create a bucket for each
customer/project you want to serve. Frantic-S3-Browser is simply a browser-based client
to S3 enabling you and your users to download and upload files in buckets.

Setup: The website bucket for Frantic-S3-Browser
================================================
( If you want to quickly try out Frantic-S3-Browser you can skip this step and just use
http://frc.github.com/Frantic-S3-Browser/ )

 - Add a new bucket using https://console.aws.amazon.com/s3/home - pay attention
   that you place the bucket in the region you want it to be in. This bucket
   is used to serve the login website to your users. You can customize it to match
   your brand.

 - Add Bucket Policy for Website Access
   Select the bucket, press "Properties". In the Permissions tab press
   "Add Bucket Policy". Paste this in, replacing "YOURBUCKETNAME" with the name
   of your bucket, and save the policy:

   {
    "Version": "2008-10-17",
    "Statement": [
             {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": {
                    "AWS": "*"
                },
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::YOURBUCKETNAME/*"
             }
    ]
   }

 - Enable Website Access
   Select the "Website Access" tab in Properties. Check Enabled [X], specify
   "index.html" as the Index Document and "error.html" as the Error Document.
   Note the endpoint Amazon gives to you and write it down. Press Save.

 - Upload all files of Frantic-S3-Browser to the root of the website bucket you just created.

Setup: The bucket for a single customer's/project's data
========================================================
 - Add the bucket
   Add a new bucket using https://console.aws.amazon.com/s3/home - pay attention
   that you place the bucket in the region you want it to be in.

 - If you want the connection to be secure (HTTPS) do not use dots in the bucket name.
   Using dots in the bucket name will drop the connection to insecure HTTP.

 - Add a CORS policy to enable API requests
   Go back to Permissions tab and press "Add a CORS policy". Paste this in:

   &lt;?xml version="1.0" encoding="UTF-8"?&gt;
   &lt;CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/"&gt;
       &lt;CORSRule&gt;
           &lt;AllowedOrigin&gt;*&lt;/AllowedOrigin&gt;
           &lt;AllowedMethod&gt;POST&lt;/AllowedMethod&gt;
           &lt;AllowedMethod&gt;GET&lt;/AllowedMethod&gt;
           &lt;AllowedHeader&gt;*&lt;/AllowedHeader&gt;
       &lt;/CORSRule&gt;
   &lt;/CORSConfiguration&gt;

 - Add the user to access the bucket. Go to IAM, add a new user.
   Save the Security Credentials, you will need them later in the setup.
   Select the user's Permissions tab and add a Policy as follows.

   {
    "Statement": [
    {
      "Sid": "Stmt1353931095381",
      "Action": [
        "s3:*"
      ],
      "Effect": "Allow",
      "Resource": [
        "arn:aws:s3:::YOURBUCKETNAME","arn:aws:s3:::YOURBUCKETNAME/*"
      ]
    }
    ]
   }

 - Repeat this procedure for each customer/project bucket you need.

Setup: Customizing Frantic-S3-Browser look and feel
===================================================
Edit css/branding.css.


Thank you
=========
Raymond Yee for publishing snippet
http://blog.mashupguide.net/2008/11/25/amazon-s3-signature-calculation-in-javascript/


Copyright
=========
Frantic-S3-Browser Copyright Oskari Ojala 2012.
 Licence undecided.

sha1.js
 Version 2.2 Copyright Paul Johnston 2000 - 2009.
 Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 Distributed under the BSD License
 See http://pajhome.org.uk/crypt/md5 for details.