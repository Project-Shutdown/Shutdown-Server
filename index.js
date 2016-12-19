/**
 * Created by nilsbergmann on 18.12.16.
 */
const express = require('express');
const app = express();
const pino = require('pino');
const pretty = pino.pretty();
const jwt = require('json-web-token');
const config = require('./config.json');
const secret = config.secret;
const root = config.root_password;
const isRoot = require('is-root');
const pro = require('child_process');
const os = require('os');

pretty.pipe(process.stdout);
const log = pino({
    name: 'Shutdown Server',
    safe: true
}, pretty);

app.get('/', (req, res) => {
    if (req.query.token) {
        log.info(`Request with token: ${req.query.token}`);
        jwt.decode(secret, req.query.token, function (err, payload) {
            if (!err) {
                log.info("Payload", payload);
                if (payload.command) {
                    res.json({successfully: true});
                    switch (payload.command) {
                        case "shutdown":
                            shutdown();
                            break;
                        case "reboot":
                            reboot();
                            break;
                        default:
                            return;
                    }
                } else {
                    log.warn("Unknown payload");
                    res.status(500).json({
                        "error": "Bad request"
                    });
                }
            } else {
                log.error(err);
                res.status(500).json({
                    error: err
                });
            }
        });
    } else {
        log.warn("No token found");
        res.status(404).json({
            "error": "No token found"
        });
    }
});

app.listen(9898, function () {
    log.info("Server started on port 9898");
});

function shutdown() {
    switch (os.platform()) {
        case "linux":
        case "darwin":
            if (!root){
                log.error("Under Linux you need to set the root_password in the config.json");
                return;
            }
            pro.exec(`echo ${root} | sudo -S shutdown -h now`, (error, stdout, stderr) => {
                if (error) {
                    log.error(`Exec error: ${error}`);
                    return;
                }
                log.info(`stdout: ${stdout}`);
                log.info(`stderr: ${stderr}`);
            });
            break;
        case "win32":
            if (!isRoot()) {
                log.error("You need to start the server as Administrator");
                return;
            }
            pro.exec('shutdown -s -f -t 0', (error, stdout, stderr) => {
                if (error) {
                    log.error(`Exec error: ${error}`);
                    return;
                }
                log.info(`stdout: ${stdout}`);
                log.info(`stderr: ${stderr}`);
            });
            break;
        default:
            log.warn("I don´t know how I can shutdown your machine");
    }
}

function reboot() {
    switch (os.platform()) {
        case "linux":
        case "darwin":
            if (!root){
                log.error("Under Linux you need to set the root_password in the config.json");
                return;
            }
            pro.exec(`echo ${root} | sudo -S shutdown -r now`, (error, stdout, stderr) => {
                if (error) {
                    log.error(`Exec error: ${error}`);
                    return;
                }
                log.info(`stdout: ${stdout}`);
                log.info(`stderr: ${stderr}`);
            });
            break;
        case "win32":
            if (!isRoot()) {
                log.error("You need to start the server as Administrator");
                return;
            }
            pro.exec('shutdown -r -f -t 0', (error, stdout, stderr) => {
                if (error) {
                    log.error(`Exec error: ${error}`);
                    return;
                }
                log.info(`stdout: ${stdout}`);
                log.info(`stderr: ${stderr}`);
            });
            break;
        default:
            log.warn("I don´t know how I can reboot your machine");
    }
}