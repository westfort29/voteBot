// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { TurnContext, ActivityTypes, MessageFactory, CardFactory } from 'botbuilder';
import { getImage } from './http';

const VOTING_PROPERTY = 'votingConfigProperty';
enum VOTE_COMMANDS {
  'START'= 'start',
  'FINISH' = 'finish',
  'VOTE' = 'vote',
  'LAST_RESULT' = 'result',
  'REOPEN' = 'reopen',
  'RATE' = 'rate',
  'HELP' = 'help',
  'SHOW' = 'show'
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
    public botName = 'voting assistant'
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

  async detectCommand(userInput: any[]) {
    let command = userInput[0].trim();
    let commandA = command.split(' ');
    command = commandA[commandA.length - 1].toLowerCase();
    return command;
  }

  async makeOptionCards(votingConfig: IVotingConfig) {
    let cards = [];
    for (let option in votingConfig.options) {
      let img = await getImage(votingConfig.options[option].name);
      cards.push(
        CardFactory.heroCard(
          votingConfig.options[option].name,
          [img],
          [
            {
              type: 'postBack',
              title: 'vote!',
              value: `vote!% ${votingConfig.options[option].id}`,
              text: 'I have voted',
              displayText: 'I have voted'
            }
          ]
        )
      );
    }
    let cardsMessage = MessageFactory.list(cards);
    return await cardsMessage;
  }

  async giveHelp(turnContext) {
    await turnContext.sendActivity(`
      Hi. I support the following commands
      to start voting — start!% voting_topic!% voting_option!% voting_option2 etc
      to finish voting, it will marm voting as not active, which means that no one can't vote anymore — finish
      to reopen voting — reopen
      to see result, even for not finished voting, but it won't mark voting as finished — result
      to ask me rate something — rate!% thing_you_want_to_rate
      to ask me to show something — show!% thing_you_want_to_show
    `);
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
      switch(command) {
        case VOTE_COMMANDS.HELP: {
          await this.giveHelp(turnContext);
          break;
        }
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
            await turnContext.sendActivity(`Votings about "${votingConfig.topic}" has finished`);
            await this.handleResult(votingConfig, turnContext);
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
        case VOTE_COMMANDS.RATE: {
          await this.handleRate(userInput, turnContext);
          break;
        }
        case VOTE_COMMANDS.SHOW: {
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

  async startVoting(userInputConfig: any[], currentVotingConfig: IVotingConfig, turnContext) {
    let topic = userInputConfig[1].trim();
    if (currentVotingConfig.isActive) {
      await turnContext.sendActivity(`There is an active votig. You have to finish it to start the new one!`);
    } else if (topic && userInputConfig[2] && userInputConfig[2].trim() && userInputConfig[3] && userInputConfig[3].trim()) {
      currentVotingConfig.isActive = true;
      currentVotingConfig.topic = topic;
      let votingOptions = userInputConfig.slice(2);
      votingOptions.forEach((element, index) => {
        if(element.trim()){
          currentVotingConfig.options[index] = {
            id: index,
            name: element.trim(),
            votesCount: 0
          }
        }
      });
      currentVotingConfig.votedUsersId = [];
      let optionsList = '';
      for (let option in currentVotingConfig.options) {
        optionsList += '\n\n ' + currentVotingConfig.options[option].id + ' is an id for ' + currentVotingConfig.options[option].name;
      }
      await turnContext.sendActivity(`The voting about "${topic}" has started! \n\n To vote for your option type "vote!% *option_number*". \n\n ${optionsList}`);
      await turnContext.sendActivity(await this.makeOptionCards(currentVotingConfig));

    } else {
      await turnContext.sendActivity(`Not enough data to start voting`);
    }
  }

  async handleResult(votingConfig: IVotingConfig, turnContext) {
    if (votingConfig.topic) {
      let resultString = '';
      let maxVotesCount = 0;
      let wonOptionsId = [];
      for (let option in votingConfig.options) {
        let optionVotesCount = votingConfig.options[option].votesCount
        resultString += '\n\n ' + votingConfig.options[option].name + ' has ' + optionVotesCount + ' vote(s)';
        if (maxVotesCount < optionVotesCount) {
          wonOptionsId = [option];
          maxVotesCount = optionVotesCount;
        } else if (maxVotesCount == optionVotesCount) {
          wonOptionsId.push(option);
        }
      };
      let wonAnounseString = '\n\n ';
      if (wonOptionsId.length > 1) {
        wonAnounseString += '\n\n Unfortunatly some of results have same amount of votes. You can reopen current voting or start a new one.';
      } else {
        let winStatus = votingConfig.isActive ? ' is winning ' : ' have won ';
        wonAnounseString += '\n\n "' + votingConfig.options[wonOptionsId[0]].name + '"' + winStatus + 'with ' + votingConfig.options[wonOptionsId[0]].votesCount + ' votes';
      }
      await turnContext.sendActivity(`The results of the voting about "${votingConfig.topic}" are: ${resultString} ${wonAnounseString}`);
    } else {
      await turnContext.sendActivity(`No votings to display`);
    }
  }

  async handleVote(userInput: any[], votingConfig: IVotingConfig, turnContext) {
    if (votingConfig.isActive) {
      let votedOptionId = userInput[1].trim();
      let votingUsersId = turnContext.activity.from.id;
      let isUserVoted =  votingConfig.votedUsersId.some(userId => userId == votingUsersId)
      if (votedOptionId && !isUserVoted) {
        votedOptionId = parseInt(votedOptionId);
        if (votingConfig.options[votedOptionId]) {
          votingConfig.options[votedOptionId].votesCount++;
          votingConfig.votedUsersId.push(votingUsersId);
        } else {
          await turnContext.sendActivity(`There is no such option`);
        }
        
      } else if (isUserVoted) {
        let userNameOrId = turnContext.activity.from.name || votingUsersId
        await turnContext.sendActivity(`${userNameOrId} is a cheater, he have tried to vote twice`);
      }
    } else {
      await turnContext.sendActivity(`There is no active voting`);
    }
  }
  
  async handleRate(userInput, turnContext) {
    let ratingSubject = userInput[1].trim();
    if (ratingSubject) {
      let rating = ratingSubject.toLowerCase().trim() === this.botName ? 10 : Math.floor(Math.random() * 11);
      let ratingAnswer = `I rate ${ratingSubject} by ${rating} from 10.`;
      if (rating === 10) {
        ratingAnswer += `\n\n ${ratingSubject} is very nice!`
      }
      if (rating === 0) {
        ratingAnswer += `\n\n ${ratingSubject} sucks! Awful!`
      }
      await turnContext.sendActivity(ratingAnswer);
    } else {
      await turnContext.sendActivity(`Nothing to rate`);
    }
  }

  async handleShow(userInput: any[], turnContext: any) {
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
        await turnContext.sendActivity(`Nothing to show`).catch(()=>{console.log('error')});
      }
    } else {
      await turnContext.sendActivity(`Nothing to show`);
    }
  }

  async sendWelcomeMessage(turnContext) {
    if (turnContext.activity && turnContext.activity.membersAdded) {
      await turnContext.sendActivity(`Hello! I'm voting assistant. I would be pleased to help you to organize votings. Type 'help' if you need any help`);
      await this.giveHelp(turnContext);
    }
  }
}
