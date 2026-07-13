class SimpleDocTemplate:
    def __init__(self, buffer, **kwargs):
        self.buffer = buffer
    def build(self, story):
        # Write minimal PDF placeholder data
        pdf_data = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 50 >>\nstream\nBT /F1 12 Tf 72 712 Td (Certificado de Prueba - Entorno Local Sin Reportlab) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000212 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n312\n%%EOF\n"
        self.buffer.write(pdf_data)

class Paragraph:
    def __init__(self, text, style, **kwargs):
        pass

class Spacer:
    def __init__(self, width, height):
        pass

class Table:
    def __init__(self, data, **kwargs):
        pass
    def setStyle(self, style):
        pass

class TableStyle:
    def __init__(self, *args, **kwargs):
        pass

class Image:
    def __init__(self, stream, **kwargs):
        pass
