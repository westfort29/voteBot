"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
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
const votingModule_1 = require("./votingModule");
const randomModule_1 = require("./randomModule");
const VOTING_PROPERTY = 'votingConfigProperty';
const COMMANDS = {
    'START': 'start',
    'FINISH': 'finish',
    'VOTE': 'select',
    'LAST_RESULT': 'result',
    'REOPEN': 'reopen',
    'RATE': 'rate',
    'HELP': 'help',
    'SHOW': 'show',
    'PICK': 'pick'
};
Object.freeze(COMMANDS);
const MAX_COMMAND_POSITION = 5;
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
            let arrayWithCommand = command.split(' ').map(el => el.toLowerCase());
            let commandIndex = MAX_COMMAND_POSITION;
            for (let key in COMMANDS) {
                for (let i = 0; i < MAX_COMMAND_POSITION; i++) {
                    if (arrayWithCommand[i]) {
                        var indexOfCurrentCommand = arrayWithCommand.indexOf(COMMANDS[key]);
                        if (indexOfCurrentCommand > -1 && indexOfCurrentCommand < MAX_COMMAND_POSITION) {
                            commandIndex = indexOfCurrentCommand;
                        }
                        if (commandIndex === 0) {
                            break;
                        }
                    }
                }
            }
            command = commandIndex === MAX_COMMAND_POSITION ? 'unknown' : arrayWithCommand[commandIndex];
            return command;
        });
    }
    getSlicedUserInput(userInput, command) {
        return __awaiter(this, void 0, void 0, function* () {
            return userInput[0].slice(userInput[0].indexOf(command) + command.length + 1);
        });
    }
    onTurn(turnContext) {
        return __awaiter(this, void 0, void 0, function* () {
            if (turnContext.activity.type === botbuilder_1.ActivityTypes.Message) {
                let votingConfig = yield this.votingConfig.get(turnContext);
                if (!votingConfig) {
                    votingConfig = {
                        topic: "",
                        options: {},
                        isActive: false,
                        votedUsersId: []
                    };
                }
                let userInput = turnContext.activity.text.split(';');
                let command = yield this.detectCommand(userInput);
                userInput[0] = yield this.getSlicedUserInput(userInput, command);
                userInput.unshift('');
                switch (command) {
                    case COMMANDS.HELP: {
                        yield this.giveHelp(turnContext);
                        break;
                    }
                    case COMMANDS.START: {
                        yield votingModule_1.votingHandlers.startVoting(userInput, votingConfig, turnContext);
                        break;
                    }
                    case COMMANDS.VOTE: {
                        yield votingModule_1.votingHandlers.handleVote(userInput, votingConfig, turnContext);
                        break;
                    }
                    case COMMANDS.FINISH: {
                        yield votingModule_1.votingHandlers.handleFinishVoting(votingConfig, turnContext);
                        break;
                    }
                    case COMMANDS.LAST_RESULT: {
                        yield votingModule_1.votingHandlers.handleResult(votingConfig, turnContext);
                        break;
                    }
                    case COMMANDS.REOPEN: {
                        yield votingModule_1.votingHandlers.handleReopen(votingConfig, turnContext);
                        break;
                    }
                    case COMMANDS.RATE: {
                        yield randomModule_1.randomModule.handleRate(userInput, turnContext);
                        break;
                    }
                    case COMMANDS.PICK: {
                        yield randomModule_1.randomModule.handlePick(userInput, turnContext);
                        break;
                    }
                    case COMMANDS.SHOW: {
                        yield this.handleShow(userInput, turnContext);
                        break;
                    }
                    default: {
                        yield turnContext.sendActivity("Sorry, I can't understand you. Type 'help' if you need any help");
                        break;
                    }
                }
                yield this.votingConfig.set(turnContext, votingConfig);
            }
            else if (turnContext.activity.type === botbuilder_1.ActivityTypes.ConversationUpdate) {
                yield this.sendWelcomeMessage(turnContext);
            }
            else {
                yield turnContext.sendActivity(`[${turnContext.activity.type} event detected]`);
            }
            yield this.conversationState.saveChanges(turnContext);
        });
    }
    giveHelp(turnContext) {
        return __awaiter(this, void 0, void 0, function* () {
            yield turnContext.sendActivity(`
      To separate parts of your commands you should use ; sign combination
      I support the following commands
      to start voting — start voting_topic; voting_option; voting_option2
      to finish voting, it will mark voting as not active, which means that no one can't vote anymore — finish
      to reopen voting — reopen
      to see result, even for not finished voting, but it won't mark voting as finished — result
      to ask me rate something — rate thing_you_want_to_rate
      to ask me to show something — show thing_you_want_to_show
      to ask me to randomly pick from your list pick option_1; option_2

      example start topic; option_1; option2
    `);
        });
    }
    handleShow(userInput, turnContext) {
        return __awaiter(this, void 0, void 0, function* () {
            let showigSubject = userInput[1].trim();
            if (showigSubject) {
                let img = yield http_1.getImage(showigSubject);
                if (img) {
                    yield turnContext.sendActivity({
                        text: `Here is(are) ${showigSubject}`,
                        attachments: [
                            {
                                name: showigSubject,
                                contentType: 'image/png',
                                contentUrl: img
                            }
                        ]
                    });
                }
                else {
                    yield turnContext.sendActivity(`Nothing to show with ${showigSubject}`).catch(() => { console.log('error'); });
                }
            }
            else {
                yield turnContext.sendActivity(`Nothing to show`);
            }
        });
    }
    sendWelcomeMessage(turnContext) {
        return __awaiter(this, void 0, void 0, function* () {
            if (turnContext.activity && turnContext.activity.membersAdded) {
                yield turnContext.sendActivity(`Hello! I'm voting assistant. I would be pleased to help you to organize votings. Type 'help' if you need any help`);
                yield this.giveHelp(turnContext);
            }
        });
    }
}
exports.MyBot = MyBot;
//# sourceMappingURL=bot.js.map