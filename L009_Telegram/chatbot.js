const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
require('dotenv').config();

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });
const chatbotJSON = JSON.parse(fs.readFileSync('chatbot.json', 'utf-8'));

const mainMenu = () => {
    const options = Object.values(chatbotJSON.menu.options).map((text) => [{ text }]);
    return {
        reply_markup: {
            keyboard: [...options],
            resize_keyboard: true
        }
    };
};

const backOption = {
    reply_markup: {
        keyboard: [[{ text: chatbotJSON.backToMainMenu }]],
        resize_keyboard: true
    }
};

const handleOption = (msg, optionKey) => {
    const data = chatbotJSON[optionKey];
    if (data) {
        bot.sendMessage(msg.chat.id, data.message, backOption);

        if (data.action && data.action.includes('sendToTeam')) {
            bot.sendMessage(msg.chat.id, chatbotJSON.sendToTeam);
        }
    }
};

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.username ? `@${msg.from.username}` : 'N/A';
    const userFullName = `${msg.from.first_name || ''} ${msg.from.last_name || ''}`.trim() || 'N/A';

    console.log(`User started the bot:`);
    console.log(`Chat ID: ${chatId}`);
    console.log(`Nome: ${userFullName}`);
    console.log(`@: ${userName}`);
    
    bot.sendMessage(msg.chat.id, chatbotJSON.start, mainMenu());
    bot.sendMessage(msg.chat.id, chatbotJSON.menu.message, mainMenu());
});

bot.on('message', (msg) => {
    const text = msg.text;

    const optionMap = {
        'Landing Pages': 'option1',
        'Chatbots': 'option2',
        'Tráfego Pago': 'option3',
        'Automação de Processos': 'option4',
        'Suporte': 'option5',
        'Financeiro': 'option6'
    };

    if (text === chatbotJSON.backToMainMenu) {
        bot.sendMessage(msg.chat.id, chatbotJSON.menu.message, mainMenu());
        return;
    }

    const optionKey = optionMap[text];
    if (optionKey) {
        handleOption(msg, optionKey);
    }
});