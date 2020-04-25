
/* lib/terminal/utilities/error - A utility for processing and logging errors from the terminal application. */
import commas from "../../common/commas.js";
import humanTime from "./humanTime.js";
import vars from "./vars.js";

// uniform error formatting
const library = {
        commas: commas,
        humanTime: humanTime
    },
    error = function terminal_error(errText:string[]):void {
        // eslint-disable-next-line
        const logger:(input:string|object) => void = console.log,
            bell = function terminal_error_bell():void {
                library.humanTime(true);
                if (vars.command === "build" || vars.command === "simulation" || vars.command === "validation") {
                    logger("\u0007"); // bell sound
                } else {
                    logger("");
                }
                if (vars.command !== "debug") {
                    process.exit(1);
                }
            },
            errorOut = function terminal_error_errorOut():void {
                if (vars.command === "server") {
                    const stackTrace:string[] = new Error().stack.replace(/^Error/, "").replace(/\s+at\s/g, ")splitMe").split("splitMe"),
                        server:serverError = {
                            stack: stackTrace.slice(1),
                            error: errText.join(" ")
                        };
                    if (vars.ws.broadcast === undefined) {
                        logger(server);
                    } else {
                        vars.ws.broadcast(JSON.stringify({
                            error: server
                        }));
                    }
                } else {
                    const stack:string = new Error().stack.replace("Error", `${vars.text.cyan}Stack trace${vars.text.none + vars.node.os.EOL}-----------`);
                    vars.flags.error = true;
                    logger("");
                    logger(stack);
                    logger("");
                    logger(`${vars.text.angry}Error Message${vars.text.none}`);
                    logger("------------");
                    if (errText[0] === "" && errText.length < 2) {
                        logger(`${vars.text.yellow}No error message supplied${vars.text.none}`);
                    } else {
                        errText.forEach(function terminal_error_errorOut_each(value:string):void {
                            logger(value);
                        });
                    }
                    logger("");
                    bell();
                }
            },
            debug = function terminal_error_debug():void {
                const stack:string = new Error().stack,
                    totalmem:number = vars.node.os.totalmem(),
                    freemem:number = vars.node.os.freemem();
                vars.flags.error = true;
                logger("");
                logger("---");
                logger("");
                logger("");
                logger(`# ${vars.version.name} - Debug Report`);
                logger("");
                logger(`${vars.text.green}## Error Message${vars.text.none}`);
                if (errText[0] === "" && errText.length < 2) {
                    logger(`${vars.text.yellow}No error message supplied${vars.text.none}`);
                } else {
                    logger("```");
                    errText.forEach(function terminal_error_each(value:string):void {
                        // eslint-disable-next-line
                        logger(value.replace(/\u001b/g, "\\u001b"));
                    });
                    logger("```");
                }
                logger("");
                logger(`${vars.text.green}## Stack Trace${vars.text.none}`);
                logger("```");
                logger(stack.replace(/\s*Error\s+/, "    "));
                logger("```");
                logger("");
                logger(`${vars.text.green}## Environment${vars.text.none}`);
                logger(`* OS - **${vars.node.os.platform()} ${vars.node.os.release()}**`);
                logger(`* Mem - ${library.commas(totalmem)} - ${library.commas(freemem)} = **${library.commas(totalmem - freemem)}**`);
                logger(`* CPU - ${vars.node.os.arch()} ${vars.node.os.cpus().length} cores`);
                logger("");
                logger(`${vars.text.green}## Command Line Instruction${vars.text.none}`);
                logger("```");
                logger(vars.cli);
                logger("```");
                logger("");
                logger(`${vars.text.green}## Time${vars.text.none}`);
                logger("```");
                logger(library.humanTime(false));
                logger("```");
                logger("");
                bell();
            };
        if (process.argv.indexOf("spaces_debug") > -1) {
            debug();
        } else {
            errorOut();
        }
    };

export default error;