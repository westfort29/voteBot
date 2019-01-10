import { Activity, CardFactory, MessageFactory, TurnContext } from "botbuilder";
import { IVotingConfig } from "../entities";
import { getImage } from "../http";

class VotingModule {
  public async makeOptionCards(votingConfig: IVotingConfig): Promise<Partial<Activity>> {
    const cards = [];
    for (const option of Object.keys(votingConfig.options)) {
      const img = await getImage(votingConfig.options[option].name);
      cards.push(
        CardFactory.heroCard(
          votingConfig.options[option].name,
          [img],
          [
            {
              displayText: "I have voted",
              text: "I have voted",
              title: "vote!",
              type: "postBack",
              value: `select ${votingConfig.options[option].id}`,
            }
          ]
        )
      );
    }
    return await MessageFactory.list(cards);
  }

  public async startVoting(
    userInputConfig: any[], currentVotingConfig: IVotingConfig, turnContext: TurnContext
  ): Promise<void> {
    const topic = userInputConfig[1].trim();
    if (currentVotingConfig.isActive) {
      await turnContext.sendActivity(`There is an active votig. You have to finish it to start the new one!`);
    } else if (topic && userInputConfig[2] &&
        userInputConfig[2].trim() &&
        userInputConfig[3] &&
        userInputConfig[3].trim()
    ) {
      currentVotingConfig.isActive = true;
      currentVotingConfig.topic = topic;
      const votingOptions = userInputConfig.slice(2);
      votingOptions.forEach((element, index) => {
        if (element.trim()) {
          currentVotingConfig.options[index] = {
            id: index,
            name: element.trim(),
            usersVoted: []
          };
        }
      });
      currentVotingConfig.votedUsersId = [];
      let optionsList = "";
      for (const option of Object.keys(currentVotingConfig.options)) {
        optionsList += "\n\n " + currentVotingConfig.options[option].id +
        " is an id for " +
        currentVotingConfig.options[option].name;
      }
      await turnContext.sendActivity(
        `The voting about "${topic}" has started! \n\n To vote for your option type "select *option_number*".
        ${optionsList}`
      );
      await turnContext.sendActivity(await this.makeOptionCards(currentVotingConfig));

    } else {
      await turnContext.sendActivity(`Not enough data to start voting`);
    }
  }

  public async handleFinishVoting(votingConfig: IVotingConfig, turnContext: TurnContext): Promise<void> {
    if (votingConfig.isActive) {
      votingConfig.isActive = false;
      await turnContext.sendActivity(`Votings about "${votingConfig.topic}" has finished`);
      await this.handleResult(votingConfig, turnContext);
    } else {
      await turnContext.sendActivity(`No votings to finish`);
    }
  }

  public async handleResult(votingConfig: IVotingConfig, turnContext: TurnContext): Promise<void> {
    if (votingConfig.topic) {
      let resultString = "";
      let maxVotesCount = 0;
      let wonOptionsId = [];
      for (const option of Object.keys(votingConfig.options)) {
        const optionVotesCount = votingConfig.options[option].usersVoted.length;
        resultString += "\n\n " + votingConfig.options[option].name + " has " + optionVotesCount + " vote(s)";
        if (maxVotesCount < optionVotesCount) {
          wonOptionsId = [option];
          maxVotesCount = optionVotesCount;
        } else if (maxVotesCount === optionVotesCount) {
          wonOptionsId.push(option);
        }
      }
      let wonAnounseString = "\n\n ";
      if (wonOptionsId.length > 1) {
        wonAnounseString += `
        Unfortunatly some of results have same amount of votes. You can reopen current voting or start a new one.`;
      } else {
        const winStatus = votingConfig.isActive ? " is winning " : " has won ";
        wonAnounseString += `
        "${votingConfig.options[wonOptionsId[0]].name}" ${winStatus}` +
        ` with ${votingConfig.options[wonOptionsId[0]].usersVoted.length} votes`;
      }
      await turnContext.sendActivity(
        `The results of the voting about "${votingConfig.topic}"` +
        ` are: ${resultString} ${wonAnounseString}`
      );
    } else {
      await turnContext.sendActivity(`No votings to display`);
    }
  }

  public async handleVote(userInput: any[], votingConfig: IVotingConfig, turnContext: TurnContext): Promise<void> {
    if (votingConfig.isActive) {
      let votedOptionId = userInput[1].trim();
      const votingUsersId = turnContext.activity.from.id;
      const previousVoteOption = Object.keys(votingConfig.options).find(
        (key) => votingConfig.options[key].usersVoted.some(
          (votedUserId) => votedUserId === votingUsersId
        )
      );
      if (votedOptionId && !previousVoteOption) {
        votedOptionId = parseInt(votedOptionId, 10);
        if (votingConfig.options[votedOptionId]) {
          votingConfig.options[votedOptionId].usersVoted.push(votingUsersId);
        } else {
          await turnContext.sendActivity(`There is no such option`);
        }

      } else if (previousVoteOption && votedOptionId) {
          votedOptionId = parseInt(votedOptionId, 10);
          if (votingConfig.options[votedOptionId]) {
            votingConfig.options[votedOptionId].usersVoted.push(votingUsersId);
            votingConfig.options[previousVoteOption].usersVoted.splice(
              votingConfig.options[previousVoteOption].usersVoted.findIndex(
                (el) => el === votingUsersId
              ), 1
            );
          } else {
            await turnContext.sendActivity(`There is no such option`);
          }
          const userNameOrId = turnContext.activity.from.name || votingUsersId;

          await turnContext.sendActivity(`${userNameOrId} changed his(her) mind`);
        } else {
        await turnContext.sendActivity(`There is no such option`);
      }
    } else {
      await turnContext.sendActivity(`There is no active voting`);
    }
  }

  public async handleReopen(votingConfig: IVotingConfig, turnContext: TurnContext): Promise<void> {
    if (!votingConfig.isActive && votingConfig.topic) {
      votingConfig.isActive = true;
      await turnContext.sendActivity(`Voting about ${votingConfig.topic} is continuing`);
    } else {
      await turnContext.sendActivity(`There is no voting to reopen`);
    }
  }
}

export const votingHandlers = new VotingModule();
