-- Migración: agregar columnas de WhatsApp a la tabla gyms
-- Correr en: Supabase SQL Editor → proyecto FitFlow
-- Fecha: 2026-04-13

ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS whatsapp_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS evolution_instance_name text,
  ADD COLUMN IF NOT EXISTS evolution_api_url text;
