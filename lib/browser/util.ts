import audio from "./audio.js";
import browser from "./browser.js";
import context from "./context.js";
import fs from "./fs.js";
import modal from "./modal.js";
import network from "./network.js";

const util:module_util = {},
    expression:RegExp = new RegExp("(\\s+((selected)|(cut)|(lastType)))+");

/* Adds users to the user bar */
util.addUser = function local_util_addUser(user:string):void {
    const li:HTMLLIElement = document.createElement("li"),
        button:HTMLElement = document.createElement("button"),
        name:string = (user.lastIndexOf("@localhost") === user.length - "@localhost".length)
            ? "localhost"
            : user,
        addStyle = function local_util_addUser_addStyle() {
            let body:string,
                heading:string;
            const prefix:string = `#spaces .box[data-agent="${user}"] `,
                generateColor = function local_util_addUser_addStyle_generateColor():void {
                    const rand:[number, number, number] = [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)],
                        code1:string[] = ["#"],
                        code2:string[] = ["#"];
                    rand.forEach(function local_util_addUser_addStyle_generateColor_each(value:number) {
                        if (value < 4) {
                            code1.push("d");
                            code2.push("c");
                        } else if (value < 7) {
                            code1.push("e");
                            code2.push("d");
                        } else {
                            code1.push("f");
                            code2.push("e");
                        }
                    });
                    body = code1.join("");
                    heading = code2.join("");
                };
            if (browser.users[user].color[0] === "") {
                generateColor();
                if (body.charAt(1) === body.charAt(2) && body.charAt(2) === body.charAt(3)) {
                    do {
                        generateColor();
                    } while (body.charAt(1) === body.charAt(2) && body.charAt(2) === body.charAt(3));
                }
                browser.users[user].color = [body, heading];
            } else {
                body = browser.users[user].color[0];
                heading = browser.users[user].color[1];
            }
            browser.style.innerHTML = browser.style.innerHTML + [
                `#spaces #users button[data-agent="${user}"],${prefix}.status-bar,${prefix}.footer,${prefix} h2.heading{background-color:${heading}}`,
                `${prefix}.body,#spaces #users button[data-agent="${user}"]:hover{background-color:${body}}`
            ].join("");
        };
    button.innerHTML = `<em class="status-active">●<span> Active</span></em><em class="status-idle">●<span> Idle</span></em><em class="status-offline">●<span> Offline</span></em> ${user}`;
    if (name === "localhost") {
        button.setAttribute("class", "active");
    } else {
        button.setAttribute("class", "offline");
        button.setAttribute("data-agent", user);
        addStyle();
    }
    button.onclick = function local_util_addUser(event:MouseEvent) {
        let element:HTMLElement = <HTMLElement>event.srcElement || <HTMLElement>event.target,
            name:string;
        if (element.nodeName.toLowerCase() !== "button") {
            do {
                element = <HTMLElement>element.parentNode;
            } while (element.nodeName.toLowerCase() !== "button" && element !== document.documentElement);
        }
        name = element.lastChild.textContent.replace(/^\s+/, "");
        modal.shares(event, name, null);
    };
    li.appendChild(button);
    document.getElementById("users").getElementsByTagName("ul")[0].appendChild(li);
    if (name === "localhost") {
        button.setAttribute("id", "localhost");
    }
    network.storage("users", false);
};

util.audio = function local_util_audio(name:string):void {
    const context:AudioContext = new AudioContext(),
        binary:BinaryType = <BinaryType>window.atob(audio[name].data),
        source:AudioBufferSourceNode  = context.createBufferSource(),
        buff:ArrayBuffer   = new ArrayBuffer(binary.length),
        bytes:Uint8Array   = new Uint8Array(buff),
        byteLength:number = buff.byteLength;
    let a:number       = 0;
    do {
        bytes[a] = binary.charCodeAt(a);
        a = a + 1;
    } while (a < byteLength);
    context.decodeAudioData(buff, function load_util_audio_decode(buffer:AudioBuffer):void {
        source.buffer = buffer;
        source.loop   = false;
        source.connect(context.destination);
        source.start(0, 0, audio[name].seconds);
    });
};

/* Converts a date object into US Army date format */
util.dateFormat = function local_util_dateFormat(date:Date):string {
    const dateData:string[] = [
            date.getFullYear().toString(),
            date.getMonth().toString(),
            date.getDate().toString(),
            date.getHours().toString(),
            date.getMinutes().toString(),
            date.getSeconds().toString(),
            date.getMilliseconds().toString()
        ],
        output:string[] = [];
    let month:string;
    if (dateData[2].length === 1) {
        dateData[2] = `0${dateData[2]}`;
    }
    if (dateData[3].length === 1) {
        dateData[3] = `0${dateData[3]}`;
    }
    if (dateData[4].length === 1) {
        dateData[4] = `0${dateData[4]}`;
    }
    if (dateData[5].length === 1) {
        dateData[5] = `0${dateData[5]}`;
    }
    if (dateData[6].length === 1) {
        dateData[6] = `00${dateData[6]}`;
    } else if (dateData[6].length === 2) {
        dateData[6] = `0${dateData[6]}`;
    }
    if (dateData[1] === "0") {
        month = "JAN";
    } else if (dateData[1] === "1") {
        month = "FEB";
    } else if (dateData[1] === "2") {
        month = "MAR";
    } else if (dateData[1] === "3") {
        month = "APR";
    } else if (dateData[1] === "4") {
        month = "MAY";
    } else if (dateData[1] === "5") {
        month = "JUN";
    } else if (dateData[1] === "6") {
        month = "JUL";
    } else if (dateData[1] === "7") {
        month = "AUG";
    } else if (dateData[1] === "8") {
        month = "SEP";
    } else if (dateData[1] === "9") {
        month = "OCT";
    } else if (dateData[1] === "10") {
        month = "NOV";
    } else if (dateData[1] === "11") {
        month = "DEC";
    }
    output.push(dateData[2]);
    output.push(month);
    output.push(`${dateData[0]},`);
    output.push(`${dateData[3]}:${dateData[4]}:${dateData[5]}.${dateData[6]}`);
    return output.join(" ");
};

/* Create a div element with a spinner and class name of 'delay' */
util.delay = function local_util_delay():HTMLElement {
    const div:HTMLElement = document.createElement("div"),
        text:HTMLElement = document.createElement("p"),
        svg:Element = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    // cspell:disable
    svg.setAttribute("viewBox", "0 0 57 57");
    svg.innerHTML = `<g fill="none" fill-rule="evenodd"><g transform="translate(1 1)" stroke-width="2"><circle cx="5" cy="50" r="5"><animate attributeName="cy" begin="0s" dur="2.2s" values="50;5;50;50" calcMode="linear" repeatCount="indefinite"/><animate attributeName="cx" begin="0s" dur="2.2s" values="5;27;49;5" calcMode="linear" repeatCount="indefinite"/></circle><circle cx="27" cy="5" r="5"><animate attributeName="cy" begin="0s" dur="2.2s" from="5" to="5" values="5;50;50;5" calcMode="linear" repeatCount="indefinite"/><animate attributeName="cx" begin="0s" dur="2.2s" from="27" to="27" values="27;49;5;27" calcMode="linear" repeatCount="indefinite"/></circle><circle cx="49" cy="50" r="5"><animate attributeName="cy" begin="0s" dur="2.2s" values="50;50;5;50" calcMode="linear" repeatCount="indefinite"/><animate attributeName="cx" from="49" to="49" begin="0s" dur="2.2s" values="49;5;27;49" calcMode="linear" repeatCount="indefinite"/></circle></g></g>`;
    //svg.setAttribute("viewBox", "0 0 44 44");
    //svg.innerHTML = `<g fill="none" fill-rule="evenodd" stroke-width="2"><circle cx="22" cy="22" r="1"><animate attributeName="r" begin="0s" dur="1.8s" values="1; 20" calcMode="spline" keyTimes="0; 1" keySplines="0.165, 0.84, 0.44, 1" repeatCount="indefinite"/><animate attributeName="stroke-opacity" begin="0s" dur="1.8s" values="1; 0" calcMode="spline" keyTimes="0; 1" keySplines="0.3, 0.61, 0.355, 1" repeatCount="indefinite"/></circle><circle cx="22" cy="22" r="1"><animate attributeName="r" begin="-0.9s" dur="1.8s" values="1; 20" calcMode="spline" keyTimes="0; 1" keySplines="0.165, 0.84, 0.44, 1" repeatCount="indefinite"/><animate attributeName="stroke-opacity" begin="-0.9s" dur="1.8s" values="1; 0" calcMode="spline" keyTimes="0; 1" keySplines="0.3, 0.61, 0.355, 1" repeatCount="indefinite"/></circle></g>`;
    // cspell:enable
    text.innerHTML = "Waiting on data. Please stand by.";
    div.setAttribute("class", "delay");
    div.appendChild(svg);
    div.appendChild(text);
    return div;
};

/* Drag a selection box to capture a collection of items into a selection */
util.dragBox = function local_util_dragBox(event:Event, callback:Function):void {
    const element:HTMLElement = <HTMLElement>event.srcElement || <HTMLElement>event.target,
        list:HTMLElement = (function local_util_dragBox_list():HTMLElement {
            if (element.getAttribute("class") === "fileList") {
                return element;
            }
            let el:HTMLElement = element;
            do {
                el = <HTMLElement>el.parentNode;
            } while (el !== document.documentElement && el.getAttribute("class") !== "fileList");
            return el;
        }()),
        body:HTMLElement = (function local_util_dragBox_body():HTMLElement {
            let el:HTMLElement = list;
            do {
                el = <HTMLElement>el.parentNode;
            } while (el !== document.documentElement && el.getAttribute("class") !== "body");
            return el;
        }()),
        box:HTMLElement = (function local_util_dragBox_box():HTMLElement {
            let el:HTMLElement = body;
            do {
                el = <HTMLElement>el.parentNode;
            } while (el !== document.documentElement && el.getAttribute("class") !== "box");
            return el;
        }()),
        boxTop:number = box.offsetTop,
        boxLeft:number = box.offsetLeft,
        bodyTop:number = body.offsetTop,
        bodyLeft:number = body.offsetLeft,
        listHeight:number = list.clientHeight,
        bodyHeight:number = body.clientHeight,
        bodyWidth:number = body.clientWidth,
        bodyScrollTop:number = body.scrollTop,
        bodyScrollLeft:number = body.scrollLeft,
        offsetLeft:number = boxLeft + bodyLeft - body.scrollLeft,
        offsetTop:number = boxTop + bodyTop - bodyScrollTop + 50,
        maxUp:number = boxTop + bodyTop + 50 - bodyScrollTop,
        maxDown:number = boxTop + bodyTop + listHeight + 50 - bodyScrollTop,
        maxLeft:number = boxLeft + bodyLeft - bodyScrollLeft,
        maxRight:number = boxLeft + bodyLeft + bodyWidth - 4,
        drag:HTMLElement = document.createElement("div"),
        touch:boolean      = (event !== null && event.type === "touchstart"),
        mouseEvent = <MouseEvent>event,
        touchEvent = <TouchEvent>event,
        x:number = (touch === true)
            ? touchEvent.touches[0].clientX
            : mouseEvent.clientX,
        y:number = (touch === true)
            ? touchEvent.touches[0].clientY
            : mouseEvent.clientY,   
        drop       = function local_util_dragBox_drop(e:Event):boolean {
            callback(event, drag);
            if (drag.parentNode !== null) {
                drag.parentNode.removeChild(drag);
            }
            if (touch === true) {
                document.ontouchmove = null;
                document.ontouchend  = null;
            } else {
                document.onmousemove = null;
                document.onmouseup   = null;
            }
            network.storage("settings");
            e.preventDefault();
            setTimeout(function local_util_dragBox_drop_scroll():void {
                body.scrollLeft = bodyScrollLeft;
                body.scrollTop = bodyScrollTop;
            }, 5);
            return false;
        },
        boxMove = function local_util_dragBox_boxMove(moveEvent:MouseEvent|TouchEvent):boolean {
            const touchEvent:TouchEvent = (touch === true)
                    ? <TouchEvent>moveEvent
                    : null,
                mouseEvent:MouseEvent = (touch === true)
                    ? null
                    : <MouseEvent>moveEvent,
                clientX:number = (touch === true)
                    ? touchEvent.touches[0].clientX
                    : mouseEvent.clientX,
                clientY:number = (touch === true)
                    ? touchEvent.touches[0].clientY
                    : mouseEvent.clientY;
            moveEvent.preventDefault();
            // horizontal
            if (x > clientX) {
                // drag left
                if (clientX > maxLeft) {
                    drag.style.width = `${(x - clientX) / 10}em`;
                    drag.style.left = `${(clientX - offsetLeft) / 10}em`;
                    if (clientX < (viewportX - bodyWidth - 4)) {
                        body.scrollLeft = body.scrollLeft - ((viewportX - bodyWidth - 4) - clientX);
                        viewportX = clientX + bodyWidth + 4;
                    }
                }
            } else {
                // drag right
                if (clientX < maxRight) {
                    drag.style.width = `${(clientX - x) / 10}em`;
                    drag.style.left = `${(x - offsetLeft) / 10}em`;
                    if (clientX > viewportX) {
                        body.scrollLeft = body.scrollLeft + (clientX - viewportX);
                        viewportX = clientX;
                    }
                }
            }

            // vertical
            if (y > clientY) {
                // drag up
                if (clientY > maxUp) {
                    drag.style.height = `${(y - clientY) / 10}em`;
                    drag.style.top = `${(clientY - offsetTop) / 10}em`;
                    if (clientY < (viewportY - bodyHeight - 50)) {
                        body.scrollTop = body.scrollTop - ((viewportY - bodyHeight - 50) - clientY);
                        viewportY = clientY + bodyHeight + 50;
                    }
                }
            } else {
                // drag down
                if (clientY < maxDown) {
                    drag.style.height = `${(clientY - y) / 10}em`;
                    drag.style.top = `${(y - offsetTop) / 10}em`;
                    if (clientY > viewportY) {
                        body.scrollTop = body.scrollTop + (clientY - viewportY);
                        viewportY = clientY;
                    }
                }
            }
            return false;
        };
    let viewportY:number = bodyTop + boxTop + bodyHeight + 50 + bodyScrollTop,
        viewportX:number = bodyLeft + boxLeft + 4 + bodyScrollLeft;
    event.preventDefault();
    drag.setAttribute("id", "dragBox");
    body.insertBefore(drag, body.firstChild);
    if (touch === true) {
        document.ontouchend = drop;
        document.ontouchmove = boxMove;
        document.ontouchstart = null;
    } else {
        document.onmouseup = drop;
        document.onmousemove = boxMove;
        document.onmousedown = null;
    }
};

/* Selects list items in response to drawing a drag box */
util.dragList = function local_util_dragList(event:MouseEvent, dragBox:HTMLElement):void {
    const element:HTMLElement = <HTMLElement>event.srcElement || <HTMLElement>event.target,
        li:HTMLCollectionOf<HTMLElement> = element.getElementsByTagName("li"),
        length:number = li.length,
        perimeter = function local_util_dragList_perimeter(node:HTMLElement):perimeter {
            return {
                bottom: node.offsetTop + node.clientHeight,
                left: node.offsetLeft,
                right: node.offsetLeft + node.clientWidth,
                top: node.offsetTop
            };
        },
        liLocation:perimeter[] = [],
        dragArea:perimeter = perimeter(dragBox);
    let a:number = 0,
        first:number = 0,
        last:number = 0;
    dragBox.parentNode.removeChild(dragBox);
    if (dragArea.bottom < 1) {
        return;
    }
    event.preventDefault();
    if (length > 0) {
        do {
            liLocation.push(perimeter(li[a]));
            a = a + 1;
        } while (a < length);
        // since list items are vertically listed we can account for left and right bounding without a loop
        if (
            // overlap from the middle
            (dragArea.left >= liLocation[0].left && dragArea.right <= liLocation[0].right && (
                (dragArea.bottom >= liLocation[length - 1].bottom && dragArea.top < liLocation[length - 1].bottom) ||
                (dragArea.top <= liLocation[0].top && dragArea.bottom > liLocation[0].top)
            )) ||
            // overlap from the left
            (dragArea.left <= liLocation[0].left && dragArea.right <= liLocation[0].right) ||
            // overlap from the right
            (dragArea.left <= (liLocation[0].left + li[0].clientWidth) && dragArea.right >= liLocation[0].right)
        ) {
            a = 0;
            do {
                if (liLocation[a].top < dragArea.top) {
                    if (liLocation[a].bottom >= dragArea.bottom) {
                        // drag area covering only a single list item
                        if (event.ctrlKey === true) {
                            fs.dragFlag = "control";
                            li[a].click();
                            fs.dragFlag = "";
                        } else if (event.shiftKey === true) {
                            fs.dragFlag = "shift";
                            li[a].click();
                            fs.dragFlag = "";
                        } else {
                            li[a].click();
                        }
                        return;
                    }
                    if (dragArea.top < liLocation[a].bottom) {
                        first = a;
                        if (dragArea.bottom > liLocation[length - 1].bottom) {
                            break;
                        }
                    }
                } else if (liLocation[a].bottom > dragArea.bottom && dragArea.bottom > liLocation[a].top) {
                    last = a;
                    break;
                }
                a = a + 1;
            } while (a < length);
            if (event.ctrlKey === true) {
                fs.dragFlag = "control";
                a = first;
                last = last + 1;
                do {
                    li[a].click();
                    a = a + 1
                } while (a < last);
            } else {
                if (li[first].getElementsByTagName("input")[0].checked === true) {
                    li[first].click();
                }
                li[first].click();
                fs.dragFlag = "shift";
                li[last].click();
            }
            fs.dragFlag = "";
        }
    }
    return;
};

/* A utility to format and describe status bar messaging in a file navigator modal */
util.fileListStatus = function local_util_fileListStatus(text:string):void {
    const data:copyStatus = JSON.parse(text.slice("fileListStatus:".length)),
        modals:HTMLElement[] = (data.target.indexOf("remote-") === 0)
            ? [document.getElementById(data.target.replace("remote-", ""))]
            : (function local_util_fileListStatus_modals():HTMLElement[] {
                const names:string[] = Object.keys(browser.data.modals),
                    address:string = data.target.replace("local-", ""),
                    namesLength:number = names.length,
                    output:HTMLElement[] = [];
                let b:number = 0;
                do {
                    if (browser.data.modals[names[b]].text_value === address) {
                        output.push(document.getElementById(names[b]));
                    }
                    b = b + 1;
                } while (b < namesLength);
                return output;
            }()),
        failLength:number = Math.min(10, data.failures.length),
        fails:HTMLElement = document.createElement("ul"),
        length:number = modals.length;
    let statusBar:HTMLElement,
        list:HTMLElement,
        p:HTMLElement,
        clone:HTMLElement,
        a:number = 0;
    if (length > 0) {
        if (failLength > 0) {
            let b:number = 0,
                li:HTMLElement;
            do {
                li = document.createElement("li");
                li.innerHTML = data.failures[b];
                fails.appendChild(li);
                b = b + 1;
            } while (b < failLength);
            if (data.failures.length > 10) {
                li = document.createElement("li");
                li.innerHTML = "more...";
                fails.appendChild(li);
            }
        }
        do {
            if (modals[a] !== null) {
                statusBar = <HTMLElement>modals[a].getElementsByClassName("status-bar")[0];
                list = statusBar.getElementsByTagName("ul")[0];
                p = statusBar.getElementsByTagName("p")[0];
                p.innerHTML = data.message;
                if (list !== undefined) {
                    statusBar.removeChild(list);
                }
                if (failLength > 0) {
                    clone = <HTMLElement>fails.cloneNode(true);
                    statusBar.appendChild(clone);
                }
            }
            a = a + 1;
        } while (a < length);
    }
};

/* Resizes the interactive area to fit the browser viewport */
util.fixHeight = function local_util_fixHeight():void {
    const height:number   = window.innerHeight || document.getElementsByTagName("body")[0].clientHeight;
    document.getElementById("spaces").style.height = `${height / 10}em`;
    browser.content.style.height = `${(height - 51) / 10}em`;
    document.getElementById("users").style.height = `${(height - 102) / 10}em`;
};

/* Get the agent of a given modal */
util.getAgent = function local_util_getAgent(element:HTMLElement):[string, boolean] {
    const box:HTMLElement = (element.getAttribute("class") === "box")
        ? element
        : (function local_util_getAgent_box():HTMLElement {
            let boxEl:HTMLElement = element;
            do {
                boxEl = <HTMLElement>boxEl.parentNode;
            } while (boxEl !== document.documentElement && boxEl.getAttribute("class") !== "box");
            return boxEl;
        }()),
    id:string = box.getAttribute("id");
    return [browser.data.modals[id].agent, browser.data.modals[id].read_only];
};

/* Invite users to your shared space */
util.inviteStart = function local_util_invite(event:MouseEvent, textInput?:string, settings?:ui_modal):void {
    const invite:HTMLElement = document.createElement("div"),
        separator:string = "|spaces|",
        blur = function local_util_invite_blur(event:FocusEvent):void {
            const element:HTMLElement = <HTMLElement>event.srcElement || <HTMLElement>event.target,
                box:HTMLElement = (function local_util_invite_blur_box():HTMLElement {
                    let item:HTMLElement = element;
                    do {
                        item = <HTMLElement>item.parentNode;
                    } while (item !== document.documentElement && item.getAttribute("class") !== "box");
                    return item;
                }()),
                id:string = box.getAttribute("id"),
                inputs:HTMLCollectionOf<HTMLInputElement> = box.getElementsByTagName("input"),
                textArea:HTMLTextAreaElement = box.getElementsByTagName("textarea")[0];
            browser.data.modals[id].text_value = inputs[0].value + separator + inputs[1].value + separator + textArea.value;
            network.storage("settings");
        };
    let p:HTMLElement = document.createElement("p"),
        label:HTMLElement = document.createElement("label"),
        input:HTMLInputElement = document.createElement("input"),
        text:HTMLTextAreaElement = document.createElement("textarea"),
        textStorage:string,
        values:string[] = [];
    if (settings !== undefined && typeof settings.text_value === "string" && settings.text_value !== "") {
        textStorage = settings.text_value;
        values.push(textStorage.slice(0, textStorage.indexOf(separator)));
        textStorage = textStorage.slice(textStorage.indexOf(separator) + separator.length);
        values.push(textStorage.slice(0, textStorage.indexOf(separator)));
        textStorage = textStorage.slice(textStorage.indexOf(separator) + separator.length);
        values.push(textStorage);
    }
    label.innerHTML = "IP Address";
    input.setAttribute("type", "text");
    if (values.length > 0) {
        input.value = values[0];
    }
    input.onblur = blur;
    label.appendChild(input);
    p.appendChild(label);
    invite.appendChild(p);
    p = document.createElement("p");
    label = document.createElement("label");
    input = document.createElement("input");
    label.innerHTML = "Port";
    input.setAttribute("type", "text");
    input.placeholder = "Number 1024-65535";
    if (values.length > 0) {
        input.value = values[1];
    }
    input.onblur = blur;
    label.appendChild(input);
    p.appendChild(label);
    invite.appendChild(p);
    p = document.createElement("p");
    label = document.createElement("label");
    label.innerHTML = "Invitation Message";
    if (values.length > 0) {
        text.value = values[2];
    }
    text.onblur = blur;
    label.appendChild(text);
    p.appendChild(label);
    invite.appendChild(p);
    invite.setAttribute("class", "inviteUser");
    if (settings === undefined) {
        modal.create({
            agent: "localhost",
            content: invite,
            inputs: ["cancel", "close", "confirm", "maximize", "minimize"],
            read_only: false,
            title: "<span class=\"icon-inviteUser\">❤</span> Invite User",
            type: "invite-request"
        });
    } else {
        settings.content = invite;
        modal.create(settings);
    }
};

/* Receive an invitation from another user */
util.inviteRespond = function local_util_inviteRespond(message:string):void {
    const invite:invite = JSON.parse(message);
    if (invite.status === "invited") {
        const div:HTMLElement = document.createElement("div"),
            modals:string[] = Object.keys(browser.data.modals),
            length:number = modals.length;
        let text:HTMLElement = document.createElement("h3"),
            label:HTMLElement = document.createElement("label"),
            textarea:HTMLTextAreaElement = document.createElement("textarea"),
            a:number = 0;
        do {
            if (browser.data.modals[modals[a]].type === "invite-accept" && browser.data.modals[modals[a]].title === `Invitation from ${invite.name}`) {
                // there should only be one invitation at a time from a given user otherwise there is spam
                return;
            }
            a = a + 1;
        } while (a < length);
        div.setAttribute("class", "userInvitation");
        if (invite.family === "ipv4") {
            text.innerHTML = `User <strong>${invite.name}</strong> from ${invite.ip}:${invite.port} is inviting you to share spaces.`;
        } else {
            text.innerHTML = `User <strong>${invite.name}</strong> from [${invite.ip}]:${invite.port} is inviting you to share spaces.`;
        }
        div.appendChild(text);
        text = document.createElement("p");
        label.innerHTML = `${invite.name} said:`;
        textarea.value = invite.message;
        label.appendChild(textarea);
        text.appendChild(label);
        div.appendChild(text);
        text = document.createElement("p");
        text.innerHTML = `Press the <em>Confirm</em> button to accept the invitation or close this modal to ignore it.`;
        div.appendChild(text);
        text = document.createElement("p");
        text.innerHTML = message;
        text.style.display = "none";
        div.appendChild(text);
        modal.create({
            agent: "localhost",
            content: div,
            height: 300,
            inputs: ["cancel", "confirm", "close"],
            read_only: false,
            title: `Invitation from ${invite.name}`,
            type: "invite-accept",
            width: 500
        });
        util.audio("invite");
    } else {
        let user:string = "";
        const modal:HTMLElement = document.getElementById(invite.modal);
        if (modal === null) {
            if (invite.status === "accepted") {
                if (invite.family === "ipv4") {
                    user = `${invite.name}@${invite.ip}:${invite.port}`;
                } else {
                    user = `${invite.name}@[${invite.ip}]:${invite.port}`;
                }
                browser.users[user] = {
                    color:["", ""],
                    shares: invite.shares
                }
                util.addUser(user);
            }
        } else {
            const error:HTMLElement = <HTMLElement>modal.getElementsByClassName("error")[0],
                delay:HTMLElement = <HTMLElement>modal.getElementsByClassName("delay")[0],
                footer:HTMLElement = <HTMLElement>modal.getElementsByClassName("footer")[0],
                inviteUser:HTMLElement = <HTMLElement>modal.getElementsByClassName("inviteUser")[0],
                prepOutput = function local_util_inviteRespond_prepOutput(output:HTMLElement):void {
                    if (invite.status === "accepted") {
                        output.innerHTML = "Invitation accepted!";
                        output.setAttribute("class", "accepted");
                        if (invite.family === "ipv4") {
                            user = `${invite.name}@${invite.ip}:${invite.port}`;
                        } else {
                            user = `${invite.name}@[${invite.ip}]:${invite.port}`;
                        }
                        browser.users[user] = {
                            color:["", ""],
                            shares: invite.shares
                        }
                        util.audio("invite");
                        util.addUser(user);
                        network.storage("users");
                    } else {
                        output.innerHTML = "Invitation declined. :(";
                        output.setAttribute("class", "error");
                    }
                };
            footer.style.display = "none";
            delay.style.display = "none";
            inviteUser.style.display = "block";
            if (error === null || error === undefined) {
                const p:HTMLElement = document.createElement("p");
                prepOutput(p);
                modal.getElementsByClassName("inviteUser")[0].appendChild(p);
            } else {
                prepOutput(error);
            }
        }
    }
};

/* Shortcut key combinations */
util.keys = function local_util_keys(event:KeyboardEvent):void {
    const key:number = event.keyCode,
        element:HTMLElement = (function local_util_keys_element():HTMLElement {
            let el:HTMLElement = <HTMLElement>event.srcElement || <HTMLElement>event.target;
            if (el.parentNode === null || el.nodeName.toLowerCase() === "li" || el.nodeName.toLowerCase() === "ul") {
                return el;
            }
            do {
                el = <HTMLElement>el.parentNode;
            } while (el !== document.documentElement && el.nodeName.toLowerCase() !== "li");
            return el;
        }());
    if (key === 116 || (event.ctrlKey === true && key === 82)) {
        location.reload();
    }
    if (element.parentNode === null) {
        return;
    }
    event.preventDefault();
    if (element.nodeName.toLowerCase() !== "ul") {
        event.stopPropagation();
    }
    if (key === 46) {
        context.destroy(element);
    } else if (event.altKey === true && event.ctrlKey === true) {
        if (key === 66 && element.nodeName.toLowerCase() === "li") {
            // key b, base64
            context.dataString(event, element, "Base64");
        } else if (key === 68) {
            // key d, new directory
            context.fsNew(element, "directory");
        } else if (key === 69) {
            // key e, edit file
            context.dataString(event, element, "Edit");
        } else if (key === 70) {
            // key f, new file
            context.fsNew(element, "file");
        } else if (key === 72 && element.nodeName.toLowerCase() === "li") {
            // key h, hash
            context.dataString(event, element, "Hash");
        } else if (key === 82 && element.nodeName.toLowerCase() === "li") {
            // key r, rename
            fs.rename(event);
        } else if (key === 83) {
            // key s, share
            context.share(element);
        } else if (key === 84) {
            // key t, details
            context.details(event, element);
        }
    } else if (event.ctrlKey === true) {
        if (key === 65) {
            // key a, select all
            const list:HTMLElement = (element.nodeName.toLowerCase() === "ul")
                    ? element
                    : <HTMLElement>element.parentNode,
                items:HTMLCollectionOf<HTMLElement> = list.getElementsByTagName("li"),
                length:number = items.length;
            let a:number = 0;
            do {
                items[a].setAttribute("class", `${items[a].getAttribute("class").replace(" selected", "")} selected`);
                items[a].getElementsByTagName("input")[0].checked = true;
                a = a + 1;
            } while (a < length);
        } else if (key === 67) {
            // key c, copy
            context.copy(element, "copy");
        } else if (key === 68 && element.nodeName.toLowerCase() === "li") {
            // key d, destroy
            context.destroy(element);
        } else if (key === 86) {
            // key v, paste
            context.paste(element);
        } else if (key === 88) {
            // key x, cut
            context.copy(element, "cut");
        }
    }
};

/* Show/hide for the primary application menu that hangs off the title bar */
util.menu = function local_util_menu():void {
    const menu:HTMLElement = document.getElementById("menu"),
        move = function local_util_menu_move(event:MouseEvent):void {
            const menu:HTMLElement = document.getElementById("menu");
            if (event.clientX > menu.clientWidth || event.clientY > menu.clientHeight + 51) {
                menu.style.display = "none";
                document.onmousemove = null;
            }
        };
    menu.style.display = "block";
    document.onmousemove = move;
};

/* Gather the selected addresses and types of file system artifacts in a fileNavigator modal */
util.selectedAddresses = function local_util_selectedAddresses(element:HTMLElement, type:string):[string, string][] {
    const output:[string, string][] = [],
        parent:HTMLElement = <HTMLElement>element.parentNode,
        drag:boolean = (parent.getAttribute("id") === "file-list-drag");
    let a:number = 0,
        length:number = 0,
        itemList:HTMLCollectionOf<HTMLElement>,
        addressItem:HTMLElement;
    if (element.nodeName.toLowerCase() !== "li") {
        element = <HTMLElement>element.parentNode;
    }
    itemList = (drag === true)
        ? parent.getElementsByTagName("li")
        : (function local_util_selectedAddresses_box():HTMLCollectionOf<HTMLElement> {
            let box:HTMLElement = element;
            if (box.getAttribute("class") !== "box") {
                do {
                    box = <HTMLElement>box.parentNode;
                } while (box !== document.documentElement && box.getAttribute("class") !== "box");
            }
            return box.getElementsByClassName("fileList")[0].getElementsByTagName("li");
        }());
    length = itemList.length;
    do {
        if (itemList[a].getElementsByTagName("input")[0].checked === true) {
            addressItem = (itemList[a].firstChild.nodeName.toLowerCase() === "button")
                ? <HTMLElement>itemList[a].firstChild.nextSibling
                : <HTMLElement>itemList[a].firstChild;
            output.push([addressItem.innerHTML, itemList[a].getAttribute("class").replace(expression, "")]);
            if (type === "cut") {
                itemList[a].setAttribute("class", itemList[a].getAttribute("class").replace(expression, " cut"));
            }
        } else {
            itemList[a].setAttribute("class", itemList[a].getAttribute("class").replace(expression, ""));
        }
        a = a + 1;
    } while (a < length);
    if (output.length > 0) {
        return output;
    }
    output.push([element.getElementsByTagName("label")[0].innerHTML, element.getAttribute("class")]);
    if (type === "cut") {
        element.setAttribute("class", element.getAttribute("class").replace(expression, " cut"));
    }
    return output;
};

/* Remove selections of file system artifacts in a given fileNavigator modal */
util.selectNone = function local_util_selectNone(element:HTMLElement):void {
    let a:number = 0,
        inputLength:number,
        li:HTMLCollectionOf<HTMLElement>,
        inputs:HTMLCollectionOf<HTMLInputElement>,
        box:HTMLElement = element,
        fileList:HTMLElement;
    if (box.getAttribute("class") !== "box") {
        do {
            box = <HTMLElement>box.parentNode;
        } while (box !== document.documentElement && box.getAttribute("class") !== "box");
    }
    fileList = <HTMLElement>box.getElementsByClassName("fileList")[0];
    inputs = fileList.getElementsByTagName("input");
    li = fileList.getElementsByTagName("li");
    inputLength = inputs.length;
    if (inputLength > 0) {
        do {
            if (inputs[a].type === "checkbox") {
                inputs[a].checked = false;
                li[a].setAttribute("class", li[a].getAttribute("class").replace(expression, ""));
            }
            a = a + 1;
        } while (a < inputLength);
    }
};

/* Generate the content of a share modal */
util.shareContent = function local_util_shareContent(user:string):HTMLElement {
    if (user === undefined) {
        return document.getElementById("systems-modal");
    }
    const userKeys:string[] = Object.keys(browser.users),
        keyLength:number = userKeys.length,
        fileNavigate = function local_util_shareContent_fileNavigate(event:MouseEvent):void {
            const element:HTMLElement = <HTMLElement>event.srcElement || <HTMLElement>event.target,
                path:string = element.firstChild.textContent,
                type:string = element.getAttribute("class"),
                slash:string = (path.indexOf("/") > -1 && (path.indexOf("\\") < 0 || path.indexOf("\\") > path.indexOf("/")))
                    ? "/"
                    : "\\";
            let address:string,
                agent:string = element.parentNode.parentNode.previousSibling.firstChild.textContent;
            if (type === "file" || type === "link") {
                const dirs:string[] = path.replace(/\\/g, "/").split("/");
                dirs.pop();
                address = dirs.join(slash);
            } else {
                address = path;
            }
            fs.navigate(event, {
                agentName: agent,
                path: address,
                readOnly: (agent !== "localhost" && element.getElementsByClassName("read-only-status")[0].innerHTML === "(Read Only)")
            });
        };
    let users:HTMLElement,
        eachUser:HTMLElement;
    if (typeof user === "string" && user.indexOf("@localhost") === user.length - 10) {
        user = "localhost";
    }
    if (keyLength === 1 && browser.users.localhost.shares.length === 0) {
        users = document.createElement("h3");
        users.innerHTML = "There are no shares at this time.";
    } else {
        let userName:HTMLElement,
            itemList:HTMLElement,
            item:HTMLElement,
            button:HTMLElement,
            del:HTMLElement,
            readOnly:HTMLElement,
            status:HTMLElement,
            span:HTMLElement,
            a:number = 0,
            b:number = 0,
            shareLength:number,
            type:string;
        const eachItem = function local_util_shareContent_eachItem(userName:string):void {
            item = document.createElement("li");
            button = document.createElement("button");
            type = browser.users[userName].shares[b].type;
            button.setAttribute("class", type);
            button.innerHTML = browser.users[userName].shares[b].name;
            status = document.createElement("strong");
            status.setAttribute("class", "read-only-status");
            status.innerHTML = (browser.users[userName].shares[b].readOnly === true)
                ? "(Read Only)"
                : "(Full Access)"
            button.appendChild(status);
            if (type === "directory" || type === "file" || type === "link") {
                button.onclick = fileNavigate;
            }
            if (userName === "localhost") {
                readOnly = document.createElement("button");
                if (browser.users.localhost.shares[b].readOnly === true) {
                    item.setAttribute("class", "localhost");
                    readOnly.setAttribute("class", "grant-full-access");
                    readOnly.innerHTML = ("Grant Full Access");
                } else {
                    item.setAttribute("class", "localhost full-access");
                    readOnly.setAttribute("class", "make-read-only");
                    readOnly.innerHTML = ("Make Read Only");
                }
                readOnly.onclick = util.shareReadOnly;
                del = document.createElement("button");
                del.setAttribute("class", "delete");
                del.setAttribute("title", "Delete this share");
                del.innerHTML = "\u2718<span>Delete this share</span>";
                del.onclick = util.shareItemDelete;
                span = document.createElement("span");
                span.setAttribute("class", "clear");
                item.appendChild(del);
                item.appendChild(button);
                item.appendChild(readOnly);
                item.appendChild(button);
                item.appendChild(span);
            } else {
                if (browser.users[userName].shares[b].readOnly === true) {
                    item.removeAttribute("class");
                } else {
                    item.setAttribute("class", "full-access");
                }
                item.appendChild(button);
            }
            itemList.appendChild(item);
        };
        if (user === "") {
            users = document.createElement("ul");
            users.setAttribute("class", "userList");
            do {
                eachUser = document.createElement("li");
                userName = document.createElement("h3");
                userName.setAttribute("class", "user");
                userName.innerHTML = userKeys[a];
                eachUser.appendChild(userName);
                shareLength = browser.users[userKeys[a]].shares.length;
                if (shareLength > 0) {
                    b = 0;
                    itemList = document.createElement("ul");
                    do {
                        eachItem(userKeys[a]);
                        b = b + 1;
                    } while (b < shareLength);
                } else {
                    itemList = document.createElement("p");
                    itemList.innerHTML = "This user is not sharing anything.";
                }
                eachUser.appendChild(itemList);
                users.appendChild(eachUser);
                a = a + 1;
            } while (a < keyLength);
        } else {
            shareLength = browser.users[user].shares.length;
            users = document.createElement("div");
            users.setAttribute("class", "userList");
            userName = document.createElement("h3");
            userName.setAttribute("class", "user");
            userName.innerHTML = user;
            if (shareLength === 0) {
                itemList = document.createElement("p");
                itemList.innerHTML = `User ${user} is not sharing anything.`;
            } else {
                itemList = document.createElement("ul");
                do {
                    eachItem(user);
                    b = b + 1;
                } while (b < shareLength);
            }
            users.appendChild(userName);
            users.appendChild(itemList);
        }
    }
    return users;
};

/* Delete a localhost share */
util.shareItemDelete = function local_util_shareItemDelete(event:MouseEvent):void {
    const element:HTMLElement = <HTMLElement>event.srcElement || <HTMLElement>event.target,
        parent:HTMLElement = <HTMLElement>element.parentNode,
        address:string = parent.getElementsByClassName("read-only-status")[0].previousSibling.textContent,
        shares:userShares = browser.users.localhost.shares,
        length:number = shares.length;
    let a:number = 0;
    parent.parentNode.removeChild(parent);
    do {
        if (shares[a].name === address) {
            shares.splice(a, 1);
            break;
        }
        a = a + 1;
    } while (a < length);
    network.storage("users");
};

/* Toggle a share between read only and full access */
util.shareReadOnly = function local_util_shareReadOnly(event:MouseEvent):void {
    const element:HTMLElement = <HTMLElement>event.srcElement || <HTMLElement>event.target,
        parent:HTMLElement = <HTMLElement>element.parentNode,
        address:string = parent.getElementsByClassName("read-only-status")[0].previousSibling.textContent,
        shares:userShares = browser.users.localhost.shares,
        length:number = shares.length,
        span:HTMLElement = <HTMLElement>parent.getElementsByClassName("read-only-status")[0];
    let a:number = 0;
    do {
        if (shares[a].name === address) {
            if (shares[a].readOnly === true) {
                shares[a].readOnly = false;
            } else {
                shares[a].readOnly = true;
            }
            break;
        }
        a = a + 1;
    } while (a < length);
    if (element.getAttribute("class") === "grant-full-access") {
        element.setAttribute("class", "make-read-only");
        parent.setAttribute("class", "localhost full-access");
        element.innerHTML = "Make Read Only";
        span.innerHTML = "(Full Access)";
    } else {
        element.setAttribute("class", "grant-full-access");
        parent.setAttribute("class", "localhost");
        element.innerHTML = "Grant Full Access";
        span.innerHTML = "(Read Only)";
    }
    network.storage("users");
};

/* Updates the contents of share modals */
util.shareUpdate = function local_util_shareUpdate(user:string, shares:userShares, id?:string):void {
    let a:number = 0,
        b:number = 0,
        shareBest:number = -1,
        shareTop:number = -1,
        title:HTMLElement,
        box:HTMLElement,
        body:HTMLElement,
        titleText:string,
        parentDirectory:HTMLElement,
        back:HTMLElement,
        header:HTMLElement,
        address:string,
        fileShares:boolean = false;
    const modals:string[] = (id === undefined)
            ? Object.keys(browser.data.modals)
            : [id],
        modalLength:number = modals.length,
        shareLength:number = shares.length,
        windows:boolean = (function local_util_shareUpdate_windows():boolean {
            if (shareLength < 1) {
                return false;
            }
            do {
                if (shares[b].type === "directory" || shares[b].type === "file" || shares[b].type === "link") {
                    fileShares = true;
                    if (shares[0].name.charAt(0) === "\\" || (/^\w:\\/).test(shares[0].name) === true) {
                        return true;
                    }
                    return false;
                }
                b = b + 1;
            } while (b < shareLength);
            return false;
        }());
    browser.users[user].shares = shares;
    do {
        box = document.getElementById(modals[a]);
        if (browser.data.modals[modals[a]].type === "shares" && (browser.data.modals[modals[a]].agent === "" || browser.data.modals[modals[a]].agent === user)) {
            body = <HTMLElement>box.getElementsByClassName("body")[0];
            body.innerHTML = "";
            body.appendChild(util.shareContent(browser.data.modals[modals[a]].agent));
        } else if (fileShares === true && browser.data.modals[modals[a]].type === "fileNavigate" && browser.data.modals[modals[a]].agent === user && shareLength > 0) {
            b = 0;
            shareBest = -1;
            shareTop = -1;
            title = <HTMLElement>box.getElementsByClassName("heading")[0].getElementsByTagName("button")[0];
            titleText = title.innerHTML;
            parentDirectory = <HTMLElement>box.getElementsByClassName("parentDirectory")[0];
            back = <HTMLElement>box.getElementsByClassName("backDirectory")[0];
            header = <HTMLElement>parentDirectory.parentNode;
            address = browser.data.modals[modals[a]].text_value;
            do {
                if (address.indexOf(shares[b].name) === 0 || (windows === true && address.toLowerCase().indexOf(shares[b].name.toLowerCase()) === 0)) {
                    if (shareBest < 0) {
                        shareBest = b;
                        shareTop = b;
                    }
                    if (shares[b].name.length > shares[shareBest].name.length) {
                        shareBest = b;
                    } else if (shares[b].name.length < shares[shareTop].name.length) {
                        shareTop = b;
                    }
                }
                b = b + 1;
            } while (b < shareLength);
            if (shareBest > -1) {
                if (browser.data.modals[box.getAttribute("id")].agent !== "localhost") {
                    if (shares[shareBest].readOnly === true) {
                        titleText = titleText.replace(/\s+(\(Read\s+Only\)\s+)?-\s+/, " (Read Only) - ");
                        title.innerHTML = titleText;
                        browser.data.modals[modals[a]].title = titleText;
                        browser.data.modals[modals[a]].read_only = true;
                    } else {
                        titleText = titleText.replace(" (Read Only)", "");
                        title.innerHTML = titleText;
                        browser.data.modals[modals[a]].title = titleText;
                        browser.data.modals[modals[a]].read_only = false;
                    }
                    if (address === shares[shareTop].name || (windows === true && address.toLowerCase() === shares[shareTop].name.toLowerCase())) {
                        parentDirectory.style.display = "none";
                        back.style.marginLeft = "-6em";
                        header.style.paddingLeft = "10.5em";
                    } else {
                        parentDirectory.style.display = "inline-block";
                        back.style.marginLeft = "-9em";
                        header.style.paddingLeft = "15em";
                    }
                }
            }
        }
        a = a + 1;
    } while (a < modalLength);
};

export default util;