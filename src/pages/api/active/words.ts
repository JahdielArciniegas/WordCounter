import type { APIRoute } from 'astro';
import { activeVocabService } from '../../../services/active.service';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const q = url.searchParams.get('q') || undefined;
    const language = url.searchParams.get('language') || 'es';
    const limitParam = url.searchParams.get('limit');
    const offsetParam = url.searchParams.get('offset');
    const sortParam = url.searchParams.get('sort');

    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 500) : 50;
    const offset = offsetParam ? Math.max(parseInt(offsetParam, 10) || 0, 0) : 0;
    const sort = (sortParam === 'date_desc' || sortParam === 'alpha') ? sortParam : 'occurrences_desc';

    const result = activeVocabService.getActiveWords({
      query: q,
      language,
      limit,
      offset,
      sort,
    });

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Error al obtener palabras activas' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
