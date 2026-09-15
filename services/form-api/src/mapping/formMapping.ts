export function formPayload(data) {
  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    banner: data.banner,
    access_type: data.access_type,
    token: {
      token_respon: data.token_respon,
      token_collab: data.token_collab
    },
    kategori: {
      primary_kategori: data.primary_kategori,
      sub_kategori: data.sub_kategori
    },
    setting: {
      status: data.status,
      theme_color: data.theme_color,
      start_at: data.start_at,
      duration: data.duration,
      is_random: data.is_random
    }
  }
}