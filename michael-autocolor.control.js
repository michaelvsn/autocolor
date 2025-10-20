loadAPI(20);

host.defineController("michael.vision", "autocolor :) 0.2-beta", "0.2-beta", "cd1a2c22-b201-4dbf-a2c2-76fad81e38ed", "michael.vision");

// maximum number of tracks the full rescan function can see. increase this if you have more tracks in your projects.
const MAX_TRACKS = 999;

let cursorTrack;
let projectTrackBank;
let parentTracks = [];

function init() {
    const preferences = host.getPreferences();

    preferences.getSignalSetting("keeps track colors matched with their group", "about", "");
	preferences.getSignalSetting("github: @michaelvsn", "about", "");

    projectTrackBank = host.getProject().getRootTrackGroup().createTrackBank(MAX_TRACKS, 0, 0, true);
    for (let i = 0; i < MAX_TRACKS; i++) {
        const track = projectTrackBank.getItemAt(i);
        parentTracks[i] = track.createParentTrack(0, 0);
        markTrackInterested(track);
        markParentInterested(parentTracks[i]);

        track.color().addValueObserver(function() {
            host.scheduleTask(recolorAllTracks, 0);
        });
    }
    projectTrackBank.itemCount().markInterested();

    cursorTrack = host.createCursorTrack("michael_CursorTrack", "Selected Track", 0, 0, true);
    cursorTrack.position().markInterested();
    cursorTrack.position().addValueObserver(function() {
        host.scheduleTask(recolorAllTracks, 0);
    });

    host.scheduleTask(recolorAllTracks, 0);
}

function recolorAllTracks() {
    const totalTracks = projectTrackBank.itemCount().get();
    for (let i = 0; i < totalTracks; i++) {
        colorTrackIfInGroup(projectTrackBank.getItemAt(i), parentTracks[i]);
    }
}

function colorTrackIfInGroup(track, parent) {
    if (!parent.exists().get()) return;
    const parentName = parent.name().get();
    if (parentName !== "Project" && !track.isGroup().get()) {
        const parentColor = parent.color().get();
        track.color().set(parentColor.getRed(), parentColor.getGreen(), parentColor.getBlue());
    }
}

function markTrackInterested(track) {
    track.name().markInterested();
    track.isGroup().markInterested();
    track.color().markInterested();
}

function markParentInterested(parent) {
    parent.name().markInterested();
    parent.color().markInterested();
    parent.exists().markInterested();
}

function exit() {}
