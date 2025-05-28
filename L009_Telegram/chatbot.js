const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
require('dotenv').config();

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });
const chatbotJSON = JSON.parse(fs.readFileSync('chatbot.json', 'utf-8'));

async function sendEmailNotification(to, subject, message, isHtml = true) {
    const emailData = {
        Brand: "L009",
        To: to,
        Subject: subject,
        Message: message,
        html: isHtml
    };

    try {
        const response = await fetch('https://l009-api-sendmail-railway.up.railway.app/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erro ao enviar notificação por e-mail:', errorData.error || 'Erro desconhecido.');
            return { success: false, error: errorData.error || 'Erro desconhecido.' };
        }

        const data = await response.json();
        console.log('Notificação por e-mail enviada com sucesso!', data.message);
        return { success: true, message: data.message };

    } catch (error) {
        console.error('Erro na requisição fetch para enviar e-mail:', error);
        return { success: false, error: 'Houve um problema de conexão ao enviar o e-mail.' };
    }
}

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

const handleOption = async (msg, optionKey) => {
    const data = chatbotJSON[optionKey];
    if (data) {
        bot.sendMessage(msg.chat.id, data.message, backOption);

        if (data.action && data.action.includes('sendToTeam')) {
            bot.sendMessage(msg.chat.id, chatbotJSON.sendToTeam);

            const userName = msg.from.first_name ? `${msg.from.first_name} ${msg.from.last_name || ''}`.trim() : 'Usuário Desconhecido';
            const userChatId = msg.chat.id;
            const selectedOptionText = chatbotJSON.menu.options[optionKey];

            const emailSubject = `🚨 Chatbot L009 - Novo Contato: ${selectedOptionText}`;
            const emailMessage = `
                <p>O usuário <strong>${userName}</strong> (ID do Chat: ${userChatId}) selecionou a opção <strong>"${selectedOptionText}"</strong> no chatbot.</p>
                <p>Esta é uma notificação automática para sua equipe.</p>
                <br>
                <p>Detalhes adicionais:</p>
                <ul>
                    <li>Nome de Usuário do Telegram: ${msg.from.username ? `@${msg.from.username}` : 'N/A'}</li>
                    <li>Texto digitado pelo usuário (se aplicável): "${msg.text}"</li>
                </ul>
                <br>
                <p>Por favor, entre em contato com o usuário ou tome a ação necessária.</p>
            `;

            const emailTeamRecipient = 'danmzzu@gmail.com';
            const emailResult = await sendEmailNotification(emailTeamRecipient, emailSubject, emailMessage);
            
            if (emailResult.success) {
                console.log('E-mail de notificação para a equipe enviado com sucesso!');
            } else {
                console.error('Falha ao enviar e-mail de notificação para a equipe:', emailResult.error);
            }
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