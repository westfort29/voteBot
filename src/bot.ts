// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityTypes, ConversationState, TurnContext } from "botbuilder";
import { COMMANDS, MAX_COMMAND_POSITION } from "./constants";
import { IVotingConfig } from "./entities";
import { getImage } from "./http";
import { randomModule, votingHandlers } from "./modules";

const VOTING_PROPERTY = "votingConfigProperty";

export class MyBot {
  public conversationState: ConversationState;
  public votingConfig: any;

  constructor(conversationState) {
    this.votingConfig = conversationState.createProperty(VOTING_PROPERTY);
    this.conversationState = conversationState;
  }

  public async onTurn(turnContext: TurnContext): Promise<void> {
    if (turnContext.activity.type === ActivityTypes.Message) {
      let votingConfig: IVotingConfig = await this.votingConfig.get(turnContext);
      if (!votingConfig) {
        votingConfig = {
          isActive: false,
          options: {},
          topic: "",
          votedUsersId: []
        };
      }

      const userInput = turnContext.activity.text.split(";");
      const command = await this.detectCommand(userInput);
      userInput[0] = await this.getSlicedUserInput(userInput, command);
      userInput.unshift("");
      switch (command) {
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
          await randomModule.handleRate(userInput, turnContext);
          break;
        }
        case COMMANDS.PICK: {
          await randomModule.handlePick(userInput, turnContext);
          break;
        }
        case COMMANDS.RANDOMIZE: {
          await randomModule.handleRandomize(userInput, turnContext);
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

  private async detectCommand(userInput: string[]): Promise<string> {
    let command = userInput[0].trim();
    const arrayWithCommand = command.split(" ").map((el) => el.toLowerCase());
    let commandIndex = MAX_COMMAND_POSITION;
    for (const key of Object.keys(COMMANDS)) {
      for (let i = 0; i < MAX_COMMAND_POSITION; i++) {
        if (arrayWithCommand[i]) {
          const indexOfCurrentCommand = arrayWithCommand.indexOf(COMMANDS[key]);
          if (indexOfCurrentCommand > -1 && indexOfCurrentCommand < MAX_COMMAND_POSITION) {
            commandIndex = indexOfCurrentCommand;
          }
          if (commandIndex === 0) {
            break;
          }
        }
      }
    }
    command = commandIndex === MAX_COMMAND_POSITION ? "unknown" : arrayWithCommand[commandIndex];
    return command;
  }

  private async getSlicedUserInput(userInput: string[], command: string): Promise<string> {
    return userInput[0].slice(userInput[0].indexOf(command) + command.length + 1);
  }

  private async giveHelp(turnContext: TurnContext): Promise<void> {
    await turnContext.sendActivity(`
      To separate parts of your commands you should use ; sign combination
      I support the following commands
      to start voting — start voting_topic; voting_option; voting_option2
      to finish voting, it will mark voting as not active, which means that no one can't vote anymore — finish
      to reopen voting — reopen
      to see result, even for not finished voting, but it won't mark voting as finished — result
      to ask me rate something — rate thing_you_want_to_rate
      to ask me to show something — show thing_you_want_to_show
      to ask me to randomly pick from your list pick option_1; option_2
      to ask me randomly generate number from: 0 to 100 — randomize, 0 to #your_number — randomize #your_number,
        #min to #max — randomize #min; #max

      example start topic; option_1; option2
    `);
  }

  private async handleShow(userInput: string[], turnContext: TurnContext): Promise<void> {
    const showigSubject = userInput[1].trim();
    if (showigSubject) {
      const img = await getImage(showigSubject);
      if (img) {
        await turnContext.sendActivity(
          {
            attachments: [
              {
                contentType: "image/png",
                contentUrl: img,
                name: showigSubject
              }
            ],
            text: `Here is(are) ${showigSubject}`
          }
        );
      } else {
        /* tslint:disable */
        await turnContext.sendActivity(`Nothing to show with ${showigSubject}`).catch((e) => {console.log(e)});
        /* tslint:enable */
      }
    } else {
      await turnContext.sendActivity(`Nothing to show`);
    }
  }

  private async sendWelcomeMessage(turnContext: TurnContext): Promise<void> {
    if (turnContext.activity && turnContext.activity.membersAdded) {
      await turnContext.sendActivity(
        `Hello! I'm voting assistant.
        I would be pleased to help you to organize votings. Type 'help' if you need any help`
      );
      await this.giveHelp(turnContext);
    }
  }
}
