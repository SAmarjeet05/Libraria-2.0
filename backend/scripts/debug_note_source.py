import inspect
import app.models.notes as mod
print('module file:', mod.__file__)
print('source snippet:')
print('\n'.join(inspect.getsource(mod).splitlines()[:200]))
