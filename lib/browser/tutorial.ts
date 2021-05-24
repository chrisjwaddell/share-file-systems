/* lib/browser/tutorial - An interactive tutorial explaining the application. */

import browser from "./browser.js";
import modal from "./modal.js";
import network from "./network.js";
import remote from "./remote.js";

const tutorial = function browser_tutorial():void {
    let index:number = 0,
        delay:NodeJS.Timeout,
        modalId:string = "";
    const tutorialData:tutorialData[] = [
            {
                description: [
                    "This is an interactive tutorial designed to guide you through various basic features of the application. You may escape this tutorial at any time by <strong>clicking</strong> the <strong>close button</strong> on the top right corner of this modal.",
                    "At each step in the tutorial focus will be shifted to the area of concentration which will also be marked by a brightly colored dashed outline.",
                    "You may skip any step in this tutorial by pressing the <strong>ESC</strong> key on your keyboard.",
                    "For the first step please click the <strong>main menu button</strong> at the top left corner of the application window."
                ],
                event: "click",
                node: [
                    ["getElementById", "menuToggle", null]
                ],
                title: "Welcome to Share File Systems"
            },
            {
                description: [
                    "This is the main menu where most of the application's functionality is offered.",
                    "The tutorial will display the next step in 5 seconds."
                ],
                event: "wait",
                node: [
                    ["getElementById", "menu", null]
                ],
                title: "Main menu"
            },
            {
                description: [
                    "<strong>Click</strong> on the <strong>File Navigator button</strong> from the main menu to open a File Navigate modal."
                ],
                event: "click",
                node: [
                    ["getElementById", "fileNavigator", null]
                ],
                title: "Open a File Navigate modal"
            },
            {
                description: [
                    "This tutorial messaging is probably overlapping our File Navigator modal, so let's move it out of the way.",
                    "If you are a not a mouse user press the <strong>ESC</strong> key to move to the next tutorial step."
                ],
                event: "mouseup",
                node: [
                    ["getModalsByModalType", "document", 0],
                    ["getElementsByClassName", "heading", 0],
                    ["getElementsByTagName", "button", 0]
                ],
                title: "Move a modal"
            },
            {
                description: [
                    "<strong>Click</strong> onto the <strong>address bar</strong> of the file navigator modal.",
                    "In this address field you may freely type a file system path to display another file system location.",
                    "Adjacent to this address field are three buttons: Back, Reload, and Parent.  The <em>Back</em> button returns the file navigator modal to a prior location.  The <em>Reload</em> button refreshes the contents of the file navigator modal at the current location.  The <em>Parent</em> button directs the modal to the parent directory."
                ],
                event: "click",
                node: [
                    ["getElementById", "", null],
                    ["getElementsByClassName", "fileAddress", 0],
                    ["getElementsByTagName", "input", 0]
                ],
                title: "Let's look at file navigation"
            },
            {
                description: [
                    "At any time view the contents of a directory by <strong>clicking</strong> on the <strong>expansion button</strong>. This allows viewing a child directory contents without moving from the current directory location."
                ],
                event: "click",
                node: [
                    ["getElementById", "", null],
                    ["getElementsByClassName", "fileList", 0],
                    ["getElementsByTagName", "li", 0],
                    ["getElementsByClassName", "expansion", 0]
                ],
                title: "Expand a directory"
            }
        ],
        dataLength:number = tutorialData.length,
        data = function browser_tutorial_data(index:number):tutorialData {
            if (tutorialData[index].node[0][1] === "") {
                tutorialData[index].node[0][1] = modalId;
            }
            return tutorialData[index];
        },
        nextStep = function browser_tutorial_nextStep():void {
            index = index + 1;
            network.settings("configuration", null);
            body.innerHTML = "";
            if (index < dataLength) {
                body.appendChild(content(index));
            } else {
                const div:Element = document.createElement("div"),
                    p:Element = document.createElement("p"),
                    heading:Element = document.createElement("h3");
                heading.innerHTML = "Tutorial complete!";
                p.innerHTML = "Please <strong>click the red close button</strong> in the top left corner of this modal to exit the tutorial.";
                div.appendChild(heading);
                div.appendChild(p);
                body.appendChild(div);
                document.onkeydown = activate;
            }
        },
        activate:EventHandlerNonNull = document.onkeydown as EventHandlerNonNull,
        content = function browser_tutorial_content(index:number):Element {
            const wrapper:Element = document.createElement("div"),
                heading:Element = document.createElement("h3"),
                dataItem:tutorialData = data(index),
                node:HTMLElement = remote.node(dataItem.node, null) as HTMLElement,
                eventName:string = `on${dataItem.event}`,
                // @ts-ignore - TS cannot resolve a string to a GlobalEventHandlersEventMap object key name
                action:EventHandlerNonNull = node[eventName];
            clearTimeout(delay);
            if (dataItem.title === "Move a modal") {
                const modals:Element[] = document.getModalsByModalType("fileNavigate");
                modalId = modals[modals.length - 1].getAttribute("id");
            }
            heading.innerHTML = dataItem.title;
            wrapper.appendChild(heading);
            dataItem.description.forEach(function browser_tutorial_content_description(value):void {
                const p:Element = document.createElement("p");
                p.innerHTML = value;
                wrapper.appendChild(p);
            });
            if (dataItem.event === "wait") {
                delay = setTimeout(nextStep, 5000);
            } else {
                node.style.outlineColor = "var(--outline)";
                node.style.outlineStyle = "dashed";
                node.style.outlineWidth = "0.2em";
                // @ts-ignore - TS cannot resolve a string to a GlobalEventHandlersEventMap object key name
                node[eventName] = function browser_tutorial_content_handler(event:Event):void {
                    node.style.outline = "none";
                    if (action !== null && action !== undefined) {
                        action(event);
                        // @ts-ignore - TS cannot resolve a string to a GlobalEventHandlersEventMap object key name
                        node[eventName] = action;
                    }
                    nextStep();
                };
                node.focus();
            }
            wrapper.setAttribute("class", "document");
            return wrapper;
        },
        modalConfig:modal = {
            agent: browser.data.hashDevice,
            agentType: "device",
            content: content(0),
            inputs: ["close"],
            move: false,
            read_only: true,
            title: "🗎 Tutorial",
            type: "document"
        },
        contentModal:HTMLElement = modal.create(modalConfig) as HTMLElement,
        close:HTMLElement = contentModal.getElementsByClassName("buttons")[0].getElementsByClassName("close")[0] as HTMLElement,
        body:HTMLElement = contentModal.getElementsByClassName("body")[0] as HTMLElement;
    contentModal.style.zIndex = "10001";
    close.onclick = function browser_tutorial_close(event:MouseEvent):void {
        browser.data.tutorial = false;
        document.onkeydown = activate;
        modal.close(event);
    };
    document.onkeydown = function browser_tutorial_document(event:KeyboardEvent):void {
        if (event.key === "Escape") {
            const node:HTMLElement = remote.node(data(index).node, null) as HTMLElement;
            node.style.outline = "none";
            clearTimeout(delay);
            nextStep();
        }
        activate(event);
    };
};

export default tutorial;