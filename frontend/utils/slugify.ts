export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .normalize('NFD') // Normaliza caracteres especiales
        .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos (á -> a, ñ -> n)
        .replace(/\s+/g, '-') // Reemplaza espacios con guiones
        .replace(/[^\w\-]+/g, '') // Elimina caracteres especiales
        .replace(/\-\-+/g, '-') // Reemplaza múltiples guiones con uno solo
        .replace(/^-+/, '') // Elimina guiones al inicio
        .replace(/-+$/, '') // Elimina guiones al final
}

export function unslugify(slug: string): string {
    return slug
        .replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}
