let currentLanguage = 'tr'; // اللغة الافتراضية

async function sendCommand(command) {
    fetch('/command', {
        method: 'POST',
        body: command,
        headers: {
            'Content-Type': 'text/plain'
        }
    })
    .then(res => res.json())
    .then(data => {
        const output = document.getElementById("robot-response");
        if (data.status === "success") {
            output.textContent += "\n>> " + data.response;
        } else {
            output.textContent += "\n[HATA] " + data.message;
        }
    });
}

async function connectRobot() {
    await sendCommand('1;1;OPEN=WEBCLIENT');
}

async function disconnectRobot() {
    const response = await fetch('/disconnect');
    const data = await response.json();
    if (data.status === 'disconnected') {
        updateRobotResponse(translations[currentLanguage].disconnect_success);
        document.getElementById('status-indicator').className = "badge bg-danger";
        document.getElementById('status-indicator').textContent = translations[currentLanguage].not_connected;
    }
}

async function emergencyStop() {
    await sendCommand('1;1;STOP');
}

async function resetRobot() {
    await sendCommand('1;1;RSTALRM');
}

async function sendMelfaCode() {
    const code = document.getElementById('melfa-code').value.trim();
    if (code.length > 0) {
        const formData = new FormData();
        formData.append('melfa_code', code);

        const response = await fetch('/melfa_exec', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        updateRobotResponse(result.response || translations[currentLanguage].melfa_exec_error);
    }
}

async function updateStatus() {
    const res = await fetch('/read_robot');
    const data = await res.json();
    const indicator = document.getElementById('status-indicator');
    if (data.status) {
        indicator.className = "badge bg-success";
        indicator.textContent = translations[currentLanguage].connected;
    } else {
        indicator.className = "badge bg-danger";
        indicator.textContent = translations[currentLanguage].not_connected;
    }
}

setInterval(updateStatus, 3000);

async function updateCoordinates() {
    const res = await fetch('/coordinates');
    const data = await res.json();
    
    if (data.coordinates && !data.coordinates.includes("ERROR")) {
        document.getElementById('coordinates-display').textContent = parseRobotPosition(data.coordinates);
    } else {
        document.getElementById('coordinates-display').textContent = translations[currentLanguage].read_coordinates_error;
    }
}

async function readCoordinates() {
    fetch('/command', {
        method: 'POST',
        body: '1;1;PPOS',  // غيّر هذا حسب الأمر الفعلي للروبوت
        headers: {
            'Content-Type': 'text/plain'
        }
    })
    .then(res => res.json())
    .then(data => {
        const coordDisplay = document.getElementById("coordinates-display");
        if (data.status === "success") {
            coordDisplay.textContent = "RAW: " + data.response;
        } else {
            coordDisplay.textContent = "[HATA] " + data.message;
        }
    });
}

function updateRobotResponse(message) {
    const responseElement = document.getElementById('robot-response');
    responseElement.textContent = message;
}

// التحكم بالحركة المستمرة
let movementInterval;

function startMove(jogCommand) {
    let commandToSend = "1;1;" + jogCommand;

    sendCommand(commandToSend);

    movementInterval = setInterval(() => {
        sendCommand(commandToSend);
    }, 150);
}

function stopMove() {
    if (movementInterval) {
        clearInterval(movementInterval);
        movementInterval = null;
    }
    sendCommand('1;1;STOP');
}

// تغيير السرعة الفعلي باستخدام OVRD
document.getElementById('speed-select').addEventListener('change', () => {
    const speed = document.getElementById('speed-select').value;
    sendCommand('1;1;OVRD=' + speed);
});

// الوضع الليلي وتغيير اللغة
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');
});

const langSelect = document.getElementById('language-select');
langSelect.addEventListener('change', () => {
    changeLanguage(langSelect.value);
});

function changeLanguage(lang) {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = translations[lang][key] || key;
    });
}

const translations = {
    tr: {
        camera: "Kamera",
        controls: "Kontroller",
        connect: "Bağlantı Aç",
        disconnect: "Bağlantı Kapat",
        controller_on: "Controller Aç",
        servo_on: "Servo Aç",
        servo_off: "Servo Kapat",
        run_program: "Programı Başlat",
        stop: "Durdur",
        emergency_stop: "Acil Dur",
        reset: "Reset",
        movement: "Hareket Kontrolü",
        coordinates: "📌 Koordinatlar:",
        robot_response: "📥 Robot Yanıtı:",
        melfa_editor: "✍️ MELFA BASIC IV Editörü",
        read_coordinates_error: "Koordinatlar okunamadı",
        disconnect_success: "Bağlantı kesildi",
        melfa_exec_error: "MELFA kodu yürütülürken hata oluştu",
        no_connection: "⚠️ Robot ile bağlantı yok",
        connected: "Bağlı",
        not_connected: "Bağlantı yok",
        speed_slow_10: "Çok Yavaş (10%)",
        speed_slow_20: "Yavaş Hareket (20%)",
        speed_medium_50: "Orta Hız (50%)",
        speed_medium_75: "Hızlı Tepki (75%)",
        speed_fast_100: "Maksimum Hız (100%)",
        speed_select: "Hiz seçimi"
    },
    en: {
        camera: "Camera",
        controls: "Controls",
        connect: "Connect",
        disconnect: "Disconnect",
        controller_on: "Controller ON",
        servo_on: "Servo ON",
        servo_off: "Servo OFF",
        run_program: "Run Program",
        stop: "Stop",
        emergency_stop: "Emergency Stop",
        reset: "Reset",
        movement: "Movement Control",
        coordinates: "📌 Coordinates:",
        robot_response: "📥 Robot Response:",
        melfa_editor: "✍️ MELFA BASIC IV Editor",
        read_coordinates_error: "Error reading coordinates",
        disconnect_success: "Disconnected successfully",
        melfa_exec_error: "Error executing MELFA code",
        no_connection: "⚠️ No connection with robot",
        connected: "Connected",
        not_connected: "Disconnected",
        speed_slow_10: "Very Slow (10%)",
        speed_slow_20: "Slow Motion (20%)",
        speed_medium_50: "Normal Speed (50%)",
        speed_medium_75: "Fast Response (75%)",
        speed_fast_100: "Maximum Speed (100%)",
        speed_select: "Speed selection"
    },
    ar: {
        camera: "كاميرا",
        controls: "التحكم",
        connect: "اتصال",
        disconnect: "قطع الاتصال",
        controller_on: "تشغيل المتحكم",
        servo_on: "تشغيل السيرفو",
        servo_off: "إيقاف السيرفو",
        run_program: "تشغيل البرنامج",
        stop: "إيقاف",
        emergency_stop: "إيقاف الطوارئ",
        reset: "إعادة تعيين",
        movement: "التحكم في الحركة",
        coordinates: "📌 الإحداثيات:",
        robot_response: "📥 الرد من الروبوت:",
        melfa_editor: "✍️ محرر أكواد MELFA BASIC IV",
        read_coordinates_error: "خطأ في قراءة الإحداثيات",
        disconnect_success: "تم قطع الاتصال بنجاح",
        melfa_exec_error: "حدث خطأ أثناء تنفيذ كود MELFA",
        no_connection: "⚠️ لا يوجد اتصال مع الروبوت",
        connected: "متصل",
        not_connected: "غير متصل",
        speed_slow_10: "بطيء جدًا (10%)",
        speed_slow_20: "حركة بطيئة (20%)",
        speed_medium_50: "متوسط السرعة (50%)",
        speed_medium_75: "استجابة سريعة (75%)",
        speed_fast_100: "اقصى سرعة (100%)",
        speed_select: "اختيار السرعة"
    }
};