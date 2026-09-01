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
import type { Issue } from "../types";

interface DeleteIssuesResponse {
  data: {
    deleteIssues: {
      deletedCount: number;
      deletedIds: string[];
    };
  } | null;

  errors?: GraphQLErrorItem[];
}

const DELETE_ISSUES_MUTATION = `
    mutation DeleteIssues(
        $ids: [ID!]!
    ) {
       deleteIssues(ids: $ids) {
            deletedCount
            deletedIds
        }     
    }
`;

const UPDATE_ISSUE_MUTATION = `
    mutation UpdateIssue(
      $data: UpdateIssueInput!
    ) {
      updateIssue(data: $data) {
        id
        text
        routeId
        domainName
        isNotified
        isSolved
        createdAt
        updatedAt
        type {
          code
          description
        }
      }  
    }
`;

export const deleteIssues = async ({
  rowIds,
  signal,
}: DeleteRowsParams): Promise<void> => {
  const response = await api.post<DeleteIssuesResponse>(
    "/api/graphql/",
    { query: DELETE_ISSUES_MUTATION, variables: { ids: rowIds } },
    { signal },
  );

  const graphQLErrors = response.data.errors;

  if (graphQLErrors?.length)
    throw new Error(graphQLErrors.map((error) => error.message).join("; "));

  const result = response.data.data?.deleteIssues;

  if (!result) {
    throw new Error("Delete mutation returned no data");
  }
};

export const updateIssue = async ({
  rowId,
  changes,
  signal,
}: UpdateRowParams): Promise<Issue> => {
  const response = await api.post<GraphQLResponse<{ updateIssue: Issue }>>(
    "/api/graphql/",
    {
      query: UPDATE_ISSUE_MUTATION,

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

  return data.updateIssue;
};
