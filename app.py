from flask import Flask, render_template, request, Response, redirect, url_for, jsonify
from melfa_client import MelfaEthernetClient
import cv2

app = Flask(__name__)

# إعداد الروبوت
robot = MelfaEthernetClient()

# إنشاء كائن الروبوت
robot = MelfaEthernetClient(ip='192.168.0.1', port=10001)  # غيّر IP و PORT حسب الروبوت

# إعداد الكاميرا
camera = cv2.VideoCapture(0)

def gen_frames():
    while True:
        success, frame = camera.read()
        if not success:
            break
        else:
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/command', methods=['POST'])
def handle_command():
    command = request.get_data(as_text=True)
    try:
        if not robot.is_connected():
            connected = robot.connect()
            if not connected:
                return jsonify({'status': 'error', 'message': 'فشل الاتصال بالروبوت'})

        response = robot.send_command(command)
        return jsonify({'status': 'success', 'response': response})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})



@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/send', methods=['POST'])
def send():
    cmd = request.form.get('command')
    if cmd:
        try:
            if not robot.sock:
                robot.connect()
            response = robot.send_command(cmd)
        except Exception as e:
            response = f"Error: {e}"
        return jsonify({'response': response})
    return jsonify({'response': 'No command received'})

@app.route('/disconnect')
def disconnect():
    try:
        robot.close()
        return jsonify({'status': 'disconnected'})
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/programs')
def get_programs():
    try:
        if not robot.sock:
            robot.connect()
        response = robot.send_command("1;1;PDIRTOP")
        return jsonify({'programs': response})
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/melfa_exec', methods=['POST'])
def melfa_exec():
    code = request.form.get('melfa_code')
    if code:
        try:
            if not robot.sock:
                robot.connect()
            response = robot.send_command(f"1;1;EXEC2={code}")
            return jsonify({'response': response})
        except Exception as e:
            return jsonify({'error': str(e)})
    return jsonify({'error': 'No code provided'})

@app.route('/coordinates', methods=['GET'])
def coordinates():
    try:
        if not robot.sock:
            robot.connect()
        res = robot.send_command("1;1;PPOS")
        return jsonify({'coordinates': res})
    except Exception as e:
        return jsonify({'error': str(e)})


@app.route('/read_robot', methods=['GET'])
def read_robot():
    try:
        if not robot.sock:
            robot.connect()
        response = robot.send_command("1;1;STATE")
        return jsonify({'status': response})
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
