let videoFileName;
let progress;
let videoSelect;
let video;
let stepBackButton;
let stepFwdButton;
let markStartButton;
let markEndButton;
let marksElement;
let worker;

let marks = [];
let currentMark;

const keyMap = new Map([
    ['a', stepBackward],
    ['s', stepForward],
    ['ArrowLeft', stepBackward],
    ['ArrowRight', stepForward],
    ['q', markStart],
    ['w', markEnd],
])

const SCROLL_FACTOR = 0.01

window.addEventListener('load', () => {
    worker = new Worker("js/worker.js")

    videoSelect = document.querySelector('#video-select')
    video = document.querySelector('#video')
    progress = document.querySelector('.loading .bar')
    stepBackButton = document.querySelector('#step-backward')
    stepFwdButton = document.querySelector('#step-forward')
    markStartButton = document.querySelector('#mark-start')
    markEndButton = document.querySelector('#mark-end')
    marksElement = document.querySelector('#marks')

    stepBackButton.addEventListener('click', stepBackward)
    stepFwdButton.addEventListener('click', stepForward)
    markStartButton.addEventListener('click', markStart)
    markEndButton.addEventListener('click', markEnd)

    video.addEventListener('mousewheel', (event) => {
        scrub(event)
        event.preventDefault()
    })
    window.addEventListener('keypress', (event) => {
        if (keyMap.has(event.key)) {
            event.preventDefault()
            keyMap.get(event.key)()
        }
    })

    videoSelect.addEventListener('change', selectFile)
})

onmessage = async (e) => {
    switch (e.data.action) {
        
    }
}

async function selectFile(e) {
    const file = e.target.files[0]
    videoFileName = file.name
    videoSelect.parentNode.removeChild(videoSelect)
    const url = URL.createObjectURL(file)
    video.src = url
    loadMarks()
    currentMark = marks[0]
    refreshMarks()
}

function scrub(event) {
    const delta = event.wheelDelta
    stepFrames(delta * SCROLL_FACTOR)
}

function stepBackward() {
    stepFrames(-1)
}
function stepForward() {
    stepFrames(1)
}
function markStart() {
    const markName = currentMark || crypto.randomUUID()
    if (!currentMark) {
        marks.push(markName)
        saveMarks()
    }
    write(`${markName}:start`, video.currentTime)
    currentMark = markName
    refreshMarks()
}
function markEnd() {
    if (currentMark) {
        write(`${currentMark}:end`, video.currentTime)
        refreshMarks()
        currentMark = null
    }
}

// Internal

let _currentMarkEls = [];
function selectMark(e) {
    currentMark = e.target.getAttribute('data-mark-id')
    const ms = read(`${currentMark}:start`)
    video.currentTime = ms
    refreshMarks()
}
function refreshMarks() {
    _currentMarkEls.forEach(c => c.removeEventListener('click', selectMark))
    marksElement.innerHTML = ''
    marks.forEach(uuid => {
        const s = read(`${uuid}:start`)
        const e = read(`${uuid}:end`)
        const mark = document.createElement('li')
        let cls = 'mark'
        if (uuid === currentMark) {
            cls += ' selected'
        }
        mark.setAttribute('class', cls)
        mark.setAttribute('data-mark-id', uuid)
        mark.innerHTML = `[${s} - ${e}]`
        marksElement.appendChild(mark)
        _currentMarkEls.push(mark)
        mark.addEventListener('click', selectMark)
    })
}
function loadMarks() {
    const m = read('marks')
    if (m) {
        marks = JSON.parse(m)
    }
}
function saveMarks() {
    write('marks', JSON.stringify(marks))
}

const keyName = (key) => `${videoFileName}:${key}`

function read(key) {
    return window.localStorage.getItem(keyName(key))
}
function write(key, value) {
    window.localStorage.setItem(keyName(key), value)
}

function stepFrames(frames) {
    if (isPlaying()) {
        video.pause();
    }
    const frameTime = frames * (1 / 30)
    video.currentTime = Math.min(video.duration, Math.max(0, video.currentTime + frameTime))
}

function isPlaying() {
    return video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2
}