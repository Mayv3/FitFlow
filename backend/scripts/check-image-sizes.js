import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supa = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = 'novedades';

async function main() {
  const { data, error } = await supa.storage
    .from(BUCKET)
    .list('imagenes', { limit: 1000 });

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No hay imágenes en el bucket.');
    return;
  }

  const files = data
    .filter(f => f.metadata?.size != null)
    .sort((a, b) => b.metadata.size - a.metadata.size);

  let totalBytes = 0;

  console.log('\nArchivo                                          | Tamaño');
  console.log('-'.repeat(65));

  for (const f of files) {
    const kb = (f.metadata.size / 1024).toFixed(1);
    const label = kb >= 1000
      ? `${(f.metadata.size / 1024 / 1024).toFixed(2)} MB`
      : `${kb} KB`;
    console.log(`${f.name.padEnd(48)} | ${label}`);
    totalBytes += f.metadata.size;
  }

  console.log('-'.repeat(65));
  const totalKb = totalBytes / 1024;
  const total = totalKb >= 1000
    ? `${(totalKb / 1024).toFixed(2)} MB`
    : `${totalKb.toFixed(1)} KB`;
  console.log(`Total: ${files.length} archivo(s)  →  ${total}\n`);
}

main();
