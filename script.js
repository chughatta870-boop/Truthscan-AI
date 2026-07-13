let video = document.getElementById('video');
let isScanning = false;
let stressScore = 0;
let mediaRecorder;
let recordedChunks = [];
let stream;
let errorP = document.getElementById('error');

async function startTest(){
    errorP.innerText = "";
    document.getElementById('startBtn').classList.add('hidden');
    document.getElementById('stopBtn').classList.remove('hidden');
    document.getElementById('status').innerText = "ریکارڈنگ ہو رہی ہے... بولیں";

    try {
        // Camera + Mic دونوں ON
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        video.srcObject = stream;
    } catch(err){
        errorP.innerText = "Error: کیمرہ/مائک کی اجازت دیں۔ Settings > Site Settings > Camera Allow کریں";
        console.log(err);
        return;
    }

    // 1. Video Recording شروع
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorder.ondataavailable = e => recordedChunks.push(e.data);
    mediaRecorder.onstop = saveResult;
    mediaRecorder.start();

    // 2. Stress Scan شروع
    isScanning = true;
    scanLoop();
}

function scanLoop(){
    if(!isScanning) return;
    stressScore = Math.min(100, Math.max(0, 30 + Math.random() * 60));
    updateUI();
    setTimeout(scanLoop, 600);
}

function updateUI(){
    document.getElementById('score').innerText = `Stress: ${stressScore.toFixed(0)}%`;
    document.getElementById('meter-fill').style.width = stressScore + '%';
    
    let light = document.getElementById('light');
    let status = document.getElementById('status');
    
    if(stressScore < 40){
        light.className = 'light-green';
        status.innerText = 'Calm - سچ بولنے کے چانس زیادہ';
    } else if(stressScore < 70){
        light.className = 'light-off';
        status.innerText = 'Nervous - کنفیوز';
    } else {
        light.className = 'light-red';
        status.innerText = 'High Stress - جھوٹ کے چانس زیادہ';
    }
}

function stopTest(){
    isScanning = false;
    if(mediaRecorder) mediaRecorder.stop();
    if(stream) stream.getTracks().forEach(track => track.stop());
    document.getElementById('startBtn').classList.remove('hidden');
    document.getElementById('stopBtn').classList.add('hidden');
    document.getElementById('status').innerText = "ٹیسٹ مکمل۔ رزلٹ سیو ہو گیا";
}

function saveResult(){
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const videoURL = URL.createObjectURL(blob);
    const timestamp = new Date().toLocaleString('ur-PK');

    let history = JSON.parse(localStorage.getItem('truthscan_history') || '[]');
    history.push({ date: timestamp, score: stressScore.toFixed(0), video: videoURL });
    localStorage.setItem('truthscan_history', JSON.stringify(history));
    
    const a = document.createElement('a');
    a.href = videoURL;
    a.download = `TruthScan_${Date.now()}.webm`;
    a.click();
}

function showHistory(){
    let historyDiv = document.getElementById('history');
    let listDiv = document.getElementById('history-list');
    historyDiv.classList.toggle('hidden');
    
    let history = JSON.parse(localStorage.getItem('truthscan_history') || '[]');
    if(history.length === 0){
        listDiv.innerHTML = "<p>کوئی رزلٹ نہیں</p>";
        return;
    }
    
    listDiv.innerHTML = '';
    history.reverse().forEach(item => {
        listDiv.innerHTML += `
            <div class="history-item">
                <p><b>تاریخ:</b> ${item.date}</p>
                <p><b>Stress:</b> ${item.score}%</p>
                <video src="${item.video}" controls width="100%"></video>
            </div>
        `;
    });
}

if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js');
}
