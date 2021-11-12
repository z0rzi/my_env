#!/bin/node
import { Telegraf } from 'telegraf';
const GEEV_BOT_KEY = '1951082037:AAFEg3Igor0D1txbDjE2iTHfFwlF7FUlNYw';
const bot = new Telegraf(GEEV_BOT_KEY);
bot.start(ctx => ctx.reply('Welcome'));
bot.help(ctx => ctx.reply('Send me a sticker'));
bot.on('sticker', ctx => ctx.reply('👍'));
bot.hears('hi', ctx => ctx.reply('Hey there'));
bot.on('text', ctx => {
    // Explicit usage
    ctx.telegram.sendMessage(ctx.message.chat.id, `Hello ${ctx.state.role}`);
    // Using context shortcut
    ctx.reply(`Hello ${ctx.state.role}`);
});
bot.launch();
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
//# sourceMappingURL=telegram.js.map