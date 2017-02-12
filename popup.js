//==============================================================================
// popup.js - All functionality for the Zetl extension for Google Chrome. See
//            LICENSE and README for details.
//
//------------------------------------------------------------------------------
// Utils for FP.
//------------------------------------------------------------------------------

// Type predicates - stricter than JS's defaults, and with more uniform
// interface.

function numberp(x) {
    return (typeof(x) === "number");
}

function stringp(x) {
    return (typeof(x) === "string");
}

function arrayp(x) {
    return Array.isArray(x);
}

function objectp(x) {
    return ((typeof(x) === "object") && !arrayp(x));
}

function myTypeOf(x) {
    // Like typeof(x), only distinguishes between arrays and non-array
    // 'objects'.
    var typex = typeof(x);
    if (typex === "object") {
	if (arrayp(x)) {
	    return "array";
	} else {
	    return "object";
	}
    } else {
	return typex;
    }
}

function equal(a, b) {
    // Custom equality predicate. Arrays are only equal if they have the same
    // contents in the same order. Objects are only equal if they have the same
    // values under the same keys. Recurses on nested arrays/objects if present.
    if (myTypeOf(a) != myTypeOf(b)) {
	return false;
    }
    switch (myTypeOf(a)) {
        case "number":
            return (a === b);
            break;
        case "string":
            return (a === b);
            break;
        case "array":
            if (a.length != b.length) {
                return false;
		break;
            } else {
	        var i = 0;
	        while (i < a.length) {
	            if (equal(a[i], b[i]) === false) {
		        return false;
			break;
	            }
	            i++}
	        return true;
		break;
            }	    
        case "object":
            // Assumes key order is the same in a and b. This assumption seems
	    // to hold, at least in Chrome's JS implementation.
            var akeys = Object.keys(a)
            var bkeys = Object.keys(b)
            if (akeys.length != bkeys.length) {
	        return false;
		break;
            } else {
	        var i = 0;
	        while (i < akeys.length) {
	            if (equal(a[akeys[i]], b[bkeys[i]]) === false) {
		        return false;
			break;
	            }
	            i++}
	        return true;
                break;
	    }
    }
}

function keyFn(key) {
    // Return a function that takes a single object as an argument and
    // retrieves the value in said object stored under the given key.
    return function(obj) {
	return obj[key];
    };
}

function identity(thing) {
    // Don't leave home without it.
    return thing;
}

//------------------------------------------------------------------------------
// Higher-order sequence manipulation functions.
//------------------------------------------------------------------------------
/*
I need these because Zetl notes are stored in an array as JS objects whose keys
are the same but whose values differ, and I want to specify which key/value
I'm using to: test for membership of a particular note in the array; replace a
note; and so on.

Note: Only the bare minimum of features are implemented. Other useful features
would be an argument to search from the end of the sequence, or to search only
a subsequence, or to set a limit to the number of items to match, etc.

Note: Given the above, these functions aren't maximally efficient,
especially in some special cases, but they should be reasonable for a
prototype like Zetl.
*/

function position(item, seq, key = identity, test = equal) {
    // Like seq.indexOf(item), but a function, not a method, and it's more
    // flexible. Returns index of first occurrence of item within seq, or null
    // if not present.
    for (var i = 0; i < seq.length; i++) {
	if (test(key(seq[i]), item) === true) {
	    return i;
	}
    }
    return null;
}

function find(item, seq, key = identity, test = equal) {
    // Like position, only returns the (whole) object matched.
    for (var i = 0; i < seq.length; i++) {
	if (test(key(seq[i]), item) === true) {
	    return seq[i];
	}
    }
    return null;
}

function remove(item, seq, key = identity, test = equal) {
    // Like seq.splice(), but more useful due to functional arguments.
    // Removes an elt from a seq NON-destructively.
    var result = []
    for (var i = 0; i < seq.length; i++) {
	if (test(key(seq[i]), item) === false) {
	    result.push(seq[i]);
	}
    }
    return result;
}

function update(item, seq, key = identity, test = equal) {
    // Push item onto seq, unless it's already present (as far as the key and
    // test predicates are concerned), in which case replace the old one
    // in-place. Note that in this function, the key argument is applied to both
    // items.
    var pos = position(key(item), seq, key, test);
    if (pos != null) {
	seq[pos] = item;
    } else {
	seq.push(item);
    }
    return seq;
}

function append(item, seq) {
    // Like seq.push(), but returns the sequence, not the pushed item.
    seq.push(item);
    return seq;
}

//------------------------------------------------------------------------------
// DOM Manipulation.
//------------------------------------------------------------------------------

function addNode(node, parent) {
    // A functional wrapper around the DOM API call.
    parent.appendChild(node);
}

// Note: when removing nodes, ensure they are no longer referenced anywhere
// else, or they will NOT be garbage-collected!

function removeNode(id) {
    // Removes a node by ID. Is subtree removed explicitly or just garbage
    // collected? Unclear from JS docs.
    var element = document.getElementById(id);
    element.parentNode.removeChild(element);
}

function removeChildren(id) {
    // Removes children of note with specified id.
    var node = document.getElementById(id);
    while (node.firstChild) {
	node.removeChild(node.firstChild);
    }
}

//------------------------------------------------------------------------------
// Functions for creating and initializing elements before adding them to the
// DOM.
//------------------------------------------------------------------------------

function makeButton(id, text, cb, astext = false) {
    // If astext is true, set the button's style so as to show only the text,
    // and not the button's border or background (i.e. the button graphic
    // itself).
    var btn = document.createElement("button");
    btn.id = id;
    btn.innerText = text;
    btn.onclick = cb;
    if (astext === true) {
	btn.className = "astext"
    }
    return btn;
}

function makeTextArea(id, text, rows = 4, cols = 50) {
    var ta = document.createElement("textarea");
    ta.id = id;
    ta.value = text;
    ta.rows = rows;
    ta.cols = cols;
    return ta;
}

function makeTextDiv(id, text = "") {
    var div = document.createElement("div");
    div.id = id;
    div.textContent = text;
    return div;
}

function makeDiv(id) {
    var div = document.createElement("div");
    div.id = id;
    return div;
}

function makeBreak() {
    return document.createElement("br");
}

function makeLink(url) {
    var a = document.createElement("a");
    a.href = url;
    a.textContent = getDomainOfUrl(url) + "...";
    return a;
}

function makeImage(url) {
    var img = document.createElement("img");
    img.src = getFaviconUrl(url);
    img.className = "icon";
    
    // This catches all errors though, which seem to arise even when the
    // favicon is acquired successfully. Diagnose that.
    // img.onError = useDefaultImage();
    
    return img;
}

function useDefaultImage(img) {
    // If the favicon could not be aquired, default to the Zetl icon.
    var default_image = "https://github.com/pnoom/zetl/zetl.png";
    img.setAttribute('src', default_image);
}

//------------------------------------------------------------------------------
// Zetl implementation.
//------------------------------------------------------------------------------

// Note that throughout the following code, urls are passed around a lot. That's
// because they are unique, and are therefore the keys under which the actual
// webpage descriptions are stored. Only one note may be associated with a
// specific URL. If the user saves a new note for an existing URL, the original
// note is superseded.

// Provide this as the first argument to all chrome.storage.sync.get calls.

var stored_defaults = {notes: [], lastdeleted: null}

function addNotesTable(parent) {
    // Make and add table to DOM in one go, since accessing storage is
    // asnychronous.
    var tbl = document.createElement("table");
    tbl.id = "allnotes";

    // sortNotes(); // Is JS's sort method a stable sort?

    chrome.storage.sync.get(stored_defaults, function(stored) {
	for (i = 0; i < stored.notes.length; i++) {
	    addNode(makeTableEntry(stored.notes[i]), tbl);
	}
	addNode(tbl, parent);
    });
}

function makeTableEntry(note) {
    // Build up an <table> tag representing a stored note. Pay close attention
    // to the closures provided as callbacks to the buttons' onclick attribute.
    var entry = document.createElement("tr");

    var imagetd = document.createElement("td");
    addNode(makeImage(note.url), imagetd);

    var btntd = document.createElement("td");
    addNode(makeButton(note.url, note.text, function() {
	updatePopup(note.url);
    }, true), btntd);

    var linktd = document.createElement("td");
    addNode(makeLink(note.url), linktd);

    addNode(imagetd, entry);
    addNode(linktd, entry);
    addNode(btntd, entry);    
    return entry;
}

function getDomainOfUrl(url) {
    // Extracts the (relatively short, and therefore UI-friendly) domain from a
    // (potentially lengthy, and therefore visually noisy) url.
    return url.split("/")[2];
}

function getCurrentTabUrl(callback) {
    // Get URL of current tab. See:
    // developer.chrome.com/extensions/examples/tutorials/getstarted/popup.js
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      var tab = tabs[0];
        var url = tab.url;
      console.assert(typeof url == 'string', 'tab.url should be a string');
      callback(url);
    });
}

function getFaviconUrl(currenturl) {
    // Get the URL of a domain's favicon.
    return "https://" + getDomainOfUrl(currenturl) + "/favicon.ico";
}

function sortNotes() {
    // Sort stored notes by domain in-place.
    chrome.storage.sync.get(stored_defaults, function (stored) {
	stored.notes.sort(function(a, b) {
	    var adomain = getDomainOfUrl(a.url)
	    var bdomain = getDomainOfUrl(b.url)
	    if (adomain < bdomain) {
		return -1;
	    }
	    if (adomain > bdomain) {
		return 1;
	    }
	    return 0;
	});
	chrome.storage.sync.set(stored);
    });
}

function timedStatusMessage(msg, duration = 2000, id = "status") {
    // Temporarily show an informative message to the user in response to
    // certain actions.
    updateMessage(id, msg);
    setTimeout(function() {
	updateMessage(id, "");
    }, duration);
}

function updateMessage(id, text) {
    // Update body text of element with given id.
    document.getElementById(id).textContent = text;
}

function updateTextArea(id, text) {
    // Update text content of the textarea element.
    document.getElementById(id).value = text;
}

function updateNotesList() {
    // Re-generate the table representing all of the notes in storage.
    removeChildren("noteslist");
    addNotesTable(document.getElementById("noteslist"));
}

function getNewDescription() {
    // Get text entered into textarea.
    return document.getElementById("textfield").value;
}

function getStoredDescription(url, callback) {
    // Get text from corresponding stored note object (if present).
    chrome.storage.sync.get(stored_defaults, function (stored) {
	var result = find(url, stored.notes, keyFn('url'));
	if (result != null) {
	    callback(result.text);
	} else {
	    callback("");
	}
    });
}

function getCurrentUrl() {
    // Get the value of currenturl in updatePopup. This is a bit hacky.
    // For use in implementing keyboard shortcuts only.
    return document.getElementById("currenturl").textContent;
}

function saveNote(currenturl) {
    // If there's already an entry for currenturl, overwrite it with new
    // description. Otherwise add new one (again, with new description). Those
    // cases are implemented identically, thanks to my update function.
    var newnote = {url:currenturl, text:getNewDescription()}
    chrome.storage.sync.get(stored_defaults, function(stored) {
	stored.notes = update(newnote, stored.notes, keyFn('url'));
	chrome.storage.sync.set(stored);
	// This call must be made here, WITHIN (and at the end of) the callback
	updatePopup(currenturl);
    });
    timedStatusMessage("Note saved.");
}

function undoDeleteNote() {
    // If the user has deleted a note (individually), restore it. There isn't
    // an undo "history": only the most recently deleted note can be recovered.
    chrome.storage.sync.get(stored_defaults, function(stored) {
	if ((stored.lastdeleted != null) && objectp(stored.lastdeleted)) {
	    var returnurl = stored.lastdeleted.url
	    stored.notes = append(stored.lastdeleted, stored.notes);
	    stored.lastdeleted = null;
	    chrome.storage.sync.set(stored);
	    updatePopup(returnurl);
	    timedStatusMessage("Deletion undone.");
	} else {
	    timedStatusMessage("Nothing to undo.");
	}
    });
}

function deleteNote(currenturl) {
    // Delete the note being edited, whether it was selected by clicking, or
    // whether it is the note for the current page (the default).
    chrome.storage.sync.get(stored_defaults, function(stored) {
	stored.lastdeleted = find(currenturl, stored.notes, keyFn('url'));
        stored.notes = remove(currenturl, stored.notes, keyFn('url'));
        chrome.storage.sync.set(stored);
        getCurrentTabUrl(updatePopup);
    });
    timedStatusMessage("Note deleted.");
}

function deleteAllNotes() {
    // Delete all stored notes (show confirmation dialog first).
    if (window.confirm(
	"Are you sure you want to permanently delete all of your notes?")) {
	chrome.storage.sync.clear();
        getCurrentTabUrl(updatePopup);
	timedStatusMessage("All notes deleted.");
    }
}

function showTips() {
    // Temporarily show an informative status message.
    timedStatusMessage(
      "Ctrl+Shift+Z = toggle popup. Alt+Shift+Z = save note.",
	4000);
}

function updatePopup(currenturl) {
    // Where it all happens. This function is either provided with a url
    // directly, or is passed one by getCurrentTabUrl when used as the callback
    // to that function. Updates the GUI to reflect any selection or change that
    // the user makes. NOTE: currenturl is the url of the note being currently
    // edited - not neccessarily the url of the current tab.

    // Update the info that indicates which note is being edited: i.e. the
    // webpage display message and the contents of the text field.
    updateMessage("currenturl", currenturl);
    getStoredDescription(currenturl, function(description) {
	updateTextArea("textfield", description);
    });

    // Update callbacks for the relevant persistent buttons
    document.getElementById("save").onclick = function() {
	saveNote(currenturl);
    };
    document.getElementById("delete").onclick = function() {
	deleteNote(currenturl);
    };

    // Debugging
    // document.getElementById("debug").onclick = function() {
    //     console.log(currenturl);
    // }
    // Uncommenting the above requires the following tag to be added after other
    // button tags: <button id="debug">Debug.</button>
    
    // Finally update the UI to reflect any changes to stored notes.
    updateNotesList();
}

//------------------------------------------------------------------------------
// Register actions to perform once DOM stuff has been loaded.
//------------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function () {
    // Register listeners and callbacks for those persistent buttons which do
    // not require knowledge of the current url.
    document.getElementById('undo').addEventListener('click', undoDeleteNote);
    document.getElementById('deleteall').addEventListener('click',
							  deleteAllNotes);
    document.getElementById('tips').addEventListener('click', showTips);
    
    // Update text and notes list.
    getCurrentTabUrl(updatePopup);
});

chrome.commands.onCommand.addListener(function(command) {
    // Save the current note if the user hits Alt+Shift+Z.
    if (command === "save_note") {
        saveNote(getCurrentUrl());
    }
});
