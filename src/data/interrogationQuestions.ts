// ─────────────────────────────────────────────────────────────
// interrogationQuestions.ts — Minijuego de interrogatorio
// El jugador debe MENTIR para continuar. ¡La verdad = GAME OVER!
// ─────────────────────────────────────────────────────────────

export interface InterrogationOption {
  text: string;
  type: 'lie' | 'evasion' | 'truth';
  response: string; // Reacción tras elegir
}

export interface InterrogationQuestion {
  question: string;
  characterId?: string; // Si es específica de un personaje
  options: [InterrogationOption, InterrogationOption, InterrogationOption];
}

export const INTERROGATION_QUESTIONS: InterrogationQuestion[] = [
  // ══════════════════════════════════════════════════════════
  //  SÁNCHEZ — 3 preguntas
  // ══════════════════════════════════════════════════════════
  {
    question: '¿Es cierto que dijo "no es no" y luego pactó con todos?',
    characterId: 'sanchez',
    options: [
      {
        text: 'Yo siempre he sido coherente, son los demás los que se mueven',
        type: 'lie',
        response: '¡Brillante! Hasta tú te lo has creído.',
      },
      {
        text: 'Mire, yo ya he respondido a eso en varias ocasiones',
        type: 'evasion',
        response: 'Evasiva clásica. Pierdes 5 segundos de dignidad.',
      },
      {
        text: 'Sí, dije que no y luego dije que sí. ¿Y qué?',
        type: 'truth',
        response: '¡HAS CONFESADO! El hemeroteca te destruye.',
      },
    ],
  },
  {
    question: '¿Conoce usted al señor Koldo y sus mascarillas?',
    characterId: 'sanchez',
    options: [
      {
        text: '¿Koldo? Me suena de un reality, creo',
        type: 'lie',
        response: '¡Magnífica amnesia selectiva! Nivel experto.',
      },
      {
        text: 'Esa pregunta está sub júdice y no puedo contestar',
        type: 'evasion',
        response: 'El comodín judicial. Pierdes 5 segundos.',
      },
      {
        text: 'Sí, Koldo venía al ministerio como Pedro por su casa',
        type: 'truth',
        response: '¡CONFESIÓN! El juez te manda a boxes permanentemente.',
      },
    ],
  },
  {
    question: '¿Entró usted a Moncloa por la puerta de la prensa?',
    characterId: 'sanchez',
    options: [
      {
        text: 'Yo siempre uso la puerta principal, con alfombra',
        type: 'lie',
        response: '¡Nadie vio nada! Sigues en carrera.',
      },
      {
        text: 'Las puertas de Moncloa son todas iguales, ¿no?',
        type: 'evasion',
        response: 'Relativismo arquitectónico. Pierdes 5 segundos.',
      },
      {
        text: 'Sí, es que la otra puerta da mucha pereza',
        type: 'truth',
        response: '¡CONFESIÓN! La prensa te fotografía. Game over.',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════
  //  MARIANO — 3 preguntas
  // ══════════════════════════════════════════════════════════
  {
    question: '¿Es usted M. Rajoy, el de los papeles de Bárcenas?',
    characterId: 'mariano',
    options: [
      {
        text: 'M. Rajoy es mi primo segundo, yo soy Mariano a secas',
        type: 'lie',
        response: '¡Genial! El primo imaginario, defensa infalible.',
      },
      {
        text: 'Mire, yo de eso no le puedo decir lo que no sé',
        type: 'evasion',
        response: 'Frase marca Rajoy. Pierdes 5 segundos descifrándola.',
      },
      {
        text: 'Sí, soy yo, y cobré en sobres. ¿Qué pasa?',
        type: 'truth',
        response: '¡HAS CONFESADO! Bárcenas saca los papeles. GAME OVER.',
      },
    ],
  },
  {
    question: '¿Por qué le escribió "Luis, sé fuerte" a Bárcenas?',
    characterId: 'mariano',
    options: [
      {
        text: 'Era un SMS de ánimo por su lesión de espalda',
        type: 'lie',
        response: '¡Qué buen amigo! Nadie sospecha nada.',
      },
      {
        text: 'Yo es que mando muchos mensajes y no me acuerdo',
        type: 'evasion',
        response: 'Amnesia telefónica selectiva. Pierdes 5 segundos.',
      },
      {
        text: 'Le dije que aguantara sin chivatarse al juez',
        type: 'truth',
        response: '¡CONFESIÓN! El SMS se lee en el juicio. GAME OVER.',
      },
    ],
  },
  {
    question: '¿Puede explicar la contabilidad B del partido?',
    characterId: 'mariano',
    options: [
      {
        text: 'La B es de Buena, es la contabilidad buena',
        type: 'lie',
        response: '¡Brillante! Hasta el interventor aplaude.',
      },
      {
        text: 'Somos sentimientos y tenemos seres humanos',
        type: 'evasion',
        response: 'Nadie entiende nada. Pierdes 5 segundos, pero confuso.',
      },
      {
        text: 'Sí, había dos cajas: una legal y otra para sobres',
        type: 'truth',
        response: '¡HAS CONFESADO! Hacienda entra en tu box. GAME OVER.',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════
  //  ABASCAL — 3 preguntas
  // ══════════════════════════════════════════════════════════
  {
    question: '¿Es verdad que va a las carreras en caballo?',
    characterId: 'abascal',
    options: [
      {
        text: 'Es un caballo eléctrico, muy ecológico',
        type: 'lie',
        response: '¡Un patriota verde! Nadie se lo esperaba.',
      },
      {
        text: 'Los medios de transporte son una elección personal',
        type: 'evasion',
        response: 'Libertad de galope. Pierdes 5 segundos.',
      },
      {
        text: 'Sí, mi caballo se llama Pelayo y es de pura raza',
        type: 'truth',
        response: '¡CONFESIÓN! Sanidad Animal te retira la licencia.',
      },
    ],
  },
  {
    question: '¿Cuántos metros mide el muro que propone?',
    characterId: 'abascal',
    options: [
      {
        text: 'No es un muro, es una valla decorativa con flores',
        type: 'lie',
        response: '¡Urbanismo patriótico! Aprobado por unanimidad.',
      },
      {
        text: 'Los muros son un concepto, no se miden en metros',
        type: 'evasion',
        response: 'Filosofía fronteriza. Pierdes 5 segundos.',
      },
      {
        text: 'Lo quiero de 15 metros con alambre de espino',
        type: 'truth',
        response: '¡CONFESIÓN! La UE te sanciona. GAME OVER.',
      },
    ],
  },
  {
    question: '¿Vive usted realmente en Despeñaperros?',
    characterId: 'abascal',
    options: [
      {
        text: 'Tengo un chalet en cada provincia, soy descentralizado',
        type: 'lie',
        response: '¡España unida en el ladrillo! Sigues adelante.',
      },
      {
        text: 'Yo vivo donde vive España, que es en todos lados',
        type: 'evasion',
        response: 'Patriotismo geográfico. Pierdes 5 segundos.',
      },
      {
        text: 'No, vivo en un ático en Arturo Soria, Madrid',
        type: 'truth',
        response: '¡CONFESIÓN! Twitter te destroza. GAME OVER.',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════
  //  MONTERO — 3 preguntas
  // ══════════════════════════════════════════════════════════
  {
    question: '¿Cuánto costó exactamente la sede del ministerio?',
    characterId: 'montero',
    options: [
      {
        text: 'La sede fue gratis, nos la regaló un mecenas anónimo',
        type: 'lie',
        response: '¡Mecenazgo progresista! Nadie pregunta más.',
      },
      {
        text: 'Los costes son relativos al contexto socioeconómico',
        type: 'evasion',
        response: 'Dialéctica del alquiler. Pierdes 5 segundos.',
      },
      {
        text: 'Un dineral, pero tiene terraza y todo',
        type: 'truth',
        response: '¡CONFESIÓN! El tribunal de cuentas entra al chat.',
      },
    ],
  },
  {
    question: '¿La ley del "solo sí es sí" rebajó penas a agresores?',
    characterId: 'montero',
    options: [
      {
        text: 'Eso es culpa de los jueces machistas, no de la ley',
        type: 'lie',
        response: '¡Culpa externalizada con éxito! Continúas.',
      },
      {
        text: 'Hay que analizar el contexto con perspectiva amplia',
        type: 'evasion',
        response: 'Perspectiva de género aplicada a la evasión. -5 seg.',
      },
      {
        text: 'Sí, se nos fue de las manos, la verdad',
        type: 'truth',
        response: '¡HAS CONFESADO! La oposición celebra. GAME OVER.',
      },
    ],
  },
  {
    question: '¿Qué logros legislativos concretos puede citar?',
    characterId: 'montero',
    options: [
      {
        text: 'Llevo 47 leyes aprobadas, pero son confidenciales',
        type: 'lie',
        response: '¡Legislación clasificada! Nivel top secret.',
      },
      {
        text: 'Los logros no se miden en leyes, sino en conciencias',
        type: 'evasion',
        response: 'Logros etéreos. Pierdes 5 segundos.',
      },
      {
        text: 'La verdad es que llevamos pocas, nos faltó tiempo',
        type: 'truth',
        response: '¡CONFESIÓN! La bancada entera aplaude irónica.',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════
  //  ZAPATERO — 3 preguntas
  // ══════════════════════════════════════════════════════════
  {
    question: '¿Negoció usted con ETA a espaldas del Congreso?',
    characterId: 'zapatero',
    options: [
      {
        text: 'Yo no negocié, solo charlamos de fútbol y sidra',
        type: 'lie',
        response: '¡Conversación informal! Nada que ver con política.',
      },
      {
        text: 'Todo proceso de paz requiere discreción institucional',
        type: 'evasion',
        response: 'Diplomacia nivel Nobel. Pierdes 5 segundos.',
      },
      {
        text: 'Sí, quedábamos en secreto, pero con buena intención',
        type: 'truth',
        response: '¡CONFESIÓN! El CNI publica las actas. GAME OVER.',
      },
    ],
  },
  {
    question: '¿Dónde están exactamente esos brotes verdes?',
    characterId: 'zapatero',
    options: [
      {
        text: 'Los brotes verdes están ahí, pero son tímidos',
        type: 'lie',
        response: '¡Botánica económica! Los mercados se tranquilizan.',
      },
      {
        text: 'La economía tiene ciclos y los ciclos tienen brotes',
        type: 'evasion',
        response: 'Poesía macroeconómica. Pierdes 5 segundos.',
      },
      {
        text: 'No había brotes, era todo un bulo para ganar tiempo',
        type: 'truth',
        response: '¡CONFESIÓN! El IBEX se desploma en directo.',
      },
    ],
  },
  {
    question: '¿La Alianza de Civilizaciones sirvió para algo?',
    characterId: 'zapatero',
    options: [
      {
        text: 'Gracias a ella no ha habido guerras intergalácticas',
        type: 'lie',
        response: '¡Paz cósmica! La ONU aplaude tu visión.',
      },
      {
        text: 'Los frutos del diálogo no siempre son inmediatos',
        type: 'evasion',
        response: 'Paciencia civilizatoria. Pierdes 5 segundos.',
      },
      {
        text: 'Fue un lío que no entendió nadie, ni yo mismo',
        type: 'truth',
        response: '¡CONFESIÓN! La ONU retira tu placa. GAME OVER.',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════
  //  GENÉRICAS — 3 preguntas
  // ══════════════════════════════════════════════════════════
  {
    question: '¿Es cierto que usó dinero público para un jacuzzi?',
    options: [
      {
        text: 'Eso era una piscina terapéutica para reuniones',
        type: 'lie',
        response: '¡Hidroterapia institucional! Gasto justificado.',
      },
      {
        text: 'Las partidas presupuestarias son complejas de explicar',
        type: 'evasion',
        response: 'Contabilidad creativa. Pierdes 5 segundos.',
      },
      {
        text: 'Sí, con chorros de hidromasaje y luces LED',
        type: 'truth',
        response: '¡CONFESIÓN! Hacienda congela tus burbujas. GAME OVER.',
      },
    ],
  },
  {
    question: '¿Puede justificar su patrimonio de 3 millones?',
    options: [
      {
        text: 'Me tocó la lotería seis veces, soy muy suertudo',
        type: 'lie',
        response: '¡Suerte estadísticamente imposible pero aceptada!',
      },
      {
        text: 'Mi patrimonio está en manos de mis asesores fiscales',
        type: 'evasion',
        response: 'Los asesores, siempre los asesores. -5 segundos.',
      },
      {
        text: 'No puedo, porque la mitad viene de comisiones',
        type: 'truth',
        response: '¡CONFESIÓN! La UDEF te espera en meta. GAME OVER.',
      },
    ],
  },
  {
    question: '¿Su currículum dice que habla seis idiomas?',
    options: [
      {
        text: 'Siete, se me olvidó poner el esperanto',
        type: 'lie',
        response: '¡Políglota nivel político! Nadie te examinará.',
      },
      {
        text: 'Los idiomas son una herramienta más del servidor público',
        type: 'evasion',
        response: 'Filosofía lingüística. Pierdes 5 segundos.',
      },
      {
        text: 'Solo hablo español y el inglés del aeropuerto',
        type: 'truth',
        response: '¡CONFESIÓN! LinkedIn te cancela la cuenta.',
      },
    ],
  },
  {
    question: '¿Puede explicar por qué llevaba tres maletines en el maletero?',
    options: [
      {
        text: 'Material de oficina con mucho carácter.',
        type: 'lie',
        response: '¡Brillante! Nadie sospecha del material de oficina.',
      },
      {
        text: 'Yo solo conduzco, el maletero tiene autonomía propia.',
        type: 'evasion',
        response: 'Autonomía de maletero. Pierdes 5 segundos.',
      },
      {
        text: 'Sí, llevaba tres maletines con 500.000€ en dinero negro.',
        type: 'truth',
        response: '¡HAS CONFESADO! La fiscalía te detiene. GAME OVER.',
      },
    ],
  },
  {
    question: '¿Por qué aparece su nombre en el expediente?',
    options: [
      {
        text: 'Eso lo puso una impresora descontrolada.',
        type: 'lie',
        response: '¡Culpa al hardware! Una coartada tecnológica impecable.',
      },
      {
        text: 'No me consta, pero me indigna muchísimo.',
        type: 'evasion',
        response: 'Indignación preventiva. Pierdes 5 segundos.',
      },
      {
        text: 'Sí, cobré la comisión y firmé el recibo yo mismo.',
        type: 'truth',
        response: '¡HAS CONFESADO! Firma oficial. GAME OVER.',
      },
    ],
  },
  {
    question: '¿Conocía usted al empresario detenido?',
    options: [
      {
        text: 'Coincidimos en una rotonda institucional.',
        type: 'lie',
        response: '¡La rotonda de la amistad! Continúas la carrera.',
      },
      {
        text: 'Me suena de no conocerlo.',
        type: 'evasion',
        response: 'Paradoja cognitiva. Pierdes 5 segundos.',
      },
      {
        text: 'Sí, es mi socio y el que me daba los maletines.',
        type: 'truth',
        response: '¡HAS CONFESADO! Asociación ilícita. GAME OVER.',
      },
    ],
  },
  {
    question: '¿Por qué hay fajos de billetes en el asiento trasero?',
    options: [
      {
        text: 'Es decoración vintage de campaña electoral.',
        type: 'lie',
        response: '¡Estética retro! Nadie duda de tu buen gusto.',
      },
      {
        text: 'Eso venía con el coche de alquiler.',
        type: 'evasion',
        response: 'Servicios de alquiler muy completos. Pierdes 5 segundos.',
      },
      {
        text: 'Sí, son las mordidas del último concurso de basuras.',
        type: 'truth',
        response: '¡HAS CONFESADO! Cohecho flagrante. GAME OVER.',
      },
    ],
  },
  {
    question: '¿Está usted huyendo de la prensa?',
    options: [
      {
        text: 'No huyo, hago cardio democrático.',
        type: 'lie',
        response: '¡Mente sana en cuerpo corrupto! Sigue corriendo.',
      },
      {
        text: 'Estoy llegando tarde a una transparencia urgente.',
        type: 'evasion',
        response: 'Prisa institucional. Pierdes 5 segundos.',
      },
      {
        text: 'Sí, si me pillan confieso todo y voy directo a prisión.',
        type: 'truth',
        response: '¡HAS CONFESADO! Sincericidio en carrera. GAME OVER.',
      },
    ],
  },
  {
    question: '¿Ha recibido dinero de origen dudoso?',
    options: [
      {
        text: 'Yo recibo cariño, no dinero.',
        type: 'lie',
        response: '¡Mucho amor en sobres! Sigue adelante.',
      },
      {
        text: 'Si llegó algo, sería por error administrativo.',
        type: 'evasion',
        response: 'Errores contables comunes. Pierdes 5 segundos.',
      },
      {
        text: 'Sí, millones de comisiones en paraísos fiscales.',
        type: 'truth',
        response: '¡HAS CONFESADO! Blanqueo internacional. GAME OVER.',
      },
    ],
  },
  {
    question: '¿Está implicado en la trama?',
    options: [
      {
        text: 'Estoy implicado en mejorar el país, que es distinto.',
        type: 'lie',
        response: '¡Gran patriotismo! Sigue adelante.',
      },
      {
        text: 'No me consta, y si me consta, no recuerdo.',
        type: 'evasion',
        response: 'Memoria a corto plazo deficiente. Pierdes 5 segundos.',
      },
      {
        text: 'Sí, soy el cabecilla de toda la organización criminal.',
        type: 'truth',
        response: '¡HAS CONFESADO! Dirección de banda. GAME OVER.',
      },
    ],
  },
  {
    question: '¿Niega haber cobrado comisiones?',
    options: [
      {
        text: 'Niego la palabra comisión, prefiero "gratitud logística".',
        type: 'lie',
        response: '¡Semántica de alto nivel! Todo aclarado.',
      },
      {
        text: 'Mi abogado dice que son emociones contables.',
        type: 'evasion',
        response: 'Abogacía poética. Pierdes 5 segundos.',
      },
      {
        text: 'No lo niego, cobré el 3% de todas las obras públicas.',
        type: 'truth',
        response: '¡HAS CONFESADO! El clásico 3%. GAME OVER.',
      },
    ],
  },
  {
    question: '¿Va a dimitir?',
    options: [
      {
        text: 'Voy a reflexionar acelerando.',
        type: 'lie',
        response: '¡Reflexión a 120 km/h! Sigue así.',
      },
      {
        text: 'Ahora mismo estoy centrado en la curva.',
        type: 'evasion',
        response: 'Concentración al volante. Pierdes 5 segundos.',
      },
      {
        text: 'Sí, presento mi dimisión irrevocable y me entrego.',
        type: 'truth',
        response: '¡HAS CONFESADO! Asunción de responsabilidad. GAME OVER.',
      },
    ],
  },
];

/**
 * Baraja un array in-place usando Fisher-Yates.
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Devuelve un set de 3 preguntas únicas para el interrogatorio.
 * Prioriza preguntas específicas del personaje y luego rellena con genéricas u otros personajes.
 * Garantiza la ausencia de duplicados.
 */
export function getInterrogationSet(
  characterId: string,
  askedQuestions?: Set<string>
): InterrogationQuestion[] {
  const excludeSet = askedQuestions || new Set<string>();

  // 1. Get all unasked specific questions
  const specific = INTERROGATION_QUESTIONS.filter(
    (q) => q.characterId === characterId && !excludeSet.has(q.question)
  );
  // 2. Get all unasked generic questions
  const generic = INTERROGATION_QUESTIONS.filter(
    (q) => q.characterId === undefined && !excludeSet.has(q.question)
  );
  // 3. Get all unasked other characters' questions
  const others = INTERROGATION_QUESTIONS.filter(
    (q) => q.characterId !== undefined && q.characterId !== characterId && !excludeSet.has(q.question)
  );

  // Shuffle individual pools
  const shuffledSpecific = shuffleArray(specific);
  const shuffledGeneric = shuffleArray(generic);
  const shuffledOthers = shuffleArray(others);

  // Build the unified preference pool of unique unasked questions
  const pool = [
    ...shuffledSpecific,
    ...shuffledGeneric,
    ...shuffledOthers
  ];

  // In the extremely unlikely event that the pool runs out of unique questions (< 3 left),
  // fall back to the entire catalog of questions shuffled to prevent game breaking.
  let selectedPool = pool;
  if (pool.length < 3) {
    selectedPool = shuffleArray([...INTERROGATION_QUESTIONS]);
  }

  // Pick the top 3 unique questions
  const result = [selectedPool[0], selectedPool[1], selectedPool[2]];

  // Barajar las opciones dentro de cada pregunta
  return result.map((q) => ({
    ...q,
    options: shuffleArray(q.options) as [
      InterrogationOption,
      InterrogationOption,
      InterrogationOption,
    ],
  }));
}
