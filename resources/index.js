/*
    ******************************************
     e-Force Romania SA:MP GameMode by ghosty    
                Write in Node.JS <3   
    ******************************************   
*/

/* NPM Modules */
const samp = require("samp-node-lib"); /* npm install samp-node-lib */
const mysql = require("mysql"); global.mysql = mysql; /* npm install mysql */
const md5 = require("md5"); global.md5 = md5; /* npm install md5 */
const events = require("events"); global.events = events; /* npm install events */

// => SA:MP Variables
const NAME = "e-Force Romania RPG"; global.NAME = NAME;
const GM_TEXT = "e-Force v1.0"; global.GM_TEXT = GM_TEXT;
const CMD = new events.EventEmitter(); 

const errors = {
    HELPER_OR_ADMIN_LEVEL_MISSING: "You don't have enough helper or admin level to use this command",
    ADMIN_LEVEL_MISSING: "You don't have enough admin level to use this command.",
    PLAYER_NOT_CONNECTED: "This player is not connected.",
    NOT_IN_HIS_P_CAR: "You are not in your personal vehicle to use this option.",
    UNEXPECTED_ERROR: "An unexpected error occurred.",
    NOT_ENOUGH_MONEY: "You don't have enough money."
}

// => Some enums
const INVALID_PLAYER_ID = -1;

// => Some modules
require("./connect/mysql.js"); /* Here you need to connect to the SQL Server... */
require("./variables/dialog.js"); /* Here is all dialog defined */
require("./variables/factions.js"); /* Here is the factions variables */
require("./variables/houses.js"); /* Here is the house variables */
require("./variables/personal_cars.js"); /* Here is the personal vehicle variables */
require("./variables/player.js"); /* Here is the player variables */
require("./variables/server.js"); /* Here is the server variables */
require("./variables/textdraws.js"); /* Here is the textdraw's variables */
require("./enums/colors.js"); /* Colors enum */
require("./enums/vehicles.js"); /* Vehicles validation enum */

/* For Streamer */
const streamer = {
    CreateDynamicPickup: function(modelid, type, x, y, z, worldid = -1, interiorid = -1, playerid = -1, streamdistance = 200.0, areaid = -1, priority = 0) {
        var RETURN = samp.callPublic("_CreateDynamicPickup", "iifffiiifii", modelid, type, x, y, z, worldid, interiorid, playerid, streamdistance, areaid, priority);
        this.UpdateAll();
        return RETURN;
    },
    DestroyDynamicPickup: function(pickupid) {
        var RETURN = samp.callPublic("_DestroyDynamicPickup", "i", pickupid);
        this.UpdateAll();
        return RETURN;
    },
    IsValidDynamicPickup: function(pickupid) {
        return samp.callPublic("_IsValidDynamicPickup", "i", pickupid);
    },
    CreateDynamic3DTextLabel: function(text, color, x, y, z, drawdistance) {
        var RETURN = samp.callPublic("_CreateDynamic3DTextLabel", "siffff", text, color, x, y, z, drawdistance);
        this.UpdateAll();
        return RETURN;
    },
    DestroyDynamic3DTextLabel: function(id) {
        var RETURN = samp.callPublic("_DestroyDynamic3DTextLabel", "i", id);
        this.UpdateAll();
        return RETURN;
    },
    IsValidDynamic3DTextLabel: function(id) {
        samp.callPublic("_IsValidDynamic3DTextLabel", "i", id);
    },
    UpdateDynamic3DTextLabelText: function(id, color, text) {
        var RETURN = samp.callPublic("_UpdateDynamic3DTextLabelText", "iis", id, color, text);
        this.UpdateAll();
        return RETURN;
    },
    Update: function(playerid) {
        return samp.callPublic("_samp_Streamer_Update", "i", playerid);
    },
    UpdateAll: function() {
        samp.getPlayers().forEach((player) => {
            this.Update(player.playerid);
        });
    }
}

/* SA:MP Events */
samp.OnGameModeInit(() => { 
    console.log(`${NAME} gamemode have been started`);
    console.log(`Node version: ${process.version}`);
    samp.SetGameModeText(GM_TEXT);
    samp.UsePlayerPedAnims();
    samp.EnableStuntBonusForAll(false);
    samp.DisableInteriorEnterExits();
    samp.AddPlayerClass(0, 2095.5671, 1433.1622, 10.8203, 92.4388, 0, 0, 0, 0, 0, 0); 
    return true;
});

samp.OnGameModeExit(() => {
    var count = 0;
    samp.getPlayers().forEach((player) => {
        count++;
        savePlayer(player.playerid);
    });
    SCMALL(-1, `SERVER: Saved {FF0000}${count} {FFFFFF}players data.`);
    return true;
});

samp.OnPlayerRequestClass((player) => {
    player.TogglePlayerSpectating(true);
    return true;
});

samp.OnPlayerKeyStateChange((player, NEWKEY, OLDKEY) => {
    if(NEWKEY == samp.KEY.SECONDARY_ATTACK) {
        if(PlayerInfo.InHouse[player.playerid]) {
            if(samp.IsPlayerInRangeOfPoint(player.playerid, 2, HouseInfo.interior.x[PlayerInfo.InHouse[player.playerid]], HouseInfo.interior.y[PlayerInfo.InHouse[player.playerid]], HouseInfo.interior.z[PlayerInfo.InHouse[player.playerid]])) {
                player.SetPlayerVirtualWorld(0);
                player.SetPlayerInterior(0);
                player.SetPlayerPos(HouseInfo.exterior.x[PlayerInfo.InHouse[player.playerid]], HouseInfo.exterior.y[PlayerInfo.InHouse[player.playerid]], HouseInfo.exterior.z[PlayerInfo.InHouse[player.playerid]]);
                PlayerInfo.InHouse[player.playerid] = 0;
            }
        }
        else {
            var house = isPlayerAtAnyHouseCoord(player.playerid);
            if(house != -1) {
                if(HouseInfo.password[house] == "" || HouseInfo.owner[house] == PlayerInfo.AccID[player.playerid]) {
                    enterPlayerInHouse(player.playerid, house);
                }
                else {
                    PlayerInfo.Enter_House_With_Password[player.playerid] = house;
                    player.ShowPlayerDialog(DIALOG_HOUSE_ENTER_PASSWORD, samp.DIALOG_STYLE.INPUT, "Enter House", `Sorry, but this house is {FF0000}passworded{${colors.DEFAULT}}. If you know the house password, please enter below:`, "Enter", "Close");
                }
            }
        }
    }
    return true;
});

samp.OnPlayerClickPlayer((player, clickedplayer) => {
    if(PlayerInfo.Admin[player.playerid] >= 1) {
        showPlayerPlayerInfoTD(player.playerid, clickedplayer.playerid);
    }
    return true;
});

samp.OnPlayerClickPlayerTextDraw((player, textdraw) => {
    if(textdraw == TDInfo.PlayerInfo[player.playerid][11]) {
        hidePlayerPlayerInfoTD(player.playerid);
    }
});

samp.OnPlayerText((player, text) => {
    SCMALL(player.GetPlayerColor(), `${player.GetPlayerName(24)}{FFFFFF}: ${text}`);
    return false;
});

samp.OnPlayerDisconnect((player, reason) => {
    savePlayer(player.playerid);

    if(PlayerInfo.AdminCar[player.playerid] != -1) {
        if(samp.IsValidVehicle(PlayerInfo.AdminCar[player.playerid])) {
            samp.DestroyVehicle(PlayerInfo.AdminCar[player.playerid]);
        }
        PlayerInfo.AdminCar[player.playerid] = -1;
    }

    resetPlayerVariables(player.playerid);
    return true;
});

samp.OnPlayerConnect((player) => {
    resetPlayerVariables(player.playerid);
    preparatePlayerForLogin(player);
    player.SetPlayerVirtualWorld(player.playerid + 1000);
    loadPlayerTD(player.playerid);
    return true;
});

samp.OnPlayerSpawn((player) => {
    if(PlayerInfo.SpawnLocationAfterSpawn[player.playerid] != 0) {
        player.TogglePlayerSpectating(false);
        PlayerInfo.Spawned[player.playerid] = true;
        player.SetPlayerVirtualWorld(0);
        con.query("SELECT * FROM spawnzones WHERE id = ?", [PlayerInfo.SpawnLocationAfterSpawn[player.playerid]], function(err, result) {
            if(result != 0 && !err) {
                var pos = JSON.parse(result[0].position);
                player.SetPlayerPos(pos.x, pos.y, pos.z);
            }
            else player.Kick();
        });
    }
    else player.Kick();
    return true;
});

samp.OnPlayerUpdate((player) => {
    if(player.IsPlayerInAnyVehicle()) {
        if(player.GetPlayerVehicleSeat() == 0) {
            var vehicleid = player.GetPlayerVehicleID();
            checkIfPlayerIsOwnerOfSpecificVehicle(player.playerid, vehicleid);
        }
    }
    return true;
});

samp.OnPlayerCommandText((player, cmdtext) => {
    if(PlayerInfo.Logged[player.playerid]) {
        cmdtext = cmdtext.toLowerCase();
        cmdtext = replaceAll(cmdtext, "/", "");
        var params = cmdtext.split(/[ ]+/);
        var temp_string = params[0];

        if(CMD.eventNames().some(s => s == temp_string)) {
            params.shift();
            command.emit(`${temp_string}`, player.playerid, params);
        }
        else SCM(player.playerid, 0xFF0000AA, `[e-Force]: {FFFFFF}Comanda {FF0000}/${temp_string} {FFFFFF}nu exista. Foloseste {FF0000}/help {FFFFFF}sau {FF0000}/cmds {FFFFFF}pentru ajutor.`);
    }
    return true;
});

samp.OnPlayerEnterVehicle((player, vehicleid, ispassenger) => {
    return true;
});

samp.OnPlayerEnterCheckpoint((player) => {
    if(PlayerInfo.CheckPointActive[player.playerid]) {
        PlayerInfo.CheckPointActive[player.playerid] = false;
        player.DisablePlayerCheckpoint();
        SCM(player.playerid, -1, "SERVER: Ai ajuns la destinatie.");
    }
    return true;
});

samp.OnDialogResponse((player, dialogid, response, listitem, inputtext) => {
    inputtext = replaceAll(inputtext, "%", "");
    switch(dialogid) {
        case DIALOG_CONFIG: {
            if(response) {
                switch(listitem) {
                    case 0: {
                        player.ShowPlayerDialog(DIALOG_CONFIG_HOSTNAME, samp.DIALOG_STYLE.INPUT, "{FFFFFF}Server Config - {FF0000}Hostname", "Please insert below a new server hostname:", "Set", "Cancel");
                        break;
                    }
                    case 1: {
                        player.ShowPlayerDialog(DIALOG_CONFIG_MODENAME, samp.DIALOG_STYLE.INPUT, "{FFFFFF}Server Config - {FF0000}Modename", "Please insert below a new server modename (gamemode):", "Set", "Cancel");
                        break;
                    }
                    case 2: {
                        con.query("SELECT password FROM serverconfig", function(err, result) {
                            if(result != 0 && !err) {
                                if(result[0].password == "0") {
                                    player.ShowPlayerDialog(DIALOG_CONFIG_PASSWORD, samp.DIALOG_STYLE.INPUT, "{FFFFFF}Server Config - {FF0000}Password", "Please insert below a password for the server:", "Set", "Cancel");
                                }
                                else {
                                    con.query("UPDATE serverconfig SET password = ?", ["0"], function(err, result) {
                                        if(!err) {
                                            SCM(player.playerid, -1, "SERVER: You have successfully removed the server password.");
                                            samp.SendRconCommand("password 0");
                                        }
                                        else sendError(player.playerid, errors.UNEXPECTED_ERROR);
                                    });
                                }
                            }
                            else sendError(player.playerid, errors.UNEXPECTED_ERROR);
                        });
                        break;
                    }
                }
            }
            break;
        }
        case DIALOG_CONFIG_PASSWORD: {
            if(response) {
                if(inputtext.length < 1 || inputtext.length > 30) return player.ShowPlayerDialog(DIALOG_CONFIG_PASSWORD, samp.DIALOG_STYLE.INPUT, "{FFFFFF}Server Config - {FF0000}Password", "Please insert below a password for the server:\nThe string must contain minim 1 and maxim 30 characters.", "Set", "Cancel");
                con.query("UPDATE serverconfig SET password = ?", [inputtext], function(err, result) {
                    if(!err) {
                        SCM(player.playerid, -1, `SERVER: You have successfully seted the server password to: {FF0000}${inputtext}{FFFFFF}.`);
                        samp.SendRconCommand(`password ${inputtext}`);
                    }
                    else sendError(player.playerid, errors.UNEXPECTED_ERROR);
                });
            }
            break;
        }
        case DIALOG_CONFIG_HOSTNAME: {
            if(response) {
                if(inputtext.length < 5 || inputtext.length > 40) return player.ShowPlayerDialog(DIALOG_CONFIG_HOSTNAME, samp.DIALOG_STYLE.INPUT, "{FFFFFF}Server Config - {FF0000}Hostname", "Please insert below a new server hostname:\nThe string must contain minim 5 and maxim 40 characters.", "Set", "Cancel");
                con.query("UPDATE serverconfig SET hostname = ?", [inputtext], function(err, result) {
                    if(!err) {
                        SCM(player.playerid, -1, `SERVER: You have successfully changed the server hostname to: {FF0000}${inputtext}{FFFFFF}.`);
                        samp.SendRconCommand(`hostname ${inputtext}`);
                    }
                    else sendError(player.playerid, errors.UNEXPECTED_ERROR);
                });
            }
            break;
        }
        case DIALOG_CONFIG_MODENAME: {
            if(response) {
                if(inputtext.length < 3 || inputtext.length > 15) return player.ShowPlayerDialog(DIALOG_CONFIG_MODENAME, samp.DIALOG_STYLE.INPUT, "{FFFFFF}Server Config - {FF0000}Modename", "Please insert below a new server modename (gamemode):\nThe string must contain minim 3 and maxim 15 characters.", "Set", "Cancel");
                con.query("UPDATE serverconfig SET modename = ?", [inputtext], function(err, result) {
                    if(!err) {
                        SCM(player.playerid, -1, `SERVER: You have successfully changed the server modename to: {FF0000}${inputtext}{FFFFFF}.`);
                        samp.SendRconCommand(`gamemodetext ${inputtext}`);
                    }
                    else sendError(player.playerid, errors.UNEXPECTED_ERROR);
                });
            }
            break;
        }
        case DIALOG_SHOW_SPAWN_ZONES: {
            if(response) {
                con.query("SELECT * FROM spawnzones", function(err, result) {
                    if(result != 0) {
                        for(var i = 0; i < result.length; i++) {
                            if(i == listitem) {
                                var pos = JSON.parse(result[i].position);
                                player.SetPlayerPos(pos.x, pos.y, pos.z);
                                SCM(player.playerid, -1, `SERVER: You have successfully teleported to spawn zone {FF0000}${result[i].name}{FFFFFF}.`);
                                break;
                            }
                        }
                    }
                    else sendError(player.playerid, errors.UNEXPECTED_ERROR);
                });
            }
            break;
        }
        case DIALOG_SELECT_SPAWN_ZONE: {
            if(response) {
                con.query("SELECT * FROM spawnzones", function(err, result) {
                    if(result != 0) {
                        for(var i = 0; i < result.length; i++) {
                            if(i == listitem) {
                                PlayerInfo.SpawnLocationAfterSpawn[player.playerid] = result[i].id;
                                player.SpawnPlayer();
                                break;
                            }
                        }
                    }
                    else player.Kick();
                });
            }
            else showSpawnSelect(player.playerid);
            break;
        }
        case DIALOG_EDIT_SPAWN_START: {
            if(response) {
                con.query("SELECT * FROM spawnzones WHERE id = ?", [PlayerInfo.Current_Edit_Spawn[player.playerid]], function(err, result) {
                    if(result != 0) {
                        switch(listitem) {
                            case 0: {
                                player.ShowPlayerDialog(DIALOG_EDIT_SPAWN_START_NAME, samp.DIALOG_STYLE.INPUT, `{FFFFFF}Edit Spawn - {FF0000}${result[0].name} {FFFFFF}- Name`, "Please insert below a new name for this spawn.", "Set", "Back");
                                break;
                            }
                            case 1: {
                                showSpawnZoneEditForPlayer(player.playerid);
                                break;
                            }
                            case 2: {
                                con.query("UPDATE spawnzones SET name = ?, position = ? WHERE id = ?", [PlayerInfo.Current_Edit_Spawn_Var.Name[player.playerid], generatePlayerJSONPosition(player.playerid), PlayerInfo.Current_Edit_Spawn[player.playerid]], function(err, result) {
                                    if(!err) {
                                        SCM(player.playerid, -1, `SERVER: You have successfully edited spawn zone. (Name: {FF0000}${PlayerInfo.Current_Edit_Spawn_Var.Name[player.playerid]}{FFFFFF}, ID: {FF0000}${PlayerInfo.Current_Edit_Spawn[player.playerid]}{FFFFFF}).`);
                                        PlayerInfo.Current_Edit_Spawn[player.playerid] = 0;
                                        PlayerInfo.Current_Edit_Spawn_Var.Name[player.playerid] = "";
                                    }
                                });
                                break;
                            }
                        }
                    }
                    else {
                        PlayerInfo.Current_Edit_Spawn[player.playerid] = 0;
                        PlayerInfo.Current_Edit_Spawn_Var.Name[player.playerid] = "";
                        sendError(player.playerid, errors.UNEXPECTED_ERROR);
                    }
                });
            }
            else {
                PlayerInfo.Current_Edit_Spawn[player.playerid] = 0;
                PlayerInfo.Current_Edit_Spawn_Var.Name[player.playerid] = "";
            }
            break;
        }
        case DIALOG_EDIT_SPAWN_START_NAME: {
            if(response) {
                con.query("SELECT * FROM spawnzones WHERE id = ?", [PlayerInfo.Current_Edit_Spawn[player.playerid]], function(err, result) {
                    if(result != 0) {
                        if(inputtext.length < 3 || inputtext.length > 20) return player.ShowPlayerDialog(DIALOG_EDIT_SPAWN_START_NAME, samp.DIALOG_STYLE.INPUT, `{FFFFFF}Edit Spawn - {FF0000}${result[0].name} {FFFFFF}- Name`, "Please insert below a new name for this spawn.\nMinim 3 and maxim 20 length.", "Set", "Back");
                        con.query("SELECT * FROM spawnzones WHERE name = ?", [inputtext], function(err, result) {
                            if(result == 0) {
                                PlayerInfo.Current_Edit_Spawn_Var.Name[player.playerid] = inputtext;
                                showSpawnZoneEditForPlayer(player.playerid);
                            }
                            else player.ShowPlayerDialog(DIALOG_EDIT_SPAWN_START_NAME, samp.DIALOG_STYLE.INPUT, `{FFFFFF}Edit Spawn - {FF0000}${result[0].name} {FFFFFF}- Name`, "Please insert below a new name for this spawn.\nThis spawn zone already exists.", "Set", "Back");
                        });
                    }
                    else {
                        PlayerInfo.Current_Edit_Spawn[player.playerid] = 0;
                        PlayerInfo.Current_Edit_Spawn_Var.Name[player.playerid] = "";
                        sendError(player.playerid, errors.UNEXPECTED_ERROR);
                    }
                });
            }
            else showSpawnZoneEditForPlayer(player.playerid);
            break;
        }
        case DIALOG_EDIT_SPAWN: {
            if(response) {
                con.query("SELECT * FROM spawnzones", function(err, result) {
                    if(result != 0) {
                        for(var i = 0; result.length; i++) {
                            if(i == listitem) {
                                PlayerInfo.Current_Edit_Spawn[player.playerid] = result[i].id;
                                showSpawnZoneEditForPlayer(player.playerid);
                                break;
                            }
                        }
                    }
                    else {
                        PlayerInfo.Current_Edit_Spawn[player.playerid] = 0;
                        sendError(player.playerid, errors.UNEXPECTED_ERROR);
                    }
                });
            }
            else PlayerInfo.Current_Edit_Spawn[player.playerid] = 0;
            break;
        }
        case DIALOG_DELETE_SPAWN: {
            if(response) {
                con.query("SELECT * FROM spawnzones", function(err, result) {
                    if(result != 0) {
                        for(var i = 0; i < result.length; i++) {
                            if(i == listitem) {
                                PlayerInfo.Current_Delete_Spawn[player.playerid] = result[i].id;
                                player.ShowPlayerDialog(DIALOG_DELETE_SPAWN_CONFIRM, samp.DIALOG_STYLE.MSGBOX, "Delete Spawn - {FF0000}Confirm", `Are you sure that you want to delete spawn {FF0000}${result[i].name} {${colors.DEFAULT}} ?`, "Yes", "No");
                                break;
                            }
                        }
                    }
                    else PlayerInfo.Current_Delete_Spawn[player.playerid] = 0;
                });
            }
            else PlayerInfo.Current_Delete_Spawn[player.playerid] = 0;
            break;
        }
        case DIALOG_DELETE_SPAWN_CONFIRM: {
            if(response) {
                con.query("SELECT * FROM spawnzones WHERE id = ?", [PlayerInfo.Current_Delete_Spawn[player.playerid]], function(err, result) {
                    if(result != 0) {
                        var id = result[0].id;
                        var name = result[0].name;
                        con.query("DELETE FROM spawnzones WHERE id = ?", [PlayerInfo.Current_Delete_Spawn[player.playerid]], function(err, result) {
                            if(!err) {
                                SCM(player.playerid, -1, `SERVER: You have successfully deleted spawn zone. (Name: {FF0000}${name}{FFFFFF}, ID: {FF0000}${id}{FFFFFF}).`)
                            }
                            else {
                                PlayerInfo.Current_Delete_Spawn[player.playerid] = 0;
                                sendError(player.playerid, errors.UNEXPECTED_ERROR);
                            }
                        });
                    }
                    else {
                        PlayerInfo.Current_Delete_Spawn[player.playerid] = 0;
                        sendError(player.playerid, "This spawn zone is no longer exists.");
                    }
                });
            }
            else PlayerInfo.Current_Delete_Spawn[player.playerid] = 0;
            break;
        }
        case DIALOG_CREATE_SPAWN: {
            if(response) {
                switch(listitem) {
                    case 0: {
                        player.ShowPlayerDialog(DIALOG_CREATE_SPAWN_NAME, samp.DIALOG_STYLE.INPUT, "Create Spawn - {FF0000}Name", "Please insert below a spawn name.", "Set", "Back");
                        break;
                    }
                    case 1: {
                        command.emit("createspawn", player.playerid);
                        break;
                    }
                    case 2: {
                        if(PlayerInfo.Current_Create_Spawn.Name[player.playerid] != "") {
                            con.query("SELECT * FROM spawnzones WHERE name = ?", [PlayerInfo.Current_Create_Spawn.Name[player.playerid]], function(err, result) {
                                if(result == 0) {
                                    con.query("INSERT INTO spawnzones (name, position) VALUES(?, ?)", [PlayerInfo.Current_Create_Spawn.Name[player.playerid], generatePlayerJSONPosition(player.playerid)], function(err, result) {
                                        if(!err) {
                                            SCM(player.playerid, -1, `SERVER: Spawn zone successfully created. (Name: {FF0000}${PlayerInfo.Current_Create_Spawn.Name[player.playerid]}{FFFFFF}, ID: {FF0000}${result.insertId}{FFFFFF}).`);
                                            PlayerInfo.Current_Create_Spawn.Name[player.playerid] = "";
                                        }
                                        else {
                                            PlayerInfo.Current_Create_Spawn.Name[player.playerid] = "";
                                            sendError(player.playerid, errors.UNEXPECTED_ERROR);
                                        }
                                    });
                                }
                                else {
                                    PlayerInfo.Current_Create_Spawn.Name[player.playerid] = "";
                                    sendError(player.playerid, "This spawn zone already exists.");
                                }
                            });
                        }
                        else command.emit("createspawn", player.playerid);
                        break;
                    }
                }
            }
            else PlayerInfo.Current_Create_Spawn.Name[player.playerid] = "";
            break;
        }
        case DIALOG_CREATE_SPAWN_NAME: {
            if(response) {
                if(inputtext.length < 3 || inputtext.length > 20) return player.ShowPlayerDialog(DIALOG_CREATE_SPAWN_NAME, samp.DIALOG_STYLE.INPUT, "Create Spawn - {FF0000}Name", "Please insert below a spawn name.\nMinim 3 and maxim 20 length.", "Set", "Back");
                con.query("SELECT * FROM spawnzones WHERE name = ?", [inputtext], function(err, result) {
                    if(result == 0) {
                        PlayerInfo.Current_Create_Spawn.Name[player.playerid] = inputtext;
                        command.emit("createspawn", player.playerid);
                    }
                    else player.ShowPlayerDialog(DIALOG_CREATE_SPAWN_NAME, samp.DIALOG_STYLE.INPUT, "Create Spawn - {FF0000}Name", "Please insert below a spawn name.\nThis spawn zone already exists.", "Set", "Back");
                });
            }
            else command.emit("createspawn", player.playerid);
            break;
        }
        case DIALOG_HOUSE_ENTER_PASSWORD: {
            if(response) {
                if(HouseInfo.password[PlayerInfo.Enter_House_With_Password[player.playerid]] == md5(inputtext)) {
                    enterPlayerInHouse(player.playerid, PlayerInfo.Enter_House_With_Password[player.playerid]);
                }
                else player.ShowPlayerDialog(DIALOG_HOUSE_ENTER_PASSWORD, samp.DIALOG_STYLE.INPUT, "Enter House", `Sorry, but this house is {FF0000}passworded{${colors.DEFAULT}}. If you know the house password, please enter below:\nYou provided an invalid house password.`, "Enter", "Close");
            }
            else PlayerInfo.Enter_House_With_Password[player.playerid] = 0;
            break;
        }
        case DIALOG_MYHOUSES: {
            if(response) {
                var count = 0;
                for(var i = 1; i <= HouseInfo.MAX_HOUSES; i++) {
                    if(HouseInfo.owner[i] == PlayerInfo.AccID[player.playerid]) {
                        if(listitem == count) {
                            (async() => {
                                PlayerInfo.Current_House_Manage[player.playerid] = i;
                                var string = "Option\tDescription";
                                string += `\nFind\tFind With GPS`;
                                string += `\nPassword\t${HouseInfo.password[i] == "" ? "{00CC00}Currently open" : "{FF0000}Currently passworded"}`;
                                player.ShowPlayerDialog(DIALOG_MYHOUSES_OPTIONS, samp.DIALOG_STYLE.TABLIST_HEADERS, `{FFFFFF}Manage house: {FF0000}${await getLocationName(HouseInfo.exterior.x[i], HouseInfo.exterior.y[i], HouseInfo.exterior.z[i])}`, string, "Select", "Close");
                            })();
                            break;
                        }
                        else count++;
                    }
                }
            }
            break;
        }
        case DIALOG_MYHOUSES_OPTIONS: {
            if(response) {
                switch(listitem) {
                    case 0: {
                        setPlayerCheckpoint(player.playerid, HouseInfo.exterior.x[PlayerInfo.Current_House_Manage[player.playerid]], HouseInfo.exterior.y[PlayerInfo.Current_House_Manage[player.playerid]], HouseInfo.exterior.z[PlayerInfo.Current_House_Manage[player.playerid]], "Casa ta");
                        break;
                    }
                    case 1: {
                        (async() => {
                            if(HouseInfo.password[PlayerInfo.Current_House_Manage[player.playerid]] != "") {
                                player.ShowPlayerDialog(DIALOG_MYHOUSES_PASSWORD, samp.DIALOG_STYLE.MSGBOX, `{FFFFFF}Manage house: {FF0000}${await getLocationName(HouseInfo.exterior.x[PlayerInfo.Current_House_Manage[player.playerid]], HouseInfo.exterior.y[PlayerInfo.Current_House_Manage[player.playerid]], HouseInfo.exterior.z[PlayerInfo.Current_House_Manage[player.playerid]])} {FFFFFF}- Password`, "So what you want to do?", "Remove", "Change");
                            }
                            else {
                                player.ShowPlayerDialog(DIALOG_MYHOUSES_PASSWORD_CHANGE, samp.DIALOG_STYLE.INPUT, `{FFFFFF}Manage house: {FF0000}${await getLocationName(HouseInfo.exterior.x[PlayerInfo.Current_House_Manage[player.playerid]], HouseInfo.exterior.y[PlayerInfo.Current_House_Manage[player.playerid]], HouseInfo.exterior.z[PlayerInfo.Current_House_Manage[player.playerid]])} {FFFFFF}- Password`, "Please insert below a house password:", "Set", "Cancel");
                            }
                        })();
                        break;
                    }
                }
            }
            else PlayerInfo.Current_House_Manage[player.playerid] = 0;
            break;
        }
        case DIALOG_MYHOUSES_PASSWORD: {
            if(response) {
                con.query("UPDATE houses SET password = ? WHERE id = ?", ["", PlayerInfo.Current_House_Manage[player.playerid]]);
                HouseInfo.password[PlayerInfo.Current_House_Manage[player.playerid]] = "";
                PlayerInfo.Current_House_Manage[player.playerid] = 0;
                SCM(player.playerid, -1, "SERVER: Successfully removed {FF0000}password {FFFFFF}from your house.");
            }
            else {
                (async() => {
                    player.ShowPlayerDialog(DIALOG_MYHOUSES_PASSWORD_CHANGE, samp.DIALOG_STYLE.INPUT, `{FFFFFF}Manage house: {FF0000}${await getLocationName(HouseInfo.exterior.x[PlayerInfo.Current_House_Manage[player.playerid]], HouseInfo.exterior.y[PlayerInfo.Current_House_Manage[player.playerid]], HouseInfo.exterior.z[PlayerInfo.Current_House_Manage[player.playerid]])} {FFFFFF}- Password`, "Please insert below a house password:", "Set", "Cancel");
                })();
            }
            break;
        }
        case DIALOG_MYHOUSES_PASSWORD_CHANGE: {
            if(response) {
                (async() => {
                    if(inputtext.length < 3 || inputtext.length > 20) return player.ShowPlayerDialog(DIALOG_MYHOUSES_PASSWORD_CHANGE, samp.DIALOG_STYLE.INPUT, `{FFFFFF}Manage house: {FF0000}${await getLocationName(HouseInfo.exterior.x[PlayerInfo.Current_House_Manage[player.playerid]], HouseInfo.exterior.y[PlayerInfo.Current_House_Manage[player.playerid]], HouseInfo.exterior.z[PlayerInfo.Current_House_Manage[player.playerid]])} {FFFFFF}- Password`, "Please insert below a house password:\nMinim 3 and maxim 20 length.", "Set", "Cancel");
                    HouseInfo.password[PlayerInfo.Current_House_Manage[player.playerid]] = md5(inputtext);
                    con.query("UPDATE houses SET password = ? WHERE id = ?", [HouseInfo.password[PlayerInfo.Current_House_Manage[player.playerid]], PlayerInfo.Current_House_Manage[player.playerid]]);
                    PlayerInfo.Current_House_Manage[player.playerid] = 0;
                    SCM(player.playerid, -1, `SERVER: Successfully changed {FF0000}password {FFFFFF}for your house. Password: {FF0000}${inputtext}{FFFFFF}.`);
                })();
            }
            else PlayerInfo.Current_House_Manage[player.playerid] = 0;
            break;
        }
        case DIALOG_GPS_INFO_SELECT_CATEGORY: {
            if(response) {
                con.query("SELECT * FROM gps", function(err, result) {
                    if(result != 0) {
                        var gps_category = [], count = 0;
                        for(var i = 0; i < result.length; i++) {
                            if(!gps_category.some(s => s == result[i].category)) {
                                gps_category.push(result[i].category);
                                if(count == listitem) {
                                    PlayerInfo.Current_GPS_Info.Category[player.playerid] = result[i].category;
                                    con.query("SELECT * FROM gps WHERE category = ?", [PlayerInfo.Current_GPS_Info.Category[player.playerid]], function(err, result) {
                                        if(result != 0) {
                                            var string = "";
                                            for(var i = 0; i < result.length; i++) {
                                                string += `${string != "" ? "\n" : ""}${result[i].name}`;
                                            }
                                            player.ShowPlayerDialog(DIALOG_GPS_INFO_SELECT_NAME, samp.DIALOG_STYLE.LIST, "GPS - Info", string, "Select", "Back");
                                        }
                                        else {
                                            sendError(player.playerid, "No available GPS.");
                                        }
                                    });
                                    break;
                                }
                                else count++;
                            }
                        }
                    }
                    else {
                        sendError(player.playerid, "No available GPS.");
                    }
                });
            }
            else {
                PlayerInfo.Current_GPS_Info.Category[player.playerid] = "";
            }
            break;
        }
        case DIALOG_GPS_INFO_SELECT_NAME: {
            if(response) {
                con.query("SELECT * FROM gps WHERE category = ?", [PlayerInfo.Current_GPS_Info.Category[player.playerid]], function(err, result) {
                    if(result != 0) {
                        for(var i = 0; i < result.length; i++) {
                            if(listitem == i) {
                                SCM(player.playerid, -1, `SERVER: GPS ID: {FF0000}${result[i].id} {FFFFFF}(Category: {FF0000}${result[i].category}{FFFFFF}, Name: {FF0000}${result[i].name}{FFFFFF})`);
                                PlayerInfo.Current_GPS_Info.Category[player.playerid] = "";
                                break;
                            }
                        }
                    }
                });
            }
            else command.emit("gpsinfo", player.playerid);
            break;
        }
        case DIALOG_EDIT_GPS: {
            if(response) {
                con.query("SELECT * FROM gps WHERE id = ?", [PlayerInfo.Current_Edit_GPS[player.playerid]], function(err, result) {
                    if(result != 0) {
                        switch(listitem) {
                            case 0: {
                                player.ShowPlayerDialog(DIALOG_EDIT_GPS_NAME, samp.DIALOG_STYLE.INPUT, `{FFFFFF}Edit GPS - {FF0000}${result[0].name} {FFFFFF}- Name`, "Plase insert below a new name for this GPS.", "Set", "Back");
                                break;
                            }
                            case 1: {
                                SCM(playerid, -1, "SERVER: Soon.");
                                PlayerInfo.Current_Edit_GPS[player.playerid] = 0;
                                break; 
                            }
                            case 2: {
                                con.query("UPDATE gps SET position = ? WHERE id = ?", [generatePlayerJSONPosition(player.playerid), PlayerInfo.Current_Edit_GPS[player.playerid]], function(err, result) {
                                    if(!err) {
                                        SCM(player.playerid, -1, `SERVER: GPS position for ID {FF0000}${PlayerInfo.Current_Edit_GPS[player.playerid]} {FFFFFF}was successfully modified to your current position.`);
                                        PlayerInfo.Current_Edit_GPS[player.playerid] = 0; 
                                    }
                                });
                                break;
                            }
                        }
                    }
                    else PlayerInfo.Current_Edit_GPS[player.playerid] = 0;
                });
            }
            else PlayerInfo.Current_Edit_GPS[player.playerid] = 0;
            break;
        }
        case DIALOG_EDIT_GPS_NAME: {
            if(response) {
                con.query("SELECT * FROM gps WHERE id = ?", [PlayerInfo.Current_Edit_GPS[player.playerid]], function(err, result) {
                    if(result != 0) {
                        if(inputtext.length < 3 || inputtext.length > 20) return player.ShowPlayerDialog(DIALOG_EDIT_GPS_NAME, samp.DIALOG_STYLE.INPUT, `{FFFFFF}Edit GPS - {FF0000}${result[0].name} {FFFFFF}- Name`, "Plase insert below a new name for this GPS.\nThe title must have between 3 and 20 characters.", "Set", "Back");
                        con.query("UPDATE gps SET name = ? WHERE id = ?", [inputtext, PlayerInfo.Current_Edit_GPS[player.playerid]], function(err, result) {
                            if(!err) {
                                SCM(player.playerid, -1, `SERVER: GPS Name for ID {FF0000}${PlayerInfo.Current_Edit_GPS[player.playerid]} {FFFFFF}was successfully modified to value: {FF0000}${inputtext}{FFFFFF}.`);
                                PlayerInfo.Current_Edit_GPS[player.playerid] = 0;
                            }
                        });
                    }
                });
            }
            else command.emit("editgps", player.playerid, [PlayerInfo.Current_Edit_GPS[player.playerid]]);
            break;
        }
        case DIALOG_DELETE_GPS_SELECT_CATEGORY: {
            if(response) {
                con.query("SELECT * FROM gps", function(err, result) {
                    if(result != 0) {
                        var gps_category = [], count = 0;
                        for(var i = 0; i < result.length; i++) {
                            if(!gps_category.some(s => s == result[i].category)) {
                                gps_category.push(result[i].category);
                                if(count == listitem) {
                                    PlayerInfo.Current_Delete_GPS.Category[player.playerid] = result[i].category;
                                    con.query("SELECT * FROM gps WHERE category = ?", [PlayerInfo.Current_Delete_GPS.Category[player.playerid]], function(err, result) {
                                        if(result != 0) {
                                            var string = "";
                                            for(var i = 0; i < result.length; i++) {
                                                string += `${string != "" ? "\n" : ""}${result[i].name}`;
                                            }
                                            player.ShowPlayerDialog(DIALOG_DELETE_GPS_SELECT_NAME, samp.DIALOG_STYLE.LIST, "Delete GPS - Select Name", string, "Select", "Close");
                                        }
                                        else {
                                            sendError(player.playerid, "No available GPS.");
                                            resetGPSDelete(player.playerid);
                                        }
                                    });
                                    break;
                                }
                                else count++;
                            }
                        }
                    }
                    else {
                        sendError(player.playerid, "No available GPS.");
                        resetGPSDelete(player.playerid);
                    }
                });
            }
            else resetGPSDelete(player.playerid);
            break;
        }
        case DIALOG_DELETE_GPS_SELECT_NAME: {
            if(response) {
                con.query("SELECT * FROM gps WHERE category = ?", [PlayerInfo.Current_Delete_GPS.Category[player.playerid]], function(err, result) {
                    if(result != 0) {
                        for(var i = 0; i < result.length; i++) {
                            if(listitem == i) {
                                PlayerInfo.Current_Delete_GPS.Name[player.playerid] = result[i].name;
                                player.ShowPlayerDialog(DIALOG_DELETE_GPS_CONFIRM, samp.DIALOG_STYLE.MSGBOX, "Delete GPS - Confirm", `{FFFFFF}Are you sure that you want to delete GPS {FF0000}${PlayerInfo.Current_Delete_GPS.Name[player.playerid]} {FFFFFF}in category {FF0000}${PlayerInfo.Current_Delete_GPS.Category[player.playerid]} {FFFFFF}?`, "Yes", "Cancel");
                                break;
                            }
                        }
                    }
                });
            }
            else resetGPSDelete(player.playerid);
            break;
        }
        case DIALOG_DELETE_GPS_CONFIRM: {
            if(response) {
                if(PlayerInfo.Current_Delete_GPS.Category[player.playerid] != "" && PlayerInfo.Current_Delete_GPS.Name[player.playerid] != "") {
                    con.query("SELECT * FROM gps WHERE category = ? AND name = ?", [PlayerInfo.Current_Delete_GPS.Category[player.playerid], PlayerInfo.Current_Delete_GPS.Name[player.playerid]], function(err, result) {
                        if(result != 0) {
                            var id = result[0].id;
                            con.query("DELETE FROM gps WHERE category = ? AND name = ?", [PlayerInfo.Current_Delete_GPS.Category[player.playerid], PlayerInfo.Current_Delete_GPS.Name[player.playerid]], function(err, result) {
                                if(!err) {
                                    SCM(player.playerid, -1, `SERVER: You have successfully deleted GPS. {FFFFFF}(Category: {FF0000}${PlayerInfo.Current_Delete_GPS.Category[player.playerid]}{FFFFFF}, Name: {FF0000}${PlayerInfo.Current_Delete_GPS.Name[player.playerid]}{FFFFFF}, ID: {FF0000}${id}{FFFFFF})`);
                                    resetGPSDelete(player.playerid);
                                }
                                else {
                                    sendError(player.playerid, "Cannot delete from database.");
                                    resetGPSDelete(player.playerid);
                                }
                            });
                        }
                    });
                }
                else {
                    sendError(player.playerid, "An unexpected error has been ocurred.");
                    resetGPSDelete(player.playerid);
                }
            }
            else resetGPSDelete(player.playerid);
            break;
        }
        case DIALOG_CREATE_GPS: {
            if(response) {
                switch(listitem) {
                    case 0: {
                        player.ShowPlayerDialog(DIALOG_CREATE_GPS_NAME, samp.DIALOG_STYLE.INPUT, "Create GPS - Name", "Please insert below a name for the location.", "Set", "Back");
                        break;
                    }
                    case 1: {
                        player.ShowPlayerDialog(DIALOG_CREATE_GPS_CATEGORY, samp.DIALOG_STYLE.LIST, "Create GPS - Category", "Create new\nAdd to an existent", "Select", "Back");
                        break; 
                    }
                    case 2: {
                        showGPSCreate(player.playerid);
                        break; 
                    }
                    case 3: {
                        if(PlayerInfo.Current_Create_GPS.Name[player.playerid] != "" && PlayerInfo.Current_Create_GPS.Category[player.playerid] != "") {
                            con.query("SELECT * FROM gps WHERE name = ? AND category = ?", [PlayerInfo.Current_Create_GPS.Name[player.playerid], PlayerInfo.Current_Create_GPS.Category[player.playerid]], function(err, result) {
                                if(result == 0) {
                                    con.query("INSERT INTO gps (name, category, position) VALUES(?, ?, ?)", [PlayerInfo.Current_Create_GPS.Name[player.playerid], PlayerInfo.Current_Create_GPS.Category[player.playerid], generatePlayerJSONPosition(player.playerid)], function(err, result) {
                                        if(!err) {
                                            SCM(player.playerid, -1, `SERVER: GPS successfully created. (Name: {FF0000}${PlayerInfo.Current_Create_GPS.Name[player.playerid]}{FFFFFF}, Category: {FF0000}${PlayerInfo.Current_Create_GPS.Category[player.playerid]}{FFFFFF}, ID: {FF0000}${result.insertId}{FFFFFF}).`);
                                            resetGPSCreate(player.playerid);
                                        }
                                        else {
                                            sendError(player.playerid, "An error has ocurred while inserting into database.");
                                            showGPSCreate(player.playerid);
                                            console.log(err);
                                        }
                                    });
                                }
                                else {
                                    sendError(player.playerid, "This location already exists.");
                                    showGPSCreate(player.playerid);
                                }
                            });
                        }
                        else showGPSCreate(player.playerid);
                        break;
                    }
                }
            }
            else resetGPSCreate(player.playerid);
            break;
        }
        case DIALOG_CREATE_GPS_NAME: {
            if(response) {
                if(inputtext.length < 3 || inputtext.length > 20) return player.ShowPlayerDialog(DIALOG_CREATE_GPS_NAME, samp.DIALOG_STYLE.INPUT, "Create GPS - Name", "Please insert below a name for the location.\nThe title must have between 3 and 20 characters.", "Set", "Back");
                PlayerInfo.Current_Create_GPS.Name[player.playerid] = inputtext;
                showGPSCreate(player.playerid);
            }
            else showGPSCreate(player.playerid);
            break;
        }
        case DIALOG_CREATE_GPS_CATEGORY: {
            if(response) {
                switch(listitem) {
                    case 0: {
                        player.ShowPlayerDialog(DIALOG_CREATE_GPS_CATEGORY_NEW, samp.DIALOG_STYLE.INPUT, "Create GPS - Category - New", "Please insert below a category name for the location.", "Set", "Back");
                        break;
                    }
                    case 1: {
                        con.query("SELECT * FROM gps", function(err, result) {
                            if(result != 0) {
                                var gps_category = [];
                                for(var i = 0; i < result.length; i++) {
                                    if(!gps_category.some(s => s == result[i].category)) {
                                        gps_category.push(result[i].category);
                                    }
                                }
                                var string = "";
                                gps_category.forEach((value) => {
                                    string += `${string != "" ? "\n" : ""}${value}`;
                                }); 
                                player.ShowPlayerDialog(DIALOG_CREATE_GPS_CATEGORY_SELECT, samp.DIALOG_STYLE.LIST, "Create GPS - Category - Select", string, "Select", "Back");
                            }
                        });
                        break;
                    }
                }
            }
            else showGPSCreate(player.playerid);
            break;
        }
        case DIALOG_CREATE_GPS_CATEGORY_NEW: {
            if(response) {
                if(inputtext.length < 3 || inputtext.length > 20) return player.ShowPlayerDialog(DIALOG_CREATE_GPS_CATEGORY_NEW, samp.DIALOG_STYLE.INPUT, "Create GPS - Category - New", "Please insert below a category name for the location.\nThe category must have between 3 and 20 characters.", "Set", "Back");
                con.query("SELECT * FROM gps WHERE category = ?", [inputtext], function(err, result) {
                    if(result != 0) return player.ShowPlayerDialog(DIALOG_CREATE_GPS_CATEGORY_NEW, samp.DIALOG_STYLE.INPUT, "Create GPS - Category - New", "Please insert below a category name for the location.\nThis category already exists.", "Set", "Back");
                    else {
                        PlayerInfo.Current_Create_GPS.Category[player.playerid] = inputtext;
                        showGPSCreate(player.playerid);
                    }
                });
            }
            else player.ShowPlayerDialog(DIALOG_CREATE_GPS_CATEGORY, samp.DIALOG_STYLE.LIST, "Create GPS - Category", "Create new\nAdd to an existent", "Select", "Back");
            break;
        }
        case DIALOG_CREATE_GPS_CATEGORY_SELECT: {
            if(response) {
                con.query("SELECT * FROM gps", function(err, result) {
                    if(result != 0) {
                        var gps_category = [], count = 0;
                        for(var i = 0; i < result.length; i++) {
                            if(!gps_category.some(s => s == result[i].category)) {
                                gps_category.push(result[i].category);
                                if(count == listitem) {
                                    PlayerInfo.Current_Create_GPS.Category[player.playerid] = result[i].category;
                                    showGPSCreate(player.playerid);
                                    break;
                                }
                                else count++;
                            }
                        }
                    }
                });
            }
            else player.ShowPlayerDialog(DIALOG_CREATE_GPS_CATEGORY, samp.DIALOG_STYLE.LIST, "Create GPS - Category", "Create new\nAdd to an existent", "Select", "Back");
            break;
        }
        case DIALOG_GPS: {
            if(response) {
                con.query("SELECT * FROM gps", function(err, result) {
                    if(result != 0) {
                        var gps_category = [], count = 0;
                        for(var i = 0; i < result.length; i++) {
                            if(!gps_category.some(s => s == result[i].category)) {
                                gps_category.push(result[i].category);
                                if(count == listitem) {
                                    PlayerInfo.Current_GPS_Category[player.playerid] = result[i].category;
                                    con.query("SELECT * FROM gps WHERE category = ?", [result[i].category], function(err, result) {
                                        if(result != 0) {
                                            var string = "Location\tDistance", count = 0;
                                            for(var i = 0; i < result.length; i++) {
                                                count++;
                                                var pos = JSON.parse(result[i].position);
                                                string += `\n${result[i].name}\t${player.GetPlayerDistanceFromPoint(pos.x, pos.y, pos.z).toFixed()} meters`;
                                            }
                                            player.ShowPlayerDialog(DIALOG_GPS_SELECT_LOCATION, samp.DIALOG_STYLE.TABLIST_HEADERS, `GPS - {FF0000}${PlayerInfo.Current_GPS_Category[player.playerid]}`, string, "Select", "Back");
                                        }
                                    });
                                    break;
                                }
                                else count++;
                            }
                        }
                    }
                });
            }
            else PlayerInfo.Current_GPS_Category[player.playerid] = "";
            break;
        }
        case DIALOG_GPS_SELECT_LOCATION: {
            if(response) {
                con.query("SELECT * FROM gps WHERE category = ?", [PlayerInfo.Current_GPS_Category[player.playerid]], function(err, result) {
                    if(result != 0) {
                        for(var i = 0; i < result.length; i++) {
                            if(i == listitem) {
                                var pos = JSON.parse(result[i].position);
                                setPlayerCheckpoint(player.playerid, pos.x, pos.y, pos.z, result[i].name);
                                break;
                            }
                        }
                    }
                });
            }
            else command.emit("gps", player.playerid);
            break;
        }
        case DIALOG_KILL_CP: {
            if(response) {
                command.emit("killcp", player.playerid);
            }
            break;
        }
        case DIALOG_MYCARS: {
            if(response) {
                var count = 0;
                for(var i = 1; i < pCarInfo.MAX_CARS; i++) {
                    if(pCarInfo.owner[i] == PlayerInfo.AccID[player.playerid]) {
                        if(count == listitem) {
                            PlayerInfo.Current_Car_Manage[player.playerid] = i;
                            var string = "Item\tDescription";
                            string += `\nPark\tPark here`;
                            string += `\nColor1\tChange color1`;
                            string += `\nColor2\tChange color2`;
                            string += `\nFind\tFind with GPS`;
                            string += `\nInformations\tSome informations`;
                            string += `\nText\tPlace a text to your car (premium required)`;
                            string += `\nUpgrade\tUpgrade to premium with 100.000$`;
                            player.ShowPlayerDialog(DIALOG_MYCARS_MANAGE, samp.DIALOG_STYLE.TABLIST_HEADERS, `{FFFFFF}Manage vehicle: {FF0000}${getVehicleNameByID(pCarInfo.model[i])}`, string, "Select", "Close");
                            break;
                        }
                        else count++;
                    }
                }
            }
            break;
        }
        case DIALOG_MYCARS_MANAGE: {
            if(response) {
                var in_his_pcar = false;
                var veh_id = -1;
                if(player.IsPlayerInAnyVehicle()) {
                    veh_id = player.GetPlayerVehicleID();
                    if(veh_id == pCarInfo.handle[PlayerInfo.Current_Car_Manage[player.playerid]]) {
                        in_his_pcar = true;
                    }
                }
                switch(listitem) {
                    case 0: {
                        if(in_his_pcar) {
                            con.query("UPDATE personal_vehicles SET pos_x = ?, pos_y = ?, pos_z = ?, pos_a = ? WHERE id = ?", [player.position.x, player.position.y, player.position.z, player.position.angle, PlayerInfo.Current_Car_Manage[player.playerid]]);
                            pCarInfo.position.x[PlayerInfo.Current_Car_Manage[player.playerid]] = player.position.x;
                            pCarInfo.position.y[PlayerInfo.Current_Car_Manage[player.playerid]] = player.position.y;
                            pCarInfo.position.z[PlayerInfo.Current_Car_Manage[player.playerid]] = player.position.z;
                            pCarInfo.position.a[PlayerInfo.Current_Car_Manage[player.playerid]] = player.position.angle;
                            var players = [];
                            for(var i = 0; i <= samp.GetMaxPlayers(); i++) {
                                if(samp.IsPlayerConnected(i)) {
                                    if(samp.GetPlayerVehicleID(i) == veh_id) {
                                        players.push({
                                            id: i,
                                            seat: samp.GetPlayerVehicleSeat(i)
                                        });
                                    }
                                }
                            }
                            samp.DestroyVehicle(veh_id);
                            pCarInfo.handle[PlayerInfo.Current_Car_Manage[player.playerid]] = samp.CreateVehicle(pCarInfo.model[PlayerInfo.Current_Car_Manage[player.playerid]], pCarInfo.position.x[PlayerInfo.Current_Car_Manage[player.playerid]], pCarInfo.position.y[PlayerInfo.Current_Car_Manage[player.playerid]], pCarInfo.position.z[PlayerInfo.Current_Car_Manage[player.playerid]], pCarInfo.position.a[PlayerInfo.Current_Car_Manage[player.playerid]], pCarInfo.color1[PlayerInfo.Current_Car_Manage[player.playerid]], pCarInfo.color2[PlayerInfo.Current_Car_Manage[player.playerid]], -1);
                            players.forEach((p) => {
                                samp.PutPlayerInVehicle(p.id, pCarInfo.handle[PlayerInfo.Current_Car_Manage[player.playerid]], p.seat);
                            });
                            SCM(player.playerid, -1, "SERVER: Personal vehicle successfully parked.");
                            PlayerInfo.Current_Car_Manage[player.playerid] = 0;
                        }
                        else sendError(player.playerid, errors.NOT_IN_HIS_P_CAR);
                        break;
                    }
                    case 1: {
                        if(in_his_pcar) {
                            player.ShowPlayerDialog(DIALOG_MYCARS_MANAGE_COLOR1, samp.DIALOG_STYLE.INPUT, `{FFFFFF}Manage vehicle: {FF0000}${getVehicleNameByID(pCarInfo.model[PlayerInfo.Current_Car_Manage[player.playerid]])} {FFFFFF}- Color 1`, "Please input below the color id between 0 and 255.", "Set", "Back");
                        }
                        else sendError(player.playerid, errors.NOT_IN_HIS_P_CAR);
                        break;
                    }
                    case 2: {
                        if(in_his_pcar) {
                            player.ShowPlayerDialog(DIALOG_MYCARS_MANAGE_COLOR2, samp.DIALOG_STYLE.INPUT, `{FFFFFF}Manage vehicle: {FF0000}${getVehicleNameByID(pCarInfo.model[PlayerInfo.Current_Car_Manage[player.playerid]])} {FFFFFF}- Color 2`, "Please input below the color id between 0 and 255.", "Set", "Back");
                        }
                        else sendError(player.playerid, errors.NOT_IN_HIS_P_CAR);
                        break;
                    }
                    case 3: {
                        var pos = samp.GetVehiclePos(pCarInfo.handle[PlayerInfo.Current_Car_Manage[player.playerid]]);
                        setPlayerCheckpoint(player.playerid, pos.x, pos.y, pos.z, "Masina ta");
                        break;
                    }
                    case 4: {
                        (async() => {
                            var pos = samp.GetVehiclePos(pCarInfo.handle[PlayerInfo.Current_Car_Manage[player.playerid]]);
                            var string = "";
                            string += `{${colors.DEFAULT}}Vehicle ID: {FF0000}${pCarInfo.handle[PlayerInfo.Current_Car_Manage[player.playerid]]}\n`;
                            string += `{${colors.DEFAULT}}Position: {FF0000}${parseFloat(pos.x).toFixed(2)}, ${parseFloat(pos.y).toFixed(2)}, ${parseFloat(pos.z).toFixed(2)}\n`;
                            string += `{${colors.DEFAULT}}Location name: {FF0000}${await getLocationName(pos.x, pos.y, pos.z)}`;
                            player.ShowPlayerDialog(DIALOG_EMPTY, samp.DIALOG_STYLE.MSGBOX, `{FFFFFF}Manage vehicle: {FF0000}${getVehicleNameByID(pCarInfo.model[PlayerInfo.Current_Car_Manage[player.playerid]])} {FFFFFF}- Informations`, string, "Close", "");
                        })();
                        break;
                    }
                    case 5: {
                        if(pCarInfo.premium[PlayerInfo.Current_Car_Manage[player.playerid]]) {
                            if(in_his_pcar) {
                                var string = "Slot\tCurrently";
                                for(var i = 0; i < 5; i++) {
                                    string += `\n#${i+1}\t${pCarInfo.texts[PlayerInfo.Current_Car_Manage[player.playerid]][i] ? `Text: ${pCarInfo.texts[PlayerInfo.Current_Car_Manage[player.playerid]][i].text}` : "No available"}`;
                                }
                                player.ShowPlayerDialog(DIALOG_MYCARS_MANAGE_TEXT, samp.DIALOG_STYLE.TABLIST_HEADERS, `{FFFFFF}Manage vehicle: {FF0000}${getVehicleNameByID(pCarInfo.model[PlayerInfo.Current_Car_Manage[player.playerid]])} {FFFFFF}- Text`, string, "Select", "Back");
                            }
                            else sendError(player.playerid, errors.NOT_IN_HIS_P_CAR);
                        }
                        else sendError(player.playerid, "You need to have premium vehicle to use this option.");
                        break;
                    }
                    case 6: {
                        if(pCarInfo.premium[PlayerInfo.Current_Car_Manage[player.playerid]] == 0) {
                            if(PlayerInfo.Money[player.playerid] >= 100000) {
                                con.query("UPDATE personal_vehicles SET premium = ? WHERE id = ?", [1, PlayerInfo.Current_Car_Manage[player.playerid]], function(err, result) {
                                    if(!err) {
                                        pCarInfo.premium[PlayerInfo.Current_Car_Manage[player.playerid]] = 1;
                                        SCM(player.playerid, -1, `SERVER: You have successfully upgraded your vehicle {FF0000}${getVehicleNameByID(pCarInfo.model[PlayerInfo.Current_Car_Manage[player.playerid]])} {FFFFFF}to {FF0000}premium{FFFFFF}.`);
                                    }
                                    else sendError(player.playerid, errors.UNEXPECTED_ERROR);
                                });
                            }
                            else sendError(player.playerid, errors.NOT_ENOUGH_MONEY);
                        }
                        else sendError(player.playerid, "This vehicle already upgraded to premium.");
                        break;
                    }
                }
            }
            else PlayerInfo.Current_Car_Manage[player.playerid] = 0;
            break;
        }
        case DIALOG_MYCARS_MANAGE_COLOR1: {
            if(response) {
                if(player.IsPlayerInAnyVehicle()) {
                    var veh_id = player.GetPlayerVehicleID();
                    if(veh_id == pCarInfo.handle[PlayerInfo.Current_Car_Manage[player.playerid]]) {
                        parseInt(inputtext);
                        if(!isNaN(inputtext)) {
                            if(inputtext < 0 || inputtext > 255) return player.ShowPlayerDialog(DIALOG_MYCARS_MANAGE_COLOR1, samp.DIALOG_STYLE.INPUT, `{FFFFFF}Manage vehicle: {FF0000}${getVehicleNameByID(pCarInfo.model[PlayerInfo.Current_Car_Manage[player.playerid]])} {FFFFFF}- Color 1`, "Please input below the color id between 0 and 255.", "Set", "Back");
                            con.query("UPDATE personal_vehicles SET color_1 = ?", [inputtext]);
                            pCarInfo.color1[PlayerInfo.Current_Car_Manage[player.playerid]] = inputtext;
                            SCM(`SERVER: Personal vehicle color1 successfully changed to ${inputtext}`);
                            PlayerInfo.Current_Car_Manage[player.playerid] = 0;
                        }
                        else player.ShowPlayerDialog(DIALOG_MYCARS_MANAGE_COLOR1, samp.DIALOG_STYLE.INPUT, `{FFFFFF}Manage vehicle: {FF0000}${getVehicleNameByID(pCarInfo.model[PlayerInfo.Current_Car_Manage[player.playerid]])} {FFFFFF}- Color 1`, "Please input below the color id between 0 and 255.", "Set", "Back");
                    }
                }
            }
            else command.emit("mycars", player.playerid);
        }
        case DIALOG_MYCARS_MANAGE_COLOR2: {
            if(response) {
                if(player.IsPlayerInAnyVehicle()) {
                    var veh_id = player.GetPlayerVehicleID();
                    if(veh_id == pCarInfo.handle[PlayerInfo.Current_Car_Manage[player.playerid]]) {
                        parseInt(inputtext);
                        if(!isNaN(inputtext)) {
                            if(inputtext < 0 || inputtext > 255) return player.ShowPlayerDialog(DIALOG_MYCARS_MANAGE_COLOR2, samp.DIALOG_STYLE.INPUT, `{FFFFFF}Manage vehicle: {FF0000}${getVehicleNameByID(pCarInfo.model[PlayerInfo.Current_Car_Manage[player.playerid]])} {FFFFFF}- Color 2`, "Please input below the color id between 0 and 255.", "Set", "Back");
                            con.query("UPDATE personal_vehicles SET color_2 = ?", [inputtext]);
                            pCarInfo.color2[PlayerInfo.Current_Car_Manage[player.playerid]] = inputtext;
                            SCM(`SERVER: Personal vehicle color2 successfully changed to ${inputtext}`);
                            PlayerInfo.Current_Car_Manage[player.playerid] = 0;
                        }
                        else player.ShowPlayerDialog(DIALOG_MYCARS_MANAGE_COLOR2, samp.DIALOG_STYLE.INPUT, `{FFFFFF}Manage vehicle: {FF0000}${getVehicleNameByID(pCarInfo.model[PlayerInfo.Current_Car_Manage[player.playerid]])} {FFFFFF}- Color 2`, "Please input below the color id between 0 and 255.", "Set", "Back");
                    }
                }
            }
            else command.emit("mycars", player.playerid);
        }
        case DIALOG_MYCARS_MANAGE_TEXT: {
            if(response) {
                if(PlayerInfo.Current_Car_Manage[player.playerid] != 0) {
                    if(pCarInfo.texts[PlayerInfo.Current_Car_Manage[player.playerid]][listitem]) {
                        PlayerInfo.Current_Car_Text_Manage[player.playerid] = listitem;
                        var string = "Option\tDescription";
                        string += "\nText\tChange the text string";
                        string += `\nPosition\tChange the text position`;
                        player.ShowPlayerDialog(DIALOG_MYCARS_MANAGE_TEXT_EDIT, samp.DIALOG_STYLE.TABLIST_HEADERS, `{FFFFFF}Manage vehicle: {FF0000}${getVehicleNameByID(pCarInfo.model[PlayerInfo.Current_Car_Manage[player.playerid]])} {FFFFFF}- Text - {FF0000}slot#${listitem+1}`, string, "Select", "Back");
                    }
                    else {
                        SCM(player.playerid, -1, `test message: you are above to create a car text for slot ${parseInt(listitem)+1}`);
                    }
                }
                else sendError(player.playerid, errors.UNEXPECTED_ERROR);
            }
            else command.emit("mycars", player.playerid);
            break;
        }
        case DIALOG_MYCARS_MANAGE_TEXT_EDIT: {
            if(response) {
                switch(listitem) {
                    case 0: {
                        player.ShowPlayerDialog(DIALOG_MYCARS_MANAGE_TEXT_EDIT_NAME, samp.DIALOG_STYLE.INPUT, `{FFFFFF}Manage vehicle: {FF0000}${getVehicleNameByID(pCarInfo.model[PlayerInfo.Current_Car_Manage[player.playerid]])} {FFFFFF}- Text - {FF0000}slot#${listitem+1}`, "Please insert below a new string text:", "Set", "Back");
                        break;
                    }
                }
            }
            else command.emit("mycars", player.playerid);
            break;
        }
        case DIALOG_MYCARS_MANAGE_TEXT_EDIT_NAME: {
            if(response) {
                if(inputtext.length < 3 || inputtext.length > 20) return player.ShowPlayerDialog(DIALOG_MYCARS_MANAGE_TEXT_EDIT_NAME, samp.DIALOG_STYLE.INPUT, `{FFFFFF}Manage vehicle: {FF0000}${getVehicleNameByID(pCarInfo.model[PlayerInfo.Current_Car_Manage[player.playerid]])} {FFFFFF}- Text - {FF0000}slot#${listitem+1}`, "Please insert below a new string text:\nInvalid text length. Minim is 3 and maxim is 20.", "Set", "Back");
                con.query("SELECT * FROM personal_vehicles WHERE id = ?", [PlayerInfo.Current_Car_Manage[player.playerid]], function(err, result) {
                    if(result != 0) { JSON.parse()
                        eval(`var json = JSON.parse(result[0].text${PlayerInfo.Current_Car_Text_Manage[player.playerid]+1}slot)`);
                        json.text = inputtext;
                        json = JSON.stringify(json);
                        con.query(`UPDATE personal_vehicles SET text${PlayerInfo.Current_Car_Text_Manage[player.playerid]+1}slot = ? WHERE id = ?`, [json, PlayerInfo.Current_Car_Manage[player.playerid]], function(err, result) {
                            if(!err) {
                                updateThisPcarTextString(PlayerInfo.Current_Car_Manage[player.playerid], PlayerInfo.Current_Car_Text_Manage[player.playerid], inputtext);
                                SCM(player.playerid, -1, `SERVER: You have successfully updated your premium text slot {FF0000}#${PlayerInfo.Current_Car_Text_Manage[player.playerid]+1} {FFFFFF}text: {FF0000}${inputtext}{FFFFFF}.`);
                            }
                            else sendError(player.playerid, errors.UNEXPECTED_ERROR);
                        });
                    }
                    else sendError(player.playerid, errors.UNEXPECTED_ERROR);
                });
            }
            else command.emit("mycars", player.playerid);
            break;
        }
        case DIALOG_CREATE_PERSONAL_CAR: {
            if(response) {
                switch(listitem) {
                    case 0: {
                        player.ShowPlayerDialog(DIALOG_CREATE_PERSONAL_CAR_MODEL, samp.DIALOG_STYLE.INPUT, "Create Personal Car - Model", "Please inert below a vehicle model ID", "Set", "Back");
                        break;
                    }
                    case 1: {
                        player.ShowPlayerDialog(DIALOG_CREATE_PERSONAL_CAR_COLOR_1, samp.DIALOG_STYLE.INPUT, "Create Personal Car - Color 1", "Please insert below vehicle COLOR1 ID", "Set", "Back");
                        break;
                    }
                    case 2: {
                        player.ShowPlayerDialog(DIALOG_CREATE_PERSONAL_CAR_COLOR_2, samp.DIALOG_STYLE.INPUT, "Create Personal Car - Color 2", "Please insert below vehicle COLOR2 ID", "Set", "Back");
                        break;
                    }
                    case 3: {
                        player.ShowPlayerDialog(DIALOG_CREATE_PERSONAL_CAR_OWNER, samp.DIALOG_STYLE.INPUT, "Create Personal Car - Owner", "Please insert below the vehicle owner's ID (player id)", "Set", "Back");
                        break;
                    }
                    case 4: {
                        if(PlayerInfo.Current_Create_Car.Model[player.playerid] != 0 && PlayerInfo.Current_Create_Car.Owner[player.playerid] != -1) {
                            if(PlayerInfo.Logged[PlayerInfo.Current_Create_Car.Owner[player.playerid]]) {
                                con.query("INSERT INTO personal_vehicles (acc_id, veh_model, pos_x, pos_y, pos_z, pos_a, color_1, color_2) VALUES(?, ?, ?, ?, ?, ?, ?, ?)", [PlayerInfo.AccID[PlayerInfo.Current_Create_Car.Owner[player.playerid]], PlayerInfo.Current_Create_Car.Model[player.playerid], player.position.x, player.position.y, player.position.z, player.position.angle, PlayerInfo.Current_Create_Car.Color1[player.playerid], PlayerInfo.Current_Create_Car.Color2[player.playerid]], function(err, result) {
                                    if(!err) {
                                        SCM(player.playerid, 0x00CC00AA, "Ai creeat cu success masina.");
                                        var X = result.insertId;
                                        pCarInfo.owner[X] = PlayerInfo.AccID[PlayerInfo.Current_Create_Car.Owner[player.playerid]];
                                        pCarInfo.model[X] = PlayerInfo.Current_Create_Car.Model[player.playerid];
                                        pCarInfo.position.x[X] = player.position.x;
                                        pCarInfo.position.y[X] = player.position.y;
                                        pCarInfo.position.z[X] = player.position.z;
                                        pCarInfo.position.a[X] = player.position.angle;
                                        pCarInfo.color1[X] = PlayerInfo.Current_Create_Car.Color1[player.playerid];
                                        pCarInfo.color2[X] = PlayerInfo.Current_Create_Car.Color2[player.playerid];
                                        SCM(PlayerInfo.Current_Create_Car.Owner[player.playerid], -1, `SERVER: You got a new personal vehicle by administrator {FF0000}${player.GetPlayerName(24)} {FFFFFF}use {FF0000}/mycars {FFFFFF}for more.`);
                                        loadThisVehicleHandle(X);
                                        resetPersonalVehicleCreate(player.playerid);
                                    }
                                });
                            }
                            else {
                                showPersonalVehicleCreate(player.playerid);
                                sendError(player.playerid, "The vehicle owner is not logged");
                            }
                        }
                        else showPersonalVehicleCreate(player.playerid);
                        break;
                    }
                }
            }
            else resetPersonalVehicleCreate(player.playerid);
            break;
        }
        case DIALOG_CREATE_PERSONAL_CAR_MODEL: {
            if(response) {
                parseInt(inputtext);
                if(!isNaN(inputtext)) {
                    if(inputtext < 400 || inputtext > 611) return player.ShowPlayerDialog(DIALOG_CREATE_PERSONAL_CAR_MODEL, samp.DIALOG_STYLE.INPUT, "Create Personal Car - Model", "Please inert below a vehicle model ID\nYou provided an invalid vehicle ID", "Set", "Back");
                    PlayerInfo.Current_Create_Car.Model[player.playerid] = inputtext;
                    showPersonalVehicleCreate(player.playerid);
                }
                else player.ShowPlayerDialog(DIALOG_CREATE_PERSONAL_CAR_MODEL, samp.DIALOG_STYLE.INPUT, "Create Personal Car - Model", "Please inert below a vehicle model ID", "Set", "Back");
            }
            else showPersonalVehicleCreate(player.playerid);
            break;
        }
        case DIALOG_CREATE_PERSONAL_CAR_COLOR_1: {
            if(response) {
                parseInt(inputtext);
                if(!isNaN(inputtext)) {
                    if(inputtext < 0 || inputtext > 255) return player.ShowPlayerDialog(DIALOG_CREATE_PERSONAL_CAR_COLOR_1, samp.DIALOG_STYLE.INPUT, "Create Personal Car - Color 1", "Please insert below vehicle COLOR1 ID\nYou provided an invalid color. Use one from 0 to 255.", "Set", "Back");
                    PlayerInfo.Current_Create_Car.Color1[player.playerid] = inputtext;
                    showPersonalVehicleCreate(player.playerid);
                }
                else player.ShowPlayerDialog(DIALOG_CREATE_PERSONAL_CAR_COLOR_1, samp.DIALOG_STYLE.INPUT, "Create Personal Car - Color 1", "Please insert below vehicle COLOR1 ID", "Set", "Back");
            }
            else showPersonalVehicleCreate(player.playerid);
            break;
        }
        case DIALOG_CREATE_PERSONAL_CAR_COLOR_2: {
            if(response) {
                parseInt(inputtext);
                if(!isNaN(inputtext)) {
                    if(inputtext < 0 || inputtext > 255) return player.ShowPlayerDialog(DIALOG_CREATE_PERSONAL_CAR_COLOR_2, samp.DIALOG_STYLE.INPUT, "Create Personal Car - Color 2", "Please insert below vehicle COLOR2 ID\nYou provided an invalid color. Use one from 0 to 255.", "Set", "Back");
                    PlayerInfo.Current_Create_Car.Color2[player.playerid] = inputtext;
                    showPersonalVehicleCreate(player.playerid);
                }
                else player.ShowPlayerDialog(DIALOG_CREATE_PERSONAL_CAR_COLOR_2, samp.DIALOG_STYLE.INPUT, "Create Personal Car - Color 2", "Please insert below vehicle COLOR2 ID", "Set", "Back");
            }
            else showPersonalVehicleCreate(player.playerid);
            break;
        }
        case DIALOG_CREATE_PERSONAL_CAR_OWNER: {
            if(response) {
                var PLAYER = getPlayer(inputtext);
                if(PLAYER != INVALID_PLAYER_ID) {
                    PlayerInfo.Current_Create_Car.Owner[player.playerid] = PLAYER;
                    showPersonalVehicleCreate(player.playerid);
                }
                else player.ShowPlayerDialog(DIALOG_CREATE_PERSONAL_CAR_OWNER, samp.DIALOG_STYLE.INPUT, "Create Personal Car - Owner", "Please insert below the vehicle owner's ID (player id)\nYou provided an invalid player ID", "Set", "Back");
            }
            else showPersonalVehicleCreate(player.playerid);
            break;
        }
        case DIALOG_LOGIN: {
            if(response) {
                checkLoginPassword(player.playerid, inputtext);
            }
            else player.Kick(); 
            break;
        }
        case DIALOG_REGISTER: {
            if(response) {
                if(inputtext.length >= 5) {
                    PlayerInfo.Password[player.playerid] = `${md5(inputtext)}`;
                    player.ShowPlayerDialog(DIALOG_REGISTER_MAIL, samp.DIALOG_STYLE.INPUT, "Register", `Please input below your {FF0000}mail {${colors.DEFAULT}}address`, "Set", "Kick");
                }
                else player.ShowPlayerDialog(DIALOG_REGISTER, samp.DIALOG_STYLE.PASSWORD, "Register", `Welcome {FF0000}${player.GetPlayerName(24)}\n{${colors.DEFAULT}}Please insert below a password for your account\nYour password must have minimum 5 characters.`, "Set", "Kick")
            }
            else player.Kick();
            break;
        }
        case DIALOG_REGISTER_MAIL: {
            if(response) {
                if(validateEmail(inputtext)) {
                    PlayerInfo.eMail[player.playerid] = `${inputtext}`;
                    RegisterPlayer(player.playerid);
                }
                else player.ShowPlayerDialog(DIALOG_REGISTER_MAIL, samp.DIALOG_STYLE.INPUT, "Register", `Please input below your {FF0000}mail {${colors.DEFAULT}}address\nYou provided an invalid mail address.`, "Set", "Kick");
            }
            else player.Kick();
            break;
        }
    }
    return true;
});

/* SA:MP Functions */
function showSpawnSelect(playerid) {
    con.query("SELECT * FROM spawnzones", function(err, result) {
        if(result != 0) {
            var string = "";
            for(var i = 0; i < result.length; i++) {
                string += `${string != "" ? "\n" : ""}${result[i].name}`;
            }
            samp.ShowPlayerDialog(playerid, DIALOG_SELECT_SPAWN_ZONE, samp.DIALOG_STYLE.LIST, "Select Spawn Zone", string, "Select", "");
        }
        else samp.Kick(playerid);
    }); 
}

function isFloat(string) {
    if(!isNaN(value) && value.toString().indexOf('.') != -1) return true;
    else return false;
}

function generatePlayerJSONPosition(playerid) {
    var pos = samp.GetPlayerPos(playerid);
    var position = JSON.stringify({
        x: parseFloat(pos[0]).toFixed(),
        y: parseFloat(pos[1]).toFixed(),
        z: parseFloat(pos[2]).toFixed()
    });
    return position;
}

function showSpawnZoneEditForPlayer(playerid) {
    if(PlayerInfo.Current_Edit_Spawn[playerid] != 0) {
        con.query("SELECT * FROM spawnzones WHERE id = ?", [PlayerInfo.Current_Edit_Spawn[playerid]], function(err, result) {
            if(result != 0) {
                if(PlayerInfo.Current_Edit_Spawn_Var.Name[playerid] == "") PlayerInfo.Current_Edit_Spawn_Var.Name[playerid] = result[0].name;
                var string = "Option\tCurrent value";
                string += `\nName\t${PlayerInfo.Current_Edit_Spawn_Var.Name[playerid]}`;
                string += `\nPosition\t{${colors.GREEN}}current`;
                string += `\nEdit\tJust edit the Spawn`;
                samp.ShowPlayerDialog(playerid, DIALOG_EDIT_SPAWN_START, samp.DIALOG_STYLE.TABLIST_HEADERS, `{FFFFFF}Edit Spawn - {FF0000}${result[0].name}`, string, "Select", "Close");
            }
            else {
                PlayerInfo.Current_Edit_Spawn[playerid] = 0;
                sendError(playerid, errors.UNEXPECTED_ERROR);
            }
        });
    }
    else sendError(playerid, errors.UNEXPECTED_ERROR);
}

async function showPlayerPlayerInfoTD(playerid, target) {
    var pos = samp.GetPlayerPos(target);
    samp.PlayerTextDrawSetPreviewModel(playerid, TDInfo.PlayerInfo[playerid][1], samp.GetPlayerSkin(target));
    samp.PlayerTextDrawSetString(playerid, TDInfo.PlayerInfo[playerid][3], `Name: ~r~~h~${samp.GetPlayerName(target, 24)}`);
    samp.PlayerTextDrawSetString(playerid, TDInfo.PlayerInfo[playerid][4], `Location: ~r~~h~${await getLocationName(pos[0], pos[1], pos[2])}`);
    samp.PlayerTextDrawSetString(playerid, TDInfo.PlayerInfo[playerid][6], `Vehicles: ~r~~h~${getPlayerVehiclesCount(target)}`);
    samp.PlayerTextDrawSetString(playerid, TDInfo.PlayerInfo[playerid][7], `Houses: ~r~~h~${getPlayerHousesCount(target)}`);
    samp.PlayerTextDrawSetString(playerid, TDInfo.PlayerInfo[playerid][8], `Money: ~r~~h~${PlayerInfo.Money[target]}`);
    for(var i = 0; i <= 11; i++) {
        samp.PlayerTextDrawShow(playerid, TDInfo.PlayerInfo[playerid][i]);
    }
    samp.SelectTextDraw(playerid, 0xFF0000AA);
}

function hidePlayerPlayerInfoTD(playerid) {
    for(var i = 0; i <= 11; i++) {
        samp.PlayerTextDrawHide(playerid, TDInfo.PlayerInfo[playerid][i]);
    }
    samp.CancelSelectTextDraw(playerid);
}

function getPlayerHousesCount(playerid) {
    var count = 0;
    if(PlayerInfo.Logged[playerid]) {
        for(var i = 1; i < HouseInfo.MAX_HOUSES; i++) {
            if(HouseInfo.owner[i] == PlayerInfo.AccID[playerid]) {
                count++;
            }
        }
    }
    return count;
}

function getPlayerVehiclesCount(playerid) {
    var count = 0;
    if(PlayerInfo.Logged[playerid]) {
        for(var i = 1; i < pCarInfo.MAX_CARS; i++) {
            if(pCarInfo.owner[i] == PlayerInfo.AccID[playerid]) {
                count++;
            }
        }
    }
    return count;
}

function loadPlayerTD(playerid) {
    TDInfo.PlayerInfo[playerid] = [];

    // => Player Info TD (OnPlayerClickPlayer)
    TDInfo.PlayerInfo[playerid][0] = samp.CreatePlayerTextDraw(playerid, 315.000000, 147.000000, "_");
    samp.PlayerTextDrawFont(playerid, TDInfo.PlayerInfo[playerid][0], 1);
    samp.PlayerTextDrawLetterSize(playerid, TDInfo.PlayerInfo[playerid][0], 0.600000, 16.800008);
    samp.PlayerTextDrawTextSize(playerid, TDInfo.PlayerInfo[playerid][0], 302.500000, 209.500000);
    samp.PlayerTextDrawSetOutline(playerid, TDInfo.PlayerInfo[playerid][0], 1);
    samp.PlayerTextDrawSetShadow(playerid, TDInfo.PlayerInfo[playerid][0], 0);
    samp.PlayerTextDrawAlignment(playerid, TDInfo.PlayerInfo[playerid][0], 2);
    samp.PlayerTextDrawColor(playerid, TDInfo.PlayerInfo[playerid][0], -1);
    samp.PlayerTextDrawBackgroundColor(playerid, TDInfo.PlayerInfo[playerid][0], 255);
    samp.PlayerTextDrawBoxColor(playerid, TDInfo.PlayerInfo[playerid][0], 135);
    samp.PlayerTextDrawUseBox(playerid, TDInfo.PlayerInfo[playerid][0], 1);
    samp.PlayerTextDrawSetProportional(playerid, TDInfo.PlayerInfo[playerid][0], 1);
    samp.PlayerTextDrawSetSelectable(playerid, TDInfo.PlayerInfo[playerid][0], 0);

    TDInfo.PlayerInfo[playerid][1] = samp.CreatePlayerTextDraw(playerid, 209.000000, 146.000000, "TextDraw");
    samp.PlayerTextDrawFont(playerid, TDInfo.PlayerInfo[playerid][1], 5);
    samp.PlayerTextDrawLetterSize(playerid, TDInfo.PlayerInfo[playerid][1], 0.600000, 2.000000);
    samp.PlayerTextDrawTextSize(playerid, TDInfo.PlayerInfo[playerid][1], 86.000000, 153.500000);
    samp.PlayerTextDrawSetOutline(playerid, TDInfo.PlayerInfo[playerid][1], 1);
    samp.PlayerTextDrawSetShadow(playerid, TDInfo.PlayerInfo[playerid][1], 0);
    samp.PlayerTextDrawAlignment(playerid, TDInfo.PlayerInfo[playerid][1], 1);
    samp.PlayerTextDrawColor(playerid, TDInfo.PlayerInfo[playerid][1], -1);
    samp.PlayerTextDrawBackgroundColor(playerid, TDInfo.PlayerInfo[playerid][1], 1195853823);
    samp.PlayerTextDrawBoxColor(playerid, TDInfo.PlayerInfo[playerid][1], -764862926);
    samp.PlayerTextDrawUseBox(playerid, TDInfo.PlayerInfo[playerid][1], 0);
    samp.PlayerTextDrawSetProportional(playerid, TDInfo.PlayerInfo[playerid][1], 1);
    samp.PlayerTextDrawSetSelectable(playerid, TDInfo.PlayerInfo[playerid][1], 0);
    samp.PlayerTextDrawSetPreviewModel(playerid, TDInfo.PlayerInfo[playerid][1], 0);
    samp.PlayerTextDrawSetPreviewRot(playerid, TDInfo.PlayerInfo[playerid][1], -10.000000, 0.000000, -20.000000, 1.000000);
    samp.PlayerTextDrawSetPreviewVehCol(playerid, TDInfo.PlayerInfo[playerid][1], 1, 1);

    TDInfo.PlayerInfo[playerid][2] = samp.CreatePlayerTextDraw(playerid, 329.000000, 144.000000, "Player Info:");
    samp.PlayerTextDrawFont(playerid, TDInfo.PlayerInfo[playerid][2], 2);
    samp.PlayerTextDrawLetterSize(playerid, TDInfo.PlayerInfo[playerid][2], 0.183333, 2.000000);
    samp.PlayerTextDrawTextSize(playerid, TDInfo.PlayerInfo[playerid][2], 400.000000, 17.000000);
    samp.PlayerTextDrawSetOutline(playerid, TDInfo.PlayerInfo[playerid][2], 1);
    samp.PlayerTextDrawSetShadow(playerid, TDInfo.PlayerInfo[playerid][2], 0);
    samp.PlayerTextDrawAlignment(playerid, TDInfo.PlayerInfo[playerid][2], 1);
    samp.PlayerTextDrawColor(playerid, TDInfo.PlayerInfo[playerid][2], 16777215);
    samp.PlayerTextDrawBackgroundColor(playerid, TDInfo.PlayerInfo[playerid][2], 255);
    samp.PlayerTextDrawBoxColor(playerid, TDInfo.PlayerInfo[playerid][2], 50);
    samp.PlayerTextDrawUseBox(playerid, TDInfo.PlayerInfo[playerid][2], 0);
    samp.PlayerTextDrawSetProportional(playerid, TDInfo.PlayerInfo[playerid][2], 1);
    samp.PlayerTextDrawSetSelectable(playerid, TDInfo.PlayerInfo[playerid][2], 0);

    TDInfo.PlayerInfo[playerid][3] = samp.CreatePlayerTextDraw(playerid, 298.000000, 170.000000, "Name: ~r~~h~Ghosty");
    samp.PlayerTextDrawFont(playerid, TDInfo.PlayerInfo[playerid][3], 1);
    samp.PlayerTextDrawLetterSize(playerid, TDInfo.PlayerInfo[playerid][3], 0.179167, 2.049999);
    samp.PlayerTextDrawTextSize(playerid, TDInfo.PlayerInfo[playerid][3], 400.000000, 17.000000);
    samp.PlayerTextDrawSetOutline(playerid, TDInfo.PlayerInfo[playerid][3], 1);
    samp.PlayerTextDrawSetShadow(playerid, TDInfo.PlayerInfo[playerid][3], 0);
    samp.PlayerTextDrawAlignment(playerid, TDInfo.PlayerInfo[playerid][3], 1);
    samp.PlayerTextDrawColor(playerid, TDInfo.PlayerInfo[playerid][3], 1097458175);
    samp.PlayerTextDrawBackgroundColor(playerid, TDInfo.PlayerInfo[playerid][3], 255);
    samp.PlayerTextDrawBoxColor(playerid, TDInfo.PlayerInfo[playerid][3], 50);
    samp.PlayerTextDrawUseBox(playerid, TDInfo.PlayerInfo[playerid][3], 0);
    samp.PlayerTextDrawSetProportional(playerid, TDInfo.PlayerInfo[playerid][3], 1);
    samp.PlayerTextDrawSetSelectable(playerid, TDInfo.PlayerInfo[playerid][3], 0);

    TDInfo.PlayerInfo[playerid][4] = samp.CreatePlayerTextDraw(playerid, 298.000000, 189.000000, "Location: ~r~~h~Las Venturas");
    samp.PlayerTextDrawFont(playerid, TDInfo.PlayerInfo[playerid][4], 1);
    samp.PlayerTextDrawLetterSize(playerid, TDInfo.PlayerInfo[playerid][4], 0.179167, 2.049999);
    samp.PlayerTextDrawTextSize(playerid, TDInfo.PlayerInfo[playerid][4], 400.000000, 17.000000);
    samp.PlayerTextDrawSetOutline(playerid, TDInfo.PlayerInfo[playerid][4], 1);
    samp.PlayerTextDrawSetShadow(playerid, TDInfo.PlayerInfo[playerid][4], 0);
    samp.PlayerTextDrawAlignment(playerid, TDInfo.PlayerInfo[playerid][4], 1);
    samp.PlayerTextDrawColor(playerid, TDInfo.PlayerInfo[playerid][4], 1097458175);
    samp.PlayerTextDrawBackgroundColor(playerid, TDInfo.PlayerInfo[playerid][4], 255);
    samp.PlayerTextDrawBoxColor(playerid, TDInfo.PlayerInfo[playerid][4], 50);
    samp.PlayerTextDrawUseBox(playerid, TDInfo.PlayerInfo[playerid][4], 0);
    samp.PlayerTextDrawSetProportional(playerid, TDInfo.PlayerInfo[playerid][4], 1);
    samp.PlayerTextDrawSetSelectable(playerid, TDInfo.PlayerInfo[playerid][4], 0);

    TDInfo.PlayerInfo[playerid][5] = samp.CreatePlayerTextDraw(playerid, 298.000000, 207.000000, "Level: ~r~~h~0");
    samp.PlayerTextDrawFont(playerid, TDInfo.PlayerInfo[playerid][5], 1);
    samp.PlayerTextDrawLetterSize(playerid, TDInfo.PlayerInfo[playerid][5], 0.179167, 2.049999);
    samp.PlayerTextDrawTextSize(playerid, TDInfo.PlayerInfo[playerid][5], 400.000000, 17.000000);
    samp.PlayerTextDrawSetOutline(playerid, TDInfo.PlayerInfo[playerid][5], 1);
    samp.PlayerTextDrawSetShadow(playerid, TDInfo.PlayerInfo[playerid][5], 0);
    samp.PlayerTextDrawAlignment(playerid, TDInfo.PlayerInfo[playerid][5], 1);
    samp.PlayerTextDrawColor(playerid, TDInfo.PlayerInfo[playerid][5], 1097458175);
    samp.PlayerTextDrawBackgroundColor(playerid, TDInfo.PlayerInfo[playerid][5], 255);
    samp.PlayerTextDrawBoxColor(playerid, TDInfo.PlayerInfo[playerid][5], 50);
    samp.PlayerTextDrawUseBox(playerid, TDInfo.PlayerInfo[playerid][5], 0);
    samp.PlayerTextDrawSetProportional(playerid, TDInfo.PlayerInfo[playerid][5], 1);
    samp.PlayerTextDrawSetSelectable(playerid, TDInfo.PlayerInfo[playerid][5], 0);

    TDInfo.PlayerInfo[playerid][6] = samp.CreatePlayerTextDraw(playerid, 298.000000, 225.000000, "Vehicles: ~r~~h~0");
    samp.PlayerTextDrawFont(playerid, TDInfo.PlayerInfo[playerid][6], 1);
    samp.PlayerTextDrawLetterSize(playerid, TDInfo.PlayerInfo[playerid][6], 0.179167, 2.049999);
    samp.PlayerTextDrawTextSize(playerid, TDInfo.PlayerInfo[playerid][6], 400.000000, 17.000000);
    samp.PlayerTextDrawSetOutline(playerid, TDInfo.PlayerInfo[playerid][6], 1);
    samp.PlayerTextDrawSetShadow(playerid, TDInfo.PlayerInfo[playerid][6], 0);
    samp.PlayerTextDrawAlignment(playerid, TDInfo.PlayerInfo[playerid][6], 1);
    samp.PlayerTextDrawColor(playerid, TDInfo.PlayerInfo[playerid][6], 1097458175);
    samp.PlayerTextDrawBackgroundColor(playerid, TDInfo.PlayerInfo[playerid][6], 255);
    samp.PlayerTextDrawBoxColor(playerid, TDInfo.PlayerInfo[playerid][6], 50);
    samp.PlayerTextDrawUseBox(playerid, TDInfo.PlayerInfo[playerid][6], 0);
    samp.PlayerTextDrawSetProportional(playerid, TDInfo.PlayerInfo[playerid][6], 1);
    samp.PlayerTextDrawSetSelectable(playerid, TDInfo.PlayerInfo[playerid][6], 0);

    TDInfo.PlayerInfo[playerid][7] = samp.CreatePlayerTextDraw(playerid, 298.000000, 243.000000, "Houses: ~r~~h~0");
    samp.PlayerTextDrawFont(playerid, TDInfo.PlayerInfo[playerid][7], 1);
    samp.PlayerTextDrawLetterSize(playerid, TDInfo.PlayerInfo[playerid][7], 0.179167, 2.049999);
    samp.PlayerTextDrawTextSize(playerid, TDInfo.PlayerInfo[playerid][7], 400.000000, 17.000000);
    samp.PlayerTextDrawSetOutline(playerid, TDInfo.PlayerInfo[playerid][7], 1);
    samp.PlayerTextDrawSetShadow(playerid, TDInfo.PlayerInfo[playerid][7], 0);
    samp.PlayerTextDrawAlignment(playerid, TDInfo.PlayerInfo[playerid][7], 1);
    samp.PlayerTextDrawColor(playerid, TDInfo.PlayerInfo[playerid][7], 1097458175);
    samp.PlayerTextDrawBackgroundColor(playerid, TDInfo.PlayerInfo[playerid][7], 255);
    samp.PlayerTextDrawBoxColor(playerid, TDInfo.PlayerInfo[playerid][7], 50);
    samp.PlayerTextDrawUseBox(playerid, TDInfo.PlayerInfo[playerid][7], 0);
    samp.PlayerTextDrawSetProportional(playerid, TDInfo.PlayerInfo[playerid][7], 1);
    samp.PlayerTextDrawSetSelectable(playerid, TDInfo.PlayerInfo[playerid][7], 0);

    TDInfo.PlayerInfo[playerid][8] = samp.CreatePlayerTextDraw(playerid, 298.000000, 261.000000, "Money: ~r~~h~0");
    samp.PlayerTextDrawFont(playerid, TDInfo.PlayerInfo[playerid][8], 1);
    samp.PlayerTextDrawLetterSize(playerid, TDInfo.PlayerInfo[playerid][8], 0.179167, 2.049999);
    samp.PlayerTextDrawTextSize(playerid, TDInfo.PlayerInfo[playerid][8], 400.000000, 17.000000);
    samp.PlayerTextDrawSetOutline(playerid, TDInfo.PlayerInfo[playerid][8], 1);
    samp.PlayerTextDrawSetShadow(playerid, TDInfo.PlayerInfo[playerid][8], 0);
    samp.PlayerTextDrawAlignment(playerid, TDInfo.PlayerInfo[playerid][8], 1);
    samp.PlayerTextDrawColor(playerid, TDInfo.PlayerInfo[playerid][8], 1097458175);
    samp.PlayerTextDrawBackgroundColor(playerid, TDInfo.PlayerInfo[playerid][8], 255);
    samp.PlayerTextDrawBoxColor(playerid, TDInfo.PlayerInfo[playerid][8], 50);
    samp.PlayerTextDrawUseBox(playerid, TDInfo.PlayerInfo[playerid][8], 0);
    samp.PlayerTextDrawSetProportional(playerid, TDInfo.PlayerInfo[playerid][8], 1);
    samp.PlayerTextDrawSetSelectable(playerid, TDInfo.PlayerInfo[playerid][8], 0);

    TDInfo.PlayerInfo[playerid][9] = samp.CreatePlayerTextDraw(playerid, 321.000000, 157.000000, "-");
    samp.PlayerTextDrawFont(playerid, TDInfo.PlayerInfo[playerid][9], 1);
    samp.PlayerTextDrawLetterSize(playerid, TDInfo.PlayerInfo[playerid][9], 4.650001, 0.849999);
    samp.PlayerTextDrawTextSize(playerid, TDInfo.PlayerInfo[playerid][9], 400.000000, 17.000000);
    samp.PlayerTextDrawSetOutline(playerid, TDInfo.PlayerInfo[playerid][9], 1);
    samp.PlayerTextDrawSetShadow(playerid, TDInfo.PlayerInfo[playerid][9], 0);
    samp.PlayerTextDrawAlignment(playerid, TDInfo.PlayerInfo[playerid][9], 1);
    samp.PlayerTextDrawColor(playerid, TDInfo.PlayerInfo[playerid][9], 2094792959);
    samp.PlayerTextDrawBackgroundColor(playerid, TDInfo.PlayerInfo[playerid][9], 255);
    samp.PlayerTextDrawBoxColor(playerid, TDInfo.PlayerInfo[playerid][9], 50);
    samp.PlayerTextDrawUseBox(playerid, TDInfo.PlayerInfo[playerid][9], 0);
    samp.PlayerTextDrawSetProportional(playerid, TDInfo.PlayerInfo[playerid][9], 1);
    samp.PlayerTextDrawSetSelectable(playerid, TDInfo.PlayerInfo[playerid][9], 0);

    TDInfo.PlayerInfo[playerid][10] = samp.CreatePlayerTextDraw(playerid, 191.000000, 293.000000, "-");
    samp.PlayerTextDrawFont(playerid, TDInfo.PlayerInfo[playerid][10], 2);
    samp.PlayerTextDrawLetterSize(playerid, TDInfo.PlayerInfo[playerid][10], 20.099933, 1.249999);
    samp.PlayerTextDrawTextSize(playerid, TDInfo.PlayerInfo[playerid][10], 400.000000, 17.000000);
    samp.PlayerTextDrawSetOutline(playerid, TDInfo.PlayerInfo[playerid][10], 0);
    samp.PlayerTextDrawSetShadow(playerid, TDInfo.PlayerInfo[playerid][10], 0);
    samp.PlayerTextDrawAlignment(playerid, TDInfo.PlayerInfo[playerid][10], 1);
    samp.PlayerTextDrawColor(playerid, TDInfo.PlayerInfo[playerid][10], 2094792959);
    samp.PlayerTextDrawBackgroundColor(playerid, TDInfo.PlayerInfo[playerid][10], 255);
    samp.PlayerTextDrawBoxColor(playerid, TDInfo.PlayerInfo[playerid][10], 50);
    samp.PlayerTextDrawUseBox(playerid, TDInfo.PlayerInfo[playerid][10], 0);
    samp.PlayerTextDrawSetProportional(playerid, TDInfo.PlayerInfo[playerid][10], 1);
    samp.PlayerTextDrawSetSelectable(playerid, TDInfo.PlayerInfo[playerid][10], 0);

    TDInfo.PlayerInfo[playerid][11] = samp.CreatePlayerTextDraw(playerid, 408.000000, 142.000000, "LD_CHAT:thumbdn");
    samp.PlayerTextDrawFont(playerid, TDInfo.PlayerInfo[playerid][11], 4);
    samp.PlayerTextDrawLetterSize(playerid, TDInfo.PlayerInfo[playerid][11], 0.550000, 1.700000);
    samp.PlayerTextDrawTextSize(playerid, TDInfo.PlayerInfo[playerid][11], 16.000000, 18.000000);
    samp.PlayerTextDrawSetOutline(playerid, TDInfo.PlayerInfo[playerid][11], 1);
    samp.PlayerTextDrawSetShadow(playerid, TDInfo.PlayerInfo[playerid][11], 0);
    samp.PlayerTextDrawAlignment(playerid, TDInfo.PlayerInfo[playerid][11], 1);
    samp.PlayerTextDrawColor(playerid, TDInfo.PlayerInfo[playerid][11], -1);
    samp.PlayerTextDrawBackgroundColor(playerid, TDInfo.PlayerInfo[playerid][11], 255);
    samp.PlayerTextDrawBoxColor(playerid, TDInfo.PlayerInfo[playerid][11], 50);
    samp.PlayerTextDrawUseBox(playerid, TDInfo.PlayerInfo[playerid][11], 0);
    samp.PlayerTextDrawSetProportional(playerid, TDInfo.PlayerInfo[playerid][11], 1);
    samp.PlayerTextDrawSetSelectable(playerid, TDInfo.PlayerInfo[playerid][11], 1);
}

function samp_color(decimal, alpha_only=-1) {
    var rgb = {
        red: (decimal >> 16) & 0xff,
        green: (decimal >> 8) & 0xff,
        blue: decimal & 0xff
    }
    var return_value = alpha_only == -1 ? `rgba(0, 0, 0, ${alpha_only})` : `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 255)`;
    return return_value;
}

function random(min, max) {
    return parseInt((Math.random() * (max - min) + min).toFixed());
}

function generateRandomHouseInterior() {
    var interior = {};
    var value = random(0, 15);
    switch(value) {
        case 0: interior.id = 3, interior.x = 234.6087, interior.y = 1187.8195, interior.z = 1080.2578; break;
        case 1: interior.id = 2, interior.x = 225.5707, interior.y = 1240.0643, interior.z = 1082.1406; break;
        case 2: interior.id = 1, interior.x = 224.288, interior.y = 1289.1907, interior.z = 1082.1406; break;
        case 3: interior.id = 5, interior.x = 239.2819, interior.y = 1114.1991, interior.z = 1080.9922; break;
        case 4: interior.id = 15, interior.x = 295.1391, interior.y = 1473.3719, interior.z = 1080.2578; break;
        case 5: interior.id = 4, interior.x = 261.1165, interior.y = 1287.2197, interior.z = 1080.2578; break;
        case 6: interior.id = 10, interior.x = 24.3769, interior.y = 1341.1829, interior.z = 1084.375; break;
        case 7: interior.id = 4, interior.x = -262.1759, interior.y = 1456.6158, interior.z = 1084.3672; break;
        case 8: interior.id = 5, interior.x = 22.861, interior.y = 1404.9165, interior.z = 1084.4297; break;
        case 9: interior.id = 5, interior.x = 140.3679, interior.y = 1367.8837, interior.z = 1083.8621; break;
        case 10: interior.id = 6, interior.x = 234.2826, interior.y = 1065.229, interior.z = 1084.2101; break;
        case 11: interior.id = 6, interior.x = -68.5145, interior.y = 1353.8485, interior.z = 1080.2109; break;
        case 12: interior.id = 15, interior.x = -285.2511, interior.y = 1471.197, interior.z = 1084.375; break;
        case 13: interior.id = 8, interior.x = -42.5267, interior.y = 1408.23, interior.z = 1084.4297; break;
        case 14: interior.id = 9, interior.x = 84.9244, interior.y = 1324.2983, interior.z = 1083.8594; break;
        case 15: interior.id = 9, interior.x = 260.7421, interior.y = 1238.2261, interior.z = 1084.2578; break;
    }
    return interior;
}

function enterPlayerInHouse(playerid, house) {
    PlayerInfo.Enter_House_With_Password[playerid] = 0;
    PlayerInfo.InHouse[playerid] = house;
    samp.SetPlayerVirtualWorld(playerid, house + 999);
    samp.SetPlayerInterior(playerid, HouseInfo.interior_id[PlayerInfo.InHouse[playerid]]);
    samp.SetPlayerPos(playerid, HouseInfo.interior.x[PlayerInfo.InHouse[playerid]], HouseInfo.interior.y[PlayerInfo.InHouse[playerid]], HouseInfo.interior.z[PlayerInfo.InHouse[playerid]]);
}

function isPlayerAtAnyHouseCoord(playerid) {
    var value = -1;
    for(var i = 1; i <= HouseInfo.MAX_HOUSES; i++) {
        if(HouseInfo.exists[i]) {
            if(samp.IsPlayerInRangeOfPoint(playerid, 1, HouseInfo.exterior.x[i], HouseInfo.exterior.y[i], HouseInfo.exterior.z[i])) {
                value = i;
                break;
            }
        }
    }
    return value;
}

samp.registerEvent("locationResponse", "ss");
samp.on("locationResponse", (RequestID, LocationName) => {
    ServerInfo.Location.Return[`${RequestID}`] = LocationName;
});
function getLocationName(x, y, z) {
    var RequestID = `${x},${y},${z}`;
    samp.callPublic("getLocationData", "sfff", RequestID, x, y, z);
    return new Promise((resolve, reject) => {
        var temp_interval = setInterval(() => {
            if(ServerInfo.Location.Return[RequestID]) {
                resolve(ServerInfo.Location.Return[RequestID]);
                clearInterval(temp_interval);
                delete ServerInfo.Location.Return[RequestID];
            }
        }, 1);
    });
}

function savePlayer(playerid) {
    if(PlayerInfo.Logged[playerid]) {
        var string = "";
        string += "UPDATE users SET hours = ?, mins = ?, secs = ?, admin = ?, helper = ?, faction = ?, faction_rank = ?, dj = ?, bonusgot = ?, money = ?";
        string += ", vip = ?, drive_license = ?, buletin_have = ?, cnp = ?, bankaccounthave = ?, registertutorial = ?, muted = ?, ip = ?, lastposition = ? WHERE id = ?";
        con.query(string, [
            PlayerInfo.Online.Hours[playerid], PlayerInfo.Online.Minutes[playerid], PlayerInfo.Online.Seconds[playerid], PlayerInfo.Admin[playerid],
            PlayerInfo.Helper[playerid], PlayerInfo.Faction.ID[playerid], PlayerInfo.Faction.Rank[playerid], PlayerInfo.DJ[playerid], PlayerInfo.Bonus[playerid],
            PlayerInfo.Money[playerid], PlayerInfo.VIP[playerid], PlayerInfo.License.Drive[playerid], PlayerInfo.Buletin[playerid], PlayerInfo.CNP[playerid],
            PlayerInfo.BankAccount[playerid], PlayerInfo.RegisterTutorial[playerid], PlayerInfo.Muted[playerid], PlayerInfo.IP[playerid], generatePlayerJSONPosition(playerid),
            PlayerInfo.AccID[playerid]
        ]);
    }
}

function getNameByAccId(id) {
    return new Promise((resolve, reject) => {
        con.query("SELECT * FROM users WHERE id = ?", [id], function(err, result) {
            if(result) resolve(result[0].name);
            else resolve("none");
        });
    });
}

function setPlayerCheckpoint(playerid, x, y, z, name) {
    if(!PlayerInfo.CheckPointActive[playerid]) {
        if(!PlayerInfo.InHouse[playerid]) {
            samp.callNative("SetPlayerCheckpoint", "iffff", playerid, x, y, z, 5);
            SCM(playerid, -1, `SERVER: Ti-a fost pus un checkpoint catre: ${name}.`);
            PlayerInfo.CheckPointActive[playerid] = true;
        }
        else sendError(playerid, "You can't set a checkpoint when you are in a house.");
    }
    else {
        samp.ShowPlayerDialog(playerid, DIALOG_KILL_CP, samp.DIALOG_STYLE.MSGBOX, "Checkpoint", "You already have an active checkpoint. Do you want to kill it ?", "Yes", "No");
    }
}

function getVehicleNameByID(vehicleid) {
    return vNames[vehicleid-400];
}

async function checkIfPlayerIsOwnerOfSpecificVehicle(playerid, vehicleid) {
    for(var i = 1; i < pCarInfo.MAX_CARS; i++) {
        if(pCarInfo.handle[i] == vehicleid) {
            if(pCarInfo.owner[i] != PlayerInfo.AccID[playerid]) {
                var pos = samp.GetPlayerPos(playerid);
                samp.SetPlayerPos(playerid, pos[0], pos[1], pos[2]+3);
                samp.GameTextForPlayer(playerid, `~w~~h~You are not my owner~n~~r~~h~${await getNameByAccId(pCarInfo.owner[i])}`, 6000, 3);
            }
            break;
        }
    }
}

function showGPSCreate(playerid) {
    var string = "Option\tCurrent value";
    string += `\nName\t${PlayerInfo.Current_Create_GPS.Name[playerid] == "" ? "{FF0000}not seted" : `{00CC00}${PlayerInfo.Current_Create_GPS.Name[playerid]}`}`;
    string += `\nCategory\t${PlayerInfo.Current_Create_GPS.Category[playerid] == "" ? "{FF0000}not seted" : `{00CC00}${PlayerInfo.Current_Create_GPS.Category[playerid]}`}`;
    string += `\nPosition\t{00CC00}current`;
    string += `\nCreate\tJust create the GPS`;
    samp.ShowPlayerDialog(playerid, DIALOG_CREATE_GPS, samp.DIALOG_STYLE.TABLIST_HEADERS, "Create GPS", string, "Select", "Close");
}

function resetGPSCreate(playerid) {
    PlayerInfo.Current_Create_GPS.Name[playerid] = "";
    PlayerInfo.Current_Create_GPS.Category[playerid] = "";
}

function resetGPSDelete(playerid) {
    PlayerInfo.Current_Delete_GPS.Category[playerid] = "";
    PlayerInfo.Current_Delete_GPS.Name[playerid] = "";
}

function showPersonalVehicleCreate(playerid) {
    var string = "Option\tCurrent value";
    string += `\nModel\t${PlayerInfo.Current_Create_Car.Model[playerid]}`;
    string += `\nColor1\t${PlayerInfo.Current_Create_Car.Color1[playerid]}`;
    string += `\nColor2\t${PlayerInfo.Current_Create_Car.Color2[playerid]}`;
    string += `\nOwner\t${PlayerInfo.Current_Create_Car.Owner[playerid] == -1 ? "{FF0000}None" : `{00CC00}${samp.GetPlayerName(PlayerInfo.Current_Create_Car.Owner[playerid], 24)}`}`;
    string += `\nCreate\tJust create the vehicle`;
    samp.ShowPlayerDialog(playerid, DIALOG_CREATE_PERSONAL_CAR, samp.DIALOG_STYLE.TABLIST_HEADERS, "Create Personal Car", string, "Select", "Close");
}

function resetPersonalVehicleCreate(playerid) {
    PlayerInfo.Current_Create_Car.Model[playerid] = 0;
    PlayerInfo.Current_Create_Car.Color1[playerid] = 0;
    PlayerInfo.Current_Create_Car.Color2[playerid] = 0;
    PlayerInfo.Current_Create_Car.Owner[playerid] = -1;
}

function loadPlayerVariables(playerid) {
    if(PlayerInfo.Logged[playerid]) {
        con.query("SELECT * FROM users WHERE name = ?", [samp.GetPlayerName(playerid, 24)], function(err, result) {
            PlayerInfo.AccID[playerid] = result[0].id;
            PlayerInfo.eMail[playerid] = result[0].email;
            PlayerInfo.RegisterDate[playerid] = result[0].registerdate;
            PlayerInfo.LastOn[playerid] = getDate();
            PlayerInfo.Gender[playerid] = result[0].gender;
            PlayerInfo.Online.Hours[playerid] = result[0].hours;
            PlayerInfo.Online.Minutes[playerid] = result[0].mins;
            PlayerInfo.Online.Seconds[playerid] = result[0].secs;
            PlayerInfo.Admin[playerid] = result[0].admin;
            PlayerInfo.Helper[playerid] = result[0].helper;
            PlayerInfo.Faction.ID[playerid] = result[0].faction;
            PlayerInfo.Faction.Rank[playerid] = result[0].faction_rank;
            PlayerInfo.DJ[playerid] = result[0].dj;
            PlayerInfo.Bonus[playerid] = result[0].bonusgot;
            PlayerInfo.Money[playerid] = result[0].money;
            PlayerInfo.VIP[playerid] = result[0].vip;
            PlayerInfo.License.Drive[playerid] = result[0].drive_license;
            PlayerInfo.Buletin[playerid] = result[0].buletin_have;
            PlayerInfo.CNP[playerid] = result[0].cnp;
            PlayerInfo.BankAccount[playerid] = result[0].bankaccounthave;
            PlayerInfo.RegisterTutorial[playerid] = result[0].registertutorial;
            PlayerInfo.Muted[playerid] = result[0].muted;
            PlayerInfo.IP[playerid] = samp.GetPlayerIp(playerid, 30);
            PlayerInfo.DiscordAttached[playerid] = result[0].discord_attached;
        });
    }
}

function RegisterPlayer(playerid) {
    con.query("SELECT * FROM users WHERE name = ?", [samp.GetPlayerName(playerid, 24)], function(err, result) {
        if(result == 0) {
            if(PlayerInfo.Password[playerid] != 0 && PlayerInfo.eMail[playerid] != "") {
                con.query("INSERT INTO users (name, password, email, registerdate, laston) VALUES(?, ?, ?, ?, ?)", [samp.GetPlayerName(playerid, 24), PlayerInfo.Password[playerid], PlayerInfo.eMail[playerid], getDate(), getDate()], function(err, result) {
                    if(!err) {
                        PlayerInfo.Logged[playerid] = true;
                        loadPlayerVariables(playerid);
                        samp.ShowPlayerDialog(playerid, DIALOG_EMPTY, samp.DIALOG_STYLE.MSGBOX, "Register", `You have been successfully registred.\nNow your player data will be automatically save after disconnecting.`, "Ok", "");
                        SCM(playerid, 0x00CC00AA, "[e-Force]: {FFFFFF}Ai fost inregistrat cu success. Tasteaza comanda {FF0000}/bonus {FFFFFF}pentru a-ti lua bonus-ul de bun venit.");
                        showSpawnSelect(playerid);
                    }
                    else preparatePlayerForLogin()
                });
            }
            else preparatePlayerForLogin();
        }
        else preparatePlayerForLogin();
    });
}

function preparatePlayerForLogin(player) {
    samp.GameTextForPlayer(player.playerid, "~W~~H~Please wait...~N~~R~~H~Checking account!", 6000, 4);
    setTimeout(() => {
        if(samp.IsPlayerConnected(player.playerid)) {
            con.query("SELECT * FROM users WHERE name = ?", [player.GetPlayerName(24)], function(err, result) {
                if(result != 0) {
                    player.ShowPlayerDialog(DIALOG_LOGIN, samp.DIALOG_STYLE.PASSWORD, "Login", `Welcome back {FF0000}${player.GetPlayerName(24)}\n{${colors.DEFAULT}}Please input below your account password to continue:`, "Login", "Kick");
                }
                else {
                    player.ShowPlayerDialog(DIALOG_REGISTER, samp.DIALOG_STYLE.PASSWORD, "Register", `Welcome {FF0000}${player.GetPlayerName(24)}\n{${colors.DEFAULT}}Please insert below a password for your account`, "Set", "Kick")
                }
            });
        }
    }, 3000);
}

function checkLoginPassword(playerid, password) {
    con.query("SELECT * FROM users WHERE name = ? AND password = ?", [samp.GetPlayerName(playerid, 24), md5(password)], function(err, result) {
        if(result != 0) {
            PlayerInfo.Logged[playerid] = true;
            loadPlayerVariables(playerid);
            PlayerInfo.FailLogins[playerid] = 0;
            SCM(playerid, 0x00CC00AA, "[e-Force]: {FFFFFF}Ai fost logat cu succes.");
            showSpawnSelect(playerid);
        }
        else {
            PlayerInfo.FailLogins[playerid]++;
            if(PlayerInfo.FailLogins[playerid] == 3) {
                kickEx(playerid, "3/3 failed login attempts");
            }
            else {
                samp.ShowPlayerDialog(playerid, DIALOG_LOGIN, samp.DIALOG_STYLE.PASSWORD, "Login", `Welcome back {FF0000}${samp.GetPlayerName(playerid, 24)}\n{${colors.DEFAULT}}Please input below your account password to continue:`, "Login", "Kick");
            }
        }
    });
}

function kickEx(playerid, reason, admin=-1) {
    samp.getPlayers().forEach((player) => {
        if(player.playerid == playerid) {
            SCM(player.playerid, colors2.ORANGE, `AdmBot: You have been kicked. ${admin != -1 ? `Admin: ${samp.GetPlayerName(admin, 24)}` : ""} | Reason: ${reason}.`); 
        }
        else {
            SCM(player.playerid, colors2.ORANGE, `AdmBot: ${samp.GetPlayerName(playerid, 24)} has been kicked. ${admin != -1 ? `Admin: ${samp.GetPlayerName(admin, 24)}` : ""} | Reason: ${reason}.`);
        }
    });
    setTimeout(() => {
        if(samp.IsPlayerConnected(playerid)) {
            samp.Kick(playerid);
        }
    }, 500);
}

function SCM(playerid, color, string) {
    samp.callNative('SendClientMessage', 'iis', playerid, color, string);
}

function SCMALL(color, string) {
    samp.callNative('SendClientMessageToAll', 'is', color, string);
}

function sendError(playerid, string) {
    samp.callNative('SendClientMessage', 'iis', playerid, 0xFF9100AA, `ERROR: ${string}`);
}

function sendSyntax(playerid, string) {
    samp.callNative('SendClientMessage', 'iis', playerid, 0xFFFFFFFF, `Syntax: ${string}`);
}

function getPlayer(string) {
    var value = INVALID_PLAYER_ID;
    if(!isNaN(string)) {
        for(var i = 0; i <= samp.GetMaxPlayers(); i++) {
            if(samp.IsPlayerConnected(i)) {
                if(string == i) {
                    value = i;
                }
            }
        }
    }
    else {
        string = `${string}`.toLowerCase();
        for(var i = 0; i <= samp.GetMaxPlayers(); i++) {
            if(samp.IsPlayerConnected(i)) {
                var string2 = `${samp.GetPlayerName(i, 24)}`.toLowerCase();
                if(string2.includes(string)) {
                    value = i;
                }
            }
        }
    }
    return value;
}

function getVipRank(vip) {
    var string = "None";
    switch(vip) {
        case 1: "Silver"; break; 
        case 2: "Gold"; break;
    }
    return string;
}

function loadFromDB() {
    loadPersonalCars();
    LoadHouses();
    LoadServerConfig();
}
global.loadFromDB = loadFromDB;

function loadThisVehicleHandle(X) {
    pCarInfo.handle[X] = samp.CreateVehicle(pCarInfo.model[X], pCarInfo.position.x[X], pCarInfo.position.y[X], pCarInfo.position.z[X], pCarInfo.position.a[X], pCarInfo.color1[X], pCarInfo.color2[X], -1);
}

async function loadThisHouseHandle(X) {
    var text = `{00AAFF}House info:{${colors.DEFAULT}}\nOwner: {FF0000}${HouseInfo.owner[X] == 0 ? "For Sale" : await getNameByAccId(HouseInfo.owner[X])}{${colors.DEFAULT}}\nPrice: {FF0000}${HouseInfo.price[X]}{${colors.DEFAULT}}\nWin: {FF0000}${HouseInfo.winperpayday[X]}$/payday`;
    if(HouseInfo.Label3D[X] == undefined) {
        HouseInfo.Label3D[X] = streamer.CreateDynamic3DTextLabel(text, -1, HouseInfo.exterior.x[X], HouseInfo.exterior.y[X], HouseInfo.exterior.z[X], 20);
    }
    else {
        streamer.UpdateDynamic3DTextLabelText(HouseInfo.Label3D[X], -1, text);
    }
    
    if(HouseInfo.Pickup[X] == undefined) {
        HouseInfo.Pickup[X] = streamer.CreateDynamicPickup(HouseInfo.owner[X] == 0 ? 1273 : 19522, 1, HouseInfo.exterior.x[X], HouseInfo.exterior.y[X], HouseInfo.exterior.z[X]);
    }
}

function loadPersonalCars() {
    con.query("SELECT * FROM personal_vehicles", function(err, result) {
        if(result != 0) {
            for(var i = 0; i < result.length; i++) {
                var X = result[i].id;
                pCarInfo.owner[X] = result[i].acc_id;
                pCarInfo.model[X] = result[i].veh_model;
                pCarInfo.position.x[X] = result[i].pos_x;
                pCarInfo.position.y[X] = result[i].pos_y;
                pCarInfo.position.z[X] = result[i].pos_z;
                pCarInfo.position.a[X] = result[i].pos_a;
                pCarInfo.color1[X] = result[i].color_1;
                pCarInfo.color2[X] = result[i].color_2;
                pCarInfo.premium[X] = result[i].premium;

                pCarInfo.texts[X] = [];

                if(result[i].text1_slot != "0") {
                    var slot = JSON.parse(result[i].text1_slot);
                    pCarInfo.texts[X][0] = {
                        object: samp.CreateObject(19327, 0, 0, 0, 0, 0, 0, 300.0),
                        text: slot.text,
                        coord: {
                            OffSetX: slot.OffSetX,
                            OffSetY: slot.OffSetY,
                            OffSetZ: slot.OffSetZ,
                            RotX: slot.RotX,
                            RotY: slot.RotY,
                            RotZ: slot.RotZ
                        }
                    }
                    samp.SetObjectMaterialText(pCarInfo.texts[X][0].object, pCarInfo.texts[X][0].text, 0, samp.OBJECT_MATERIAL_SIZE._256x128, "Arial", 25, -1, -1, 0, 1);
                }

                loadThisVehicleHandle(X);
            }
        }
        console.log(`Loaded ${result.length} personal vehicles`);
    });
}

function LoadHouses() {
    con.query("SELECT * FROM houses", function(err, result) {
        if(result != 0) {
            for(var i = 0; i < result.length; i++) {
                var X = result[i].id;
                HouseInfo.exists[X] = true;
                HouseInfo.owner[X] = result[i].acc_id;
                HouseInfo.password[X] = result[i].password;
                HouseInfo.price[X] = result[i].price;
                HouseInfo.winperpayday[X] = result[i].winperpayday;
                HouseInfo.interior_id[X] = result[i].interior_id;
                HouseInfo.exterior.x[X] = result[i].exterior_x;
                HouseInfo.exterior.y[X] = result[i].exterior_y;
                HouseInfo.exterior.z[X] = result[i].exterior_z;
                HouseInfo.interior.x[X] = result[i].interior_x;
                HouseInfo.interior.y[X] = result[i].interior_y;
                HouseInfo.interior.z[X] = result[i].interior_z;
                HouseInfo.custom[X] = result[i].custom; 
                loadThisHouseHandle(X);
            }
        }
        console.log(`Loaded ${result.length} houses`);
    });
}

function LoadServerConfig() {
    con.query("SELECT * FROM serverconfig", function(err, result) {
        if(result != 0 && !err) {
            samp.SendRconCommand(`hostname ${result[0].hostname}`);
            samp.SendRconCommand(`gamemodetext ${result[0].modename}`);
            samp.SendRconCommand(`password ${result[0].password}`);
            console.log("Loaded server config");
        }
    });
}

function getFaction(id) {
    return new Promise((resolve, reject) => {
        con.query("SELECT * FROM factions WHERE id = ?", [id], function(err, result) {
            if(result != 0) {
                resolve(result[0].name);
            }
            else resolve("Civil");
        });
    });
}

function resetPlayerVariables(playerid) {
    PlayerInfo.AccID[playerid] = 0;
    PlayerInfo.Password[playerid] = "";
    PlayerInfo.eMail[playerid] = "";
    PlayerInfo.RegisterDate[playerid] = "";
    PlayerInfo.LastOn[playerid] = "";
    PlayerInfo.Gender[playerid] = 0;
    PlayerInfo.Online.Hours[playerid] = 0;
    PlayerInfo.Online.Minutes[playerid] = 0;
    PlayerInfo.Online.Seconds[playerid] = 0;
    PlayerInfo.Admin[playerid] = 0;
    PlayerInfo.Helper[playerid] = 0;
    PlayerInfo.Faction.ID[playerid] = 0;
    PlayerInfo.Faction.Rank[playerid] = 0;
    PlayerInfo.DJ[playerid] = 0;
    PlayerInfo.Bonus[playerid] = 0;
    PlayerInfo.Money[playerid] = 0;
    PlayerInfo.VIP[playerid] = 0;
    PlayerInfo.License[playerid] = 0;
    PlayerInfo.Buletin[playerid] = 0;
    PlayerInfo.CNP[playerid] = 0;
    PlayerInfo.BankAccount[playerid] = 0;
    PlayerInfo.RegisterDate[playerid] = 0;
    PlayerInfo.Muted[playerid] = 0;
    PlayerInfo.IP[playerid] = "";
    PlayerInfo.FailLogins[playerid] = 0;
    PlayerInfo.Spawned[playerid] = false;
    PlayerInfo.Logged[playerid] = false;
    resetPersonalVehicleCreate(playerid);
    PlayerInfo.Current_Car_Manage[playerid] = 0;
    PlayerInfo.CheckPointActive[playerid] = false;
    PlayerInfo.Current_GPS_Category[playerid] = "";
    resetGPSCreate(playerid);
    resetGPSDelete(playerid);
    PlayerInfo.Current_Edit_GPS[playerid] = 0;
    PlayerInfo.Current_GPS_Info.Category[playerid] = "";
    PlayerInfo.DiscordAttached[playerid] = "0";
    PlayerInfo.DiscordAttach_Confirm[playerid] = 0;
    PlayerInfo.InHouse[playerid] = 0;
    PlayerInfo.Current_House_Manage[playerid] = 0;
    PlayerInfo.Enter_House_With_Password[playerid] = 0;
    PlayerInfo.AdminCar[playerid] = -1;
    PlayerInfo.Current_Create_Spawn.Name[playerid] = "";
    PlayerInfo.Current_Delete_Spawn[playerid] = 0;
    PlayerInfo.Current_Edit_Spawn[playerid] = 0;
    PlayerInfo.Current_Edit_Spawn_Var.Name[playerid] = "";
    PlayerInfo.SpawnLocationAfterSpawn[playerid] = 0;
    PlayerInfo.Current_Car_Text_Manage[playerid] = -1;
}

function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function getDate(time=true) {
    var date_ = new Date();
    var date = date_.toLocaleDateString('ro-RO', { timeZone: 'Europe/Bucharest' });
    var time_ = date_.toLocaleTimeString('ro-RO', { timeZone: 'Europe/Bucharest' });
    var string = `${date}${time ? ' ' + time_ : ''}`;
    return string;
}

function replaceAll(string, search, replace) {
    return string.split(search).join(replace);
}

/* SA:MP Commands*/
CMD.on("killcp", (playerid) => {
    if(PlayerInfo.CheckPointActive[playerid]) {
        samp.DisablePlayerCheckpoint(playerid);
        PlayerInfo.CheckPointActive[playerid] = false;
        SCM(playerid, -1, "SERVER: Checkpoint successfully disabled.");
    }
    else sendError(playerid, "You don't have an active checkpoint.");
});

CMD.on("admins", (playerid, params) => {
    var count = 0, string = "Name\tAdmin Level";
    for(var i = 0; i <= samp.GetMaxPlayers(); i++) {
        if(samp.IsPlayerConnected(i)) {
            if(PlayerInfo.Admin[i] >= 1) {
                count++;
                string += `\n${samp.GetPlayerName(i, 24)}\t${PlayerInfo.Admin[i]}`;
            }
        }
    }
    if(count != 0) samp.ShowPlayerDialog(playerid, DIALOG_EMPTY, samp.DIALOG_STYLE.TABLIST_HEADERS, `{FFFFFF}Admins ({FF0000}${count} {FFFFFF}online)`, string, "Ok", "");
    else sendError(playerid, "No online admins."); 
});

CMD.on("helpers", (playerid) => {
    var count = 0, string = "Name\tHelper level";
    for(var i = 0; i <= samp.GetMaxPlayers(); i++) {
        if(samp.IsPlayerConnected(i)) {
            if(PlayerInfo.Helper[i] >= 1) {
                count++;
                string += `\n${samp.GetPlayerName(i, 24)}\t${PlayerInfo.Helper[i]}`;
            }
        }
    }
    if(count != 0) samp.ShowPlayerDialog(playerid, DIALOG_EMPTY, samp.DIALOG_STYLE.TABLIST_HEADERS, `{FFFFFF}Helpers ({FF0000}${count} {FFFFFF}online)`, string, "Ok", "");
    else sendError(playerid, "No online helpers.");
});

CMD.on("stats", async (playerid, params) => {
    var player = playerid;
    if(params[0]) player = getPlayer(params[0]);
    if(player != INVALID_PLAYER_ID) {
        SCM(playerid, -1, `${samp.GetPlayerName(player, 24)}(${player})'s stats:`);
        SCM(playerid, -1, `Admin: {FF0000}${PlayerInfo.Admin[player]}{FFFFFF}, VIP: {FF0000}${getVipRank(PlayerInfo.VIP[player])}{FFFFFF}, Faction: {FF0000}${await getFaction(PlayerInfo.Faction.ID[player])}`);
        SCM(playerid, -1, `Online time: {FF0000}${PlayerInfo.Online.Hours[player]}{FFFFFF} hours, {FF0000}${PlayerInfo.Online.Minutes[player]}{FFFFFF} minutes and {FF0000}${PlayerInfo.Online.Seconds[player]} {FFFFFF}seconds`);
    }
    else sendError(playerid, errors.PLAYER_NOT_CONNECTED);
});

CMD.on("gps", (playerid) => {
    con.query("SELECT * FROM gps", function(err, result) {
        if(result != 0) {
            var gps_category = [];
            for(var i = 0; i < result.length; i++) {
                if(!gps_category.some(s => s == result[i].category)) {
                    gps_category.push(result[i].category);
                }
            }
            var string = "";
            gps_category.forEach((value) => {
                string += `${string != "" ? "\n" : ""}${value}`;
            });
            samp.ShowPlayerDialog(playerid, DIALOG_GPS, samp.DIALOG_STYLE.LIST, "GPS", string, "Select", "Close");
        }
        else sendError(playerid, "No available GPS.");
    });
});

/* Admin Commands */

/* Admin 1 */
CMD.on("gotop", (playerid, params) => {
    if(PlayerInfo.Admin[playerid] >= 1 || PlayerInfo.Helper[playerid] >= 3) {
        var pos = params.slice(0).join(" ");
        if(pos) {
            var position = replaceAll(pos, ",", " ");
            position = position.split(/[ ]+/);
            if(position[0] && position[1] && position[2]) {
                samp.SetPlayerPos(playerid, position[0], position[1], position[2]);
                SCM(playerid, -1, `SERVER: You have teleported to the following position: ${position[0]}, ${position[1]}, ${position[2]}`);
            }
            else sendError(playerid, "Cannot find a valid x,y,z coord.");
        }
        else sendSyntax(playerid, "/gotop [x,y,z]");
    }
    else sendError(playerid, errors.HELPER_OR_ADMIN_LEVEL_MISSING);
});

CMD.on("kick", (playerid, params) => {
    if(PlayerInfo.Admin[playerid] >= 1 || PlayerInfo.Helper[player.id] >= 3) {
        if(params[0] && params.slice(1).join(" ")) {
            var player = getPlayer(params[0]);
            if(player != INVALID_PLAYER_ID) {
                kickEx(player, params.slice(1).join(" "), playerid);
            }
            else sendError(playerid, errors.PLAYER_NOT_CONNECTED);
        }
        else sendSyntax(playerid, "/kick [ID/Name] [Reason]");
    }
    else sendError(playerid, errors.HELPER_OR_ADMIN_LEVEL_MISSING);
});

CMD.on("fixveh", (playerid) => {
    if(PlayerInfo.Admin[playerid] >= 1) {
        if(samp.IsPlayerInAnyVehicle(playerid)) {
            samp.RepairVehicle(samp.GetPlayerVehicleID(playerid));
            SCM(playerid, -1, "SERVER: You have successfully fixed your vehicle.");
        }
        else sendError(playerid, "You are not in any vehicle.");
    }
    else sendError(playerid, errors.ADMIN_LEVEL_MISSING);
});

CMD.on("spawncar", (playerid, params) => {
    if(PlayerInfo.Admin[playerid] >= 1) {
        if(!isNaN(params[0])) {
            parseInt(params[0]);
            if(PlayerInfo.AdminCar[playerid] != -1) {
                if(samp.IsValidVehicle(PlayerInfo.AdminCar[playerid])) {
                    samp.DestroyVehicle(PlayerInfo.AdminCar[playerid]);
                }
                PlayerInfo.AdminCar[playerid] = -1;
            }
            var pos = samp.GetPlayerPos(playerid);
            var angle = samp.GetPlayerFacingAngle(playerid);
            PlayerInfo.AdminCar[playerid] = samp.CreateVehicle(params[0], pos[0], pos[1], pos[2], angle, 0, 0, -1);
            samp.PutPlayerInVehicle(playerid, PlayerInfo.AdminCar[playerid], 0);
        }
        else sendSyntax(playerid, "/spawncar [Model]");
    }
    else sendError(playerid, errors.ADMIN_LEVEL_MISSING);
});

CMD.on("set", (playerid, params) => {
    if(PlayerInfo.Admin[playerid] >= 1) {
        if(params[0] && params[1] && !isNaN(params[2])) {
            var player = getPlayer(params[1]);
            if(player != INVALID_PLAYER_ID) {
                parseInt(params[2]);
                if(params[0] == "health") {
                    SCM(player, 0xFF5656AA, `Administrator ${samp.GetPlayerName(playerid, 24)} has seted your health to: ${params[2]}.`);
                    SCM(playerid, 0xFF5656AA, `You have successfully seted ${samp.GetPlayerName(player, 24)}'s health to: ${params[2]}.`);
                    samp.SetPlayerHealth(player, params[2]);
                }
                else if(params[0] == "armour") {
                    SCM(player, 0xFF5656AA, `Administrator ${samp.GetPlayerName(playerid, 24)} has seted your armour to: ${params[2]}.`);
                    SCM(playerid, 0xFF5656AA, `You have successfully seted ${samp.GetPlayerName(player, 24)}'s armour to: ${params[2]}.`);
                    samp.SetPlayerArmour(player, params[2]);
                }
                else if(params[0] == "vw") {
                    SCM(player, 0xFF5656AA, `Administrator ${samp.GetPlayerName(playerid, 24)} has seted your virtual world to: ${params[2]}.`);
                    SCM(playerid, 0xFF5656AA, `You have successfully seted ${samp.GetPlayerName(player, 24)}'s virtual world to: ${params[2]}.`);
                    samp.SetPlayerVirtualWorld(player, params[2]);
                }
                else if(params[0] == "skin") {
                    SCM(player, 0xFF5656AA, `Administrator ${samp.GetPlayerName(playerid, 24)} has seted your skin to: ${params[2]}.`);
                    SCM(playerid, 0xFF5656AA, `You have successfully seted ${samp.GetPlayerName(player, 24)}'s skin to: ${params[2]}.`);
                    samp.SetPlayerSkin(player, params[2]);
                }
                else if(params[0] == "money") {
                    SCM(player, 0xFF5656AA, `Administrator ${samp.GetPlayerName(playerid, 24)} has seted your money to: ${params[2]}.`);
                    SCM(playerid, 0xFF5656AA, `You have successfully seted ${samp.GetPlayerName(player, 24)}'s money to: ${params[2]}.`);
                    PlayerInfo.Money[player] = params[2];
                }
                else if(params[0] == "admin") {
                    if(PlayerInfo.Admin[playerid] >= 6) {
                        if(params[2] < 0 || params[2] > 5) return sendError(playerid, "Invalid admin level provided. Use an another from 0 to 5.");
                        if(PlayerInfo.Admin[player] >= 6) return sendError(playerid, "You can't set this player admin level.");
                        SCM(player, 0xFF5656AA, `Administrator ${samp.GetPlayerName(playerid, 24)} has seted your admin level to: ${params[2]}.`);
                        SCM(playerid, 0xFF5656AA, `You have successfully seted ${samp.GetPlayerName(player, 24)}'s admin level to: ${params[2]}.`);
                        PlayerInfo.Admin[player] = params[2];
                    }
                    else sendError(playerid, errors.ADMIN_LEVEL_MISSING);
                }
                else if(params[0] == "helper") {
                    if(PlayerInfo.Admin[playerid] >= 5) {
                        if(params[2] < 0 || params[2] > 3) return sendError(playerid, "Invalid helper level provided. Use an another from 0 to 3.");
                        SCM(player, 0xFF5656AA, `Administrator ${samp.GetPlayerName(playerid, 24)} has seted your helper level to: ${params[2]}.`);
                        SCM(playerid, 0xFF5656AA, `You have successfully seted ${samp.GetPlayerName(player, 24)}'s helper level to: ${params[2]}.`);
                        PlayerInfo.Helper[player] = params[2];
                    }
                }
                else sendError(playerid, "Invalid item.");
            }
            else sendError(playerid, errors.PLAYER_NOT_CONNECTED);
        }
        else sendSyntax(playerid, "/set [Health, Armour, VW, Skin, Admin, Helper] [ID/Name] [Value]");
    }
    else sendError(playerid, errors.ADMIN_LEVEL_MISSING);
});

/* Admin 2 */
// null...


/* Admin 3 */
CMD.on("gotohouse", (playerid, params) => {
    if(PlayerInfo.Admin[playerid] >= 3) {
        if(!isNaN(params[0])) {
            parseInt(params[0]);
            if(HouseInfo.exists[params[0]]) {
                samp.SetPlayerPos(playerid, HouseInfo.exterior.x[params[0]], HouseInfo.exterior.y[params[0]], HouseInfo.exterior.z[params[0]]);
                SCM(playerid, -1, `SERVER: You have successfully teleported to house: {FF0000}${params[0]}{FFFFFF}.`);
            }
            else sendError(playerid, "This house ID not exists.");
        }   
        else sendSyntax(playerid, "/gotohouse [ID]");
    }
    else sendError(playerid, errors.ADMIN_LEVEL_MISSING);
});

/* Admin 4 */
CMD.on("range", (playerid, params) => {
    if(PlayerInfo.Admin[playerid] >= 4) {
        if(params[0] && !isNaN(params[1])) {
            parseInt(params[1]);
            if(params[0] == "health") { range_here("health"); }
            else if(params[0] == "armour") { range_here("armour"); }
            else sendError(playerid, "Invalid item.");

            function range_here(item) {
                var pos = samp.GetPlayerPos(playerid);
                var players = [];
                for(var i = 0; i <= samp.GetMaxPlayers(); i++) {
                    if(samp.IsPlayerConnected(i)) {
                        if(samp.IsPlayerInRangeOfPoint(i, params[1], pos[0], pos[1], pos[2])) {
                            if(item == "health") samp.SetPlayerHealth(i, 100);
                            if(item == "armour") samp.SetPlayerArmour(i, 100);

                            players.push({
                                id: i
                            });
                        }
                    }
                }
                players.forEach((p) => {
                    SCM(p.id, -1, `Administrator {FF0000}${samp.GetPlayerName(playerid, 24)} {FFFFFF}has restored {FF0000}${item} {FFFFFF}for {FF0000}${players.length} {FFFFFF}players.`);
                });
            }
        }
        else sendSyntax(playerid, "/range [Health/Armour] [Meters From You]");
    }
    else sendError(playerid, errors.ADMIN_LEVEL_MISSING);
});

CMD.on("getcar", (playerid, params) => {
    if(PlayerInfo.Admin[playerid] >= 4) {
        if(!isNaN(params[0])) {
            parseInt(params[0]);
            if(samp.IsValidVehicle(params[0])) {
                var pos = samp.GetPlayerPos(playerid);
                samp.SetVehiclePos(params[0], pos[0], pos[1], pos[2]);
                SCM(playerid, -1, `SERVER: Vehicle ID: {FF0000}${params[0]} {FFFFFF}was successfully teleported to your location.`);
            }
            else sendError(playerid, "This vehicle not exists.");
        }
        else sendSyntax(playerid, "/getcar [ID]");
    }
    else sendError(playerid, errors.ADMIN_LEVEL_MISSING);
});

CMD.on("gotocar", (playerid, params) => {
    if(PlayerInfo.Admin[playerid] >= 4) {
        if(!isNaN(params[0])) {
            parseInt(params[0]);
            if(samp.IsValidVehicle(params[0])) {
                var pos = samp.GetVehiclePos(params[0]);
                samp.SetPlayerPos(playerid, pos.x, pos.y, pos.z);
                SCM(playerid, -1, `SERVER: You have succcessfully teleported to vehicle ID: {FF0000}${params[0]}{FFFFFF}.`);
            }
            else sendError(playerid, "This vehicle not exists.");
        }
        else sendSyntax(playerid, "/gotocar [ID]");
    }
    else sendError(playerid, errors.ADMIN_LEVEL_MISSING);
});

/* Admin 5 */
// null...

/* Admin 6 */
CMD.on("saveall", (playerid) => {
    SCMALL(0xFF5656AA, `Administrator ${samp.GetPlayerName(playerid, 24)} has saved all accounts.`);
    samp.getPlayers().forEach((player) => {
        savePlayer(player.playerid);
    });
});

CMD.on("debugplayers", (playerid) => {
    samp.getPlayers().forEach(player => {
        SCM(playerid, -1, `Name: ${player.GetPlayerName(24)} (${player.playerid}) | Position: ${JSON.stringify(player.position)}`);
    });
});

CMD.on("creategps", (playerid) => {
    if(PlayerInfo.Admin[playerid] >= 6) {
        showGPSCreate(playerid);
    }
    else sendError(playerid, errors.ADMIN_LEVEL_MISSING);
});

CMD.on("deletegps", (playerid) => {
    if(PlayerInfo.Admin[playerid] >= 6) {
        con.query("SELECT * FROM gps", function(err, result) {
            if(result != 0) {
                var gps_category = [];
                for(var i = 0; i < result.length; i++) {
                    if(!gps_category.some(s => s == result[i].category)) {
                        gps_category.push(result[i].category);
                    }
                }
                var string = "";
                gps_category.forEach((value) => {
                    string += `${string != "" ? "\n" : ""}${value}`;
                });
                samp.ShowPlayerDialog(playerid, DIALOG_DELETE_GPS_SELECT_CATEGORY, samp.DIALOG_STYLE.LIST, "Delete GPS - Select Category", string, "Select", "Close");
            }
            else sendError(playerid, "No available GPS.");
        });
    }
    else sendError(playerid, errors.ADMIN_LEVEL_MISSING);
});

CMD.on("editgps", (playerid, params) => {
    if(PlayerInfo.Admin[playerid] >= 6) {
        if(!isNaN(params[0])) {
            parseInt(params[0]);
            con.query("SELECT * FROM gps WHERE id = ?", [params[0]], function(err, result) {
                if(result != 0) {
                    PlayerInfo.Current_Edit_GPS[playerid] = params[0];
                    var pos = JSON.parse(result[0].position);
                    var string = "Option\tCurrent value";
                    string += `\nName\t{00CC00}${result[0].name}`;
                    string += `\nCategory\t{00CC00}${result[0].category}`;
                    string += `\nPosition\t{00CC00}${pos.x}, ${pos.y}, ${pos.z}`;
                    samp.ShowPlayerDialog(playerid, DIALOG_EDIT_GPS, samp.DIALOG_STYLE.TABLIST_HEADERS, `{FFFFFF}Edit GPS - {FF0000}${result[0].name}`, string, "Select", "Close");
                }
                else sendError(playerid, "Invalid ID.");
            });
        }
        else sendSyntax(playerid, "/editgps [ID] | Use /gpsinfo for ID info.");
    }
    else sendError(playerid, errors.ADMIN_LEVEL_MISSING);
});

CMD.on("gpsinfo", (playerid) => {
    if(PlayerInfo.Admin[playerid] >= 6) {
        con.query("SELECT * FROM gps", function(err, result) {
            if(result != 0) {
                var gps_category = [];
                for(var i = 0; i < result.length; i++) {
                    if(!gps_category.some(s => s == result[i].category)) {
                        gps_category.push(result[i].category);
                    }
                }
                var string = "";
                gps_category.forEach((value) => {
                    string += `${string != "" ? "\n" : ""}${value}`;
                });
                samp.ShowPlayerDialog(playerid, DIALOG_GPS_INFO_SELECT_CATEGORY, samp.DIALOG_STYLE.LIST, "GPS - Info", string, "Select", "Close");
            }
            else sendError(playerid, "No available GPS.");
        });
    }
    else sendError(playerid, errors.ADMIN_LEVEL_MISSING);
});

CMD.on("createpcar", (playerid) => {
    if(PlayerInfo.Admin[playerid] >= 6) {
        showPersonalVehicleCreate(playerid);
    }
    else sendError(playerid, errors.ADMIN_LEVEL_MISSING);
});

CMD.on("reloadpcars", (playerid) => {
    if(PlayerInfo.Admin[playerid] >= 6) {
        for(var i = 1; i < pCarInfo.MAX_CARS; i++) {
            if(pCarInfo.handle[i]) {
                samp.DestroyVehicle(pCarInfo.handle[i]);
            }
        }
        SCM(playerid, -1, "SERVER: Reloading personal vehicles...");
        setTimeout(() => {
            loadPersonalCars();
            SCM(playerid, -1, "SERVER: Personal vehicles successfully reloaded.");
        }, 5000);
    }
    else sendError(playerid, errors.ADMIN_LEVEL_MISSING);
});

CMD.on("deletepcar", (playerid) => {
    if(PlayerInfo.Admin[playerid] >= 6) {
        if(samp.IsPlayerInAnyVehicle(playerid)) {
            var veh_id = samp.GetPlayerVehicleID(playerid), success = false;
            for(var i = 1; i < pCarInfo.MAX_CARS; i++) {
                if(pCarInfo.handle[i] == veh_id) {
                    con.query("DELETE FROM personal_vehicles WHERE id = ?", [i]);
                    samp.DestroyVehicle(veh_id);
                    delete pCarInfo.handle[i];
                    delete pCarInfo.owner[i];
                    delete pCarInfo.model[i];
                    delete pCarInfo.position.x[i];
                    delete pCarInfo.position.y[i];
                    delete pCarInfo.position.z[i];
                    delete pCarInfo.position.a[i];
                    delete pCarInfo.color1[i];
                    delete pCarInfo.color2[i];
                    success = true;
                    break;
                }
            }
            if(success == true) {
                SCM(playerid, -1, "SERVER: Personal vehicle have been deleted.");
            }
            else sendError(playerid, "You are not in a personal vehicle.");
        }
        else sendError(playerid, "You are not in any vehicle.");
    }
    else sendError(playerid, errors.ADMIN_LEVEL_MISSING);
});

CMD.on("createhouse", (playerid, params) => {
    if(PlayerInfo.Admin[playerid] >= 6) {
        if(!isNaN(params[0]) && !isNaN(params[1])) {
            parseInt(params[0]); parseInt(params[1]);
            var interior = generateRandomHouseInterior();
            var pos = samp.GetPlayerPos(playerid);
            con.query("INSERT INTO houses (price, winperpayday, interior_id, exterior_x, exterior_y, exterior_z, interior_x, interior_y, interior_z) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)", [params[0], params[1], interior.id, pos[0], pos[1], pos[2], interior.x, interior.y, interior.z], function(err, result) {
                if(!err) {
                    var X = result.insertId;
                    HouseInfo.exists[X] = true;
                    HouseInfo.owner[X] = 0;
                    HouseInfo.password[X] = "";
                    HouseInfo.price[X] = params[1];
                    HouseInfo.winperpayday[X] = params[1];
                    HouseInfo.interior_id[X] = interior.id;
                    HouseInfo.exterior.x[X] = pos[0];
                    HouseInfo.exterior.y[X] = pos[1];
                    HouseInfo.exterior.z[X] = pos[2];
                    HouseInfo.interior.x[X] = interior.x;
                    HouseInfo.interior.y[X] = interior.y;
                    HouseInfo.interior.z[X] = interior.z;
                    HouseInfo.custom[X] = 0;
                    loadThisHouseHandle(X);
                }
                else {
                    sendError(playerid, "An error has ocurred while inserting into database.");
                    console.log(err);
                }
            });
        }
        else sendSyntax(playerid, "/createhouse [Price] [Win]");
    }
    else sendError(playerid, errors.ADMIN_LEVEL_MISSING);
});

CMD.on("deletehouse", (playerid) => {
    if(PlayerInfo.Admin[playerid] >= 6) {
        var house = isPlayerAtAnyHouseCoord(playerid);
        if(house != -1) {
            samp.getPlayers().forEach(async(player) => {
                if(PlayerInfo.InHouse[player.playerid] == house) {
                    SCM(player.playerid, colors2.ORANGE, `Administrator ${samp.GetPlayerName(playerid, 24)} has deleted this house.`);
                    player.SetPlayerVirtualWorld(0);
                    player.SetPlayerInterior(0);
                    player.SetPlayerPos(HouseInfo.exterior.x[house], HouseInfo.exterior.y[house], HouseInfo.exterior.z[house]);
                    PlayerInfo.InHouse[player.playerid] = 0;
                }
                if(PlayerInfo.AccID[player.playerid] == HouseInfo.owner[house] && PlayerInfo.Logged[player.playerid]) {
                    SCM(player.playerid, colors2.ORANGE, `Administrator ${samp.GetPlayerName(playerid, 24)} has deleted your house. Location: ${await getLocationName(HouseInfo.exterior.x[house], HouseInfo.exterior.y[house], HouseInfo.exterior.z[house])}`)
                }
            });
            con.query("DELETE FROM houses WHERE id = ?", [house]);
            SCM(playerid, -1, `SERVER: You have successfully deleted house {FF0000}${house}{FFFFFF}.`);
            delete HouseInfo.exists[house];
            delete HouseInfo.owner[house];
            delete HouseInfo.password[house];
            delete HouseInfo.price[house];
            delete HouseInfo.winperpayday[house];
            delete HouseInfo.interior_id[house];
            delete HouseInfo.exterior.x[house];
            delete HouseInfo.exterior.y[house];
            delete HouseInfo.exterior.z[house];
            delete HouseInfo.interior.x[house];
            delete HouseInfo.interior.y[house];
            delete HouseInfo.interior.z[house];
            delete HouseInfo.custom[house];
            streamer.DestroyDynamic3DTextLabel(HouseInfo.Label3D[house]);
            delete HouseInfo.Label3D[house];
            streamer.DestroyDynamicPickup(HouseInfo.Pickup[house]);
            delete HouseInfo.Pickup[house];
        }
        else sendError(playerid, "You are not in a house pickup.");   
    }
    else sendError(playerid, errors.ADMIN_LEVEL_MISSING);
});

CMD.on("createspawn", (playerid) => {
    if(PlayerInfo.Admin[playerid] >= 6) {
        var string = "Option\tCurrent value";
        string += `\nName\t${PlayerInfo.Current_Create_Spawn.Name[playerid] == "" ? `{${colors.RED}}not seted` : `{${colors.GREEN}}${PlayerInfo.Current_Create_Spawn.Name[playerid]}`}`;
        string += `\nPosition\t{${colors.GREEN}}current`;
        string += `\nCreate\tJust create the Spawn`;
        samp.ShowPlayerDialog(playerid, DIALOG_CREATE_SPAWN, samp.DIALOG_STYLE.TABLIST_HEADERS, "Create Spawn", string, "Select", "Close");
    }
    else sendError(playerid, errors.ADMIN_LEVEL_MISSING);
});

CMD.on("deletespawn", (playerid) => {
    if(PlayerInfo.Admin[playerid] >= 6) {
        con.query("SELECT * FROM spawnzones", async function(err, result) {
            if(result != 0) {
                var string = "ID\tName\tLocation";
                for(var i = 0; i < result.length; i++) {
                    var pos = JSON.parse(result[i].position);
                    string += `\n${result[i].id}\t${result[i].name}\t${await getLocationName(pos.x, pos.y, pos.z)}`;
                }
                samp.ShowPlayerDialog(playerid, DIALOG_DELETE_SPAWN, samp.DIALOG_STYLE.TABLIST_HEADERS, "Delete Spawn", string, "Select", "Close");
            }
            else sendError(playerid, "No available spawn zones.");
        });
    }
    else sendError(playerid, errors.ADMIN_LEVEL_MISSING);
});

CMD.on("editspawn", (playerid) => {
    if(PlayerInfo.Admin[playerid] >= 6) {
        con.query("SELECT * FROM spawnzones", async function(err, result) {
            if(result != 0) {
                var string = "ID\tName\tLocation";
                for(var i = 0; i < result.length; i++) {
                    var pos = JSON.parse(result[i].position);
                    string += `\n${result[i].id}\t${result[i].name}\t${await getLocationName(pos.x, pos.y, pos.z)}`;
                }
                samp.ShowPlayerDialog(playerid, DIALOG_EDIT_SPAWN, samp.DIALOG_STYLE.TABLIST_HEADERS, "{FFFFFF}Edit Spawn", string, "Select", "Close");
            }
            else sendError(playerid, "No available spawn zones.");
        });
    }   
    else sendError(playerid, errors.ADMIN_LEVEL_MISSING);
});

CMD.on("spawnzones", (playerid) => {
    con.query("SELECT * FROM spawnzones", async function(err, result) {
        if(result != 0 && !err) {
            var string = "ID\tName\tLocation Name";
            for(var i = 0; i < result.length; i++) {
                var pos = JSON.parse(result[i].position);
                string += `\n${result[i].id}\t${result[i].name}\t${await getLocationName(pos.x, pos.y, pos.z)}`;
            }
            samp.ShowPlayerDialog(playerid, DIALOG_SHOW_SPAWN_ZONES, samp.DIALOG_STYLE.TABLIST_HEADERS, "Spawn Zones", string, "Teleport", "Close");
        }
        else sendError(playerid, errors.UNEXPECTED_ERROR);
    });
});

CMD.on("config", (playerid) => {
    if(PlayerInfo.Admin[playerid] >= 6) { 
        con.query("SELECT * FROM serverconfig", function(err, result) {
            if(result != 0 && !err) {
                var string = "Option\tCurrent value";
                string += `\nHostname\t${result[0].hostname}`;
                string += `\nModename\t${result[0].modename}`;
                string += `\nPassword\t${result[0].password}`;
                samp.ShowPlayerDialog(playerid, DIALOG_CONFIG, samp.DIALOG_STYLE.TABLIST_HEADERS, "{FFFFFF}Server Config", string, "Select", "Cancel");
            }
            else sendError(playerid, errors.UNEXPECTED_ERROR);
        });
    }
    else sendError(playerid, errors.ADMIN_LEVEL_MISSING);
});

/* Personal Vehicle Commands */
CMD.on("mycars", async (playerid) => {
    var count = 0, string = "#\tModel\tLocation\tPremium";
    for(var i = 1; i < pCarInfo.MAX_CARS; i++) {
        if(pCarInfo.owner[i] == PlayerInfo.AccID[playerid]) {
            count++;
            var pos = samp.GetVehiclePos(pCarInfo.handle[i]);
            string += `\n${i}\t${getVehicleNameByID(pCarInfo.model[i])}\t${await getLocationName(pos.x, pos.y, pos.z)}\t${pCarInfo.premium[i] == 1 ? "{00CC00}Yes" : "{FF0000}No"}`;
        }
    }
    if(count != 0) {
        samp.ShowPlayerDialog(playerid, DIALOG_MYCARS, samp.DIALOG_STYLE.TABLIST_HEADERS, `{FFFFFF}Your vehicles - {00CC00}${count}`, string, "Manage", "Close");
    }
    else sendError(playerid, "You don't have any personal vehicles.");
});

/* House Commands */
CMD.on("buyhouse", (playerid) => {
    var house = isPlayerAtAnyHouseCoord(playerid);
    if(house != -1) {
        if(HouseInfo.owner[house] == 0) {
            con.query("UPDATE houses SET acc_id = ? WHERE id = ?", [PlayerInfo.AccID[playerid], house], function(err, result) {
                if(!err) {
                    SCM(playerid, -1, "SERVER: You have successfully bought this house.");
                    HouseInfo.owner[house] = PlayerInfo.AccID[playerid];
                    loadThisHouseHandle(house);
                }
                else sendError(playerid, errors.UNEXPECTED_ERROR);
            });
        }
        else sendError(playerid, "This house is not for sale.");
    }
    else sendError(playerid, "You are not in a house pickup.");
});

CMD.on("myhouses", async (playerid) => {
    var count = 0, string = "#\tLocation\tStatus";
    for(var i = 1; i < HouseInfo.MAX_HOUSES; i++) {
        if(HouseInfo.owner[i] == PlayerInfo.AccID[playerid]) {
            count++;
            var status = "";
            if(PlayerInfo.InHouse[playerid] == i) status = `{${colors.YELLOW}}in house`;
            else if(HouseInfo.password[i] != "") status = `{${colors.RED}}passworded`;
            else if(HouseInfo.password[i] == "") status = `{${colors.GREEN}}open`;
            string += `\n${i}\t${await getLocationName(HouseInfo.exterior.x[i], HouseInfo.exterior.y[i], HouseInfo.exterior.z[i])}\t${status}`;
        }
    }
    if(count != 0) {
        samp.ShowPlayerDialog(playerid, DIALOG_MYHOUSES, samp.DIALOG_STYLE.TABLIST_HEADERS, `{FFFFFF}Hour houses - {00CC00}${count}`, string, "Manage", "Close");
    }
    else sendError(playerid, "You don't have any houses.");
});

/*
    *****************************
            END OF LINES                
    *****************************
*/