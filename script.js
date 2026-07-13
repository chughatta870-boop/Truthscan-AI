// ===== GLOBAL VARIABLES =====
let video = document.getElementById('video');
let isScanning = false;
let stressScore = 0;
let mediaRecorder;
let recordedChunks = [];
let stream;
let errorP = document.getElementById('error');

// ===== 1. START TEST FUNCTION =====
async function startTest(){
    errorP.innerText = "";
    document.getElementById('startBtn').classList.add('hidden');
    document.getElementById('stopBtn').classList.remove('hidden');
    document.getElementById('status').innerText = "کیمرہ آن ہو رہا ہے...";

    // Check browser support
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
        errorP.innerText = "Error: آپ کا براؤزر کیمرہ سپورٹ نہیں کرتا۔ Chrome استعمال کریں";
        resetButtons();
        return;
    }

    try {
        // Request Camera + Microphone Permission
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: "user",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }, 
            audio: true 
        });
        
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            video.play();
            document.getElementById('status').innerText = "ریکارڈنگ ہو رہی ہے... بولیں";
        };

    } catch(err){
        console.log("Camera Error:", err);
        // Handle different errors
        if(err.name === "NotAllowedError" || err.name === "PermissionDeniedError"){
            errorP.innerText = "Error: اجازت نہیں ملی۔ Chrome > 3 ڈاٹ ⋮ > Site Settings > Camera + Mic Allow کریں";
        } else if(err.name === "NotFoundError"){
            errorP.innerText = "Error: موبائل میں کیمرہ/مائک نہیں ملا";
        } else if(err.name === "NotReadableError"){
            errorP.innerText = "Error: کیمرہ کسی اور ایپ میں استعمال ہو رہا ہے";
        } else if(err.name === "OverconstrainedError"){
            errorP.innerText = "Error: کیمرہ کی کوالٹی سپورٹ نہیں ہو رہی";
        } else {
            errorP.innerText = "Error: " + err.message;
        }
        resetButtons();
        return;
    }

    // Start Video Recording
    recordedChunks = [];
    try {
        let options = { mimeType: 'video/webm;codecs=vp9,opus' };
        if(!MediaRecorder.isTypeSupported(options.mimeType)){
            options = { mimeType: 'video/webm;codecs=vp8,opus' };
        }
        if(!MediaRecorder.isTypeSupported(options.mimeType)){
            options = { mimeType: 'video/webm' };
        }
        mediaRecorder = new MediaRecorder(stream, options);
    } catch(e) {
        mediaRecorder = new MediaRecorder(stream);
    }
    
    mediaRecorder.ondataavailable = e => {
        if(e.data && e.data.size > 0) {
            recordedChunks.push(e.data);
        }
    };
    
    mediaRecorder.onerror = (e) => {
        errorP.innerText = "Recording Error: " + e.error.name;
    };

    mediaRecorder.onstop = saveResult;
    mediaRecorder.start(100); // collect data every 100ms

    // Start Stress Scanning Loop
    isScanning = true;
    scanLoop();
}

// ===== 2. RESET BUTTONS =====
function resetButtons(){
    document.getElementById('startBtn').classList.remove('hidden');
    document.getElementById('stopBtn').classList.add('hidden');
}

// ===== 3. STRESS SCAN LOOP =====
function scanLoop(){
    if(!isScanning) return;
    
    // Simulate stress based on random + time
    let base = 30;
    let randomFactor = Math.random() * 60;
    let timeFactor = (Date.now() % 5000) / 5000 * 10; // small variation
    stressScore = Math.min(100, Math.max(0, base + randomFactor + timeFactor));
    
    updateUI();
    setTimeout(scanLoop, 600); // update every 600ms
}

// ===== 4. UPDATE UI =====
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
        status.innerText = 'Nervous - کنفیوز / نارمل';
    } else {
        light.className = 'light-red';
        status.innerText = 'High Stress - جھوٹ کے چانس زیادہ';
    }
}

// ===== 5. STOP TEST FUNCTION =====
function stopTest(){
    isScanning = false;
    
    if(mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    
    if(stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    
    video.srcObject = null;
    resetButtons();
    document.getElementById('status').innerText = "ٹیسٹ مکمل۔ رزلٹ سیو ہو گیا";
}

// ===== 6. SAVE RESULT TO LOCALSTORAGE =====
function saveResult(){
    if(recordedChunks.length === 0) return;
    
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const videoURL = URL.createObjectURL(blob);
    const timestamp = new Date().toLocaleString('ur-PK');
    const id = Date.now();

    let history = JSON.parse(localStorage.getItem('truthscan_history') || '[]');
    history.push({
        id: id,
        date: timestamp,
        score: stressScore.toFixed(0),
        video: videoURL
    });
    
    // Keep only last 20 records to avoid storage full
    if(history.length > 20) history.shift();
    
    localStorage.setItem('truthscan_history', JSON.stringify(history));
    
    // Auto Download Video
    const a = document.createElement('a');
    a.href = videoURL;
    a.download = `TruthScan_${id}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ===== 7. SHOW HISTORY =====
function showHistory(){
    let historyDiv = document.getElementById('history');
    let listDiv = document.getElementById('history-list');
    historyDiv.classList.toggle('hidden');
    
    let history = JSON.parse(localStorage.getItem('truthscan_history') || '[]');
    if(history.length === 0){
        listDiv.innerHTML = "<p>کوئی رزلٹ نہیں ملا</p>";
        return;
    }
    
    listDiv.innerHTML = '';
    history.reverse().forEach(item => {
        listDiv.innerHTML += `
            <div class="history-item">
                <p><b>تاریخ:</b> ${item.date}</p>
                <p><b>Stress Level:</b> ${item.score}%</p>
                <video src="${item.video}" controls playsinline></video>
                <button class="deleteBtn" onclick="deleteItem(${item.id})">یہ ریکارڈ ڈیلیٹ کریں</button>
           
