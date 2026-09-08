import type { APIRoute } from "astro";
import { activeVocabService } from "../../../../services/active.service";

export const prerender = false;

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = params.id;

    if (!id) {
      return new Response(JSON.stringify({ error: "ID es requerido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    activeVocabService.removeWord(parseInt(id));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Error al eliminar palabra" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
