
/* lib/terminal/commands/library/mkdir - A utility for recursively creating directories in the file system. */

import { mkdir as makeDir, stat, Stats } from "fs";

import error from "../../utilities/error.js";
import vars from "../../utilities/vars.js";

// makes specified directory structures in the local file system
const mkdir = function terminal_commands_library_mkdir(dir:string, callback:commandCallback):void {
    let ind:number = 0;
    const dirs:string[] = dir.split(vars.path.sep),
        title:string = "Make Directory",
        len:number = dirs.length,
        errorHandler = function terminal_commands_library_mkdir_errorHandler(errorInstance:NodeJS.ErrnoException, statInstance:Stats, errorCallback:() => void):void {
            if (errorInstance !== null) {
                if (errorInstance.code === "ENOENT") {
                    errorCallback();
                    return;
                }
                if (vars.settings.verbose === true) {
                    error([errorInstance.toString()]);
                }
                return;
            }

            if (statInstance.isDirectory() === true) {
                if (ind < len) {
                    recursiveStat();
                } else {
                    callback(title, [`Directory already exists: ${dir}`], false);
                }
                return;
            }

            const type:string = (statInstance.isFile() === true)
                ? "file"
                : (statInstance.isSymbolicLink() === true)
                    ? "symbolic link"
                    : (statInstance.isCharacterDevice() === true)
                        ? "character device"
                        : (statInstance.isFIFO() === true)
                            ? "FIFO"
                            : (statInstance.isSocket() === true)
                                ? "socket"
                                : "unknown file system object";
            callback(title, [JSON.stringify(new Error(`Destination directory, '${vars.text.cyan + dir + vars.text.none}', is a ${type}.`))], true);
            return;
        },
        recursiveStat = function terminal_commands_library_mkdir_recursiveStat():void {
            ind = ind + 1;
            const target:string = dirs.slice(0, ind).join(vars.path.sep);
            stat(target, function terminal_commands_library_mkdir_recursiveStat_callback(errA:NodeJS.ErrnoException, statA:Stats):void {
                errorHandler(errA, statA, function terminal_commands_library_mkdir_recursiveStat_callback_errorHandler():void {
                    makeDir(target, function terminal_commands_library_mkdir_recursiveStat_callback_errorHandler_makeDir(errB:NodeJS.ErrnoException):void {
                        if (errB !== null && vars.settings.verbose === true && errB.toString().indexOf("file already exists") < 0) {
                            callback(title, [JSON.stringify(errB)], true);
                        } else if (ind < len) {
                            terminal_commands_library_mkdir_recursiveStat();
                        } else {
                            callback(title, [`Directory created: ${dir}`], false);
                        }
                    });
                });
            });
        };
    if (dirs[0] === "") {
        ind = ind + 1;
    }
    stat(dir, function terminal_commands_library_mkdir_stat(statError:NodeJS.ErrnoException, stats:Stats):void {
        if (statError === null) {
            if (stats.isDirectory() === true) {
                callback(title, [`Directory already exists: ${dir}`], false);
            } else {
                errorHandler(null, stats, null);
            }
        } else {
            recursiveStat();
        }
    });
};

export default mkdir;