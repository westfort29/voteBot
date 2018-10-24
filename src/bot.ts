// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { TurnContext, ActivityTypes } from 'botbuilder';
import { getImage } from './http';
import { IVotingConfig } from './entities';
import { votingHandlers } from './votingModule';

const VOTING_PROPERTY = 'votingConfigProperty';
const COMMANDS = {
  'START': 'start',
  'FINISH': 'finish',
  'VOTE': 'select',
  'LAST_RESULT': 'result',
  'REOPEN': 'reopen',
  'RATE': 'rate',
  'HELP': 'help',
  'SHOW': 'show'
};
Object.freeze(COMMANDS);

const MAX_COMMAND_POSITION = 5;

export class MyBot {
    public conversationState;
    public votingConfig;
    public botName = 'voting assistant';
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

  async detectCommand(userInput: string[]) {
    let command = userInput[0].trim();
    let arrayWithCommand = command.split(' ');
    console.log(arrayWithCommand);
    let commandIndex = MAX_COMMAND_POSITION;
    for (let key in COMMANDS) {
      for (let i = 0; i < MAX_COMMAND_POSITION; i++) {
        if (arrayWithCommand[i]) {
          var indexOfCurrentCommand = arrayWithCommand.indexOf(COMMANDS[key]);
          console.log(`item checked: ${arrayWithCommand[i]} command: ${COMMANDS[key]} commandIndex: ${commandIndex} indexOfCurrentCommand: ${indexOfCurrentCommand}`);
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
    console.log(command);
    return command;
  }

  async getSlicedUserInput(userInput: string[], command: string): Promise<string> {
    return userInput[0].slice(userInput[0].indexOf(command) + command.length + 1);
  }

  async onTurn(turnContext: TurnContext) {
    if (turnContext.activity.type === ActivityTypes.Message) {
      let votingConfig: IVotingConfig = await this.votingConfig.get(turnContext);
      if (!votingConfig) {
        votingConfig = {
          topic: "",
          options: {},
          isActive: false,
          votedUsersId: []
        }
      }

      let userInput = turnContext.activity.text.split('!%');
      let command = await this.detectCommand(userInput);
      userInput[0] = await this.getSlicedUserInput(userInput, command);
      userInput.unshift('');
      switch(command) {
        case COMMANDS.HELP: {
          await this.giveHelp(turnContext);
          break;
        }
        case COMMANDS.START: {
          await votingHandlers.startVoting(userInput, votingConfig, turnContext);
          break;
        }
        case COMMANDS.VOTE: {
          await votingHandlers.handleVote(userInput, votingConfig, turnContext);
          break;
        }
        case COMMANDS.FINISH: {
          await votingHandlers.handleFinishVoting(votingConfig, turnContext);
          break;
        }
        case COMMANDS.LAST_RESULT: {
          await votingHandlers.handleResult(votingConfig, turnContext);
          break;
        }
        case COMMANDS.REOPEN: {
          await votingHandlers.handleReopen(votingConfig, turnContext);
          break;
        }
        case COMMANDS.RATE: {
          await this.handleRate(userInput, turnContext);
          break;
        }
        case COMMANDS.SHOW: {
          await this.handleShow(userInput, turnContext);
          break;
        }
        default: {
          await turnContext.sendActivity("Sorry, I can't understand you. Type 'help' if you need any help");
          break;
        }
      }

      await this.votingConfig.set(turnContext, votingConfig);
    } else if (turnContext.activity.type === ActivityTypes.ConversationUpdate) {
      await this.sendWelcomeMessage(turnContext);
    } else {
      await turnContext.sendActivity(`[${turnContext.activity.type} event detected]`);
    }
    await this.conversationState.saveChanges(turnContext);
  }

  async giveHelp(turnContext: TurnContext) {
    await turnContext.sendActivity(`
      To separate parts of your commands you should use !% sign combination
      I support the following commands
      to start voting — start voting_topic!% voting_option!% voting_option2 etc
      to finish voting, it will marm voting as not active, which means that no one can't vote anymore — finish
      to reopen voting — reopen
      to see result, even for not finished voting, but it won't mark voting as finished — result
      to ask me rate something — rate thing_you_want_to_rate
      to ask me to show something — show thing_you_want_to_show

      example start topic!% option_1!% option2
    `);
  }
  
  async handleRate(userInput: string[], turnContext: TurnContext) {
    let ratingSubject = userInput[1].trim();
    if (ratingSubject) {
      let rating = ratingSubject.toLowerCase().trim() === this.botName ? 10 : Math.floor(Math.random() * 11);
      let ratingAnswer = `I rate ${ratingSubject} by ${rating} from 10.`;
      if (rating === 10) {
        ratingAnswer += `\n\n ${ratingSubject} is(are) very nice!`
      }
      if (rating === 0) {
        ratingAnswer += `\n\n ${ratingSubject} is(are) really bad! Awful!`
      }
      await turnContext.sendActivity(ratingAnswer);
    } else {
      await turnContext.sendActivity(`Nothing to rate`);
    }
  }

  async handleShow(userInput: string[], turnContext: TurnContext) {
    let showigSubject = userInput[1].trim();
    if (showigSubject) {
      let img = await getImage(showigSubject);
      if (img) {
        await turnContext.sendActivity(
          {
            text: `Here is(are) ${showigSubject}`,
            attachments: [
              {
              name: showigSubject,
              contentType: 'image/png',
              contentUrl: img
              }
            ]
          }
        );
      } else {
        await turnContext.sendActivity(`Nothing to show with ${showigSubject}`).catch(()=>{console.log('error')});
      }
    } else {
      await turnContext.sendActivity(`Nothing to show`);
    }
  }

  async sendWelcomeMessage(turnContext: TurnContext) {
    if (turnContext.activity && turnContext.activity.membersAdded) {
      await turnContext.sendActivity(`Hello! I'm voting assistant. I would be pleased to help you to organize votings. Type 'help' if you need any help`);
      await this.giveHelp(turnContext);
    }
  }
}
