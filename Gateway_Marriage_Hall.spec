# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_submodules

hidden_imports_list = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'core',
    'authentication',
    'venues',
    'bookings',
    'customers',
    'finance',
    'hallora_backend.wsgi',
    'seed_db',
    'decouple',
]

# Dynamically collect all submodules to avoid any missing hidden imports
hidden_imports_list += collect_submodules('rest_framework')
hidden_imports_list += collect_submodules('rest_framework_simplejwt')
hidden_imports_list += collect_submodules('corsheaders')
hidden_imports_list += collect_submodules('django_filters')
hidden_imports_list += collect_submodules('waitress')
hidden_imports_list += collect_submodules('whitenoise')

a = Analysis(
    ['server.py'],
    pathex=['backend'],
    binaries=[],
    datas=[('backend', 'backend')],
    hiddenimports=hidden_imports_list,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='Gateway_Marriage_Hall',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

