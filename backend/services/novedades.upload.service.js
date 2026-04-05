import crypto from 'crypto';
import sharp from 'sharp';

export async function uploadNovedadImageSvc({ supa, file }) {
  const webpBuffer = await sharp(file.buffer)
    .webp({ quality: 85 })
    .toBuffer();

  const fileName = `${crypto.randomUUID()}.webp`;
  const filePath = `imagenes/${fileName}`;

  const { error } = await supa.storage
    .from('novedades')
    .upload(filePath, webpBuffer, {
      contentType: 'image/webp',
      upsert: false,
    });

  if (error) throw error;

  const { data } = supa.storage
    .from('novedades')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
