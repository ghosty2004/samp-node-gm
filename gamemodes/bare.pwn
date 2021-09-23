#include <a_samp>
#include <samp-node>
#include <map-zones>
#include <streamer>

main() {}

forward getLocationData(RequestID[], Float:x, Float:y, Float:z);
public getLocationData(RequestID[], Float:x, Float:y, Float:z) {
    new place[24];
    new MapZone:zone = GetMapZoneAtPoint(x, y, z);
    if(zone == INVALID_MAP_ZONE_ID) format(place, sizeof(place), "Unknown");
    else { GetMapZoneName(zone, place); }
    SAMPNode_CallEvent("locationResponse", RequestID, place);
    return true;
}

// => Pickups
forward _CreateDynamicPickup(modelid, type, Float:x, Float:y, Float:z, worldid, interiorid, playerid, streamdistance, areaid, priority);
public _CreateDynamicPickup(modelid, type, Float:x, Float:y, Float:z, worldid, interiorid, playerid, streamdistance, areaid, priority) { return CreateDynamicPickup(modelid, type, x, y, z, worldid, interiorid, playerid, streamdistance, areaid, priority); }

forward _DestroyDynamicPickup(STREAMER_TAG_PICKUP:pickupid);
public _DestroyDynamicPickup(STREAMER_TAG_PICKUP:pickupid) { return DestroyDynamicPickup(STREAMER_TAG_PICKUP:pickupid); }

forward _IsValidDynamicPickup(STREAMER_TAG_PICKUP:pickupid);
public _IsValidDynamicPickup(STREAMER_TAG_PICKUP:pickupid) { return IsValidDynamicPickup(STREAMER_TAG_PICKUP:pickupid); }

// => 3D Text Labels
forward _CreateDynamic3DTextLabel(text[], color, Float:x, Float:y, Float:z, Float:drawdistance);
public _CreateDynamic3DTextLabel(text[], color, Float:x, Float:y, Float:z, Float:drawdistance) { 
    return CreateDynamic3DTextLabel(text, color, Float:x, Float:y, Float:z, Float:drawdistance); 
}

forward _DestroyDynamic3DTextLabel(STREAMER_TAG_3D_TEXT_LABEL:id);
public _DestroyDynamic3DTextLabel(STREAMER_TAG_3D_TEXT_LABEL:id) { return DestroyDynamic3DTextLabel(STREAMER_TAG_3D_TEXT_LABEL:id); }

forward _IsValidDynamic3DTextLabel(STREAMER_TAG_3D_TEXT_LABEL:id);
public _IsValidDynamic3DTextLabel(STREAMER_TAG_3D_TEXT_LABEL:id) { return IsValidDynamic3DTextLabel(STREAMER_TAG_3D_TEXT_LABEL:id); }

forward _UpdateDynamic3DTextLabelText(STREAMER_TAG_3D_TEXT_LABEL:id, color, text[]);
public _UpdateDynamic3DTextLabelText(STREAMER_TAG_3D_TEXT_LABEL:id, color, text[]) { return UpdateDynamic3DTextLabelText(STREAMER_TAG_3D_TEXT_LABEL:id, color, text); }

// => Updates
forward _samp_Streamer_Update(playerid);
public _samp_Streamer_Update(playerid) { return Streamer_Update(playerid); }