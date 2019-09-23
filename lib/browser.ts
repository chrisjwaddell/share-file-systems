import { fs } from "./fs.js";
import { network } from "./network.js";
import { systems } from "./systems.js";
import { util } from "./util.js";

const browser:browser = {
    characterKey: "",
    content: document.getElementById("content-area"),
    data: {
        modals: {},
        modalTypes: [],
        name: "",
        shares: {
            localhost: []
        },
        zIndex: 0
    },
    loadTest: true,
    localNetwork: (function local_network():localNetwork {
        let str:string = document.getElementsByTagName("body")[0].innerHTML,
            pattern:string = "<!--network:";
        str = str.slice(str.indexOf(pattern) + pattern.length);
        str = str.slice(0, str.indexOf("-->"));
        return JSON.parse(str);
    }()),
    messages: {
        status: [],
        users: [],
        errors: []
    },
    pageBody: document.getElementsByTagName("body")[0]
};

browser.WS = function local_webSocket():WebSocket {
    const socket:WebSocket = (browser.localNetwork.family === "ipv4")
            ? new WebSocket(`ws://${browser.localNetwork.ip}:${browser.localNetwork.wsPort}`)
            : new WebSocket(`ws://[${browser.localNetwork.ip}]:${browser.localNetwork.wsPort}`),
        title:HTMLElement = <HTMLElement>document.getElementsByClassName("title")[0];
    
    title.style.background = "#ddd";
    title.getElementsByTagName("h1")[0].innerHTML = "Shared Spaces";

    /* Handle Web Socket responses */
    socket.onmessage = function local_socketMessage(event:SocketEvent):void {
        if (event.data === "reload") {
            location.reload();
        } else if (event.data.indexOf("error:") === 0) {
            const errorData:string = event.data.slice(6),
                modal:HTMLElement = document.getElementById("systems-modal"),
                tabs:HTMLElement = <HTMLElement>modal.getElementsByClassName("tabs")[0];
            systems.message("errors", errorData, "websocket");
            if (modal.clientWidth > 0) {
                tabs.style.width = `${modal.getElementsByClassName("body")[0].scrollWidth / 10}em`;
            }
        } else if (event.data.indexOf("fsUpdate:") === 0) {
            const value:string = event.data.slice(9).replace(/(\\|\/)+$/, "").replace(/\\\\/g, "\\"),
                modalKeys:string[] = Object.keys(browser.data.modals),
                keyLength:number = modalKeys.length;
            let a:number = 0;
            do {
                if (browser.data.modals[modalKeys[a]].type === "fileNavigate" && browser.data.modals[modalKeys[a]].text_value === value) {
                    const body:HTMLElement = <HTMLElement>document.getElementById(modalKeys[a]).getElementsByClassName("body")[0];
                    network.fs({
                        action: "fs-read",
                        agent: "self",
                        depth: 2,
                        location: [value],
                        name: "",
                        watch: "no"
                    }, function local_socketMessage_fsCallback(responseText:string):void {
                        body.innerHTML = "";
                        body.appendChild(fs.list(value, responseText));
                    });
                    break;
                }
                a = a + 1;
            } while (a < keyLength);
            if (a === keyLength) {
                network.fs({
                    action: "fs-close",
                    agent: "self",
                    depth: 1,
                    location: [value],
                    name: "",
                    watch: "no"
                }, function local_socketMessage_closeCallback():boolean {
                    return true;
                });
            }
        } else if (event.data.indexOf("heartbeat:") === 0) {
            const heartbeat:heartbeat = JSON.parse(event.data.split("heartbeat:")[1]),
                buttons:HTMLCollectionOf<HTMLElement> = document.getElementById("users").getElementsByTagName("button"),
                length:number = buttons.length;
            let a:number = 0;
            do {
                if (buttons[a].innerHTML === heartbeat.user) {
                    buttons[a].setAttribute("class", heartbeat.status);
                    break;
                }
                a = a + 1;
            } while (a < length);
        } else if (event.data.indexOf("invite:") === 0) {
            util.inviteRespond(event.data.slice(7));
        } else if (event.data.indexOf("invite-error:") === 0) {
            const inviteData:inviteError = JSON.parse(event.data.slice(13)),
                modal:HTMLElement = <HTMLElement>document.getElementById(inviteData.modal);
            if (modal === null) {
                return;
            }
            let footer:HTMLElement = <HTMLElement>modal.getElementsByClassName("footer")[0],
                content:HTMLElement = <HTMLElement>modal.getElementsByClassName("inviteUser")[0],
                p:HTMLElement = document.createElement("p");
            p.innerHTML = inviteData.error;
            p.setAttribute("class", "error");
            content.appendChild(p);
            content.parentNode.removeChild(content.parentNode.lastChild);
            content.style.display = "block";
            footer.style.display = "block";
        }
    };
    socket.onclose = function local_socketClose():void {
        title.style.background = "#ff6";
        title.getElementsByTagName("h1")[0].innerHTML = "Local service terminated.";
        document.getElementById("localhost").setAttribute("class", "offline");
    };
    socket.onerror = function local_socketError(this:WebSocket):any {
        setTimeout(function local_socketError():void {
            local_webSocket();
        }, 15000);
    };
    return socket;
};

export { browser };