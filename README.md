# Melfa.Robot


1.	العربية – شرح مفصل:
عنوان المشروع: نظام واجهة ويب للتحكم في روبوت Mitsubishi MELFA
وصف المشروع: يهدف هذا المشروع إلى بناء نظام متكامل للتحكم في روبوت Mitsubishi MELFA عبر واجهة ويب تفاعلية باستخدام تقنيات حديثة مثل Flask، HTML، JavaScript وOpenCV. يوفر النظام وظائف متقدمة مثل التحكم في الحركة، تحميل وتشغيل البرامج، عرض الحالة الحالية للروبوت، التحكم بالإحداثيات، قراءة المواضع، وتشغيل كاميرا في الوقت الحقيقي. يتيح النظام للمستخدم التحكم الدقيق بالروبوت في الوضع المطلق والنسبي، ويعرض مؤشرات مرئية لحالة السيرفو، وحدة التحكم، ووضع التشغيل الفعلي (RUN).
المكونات الأساسية:
•	الواجهة الأمامية (Frontend):
o	HTML وBootstrap لعرض واجهة المستخدم.
o	JavaScript (main.js) للتحكم بالأوامر والتفاعل مع الخادم.
o	مؤشرات بصرية لحالة الاتصال، السيرفو، الكنترول، ووضع التشغيل.
•	الواجهة الخلفية (Backend):
o	Flask لإدارة التوجيهات واستقبال الأوامر.
o	OpenCV لعرض فيديو مباشر من الكاميرا.
o	melfa_client.py لإرسال واستقبال الأوامر من وإلى الروبوت عبر بروتوكول Ethernet.
•	وظائف أساسية:
o	الاتصال / قطع الاتصال بالروبوت.
o	إرسال أوامر تشغيل وتحريك مطلق/نسبي (EXECPCOSIROP / EXECJCOSIROP).
o	تحميل وتشغيل البرامج (PRGLOAD, RUN, NEW, LOAD, SAVE, RSTPRG).
o	قراءة المواضع (PPOSF)، عرضها أفقيًا.
o	قراءة واستقبال الأخطاء (ERROR, ERRORMES).
o	عرض حالة السيرفو و الكنترول بناءً على تحليل السطر الخامس من استجابة الروبوت.
o	دعم تعدد اللغات (تركي – إنجليزي – عربي).
2.	Turkish – Detaylı Açıklama:
Proje Adı: Mitsubishi MELFA Robotu İçin Web Tabanlı Kontrol Paneli
Proje Açıklaması: Bu proje, Mitsubishi MELFA robot kolunu uzaktan ve gerçek zamanlı olarak kontrol etmek amacıyla geliştirilen bir web arayüz sistemidir. Kullanıcılar robotu eklem koordinatlarıyla (joint-based) veya mutlak koordinatlarla (cartesian) hareket ettirebilir, program yükleyip çalıştırabilir, robot durumunu izleyebilir ve canlı kamera görüntüsü görebilirler. Sistem, Flask sunucusu, HTML arayüzü, JavaScript mantığı ve OpenCV kamerası ile entegre şekilde çalışır.
Temel Bileşenler:
•	Ön Yüz (Frontend):
o	HTML ve Bootstrap ile oluşturulmuş sezgisel kullanıcı arayüzü.
o	JavaScript (main.js) ile komutlar gönderilir ve sistemle etkileşim kurulur.
o	Servo durumu, kontrolcü durumu ve RUN durumu için görsel rozetler.
•	Arka Uç (Backend):
o	Flask tabanlı Python sunucusu.
o	Robot ile TCP/IP üzerinden bağlantı sağlayan melfa_client.py modülü.
o	OpenCV kullanarak gerçek zamanlı kamera akışı sunumu.
•	Ana Özellikler:
o	Robot ile bağlantı kurma ve kesme.
o	EXECPCOSIROP ve EXECJCOSIROP komutlarıyla mutlak/bağıl hareketler.
o	PRGLOAD, RUN, SAVE gibi komutlarla program yönetimi.
o	PPOSF komutu ile pozisyon okuma ve yatay biçimde gösterme.
o	Hataların alınması ve yorumlanması (ERROR, ERRORMES).
o	Beşinci satırdaki kod analiz edilerek servo ve kontrol durumu gösterimi.
o	Çoklu dil desteği (TR, EN, AR).
3.	English – Detailed Explanation:
Project Title: Web-Based Control Panel for Mitsubishi MELFA Robot
Project Description: This project presents a full-featured web interface system to control a Mitsubishi MELFA robot arm remotely. The system allows the user to move the robot using both joint-based and cartesian coordinates, load and execute robot programs, read current status, and view real-time video from a webcam. It uses a combination of Flask (Python backend), HTML/CSS (frontend), JavaScript for interaction, and OpenCV for video capture.
Key Components:
•	Frontend:
o	HTML + Bootstrap for user-friendly UI.
o	JavaScript (main.js) to send commands and manage UI state.
o	Visual indicators for connection, servo status, control status, and RUN status.
•	Backend:
o	Flask web server for handling HTTP requests.
o	melfa_client.py module for communicating with the robot via Ethernet.
o	OpenCV to serve live camera feed.
•	Main Features:
o	Connect/Disconnect the robot.
o	Send absolute and relative movement commands (EXECPCOSIROP / EXECJCOSIROP).
o	Program control: NEW, LOAD, PRGLOAD, SAVE, RUN, RSTPRG.
o	Position reading using PPOSF, parsed and displayed in horizontal format.
o	Error handling via ERROR and ERRORMES commands.
o	Servo and control state interpretation from the 5th line of robot response.
o	Multilingual support (Turkish, English, Arabic).


## Melfa Robot web based interface
- In order to operate you must


The first thing
```python
CD Melfa.Robot
```
The second matter
```python
python -m venv .venv
```
The third command, making sure to run the previous command and download the necessary files
```python
.venv\Scripts\Activate
```
The fourth matter
```python
pip install -r requirements.txt
```
The fifth matter
```python
python app.py
```

## To connect via Ethernet, you must change the connection settings and IP address from your own pc.
