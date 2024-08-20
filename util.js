function write_data_to_server() {
    /*
    This function sends a data packet to the specified URL as a POST request.
    The specified URL is for a PHP script that writes the POST request's
    contents (`filename` and `filedata`) to a file on the server.
    */
    jQuery.ajax({
        type: 'post',
        cache: false,
        url: url_write_data_php, // `url_write_data_php` is a global variable
        data: {
            filename: output_filename, // `output_filename` is a global variable
            filedata: jsPsych.data.get().json(),
        },
    });
    console.log(`Attempted to write data to: ${output_filename}`);
}


function output_filename_exists() {
    /*
    This helper function returns True if a file with name
    `url_experiment_dir` + `output_filename` already exists.
    This can be useful for ensuring non-repeat participants.
    */
    var http = new XMLHttpRequest();
    var url = url_experiment_dir + output_filename;
    http.open('HEAD', url, false);
    http.send();
    var exists = http.status != 404;
    console.log(`Checking existence of ${url}: ${exists}`);
    return exists;
}


function arange(start, stop, step) {
    /*
    This helper function is similar to np.arange in Python.
    */
    var list = [];
    for (var i = start; i < stop; i += step) {
        list.push(i);
    }
    return list
}
