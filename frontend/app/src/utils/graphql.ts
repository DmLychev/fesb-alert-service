export interface GraphQLErrorItem {
  message: string;
}

export interface GraphQLResponse<TData> {
  data?: TData | null;
  errors?: GraphQLErrorItem[];
}

export const unwrapGraphQLData = <TData>(
  response: GraphQLResponse<TData>,
  fallbackError: string,
): TData => {
  if (response.errors?.length)
    throw new Error(response.errors.map((error) => error.message).join("; "));
  if (!response.data) throw new Error(fallbackError);

  return response.data;
};
