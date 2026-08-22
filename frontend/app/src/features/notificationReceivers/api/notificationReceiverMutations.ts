import api from "../../../api";
import type { CreateSubscriptionInput } from "../types";

const CREATE_SUBSCRIPTION_MUTATION = `
    mutation CreateNotificationSubscription($data: CreateNotificationSubscriptionInput!) {
        createNotificationSubscription(data: $data) {
            createdCount
            skippedDuplicates
        }
    }
`;

interface CreateSubscriptionResult {
  createdCount: number;
  skippedDuplicates: number;
}

export const createNotificationSubscription = async (
  data: CreateSubscriptionInput,
): Promise<CreateSubscriptionResult> => {
  const response = await api.post("/api/graphql/", {
    query: CREATE_SUBSCRIPTION_MUTATION,
    variables: { data },
  });

  const errors = response.data.errors;

  if (errors?.length)
    throw new Error(
      errors.map((error: { message: string }) => error.message).join("; "),
    );

  const result = response.data.data?.createNotificationSubscription;

  if (!result) throw new Error("Create subscription mutation returned no data");

  return result;
};
