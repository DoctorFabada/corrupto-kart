// ─────────────────────────────────────────────────────────────
// journalistQuestions.ts — Preguntas de periodistas durante la carrera
// Se muestran como bocadillos de diálogo.
// ─────────────────────────────────────────────────────────────

export interface JournalistQuestion {
  text: string;
  characterId?: string; // Si es específica de un personaje; undefined = genérica
}

export const JOURNALIST_QUESTIONS: JournalistQuestion[] = [
  { text: '¿Puede explicar por qué llevaba tres maletines en el maletero?' },
  { text: '¿Por qué aparece su nombre en el expediente?' },
  { text: '¿Conocía usted al empresario detenido?' },
  { text: '¿Qué hacía usted saliendo por la puerta de atrás?' },
  { text: '¿Por qué hay fajos de billetes en el asiento trasero?' },
  { text: '¿Está usted huyendo de la prensa?' },
  { text: '¿Qué relación tiene con el caso?' },
  { text: '¿Por qué lleva matrícula diplomática falsa?' },
  { text: '¿Puede explicar las llamadas con ese intermediario?' },
  { text: '¿Qué llevaba en la bolsa deportiva?' },
  { text: '¿Por qué apagó el móvil justo antes del registro?' },
  { text: '¿Ha recibido dinero de origen dudoso?' },
  { text: '¿Por qué hay un helicóptero esperándole?' },
  { text: '¿Está implicado en la trama?' },
  { text: '¿Por qué su chófer ha salido corriendo?' },
  { text: '¿Quién le dio la orden de destruir documentos?' },
  { text: '¿Por qué aparece usted en una foto con varios investigados?' },
  { text: '¿Qué hacía en ese hangar privado de madrugada?' },
  { text: '¿Por qué el maletín tiene doble fondo?' },
  { text: '¿Qué opina de las acusaciones?' },
  { text: '¿Por qué iba a tanta velocidad?' },
  { text: '¿Dónde está el contrato original?' },
  { text: '¿Niega haber cobrado comisiones?' },
  { text: '¿Por qué cambió de coche tres veces?' },
  { text: '¿Qué tiene que decir a los ciudadanos?' },
  { text: '¿Qué hacía reunido con un presunto narco?' },
  { text: '¿Por qué había una lancha esperando en el puerto?' },
  { text: '¿Qué opina de que le llamen \'el padrino del expediente\'?' },
  { text: '¿Por qué lleva gafas de sol de noche?' },
  { text: '¿Va a dimitir?' },
  { text: '¿Quién pagó el viaje?' },
  { text: '¿Por qué hay un sobre con su nombre?' },
  { text: '¿Está usted tranquilo?' },
  { text: '¿Ha hablado ya con su abogado?' },
  { text: '¿Por qué todos sus colaboradores están imputados?' },
];

/**
 * Devuelve una pregunta aleatoria.
 * Todas las preguntas son genéricas, se elige una al azar del pool completo.
 */
export function getRandomQuestion(characterId: string): JournalistQuestion {
  return JOURNALIST_QUESTIONS[
    Math.floor(Math.random() * JOURNALIST_QUESTIONS.length)
  ];
}
