import http.server
import socketserver
import ssl
import os
import ipaddress

PORT = 8444
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Generate self-signed cert if not exists
cert_path = os.path.join(DIRECTORY, 'server.crt')
key_path = os.path.join(DIRECTORY, 'server.key')

if not os.path.exists(cert_path):
    from cryptography import x509
    from cryptography.x509.oid import NameOID
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    import datetime
    
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, "DE"),
        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Hessen"),
        x509.NameAttribute(NameOID.LOCALITY_NAME, "Langen"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Wipulscan"),
        x509.NameAttribute(NameOID.COMMON_NAME, "192.168.2.122"),
    ])
    cert = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        issuer
    ).public_key(
        key.public_key()
    ).serial_number(
        x509.random_serial_number()
    ).not_valid_before(
        datetime.datetime.utcnow()
    ).not_valid_after(
        datetime.datetime.utcnow() + datetime.timedelta(days=1)
    ).add_extension(
        x509.SubjectAlternativeName([x509.IPAddress(ipaddress.ip_address("192.168.2.122"))]),
        critical=False,
    ).sign(key, hashes.SHA256())
    
    with open(key_path, "wb") as f:
        f.write(key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption()
        ))
    with open(cert_path, "wb") as f:
        f.write(cert.public_bytes(serialization.Encoding.PEM))
    print("Self-signed certificate generated")

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain(cert_path, key_path)

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
    print(f"HTTPS Server running on https://192.168.2.122:{PORT}")
    httpd.serve_forever()
