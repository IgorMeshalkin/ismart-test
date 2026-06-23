---
name: create-api-hook
description: Add a section-based API hook for a selected endpoint using axios and generated apiUrls.
---

# Add API Hook

When this skill is used, add or update a frontend API hook for one selected endpoint.

## Dependency Validation

Before making changes:

1. Check whether `axios` is installed.
2. If `axios` is missing, install it:

```bash
npm i axios
```

3. Use `axios` for all API requests.

## Endpoint Selection

Before implementation:

1. Ask the user which endpoint should be implemented.
2. Search for the requested endpoint in:

```txt
/src/shared/api/api.ts
```

body and responce types of endpoints in:

```txt
/src/shared/types/api.ts
```

3. The file contains an `apiUrls` object.
4. The first level of `apiUrls` contains API sections, for example:

```ts
apiUrls.users
apiUrls.departments
apiUrls.auth
```

5. Endpoints are located inside these sections.

If the exact endpoint is not found:

1. Suggest similar endpoints from `/src/shared/api/api.ts`.
2. Ask the user to choose one.
3. If no suitable endpoint can be found, stop the task.

## Hook File Rules

Each API section must have its own hook file.

Example:

```txt
apiUrls.users
```

must use:

```txt
/src/hooks/use-users.api.hook.tsx
```

and export:

```ts
useUsersApi()
```

Example:

```txt
apiUrls.departments
```

must use:

```txt
/src/hooks/use-departments.api.hook.tsx
```

and export:

```ts
useDepartmentsApi()
```

Do not create hook files for all sections.

API url: 
- Main api URL is process.env.NEXT_PUBLIC_API_URL
- Use this url in the all api hooks
- Example: `${process.env.NEXT_PUBLIC_API_URL}${apiUrls.users.GET_USER}`
	

Create a hook file only when:

- the user requested an endpoint from that section;
- the hook file for that section does not exist yet.

If the hook file already exists:

- update the existing hook;
- add the new endpoint implementation;
- preserve all existing endpoint implementations.

## Hook Return Rules

API hooks must return functions for calling API methods from components.

Do not return already loaded data values.

For every implemented endpoint, return:

1. a function;
2. a loading state;
3. an error state.

Example:

```ts
return {
  createUser,
  isCreateUserLoading,
  createUserError,
};
```

## Function Naming Rules

Generate readable camelCase function names from endpoint keys.

Examples:

```txt
POST_USERS
```

becomes:

```ts
createUser
```

```txt
GET_USERS
```

becomes:

```ts
getUsers
```

```txt
GET_USER_BY_ID
```

becomes:

```ts
getUserById
```

```txt
DELETE_USER_BY_ID
```

becomes:

```ts
deleteUserById
```

Generated names must be deterministic.

## Implementation Rules

Use the selected endpoint from `apiUrls`.

Example:

```ts
apiUrls.users.POST_USERS
```

Use its:

- `url`;
- `method`;
- `body`;
- `response`.

The hook function must accept required URL parameters and request body parameters based on the endpoint definition.

Example:

```ts
const createUser = async (body: CreateUserDTO) => {
  const response = await axios.post<GetUserDTO>(
    apiUrls.users.POST_USERS.url(),
    body,
  );

  return response.data;
};
```

For endpoints with URL params:

```ts
const getUserById = async (userId: string) => {
  const response = await axios.get<GetUserDTO>(
    apiUrls.users.GET_USER_BY_ID.url(userId),
  );

  return response.data;
};
```

For endpoints with query params:

```ts
const getUsers = async (limit: number, offset: number) => {
  const response = await axios.get<GetUserDTO[]>(
    apiUrls.users.GET_USERS.url(limit, offset),
  );

  return response.data;
};
```

## State Rules

Each API function must manage its own loading and error state.

Example:

```ts
const [isCreateUserLoading, setIsCreateUserLoading] = useState(false);
const [createUserError, setCreateUserError] = useState<unknown>(null);
```

Before request:

```ts
setIsCreateUserLoading(true);
setCreateUserError(null);
```

On error:

```ts
setCreateUserError(error);
throw error;
```

Finally:

```ts
setIsCreateUserLoading(false);
```

## Multi Endpoint Workflow

After implementing an endpoint:

1. Ask the user whether another endpoint should be implemented.
2. If the answer is yes:
   - ask which endpoint should be implemented next;
   - repeat the entire Endpoint Selection workflow;
   - continue updating existing hook files or creating new hook files when necessary.
3. If the answer is no:
   - stop the task;
   - do not make additional changes.

The workflow must continue until the user explicitly indicates that no more endpoints are required.

## Rules

- Use npm.
- Use axios.
- Do not use React Query unless explicitly requested.
- Do not create hooks for all API sections at once.
- Create or update only the hook related to the requested endpoint.
- Do not modify `/src/shared/api/api.ts`.
- Do not modify `/src/shared/types/api.d.ts`.
- Do not manually invent endpoints.
- Always use endpoints from `apiUrls`.
- API hooks must return callable functions, loading states, and error states.
- API hooks must not return preloaded response data.
- Preserve existing hook implementations when adding new endpoints.
