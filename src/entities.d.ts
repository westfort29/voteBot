export interface IVotingConfig {
  topic: string;
  options: IVotingOptions;
  isActive: boolean;
  votedUsersId: string[];
}

export interface IVotingOptions {
  [index: string]: {
    name: string;
    id: number;
    usersVoted: string[];
  };
}
