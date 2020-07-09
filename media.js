let selection = [];
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let source;
let numberOfSplits = 8;
let songPrefix = "sunscreen";
let splitarrays = {};
const songs = {
  sunscreen: "Everybody's Free To Wear Sunscreen",
  "queen-dont-stop-me-now": "Don't Stop Me Now",
  "matanot-ktanot": "מתנות קטנות",
};
let timer;
let seconds = 0;

async function init() {
  clearInterval(timer);
  seconds = 0;
  document.getElementById("timer").innerText = seconds;
  timer = setInterval(() => {
    seconds += 1;
    document.getElementById("timer").innerText = seconds;
  }, 1000);

  document.getElementById("selectedSong").innerText = songs[songPrefix];
  splitarrays = {};
  selection = [];
  const promises = [];
  for (let i = 0; i < numberOfSplits; i++) {
    promises.push(
      fetchSplit(
        `${songPrefix}-${i}.mp3`,
        `https://cdn.glitch.com/3f6d5ca6-f448-40f4-882f-44a736d1d4ce%2F${songPrefix}-${i}.mp3`
      )
    );
  }
  await Promise.all(promises);

  let allWaves = "";
  for (let i = 0; i < numberOfSplits; i++) {
    allWaves += `<div><img src="https://cdn.glitch.com/3f6d5ca6-f448-40f4-882f-44a736d1d4ce%2F${songPrefix}-${i}.png"
                class="wav-tile"
               ></div>`;
  }
  document.getElementById("drawall").innerHTML = allWaves;

  let droppoints = "";
  for (let i = 0; i < numberOfSplits; i++) {
    droppoints += `
        <div
          id="selection${i}"
          class="droppoint"
          ondrop="drop(event)"
          ondragover="allowDrop(event)"
        ></div>
        `;
  }
  document.getElementById("playlist").innerHTML = droppoints;

  let splits = "";
  // shuffle splits
  let indexes = [];
  for (let i = 0; i < numberOfSplits; i++) {
    indexes.push(i);
  }
  let shuffle = [];
  for (let i = 0; i < numberOfSplits; i++) {
    shuffle.push(indexes.splice(Math.random() * indexes.length, 1)[0]);
  }
  for (let i = 0; i < numberOfSplits; i++) {
    const index = shuffle[i];
    splits += `
      <div class="splitsLoc">
        <div id="${index}" class="split" draggable="true" ondragstart="drag(event)">
          <div>
            <img
            draggable="false"
            src="https://cdn.glitch.com/3f6d5ca6-f448-40f4-882f-44a736d1d4ce%2F${songPrefix}-${index}.png"
            >
          </div>
          <div>
            <button onclick="playSplit(${index})"><span class="hint">${index}</span> &rtri;</button>
          </div>
        </div>
      </div>
        `;
  }
  document.getElementById("splits").innerHTML = splits;
}

function canDrop(ev) {
  return (
    ev.target.className === "droppoint" || ev.target.className === "splitsLoc"
  );
}

async function selectSong(e) {
  songPrefix = e.value;
  await init();
}

function allowDrop(ev) {
  if (canDrop(ev)) {
    ev.preventDefault();
  }
}

function drag(ev) {
  ev.dataTransfer.setData("splitId", ev.target.id);
}

function verifyWinning() {
  for (let i = 0; i < numberOfSplits; i++) {
    if (selection[i] !== i.toString()) {
      return;
    }
  }
  clearInterval(timer);
  confetti.start();
  setTimeout(() => confetti.stop(), 5000);
}

function drop(ev) {
  const splitId = ev.dataTransfer.getData("splitId");
  if (canDrop(ev)) {
    ev.preventDefault();
    ev.target.appendChild(document.getElementById(splitId));
    if (ev.target.className === "droppoint") {
      selection[parseInt(ev.target.id.substring("selection".length))] = splitId;
      verifyWinning();
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
  ev.target.style.background = "";
}

async function stop() {
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

async function playAll() {
  await stop();

  source = audioCtx.createBufferSource();

  const splitsToPlay = [];
  for (let i = 0; i < numberOfSplits; i++) {
    splitsToPlay.push(`${songPrefix}-${i}.mp3`);
  }

  return Promise.all(splitsToPlay.map((splitName) => splitarrays[splitName]))
    .then(concatBuffer)
    .then((decodedData) => {
      source.buffer = decodedData;
      source.connect(audioCtx.destination);
      source.start();
    });
}

async function playSplit(index) {
  await stop();
  source = audioCtx.createBufferSource();

  const splitsToPlay = [];
  const splitsToPlayIndexes = [];
  for (let i = 0; i < selection.length; i++) {
    if (selection[i] === index.toString()) {
      splitsToPlay.push(`${songPrefix}-${selection[i]}.mp3`);
      splitsToPlayIndexes.push(selection[i]);
      for (let j = i + 1; j < selection.length; j++) {
        if (selection[j]) {
          splitsToPlay.push(`${songPrefix}-${selection[j]}.mp3`);
          splitsToPlayIndexes.push(selection[j]);
        } else {
          break;
        }
      }
      break;
    }
  }

  if (splitsToPlay.length === 0) {
    splitsToPlay.push(`${songPrefix}-${index}.mp3`);
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
  for (let i = 0; i < numberOfSplits; i++) {
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

function toggleBorder() {
  let tileElements = document.querySelectorAll(".wav-tile");

  for (let i = 0; i < tileElements.length; i++) {
    if (!tileElements[i].style.borderWidth) {
      tileElements[i].style.borderWidth = "1px";
    } else {
      tileElements[i].style.borderWidth = "";
    }
  }
}

function toggleHint() {
  let hintElements = document.querySelectorAll(".hint");

  for (let i = 0; i < hintElements.length; i++) {
    if (!hintElements[i].style.display) {
      hintElements[i].style.display = "block";
    } else {
      hintElements[i].style.display = "";
    }
  }
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
  "dragend",
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
    if (event.target.className == "droppoint" || event.target.id == "splits") {
      event.target.style.background = "purple";
    }
  },
  false
);

document.addEventListener(
  "dragleave",
  function (event) {
    // reset background of potential drop target when the draggable element leaves it
    if (event.target.className == "droppoint" || event.target.id == "splits") {
      event.target.style.background = "";
    }
  },
  false
);
