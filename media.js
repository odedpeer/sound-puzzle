let selection = [];
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let source;

function canDrop(ev) {
  return ev.target.className === "droppoint" || ev.target.id === "splits";
}

function allowDrop(ev) {
  if (canDrop(ev)) {
    ev.preventDefault();
  }
}

function drag(ev) {
  ev.dataTransfer.setData("splitId", ev.target.id);
}

function drop(ev) {
  const splitId = ev.dataTransfer.getData("splitId");
  if (canDrop(ev)) {
    ev.preventDefault();
    ev.target.appendChild(document.getElementById(splitId));
    if (ev.target.className === "droppoint") {
      selection[parseInt(ev.target.id.substring("selection".length))] = splitId;
    } else {
      // remove the split from selection
      for (let i = 0; i < selection.length; i++) {
        if (selection[i] === splitId) {
          selection[i] = null;
        }
      }
    }
  }
  // reset background of potential drop target when the draggable element leaves it
  event.target.style.background = "";
}

async function stop() {
  const player = document.getElementById("player");
  player.pause();
  player.currentTime = 0;

  if (source) {
    await source.stop();
  }

  resetAllSplitBackgrounds();
}

function concatBuffer(_buffers) {
  // _buffers[] is an array containig our audiobuffer list

  var buflengh = _buffers.length;
  var channels = [];
  var totalDuration = 0;

  for (var a = 0; a < buflengh; a++) {
    channels.push(_buffers[a].numberOfChannels); // Store all number of channels to choose the lowest one after
    totalDuration += _buffers[a].duration; // Get the total duration of the new buffer when every buffer will be added/concatenated
  }

  var numberOfChannels = channels.reduce(function (a, b) {
    return Math.min(a, b);
  });
  // The lowest value contained in the array channels
  var tmp = audioCtx.createBuffer(
    numberOfChannels,
    audioCtx.sampleRate * totalDuration,
    audioCtx.sampleRate
  ); // Create new buffer

  for (var b = 0; b < numberOfChannels; b++) {
    var channel = tmp.getChannelData(b);
    var dataIndex = 0;

    for (var c = 0; c < buflengh; c++) {
      channel.set(_buffers[c].getChannelData(b), dataIndex);
      dataIndex += _buffers[c].length; // Next position where we should store the next buffer values
    }
  }
  return tmp;
}

function playSplit(index) {
  stop();
  source = audioCtx.createBufferSource();

  const splitsToPlay = [];
  const splitsToPlayIndexes = [];
  for (let i = 0; i < selection.length; i++) {
    if (selection[i] === index.toString()) {
      splitsToPlay.push(`muppets-${selection[i]}.mp3`);
      splitsToPlayIndexes.push(selection[i]);
      for (let j = i + 1; j < selection.length; j++) {
        if (selection[j]) {
          splitsToPlay.push(`muppets-${selection[j]}.mp3`);
          splitsToPlayIndexes.push(selection[j]);
        } else {
          break;
        }
      }
      break;
    }
  }

  if (splitsToPlay.length === 0) {
    splitsToPlay.push(`muppets-${index}.mp3`);
    splitsToPlayIndexes.push(index);
  }

  return Promise.all(splitsToPlay.map((splitName) => splitarrays[splitName]))
    .then(concatBuffer)
    .then((decodedData) => {
      source.buffer = decodedData;
      source.connect(audioCtx.destination);
      source.start();
      toggleSplitBgColor(splitsToPlayIndexes);
    });
}

function resetAllSplitBackgrounds() {
  for (let i = 0; i < 8; i++) {
    document.getElementById(i.toString()).className = "split";
  }
}

function toggleSplitBgColor(indexes) {
  resetAllSplitBackgrounds();
  const elemIndex = indexes.shift();
  if (elemIndex) {
    document.getElementById(elemIndex.toString()).className = "split playing";
  }
  setTimeout(() => {
    toggleSplitBgColor(indexes);
  }, 3000);
}

function fetchSplit(splitName, url) {
  return fetch(url)
    .then(function (response) {
      if (!response.ok) {
        throw new Error("HTTP error, status = " + response.status);
      }
      return response.arrayBuffer();
    })
    .then((buf) => audioCtx.decodeAudioData(buf))
    .then((arr) => (splitarrays[splitName] = arr));
}

const splitarrays = {};
for (let i = 0; i < 8; i++) {
  fetchSplit(
    `muppets-${i}.mp3`,
    `https://cdn.glitch.com/3f6d5ca6-f448-40f4-882f-44a736d1d4ce%2Fmuppets-${i}.mp3`
  );
}

// Drag & drop effects
document.addEventListener(
  "dragstart",
  function (event) {
    // store a ref. on the dragged elem
    const dragged = event.target;
    // make it half transparent
    event.target.style.opacity = 0.5;
  },
  false
);

document.addEventListener(
  "touchstart",
  function (event) {
    // store a ref. on the dragged elem
    const dragged = event.target;
    // make it half transparent
    event.target.style.opacity = 0.5;
  },
  false
);

document.addEventListener(
  "dragend",
  function (event) {
    // reset the transparency
    event.target.style.opacity = "";
  },
  false
);

document.addEventListener(
  "touchend",
  function (event) {
    // reset the transparency
    event.target.style.opacity = "";
  },
  false
);

document.addEventListener(
  "dragenter",
  function (event) {
    // highlight potential drop target when the draggable element enters it
    if (event.target.className == "droppoint") {
      event.target.style.background = "purple";
    }
  },
  false
);

document.addEventListener(
  "dragleave",
  function (event) {
    // reset background of potential drop target when the draggable element leaves it
    if (event.target.className == "droppoint") {
      event.target.style.background = "";
    }
  },
  false
);
