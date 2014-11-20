/*jslint devel: true, browser: true, unparam: true, vars: true, white: true, passfail: false, nomen: true, maxerr: 50, indent: 4, todo: true */

// This is a global variable of sha1.js and needs to be set for proper b64 encoded string.
b64pad = "="; // needed for "strict RFC compliance"

var FranticS3Browser = function () {
    "use strict";
    var bucket;
    var uploader_container_id;
    var aws_access_key_id;
    var aws_secret_access_key;
    var aws_signature;
    var protocolurl;
    var $login_form;
    var $login_error;
    var $logout_form;
    var $div_logout_form;
    var $bucketlist;
    var $fileupload_field;
    var $div_upload_form;
    var qs;

    var s3url = '.s3.amazonaws.com';
    var aws_canned_acl = 'private';
    var aws_policy_document;
    var aws_policy_document_b64;

    var set_aws_signature = function (as) {
            aws_signature = as;
    };

    var set_aws_access_key_id = function (aaki) {
        aws_access_key_id = aaki;
    };

    var set_aws_secret_access_key = function (asak) {
        aws_secret_access_key = asak;
    };

    var set_bucket = function (bn) {
        bucket = bn;
        // Certificate check will fail for bucket names with a dot. Use http for them, https for other buckets.
        if (/\./.exec(bn)) {
            protocolurl = 'http://';
        } else {
            protocolurl = 'https://';
        }
    };

    var set_bucketlist = function (selector) {
        $bucketlist = jQuery(selector);
        // Todo: If not found, alert here.
    };

    var set_fileupload_field = function (selector) {
        $fileupload_field = jQuery(selector);
        // Todo: If not found, alert here.
    };

    var set_div_upload_form = function (selector) {
        $div_upload_form = jQuery(selector);
        // Todo: If not found, alert here.
    };

    var make_aws_policy_document = function () {
        aws_policy_document = '{"expiration": "2020-12-01T12:00:00.000Z", "conditions": [{"acl": "' + aws_canned_acl + '"}, {"bucket": "' + bucket + '"},["starts-with", "$key", ""],["starts-with", "$Content-Type", ""]]}';
        aws_policy_document_b64 = rstr2b64(aws_policy_document);
    };

    var sign_api = function (expires, resource) {
        var http_verb = 'GET';
        var canonicalized_resource = '/' + bucket + resource;
        var string_to_sign = http_verb + "\n\n\n" + expires + "\n" + canonicalized_resource;
        var sig = b64_hmac_sha1(aws_secret_access_key, string_to_sign);
        return sig;
    };

    var location_hash = function (location_hash) {
        var i;
        var result = {};
        if (!location_hash) {
            return result;
        }
        var pairs = location_hash.substring(1).split("&");
        var splitPair;
        for (i=0; i < pairs.length; i++) {
            splitPair = pairs[i].split("=");
            result[decodeURIComponent(splitPair[0])] = decodeURIComponent(splitPair[1]);
        }
        return result;
    };

    var sign = function(aws_secret_access_key, string_to_sign) {
        var sig = b64_hmac_sha1(aws_secret_access_key, string_to_sign);
        return sig;
        // Authorization: AWS AWSAccessKeyId:Signature
        // http://docs.amazonwebservices.com/AmazonS3/2006-03-01/dev/RESTAuthentication.html
    };

    var generate_bucket_listing = function(files) {

        for (var i = 0; i < files.length; i++) {
            var name = files[i]["Name"];
            var size = files[i]['Size'];
            var last_modified = files[i]['LastModified'];

            // Skip files that end with a ~
            // Skip files that end with $folder$ (3hub files),
            if (/\$folder\$$/.exec(name) || /~$/.exec(name)) {
                continue;
            }

            var klass = 'file';
            var url = protocolurl + bucket + s3url;

            var expires = new Date().valueOf();
            expires = parseInt(expires / 1000); // milliseconds to seconds
            expires += 21600; // signed request valid for 6 hours
            var signedparamsdata = {
                'response-cache-control': 'No-cache',
                'response-content-disposition': 'attachment'
            };
            var signedurl = '/' + encodeURIComponent(name) + '?' + jQuery.param(signedparamsdata);
            var signature = sign_api(expires, signedurl);

            var paramsdata = {
                'AWSAccessKeyId': aws_access_key_id,
                'Signature': signature,
                'Expires': expires
            };
            url += signedurl + '&' + jQuery.param(paramsdata);

            $("#data_table tbody").append( 
                '<tr> <td>' + name + '</td>'+
                '<td>' + size + ' </td>' +
                '<td>' + humanFileSize(size) + ' </td>' +
                '<td>' + parseISO8601(last_modified) + '</td>'+
                '<td> <a href= ' + url + '> download </a> </td>' +
                 '</tr>');
        }
         $('#data_table').DataTable();
    };
     var parseISO8601 = function(str) {
         // we assume str is a UTC date ending in 'Z'

         var parts = str.split('T'),
         dateParts = parts[0].split('-'),
         timeParts = parts[1].split('Z'),
         timeSubParts = timeParts[0].split(':'),
         timeSecParts = timeSubParts[2].split('.'),
         timeHours = Number(timeSubParts[0]),
         _date = new Date;

         _date.setUTCFullYear(Number(dateParts[0]));
         _date.setUTCMonth(Number(dateParts[1])-1);
         _date.setUTCDate(Number(dateParts[2]));
         _date.setUTCHours(Number(timeHours));
         _date.setUTCMinutes(Number(timeSubParts[1]));
         _date.setUTCSeconds(Number(timeSecParts[0]));
         if (timeSecParts[1]) _date.setUTCMilliseconds(Number(timeSecParts[1]));

         // by using setUTC methods the date has already been converted to local time(?)
         return _date;
        }
    var set_endpoint = function (endpoint) {
        s3url = '.' + endpoint;
    };

    var init_bucketlist = function() {
        //TODO: add some sort of progress bar
        
        var load = function(marker, files) {
            var expires = new Date().valueOf();
            expires = parseInt(expires/1000); // milliseconds to seconds
            expires += 21600; // signed request valid for 6 hours
            var signature = sign_api(expires, '/');
            files = typeof files !== 'undefined' ? files : [];
            marker = typeof marker !== 'undefined' ? marker : '0';
            jQuery(function() {
                $.ajax({
                        url: protocolurl + bucket + s3url + '/?&marker=' + marker,
                        data: {'AWSAccessKeyId': aws_access_key_id, 'Signature': signature, 'Expires': expires},
                        dataFormat: 'xml',
                        cache: false,
                        success: function(data) {
                            $login_form.hide();
                            $login_error.hide();
                            $("#logout").show();
                            $bucketlist.show();
                            set_location_hash({'bucket': bucket, 'aws_access_key_id': aws_access_key_id, 'aws_secret_access_key': aws_secret_access_key});
                            $div_upload_form.show();
                            $("#div_login_form").addClass('login');
                            var contents = jQuery(data).find('Contents');
                            var is_truncated = jQuery(data).find('IsTruncated').text();
                            var marker = jQuery(contents[ ( contents.length - 1)]).find('Key').text();
                            var i;
                            for (i = 0; i < contents.length; i++) {
                                files.push({ 
                                    "Name" : jQuery(contents[i]).find('Key').text(), 
                                    "LastModified" : jQuery(contents[i]).find('LastModified').text() , 
                                    "Size" : jQuery(contents[i]).find('Size').text()  
                                });
                            }
 
                             if (is_truncated == 'true') { 
                               load(marker, files);
                            } else {
                                generate_bucket_listing(files);
                            }
                            
                        },
                        error: function(data) {
                            $login_error.show();
                        }
                    });
            });
        }

        load();       

    };

    var init_fileupload_field = function () {
        $fileupload_field.fileupload({
                url: protocolurl + bucket + s3url + '/',
                type: 'POST',
                autoUpload: true,
                formData: {
                    key: '${filename}',
                    AWSAccessKeyId: aws_access_key_id,
                    acl: aws_canned_acl,
                    policy: aws_policy_document_b64,
                    signature: aws_signature,
                    'Content-Type': 'application/octet-stream'
                },
                done: function(){ init_bucketlist(); }
            });
    };
    
    var login_form_beforeSubmit = function (formData, jqForm, options) {
        set_bucket(jqForm.find('input[name=bucket]').val());
        make_aws_policy_document();
        set_aws_access_key_id(jqForm.find('input[name=aws_access_key_id]').val());
        set_aws_secret_access_key(jqForm.find('input[name=aws_secret_access_key]').val());
        set_aws_signature(sign(aws_secret_access_key, aws_policy_document_b64));
        init_bucketlist();
        init_fileupload_field();
        return false;
    };

    var init_login_form = function (form_selector, login_error_selector) {
        $login_form = jQuery(form_selector);
        $login_error = jQuery(login_error_selector);
        $login_form.ajaxForm({beforeSubmit: login_form_beforeSubmit});
    };

    var init_logout_form = function (form_selector, div_logout_form_selector) {
        $logout_form = jQuery(form_selector);
        $div_logout_form = jQuery(div_logout_form_selector);
    }

    var init_from_hash = function (arg_hash) {
        qs = location_hash(arg_hash);
        if (qs.bucket) {
            $login_form.find('input[name=bucket]').val(qs.bucket);
        }
        if (qs.aws_access_key_id) {
            $login_form.find('input[name=aws_access_key_id]').val(qs.aws_access_key_id);
        }
        if (qs.aws_secret_access_key) {
            $login_form.find('input[name=aws_secret_access_key]').val(qs.aws_secret_access_key);
        }
    };

    var set_location_hash = function (args) {
        window.location.hash = 'bucket=' + encodeURIComponent(bucket) + '&aws_access_key_id=' + encodeURIComponent(aws_access_key_id) + '&aws_secret_access_key=' + encodeURIComponent(aws_secret_access_key);
    };
        
    var init_autosubmit = function () {
        // Auto-submit form if all 3 params were given in qs
        if (qs.bucket && qs.aws_access_key_id && qs.aws_secret_access_key) {
            $login_form.submit();
        }
    };

    var init_dropzone_effect = function () {
        jQuery(document).bind('dragover', function (e) {
                var dropZone = $div_upload_form,
                timeout = window.dropZoneTimeout;
                if (!timeout) {
                    dropZone.addClass('in');
                } else {
                    clearTimeout(timeout);
                }
                if (e.target === dropZone[0]) {
                    dropZone.addClass('hover');
                } else {
                    dropZone.removeClass('hover');
                }
                window.dropZoneTimeout = setTimeout(function () {
                        window.dropZoneTimeout = null;
                        dropZone.removeClass('in hover');
                }, 100);
        });
    };

    var humanFileSize = function (bytes, si) {
        var thresh = si ? 1000 : 1024;
        if(bytes < thresh) return bytes + ' B';
        var units = si ? ['kB','MB','GB','TB','PB','EB','ZB','YB'] : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
        var u = -1;
        do {
            bytes /= thresh;
            ++u;
        } while(bytes >= thresh);
        return bytes.toFixed(1)+' '+units[u];
    };


    return {
        set_aws_access_key_id: function (args) {
            set_aws_access_key_id(args);
        },
        init: function (args) {
            set_endpoint(args.s3_endpoint);
            init_login_form(args.login_form, args.login_error);
            init_logout_form(args.logout_form, args.div_logout_form);
            init_from_hash(args.hash);
            set_bucketlist(args.bucketlist);
            set_fileupload_field(args.fileupload_field);
            set_div_upload_form(args.div_upload_form);
            init_dropzone_effect();
            init_autosubmit();
        }
    };
};
