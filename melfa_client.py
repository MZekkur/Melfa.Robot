import socket

class MelfaEthernetClient:
    def __init__(self, ip='192.168.0.1', port=10001):
        self.ip = ip
        self.port = port
        self.sock = None

    def connect(self):
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.settimeout(5)
        self.sock.connect((self.ip, self.port))

    def send_command(self, command: str) -> str:
        if not self.sock:
            raise Exception("Socket not connected")
        full_command = command.strip() + '\n'
        self.sock.sendall(full_command.encode())
        return self.sock.recv(4096).decode().strip()

    def close(self):
        if self.sock:
            self.sock.close()
            self.sock = None
