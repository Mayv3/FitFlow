@echo off
title Gymspace - WhatsApp Recordatorios
echo ================================
echo 🚀 Iniciando servicio Gymspace...
echo ================================

REM Ir a la carpeta del backend
cd /d "C:\Users\nicop\OneDrive\Desktop\gymspace\backend"

REM Ejecutar el script con Node
call node services\whatsappReminderService.js

REM Finalizar sin pausar
exit