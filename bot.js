const { Telegraf, Markup } = require("telegraf");
const { message } = require("telegraf/filters");
const axios = require("axios");
const Models = require("./db/models");
require("dotenv").config();
const ChuckNorris = require("./ChuckNorris");

const bot = new Telegraf(process.env.BOT_TOKEN);

const main = async () => {
  let lastJoke = "";
  bot.start(async (ctx) => {
    try {
      await ctx.replyWithSticker(
        "https://tlgrm.eu/_/stickers/8a1/9aa/8a19aab4-98c0-37cb-a3d4-491cb94d7e12/1.webp"
      );
      await ctx.reply(
        `Добро пожаловать, ${
          ctx.message.from.first_name
            ? ctx.message.from.first_name
            : "незнакомец"
        }!`,
        menu
      );
    } catch (e) {
      console.error(e);
    }
  });

  bot.help((ctx) => ctx.reply("Send me a sticker"));
  bot.on(message("sticker"), (ctx) => ctx.reply("👍"));
  bot.hears("hi", (ctx) => ctx.reply("Hey there"));

  bot.hears("Joke", async (ctx) => {
    try {
      let joke = await ChuckNorris.getJoke();
      lastJoke = joke;
      // eslint-disable-next-line indent, no-unused-expressions
      joke.includes("Chuck Norris")
        ? await ctx.reply(joke, inlineSave)
        : await ctx.reply("Была получена невалидная шутка");
    } catch (e) {
      console.error(e);
    }
  });

  bot.hears("Weather", async (ctx) => {
    try {
      await ctx.reply("Отправьте вашу геолокацию");
      bot.on("message", async (ctx) => {
        if (ctx.message.location) {
          const url = `https://api.openweathermap.org/data/2.5/weather?lat=${ctx.message.location.latitude}&lon=${ctx.message.location.longitude}&units=metric&appid=a011d64efbfcd61668f4a63f7c3448f2`;
          const responce = await axios.get(url);
          await ctx.reply(
            `${responce.data.name}: ${responce.data.main.temp} C`
          );
        }
      });
    } catch (e) {
      console.error(e);
    }
  });

  bot.hears("My jokes", async (ctx) => {
    try {
      let allJokes = await Models.Joke.findAll({
        attributes: ["joke"],
      });
      if (!allJokes.length) return ctx.reply('Вы еще не сохраняли шутки')
      let answer = allJokes.map((Joke) => Joke.dataValues.joke)
      await ctx.reply(answer.join('\n\n'));
    } catch (e) {
      console.error(e);
    }
  });
  bot.hears("Delete all jokes", async (ctx) => {
    try {
      Models.Joke.destroy({
        where: {},
      });
      await ctx.reply("База очищена");
    } catch (e) {
      console.error(e);
    }
  });
  bot.action("btn_save", async (ctx) => {
    try {
      await ctx.answerCbQuery();
      let findJokes = await Models.Joke.findAll({attributes: ["joke"]});
      let checkJoke = findJokes.filter((Joke) => Joke.dataValues.joke === lastJoke)
      if (checkJoke.length) {
        ctx.reply('Данная шутка уже сохранена в базе')
        return;
      }
      if (findJokes.length < 10) {
        await Models.Joke.create({ joke: lastJoke });
        await ctx.reply("Сохранили шутку");
      } else if (findJokes.length >= 10) {
        await ctx.replyWithSticker('https://tlgrm.ru/_/stickers/696/3ad/6963ad3a-2019-32d2-ac85-34af3c84e50b/192/21.webp')
        await ctx.reply("База переполнена. Хотите перезаписать самую старую шутку на новую?",inlineUpdate);
      }
    } catch (e) {
      console.error(e);
    }
  });

  bot.action("btn_updateYes", async (ctx) => {
    try {
      let idJokes = await Models.Joke.findAll({attributes: ['id']});
      let minId = idJokes[0].dataValues.id
      idJokes.forEach((el) => {
        if(el.dataValues.id < minId) {
          minId = el.dataValues.id
        }
      })
      await ctx.answerCbQuery();
      await Models.Joke.update({ joke: lastJoke },{where: {id: minId}});
      await ctx.reply('Шутка перезаписана')
    } catch (e) {
      console.error(e);
    }
  });

  bot.action("btn_updateNo", async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.reply("Сам запомнишь тогда!");
      await ctx.replyWithSticker('https://tlgrm.ru/_/stickers/696/3ad/6963ad3a-2019-32d2-ac85-34af3c84e50b/11.webp')
    } catch (e) {
      console.error(e);
    }
  });

  const menu = {
    reply_markup: {
      keyboard: [
        [{ text: "Joke" }, { text: "Weather" }],
        [{ text: "My jokes" }, { text: "Delete all jokes" }],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    },
  };

  const inlineSave = Markup.inlineKeyboard([
    Markup.button.callback("Save", "btn_save"),
  ]);

  const inlineUpdate = Markup.inlineKeyboard([
    Markup.button.callback("Yes", "btn_updateYes"),
    Markup.button.callback("No", "btn_updateNo"),
  ]);

  bot.launch();

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
};

main();
