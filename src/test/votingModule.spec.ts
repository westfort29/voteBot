import axios from "axios";
jest.mock("axios");
import { IVotingConfig } from "../entities";
import { votingHandlers } from "../modules/votingModule";
let sendActivity;
let turnContext: any;
let votingConfig: IVotingConfig;
let userInput: any[];
const userId = "123";

beforeEach(() => {
  turnContext = {
    activity: {
      from: {
        id: userId
      }
    },
    sendActivity: () => Promise.resolve()
  };
  votingConfig = {
    isActive: true,
    options: {},
    topic: "topic"
  };
  userInput = [];
  sendActivity = jest.spyOn(turnContext, "sendActivity");
});
afterEach(() => {
  sendActivity.mockRestore();
});

describe("VotingModule", () => {
  it("should be created", () => {
    expect(votingHandlers).toBeTruthy();
  });

  describe("handleReopen method when trying to reopen voting", () => {
    it("should report that voting is continuing when where is an inactive voting", () => {
      votingConfig.isActive = false;
      votingHandlers.handleReopen(votingConfig, turnContext);
      expect(sendActivity).toHaveBeenCalledWith(`Voting about ${votingConfig.topic} is continuing`);
    });

    it("should report an error when trying to reopen voting when there is an active one", () => {
      votingHandlers.handleReopen(votingConfig, turnContext);
      expect(sendActivity).toHaveBeenCalledWith("There is no voting to reopen");
    });
  });

  describe("handleVote method when you trying to vote", () => {
    beforeEach(() => {
      userInput = ["vote", "1"];
      votingConfig = {
        isActive: true,
        options: {
          1: {
            id: 1,
            name: "first",
            usersVoted: []
          },
          2: {
            id: 2,
            name: "second",
            usersVoted: []
          }
        },
        topic: "topic",
      };
    });

    describe("when there are no active voting", () => {
      it("should report that there is no active voting", () => {
        votingConfig.isActive = false;
        votingHandlers.handleVote(userInput, votingConfig, turnContext);
        expect(sendActivity).toHaveBeenCalledWith("There is no active voting");
      });
    });

    describe("when user tries to vote for non existent option", () => {
      it("should report an error", () => {
        userInput[1] = "non-existent-option-id";
        votingHandlers.handleVote(userInput, votingConfig, turnContext);
        expect(sendActivity).toHaveBeenCalledWith("There is no such option");
      });
    });

    describe("when voting is valid", () => {
      it("should save users vote by saving gis id in option data", () => {
        votingHandlers.handleVote(userInput, votingConfig, turnContext);
        expect(votingConfig.options["1"].usersVoted[0]).toEqual(userId);
      });
    });

    describe("when user changed his mind to another voting option", () => {
      it("should clear information about his previous vote", () => {
        votingHandlers.handleVote(userInput, votingConfig, turnContext);
        userInput[1] = "2";
        votingHandlers.handleVote(userInput, votingConfig, turnContext);
        expect(votingConfig.options["1"].usersVoted[0]).toBeFalsy();
      });

      it("should save information about new vote", () => {
        votingHandlers.handleVote(userInput, votingConfig, turnContext);
        userInput[1] = "2";
        votingHandlers.handleVote(userInput, votingConfig, turnContext);
        expect(votingConfig.options["2"].usersVoted[0]).toEqual(userId);
      });

      it("should report that this user changed his mind", () => {
        votingHandlers.handleVote(userInput, votingConfig, turnContext);
        userInput[1] = "2";
        votingHandlers.handleVote(userInput, votingConfig, turnContext);
        expect(sendActivity).toHaveBeenCalledWith(`${userId} changed his(her) mind`);
      });
    });
  });

  describe("handleResult method when trying to see result of voting", () => {
    beforeEach(() => {
      userInput = ["vote", "1"];
      votingConfig = {
        isActive: true,
        options: {
          1: {
            id: 1,
            name: "first",
            usersVoted: []
          },
          2: {
            id: 2,
            name: "second",
            usersVoted: []
          }
        },
        topic: "topic"
      };
    });

    describe("when there are no votings", () => {
      it("should report an error", () => {
        votingConfig = {
          isActive: false,
          options: { },
          topic: ""
        };
        votingHandlers.handleResult(votingConfig, turnContext);
        expect(sendActivity).toHaveBeenCalledWith(`No votings to display`);
      });
    });

    describe("when there is voting", () => {
      it("when there are no winning option should advice to reopen voting", () => {
        votingHandlers.handleResult(votingConfig, turnContext);
        expect(sendActivity.mock.calls[0][0]).toEqual(
          expect.stringContaining(`You can reopen current voting or start a new one.`)
        );
      });
    });
  });

  describe("handleFinishVoting method when trying to finish voting", () => {
    it("when there is no active voting an error should be reported", () => {
      votingConfig.isActive = false;
      votingHandlers.handleFinishVoting(votingConfig, turnContext);
      expect(sendActivity).toHaveBeenCalledWith(`No votings to finish`);
    });
    it("when there is active voting should be reported to user that voting was closed", () => {
      votingHandlers.handleFinishVoting(votingConfig, turnContext);
      expect(sendActivity).toHaveBeenCalledWith(`Votings about "${votingConfig.topic}" has finished`);
    });
  });
});
