from flask import Flask, render_template, request, Response, redirect, url_for, jsonify
from melfa_client import MelfaEthernetClient
import cv2

app = Flask(__name__)



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
            return jsonify({'response': response})
        except Exception as e:
            return jsonify({'response': f"Error: {e}"})
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
            response = robot.send_command(f"1;9;EXEC{code}")
            return jsonify({'response': response})
        except Exception as e:
            return jsonify({'error': str(e)})
    return jsonify({'error': 'No code provided'})

@app.route("/move_mix", methods=["POST"])
def move_mix():
    try:
        if not robot.sock:
            robot.connect()

        mode = request.form.get("mode", "ABS")
        delta = {
            "waist": float(request.form.get("waist", 0.0)),
            "shoulder": float(request.form.get("shoulder", 0.0)),
            "elbow": float(request.form.get("elbow", 0.0)),
            "pitch": float(request.form.get("pitch", 0.0)),
            "roll": float(request.form.get("roll", 0.0)),
        }

        if mode == "ABS":
            # ⬅️ تحريك كارتزي (EXECPCOSIROP)
            result = [
                delta["waist"],
                delta["shoulder"],
                delta["elbow"],
                delta["pitch"],
                delta["roll"]
            ]
            position = f"( {result[0]:.2f}, {result[1]:.2f}, {result[2]:.2f}, {result[3]:.2f}, {result[4]:.2f}, 0.00)(6,0)"
            cmds = [
                f"EXECPCOSIROP = {position}",
                "EXECMOV PCOSIROP"
            ]
        else:
            # ⬅️ تحريك نسبي بالمفاصل (EXECJCOSIROP)
            result = [
                delta["waist"],
                delta["shoulder"],
                delta["elbow"],
                delta["pitch"],
                delta["roll"]
            ]
            position = f"( {result[0]:.3f}, {result[1]:.3f}, {result[2]:.3f}, {result[3]:.3f}, {result[4]:.3f} )"
            cmds = [
                f"EXECJCOSIROP = {position}",
                "EXECMOV JCOSIROP"
            ]

        response = "\n".join([robot.send_command(f"1;1;{cmd}") for cmd in cmds])
        return jsonify({"response": response})

    except Exception as e:
        return jsonify({"response": f"❌ استثناء: {str(e)}"})

@app.route("/reset_alarm", methods=["GET"])
def reset_alarm():
    try:
        if not robot.sock:
            robot.connect()
        cmds = [
            "CNTLOFF",
            "RSTALRM",
            "SRVON",
            "STATE",
            "CNTLON"
        ]
        response = "\n".join([robot.send_command(f"1;1;{cmd}") for cmd in cmds])
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"response": f"❌ خطأ أثناء إعادة الضبط: {str(e)}"})


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
