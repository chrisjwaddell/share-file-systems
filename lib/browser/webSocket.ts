
/* lib/browser/webSocket - Handles web socket events and associated errors. This where most communications from outside the browser are processed. */
import browser from "./browser.js";
import fs from "./fs.js";
import invite from "./invite.js";
import network from "./network.js";
import share from "./share.js";
import systems from "./systems.js";
import util from "./util.js";

const title:Element = document.getElementsByClassName("title")[0],
    titleText:string = title.getElementsByTagName("h1")[0].innerHTML,
    rand:number = Math.random(),
    sock:WebSocketObject = {
        [`sock${rand}`]: (function local_socket():WebSocketLocal {
            // A minor security circumvention.
            const socket:WebSocketLocal = <WebSocketLocal>WebSocket;
            WebSocket = null;
            return socket;
        }())
    },
    message = function local_socketMessage(event:SocketEvent):void {
        if (typeof event.data !== "string") {
            return;
        }
        const error = function local_socketMessage_error():void {
                const errorData:socketError = JSON.parse(event.data).error,
                    modal:Element = document.getElementById("systems-modal"),
                    tabs:HTMLElement = <HTMLElement>modal.getElementsByClassName("tabs")[0],
                    payload:string = JSON.stringify(errorData);
                systems.message("errors", payload, "websocket");
                if (modal.clientWidth > 0) {
                    tabs.style.width = `${modal.getElementsByClassName("body")[0].scrollWidth / 10}em`;
                }
            },
            fsUpdateLocal = function local_socketMessage_fsUpdateLocal():void {
                const modalKeys:string[] = Object.keys(browser.data.modals),
                    fsData:directoryList = JSON.parse(event.data)["fs-update-local"],
                    keyLength:number = modalKeys.length;
                let root:string = fsData[0][0],
                    a:number = 0;
                if ((/^\w:$/).test(root) === true) {
                    root = root + "\\";
                }
                do {
                    if (browser.data.modals[modalKeys[a]].type === "fileNavigate" && browser.data.modals[modalKeys[a]].text_value === root && browser.data.modals[modalKeys[a]].agent === browser.data.hashDevice) {
                        const box:Element = document.getElementById(modalKeys[a]),
                            body:Element = box.getElementsByClassName("body")[0],
                            list:[Element, number, string] = fs.list(root, {
                                dirs: fsData,
                                fail: fsData.failures,
                                id: modalKeys[a]
                            });
                        body.innerHTML = "";
                        body.appendChild(list[0]);
                        box.getElementsByClassName("status-bar")[0].getElementsByTagName("p")[0].innerHTML = list[2];
                    }
                    a = a + 1;
                } while (a < keyLength);
                if (a === keyLength) {
                    const payload:fileService = {
                        action: "fs-close",
                        agent: browser.data.hashDevice,
                        agentType: "device",
                        copyAgent: "",
                        copyType: "device",
                        depth: 1,
                        id: "",
                        location: [root],
                        name: "",
                        watch: "no"
                    },
                    callback = function local_socketMessage_closeCallback():boolean {
                        return true;
                    };
                    network.fs(payload, callback);
                }
            },
            fsUpdateRemote = function local_socketMessage_fsUpdateRemote():void {
                const data:fsUpdateRemote = JSON.parse(event.data)["fs-update-remote"],
                    list:[Element, number, string] = fs.list(data.location, {
                        dirs: data.dirs,
                        id: data.location,
                        fail: data.fail
                    }),
                    modalKeys:string[] = Object.keys(browser.data.modals),
                    keyLength:number = modalKeys.length;
                let a:number = 0,
                    modalAgent:string,
                    body:Element,
                    box:Element,
                    status:Element;
                do {
                    modalAgent = browser.data.modals[modalKeys[a]].agent;
                    if (browser.data.modals[modalKeys[a]].type === "fileNavigate" && browser.data.modals[modalKeys[a]].text_value === data.location && data.agent === modalAgent) {
                        box = document.getElementById(browser.data.modals[modalKeys[a]].id);
                        if (box !== null) {
                            body = box.getElementsByClassName("body")[0];
                            body.innerHTML = "";
                            body.appendChild(list[0]);
                            status = box.getElementsByClassName("status-bar")[0];
                            if (status !== undefined) {
                                status.getElementsByTagName("p")[0].innerHTML = list[2];
                            }
                        }
                    }
                    a = a + 1;
                } while (a < keyLength);
                if (typeof data.status === "string") {
                    util.fileListStatus(data.status);
                }
            },
            heartbeatDevice = function local_socketMessage_heartbeatUser():void {
                const heartbeat:heartbeatDevice = JSON.parse(event.data)["heartbeat-response-device"],
                    button:Element = document.getElementById(heartbeat.agentFrom);

                if (heartbeat.status === "deleted") {
                    share.deleteAgent(heartbeat.agentFrom, heartbeat.agentType);
                    share.update();
                    network.storage(heartbeat.agentType);
                    network.storage("settings");
                } else {
                    if (button !== null && button.getAttribute("data-agent-type") === heartbeat.agentType) {
                        button.setAttribute("class", heartbeat.status);
                    }
                    if (heartbeat.shareFrom !== "" && JSON.stringify(heartbeat.shares) !== JSON.stringify(browser.device)) {
                        const keys:string[] = Object.keys(heartbeat.shares),
                            length:number = keys.length;
                        let a:number = 0;
                        do {
                            if (browser[heartbeat.agentType][keys[a]] === undefined) {
                                browser[heartbeat.agentType][keys[a]] = heartbeat.shares[keys[a]];
                                share.addAgent(heartbeat.shares[keys[a]].name, keys[a], "device");
                            } else {
                                browser[heartbeat.agentType][keys[a]] = heartbeat.shares[keys[a]];
                            }
                            a = a + 1;
                        } while (a < length);
                        share.update();
                        network.storage(heartbeat.agentType);
                    }
                }
            },
            heartbeatUser = function local_socketMessage_heartbeatUser():void {
                const heartbeat:heartbeatUser = JSON.parse(event.data)["heartbeat-response-user"],
                    button:Element = document.getElementById(heartbeat.agentFrom);

                if (heartbeat.status === "deleted") {
                    share.deleteAgent(heartbeat.agentFrom, heartbeat.agentType);
                    share.update();
                    network.storage(heartbeat.agentType);
                    network.storage("settings");
                } else {
                    if (button !== null && button.getAttribute("data-agent-type") === heartbeat.agentType) {
                        button.setAttribute("class", heartbeat.status);
                    }
                    if (heartbeat.shareFrom !== "" && JSON.stringify(heartbeat.shares) !== JSON.stringify(browser[heartbeat.agentType][heartbeat.shareFrom].shares)) {
                        browser[heartbeat.agentType][heartbeat.shareFrom].shares = heartbeat.shares;
                        share.update();
                        network.storage(heartbeat.agentType);
                    }
                }
            },
            invitation = function local_socketMessage_invite():void {
                const inviteData:invite = JSON.parse(event.data)["invite-error"],
                    modal:Element = document.getElementById(inviteData.modal);
                if (modal === null) {
                    return;
                }
                let footer:HTMLElement = <HTMLElement>modal.getElementsByClassName("footer")[0],
                    content:HTMLElement = <HTMLElement>modal.getElementsByClassName("inviteUser")[0],
                    p:Element = document.createElement("p");
                p.innerHTML = inviteData.message;
                p.setAttribute("class", "error");
                content.appendChild(p);
                content.parentNode.removeChild(content.parentNode.lastChild);
                content.style.display = "block";
                footer.style.display = "block";
            };
        if (event.data.indexOf("{\"error\":") === 0) {
            error();
        } else if (event.data.indexOf("{\"file-list-status\":") === 0) {
            util.fileListStatus(JSON.parse(event.data)["file-list-status"]);
        } else if (event.data.indexOf("{\"fs-update-local\":") === 0 && browser.loadTest === false) {
            fsUpdateLocal();
        } else if (event.data.indexOf("{\"fs-update-remote\":") === 0) {
            fsUpdateRemote();
        } else if (event.data.indexOf("{\"heartbeat-response-device\":") === 0) {
            heartbeatDevice();
        } else if (event.data.indexOf("{\"heartbeat-response-user\":") === 0) {
            heartbeatUser();
        } else if (event.data.indexOf("{\"invite-error\":") === 0) {
            invitation();
        } else if (event.data.indexOf("{\"invite\":") === 0) {
            invite.respond(event.data);
        } else if (event.data === "reload") {
            location.reload();
        }
    },
    open = function local_socketOpen():void {
        const device:Element = document.getElementById(browser.data.hashDevice);
        if (device !== null) {
            device.setAttribute("class", "active");
        }
        title.getElementsByTagName("h1")[0].innerHTML = titleText;
        title.setAttribute("class", "title");
    },
    webSocket = function local_webSocket():WebSocket {
        const socket:WebSocket = new sock[`sock${rand}`](`ws://localhost:${browser.localNetwork.wsPort}/`),
            error = function local_socketError():any {
                const device:Element = document.getElementById(browser.data.hashDevice);
                title.setAttribute("class", "title offline");
                title.getElementsByTagName("h1")[0].innerHTML = "Local service terminated.";
                if (device !== null) {
                    device.setAttribute("class", "offline");
                }
                setTimeout(function local_socketError_timeout():void {
                    browser.socket = local_webSocket();
                }, 5000);
            };

        /* Handle Web Socket responses */
        socket.onopen = open;
        socket.onmessage = message;
        socket.onclose = error;
        return socket;
    };

export default webSocket;