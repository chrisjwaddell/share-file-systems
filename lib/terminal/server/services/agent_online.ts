/* lib/terminal/server/services/agent_online - Determines if a remote agent is online and if so gathers their IP addresses and listening port numbers. */

import getAddress from "../../utilities/getAddress.js";
import ipResolve from "../transmission/ipResolve.js";
import sender from "../transmission/sender.js";
import vars from "../../utilities/vars.js";

const agent_online = function terminal_server_services_agentOnline(socketData:socketData, transmit:transmit_type):void {
    const agentData:service_agentResolve = socketData.data as service_agentResolve,
        addresses:transmit_addresses_socket = getAddress(transmit),
        local:string = addresses.local.address,
        remote:string = addresses.remote.address;
    vars.settings[agentData.agentType][agentData.agent].ipAll = agentData.ipAll;
    if (remote !== "") {
        vars.settings[agentData.agentType][agentData.agent].ipSelected = remote;
    }
    agentData.ipAll = (agentData.agentType === "device")
        ? vars.network.addresses
        : ipResolve.userAddresses();
    if (local !== "") {
        agentData.ipSelected = local;
    }
    sender.broadcast(socketData, "browser");
    sender.broadcast(socketData, "device");
};

export default agent_online;