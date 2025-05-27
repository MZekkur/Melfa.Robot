import socket

class MelfaEthernetClient:
    def __init__(self, ip='192.168.0.1', port=10001):
        self.ip = ip
        self.port = port
        self.sock = None

    def connect(self):
        try:
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.sock.settimeout(5)
            self.sock.connect((self.ip, self.port))
            print("[✔] تم الاتصال بالروبوت")
            return True
        except Exception as e:
            print(f"[خطأ الاتصال] {e}")
            return False

# إعداد الرسائل 

    def send_command(self, command: str) -> str:
        try:
            if not self.sock:
                raise Exception("غير متصل بالروبوت")
            full_command = command.strip() + '\n'
            self.sock.sendall(full_command.encode())
            response = self.sock.recv(4096).decode().strip()

            # تنسيق الرد على شكل أسطر
            response = response.replace('\r', '\n').replace(';', ';\n')

            return response
        except Exception as e:
            return f"[خطأ إرسال] {e}"


    def close(self):
        if self.sock:
            self.sock.close()
            self.sock = None
            print("[✖] تم قطع الاتصال")

    def is_connected(self):
        return self.sock is not None
    
    def ensure_connection(self):
        if not self.is_connected():
            raise ConnectionError("الروبوت غير متصل. يرجى الاتصال أولًا.")

    def format_command(self, cmd):
        return f"1;1;{cmd}"
   # أوامر مساعدة
    def get_cartesian_position(self):
        return self.send_command("PPOS")

    def get_joint_angles(self):
        return self.send_command("JPOS")

    def servo_on(self):
        return self.send_command("SRVON")

    def servo_off(self):
        return self.send_command("SRVOFF")

    def run_program(self, program_name):
        return self.send_command("RUN")

    def execute_melfa_code(self, code):
        return self.send_command(f"EXEC2={code}")

    def reset_alarm(self):
        return self.send_command("RSTALRM")

    def emergency_stop(self):
        return self.send_command("STOP")