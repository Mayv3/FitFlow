import crypto from 'crypto';

export async function uploadNovedadImageSvc({ supa, file }) {
  const ext = file.originalname.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const filePath = `imagenes/${fileName}`;

  const { error } = await supa.storage
    .from('novedades')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) throw error;

  const { data } = supa.storage
    .from('novedades')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
