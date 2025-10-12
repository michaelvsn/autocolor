loadAPI(20);

host.defineController("michael.vision", "autocolor :)", "0.1.1-beta", "cd1a2c22-b201-4dbf-a2c2-76fad81e38ed", "michael.vision");

// number of tracks to recheck on click. higher values are more reliable but may slightly impacts performance.
const POOL_SIZE = 50;
// maximum number of tracks the full rescan function can see. increase this if you have more tracks in your projects.
const MAX_TRACKS = 999;

let cursorTrack;
let recentTracksPool = [];
let projectTrackBank;
let parentTracks = [];

function init() {
    const preferences = host.getPreferences();
    
    preferences.getSignalSetting("keeps track colors matched with their group", "about", "");
	preferences.getSignalSetting("github: @michaelvsn", "about", "");


    cursorTrack = host.createCursorTrack("michael_CursorTrack", "Selected Track", 0, 0, true);

    for (let i = 0; i < POOL_SIZE; i++) {
        const trackSlot = host.createCursorTrack("PoolSlot_" + i, "Pool Slot " + i, 0, 0, false);
        const parentSlot = trackSlot.createParentTrack(0, 0);

        markTrackInterested(trackSlot);
        markParentInterested(parentSlot);

        trackSlot.color().addValueObserver(function() {
            host.scheduleTask(recolorAllTracks, 0);
        });

        recentTracksPool.push({
            track: trackSlot,
            parent: parentSlot
        });
    }

    projectTrackBank = host.getProject().getRootTrackGroup().createTrackBank(MAX_TRACKS, 0, 0, true);
    for (let i = 0; i < MAX_TRACKS; i++) {
        const track = projectTrackBank.getItemAt(i);
        parentTracks[i] = track.createParentTrack(0, 0);
        markTrackInterested(track);
        markParentInterested(parentTracks[i]);
    }
    projectTrackBank.itemCount().markInterested();

    cursorTrack.position().markInterested();
    cursorTrack.position().addValueObserver(onNewTrackSelected);

    host.scheduleTask(recolorAllTracks, 0);
}

function onNewTrackSelected() {
    for (let i = 0; i < POOL_SIZE - 1; i++) {
        const sourceTrack = recentTracksPool[i + 1].track;
        if (sourceTrack.name().get()) {
            recentTracksPool[i].track.selectChannel(sourceTrack);
        }
    }
    recentTracksPool[POOL_SIZE - 1].track.selectChannel(cursorTrack);

    host.scheduleTask(checkAndRecolorPool, 0);
}

function checkAndRecolorPool() {
    for (let i = 0; i < POOL_SIZE; i++) {
        const slot = recentTracksPool[i];
        if (slot.track.name().get()) {
            colorTrackIfInGroup(slot.track, slot.parent);
        }
    }
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