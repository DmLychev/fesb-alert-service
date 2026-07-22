import api from "../../../api";
import type { DeleteRowsParams } from "../../../components/DataTable/types";

interface GraphQLErrorItem {
  message: string;
}

interface DeleteMessagesResponse {
  data?: {
    deletedMessages: {
      deletedCount: number;
      deletedIds: string[];
    };
  };

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

  if (response.data.errors?.length) {
    throw new Error("Delete mutation returned no data");
  }
};
