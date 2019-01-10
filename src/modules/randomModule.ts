import { TurnContext } from "botbuilder";
import { BOT_NAME } from "../constants";

class RandomModule {
  public botName = "voting assistant";

  public async handleRate(userInput: string[], turnContext: TurnContext): Promise<void> {
    const ratingSubject = userInput[1].trim();
    if (ratingSubject) {
      const rating = ratingSubject.toLowerCase().trim() === BOT_NAME ? 10 : Math.floor(Math.random() * 11);
      let ratingAnswer = `I rate ${ratingSubject} by ${rating} from 10.`;
      if (rating === 10) {
        ratingAnswer += `\n\n ${ratingSubject} is(are) very nice!`;
      }
      if (rating === 0) {
        ratingAnswer += `\n\n ${ratingSubject} is(are) really bad! Awful!`;
      }
      await turnContext.sendActivity(ratingAnswer);
    } else {
      await turnContext.sendActivity(`Nothing to rate`);
    }
  }

  public async handlePick(userInput: string[], turnContext: TurnContext): Promise<void> {
    const variety = userInput.slice(1);
    if (variety.length > 1) {
      const randomIndex = Math.floor(Math.random() * variety.length);
      await turnContext.sendActivity(`I pick ${variety[randomIndex].trim()}!`);
    } else {
      await turnContext.sendActivity(`There is nothing to pick from, please add some varieties`);
    }
  }

  public async handleRandomize(userInput: string[], turnContext: TurnContext): Promise<void> {
    const variety = userInput.slice(1);
    const firstInput = parseInt(variety[0], 10);
    const secondInput = parseInt(variety[1], 10);
    const userNameOrId = turnContext.activity.from.name || turnContext.activity.from.id;
    if (variety.length === 1 && (!firstInput || firstInput === 0)) {
      const randomHundred = Math.floor(Math.random() * 101);
      await turnContext.sendActivity(`${userNameOrId}, you got ${randomHundred} from 100!`);
    } else if (variety.length === 1 && firstInput) {
      const userRandom = Math.floor(Math.random() * (firstInput + 1));
      await turnContext.sendActivity(`${userNameOrId}, you got ${userRandom} from ${firstInput}!`);
    } else if (variety.length === 2 && (firstInput || firstInput === 0) && (secondInput || secondInput === 0)) {
      const randomFromRange = Math.floor(Math.random() * (secondInput - firstInput + 1) + firstInput);
      await turnContext.sendActivity(`${userNameOrId}, you got ${randomFromRange} from ${secondInput}!`);
    } else {
      await turnContext.sendActivity(`Excuse me, I can't understand you. Please type help to get help`);
    }
  }
}

export const randomModule = new RandomModule();
