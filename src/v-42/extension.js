const { Gio, GLib, Shell } = imports.gi;
const Main = imports.ui.main;
const ByteArray = imports.byteArray;

let busExport = null;
let nameId = 0;

// D-Bus interface XML
const ifaceXml = `
<node>
  <interface name="org.phnk.TabFix">
    <method name="List">
      <arg type="a(isss)" name="windows" direction="out"/>
    </method>
    <method name="Activate">
      <arg type="i" name="index" direction="in"/>
      <arg type="s" name="result" direction="out"/>
    </method>
  </interface>
</node>`;

// Helper: Convert GIcon to string (themed icon name or base64 PNG)
function giconToString(gicon) {
    if (!gicon) return "";

    try {
        // Themed icon
        if (gicon.get_names) {
            return gicon.get_names().join(",");
        }

        // File icon
        if (gicon instanceof Gio.FileIcon) {
            let path = gicon.get_file().get_path();
            // Return the path directly, not base64
            return path;
        }
    } catch (e) {
        log(`[TabFix] giconToString error: ${e}`);
    }

    return "";
}

// JS object implementing D-Bus methods
const TabFixIface = Gio.DBusExportedObject.wrapJSObject(ifaceXml, {
    List() {
        log("[TabFix] List called");
        let result = [];
        let actors = global.get_window_actors();
        
        // Use Shell.WindowTracker directly instead of Main.windowTracker
        let tracker = Shell.WindowTracker.get_default();

        if (!tracker) {
            log("[TabFix] ERROR: Shell.WindowTracker.get_default() is undefined!");
            return result;
        }

        for (let i = 0; i < actors.length; i++) {
            try {
                let win = actors[i].meta_window;
                let title = "";
                try { title = win.get_title ? win.get_title() || "" : ""; }
                catch (e) { log(`[TabFix] get_title error for window ${i}: ${e}`); }

                let wmClass = "";
                try { wmClass = win.get_wm_class ? win.get_wm_class() || "" : ""; }
                catch (e) { log(`[TabFix] get_wm_class error for window ${i}: ${e}`); }

                let app = null;
                try { app = tracker.get_window_app(win); }
                catch (e) { log(`[TabFix] get_window_app error for window ${i}: ${e}`); app = null; }

                let iconStr = "";
                if (app) {
                    try {
                        let gicon = app.get_icon ? app.get_icon() : null;
                        iconStr = giconToString(gicon);
                    } catch (e) { log(`[TabFix] app icon error for window ${i}: ${e}`); }
                }

                // fallback to window icon
                if (!iconStr) {
                    try {
                        let gicon = win.get_icon ? win.get_icon() : null;
                        iconStr = giconToString(gicon);
                    } catch (e) { log(`[TabFix] window icon error for window ${i}: ${e}`); }
                }

                result.push([i, title, wmClass, iconStr]);
            } catch (e) {
                log(`[TabFix] unexpected error processing window ${i}: ${e}`);
            }
        }

        return result;
    },

    Activate(index) {
        log(`[TabFix] Activate called with index ${index}`);
        let actors = global.get_window_actors();
        if (index >= 0 && index < actors.length) {
            let win = actors[index].meta_window;
            if (win) {
                try {
                    win.activate(global.get_current_time());
                    return "OK";
                } catch (e) { log(`[TabFix] activate error for window ${index}: ${e}`); }
            }
        }
        return "NO";
    }
});

function init() { log("[TabFix] init"); }

function enable() {
    log("[TabFix] enable");
    try {
        busExport = TabFixIface;
        busExport.export(Gio.DBus.session, "/org/phnk/TabFix");

        nameId = Gio.DBus.session.own_name(
            "org.phnk.TabFix",
            Gio.BusNameOwnerFlags.NONE,
            (connection, name) => { log("[TabFix] Bus name acquired: " + name); },
            (connection, name) => { log("[TabFix] Bus name lost: " + name); }
        );
    } catch (e) { log("[TabFix] enable exception: " + e); }
}

function disable() {
    log("[TabFix] disable");
    if (busExport) {
        try { busExport.unexport(); } catch (e) { log("[TabFix] unexport exception: " + e); }
        busExport = null;
    }
    if (nameId) {
        try { Gio.DBus.session.unown_name(nameId); } catch (e) { log("[TabFix] unown_name exception: " + e); }
        nameId = 0;
    }
}
