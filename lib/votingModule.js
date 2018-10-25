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
const botbuilder_1 = require("botbuilder");
const http_1 = require("./http");
class VotingModule {
    makeOptionCards(votingConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            let cards = [];
            for (let option in votingConfig.options) {
                let img = yield http_1.getImage(votingConfig.options[option].name);
                cards.push(botbuilder_1.CardFactory.heroCard(votingConfig.options[option].name, [img], [
                    {
                        type: 'postBack',
                        title: 'vote!',
                        value: `select ${votingConfig.options[option].id}`,
                        text: 'I have voted',
                        displayText: 'I have voted'
                    }
                ]));
            }
            let cardsMessage = botbuilder_1.MessageFactory.list(cards);
            return yield cardsMessage;
        });
    }
    startVoting(userInputConfig, currentVotingConfig, turnContext) {
        return __awaiter(this, void 0, void 0, function* () {
            let topic = userInputConfig[1].trim();
            if (currentVotingConfig.isActive) {
                yield turnContext.sendActivity(`There is an active votig. You have to finish it to start the new one!`);
            }
            else if (topic && userInputConfig[2] && userInputConfig[2].trim() && userInputConfig[3] && userInputConfig[3].trim()) {
                currentVotingConfig.isActive = true;
                currentVotingConfig.topic = topic;
                let votingOptions = userInputConfig.slice(2);
                votingOptions.forEach((element, index) => {
                    if (element.trim()) {
                        currentVotingConfig.options[index] = {
                            id: index,
                            name: element.trim(),
                            votesCount: 0
                        };
                    }
                });
                currentVotingConfig.votedUsersId = [];
                let optionsList = '';
                for (let option in currentVotingConfig.options) {
                    optionsList += '\n\n ' + currentVotingConfig.options[option].id + ' is an id for ' + currentVotingConfig.options[option].name;
                }
                yield turnContext.sendActivity(`The voting about "${topic}" has started! \n\n To vote for your option type "select *option_number*". \n\n ${optionsList}`);
                yield turnContext.sendActivity(yield this.makeOptionCards(currentVotingConfig));
            }
            else {
                yield turnContext.sendActivity(`Not enough data to start voting`);
            }
        });
    }
    handleFinishVoting(votingConfig, turnContext) {
        return __awaiter(this, void 0, void 0, function* () {
            if (votingConfig.isActive) {
                votingConfig.isActive = false;
                yield turnContext.sendActivity(`Votings about "${votingConfig.topic}" has finished`);
                yield this.handleResult(votingConfig, turnContext);
            }
            else {
                yield turnContext.sendActivity(`No votings to finish`);
            }
        });
    }
    handleResult(votingConfig, turnContext) {
        return __awaiter(this, void 0, void 0, function* () {
            if (votingConfig.topic) {
                let resultString = '';
                let maxVotesCount = 0;
                let wonOptionsId = [];
                for (let option in votingConfig.options) {
                    let optionVotesCount = votingConfig.options[option].votesCount;
                    resultString += '\n\n ' + votingConfig.options[option].name + ' has ' + optionVotesCount + ' vote(s)';
                    if (maxVotesCount < optionVotesCount) {
                        wonOptionsId = [option];
                        maxVotesCount = optionVotesCount;
                    }
                    else if (maxVotesCount == optionVotesCount) {
                        wonOptionsId.push(option);
                    }
                }
                ;
                let wonAnounseString = '\n\n ';
                if (wonOptionsId.length > 1) {
                    wonAnounseString += '\n\n Unfortunatly some of results have same amount of votes. You can reopen current voting or start a new one.';
                }
                else {
                    let winStatus = votingConfig.isActive ? ' is winning ' : ' have won ';
                    wonAnounseString += '\n\n "' + votingConfig.options[wonOptionsId[0]].name + '"' + winStatus + 'with ' + votingConfig.options[wonOptionsId[0]].votesCount + ' votes';
                }
                yield turnContext.sendActivity(`The results of the voting about "${votingConfig.topic}" are: ${resultString} ${wonAnounseString}`);
            }
            else {
                yield turnContext.sendActivity(`No votings to display`);
            }
        });
    }
    handleVote(userInput, votingConfig, turnContext) {
        return __awaiter(this, void 0, void 0, function* () {
            if (votingConfig.isActive) {
                let votedOptionId = userInput[1].trim();
                let votingUsersId = turnContext.activity.from.id;
                let isUserVoted = votingConfig.votedUsersId.some(userId => userId == votingUsersId);
                if (votedOptionId && !isUserVoted) {
                    votedOptionId = parseInt(votedOptionId);
                    if (votingConfig.options[votedOptionId]) {
                        votingConfig.options[votedOptionId].votesCount++;
                        votingConfig.votedUsersId.push(votingUsersId);
                    }
                    else {
                        yield turnContext.sendActivity(`There is no such option`);
                    }
                }
                else if (isUserVoted) {
                    let userNameOrId = turnContext.activity.from.name || votingUsersId;
                    yield turnContext.sendActivity(`${userNameOrId} is a cheater, he have tried to vote twice`);
                }
            }
            else {
                yield turnContext.sendActivity(`There is no active voting`);
            }
        });
    }
    handleReopen(votingConfig, turnContext) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!votingConfig.isActive && votingConfig.topic) {
                votingConfig.isActive = true;
                yield turnContext.sendActivity(`Voting about ${votingConfig.topic} is continuing`);
            }
            else {
                yield turnContext.sendActivity(`There is no voting to reopen`);
            }
        });
    }
}
exports.votingHandlers = new VotingModule();
//# sourceMappingURL=votingModule.js.map