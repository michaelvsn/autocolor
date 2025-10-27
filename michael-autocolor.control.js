loadAPI(20);

host.defineController("michael.vision", "autocolor :) 0.3-beta", "0.3-beta", "cd1a2c22-b201-4dbf-a2c2-76fad81e38ed", "michael.vision");

// maximum number of tracks the full rescan function can see. increase this if you have more tracks in your projects.
const MAX_TRACKS = 999;

let projectTrackBank;
let parentTracks = [];
let isPaused = false;

function init() {
    const preferences = host.getPreferences();
    preferences.getSignalSetting("keeps track colors matched with their group", "about", "");
    preferences.getSignalSetting("github: @michaelvsn", "about", "");

    const ioPanel = host.getDocumentState();
    const pauseButton = ioPanel.getSignalSetting("pause for 15s to prevent Undo conflicts", "autocolor :)", "pause");

    pauseButton.addSignalObserver(function() {
        isPaused = true;
        host.showPopupNotification("autocolor :) paused for 15 seconds");
        host.scheduleTask(function() {
            isPaused = false;
            host.showPopupNotification("autocolor :) is back on!");
            recolorAllTracks();
        }, 15000);
    });

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

    const cursorTrack = host.createCursorTrack("michael_CursorTrack", "Selected Track", 0, 0, true);
    cursorTrack.position().markInterested();
    cursorTrack.position().addValueObserver(function() {
        host.scheduleTask(recolorAllTracks, 0);
    });

    host.scheduleTask(recolorAllTracks, 0);
}

function recolorAllTracks() {
    if (isPaused) {
        return;
    }

    const totalTracks = projectTrackBank.itemCount().get();
    for (let i = 0; i < totalTracks; i++) {
        colorTrackIfInGroup(projectTrackBank.getItemAt(i), parentTracks[i]);
    }
}

function colorTrackIfInGroup(track, parent) {
    if (!parent.exists().get()) return;
    const parentName = parent.name().get();

    if (parentName !== "Project" && !track.isGroup().get()) {
        const currentColor = track.color().get();
        if (currentColor.getAlpha() !== 0) {
            track.color().set(0, 0, 0, 0);
        }
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
