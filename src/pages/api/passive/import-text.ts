import type { APIRoute } from 'astro';
import { passiveVocabService } from '../../../services/passive.service';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({ error: 'Content-Type must be application/json' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const text = body.text;
    const language = body.language || 'es';

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'El campo "text" es obligatorio y debe ser un texto válido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const summary = passiveVocabService.importFromText(text, language);

    return new Response(
      JSON.stringify({
        success: true,
        ...summary,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
