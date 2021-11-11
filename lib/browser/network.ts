
/* lib/browser/network - The methods that execute data requests to the local terminal instance of the application. */

import browser from "./browser.js";
import heartbeat from "./heartbeat.js";
import invite from "./invite.js";
import message from "./message.js";
import remote from "./remote.js";
import util from "./util.js";
import webSocket from "./webSocket.js";

/**
 * Builds HTTP request bodies for transfer to the terminal.
 * * **configuration** - A convenience method for setting state changes to a file.
 * * **heartbeat** - A convenience method for setting heartbeat status changes.
 * * **receive** - Receives data from the network.
 * * **send** - Provides a means for allowing arbitrary HTTP requests.
 * 
 * ```typescript
 * interface module_network {
 *     configuration: () => void;
 *     heartbeat: (status:heartbeatStatus, update:boolean) => void;
 *     receive: (dataString:string) => void;
 *     send:(data:socketDataType, service:requestType, callback:(responseString:string) => void) => void;
 * }
 * type heartbeatStatus = "" | "active" | "deleted" | "idle" | "offline";
 * type requestType = hashTypes | "agent-online" | "browser-log" | "copy" | "error" | "file-list-status-device" | "file-list-status-user" | "forbidden" | "fs" | "GET" | "heartbeat" | "invite" | "message" | "reload" | "response-no-action" | "settings" | "test-browser";
 * type socketDataType = Buffer | NodeJS.ErrnoException | service_agentDeletion | service_agentResolve | service_agentUpdate | service_copy | service_copyFile | service_fileRequest | service_fileStatus | service_fileSystem | service_fileSystemDetails | service_hashAgent | service_hashShare | service_heartbeat | service_invite | service_log | service_message | service_settings | service_stringGenerate | service_testBrowser;
 * ``` */
const network:module_network = {
    /* A convenience method for updating state */
    configuration: function browser_network_configuration():void {
        if (browser.loading === false) {
            network.send({
                settings: browser.data,
                type: "configuration"
            }, "settings", null);
        }
    },

    /* Provides active user status from across the network at regular intervals */
    heartbeat: function browser_network_heartbeat(status:heartbeatStatus, update:boolean):void {
        const heartbeat:service_agentUpdate = {
                action: "update",
                agentFrom: "localhost-browser",
                broadcastList: null,
                shares: (update === true)
                    ? browser.device
                    : null,
                status: status,
                type: "device"
            };
        network.send(heartbeat, "heartbeat", null);
    },

    /* Use HTTP in the cases where a callback is provided. */
    http: function browser_network_http(socketData:socketData, callback:(responseText:string) => void):void {
        const xhr:XMLHttpRequest = new XMLHttpRequest(),
            dataString:string = JSON.stringify(socketData),
            invite:service_invite = socketData.data as service_invite,
            address:string = location.href.split("?")[0],
            testIndex:number = location.href.indexOf("?test_browser"),
            readyState = function browser_network_xhr_readyState():void {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200 || xhr.status === 0) {
                        const offline:HTMLCollectionOf<Element> = document.getElementsByClassName("offline");
                        if (xhr.status === 200 && offline.length > 0 && offline[0].getAttribute("class") === "title offline") {
                            webSocket.start(function browser_network_xhr_readyState_webSocket():boolean {
                                return true;
                            });
                        }
                        if (callback !== null) {
                            callback(xhr.responseText);
                        }
                    } else {
                        const error:Error = {
                            message: `XHR responded with ${xhr.status} when sending messages of type ${socketData.service}.`,
                            name: "XHR Error",
                            stack: new Error().stack.replace(/\s+$/, "")
                        };
                        // eslint-disable-next-line
                        console.error(error);
                    }
                }
            };
        if (browser.testBrowser === null && testIndex > 0) {
            return;
        }
        if (browser.testBrowser !== null && testIndex < 0) {
            return;
        }
        xhr.onreadystatechange = readyState;
        xhr.open("POST", address, true);
        xhr.withCredentials = true;
        xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        xhr.setRequestHeader("request-type", (socketData.service === "invite")
            ? invite.action
            : socketData.service);
        xhr.setRequestHeader("agent-type", "device");
        xhr.timeout = 5000;
        if (socketData.service === "hash-device") {
            xhr.setRequestHeader("agent-hash", "");
        } else {
            xhr.setRequestHeader("agent-hash", browser.data.hashDevice);
        }
        xhr.send(dataString);
    },

    /* Receives data from the network */
    receive: function browser_network_receive(dataString:string):void {
        const error = function browser_socketMessage_error():void {
                // eslint-disable-next-line
                console.error(socketData.data);
            },
            socketData:socketData = JSON.parse(dataString),
            type:requestType = socketData.service;
        if (type === "error") {
            error();
        } else if (type === "reload") {
            location.reload();
        } else if (type === "file-list-status-device") {
            util.fileListStatus(socketData);
        } else if (type === "heartbeat") {
            heartbeat.receive(socketData);
        } else if (type.indexOf("invite") === 0) {
            invite.transmissionReceipt(socketData);
        } else if (type === "message") {
            message.receive(socketData);
        } else if (type === "test-browser" && location.href.indexOf("?test_browser") > 0) {
            remote.receive(socketData);
        }
    },

    /* Performs the HTTP request */
    send: function browser_network_send(data:socketDataType, service:requestType, callback:(responseString:string) => void):void {
        const socketData:socketData = {
            data: data,
            service: service
        };
        if (callback === null && webSocket.send !== null) {
            webSocket.send(socketData);
        } else {
            network.http(socketData, callback);
        }
    }
};

export default network;