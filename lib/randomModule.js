"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
class RandomModule {
    constructor() {
        this.botName = 'voting assistant';
    }
    handleRate(userInput, turnContext) {
        return __awaiter(this, void 0, void 0, function* () {
            let ratingSubject = userInput[1].trim();
            if (ratingSubject) {
                let rating = ratingSubject.toLowerCase().trim() === constants_1.BOT_NAME ? 10 : Math.floor(Math.random() * 11);
                let ratingAnswer = `I rate ${ratingSubject} by ${rating} from 10.`;
                if (rating === 10) {
                    ratingAnswer += `\n\n ${ratingSubject} is(are) very nice!`;
                }
                if (rating === 0) {
                    ratingAnswer += `\n\n ${ratingSubject} is(are) really bad! Awful!`;
                }
                yield turnContext.sendActivity(ratingAnswer);
            }
            else {
                yield turnContext.sendActivity(`Nothing to rate`);
            }
        });
    }
    handlePick(userInput, turnContext) {
        return __awaiter(this, void 0, void 0, function* () {
            let variety = userInput.slice(1);
            if (variety.length > 2) {
                let randomIndex = Math.floor(Math.random() * variety.length);
                yield turnContext.sendActivity(`I pick ${variety[randomIndex].trim()}!`);
            }
            else {
                yield turnContext.sendActivity(`There is nothing to pick from, please add some varieties`);
            }
        });
    }
}
exports.randomModule = new RandomModule();
//# sourceMappingURL=randomModule.js.map