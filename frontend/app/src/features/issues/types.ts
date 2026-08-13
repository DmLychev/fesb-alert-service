export type DateTimeString = string;

export interface IssueType {
  id: string;
  code: number;
  description: string;
}

export interface Issue {
  id: string;
  type: IssueType;
  text: string | null;
  routeId: string | null;
  domainName: string | null;
  isNotified: boolean;
  isSolved: boolean;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
}
