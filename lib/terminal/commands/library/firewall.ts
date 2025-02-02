
/* lib/terminal/commands/library/firewall - A utility to open firewall settings for this application. */

import { exec, ExecException } from "child_process";
import { writeFile } from "fs";
import { EOL } from "os";

import error from "../../utilities/error.js";
import vars from "../../utilities/vars.js";

const firewall = function terminal_commands_library_firewall(callback:commandCallback):void {
    const errorOut = function terminal_commands_library_fireWall_errorOut(message:string, errorObject:ExecException|NodeJS.ErrnoException):void {
        const err:string[] = (errorObject === null)
                ? [vars.text.angry + message + vars.text.none]
                : [
                    vars.text.angry + message + vars.text.none,
                    JSON.stringify(errorObject)
                ];
        error(err);
        process.stderr.write(err.join(EOL));
        process.exit(1);
    };
    if (process.platform === "win32") {
        exec("nvm root", function terminal_commands_library_firewall_nvm(nvmError:ExecException, stdout:string):void {
            let nvmPath:string = "",
                nvm:boolean = (nvmError === null && stdout !== "");
            const instructions = function terminal_commands_library_firewall_nvm_instructions():void {
                const commands:string[] = [
                        "netsh advfirewall firewall delete rule name=\"node.exe\"",
                        "netsh advfirewall firewall delete rule name=\"node nvm\"",
                        "netsh advfirewall firewall delete rule name=\"Node.js\"",
                        "netsh advfirewall firewall add rule name=\"node.exe\" program=\"C:\\Program Files\\nodejs\\node.exe\" action=\"allow\" protocol=TCP profile=\"any\" dir=in",
                        "netsh advfirewall firewall add rule name=\"node.exe\" program=\"C:\\Program Files\\nodejs\\node.exe\" action=\"allow\" protocol=TCP profile=\"any\" dir=out"
                    ],
                    writeLocation:string = [
                        `${vars.path.project}lib`,
                        "terminal",
                        "test",
                        "storageTest",
                        "temp",
                        "firewall.ps1"
                    ].join(vars.path.sep);
                if (nvm === true) {
                    commands.push(`netsh advfirewall firewall add rule name="node nvm" program="${nvmPath}" action="allow" protocol=TCP profile="any" dir=in`);
                    commands.push(`netsh advfirewall firewall add rule name="node nvm" program="${nvmPath}" action="allow" protocol=TCP profile="any" dir=out`);
                }
                commands.push("exit");
                writeFile(writeLocation, commands.join(`;${EOL}`), function terminal_commands_library_firewall_nvm_instructions_write(writeError:NodeJS.ErrnoException):void {
                    if (writeError === null) {
                        exec(`Start-Process powershell -verb runas -WindowStyle "hidden" -ArgumentList "-file ${writeLocation}"`, {
                            shell: "powershell"
                        }, function terminal_commands_library_firewall_nvm_instructions_write_execute(execError:ExecException):void {
                            if (execError === null) {
                                callback("Firewall", ["Windows Defender Firewall updated."], false);
                            } else {
                                errorOut("Error executing Windows Defender Firewall instructions.", execError);
                            }
                        });
                    } else {
                        errorOut("Error writing Windows Defender Firewall instructions.", writeError);
                    }
                });
            };
            if (nvm === true) {
                nvmPath = stdout.replace(/^\s*Current Root:\s*/, "").replace(/\s+$/, "");
                exec("nvm list", function terminal_commands_library_firewall_nvm_list(listError:ExecException, listOut:string):void {
                    if (listError === null) {
                        const star:number = listOut.indexOf("*");
                        if (star < 0) {
                            nvm = false;
                            instructions();
                        } else {
                            listOut = listOut.slice(star + 1).replace(/^\s*/, "");
                            listOut = listOut.slice(0, listOut.indexOf(" "));
                            nvmPath = `${nvmPath + vars.path.sep}v${listOut + vars.path.sep}node.exe`;
                            instructions();
                        }
                    } else {
                        errorOut("Error executing \"nvm list\"", listError);
                    }
                });
            } else {
                instructions();
            }
        });
    }
};

export default firewall;