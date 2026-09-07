import type { APIRoute } from 'astro';
import { activeVocabService } from '../../../services/active.service';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    let text = '';
    let language = 'es';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      text = body.text;
      language = body.language || 'es';
    } else {
      text = await request.text();
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Debes proporcionar un texto válido para analizar' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const summary = activeVocabService.analyzeAndIngestText(text, language);

    return new Response(
      JSON.stringify({
        success: true,
        ...summary,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Error al analizar el texto activo' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
