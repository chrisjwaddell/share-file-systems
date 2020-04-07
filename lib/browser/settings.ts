
/* lib/browser/settings - A collection of utilities and event handlers associated with processing the application state and system settings. */
import browser from "./browser.js";
import modal from "./modal.js";
import network from "./network.js";
import util from "./util.js";

const settings:module_settings = {};

/* Add agent color options to the settings menu */
settings.addUserColor = function local_settings_addUserColor(agent:string, type:agentType, settingsBody:HTMLElement) {
    const ul:HTMLElement = <HTMLElement>settingsBody.getElementsByClassName(`${type}-color-list`)[0],
        li:HTMLElement = document.createElement("li"),
        p:HTMLElement = document.createElement("p"),
        agentColor:[string, string] = browser.data.colors[type][agent];
    let span:HTMLElement,
        label:HTMLElement,
        input:HTMLInputElement,
        text:Text;
    p.innerHTML = browser[type][agent].name;
    li.setAttribute("data-agent", agent);
    li.appendChild(p);

    label = document.createElement("label");
    input = document.createElement("input");
    span = document.createElement("span");
    span.setAttribute("class", "swatch");
    span.style.background = `#${agentColor[0]}`;
    label.appendChild(span);
    input.type = "text";
    input.value = agentColor[0];
    input.onblur = settings.agentColor;
    input.onkeyup = settings.agentColor;
    label.appendChild(input);
    text = document.createTextNode("Body Color");
    label.appendChild(text);
    li.appendChild(label);

    label = document.createElement("label");
    input = document.createElement("input");
    span = document.createElement("span");
    span.setAttribute("class", "swatch");
    span.style.background = `#${agentColor[1]}`;
    label.appendChild(span);
    input.type = "text";
    input.value = agentColor[1];
    input.onblur = settings.agentColor;
    input.onkeyup = settings.agentColor;
    label.appendChild(input);
    text = document.createTextNode("Heading Color");
    label.appendChild(text);
    li.appendChild(label);

    ul.appendChild(li);
};

/* specify custom agent color settings */
settings.agentColor = function local_settings_modal(event:KeyboardEvent):void {
    const element:HTMLInputElement = <HTMLInputElement>event.srcElement || <HTMLInputElement>event.target,
        colorTest:RegExp = (/^(([0-9a-fA-F]{3})|([0-9a-fA-F]{6}))$/),
        color:string = `${element.value.replace(/\s+/g, "").replace("#", "")}`,
        parent:HTMLElement = <HTMLElement>element.parentNode;
    if (colorTest.test(color) === true) {
        if (event.type === "blur" || (event.type === "keyup" && event.keyCode === 13)) {
            const item:HTMLElement = <HTMLElement>parent.parentNode,
                ancestor:HTMLElement = util.getAncestor(element, "ul", "tag"),
                type:agentType = <agentType>ancestor.getAttribute("class").split("-")[0],
                agent:string = item.getAttribute("data-agent"),
                swatch:HTMLElement = <HTMLElement>parent.getElementsByClassName("swatch")[0];
            element.value = color;
            if (parent.innerHTML.indexOf("Body") > 0) {
                settings.applyAgentColors(agent, type, [color, browser.data.colors[type][agent][1]]);
            } else {console.log([browser.data.colors[type][agent][0], color]);
                settings.applyAgentColors(agent, type, [browser.data.colors[type][agent][0], color]);
            }
            swatch.style.background = `#${color}`;
            network.storage("settings");
        } else if (event.type === "keyup") {
            const span:HTMLElement = parent.getElementsByTagName("span")[0];
            span.style.background = color;
        }
    }
};

/* Update the agent color information in the style tag */
settings.applyAgentColors = function local_settings_applyUserColors(agent:string, type:agentType, colors:[string, string]):void {
    const prefix:string = `#spaces .box[data-agent="${agent}"] `,
        style:string = browser.style.innerHTML,
        styleText:styleText = {
            agent: agent,
            colors: colors,
            replace: true,
            type: type
        };
    let scheme:string = browser.pageBody.getAttribute("class");
    if (scheme === null) {
        scheme = "default";
    }
    if (colors[0] === settings.colorDefaults[scheme][0] && colors[1] === settings.colorDefaults[scheme][1]) {
        // colors are defaults for the current scheme
        styleText.colors = ["", ""];
        settings.styleText(styleText);
    } else if (style.indexOf(prefix) > -1) {
        // replace changed colors in the style tag if present
        settings.styleText(styleText);
    } else {
        // add new styles if not present
        styleText.replace = false;
        settings.styleText(styleText);
    }
    browser.data.colors[type][agent][0] = colors[0];
    browser.data.colors[type][agent][1] = colors[1];
};

/* Enable or disable audio from the settings menu */
settings.audio = function local_settings_compression(event:MouseEvent):void {
    const element:HTMLInputElement = <HTMLInputElement>event.srcElement || <HTMLInputElement>event.target;
    if (element.value === "on") {
        browser.data.audio = true;
    } else {
        browser.data.audio = false;
    }
    if (browser.loadTest === false) {
        network.storage("settings");
    }
};

settings.colorDefaults = {
    "dark": ["222", "333"],
    "default": ["fff", "eee"]
};

/* Change the color scheme */
settings.colorScheme = function local_settings_colorScheme(event:MouseEvent):void {
    const element:HTMLInputElement = <HTMLInputElement>event.srcElement || <HTMLInputElement>event.target,
        oldScheme:string = browser.data.color,
        agents:agents = {
            device: Object.keys(browser.device),
            user: Object.keys(browser.user)
        },
        agentKeys:string[] = Object.keys(agents),
        agentKeysLength:number = agentKeys.length;
    if (element.value === "default") {
        browser.pageBody.removeAttribute("class");
    } else {
        browser.pageBody.setAttribute("class", element.value);
    }

    if (agentKeysLength > 0) {
        let a:number = 0,
            b:number = 0,
            c:number = 0,
            agentType:agentType,
            agentLength:number,
            agentHash:string,
            agentColors:HTMLCollectionOf<HTMLElement>,
            swatches:HTMLCollectionOf<Element>,
            swatch1:HTMLElement,
            swatch2:HTMLElement,
            inputs:HTMLCollectionOf<HTMLInputElement>;
        do {
            agentType = <agentType>agentKeys[a];
            agentLength = agents[agentType].length;
            if (agentLength > 0) {
                agentColors = document.getElementsByClassName(`${agentType}-color-list`)[0].getElementsByTagName("li");
                b = 0;
                do {
                    agentHash = agents[agentType][b];
                    if (browser.data.colors[agentType][agentHash][0] === settings.colorDefaults[oldScheme][0] && browser.data.colors[agentType][agentHash][1] === settings.colorDefaults[oldScheme][1]) {
                        browser.data.colors[agentType][agentHash][0] = settings.colorDefaults[element.value][0];
                        browser.data.colors[agentType][agentHash][1] = settings.colorDefaults[element.value][1];
                        settings.applyAgentColors(agentHash, agentType, [browser.data.colors[agentType][agentHash][0], browser.data.colors[agentType][agentHash][1]]);
                        c = 0;
                        do {
                            if (agentColors[c].getElementsByTagName("p")[0].getAttribute("data-agent") === agentHash) {
                                swatches = agentColors[c].getElementsByClassName("swatch");
                                swatch1 = <HTMLElement>swatches[0];
                                swatch2 = <HTMLElement>swatches[1];
                                inputs = agentColors[c].getElementsByTagName("input");
                                swatch1.style.background = browser.data.colors[agentType][agentHash][0];
                                swatch2.style.background = browser.data.colors[agentType][agentHash][1];
                                inputs[0].value = browser.data.colors[agentType][agentHash][0];
                                inputs[1].value = browser.data.colors[agentType][agentHash][1];
                            }
                            c = c + 1;
                        } while (c < agentLength);
                    } else if (browser.data.colors[agentType][agentHash][0] === settings.colorDefaults[element.value][0] && browser.data.colors[agentType][agentHash][1] === settings.colorDefaults[element.value][1]) {
                        settings.applyAgentColors(agentHash, agentType, [browser.data.colors[agentType][agentHash][0], browser.data.colors[agentType][agentHash][1]]);
                    }
                    b = b + 1;
                } while (b < agentLength);
            }
            a = a + 1;
        } while (a < agentKeysLength);
    }
    browser.data.color = <colorScheme>element.value;
    if (browser.loadTest === false) {
        network.storage("settings");
    }
};

/* Shows and hides additional textual information about compression */
settings.compressionToggle = function local_settings_compressionToggle(event:MouseEvent):void {
    const element:HTMLInputElement = <HTMLInputElement>event.srcElement || <HTMLInputElement>event.target,
        parent:HTMLElement = <HTMLElement>element.parentNode,
        info:HTMLElement = <HTMLElement>parent.getElementsByClassName("compression-details")[0];
    if (info.style.display === "none") {
        info.style.display = "block";
        element.innerHTML = "Less information ⇡";
    } else {
        info.style.display = "none";
        element.innerHTML = "More information ⇣";
    }
};

/* Shows the settings modal */
settings.modal = function local_settings_modal(event:MouseEvent):void {
    const settings:HTMLElement = document.getElementById("settings-modal"),
        data:ui_modal = browser.data.modals["settings-modal"];
    modal.zTop(event, settings);
    if (data.status === "hidden") {
        settings.style.display = "block";
    }
    data.status = "normal";
};

/* The content of the settings modal */
settings.modalContent = function local_settings_modalContent():HTMLElement {
    const settingsBody:HTMLElement = document.createElement("div"),
        random:string = Math.random().toString(),
        createSection = function local_settings_modalContent(title:string):HTMLElement {
            const container:HTMLElement = document.createElement("div"),
                h3:HTMLElement = document.createElement("h3");
            container.setAttribute("class", "section");
            h3.innerHTML = title;
            container.appendChild(h3);
            return container;
        },
        agents:agents = {
            device: Object.keys(browser.device),
            user: Object.keys(browser.user)
        },
        agentKeys:string[] = Object.keys(agents),
        agentKeysLength:number = agentKeys.length,
        total:number = agents.device.length + agents.user.length;
    let section:HTMLElement,
        p:HTMLElement = document.createElement("p"),
        select:HTMLElement,
        option:HTMLOptionElement,
        label:HTMLElement = document.createElement("label"),
        input:HTMLInputElement = document.createElement("input"),
        button:HTMLElement = document.createElement("button"),
        text:Text = document.createTextNode("Compression level. Accepted values are 0 - 11");
    settingsBody.setAttribute("class", "settings");

    // brotli compression
    section = createSection("🗜 Brotli Compression Level");
    input.type = "text";
    input.value = browser.data.brotli.toString();
    input.name = "brotli";
    input.onkeyup = settings.text;
    input.onblur = settings.text;
    label.appendChild(input);
    label.appendChild(text);
    p.appendChild(label);
    section.appendChild(p);
    button.onclick = settings.compressionToggle;
    button.innerHTML = "More information ⇣";
    section.appendChild(button);
    p = document.createElement("p");
    p.innerHTML = "In this application compression is applied to file system artifacts traveling from one device to another across a network. There is substantial CPU overhead in decompressing files. The ideal case for applying compression is extremely large files that take longer to transfer than the decompress. It is advised to disable compression if on a very fast local network or transferring many small files. Compression can be disabled by setting the value to 0.";
    p.setAttribute("class", "compression-details");
    p.style.display = "none";
    section.appendChild(p);
    settingsBody.appendChild(section);

    // hash algorithm
    section = createSection("⋕ Hash Algorithm");
    input = document.createElement("input");
    label = document.createElement("label");
    text = document.createTextNode("Hash Algorithm");
    select = document.createElement("select");
    p = document.createElement("p");
    {
        const hashes:hash[] = ["blake2d512", "blake2s256", "sha3-224", "sha3-256", "sha3-384", "sha3-512", "sha512-224", "sha512-256", "shake128", "shake256"],
            length:number = hashes.length;
        let a:number = 0;
        do {
            option = document.createElement("option");
            option.innerHTML = hashes[a];
            if (browser.data.hash === hashes[a]) {
                option.selected = true;
            }
            select.appendChild(option);
            a = a + 1;
        } while (a < length);
    }
    select.onchange = settings.text;
    label.appendChild(select);
    label.appendChild(text);
    p.appendChild(label);
    section.appendChild(p);
    settingsBody.appendChild(section);

    // audio
    section  = createSection("🔊 Allow Audio");
    p = document.createElement("p");
    label = document.createElement("label");
    input = document.createElement("input");
    label.setAttribute("class", "radio");
    input.type = "radio";
    input.name = `audio-${random}`;
    input.value = "on";
    input.checked = true;
    input.onclick = settings.audio;
    text = document.createTextNode("On");
    label.appendChild(text);
    label.appendChild(input);
    p.appendChild(label);
    label = document.createElement("label");
    input = document.createElement("input");
    label.setAttribute("class", "radio");
    input.type = "radio";
    input.name = `audio-${random}`;
    input.value = "off";
    input.onclick = settings.audio;
    text = document.createTextNode("Off");
    label.appendChild(text);
    label.appendChild(input);
    p.appendChild(label);
    section.appendChild(p);
    settingsBody.appendChild(section);

    // color scheme
    section = createSection("▣ Color Theme");
    p = document.createElement("p");
    label = document.createElement("label");
    input = document.createElement("input");
    label.setAttribute("class", "radio");
    input.type = "radio";
    input.checked = true;
    input.name = `color-scheme-${random}`;
    input.value = "default";
    input.onclick = settings.colorScheme;
    label.innerHTML = "Default";
    label.appendChild(input);
    p.appendChild(label);
    label = document.createElement("label");
    input = document.createElement("input");
    label.setAttribute("class", "radio");
    input.type = "radio";
    input.name = `color-scheme-${random}`;
    input.value = "dark";
    input.onclick = settings.colorScheme;
    label.innerHTML ="Dark";
    label.appendChild(input);
    p.appendChild(label);
    section.appendChild(p);
    settingsBody.appendChild(section);

    // agent colors
    if (agentKeysLength > 0) {
        let a:number = 0,
            b:number = 0,
            agentLength:number,
            agentType:agentType,
            ul:HTMLElement;
        do {
            b = 0;
            agentType = <agentType>agentKeys[a];
            agentLength = agents[agentType].length;
            section = createSection(`◩ ${agentType.charAt(0).toUpperCase() + agentKeys[a].slice(1)} Color Definitions`);
            p = document.createElement("p");
            p.innerHTML = "Accepted format is 3 or 6 digit hexadecimal (0-f)";
            section.appendChild(p);
            if (agentLength > 0) {
                ul = document.createElement("ul");
                ul.setAttribute("class", `${agentType}-color-list`);
                section.appendChild(ul);
                do {
                    settings.addUserColor(agents[agentType][b], agentType, section);
                    b = b + 1;
                } while (b < agentLength);
            }
            settingsBody.appendChild(section);
            a = a + 1;
        } while (a < agentKeysLength);
    }
    return settingsBody;
};

settings.styleText = function local_settings_styleText(input:styleText):void {
    const template:string[] = [
        `#spaces .box[data-agent="${input.agent}"] .body,`,
        `#spaces #${input.type} button[data-agent="${input.agent}"]:hover{background-color:#`,
        browser.data.colors[input.type][input.agent][0],
        "}",
        `#spaces #${input.type} button[data-agent="${input.agent}"],`,
        `#spaces .box[data-agent="${input.agent}"] .status-bar,`,
        `#spaces .box[data-agent="${input.agent}"] .footer,`,
        `#spaces .box[data-agent="${input.agent}"] h2.heading{background-color:#`,
        browser.data.colors[input.type][input.agent][1],
        "}"
    ];
    if (input.replace === true) {
        if (input.colors[0] === "" && input.colors[1] === "") {
            // removes an agent's colors
            browser.style.innerHTML = browser.style.innerHTML.replace(template.join(""), "");
        } else {
            const old:string = template.join("");
            if (input.colors[0] !== "") {
                template[2] = input.colors[0];
            }
            if (input.colors[1] !== "") {
                template[8] = input.colors[1];
            }
            // updates an agent's colors
            browser.style.innerHTML = browser.style.innerHTML.replace(old, template.join(""));
        }
    } else {
        if (input.colors[0] !== "") {
            template[2] = input.colors[0];
        }
        if (input.colors[1] !== "") {
            template[8] = input.colors[1];
        }
        // adds an agent's colors
        browser.style.innerHTML = browser.style.innerHTML + template.join("");
    }
};

/* Settings compression level */
settings.text = function local_settings_text(event:KeyboardEvent):void {
    const element:HTMLInputElement = <HTMLInputElement>event.srcElement || <HTMLInputElement>event.target;
    if (element.value.replace(/\s+/, "") !== "" && (event.type === "blur" || (event.type === "change" && element.nodeName.toLowerCase() === "select") || (event.type === "keyup" && event.keyCode === 13))) {
        const numb:number = Number(element.value),
            parent:HTMLElement = <HTMLElement>element.parentNode,
            parentText:string = parent.innerHTML.toLowerCase();
        if (parentText.indexOf("brotli") > 0) {
            if (isNaN(numb) === true || numb < 0 || numb > 11) {
                element.value = browser.data.brotli.toString();
            }
            element.value = Math.floor(numb).toString();
            browser.data.brotli = <brotli>Math.floor(numb);
        } else if (parentText.indexOf("hash") > 0) {
            browser.data.hash = <hash>element.value;
        }
        network.storage("settings");
    }
};

export default settings;