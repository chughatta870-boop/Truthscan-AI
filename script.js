let video = document.getElementById('video');
let isScanning = false;
let stressScore = 0;
let mediaRecorder;
let recordedChunks = [];
let stream;
let errorP = document.getElementById('error');

// 1. ٹیسٹ شروع کریں بٹن
async function startTest(){
    errorP.innerText = "";
    document.getElementById('startBtn').classList.add('hidden');
    document.getElementById('stopBtn').classList.remove('hidden');
    document.getElementById('status').innerText = "ریکارڈنگ ہو رہی ہے... بولیں";

    // چیک کریں براؤزر سپورٹ کرتا ہے یا نہیں
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
        errorP.innerText = "Error: آپ کا براؤزر کیمرہ سپورٹ نہیں کرتا۔ Chrome استعمال کریں";
        resetButtons();
        return;
    }

    try {
        // Camera + Mic کی Permission مانگیں
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user" }, 
            audio: true 
        });
        video.srcObject = stream;
        video.play();
    } catch(err){
        console.log(err);
        // مختلف Errors کا حل
        if(err.name === "NotAllowedError" || err.name === "PermissionDeniedError"){
            errorP.innerText = "Error: اجازت نہیں ملی۔ 3 ڈاٹ ⋮ > Site Settings > Camera + Mic Allow کریں پھر Refresh کریں";
        } else if(err.name === "NotFoundError"){
            errorP.innerText = "Error: موبائل میں کیمرہ/مائک نہیں ملا";
        } else if(err.name === "NotReadableError"){
            errorP.innerText = "Error: کوئی اور ایپ کیمرہ استعمال کر رہی ہے۔ اسے بند کریں";
        } else {
            errorP.innerText = "Error: " + err.message;
        }
        resetButtons();
        return;
    }

    // 2. Video Recording شروع
    recordedChunks = [];
    try {
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    } catch(e) {
        mediaRecorder = new MediaRecorder(stream); // اگر webm سپورٹ نہ ہو
    }
    
    mediaRecorder.ondataavailable = e => {
        if(e.data.size > 0) recordedChunks.push(e.data);
    };
    mediaRecorder.onstop = saveResult;
    mediaRecorder.start(100); // ہر 100ms پر data لیتے رہو

    // 3. Stress Scan شروع
    isScanning = true;
    scanLoop();
}

// بٹن ریسیٹ کرنے کے لیے
function resetButtons(){
    document.getElementById('startBtn').classList.remove('hidden');
    document.getElementById('stopBtn').classList.add('hidden');
}

// 4. Fake Stress Loop
function scanLoop(){
    if(!isScanning) return;
    // 30 سے 90 کے درمیان Random Stress
    stressScore = Math.min(100, Math.max(0, 30 + Math.random() * 60));
    updateUI();
    setTimeout(scanLoop, 600);
}

// 5. UI Update کریں
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

// 6. ٹیسٹ روکیں بٹن
function stopTest(){
    isScanning = false;
    if(mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
    if(stream) stream.getTracks().forEach(track => track.stop());
    resetButtons();
    document.getElementById('status').innerText = "ٹیسٹ مکمل۔ رزلٹ سیو ہو گیا";
}

// 7. Result Save کرنا + Download
function saveResult(){
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const videoURL = URL.createObject
