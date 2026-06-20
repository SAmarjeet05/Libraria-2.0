from app.models.notes import Note
print('Columns:', [c.name for c in Note.__table__.columns])
print('Attrs dir contains file_name:', 'file_name' in dir(Note))
