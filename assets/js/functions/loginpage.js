const electron = require('electron');
const axios = require('axios');
const Store = require('electron-store');
const store = new Store();
const {app, ipcRenderer} = electron;
const minimizeclick = document.getElementById("minimizeclick");
const exitclick = document.getElementById("exitclick");
const loginclick = document.getElementById("loginclick");

// ENV for API
process.env.DB_HOST = 'https://ascend.nextbposolutions.com/index.php/api/';

minimizeclick.addEventListener('click', function(event){minimize()});
exitclick.addEventListener('click', function(event){exit()});
loginclick.addEventListener('click', function(event){login()});

if (store.get('un') != undefined && store.get('p') != undefined) {
    document.querySelector('#username').value = store.get('un');
    document.querySelector('#password').value = store.get('p');
}

// ===========UNCOMMENT FOR MANUAL CAPTURE SCREEN=============
// ipcRenderer.on('screenshotLog:setting', function(e){
//     M.toast({html: store.get('screenshot_setting') + ' Mode', displayLength: 1000});
// });

function check(uname, pass) {
    if (document.getElementById('remember').checked == true) {
        store.set('un', uname);
        store.set('p', pass);
    } else {
        store.delete('un');
        store.delete('p');
    }
}

function login() {
    const uName = document.querySelector('#username').value;
    const uPass = document.querySelector('#password').value;

    // if username and password is correct, send the username
    axios.post(process.env.DB_HOST + 'employee/login',
        {
        headers: {
            'Content-Type': 'application/json'
        },
        username: uName,
        password: uPass
    }).then((response) => {
        if (response.data.access_token !== undefined) {
            check(uName, uPass);
            openLandingPage(response.data.access_token);
        } else {
            M.toast({html: 'Invalid Username or Password', displayLength: 2000});
        }
    }).catch((error) => {
        console.log(error);
        M.toast({html: 'Connect to Server Failed...', displayLength: 1000});
    });
}

function exit() {
    const remote = electron.remote;
    let w = remote.getCurrentWindow();
    w.close();
}

function minimize() {
    const remote = electron.remote;
    let w = remote.getCurrentWindow();
    w.minimize();
}

function openLandingPage(access_token){
    localStorage.setItem('user-token', access_token);
    getUserInfo(access_token);
}

function getUserInfo(access_token) {
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + access_token;
    axios.get(process.env.DB_HOST + 'employee/dashboard',
    {
        headers: {
            'Content-Type': 'application/json'
    },
    }).then((response) => {
        // get user name and user latest timelog
        const user = response.data.profile.first_name + ' ' + response.data.profile.middle_name + ' ' + response.data.profile.last_name;
        const log = response.data.timelog;

        // set storage variable for username
        localStorage.setItem('user-name', user);
        if (log == null) {
            // set storage value empty if there is no time log
            localStorage.setItem('status', 'new');
        } else {
            var time = moment();
            // get time from, time to, and current date values
            const timeFrom = new Date(response.data.timelog.time_from);
            const timeTo = response.data.timelog.time_to;
            const timeCurrent = new Date();

            const timeF = moment(timeFrom).format('YYYY-MM-DD');
            const timeC = moment().format('YYYY-MM-DD');
            if (timeTo == null) {
                const {dialog} = electron.remote;
                // resume
                // set storage value

                localStorage.setItem('status', 'resume');
                localStorage.setItem('user-timein', moment(timeFrom).format('hh:mm A'));
                localStorage.setItem('user-timein-raw', moment(timeFrom));
                localStorage.setItem('user-datein', moment(timeFrom).format('YYYY/MM/DD'));
                // check local values on resume
                if (store.get('screenshot_limit') == undefined) {
                    store.set('screenshot_limit', 1);
                }
                store.set('screenshot_toggle', 'START');
                store.set('timesheet_id', response.data.timelog.id);
            } else if (timeF == timeC && timeTo != null) {
                localStorage.setItem('user-timein', moment(timeFrom).format('hh:mm A'));
                localStorage.setItem('user-timein-raw', moment(timeFrom));
                localStorage.setItem('user-timeout', moment(timeTo).format('hh:mm A'));
                localStorage.setItem('user-datein', moment(timeFrom).format('YYYY/MM/DD'));
                localStorage.setItem('user-dateout', moment(timeTo).format('YYYY/MM/DD'));
                localStorage.setItem('status', 'done');
            } else {
                localStorage.setItem('status', 'new');
            }
        }
        // get or set screenshot setting
        if (store.get('screenshot_setting') == undefined) {
            store.set('screenshot_setting', 'Auto');
        }

        // hide login and open landing page
        ipcRenderer.send('login:success'); 
    }).catch((error) => {
        console.log(error);
    });
}