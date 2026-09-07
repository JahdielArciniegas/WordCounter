import type { APIRoute } from 'astro';
import { activeVocabService } from '../../services/active.service';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const language = url.searchParams.get('language') || 'es';
    const stats = activeVocabService.getStats(language);

    return new Response(
      JSON.stringify(stats),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Error al obtener estadísticas globales' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
