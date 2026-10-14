// screenshot function
// function screenShot(limit, tId) {
//     const thumbSize = determineScreenshot();
//     const limitString = '_' + tId + '_' + limit;
//     let options = { types: ['window', 'screen'], thumbnailSize: thumbSize };
//     desktopCapturer.getSources(options)
//     .then((sources) => {
//         sources.forEach(function(source) {
//             if( source.name === 'Entire Screen' || source.name == 'Screen 1') {
//                 const filename = moment().format('YYYY-MM-DD')+ limitString +'.jpg';
//                 const screenshotPath = path.join(os.tmpdir(), filename);
//                 fs.writeFile(screenshotPath, source.thumbnail.toPNG(), function(err) {
//                     if(err) {return console.log(err.message);}
//                     // action for api access
//                     // shell.openExternal('file://' + screenshotPath);
//                     // saveScreenshot(screenshotPath, filename);
//                     const remote = electron.remote;
//                     let w = remote.getCurrentWindow();
//                     w.show();
//                     saveScreenshot(screenshotPath, filename, limit);
//                 });
//             }
//         });
//     }).catch((error) => {
//         console.log(error);
//     });
// };

function screenShot(limit, tId) {
    const thumbSize = determineScreenshot();
    const limitString = '_' + tId + '_' + limit;
    let options = { types: ['screen'], thumbnailSize: thumbSize }; // Only screen sources

    desktopCapturer.getSources(options)
    .then((sources) => {
        sources.forEach(function(source) {
            const filename = moment().format('YYYY-MM-DD') + limitString + '_' + source.name.replace(/\s+/g, '_') + '.jpg'; // Include source name in filename
            const screenshotPath = path.join(os.tmpdir(), filename);
            fs.writeFile(screenshotPath, source.thumbnail.toPNG(), function(err) {
                if (err) { return console.log(err.message); }
                // const remote = electron.remote;
                // let w = remote.getCurrentWindow();
                // w.show();
                saveScreenshot(screenshotPath, filename, limit);
            });
        });
    }).catch((error) => {
        console.log(error);
    });
};

// snip current window and save to desktop
function snipWindow(state) {
    if (document.getElementById('screen-shot').style.visibility == 'visible') {
        document.getElementById('screen-shot').style.visibility = 'hidden';
    }
    const thumbSize = determineScreenshot();
    const fileNameString = '_' + state;
    let options = { types: ['window', 'screen'], thumbnailSize: thumbSize };
    desktopCapturer.getSources(options)
    .then((sources) => {
        sources.forEach(function(source) {
            if( source.name === 'NBPO Tracker') {
                const filename = moment().format('YYYY-MM-DD_hh-mmA')+ fileNameString +'.jpg';
                const homeDir = require('os').homedir();
                const desktopDir = `${homeDir}/Desktop`;
                const screenshotPath = path.join(desktopDir, filename);
                fs.writeFile(screenshotPath, source.thumbnail.toPNG(), function(err) {
                    if(err) {return console.log(err.message);}
                    if (store.get('screenshot_setting') == 'Manual') {
                        document.getElementById('screen-shot').style.visibility = 'visible';
                    }
                    // if (state == 'IN') {
                    //     M.toast({html: 'Time-in saved', displayLength: 2000});
                    // } else {
                    //     M.toast({html: 'Time-out saved', displayLength: 2000});
                    // }
                });
            }
        });
    }).catch((error) => {
        console.log(error);
    });
};
// get screen size
function determineScreenshot(){
    const screenSize = screen.getPrimaryDisplay().workAreaSize;
    var maxDimension = Math.max(screenSize.width, screenSize.height);
    return {
        width: maxDimension * window.devicePixelRatio,
        height: maxDimension * window.devicePixelRatio
    };
}
// api call for upload
function saveScreenshot(pathz, fileName, limit) {
    const boundary = "blob";    
    let data = "";
    const currDate = moment().format('YYYY-MM-DD');
    const reader = new FileReader();
    const myImage = document.getElementById('myImage');

    var blob = null;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", 'file://' + pathz);
    xhr.responseType = "blob";
    xhr.onload = function()
    {
        blob = xhr.response;//xhr.response is now a blob object
        var reader = new FileReader();
        reader.readAsDataURL(blob); 
        reader.onloadend = function() {
            var base64data = reader.result;                
            // myImage.src = base64data;
            // save base64 image to folder
            // let base64Image = base64data.split(';base64,').pop();
            // const filename = 'new_file.jpg';
            // const screenshotPath = path.join(os.tmpdir(), filename);
            // fs.writeFile(screenshotPath, base64Image, {encoding: 'base64'}, function(err) {
            //     console.log('File created');
            // });
            data += "--" + boundary + "\r\n";
            data += 'Content-Disposition: form-data; name="file_name"\r\n';
            data += '\r\n';
            data += fileName + "\r\n";
            data += "--" + boundary + "\r\n";
            data += 'Content-Disposition: form-data; name="date"\r\n';
            data += '\r\n';
            data += currDate + "\r\n";
            data += "--" + boundary + "\r\n";
            data += 'Content-Disposition: form-data; name="base64_code"\r\n';
            data += '\r\n';
            data += base64data + "\r\n";
            data += "--" + boundary + "--";
            // let XHR = new XMLHttpRequest();
            // XHR.open( 'POST', process.env.DB_HOST + 'screenshot/upload' );
            // XHR.setRequestHeader( 'Content-Type','multipart/form-data; boundary=' + boundary );
            // XHR.setRequestHeader('Authorization', 'Bearer ' + token);
            // XHR.send( data );
            // fs.unlink(pathz, (err) => {
            //     if (err) {
            //         alert("An error ocurred updating the file" + err.message);
            //         console.log(err);
            //         return;
            //     }
            // });
            axios.post(process.env.DB_HOST + 'screenshot/upload', data,
            {
                headers: {
                    'Content-Type': 'multipart/form-data; boundary=' + boundary,
                }
            }).then((response) => {
                fs.unlink(pathz, (err) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                });
                limit++;
                store.set('screenshot_limit', limit);
                M.toast({html: 'Screenshot Saved', displayLength: 1000});
            }).catch((error) => {
                console.log(error);
                M.toast({html: 'Screenshot Save Failed!', displayLength: 1000});
            });
        }
    }
    xhr.send();
    
    
}
