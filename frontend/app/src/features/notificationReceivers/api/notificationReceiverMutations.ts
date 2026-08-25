import api from "../../../api";
import type { DeleteRowsParams } from "../../../components/DataTable";
import type { CreateSubscriptionInput } from "../types";

const CREATE_SUBSCRIPTION_MUTATION = `
    mutation CreateNotificationSubscription($data: CreateNotificationSubscriptionInput!) {
        createNotificationSubscription(data: $data) {
            createdCount
            skippedDuplicates
        }
    }
`;

const DELETE_NOTIFICATION_RECEIVERS_MUTATION = `
  mutation DeleteNotificationReceivers($ids: [ID!]!) {
    deleteNotificationReceivers(ids: $ids) {
      deletedCount
      deletedIds
    }
  }
`;

interface CreateSubscriptionResult {
  createdCount: number;
  skippedDuplicates: number;
}

interface DeleteNotificationReceiversResponse {
  data: {
    deleteNotificationReceivers: {
      deletedCount: number;
      deletedIds: string[];
    };
  } | null;

  errors?: {
    message: string;
  }[];
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

export const deleteNotificationReceivers = async ({
  rowIds,
  signal,
}: DeleteRowsParams): Promise<void> => {
  const response = await api.post<DeleteNotificationReceiversResponse>(
    "/api/graphql/",
    {
      query: DELETE_NOTIFICATION_RECEIVERS_MUTATION,
      variables: { ids: rowIds },
    },
    { signal },
  );

  const errors = response.data.errors;

  if (errors?.length)
    throw new Error(errors.map((error) => error.message).join("; "));

  const result = response.data.data?.deleteNotificationReceivers;

  if (!result) throw new Error("Delete mutation returned no data");
};
