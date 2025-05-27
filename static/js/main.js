let currentLanguage = 'tr'; // اللغة الافتراضية

async function sendCommand(cmd) {
    const formData = new FormData();
    formData.append('command', cmd);

    const response = await fetch('/send', {
        method: 'POST',
        body: formData
    });

    const result = await response.json();
    const message = result.response || translations[currentLanguage]?.no_connection || "NO RESPONSE";

    // توجيه الرد حسب نوع الأمر
        if (cmd.includes("PPOS") || cmd.includes("VAL=") || message.includes("P1=")) {
        document.getElementById('coordinates-display').textContent = parseRobotPosition(message);
    } else if (
        cmd.includes("PRGUP") ||
        cmd.includes("PRGLOAD") ||
        message.toLowerCase().includes("program") ||
        message.includes(".MRP") || message.includes(".mrp")
    ) {
        document.getElementById("program-list").value = message;
    } else {
        updateRobotResponse(message);
    }
}

function parseRobotPosition(data) {
  const lines = data.split(/[\r\n;]+/).map(s => s.trim()).filter(s => s.length > 0);

  const coords = {};
  let key = null;

  for (let i = 0; i < lines.length; i++) {
    const val = lines[i];

    if (val.includes("X") && !coords["X"]) {
      key = "X";
    } else if (["Y", "Z", "A", "B", "C"].includes(val)) {
      key = val;
    } else if (key) {
      coords[key] = val;
      key = null;
    }
  }

  const formatted = ["X", "Y", "Z", "A", "B", "C"]
    .filter(k => coords[k] !== undefined)
    .map(k => `${k}: ${coords[k]}`)
    .join("  |  ");

  return formatted || data;
}

async function sendCntlOff() {
  await sendCommand("1;1;CNTLOFF");
}

async function connectRobot() {
    await sendCommand('1;1;OPEN=WEBCLIENT');

    // بعد الاتصال الناجح، إعادة تفعيل الأزرار
    enableAllControls();
}

function enableAllControls() {
    const allButtons = document.querySelectorAll("button");
    allButtons.forEach(btn => {
        btn.disabled = false;
        btn.classList.remove("disabled");
    });
}


async function disconnectRobot() {
    const response = await fetch('/disconnect');
    const data = await response.json();
    if (data.status === 'disconnected') {
        updateRobotResponse(translations[currentLanguage].disconnect_success);
        document.getElementById('status-indicator').className = "badge bg-danger";
        document.getElementById('status-indicator').innerText  = translations[currentLanguage].not_connected;

        disableAllControlsExceptConnect();
    }
}

function disableAllControlsExceptConnect() {
    const allButtons = document.querySelectorAll("button");
    allButtons.forEach(btn => {
        const isConnectButton = btn.getAttribute("onclick") === "connectRobot()";
        btn.disabled = !isConnectButton;
        btn.classList.toggle("disabled", !isConnectButton);
    });
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
  const indicator = document.getElementById('status-indicator');
  const servoIndicator = document.getElementById('servo-indicator');
  const controlIndicator = document.getElementById('control-indicator');
  const runIndicator = document.getElementById('run-indicator');

  try {
    const res = await fetch('/read_robot');
    const data = await res.json();

    if (data.status) {
      indicator.className = "badge bg-success";
      indicator.innerText = translations[currentLanguage].connected;

      // تحليل الأسطر
      const lines = data.status.split(/[\r\n;]+/).map(line => line.trim());
      const codeLine = lines[4] || "";
      const firstChar = codeLine.charAt(0).toUpperCase();

      let isControlOn = false;
      let isServoOn = false;
      let isRunning = false;

      // تفسير الحالة
      if (["A", "E"].includes(firstChar)) {
        isControlOn = true;
        isServoOn = true;
      } else if (firstChar === "2") {
        isControlOn = false;
        isServoOn = true;
      } else if (firstChar === "8") {
        isControlOn = true;
        isServoOn = false;
      } else if (firstChar === "0") {
        isControlOn = false;
        isServoOn = false;
      }

      // تحقق من وجود "RUN" في الأسطر الأخيرة
      const lastLines = lines.slice(-4).join(" ");
      if (firstChar === "E" || lastLines.includes("RUN")) {
        isRunning = true;
      }

      // تحديث واجهة Servo
      if (servoIndicator) {
        servoIndicator.className = "badge rounded-pill " + (isServoOn ? "bg-success" : "bg-secondary");
        servoIndicator.innerText = isServoOn ? "Servo ON" : "Servo OFF";
      }

      // تحديث واجهة Control
      if (controlIndicator) {
        controlIndicator.className = "badge rounded-pill " + (isControlOn ? "bg-success" : "bg-secondary");
        controlIndicator.innerText = isControlOn ? "Control ON" : "Control OFF";
      }

      // تحديث واجهة RUN
      if (runIndicator) {
        runIndicator.className = "badge rounded-pill " + (isRunning ? "bg-success" : "bg-secondary");
        runIndicator.innerText = isRunning ? "RUNNING" : "IDLE";
      }

    } else {
      indicator.className = "badge bg-danger";
      indicator.innerText = translations[currentLanguage].not_connected;

      if (servoIndicator) servoIndicator.className = "badge bg-secondary", servoIndicator.innerText = "Servo ?";
      if (controlIndicator) controlIndicator.className = "badge bg-secondary", controlIndicator.innerText = "Control ?";
      if (runIndicator) runIndicator.className = "badge bg-secondary", runIndicator.innerText = "RUN ?";
    }

  } catch (err) {
    indicator.className = "badge bg-danger";
    indicator.innerText = "⛔ Error";

    if (servoIndicator) servoIndicator.className = "badge bg-secondary", servoIndicator.innerText = "Servo ?";
    if (controlIndicator) controlIndicator.className = "badge bg-secondary", controlIndicator.innerText = "Control ?";
    if (runIndicator) runIndicator.className = "badge bg-secondary", runIndicator.innerText = "RUN ?";
  }
}



setInterval(updateStatus, 3000);

async function updateCoordinates() {
    const res = await fetch('/coordinates');
    const data = await res.json();
    
    if (data.coordinates && !data.coordinates.includes("ERROR")) {
        document.getElementById('coordinates-display').innerText  = parseRobotPosition(data.coordinates);
    } else {
        document.getElementById('coordinates-display').innerText  = translations[currentLanguage].read_coordinates_error;
    }
}



async function readCoordinates() {
  try {
    const res = await fetch('/command', {
      method: 'POST',
      body: '1;1;PPOSF',
      headers: {
        'Content-Type': 'text/plain'
      }
    });

    const data = await res.json();
    const coordDisplay = document.getElementById("coordinates-display");

    if (data.status === "success") {
      const formatted = parseRobotPosition(data.response);
      coordDisplay.textContent = formatted;
    } else {
      coordDisplay.textContent = "[HATA] " + data.message;
    }
  } catch (err) {
    document.getElementById("coordinates-display").textContent = "❌ حدث خطأ أثناء جلب الإحداثيات";
  }
}


function updateRobotResponse(message) {
    document.getElementById('robot-response').innerText = message;
}
// قراءة البرامج من الروبوت (مثلاً باستخدام PDIRTOP أو PRGUP)
// قراءة البرامج من الروبوت أو تنفيذ أوامر إضافية مثل SLOTINIT و PRGRD
async function fetchPrograms(mode) {
  let command;

  if (mode === "PRGUP") {
    command = "1;1;PRGUP";
  } else if (mode === "SLOTINIT") {
    command = "1;1;SLOTINIT";
  } else if (mode === "PRGRD") {
    command = "1;1;PRGRD";
  } else {
    const programId = document.getElementById("load-program-id")?.value.trim() || "333";
    command = `1;1;PRGLOAD=${programId}`;
  }

  const formData = new FormData();
  formData.append("command", command);

  const response = await fetch("/send", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();
  document.getElementById("program-list").value =
    result.response || translations[currentLanguage]?.no_programs_found || "لا توجد برامج";
}


// تشغيل برنامج محدد بالاسم
async function runProgram() {
    const name = document.getElementById("program-name").value.trim();
    if (!name) {
        updateRobotResponse("⚠️ يرجى كتابة اسم البرنامج.");
        return;
    }
    await sendCommand(`1;1;RUN${name};1`);
}
/// جمع الإحداثيات من الإدخالات X, Y, Z, A, B
async function sendMixedMove(mode) {
  const angles = {
    waist: parseFloat(document.getElementById("coord-waist").value) || 0,
    shoulder: parseFloat(document.getElementById("coord-shoulder").value) || 0,
    elbow: parseFloat(document.getElementById("coord-elbow").value) || 0,
    pitch: parseFloat(document.getElementById("coord-pitch").value) || 0,
    roll: parseFloat(document.getElementById("coord-roll").value) || 0
  };

  const formData = new FormData();
  formData.append("mode", mode);
  for (const [key, val] of Object.entries(angles)) {
    formData.append(key, val);
  }

  try {
    const response = await fetch("/move_mix", {
      method: "POST",
      body: formData
    });

    const result = await response.json();
    updateRobotResponse(result.response || "⛔ لا يوجد رد من الروبوت");
  } catch (e) {
    updateRobotResponse("❌ خطأ في التحريك");
  }
}



// زر إعادة الإنذار
async function resetArmAlarm() {
  const response = await fetch("/reset_alarm");
  const result = await response.json();
  updateRobotResponse(result.response || "⛔ لم يتم استلام رد من الروبوت.");
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
        el.innerText  = translations[lang][key] || key;
    });
}
async function createNewProgram() {
  const name = document.getElementById("new-program-name").value.trim();
  const output = document.getElementById("melfa-create-response");

  if (!name) {
    output.textContent = "⚠️ يرجى إدخال اسم البرنامج";
    return;
  }

  try {
    // ثم LOAD باسم
    const loadRes = await sendAndReturn(`1;1;LOAD=${name}`);
    output.textContent += `📥 LOAD=${name}\n${loadRes}`;
  } catch (e) {
    output.textContent = `❌ خطأ: ${e}`;
  }
}

async function listProgramSlots() {
  const output = document.getElementById("melfa-create-response");
  try {
    const res = await sendAndReturn("1;9;LISTL<");
    output.textContent = `📜 LISTL\n${res}`;
  } catch (e) {
    output.textContent = `❌ خطأ: ${e}`;
  }
}

async function saveProgram() {
  const output = document.getElementById("melfa-create-response");
  try {
    const res = await sendAndReturn("1;1;SAVE");
    output.textContent = `💾 SAVE\n${res}`;
  } catch (e) {
    output.textContent = `❌ خطأ أثناء الحفظ: ${e}`;
  }
}


// دالة مساعدة ترسل الأمر وتعيد الرد كسلسلة
async function sendAndReturn(cmd) {
  const formData = new FormData();
  formData.append('command', cmd);

  const response = await fetch('/send', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  return result.response || "لا يوجد رد من الروبوت";
}

async function sendCustomCode() {
  const code = document.getElementById("custom-code-input").value.trim();
  const responseBox = document.getElementById("custom-code-response");

  if (!code) {
    responseBox.textContent = "⚠️ الرجاء إدخال كود.";
    return;
  }

  try {
    const formData = new FormData();
    formData.append("command", code);

    const response = await fetch("/send", {
      method: "POST",
      body: formData
    });

    const result = await response.json();
    responseBox.textContent = result.response || "⛔ لا يوجد رد";
  } catch (err) {
    responseBox.textContent = "❌ خطأ في الاتصال بالخادم.";
  }
}
async function resetProgram() {
  const output = document.getElementById("melfa-create-response");
  try {
    const res = await sendAndReturn("1;1;RSTPRG");
    output.textContent = `🗑️ RSTPRG\n${res}`;
  } catch (e) {
    output.textContent = `❌ خطأ أثناء إعادة التعيين: ${e}`;
  }
}
let lastErrorRaw = "";  // لتخزين آخر رد خام من الأمر ERROR

async function readLastError() {
  try {
    const res = await sendAndReturn("1;1;ERROR");
    lastErrorRaw = res || "";
    updateRobotResponse(`📋 ERROR:\n${lastErrorRaw}`);
  } catch (e) {
    updateRobotResponse("❌ فشل في قراءة الخطأ");
  }
}

async function sendErrorMessage() {
  if (!lastErrorRaw) {
    updateRobotResponse("⚠️ لا يوجد رد خطأ سابق لإرساله.");
    return;
  }

  // تنظيف الرد: حذف Qok وكل شيء بعد أول فاصلة منقوطة ;
  const cleanMessage = lastErrorRaw.replace(/^Qok/i, '').split(';')[0].trim();

  try {
    const command = `1;1;ERRORMES${cleanMessage}`;
    const res = await sendAndReturn(command);
    updateRobotResponse(`📩 ERRORMES sent:\n${command}\n\n✅ الرد:\n${res}`);
  } catch (e) {
    updateRobotResponse("❌ فشل في إرسال رسالة الخطأ.");
  }
}

// دالة sendAndReturn المساعدة
async function sendAndReturn(cmd) {
  const formData = new FormData();
  formData.append("command", cmd);

  const response = await fetch("/send", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();
  return result.response || "⛔ لا يوجد رد من الروبوت";
}

async function sendListP(direction) {
  const output1 = document.getElementById("melfa-create-response");
  const output2 = document.getElementById("coordinates-display");
  const cmd = direction === "-1" ? "1;1;LISTP-1" : "1;1;LISTP+1";

  try {
    const res = await sendAndReturn(cmd);
    const message = `📜 ${cmd}\n${res}`;

    // عرض الرسالة الكاملة في المربع الأول
    if (output1) output1.textContent = message;

    // استخراج الإحداثيات فقط للمربع الثاني
    const match = res.match(/\(([^)]+)\)/);  // استخراج القيم داخل أول ()
    let formatted = "";

    if (match) {
      const values = match[1].split(',').map(v => v.trim());
      if (values.length >= 6) {
        formatted = `X: ${values[0]}  |  Y: ${values[1]}  |  Z: ${values[2]}  |  A: ${values[3]}  |  B: ${values[4]}  |  C: ${values[5]}`;
      } else {
        formatted = "⚠️ قيم الإحداثيات غير مكتملة";
      }
    } else {
      formatted = "⚠️ لم يتم العثور على إحداثيات";
    }

    if (output2) output2.textContent = formatted;

  } catch (e) {
    const errorMsg = `❌ خطأ أثناء تنفيذ ${cmd}: ${e}`;
    if (output1) output1.textContent = errorMsg;
    if (output2) output2.textContent = errorMsg;
  }
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