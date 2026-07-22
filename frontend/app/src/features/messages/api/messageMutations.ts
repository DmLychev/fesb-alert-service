import api from "../../../api";
import type { DeleteRowsParams } from "../../../components/DataTable/types";

interface GraphQLErrorItem {
  message: string;
}

interface DeleteMessagesResponse {
  data: {
    deletedMessages: {
      deletedCount: number;
      deletedIds: string[];
    };
  } | null;

  errors?: GraphQLErrorItem[];
}

const DELETE_MESSAGES_MUTATION = `
    mutation DeleteMessages(
        $ids: [ID!]!
    ) {
       deleteMessages(ids: $ids) {
            deletedCount
            deletedIds
        }     
    }
`;

export const deleteMessages = async ({
  rowIds,
  signal,
}: DeleteRowsParams): Promise<void> => {
  const response = await api.post<DeleteMessagesResponse>(
    "/api/graphql/",
    { query: DELETE_MESSAGES_MUTATION, variables: { ids: rowIds } },
    { signal },
  );

  const graphQLErrors = response.data.errors;

  if (graphQLErrors?.length)
    throw new Error(graphQLErrors.map((error) => error.message).join("; "));

  const result = response.data.data?.deletedMessages;

  if (!result) {
    throw new Error("Delete mutation returned no data");
  }
};
