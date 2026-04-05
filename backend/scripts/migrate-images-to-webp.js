/**
 * Script de migración: convierte imágenes existentes en Supabase a WebP
 *
 * Uso: node scripts/migrate-images-to-webp.js
 *
 * Por cada novedad con imagen_url:
 *  1. Descarga la imagen original
 *  2. La convierte a WebP con sharp
 *  3. Sube el nuevo archivo .webp al bucket
 *  4. Actualiza imagen_url en la base de datos
 *  5. Elimina el archivo original del bucket
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import crypto from 'crypto';

const supa = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = 'novedades';

async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar: ${url} (${res.status})`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function getStoragePathFromUrl(url) {
  // La URL pública tiene el formato:
  // https://<project>.supabase.co/storage/v1/object/public/novedades/imagenes/xxx.ext
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

async function migrateNovedad(novedad) {
  const { id, imagen_url } = novedad;

  if (!imagen_url) return;

  // Si ya es webp, saltar
  if (imagen_url.endsWith('.webp')) {
    console.log(`  [${id}] Ya es WebP, se omite.`);
    return;
  }

  console.log(`  [${id}] Procesando: ${imagen_url}`);

  // 1. Descargar
  const originalBuffer = await downloadImage(imagen_url);

  // 2. Convertir a WebP
  const webpBuffer = await sharp(originalBuffer)
    .webp({ quality: 85 })
    .toBuffer();

  // 3. Subir nuevo archivo
  const newFileName = `${crypto.randomUUID()}.webp`;
  const newFilePath = `imagenes/${newFileName}`;

  const { error: uploadError } = await supa.storage
    .from(BUCKET)
    .upload(newFilePath, webpBuffer, {
      contentType: 'image/webp',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = supa.storage
    .from(BUCKET)
    .getPublicUrl(newFilePath);

  const newUrl = urlData.publicUrl;

  // 4. Actualizar DB
  const { error: updateError } = await supa
    .from('novedades')
    .update({ imagen_url: newUrl })
    .eq('id', id);

  if (updateError) throw updateError;

  // 5. Eliminar archivo original del bucket
  const oldPath = getStoragePathFromUrl(imagen_url);
  if (oldPath) {
    const { error: deleteError } = await supa.storage
      .from(BUCKET)
      .remove([oldPath]);
    if (deleteError) {
      console.warn(`  [${id}] No se pudo eliminar el original: ${deleteError.message}`);
    }
  }

  console.log(`  [${id}] OK → ${newUrl}`);
}

async function main() {
  console.log('Iniciando migración de imágenes a WebP...\n');

  const { data: novedades, error } = await supa
    .from('novedades')
    .select('id, imagen_url')
    .is('deleted_at', null)
    .not('imagen_url', 'is', null);

  if (error) {
    console.error('Error al obtener novedades:', error.message);
    process.exit(1);
  }

  console.log(`${novedades.length} novedad(es) con imagen encontradas.\n`);

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const novedad of novedades) {
    try {
      if (novedad.imagen_url?.endsWith('.webp')) {
        skipped++;
      } else {
        await migrateNovedad(novedad);
        ok++;
      }
    } catch (err) {
      failed++;
      console.error(`  [${novedad.id}] ERROR: ${err.message}`);
    }
  }

  console.log('\n--- Resultado ---');
  console.log(`  Convertidas: ${ok}`);
  console.log(`  Ya eran WebP: ${skipped}`);
  console.log(`  Errores:    ${failed}`);
  console.log('\nMigración finalizada.');
}

main();
