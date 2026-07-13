def getSampleStyleSheet():
    return {'Heading1': ParagraphStyle('Heading1'), 'Normal': ParagraphStyle('Normal')}

class ParagraphStyle:
    def __init__(self, name, parent=None, **kwargs):
        pass
