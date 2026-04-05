/**
 * Elimina del bucket imágenes que no estén referenciadas en la tabla novedades.
 * Ejecutar: node scripts/cleanup-orphan-images.js
 * Agregar --dry-run para solo ver qué se eliminaría sin borrar nada.
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supa = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = 'novedades';
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  if (DRY_RUN) console.log('[DRY RUN] No se eliminará nada.\n');

  // 1. Obtener todos los archivos del bucket
  const { data: files, error: listError } = await supa.storage
    .from(BUCKET)
    .list('imagenes', { limit: 1000 });

  if (listError) { console.error(listError.message); process.exit(1); }

  // 2. Obtener todas las URLs referenciadas en la DB
  const { data: novedades, error: dbError } = await supa
    .from('novedades')
    .select('imagen_url')
    .is('deleted_at', null)
    .not('imagen_url', 'is', null);

  if (dbError) { console.error(dbError.message); process.exit(1); }

  const referencedNames = new Set(
    novedades.map(n => n.imagen_url.split('/').pop())
  );

  // 3. Encontrar huérfanos
  const orphans = files.filter(f => !referencedNames.has(f.name));

  if (orphans.length === 0) {
    console.log('No hay archivos huérfanos.');
    return;
  }

  console.log(`Huérfanos encontrados: ${orphans.length}\n`);
  orphans.forEach(f => {
    const kb = (f.metadata?.size / 1024).toFixed(1);
    console.log(`  ${f.name}  (${kb} KB)`);
  });

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Pasá sin --dry-run para eliminarlos.');
    return;
  }

  // 4. Eliminar
  const paths = orphans.map(f => `imagenes/${f.name}`);
  const { error: deleteError } = await supa.storage.from(BUCKET).remove(paths);

  if (deleteError) {
    console.error('\nError al eliminar:', deleteError.message);
    process.exit(1);
  }

  const totalKb = orphans.reduce((acc, f) => acc + (f.metadata?.size ?? 0), 0) / 1024;
  console.log(`\n✓ ${orphans.length} archivo(s) eliminado(s) — ${totalKb.toFixed(1)} KB liberados.`);
}

main();
