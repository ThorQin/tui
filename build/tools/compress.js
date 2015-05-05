var compressor = require('node-minify');

new compressor.minify({
    type: 'gcc', // Using Google Closure
    //type: 'uglifyjs',
    //type: 'yui-js',
    fileIn: 'tui.all.js',
    fileOut: 'tui.all.min.js',
    options: ['--create_source_map tui.all.min.js.map'],
    callback: function(err, min){
        err && console.log(err);
    }
});

//new compressor.minify({
//    type: 'clean-css',
//    fileIn: 'tui.min.css',
//    fileOut: 'tui.min.clean.css',
//    callback: function(err, min){
//        err && console.log(err);
//    }
//});
