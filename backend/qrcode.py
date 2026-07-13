class QRCode:
    def __init__(self, *args, **kwargs):
        pass
    def add_data(self, data):
        pass
    def make(self, *args, **kwargs):
        pass
    def make_image(self, *args, **kwargs):
        return DummyImage()

class DummyImage:
    def save(self, stream, format=None):
        # Write a dummy 1x1 png pixel
        stream.write(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82')

def make(*args, **kwargs):
    return DummyImage()
