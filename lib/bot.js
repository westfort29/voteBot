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
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const { ActivityTypes } = require('botbuilder');
const VOTING_PROPERTY = 'votingConfigProperty';
var VOTE_COMMANDS;
(function (VOTE_COMMANDS) {
    VOTE_COMMANDS["START"] = "start";
    VOTE_COMMANDS["FINISH"] = "finish";
    VOTE_COMMANDS["VOTE"] = "vote";
    VOTE_COMMANDS["LAST_RESULT"] = "result";
    VOTE_COMMANDS["REOPEN"] = "reopen";
    VOTE_COMMANDS["RATE"] = "rate";
})(VOTE_COMMANDS || (VOTE_COMMANDS = {}));
class MyBot {
    /**
     *
     * @param {ConversationState} conversation state object
     */
    constructor(conversationState) {
        this.votingConfig = conversationState.createProperty(VOTING_PROPERTY);
        this.conversationState = conversationState;
    }
    /**
     *
     * @param {TurnContext} on turn context object.
     */
    detectCommand(userInput) {
        return __awaiter(this, void 0, void 0, function* () {
            let command = userInput[0].trim();
            let commandA = command.split(' ');
            command = commandA[commandA.length - 1].toLowerCase();
            return command;
        });
    }
    onTurn(turnContext) {
        return __awaiter(this, void 0, void 0, function* () {
            if (turnContext.activity.type === ActivityTypes.Message) {
                let votingConfig = yield this.votingConfig.get(turnContext);
                if (!votingConfig) {
                    votingConfig = {
                        topic: "",
                        options: {},
                        isActive: false,
                        votedUsersId: []
                    };
                }
                let userInput = turnContext.activity.text.split('!% ');
                let command = yield this.detectCommand(userInput);
                switch (command) {
                    case VOTE_COMMANDS.START: {
                        yield this.startVoting(userInput, votingConfig, turnContext);
                        break;
                    }
                    case VOTE_COMMANDS.VOTE: {
                        yield this.handleVote(userInput, votingConfig, turnContext);
                        break;
                    }
                    case VOTE_COMMANDS.FINISH: {
                        if (votingConfig.isActive) {
                            votingConfig.isActive = false;
                            yield turnContext.sendActivity(`Votings about "${votingConfig.topic}" has finished`);
                            yield this.handleResult(votingConfig, turnContext);
                        }
                        else {
                            yield turnContext.sendActivity(`No votings to finish`);
                        }
                        break;
                    }
                    case VOTE_COMMANDS.LAST_RESULT: {
                        yield this.handleResult(votingConfig, turnContext);
                        break;
                    }
                    case VOTE_COMMANDS.REOPEN: {
                        if (!votingConfig.isActive && votingConfig.topic) {
                            votingConfig.isActive = true;
                            yield turnContext.sendActivity(`Voting is continuing`);
                        }
                        else {
                            yield turnContext.sendActivity(`No voting to reopen`);
                        }
                        break;
                    }
                    case VOTE_COMMANDS.RATE: {
                        this.handleRate(userInput, turnContext);
                        break;
                    }
                    default: {
                        break;
                    }
                }
                yield this.votingConfig.set(turnContext, votingConfig);
            }
            else {
                yield turnContext.sendActivity(`[${turnContext.activity.type} event detected]`);
            }
            yield this.conversationState.saveChanges(turnContext);
        });
    }
    startVoting(userInputConfig, currentVotingConfig, turnContext) {
        return __awaiter(this, void 0, void 0, function* () {
            let topic = userInputConfig[1];
            if (currentVotingConfig.isActive) {
                yield turnContext.sendActivity(`There is an active votig. You have to finish it to start the new one!`);
            }
            else if (topic && userInputConfig[2] && userInputConfig[3]) {
                currentVotingConfig.isActive = true;
                currentVotingConfig.topic = topic;
                let votingOptions = userInputConfig.slice(2);
                votingOptions.forEach((element, index) => {
                    currentVotingConfig.options[index] = {
                        id: index,
                        name: element,
                        votesCount: 0
                    };
                });
                currentVotingConfig.votedUsersId = [];
                let optionsList = '';
                for (let option in currentVotingConfig.options) {
                    optionsList += '\n\n ' + currentVotingConfig.options[option].id + ' is an id for ' + currentVotingConfig.options[option].name;
                }
                yield turnContext.sendActivity(`The voting about "${topic}" has started! \n\n To vote for your option type "vote!% *option_number*". \n\n ${optionsList}`);
            }
            else {
                yield turnContext.sendActivity(`Not enough data to start voting`);
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
                    resultString += '\n\n ' + votingConfig.options[option].name + ' has ' + optionVotesCount + ' votes';
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
                    wonAnounseString += '\n\n "' + votingConfig.options[wonOptionsId[0]].name + '"' + ' have won with ' + votingConfig.options[wonOptionsId[0]].votesCount + ' votes';
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
        });
    }
    handleRate(userInput, turnContext) {
        return __awaiter(this, void 0, void 0, function* () {
            let ratingSubject = userInput[1].trim();
            if (ratingSubject) {
                let rating = Math.floor(Math.random() * 11);
                let ratingAnswer = `I rate ${ratingSubject} by ${rating} from 10.`;
                if (rating === 10) {
                    ratingAnswer += `\n\n ${ratingSubject} is nice!`;
                }
                if (rating === 0) {
                    ratingAnswer += `\n\n ${ratingSubject} sucks!`;
                }
                yield turnContext.sendActivity(ratingAnswer);
            }
            else {
                yield turnContext.sendActivity(`Nothing to rate`);
            }
        });
    }
}
exports.MyBot = MyBot;
//# sourceMappingURL=bot.js.map