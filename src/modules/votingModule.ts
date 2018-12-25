import { TurnContext, MessageFactory, CardFactory } from 'botbuilder';
import { getImage } from '../http';
import { IVotingConfig } from '../entities';

class VotingModule {
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
              value: `select ${votingConfig.options[option].id}`,
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

  async startVoting(userInputConfig: any[], currentVotingConfig: IVotingConfig, turnContext: TurnContext) {
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
      await turnContext.sendActivity(`The voting about "${topic}" has started! \n\n To vote for your option type "select *option_number*". \n\n ${optionsList}`);
      await turnContext.sendActivity(await this.makeOptionCards(currentVotingConfig));

    } else {
      await turnContext.sendActivity(`Not enough data to start voting`);
    }
  }

  async handleFinishVoting(votingConfig: IVotingConfig, turnContext: TurnContext) {
    if (votingConfig.isActive) {
      votingConfig.isActive = false;
      await turnContext.sendActivity(`Votings about "${votingConfig.topic}" has finished`);
      await this.handleResult(votingConfig, turnContext);
    } else {
      await turnContext.sendActivity(`No votings to finish`);
    }
  }

  async handleResult(votingConfig: IVotingConfig, turnContext: TurnContext) {
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
        let winStatus = votingConfig.isActive ? ' is winning ' : ' has won ';
        wonAnounseString += '\n\n "' + votingConfig.options[wonOptionsId[0]].name + '"' + winStatus + 'with ' + votingConfig.options[wonOptionsId[0]].votesCount + ' votes';
      }
      await turnContext.sendActivity(`The results of the voting about "${votingConfig.topic}" are: ${resultString} ${wonAnounseString}`);
    } else {
      await turnContext.sendActivity(`No votings to display`);
    }
  }

  async handleVote(userInput: any[], votingConfig: IVotingConfig, turnContext: TurnContext) {
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
        let userNameOrId = turnContext.activity.from.name || votingUsersId;
        await turnContext.sendActivity(`${userNameOrId} is a cheater, he(she) has tried to vote twice`);
      }
    } else {
      await turnContext.sendActivity(`There is no active voting`);
    }
  }

  async handleReopen(votingConfig: IVotingConfig, turnContext: TurnContext) {
    if (!votingConfig.isActive && votingConfig.topic) {
      votingConfig.isActive = true;
      await turnContext.sendActivity(`Voting about ${votingConfig.topic} is continuing`);
    } else {
      await turnContext.sendActivity(`There is no voting to reopen`);
    }
  }
}

export const votingHandlers = new VotingModule();
