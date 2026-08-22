import api from "../../../api";
import type { SubscriptionOptions } from "../types";

const GET_SUBSCRIPTION_OPTIONS = `
    query NotificationSubscriptionOptions {
        notificationSubscriptionOptions {
            domains
            issueTypes {
                code
                description
                scope
            }
            routes {
                id
                name
                domainName
            }
        }
    }
`;

export const fetchSubscriptionOptions =
  async (): Promise<SubscriptionOptions> => {
    const response = await api.post("/api/graphql/", {
      query: GET_SUBSCRIPTION_OPTIONS,
    });

    const errors = response.data.errors;

    if (errors?.length)
      throw new Error(
        errors.map((error: { message: string }) => error.message).join("; "),
      );

    return response.data.data.notificationSubscriptionOptions;
  };
