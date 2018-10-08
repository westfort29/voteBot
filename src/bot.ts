import { TurnContext } from "botbuilder";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes } = require('botbuilder');

const VOTING_PROPERTY = 'votingConfigProperty';
enum VOTE_COMMANDS {
  'START'= 'start',
  'FINISH' = 'finish',
  'VOTE' = 'vote',
  'LAST_RESULT' = 'result',
  'REOPEN' = 'reopen'
}

interface IVotingConfig {
  topic: string;
  options: Object;
  isActive: boolean;
  votedUsersId: any[];
}

export class MyBot {
    public conversationState;
    public votingConfig;
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
      let userInput = turnContext.activity.text.split('!% ');
      let command = userInput[0].trim();
      switch(command) {
        case VOTE_COMMANDS.START: {
          await this.startVoting(userInput, votingConfig, turnContext);
          break;
        }
        case VOTE_COMMANDS.VOTE: {
          await this.handleVote(userInput, votingConfig, turnContext);
          break;
        }
        case VOTE_COMMANDS.FINISH: {
          if (votingConfig.isActive) {
            votingConfig.isActive = false;
            await turnContext.sendActivity(`Votings about "${votingConfig.topic}" is finished`);
          } else {
            await turnContext.sendActivity(`No votings to finish`);
          }
          break;
        }
        case VOTE_COMMANDS.LAST_RESULT: {
          await this.handleResult(votingConfig, turnContext);
          break;
        }
        case VOTE_COMMANDS.REOPEN: {
          if (!votingConfig.isActive && votingConfig.topic) {
            votingConfig.isActive = true;
            await turnContext.sendActivity(`Voting is continuing`);
          } else {
            await turnContext.sendActivity(`No voting to reopen`);
          }
          break;
        }
        default: {
          break;
        }
      }

      await this.votingConfig.set(turnContext, votingConfig);
    } else {
      await turnContext.sendActivity(`[${turnContext.activity.type} event detected]`);
    }
    await this.conversationState.saveChanges(turnContext);
  }

  async startVoting(userInputConfig, currentVotingConfig, turnContext) {
    let topic = userInputConfig[1];
    if (currentVotingConfig.isActive) {
      await turnContext.sendActivity(`There is an active votig. You have to finish it to start the new one!`);
    } else if (topic && userInputConfig[2] && userInputConfig[3]) {
      currentVotingConfig.isActive = true;
      currentVotingConfig.topic = topic;
      let votingOptions = userInputConfig.slice(2);
      votingOptions.forEach((element, index) => {
        currentVotingConfig.options[index] = {
          id: index,
          name: element,
          votesCount: 0
        }
      });
      let optionsList = '';
      for (let option in currentVotingConfig.options) {
        optionsList += '\n *' + currentVotingConfig.options[option].id + '* is an id for ' + currentVotingConfig.options[option].name;
      }
      await turnContext.sendActivity(`The voting about "${topic}" has started! \n To vote for your option type "vote!% *option_number*". \n${optionsList}`);

    } else {
      await turnContext.sendActivity(`Not enough data to start voting`);
    }
  }

  async handleResult(votingConfig, turnContext) {
    if (votingConfig.topic) {
      let resultString = '';
      let maxVotesCount = 0;
      let wonOptionsId = [];
      for (let option in votingConfig.options) {
        let optionVotesCount = votingConfig.options[option].votesCount
        resultString += '\n' + votingConfig.options[option].name + ' has ' + optionVotesCount + ' votes';
        if (maxVotesCount < optionVotesCount) {
          wonOptionsId = [option];
          maxVotesCount = optionVotesCount;
        } else if (maxVotesCount == optionVotesCount) {
          wonOptionsId.push(option);
        }
      };
      let wonAnounseString = '\n';
      if (wonOptionsId.length > 1) {
        wonAnounseString += 'Unfortunatly some of results have same amount of votes. You can reopen current voting or start a new one.';
      } else {
        wonAnounseString += '\n"*' + votingConfig.options[wonOptionsId[0]].name + '*"' + ' have won with ' + votingConfig.options[wonOptionsId[0]].votesCount + ' votes';
      }
      await turnContext.sendActivity(`The results of the voting about "${votingConfig.topic}" are: ${resultString} ${wonAnounseString}`);
    } else {
      await turnContext.sendActivity(`No votings to display`);
    }
  }

  async handleVote(userInput, votingConfig, turnContext) {
    let votedOptionId = userInput[1].trim();
    let votingUsersId = turnContext.activity.from.id;
    let isUserVoted =  votingConfig.votedUsersId.some(userId => userId == votingUsersId)
    if (votedOptionId && !isUserVoted) {
      votedOptionId = parseInt(votedOptionId);
      votingConfig.options[votedOptionId].votesCount++;
      votingConfig.votedUsersId.push(votingUsersId);
    } else if (isUserVoted) {
      let userNameOrId = turnContext.activity.from.name || votingUsersId
      await turnContext.sendActivity(`${userNameOrId} is a cheater, he tried to vote twice`);
    }
  }
}
