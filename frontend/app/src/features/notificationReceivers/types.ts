export type IssueScope = "GLOBAL" | "DOMAIN" | "ROUTE"
export type NotificationScope = "GLOBAL" | "DOMAIN" | "ROUTE"

export interface IssueType {
    code: number;
    description: string;
    scope: IssueScope
}

export interface Route {
    id: string;
    name: string;
    domainName: string;
}

export interface NotificationReceiver {
    id: string;
    email: string;
    domainName: string | null;
    createdAt: string;
    issueType: IssueType | null;
    route: Route | null;
}

export interface SubscriptionOptions {
    issueTypes: IssueType[];
    domains: string[];
    routes: Route[];
}

export interface CreateSubscriptionInput {
    email: string;
    scope: NotificationScope;
    issueTypeCodes: number[];
    domainNames: string[];
    routeIds: string[];
    allIssueTypes: boolean;
}