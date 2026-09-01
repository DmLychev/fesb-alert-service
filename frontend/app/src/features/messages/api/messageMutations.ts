import api from "../../../api";
import type {
  DeleteRowsParams,
  UpdateRowParams,
} from "../../../components/DataTable";
import {
  unwrapGraphQLData,
  type GraphQLErrorItem,
  type GraphQLResponse,
} from "../../../utils/graphql";
import type { Message } from "../types";

interface DeleteMessagesResponse {
  data: {
    deleteMessages: {
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

const UPDATE_MESSAGE_MUTATION = `
    mutation UpdateMessage(
      $data: UpdateMessageInput!
    ) {
      updateMessage(data: $data) {
        id
        exchangeId
        requestId
        errorMessage
        updateStatusAttempts
        status
        startDate
        endDate
        warningLevel

        route {
          id
          name
          domainName
        }
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

  const result = response.data.data?.deleteMessages;

  if (!result) {
    throw new Error("Delete mutation returned no data");
  }
};

export const updateMessage = async ({
  rowId,
  changes,
  signal,
}: UpdateRowParams): Promise<Message> => {
  const response = await api.post<GraphQLResponse<{ updateMessage: Message }>>(
    "/api/graphql/",
    {
      query: UPDATE_MESSAGE_MUTATION,

      variables: {
        data: {
          id: rowId,
          ...changes,
        },
      },
    },
    { signal },
  );

  const data = unwrapGraphQLData(
    response.data,
    "Update mutation returned no data",
  );

  return data.updateMessage;
};
