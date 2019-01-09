import { TurnContext } from 'botbuilder';

class BattleModule {
  async handleFight(userInput: string[], turnContext: TurnContext) {
    let variety = userInput.slice(1);
    if (variety.length > 1) {
      let randomIndex = Math.floor(Math.random() * variety.length);
      await turnContext.sendActivity(`I pick ${variety[randomIndex].trim()}!`);
    } else {
      await turnContext.sendActivity(`There is nothing to pick from, please add some varieties`);
    }
  }

  async handleKick(userInput: string[], turnContext: TurnContext) {

  }

  async handleFightEnd(userInput: string[], turnContext: TurnContext) {

  }
}

export const battleModule = new BattleModule();
