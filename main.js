
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const token = process.env.BOT_TOKEN; // Токен будет браться из переменной окружения
const bot = new TelegramBot(token, { polling: true });

// Загружаем данные из файлов JSON
const sportsData = JSON.parse(fs.readFileSync('./data/sport.json', 'utf8'));
const venuesData = JSON.parse(fs.readFileSync('./data/venues.json', 'utf8'));

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    const welcomeMessage = `Привет ${msg.from.first_name} ${msg.from.last_name}! Добро пожаловать в бота U-sport, у нас ты можешь оставить обратную связь, получить ответы на вопросы и быть в курсе всех новостей`;

    const options = {
        reply_markup: JSON.stringify({
            keyboard: [
                ['Забронировать на сайте'],
                ['Спорткомплексы', 'Виды спорта'],
                ['Оставить отзыв']
            ],
            resize_keyboard: true
        })
    };

    bot.sendMessage(chatId, welcomeMessage, options);
});

// Обработчик для кнопки "Забронировать на сайте"
bot.onText(/Забронировать на сайте/, (msg) => {
    const chatId = msg.chat.id;
    const logoSportPath = './images/logoSport.png'; // Добавляем путь к папке images

    const caption = 'Забронировать спортивное занятие вы можете на нашем сайте, просто нажмите на кнопку ниже';

    if (fs.existsSync(logoSportPath)) {
        bot.sendPhoto(chatId, fs.createReadStream(logoSportPath), {
            caption: caption,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Перейти на сайт', url: 'https://usports.online/' }]
                ]
            }
        });
    } else {
        bot.sendMessage(chatId, caption, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Перейти на сайт', url: 'https://usports.online/' }]
                ]
            }
        });
    }
});

bot.onText(/Спорткомплексы/, (msg) => {
    const chatId = msg.chat.id;

    const sportComplexesMessage = `Выбери спорткомплекс:`;

    const options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Радуга🌈', callback_data: 'raduga' }],
                [{ text: 'Сопка🏔️', callback_data: 'sopka' }]
            ]
        }
    };

    bot.sendMessage(chatId, sportComplexesMessage, options);
});

// Обработчик для inline кнопок спорткомплексов
bot.on('callback_query', (callbackQuery) => {
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;

    const venue = venuesData[data]; // Получаем данные спорткомплекса
    if (venue) {
        const sportsMessage = `Спорткомплекс "${venue.name}"\nВремя работы: ${venue.working_hours}\nАдрес: ${venue.address}`;

        const options = {
            reply_markup: {
                inline_keyboard: venue.sports.map(sportKey => {
                    return [{ text: sportsData[sportKey].name, url: sportsData[sportKey].url }];
                }).concat([[{ text: 'Назад', callback_data: 'back_to_complexes' }]])
            }
        };

        bot.deleteMessage(chatId, messageId) // Удаляем старое сообщение "Выбери спорткомплекс"
            .then(() => bot.sendMessage(chatId, sportsMessage, options)) // Отправляем сообщение с видами спорта
            .catch((error) => console.error('Ошибка при удалении сообщения:', error));
    }
});

// Обработчик для кнопки "Назад" в спорткомплексах
bot.on('callback_query', (callbackQuery) => {
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;

    if (data === 'back_to_complexes') {
        const sportComplexesMessage = `Выбери спорткомплекс:`;

        const options = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Радуга🌈', callback_data: 'raduga' }],
                    [{ text: 'Сопка🏔️', callback_data: 'sopka' }]
                ]
            }
        };

        bot.deleteMessage(chatId, messageId) // Удаляем текущее сообщение
            .then(() => bot.sendMessage(chatId, sportComplexesMessage, options)) // Возвращаемся к выбору спорткомплексов
            .catch((error) => console.error('Ошибка при удалении сообщения:', error));
    }
});

// Обработчик для кнопки "Виды спорта"
bot.onText(/Виды спорта/, (msg) => {
    const chatId = msg.chat.id;

    const sportsMessage = `Выбери вид спорта:`;

    const options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Плавание🐳', callback_data: 'swimming' }, { text: 'Баскетбол🏀', callback_data: 'basketball' }],
                [{ text: 'Волейбол🏐', callback_data: 'volleyball' }, { text: 'Лыжи🎿', callback_data: 'skiing' }],
                [{ text: 'Сквош🤙🏽', callback_data: 'squash' }, { text: 'Настольный теннис🏓', callback_data: 'table_tennis' }],
                [{ text: 'Тренажерный зал🏋🏽', callback_data: 'gym' }]
            ]
        }
    };

    bot.sendMessage(chatId, sportsMessage, options);
});

// Обработчик для inline кнопок видов спорта
bot.on('callback_query', (callbackQuery) => {
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;

    const sport = sportsData[data]; // Получаем данные о виде спорта
    if (sport) {
        const photoPath = sport.photo; // Загружаем изображение из JSON
        let caption = `<b>${sport.name}</b>\n\nАдрес площадки: ${sport.address}\nВремя работы: ${sport.schedule}\n\nХарактеристики:\n${sport.description}`;

        if (sport.additional) {
            caption += `\n\n<i>${sport.additional}</i>`; 
        }
        const options = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Перейти на сайт', url: sport.url }],
                    [{ text: 'Назад', callback_data: 'back_to_sports' }]
                ]
            }
        };

        bot.deleteMessage(chatId, messageId) // Удаляем старое сообщение
            .then(() => {
                if (fs.existsSync(photoPath)) {
                    bot.sendPhoto(chatId, photoPath, {
                        caption: caption,
                        ...options
                    });
                } else {
                    bot.sendMessage(chatId, caption, options);
                }
            })
            .catch((error) => console.error('Ошибка при удалении сообщения:', error));
    }
});

// Обработчик для кнопки "Назад" в "Виды спорта"
bot.on('callback_query', (callbackQuery) => {
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;

    if (data === 'back_to_sports') {
        const sportsMessage = `Выбери вид спорта:`;

        const options = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Плавание🐳', callback_data: 'swimming' }, { text: 'Баскетбол🏀', callback_data: 'basketball' }],
                    [{ text: 'Волейбол🏐', callback_data: 'volleyball' }, { text: 'Лыжи🎿', callback_data: 'skiing' }],
                    [{ text: 'Сквош🤙🏽', callback_data: 'squash' }, { text: 'Настольный теннис🏓', callback_data: 'table_tennis' }],
                    [{ text: 'Тренажерный зал🏋🏽', callback_data: 'gym' }]
                ]
            }
        };

        bot.deleteMessage(chatId, messageId) // Удаляем текущее сообщение
            .then(() => bot.sendMessage(chatId, sportsMessage, options)) // Отправляем список видов спорта
            .catch((error) => console.error('Ошибка при удалении сообщения:', error));
    }
});

let feedbackState = {};

// Обработчик для кнопки "Оставить отзыв"
bot.onText(/Оставить отзыв/, (msg) => {
    const chatId = msg.chat.id;

    // Сообщение с просьбой выбрать площадку
    const feedbackMessage = `Выберите площадку, о которой хотите оставить отзыв:`;

    // Кнопки для выбора площадки
    const options = {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{ text: 'Радуга', callback_data: 'feedback_raduga' }],
                [{ text: 'Сопка', callback_data: 'feedback_sopka' }]
            ]
        })
    };

    // Отправляем сообщение с выбором площадки
    bot.sendMessage(chatId, feedbackMessage, options);
});

// Обработчик для выбора площадки
bot.on('callback_query', (callbackQuery) => {
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;

    if (data === 'feedback_raduga' || data === 'feedback_sopka') {
        let selectedPlace = ''; // Переменная для хранения выбора площадки

        if (data === 'feedback_raduga') {
            selectedPlace = '#радуга'; // Пометка для "Радуги"
        } else if (data === 'feedback_sopka') {
            selectedPlace = '#сопка'; // Пометка для "Сопки"
        }

        // Сохраняем состояние выбранной площадки для текущего пользователя
        feedbackState[chatId] = selectedPlace;

        // После выбора площадки просим пользователя оставить отзыв
        bot.sendMessage(chatId, 'Напишите ваше сообщение, и мы передадим его администрации.', {
            reply_markup: { force_reply: true }
        });
    }
});

// Обработчик для получения отзыва
bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    // Проверяем, есть ли принудительный ответ на обратную связь
    if (msg.reply_to_message && msg.reply_to_message.text === 'Напишите ваше сообщение, и мы передадим его администрации.') {
        const feedback = msg.text;
        const userId = msg.from.id;
        const userName = msg.from.first_name || 'Пользователь';

        // Проверяем, выбрана ли площадка
        const selectedPlace = feedbackState[chatId] || '#без_площадки'; // Если нет выбранной площадки

        // Формируем сообщение с ссылкой на пользователя и пометкой площадки
        const feedbackMessage = `<a href="tg://user?id=${userId}">${userName}</a> оставил отзыв: ${feedback}\n${selectedPlace}`;

        // Отправляем сообщение в канал с пометкой площадки
        const adminChatId = '-1002011198578'; // Замените на ваш ID администратора или ID канала
        bot.sendMessage(adminChatId, feedbackMessage, { parse_mode: 'HTML' });

        // Очищаем состояние обратной связи для данного пользователя
        delete feedbackState[chatId];

        // Возвращаем главное меню пользователю
        const mainMenuOptions = {
            reply_markup: JSON.stringify({
                keyboard: [
                    ['Забронировать на сайте'],
                    ['Спорткомплексы', 'Виды спорта'],
                    ['Оставить отзыв']
                ],
                resize_keyboard: true
            })
        };

        // Отправляем главное меню
        bot.sendMessage(chatId, 'Спасибо за ваш отзыв! Мы передали его администрации.', mainMenuOptions);
    }
});

