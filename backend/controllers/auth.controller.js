import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabase } from '../db/supabaseClient.js'

export async function login(req, res) {
  const { dni, password } = req.body;

  if (!dni || !password) {
    return res.status(400).json({ error: 'DNI y contraseña son requeridos' });
  }
  console.log("DNI recibido en backend:", dni);
  console.log("🔍 Buscando usuario con DNI:", dni);

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("dni", String(dni).trim())
    .single();

  if (error || !user) {
    console.log("❌ Usuario no encontrado");
    return res.status(401).json({ error: "Usuario no encontrado" });
  }

  console.log("✅ Usuario encontrado:", user.email);

  const { data: roleData, error: roleError } = await supabase
    .from("roles")
    .select("name")
    .eq("id", user.role_id)
    .single();

  if (roleError || !roleData) {
    console.log("❌ Error obteniendo el rol:", roleError);
    return res.status(500).json({ error: "No se pudo obtener el rol del usuario" });
  }

  console.log("🔑 Comparando contraseña...");

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    console.log("❌ Contraseña incorrecta");
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  console.log("✅ Contraseña válida. Generando token...");

  const token = jwt.sign(
    {
      id: user.id,
      dni: user.dni,
      role: roleData.name,
      gym_id: user.gym_id,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  console.log("🟢 Login exitoso para:", user.dni);

  res.json({
    token,
    user: {
      dni: user.dni,
      rol: roleData.name,
    },
  });
}
