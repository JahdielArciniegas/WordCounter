import type { APIRoute } from 'astro';
import { passiveVocabService } from '../../../services/passive.service';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    let csvContent = '';
    let language = 'es';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      if (formData.has('language')) {
        language = (formData.get('language') as string) || 'es';
      }

      if (!file || !(file instanceof File)) {
        return new Response(
          JSON.stringify({ error: 'Debes proporcionar un archivo CSV válido en el campo "file"' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      csvContent = await file.text();
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      csvContent = body.csvContent || '';
      language = body.language || 'es';
    } else {
      csvContent = await request.text();
    }

    if (!csvContent || csvContent.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'El contenido del archivo CSV está vacío' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const summary = passiveVocabService.importFromCsv(csvContent, language);

    return new Response(
      JSON.stringify({
        success: true,
        ...summary,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Error interno al procesar el archivo CSV' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
