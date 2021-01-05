/* lib/terminal/fileService/fileServices - Manages various file system services. */

import { ServerResponse } from "http";

import base64 from "../commands/base64.js";
import directory from "../commands/directory.js";
import error from "../utilities/error.js";
import hash from "../commands/hash.js";
import mkdir from "../commands/mkdir.js";
import remove from "../commands/remove.js";
import response from "../server/response.js";
import serverVars from "../server/serverVars.js";
import vars from "../utilities/vars.js";
import watchHandler from "./watchHandler.js";

let logRecursion:boolean = true;
const fileServices:fileServiceSystem = {
    actions: {
        close: function terminal_fileService_fileServices_close(serverResponse:ServerResponse, data:fileService):void {
            vars.testLogger("fileService", "fs-close", "Close a file system watch.");
            if (serverVars.watches[data.location[0]] !== undefined) {
                serverVars.watches[data.location[0]].close();
                delete serverVars.watches[data.location[0]];
            }
            fileServices.respond.dir(serverResponse, {
                dirs: null,
                fail: null,
                id: ""
            });
        },
        destroy: function terminal_fileService_fileServices_destroy(serverResponse:ServerResponse, data:fileService):void {
            let count:number = 0;
            vars.testLogger("fileService", "fs-destroy", `Destroying: ${data.location}`);
            data.location.forEach(function terminal_fileService_fileServices_destroy_each(value:string):void {
                if (serverVars.watches[value] !== undefined) {
                    serverVars.watches[value].close();
                    delete serverVars.watches[value];
                }
                remove(value, function terminal_fileService_fileServices_destroy_each_remove():void {
                    count = count + 1;
                    if (count === data.location.length) {
                        directory({
                            callback: function terminal_fileService_fileServices_destroy_each_remove_callback(directoryList:directoryList):void {
                                const responseData:fsRemote = {
                                    dirs: directoryList,
                                    fail: directoryList.failures,
                                    id: data.id
                                };
                                fileServices.respond.dir(serverResponse, responseData);
                            },
                            depth: 2,
                            exclusions: [],
                            logRecursion: false,
                            mode: "read",
                            path: data.name,
                            symbolic: true
                        });
                    }
                });
            });
        },
        directory: function terminal_fileService_fileServices_directory(serverResponse:ServerResponse, data:fileService):void {
            let count:number = 0,
                output:directoryList = [],
                failures:string[] = [];
            const rootIndex:number = data.location.indexOf("**root**"),
                pathList:string[] = (data.action === "fs-search")
                    ? [data.location[0]]
                    : data.location,
                pathLength:number = pathList.length,
                callback = function terminal_fileService_fileServices_directory_callback(result:directoryList):void {
                    count = count + 1;
                    if (result.length > 0) {
                        failures = failures.concat(result.failures);
                        output = output.concat(result);
                    }
                    if ((vars.command === "test" && serverVars.testBrowser === null) || vars.command === "test_service") {
                        result.forEach(function terminal_fileService_fileService_directory_callback_each(item:directoryItem):void {
                            item[5] = null;
                        });
                    }
                    if (count === pathLength) {
                        const responseData:fsRemote = {
                            dirs: (output.length < 1)
                                ? "missing"
                                : output,
                            fail: (output.length < 1 || data.action === "fs-search")
                                ? []
                                : failures,
                            id: data.id
                        };
                        fileServices.respond.dir(serverResponse, responseData);
                        
                        // please note
                        // watch is ignored on all operations other than fs-directory
                        // fs-directory will only read from the first value in data.location
                        if (data.action === "fs-directory" && result.length > 0 && data.watch !== "no" && data.watch !== vars.projectPath) {
                            const watchPath:string = result[0][0].replace(/\\/g, "\\\\");
                            if (data.watch !== "yes" && serverVars.watches[data.watch] !== undefined) {
                                serverVars.watches[data.watch].close();
                                delete serverVars.watches[data.watch];
                            }
                            if (serverVars.watches[watchPath] === undefined) {
                                serverVars.watches[watchPath] = vars.node.fs.watch(watchPath, {
                                    recursive: (process.platform === "win32" || process.platform === "darwin")
                                }, function terminal_fileService_fileService_directory_callback_watch(eventType:string, fileName:string):void {
                                    // throttling is necessary in the case of recursive watches in areas the OS frequently stores user settings
                                    if (fileName !== null && fileName.split(vars.sep).length < 2) {
                                        watchHandler({
                                            data: data,
                                            logRecursion: logRecursion,
                                            serverResponse: serverResponse,
                                            value: watchPath
                                        });
                                    }
                                });
                            } else {
                                serverVars.watches[watchPath].time = Date.now();
                            }
                        }
                    }
                },
                dirConfig:readDirectory = {
                    callback: callback,
                    depth: data.depth,
                    exclusions: [],
                    logRecursion: logRecursion,
                    mode: (data.action === "fs-search")
                        ? "search"
                        : "read",
                    path: "",
                    search: data.name,
                    symbolic: true
                };
            if (rootIndex > -1) {
                data.location[rootIndex] = vars.sep;
            }
            vars.testLogger("fileService", data.action, `Performs a directory search operation on ${data.location[0]} of agent ${data.agent}`);
            logRecursion = false;
            pathList.forEach(function terminal_fileService_fileServices_directory_pathEach(value:string):void {
                const pathRead = function terminal_fileService_fileServices_directory_pathEach_pathRead():void {
                    if ((/^\w:$/).test(value) === true) {
                        value = value + "\\";
                    }
                    dirConfig.path = value;
                    directory(dirConfig);
                    logRecursion = false;
                };
                if (value === "\\" || value === "\\\\") {
                    pathRead();
                } else {
                    vars.node.fs.stat(value, function terminal_fileService_fileServices_directory_pathEach_stat(erp:nodeError):void {
                        if (erp === null) {
                            pathRead();
                        } else {
                            failures.push(value);
                            if (failures.length === data.location.length) {
                                const responseData:fsRemote = {
                                    dirs: "missing",
                                    fail: failures,
                                    id: data.id
                                };
                                fileServices.respond.dir(serverResponse, responseData);
                            }
                        }
                    });
                }
            });
        },
        newArtifact: function terminal_fileService_fileServices_newArtifact(serverResponse:ServerResponse, data:fileService):void {
            vars.testLogger("fileService", "fs-new", `Create a new item of type ${data.name}`);
            if (data.name === "directory") {
                mkdir(data.location[0], function terminal_fileService_fileServices_newArtifact_directory():void {
                    fileServices.dirCallback(serverResponse, data);
                }, false);
            } else if (data.name === "file") {
                vars.node.fs.writeFile(data.location[0], "", "utf8", function terminal_fileService_fileServices_newArtifact_file(erNewFile:Error):void {
                    if (erNewFile === null) {
                        fileServices.dirCallback(serverResponse, data);
                    } else {
                        error([erNewFile.toString()]);
                        fileServices.respond.error(serverResponse, erNewFile.toString(), data.action);
                    }
                });
            } else {
                fileServices.respond.error(serverResponse, `unsupported type ${data.name}`, data.action);
            }
        },
        read: function terminal_fileService_fileServices_read(serverResponse:ServerResponse, data:fileService):void {
            const length:number = data.location.length,
                storage:stringDataList = [],
                type:string = (data.action === "fs-read")
                    ? "base64"
                    : data.action.replace("fs-", ""),
                callback = function terminal_fileService_fileServices_read_callback(output:base64Output):void {
                    const stringData:stringData = {
                        content: output[type],
                        id: output.id,
                        path: output.filePath
                    };
                    b = b + 1;
                    storage.push(stringData);
                    if (b === length) {
                        fileServices.respond.read(serverResponse, storage, data.action);
                    }
                },
                fileReader = function terminal_fileService_fileServices_read_fileReader(fileInput:base64Input):void {
                    vars.node.fs.readFile(fileInput.source, "utf8", function terminal_fileService_fileServices_read_fileReader_readFile(readError:nodeError, fileData:string) {
                        const inputConfig:base64Output = {
                            base64: fileData,
                            id: fileInput.id,
                            filePath: fileInput.source
                        };
                        vars.testLogger("fileService", "fileReader", `Reading a file for action fs-read, ${input.source}`);
                        if (readError !== null) {
                            error([readError.toString()]);
                            vars.broadcast("error", readError.toString());
                            return;
                        }
                        input.callback(inputConfig);
                    });
                },
                input:base64Input = {
                    callback: callback,
                    id: "",
                    source: ""
                },
                hashInput:hashInput = {
                    algorithm: serverVars.hashType,
                    callback: callback,
                    directInput: false,
                    id: "",
                    source: ""
                };
            let a:number = 0,
                b:number = 0,
                index:number;
            vars.testLogger("fileService", "dataString", `Action ${data.action}`);
            do {
                if (data.action === "fs-base64") {
                    index = data.location[a].indexOf(":");
                    input.id = data.location[a].slice(0, index);
                    input.source = data.location[a].slice(index + 1);
                    base64(input);
                } else if (data.action === "fs-hash") {
                    index = data.location[a].indexOf(":");
                    hashInput.id = data.location[a].slice(0, index);
                    hashInput.source = data.location[a].slice(index + 1);
                    hash(hashInput);
                } else if (data.action === "fs-read") {
                    index = data.location[a].indexOf(":");
                    input.id = data.location[a].slice(0, index);
                    input.source = data.location[a].slice(index + 1);
                    fileReader(input);
                }
                a = a + 1;
            } while (a < length);
        },
        rename: function terminal_fileService_fileServices_rename(serverResponse:ServerResponse, data:fileService):void {
            const newPath:string[] = data.location[0].split(vars.sep);
            vars.testLogger("fileService", "fs-rename", `Renames an existing file system artifact, ${data.name}`);
            newPath.pop();
            newPath.push(data.name);
            vars.node.fs.rename(data.location[0], newPath.join(vars.sep), function terminal_fileService_fileService_rename_callback(erRename:Error):void {
                if (erRename === null) {
                    fileServices.dirCallback(serverResponse, data);
                } else {
                    error([erRename.toString()]);
                    fileServices.respond.error(serverResponse, erRename.toString(), data.action);
                }
            });
        },
        write: function terminal_fileService_fileServices_write(serverResponse:ServerResponse, data:fileService):void {
            vars.testLogger("fileService", "fs-write", "Writes or over-writes a file to disk.");
            vars.node.fs.writeFile(data.location[0], data.name, "utf8", function terminal_fileService_fileService_write_callback(erw:nodeError):void {
               if (erw === null) {
                    fileServices.dirCallback(serverResponse, data);
                } else {
                    fileServices.respond.error(serverResponse, erw.toString(), data.action);
                }
            });
        }
    },
    dirCallback: function terminal_fileService_fileServices_dirCallback(serverResponse:ServerResponse, data:fileService):void {
        vars.testLogger("fileService", `${data.action} response`, "A generic successful directory response to a file system request.");
        const slash:string = (data.location[0].indexOf("/") < 0 || (data.location[0].indexOf("\\") < data.location[0].indexOf("/") && data.location[0].indexOf("\\") > -1 && data.location[0].indexOf("/") > -1))
                ? "\\"
                : "/",
            dirs = data.location[0].split(slash),
            fsUpdateCallback = function terminal_fileService_fileServices_dirCallback_fsUpdateCallback(result:directoryList):void {
                fileServices.respond.dir(serverResponse, {
                    dirs: result,
                    fail: result.failures,
                    id: data.id
                });
            },
            dirConfig:readDirectory = {
                callback: fsUpdateCallback,
                depth: 2,
                exclusions: [],
                logRecursion: logRecursion,
                mode: "read",
                path: dirs.join(slash),
                symbolic: true
            };
        dirs.pop();
        directory(dirConfig);
    },
    menu: function terminal_fileService_fileServices_menu(serverResponse:ServerResponse, data:fileService):void {
        if (data.action === "fs-base64" || data.action === "fs-hash" || data.action === "fs-read") {
            fileServices.actions.read(serverResponse, data);
        } else if (data.action === "fs-close") {
            fileServices.actions.close(serverResponse, data);
        } else if (data.action === "fs-destroy") {
            fileServices.actions.destroy(serverResponse, data);
        } else if (data.action === "fs-details" || data.action === "fs-directory" || data.action === "fs-search") {
            fileServices.actions.directory(serverResponse, data);
        } else if (data.action === "fs-new") {
            fileServices.actions.newArtifact(serverResponse, data);
        } else if (data.action === "fs-rename") {
            fileServices.actions.rename(serverResponse, data);
        } else if (data.action === "fs-write") {
            fileServices.actions.write(serverResponse, data);
        }
    },
    respond: {
        copy: function terminal_fileService_fileServices_respondCopy(serverResponse:ServerResponse, copy:copyStatus):void {
            response({
                message: JSON.stringify(copy),
                mimeType: "application/json",
                responseType: "file-list-status",
                serverResponse: serverResponse
            });
        },
        dir: function terminal_fileService_fileServices_respondDir(serverResponse:ServerResponse, dirs:fsRemote):void {
            response({
                message: JSON.stringify(dirs),
                mimeType: "application/json",
                responseType: "fs",
                serverResponse: serverResponse
            });
        },
        error: function terminal_fileService_fileServices_respondError(serverResponse:ServerResponse, message:string, action:serviceType):void {
            vars.testLogger("fileService", `${action} error`, "Generic error messaging for a file system action.");
            response({
                message: message,
                mimeType: "text/plain",
                responseType: "error",
                serverResponse: serverResponse
            });
        },
        read: function terminal_fileService_fileServices_respondRead(serverResponse:ServerResponse, list:stringDataList, action:serviceType):void {
            vars.testLogger("fileService", "dataString callback", `Callback to action ${action} that writes an HTTP response.`);
            response({
                message: JSON.stringify(list),
                mimeType: "application/json",
                responseType: "fs",
                serverResponse: serverResponse
            });
        }
    }
};

export default fileServices;