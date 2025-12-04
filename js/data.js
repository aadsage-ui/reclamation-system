// Данные пользователей
export const users = {
    'bio_smart': {
        password: 'demo123',
        companyName: 'ООО "БИО СМАРТ"'
    },
    'client': {
        password: 'test456', 
        companyName: 'ООО "БИО СМАРТ"'
    }
};

// Данные о заказах с датами
export const orders = {
    "473231 Electro.ru": {
        date: "05.11.2025",
        products: [
            { name: "Выключатель авт. ВА47-29 3п    2А  х-ка C   4,5кА  MVA20-3-002-C  ИЭК", code: "6732", quantity: 20, price: 1563.00, maxQuantity: 20, unit: "шт" },
            { name: "IEK Блок аварийного питания БАП200-1,0 универс. для LED IP65 IEK", code: "376149", quantity: 10, price: 200.00, maxQuantity: 10, unit: "шт" },
            { name: "Светильник LED LINE 450мм 6W/865  540Lm  Jazzway (пластик) PLED T5i", code: "211398", quantity: 20, price: 233.60, maxQuantity: 20, unit: "шт" }
        ],
        reclamationNumber: "ЭКС-00014890",
        totalAmount: 27392.00
    },
    "НЗ1-000123684": {
        date: "05.11.2025", 
        products: [
            { name: "Патрон Е27 Д-002 керамический подвесной", code: "377421", quantity: 300, price: 8.50, maxQuantity: 300, unit: "шт" },
            { name: "Лампа  LED-MO-PRO 10Вт 12-48В Е27 4000К 900Лм", code: "515814", quantity: 15, price: 74.50, maxQuantity: 15, unit: "шт" }
        ],
        reclamationNumber: "ЭКС-000128946",
        totalAmount: 61991.00
    },
    "489561 Elektro.ru": {
        date: "06.11.2025",
        products: [
            { name: "Выключатель авт. ВА47-29 3п    2А  х-ка C   4,5кА  MVA20-3-002-C  ИЭК", code: "6732", quantity: 25, price: 1563.00, maxQuantity: 25, unit: "шт" },
            { name: "IEK Блок аварийного питания БАП200-1,0 универс. для LED IP65 IEK", code: "376149", quantity: 16, price: 200.00, maxQuantity: 16, unit: "шт" },
            { name: "Светильник LED LINE 450мм 6W/865  540Lm  Jazzway (пластик) PLED T5i", code: "211398", quantity: 14, price: 233.60, maxQuantity: 14, unit: "шт" }
        ],
        reclamationNumber: "ЭКС-000123564",
        totalAmount: 34968.00
    },
    "488856 Elektro.ru": {
        date: "15.10.2025",
        products: [
            { name: "Патрон Е27 Д-002 керамический подвесной", code: "377421", quantity: 257, price: 8.50, maxQuantity: 257, unit: "шт" },
            { name: "Лампа  LED-MO-PRO 10Вт 12-48В Е27 4000К 900Лм", code: "515814", quantity: 35, price: 74.50, maxQuantity: 35, unit: "шт" }
        ],
        reclamationNumber: "ЭКС-000128946",
        totalAmount: 18251.00
    }
};

// Данные о рекламациях
export let reclamations = [
    {
        id: 1,
        number: "ЭКС-000012468",
        date: "05.11.2025",
        status: "inwork",
        resolution: "Замена",
        responsible: "Рубцов Р.А.",
        amount: 3754.20,
        tags: ["Бой"],
        orderNumber: "473231 Electro.ru",
        comment: "При получении товара обнаружены повреждения на упаковках угля. Упаковка была нарушена.",
        files: ["akt_povrezhdeniya.pdf", "foto_povrezhdeniya_1.jpg", "foto_povrezhdeniya_2.jpg"],
        items: [
            { name: "Уголь березовый 'Для большой компании' 5 кг", code: "823039", quantity: 10, reason: "breakage", price: 375.42, unit: "шт", resolution: "Замена", files: ["akt_povrezhdeniya.pdf", "foto_povrezhdeniya_1.jpg"] }
        ],
        communication: [
            {
                sender: "Рубцов Р.А. (отдел качества)",
                text: "Добрый день! Просьба сообщить, при приёме товара коробка была целой?",
                date: "2025-11-06 10:30",
                files: [],
                read: false
            }
        ]
    },
    {
        id: 2,
        number: "ЭКС-000012470",
        date: "05.11.2025",
        status: "resolved",
        resolution: "Корректировка документов",
        responsible: "Рубцов Р.А.",
        amount: 448.40,
        tags: ["Недостача"],
        orderNumber: "НЗ1-000123684",
        comment: "15 ламп не работают при подключении. Предположительно заводской брак.",
        files: ["akt_o_brake.pdf", "protokol_ispytaniy.pdf"],
        items: [
            { name: "Лампа МО 36V 60W E27", code: "67672", quantity: 20, reason: "shortage", price: 22.42, unit: "шт", resolution: "Корректировка документов", files: ["akt_o_brake.pdf"] }
        ],
        communication: [
            {
                sender: "Рубцов Р.А. (отдел качества)",
                text: "Добрый день! Подтверждаем заводской брак. Оформляем корректировку документов.",
                date: "2025-11-06 14:20",
                files: [],
                read: true
            }
        ]
    },
    {
        id: 3,
        number: "ЭКС-000012472",
        date: "15.10.2025",
        status: "resolved",
        resolution: "Возврат средств",
        responsible: "Рубцов Р.А.",
        amount: 10275.00,
        tags: ["Недостача"],
        orderNumber: "488856 Elektro.ru",
        comment: "Недостача 50 метров кабеля ВВГнг-LS 3х2,5 при получении заказа",
        files: ["akt_priema.pdf", "foto_marki_kabelya.jpg"],
        items: [
            { name: "Кабель ВВГнг-LS 3х2,5", code: "354267", quantity: 50, reason: "shortage", price: 68.50, unit: "м", resolution: "Возврат средств", files: ["akt_priema.pdf"] }
        ],
        communication: [
            {
                sender: "Рубцов Р.А. (отдел качества)",
                text: "Добрый день! Подтверждаем недостачу. Оформляем возврат средств.",
                date: "2025-10-16 11:15",
                files: [],
                read: true
            }
        ]
    }
];

// Данные уведомлений
export let notifications = [
    {
        id: 1,
        title: "Новый ответ по рекламации",
        text: "Вы получили ответ по рекламации ЭКС-000012468 от Рубцова Р.А. - Просьба сообщить, при приёме товара коробка была целой?",
        date: "2025-11-06 10:30",
        type: "message",
        reclamationId: 1,
        read: false
    },
    {
        id: 2,
        title: "Рекламация завершена",
        text: "Ваша рекламация ЭКС-000012470 завершена. Решение: Корректировка документов",
        date: "2025-11-06 14:20",
        type: "resolution",
        reclamationId: 2,
        read: true
    },
    {
        id: 3,
        title: "Рекламация завершена", 
        text: "Ваша рекламация ЭКС-000012472 завершена. Решение: Возврат средств",
        date: "2025-10-16 11:15",
        type: "resolution",
        reclamationId: 3,
        read: true
    }
];
