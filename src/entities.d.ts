export interface IVotingConfig {
  topic: string;
  options: IVotingOptions;
  isActive: boolean;
}

export interface IVotingOptions {
  [index: string]: {
    name: string;
    id: number;
    usersVoted: string[];
  };
}
