import { InitialDataStore } from '../types';

export const defaultWeddingData: InitialDataStore = {
  wedding: {
    coupleNames: "Angel Sevilla & Krister Chavez",
    partner1Name: "Angel Sevilla",
    partner2Name: "Krister Munguia",
    weddingDate: "2026-11-14T17:00:00",
    weddingLocation: "Angeli Gardens, San Pedro Sula",
    venueAddress: "Angeli Gardens, Col. Las Mesetas, San Pedro Sula, Honduras",
    venueMapUrl: "https://maps.app.goo.gl/cfh3eQzKUS3Mp25i7",
    heroSubtitle: "Con todo nuestro cariño, queremos que nos acompañes a celebrar el día en que unamos nuestras vidas.",
    coverImageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80",
    ourStory: "Dos personas, una misma sonrisa. Con mucha ilusión en el corazón, queremos invitarte a acompañarnos en el día en que unamos nuestras vidas. Tu presencia, tu cariño y tus buenos deseos harán de esta celebración un recuerdo aún más hermoso.",
    storyImageUrl: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80",
    rsvpDeadline: "2026-10-01",
    adminPin: "1234",
    partner1Email: "maestroshifu049@gmail.com",
    partner2Email: "",
    allowPlusOnes: true,
    mealSelectionEnabled: false,
    songRequestsEnabled: true,
    registryEnabled: true,
    guestbookEnabled: true,
    schedule: [
      {
        id: "sch_cocktail",
        title: "Bienvenida y cóctel",
        time: "7:00 PM",
        location: "Jardín de Recepción, Angeli Gardens",
        description: "Recepción de bienvenida con cócteles de autor, copas de honor y finos canapés.",
        iconName: "GlassWater",
        dressCode: "Rigurosa Etiqueta / Traje Oscuro"
      },
      {
        id: "sch_ceremony",
        title: "Ceremonia (con velas, ya de noche)",
        time: "7:45 PM",
        location: "El Cenador Iluminado",
        description: "Emotiva ceremonia nocturna a la luz de las velas donde intercambiaremos nuestros votos sagrados.",
        iconName: "Flame",
        dressCode: "Rigurosa Etiqueta"
      },
      {
        id: "sch_transition",
        title: "Transición al salón",
        time: "8:15 PM",
        location: "Gran Salón Esmeralda",
        description: "Paso y acomodo de todos los invitados en sus mesas del salón principal.",
        iconName: "DoorOpen",
        dressCode: "Rigurosa Etiqueta"
      },
      {
        id: "sch_banquet",
        title: "Entrada y banquete",
        time: "8:30 PM",
        location: "Gran Salón Esmeralda",
        description: "Entrada triunfal de Ángel & Krister seguida del servicio del banquete nupcial.",
        iconName: "Utensils",
        dressCode: "Rigurosa Etiqueta"
      },
      {
        id: "sch_protocol",
        title: "Protocolo (discursos, pastel, primer baile)",
        time: "9:15 PM",
        location: "Pista Principal",
        description: "Brindis de honor, discursos de familiares, corte del pastel de bodas y nuestro primer baile como esposos.",
        iconName: "Heart",
        dressCode: "Rigurosa Etiqueta"
      },
      {
        id: "sch_party",
        title: "Fiesta y baile abierto",
        time: "10:00 PM",
        location: "Pista Principal & Barra de Cócteles",
        description: "¡Apertura general de la pista de baile, música en vivo con DJ y celebración para todos!",
        iconName: "Music",
        dressCode: "Fiesta y Celebración"
      },
      {
        id: "sch_closing",
        title: "Cierre del evento",
        time: "12:00 AM",
        location: "Gran Salón Esmeralda",
        description: "Agradecimiento final y despedida de una noche mágica e inolvidable.",
        iconName: "Sparkles",
        dressCode: "Fin del Evento"
      }
    ],
    meals: [
      {
        id: "meal_starter",
        name: "1er Tiempo • Crema de Espárragos & Almendras",
        description: "Crema aterciopelada de espárragos verdes con lluvia de almendras tostadas, reducción balsámica y crujiente de jamón serrano.",
        category: "meat",
        isGlutenFree: true
      },
      {
        id: "meal_main",
        name: "2do Tiempo • Filete Mignon al Romero & Vino Tinto",
        description: "Medallón de filete en reducción de oporto y romero, acompañado de puré de papa al ajo rostizado y atado de ejotes franceses.",
        category: "meat",
        isGlutenFree: true
      },
      {
        id: "meal_dessert",
        name: "3er Tiempo • Sinfonía de Chocolate & Frutos Rojos",
        description: "Pastel nupcial de tres leches y mousse de chocolate amargo al Cointreau con coulis de frutos del bosque.",
        category: "vegetarian",
        isGlutenFree: false
      },
      {
        id: "meal_drinks",
        name: "Barra de Bebidas, Cócteles & Brindis",
        description: "Selección de vinos de mesa tinto y blanco, coctelería de autor, champaña para el brindis y digestivos.",
        category: "vegetarian",
        isGlutenFree: true
      }
    ],
    accommodations: [],
    faqs: [
      {
        id: "faq_1",
        question: "¿Cuál es la fecha límite para confirmar asistencia?",
        answer: "Por favor confirma tu asistencia antes del 1 de Octubre de 2026 para coordinar banquetes y logística con el recinto.",
        category: "general"
      },
      {
        id: "faq_2",
        question: "¿Cuál es el código de vestimenta?",
        answer: "El código de vestimenta es Etiqueta / Formal. Traje oscuro o esmoquin para caballeros, vestido largo o midi elegante para damas. Pedimos con cariño evitar el blanco e ivory, reservados para los novios.",
        category: "dress-code"
      },
      {
        id: "faq_3",
        question: "¿Puedo llevar acompañante o niños?",
        answer: "Debido al cupo limitado del jardín, la invitación está asignada específicamente para los nombres registrados. Al ingresar tu nombre en el buscador de RSVP aparecerá la cantidad de pases asignados.",
        category: "general"
      },
      {
        id: "faq_4",
        question: "¿Habrá estacionamiento o servicio de Valet?",
        answer: "Sí, contamos con servicio de estacionamiento privado para todos nuestros invitados.",
        category: "travel"
      }
    ],
    registry: [],
    galleryPhotos: [
      {
        id: 'img-1',
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
        caption: 'Angel & Krister en su sesión de compromiso al atardecer',
        category: 'novios',
        aspectRatio: 'aspect-[3/4]'
      },
      {
        id: 'img-2',
        url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
        caption: 'Los hermosos jardines de Angeli Gardens iluminados',
        category: 'lugar',
        aspectRatio: 'aspect-[16/9]'
      },
      {
        id: 'img-3',
        url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
        caption: 'Detalle de los anillos y papelería nupcial',
        category: 'detalles',
        aspectRatio: 'aspect-square'
      },
      {
        id: 'img-4',
        url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
        caption: 'Caminando juntos bajo los olivos centenarios',
        category: 'novios',
        aspectRatio: 'aspect-[4/5]'
      },
      {
        id: 'img-5',
        url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
        caption: 'Arreglos florales y velas en tonos tierra y bosque',
        category: 'detalles',
        aspectRatio: 'aspect-[3/4]'
      },
      {
        id: 'img-6',
        url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
        caption: 'Brindis de celebración rodeados de olivos',
        category: 'momentos',
        aspectRatio: 'aspect-[16/10]'
      }
    ]
  },
  guests: [
    {
      id: "gst_1",
      code: "ANGEL-101",
      primaryName: "Elena Rostova",
      email: "elena.rostova@example.com",
      phone: "(55) 5555-0192",
      partySizeAllowed: 2,
      status: "attending",
      attendingEvents: ["sch_1", "sch_2", "sch_3", "sch_4"],
      primaryMealOptionId: "meal_beef",
      primaryDietaryRestrictions: "Sin gluten",
      plusOne: {
        attending: true,
        fullName: "Dmitri Rostova",
        mealOptionId: "meal_fish",
        dietaryRestrictions: "Ninguna"
      },
      songRequest: {
        title: "At Last",
        artist: "Etta James"
      },
      messageToCouple: "¡Estamos inmensamente felices por ustedes! Nos vemos en Angeli Gardens para brindar juntos.",
      updatedAt: "2026-07-12T14:30:00Z",
      tableNumber: "Mesa 4",
      groupCategory: "Familia Novia"
    },
    {
      id: "gst_2",
      code: "KRISTER-102",
      primaryName: "Marcus Vance",
      email: "marcus.vance@example.com",
      phone: "(55) 5555-8831",
      partySizeAllowed: 2,
      status: "attending",
      attendingEvents: ["sch_1", "sch_2", "sch_3", "sch_4"],
      primaryMealOptionId: "meal_veg",
      primaryDietaryRestrictions: "Vegetariano",
      plusOne: {
        attending: true,
        fullName: "Sarah Vance",
        mealOptionId: "meal_veg",
        dietaryRestrictions: "Vegetariana"
      },
      songRequest: {
        title: "September",
        artist: "Earth, Wind & Fire"
      },
      messageToCouple: "¡Muchas felicidades Angel y Krister! ¡Listos para la pista de baile!",
      updatedAt: "2026-07-14T10:15:00Z",
      tableNumber: "Mesa 2",
      groupCategory: "Amigos Novio"
    }
  ],
  wishes: [
    {
      id: "wsh_1",
      guestName: "Elena & Dmitri",
      message: "¡Brindamos por una vida llena de amor, sonrisas y grandes aventuras juntos! Un honor acompañarlos.",
      date: "12 de Julio, 2026",
      isPublic: true,
      likesCount: 5
    },
    {
      id: "wsh_2",
      guestName: "Familia Munguia",
      message: "¡Angel y Krister, les deseamos una eternidad llena de felicidad y complicidad!",
      date: "14 de Julio, 2026",
      isPublic: true,
      likesCount: 8
    }
  ]
};
