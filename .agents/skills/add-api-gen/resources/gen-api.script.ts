import 'dotenv/config';

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import openapiTS, { astToString } from 'openapi-typescript';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'] as const;
const JSON_MEDIA_TYPE = 'application/json';

type HttpMethod = (typeof HTTP_METHODS)[number];
type JsonObject = Record<string, unknown>;

interface OpenApiDocument extends JsonObject {
  openapi?: unknown;
  swagger?: unknown;
  paths: Record<string, PathItem>;
  components?: {
    parameters?: Record<string, Parameter>;
    requestBodies?: Record<string, JsonObject>;
    responses?: Record<string, JsonObject>;
    schemas?: Record<string, JsonObject>;
  };
}

type Reference = { $ref: string };

interface Parameter extends JsonObject {
  name?: unknown;
  in?: unknown;
  required?: unknown;
  schema?: Schema;
}

interface Operation extends JsonObject {
  tags?: unknown;
  parameters?: unknown;
  requestBody?: unknown;
  responses?: unknown;
}

interface PathItem extends JsonObject {
  parameters?: unknown;
}

type Schema = JsonObject | Reference;

interface UrlParameter {
  sourceName: string;
  argumentName: string;
  location: 'path' | 'query';
  required: boolean;
  type: string;
}

interface Endpoint {
  group: string;
  key: string;
  method: string;
  path: string;
  parameters: UrlParameter[];
  body?: string;
  response: string;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isReference(value: unknown): value is Reference {
  return isObject(value) && typeof value.$ref === 'string';
}

function refName(ref: string): string {
  const segment = ref.split('/').at(-1);
  if (!segment) throw new Error(`Invalid OpenAPI reference: ${ref}`);
  return decodeURIComponent(segment.replaceAll('~1', '/').replaceAll('~0', '~'));
}

function resolveLocalRef<T extends JsonObject>(document: OpenApiDocument, value: unknown): T | undefined {
  if (!isReference(value)) return isObject(value) ? (value as T) : undefined;
  if (!value.$ref.startsWith('#/')) throw new Error(`Only local OpenAPI references are supported: ${value.$ref}`);

  let current: unknown = document;
  for (const rawPart of value.$ref.slice(2).split('/')) {
    const part = rawPart.replaceAll('~1', '/').replaceAll('~0', '~');
    if (!isObject(current) || !(part in current)) throw new Error(`Unresolved OpenAPI reference: ${value.$ref}`);
    current = current[part];
  }

  return isObject(current) ? (current as T) : undefined;
}

function toCamelCase(value: string): string {
  const words = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .match(/[A-Za-z0-9]+/g) ?? [];
  if (words.length === 0) return 'default';
  const result = words
    .map((word, index) => {
      const normalized = word.toLowerCase();
      return index === 0 ? normalized : normalized[0].toUpperCase() + normalized.slice(1);
    })
    .join('');
  return /^\d/.test(result) ? `group${result}` : result;
}

function toIdentifier(value: string, fallback = 'value'): string {
  const result = toCamelCase(value);
  const safe = result.replace(/[^A-Za-z0-9_$]/g, '');
  return safe && !/^\d/.test(safe) ? safe : fallback;
}

function toConstantCase(value: string): string {
  return (value.match(/[A-Za-z0-9]+/g) ?? []).map((part) => part.toUpperCase()).join('_');
}

function singularize(value: string): string {
  if (/ies$/i.test(value)) return value.slice(0, -3) + 'y';
  if (/(sses|shes|ches|xes|zes)$/i.test(value)) return value.slice(0, -2);
  if (/s$/i.test(value) && !/ss$/i.test(value)) return value.slice(0, -1);
  return value;
}

function endpointKey(method: HttpMethod, path: string): string {
  const segments = path.split('/').filter(Boolean);
  const isParameter = (segment: string) => /^\{.+\}$/.test(segment);
  const staticSegments = segments.filter((segment) => !isParameter(segment));
  if (staticSegments.length === 0) return `${method.toUpperCase()}_ROOT`;

  const last = segments.at(-1)!;
  if (isParameter(last)) {
    const resource = singularize([...segments].reverse().find((segment) => !isParameter(segment))!);
    const parameter = last.slice(1, -1);
    const suffix = /id$/i.test(parameter) ? 'ID' : toConstantCase(parameter);
    return `${method.toUpperCase()}_${toConstantCase(resource)}_BY_${suffix}`;
  }

  const parameterIndex = segments.findIndex(isParameter);
  if (parameterIndex > 0) {
    const actions = new Set(['activate', 'archive', 'confirm', 'create', 'disable', 'enable', 'export', 'import', 'login', 'logout', 'refresh', 'register', 'reset', 'restore', 'search', 'send', 'verify']);
    if (actions.has(last.toLowerCase())) {
      return `${method.toUpperCase()}_${toConstantCase(singularize(segments[0]))}_${toConstantCase(last)}`;
    }
    const child = singularize(last);
    const parent = singularize(segments[parameterIndex - 1]);
    return `${method.toUpperCase()}_${toConstantCase(child)}_TO_${toConstantCase(parent)}`;
  }

  return `${method.toUpperCase()}_${staticSegments.map(toConstantCase).join('_')}`;
}

function schemaType(schema: unknown): string {
  if (isReference(schema)) return refName(schema.$ref);
  if (!isObject(schema)) return 'unknown';

  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return schema.enum.map((item) => JSON.stringify(item)).join(' | ');
  }
  if (schema.type === 'array') return `${wrapArrayType(schemaType(schema.items))}[]`;
  if (Array.isArray(schema.type)) {
    return schema.type.map((type) => (type === 'null' ? 'null' : schemaType({ ...schema, type }))).join(' | ');
  }
  if (schema.type === 'integer' || schema.type === 'number') return 'number';
  if (schema.type === 'boolean') return 'boolean';
  if (schema.type === 'string') return 'string';
  if (schema.type === 'object' || schema.properties) return 'object';
  if (Array.isArray(schema.oneOf)) return schema.oneOf.map(schemaType).join(' | ');
  if (Array.isArray(schema.anyOf)) return schema.anyOf.map(schemaType).join(' | ');
  if (Array.isArray(schema.allOf)) return schema.allOf.map(schemaType).join(' & ');
  return 'unknown';
}

function wrapArrayType(type: string): string {
  return type.includes(' | ') || type.includes(' & ') ? `(${type})` : type;
}

function mediaSchema(content: unknown): unknown {
  if (!isObject(content)) return undefined;
  const preferred = content[JSON_MEDIA_TYPE];
  const media = isObject(preferred) ? preferred : Object.values(content).find(isObject);
  return media?.schema;
}

function requestBodyType(document: OpenApiDocument, requestBody: unknown): string | undefined {
  if (requestBody === undefined) return undefined;
  const resolved = resolveLocalRef<JsonObject>(document, requestBody);
  if (!resolved) throw new Error('Invalid requestBody object');
  return schemaType(mediaSchema(resolved.content));
}

function responseType(document: OpenApiDocument, responsesValue: unknown): string {
  if (!isObject(responsesValue)) throw new Error('Operation is missing a valid responses object');
  const keys = Object.keys(responsesValue).sort();
  const key = keys.find((candidate) => /^2\d\d$/.test(candidate)) ?? keys.find((candidate) => /^2XX$/i.test(candidate)) ?? keys.find((candidate) => candidate === 'default');
  if (!key) throw new Error('Operation has no successful or default response');
  const response = resolveLocalRef<JsonObject>(document, responsesValue[key]);
  if (!response) throw new Error(`Invalid response object for status ${key}`);
  const schema = mediaSchema(response.content);
  return schema === undefined ? 'void' : schemaType(schema);
}

function collectParameters(document: OpenApiDocument, pathItem: PathItem, operation: Operation): UrlParameter[] {
  const rawParameters = [
    ...(Array.isArray(pathItem.parameters) ? pathItem.parameters : []),
    ...(Array.isArray(operation.parameters) ? operation.parameters : []),
  ];
  const byIdentity = new Map<string, Parameter>();

  for (const rawParameter of rawParameters) {
    const parameter = resolveLocalRef<Parameter>(document, rawParameter);
    if (!parameter || typeof parameter.name !== 'string' || (parameter.in !== 'path' && parameter.in !== 'query')) continue;
    byIdentity.set(`${parameter.in}:${parameter.name}`, parameter);
  }

  const usedArguments = new Map<string, number>();
  return [...byIdentity.values()].map((parameter) => {
    const sourceName = parameter.name as string;
    const baseName = toIdentifier(sourceName, 'parameter');
    const count = (usedArguments.get(baseName) ?? 0) + 1;
    usedArguments.set(baseName, count);
    return {
      sourceName,
      argumentName: count === 1 ? baseName : `${baseName}${count}`,
      location: parameter.in as 'path' | 'query',
      required: parameter.in === 'path' || parameter.required === true,
      type: schemaType(parameter.schema),
    };
  });
}

function collectEndpoints(document: OpenApiDocument): Endpoint[] {
  const endpoints: Endpoint[] = [];
  for (const path of Object.keys(document.paths).sort()) {
    const pathItem = document.paths[path];
    if (!isObject(pathItem)) continue;
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!isObject(operation)) continue;
      const tags = Array.isArray(operation.tags) && operation.tags.every((tag) => typeof tag === 'string') && operation.tags.length > 0
        ? operation.tags
        : ['default'];
      const shared = {
        key: endpointKey(method, path),
        method: method.toUpperCase(),
        path,
        parameters: collectParameters(document, pathItem, operation as Operation),
        body: requestBodyType(document, operation.requestBody),
        response: responseType(document, operation.responses),
      };
      for (const tag of tags) endpoints.push({ ...shared, group: toCamelCase(tag) });
    }
  }
  return endpoints.sort((left, right) => left.group.localeCompare(right.group) || left.key.localeCompare(right.key) || left.path.localeCompare(right.path) || left.method.localeCompare(right.method));
}

function renderUrl(endpoint: Endpoint): string[] {
  const parameters = [...endpoint.parameters].sort((left, right) => Number(right.required) - Number(left.required));
  const signature = parameters.map((parameter) => `${parameter.argumentName}${parameter.required ? '' : '?'}: ${parameter.type}`).join(', ');
  let path = endpoint.path.replace(/`/g, '\\`');
  for (const parameter of endpoint.parameters.filter((item) => item.location === 'path')) {
    path = path.replaceAll(`{${parameter.sourceName}}`, `\${encodeURIComponent(String(${parameter.argumentName}))}`);
  }
  const queryParameters = endpoint.parameters.filter((parameter) => parameter.location === 'query');
  if (queryParameters.length === 0) return [`url: (${signature}) => \`${path}\`,`];

  const lines = [`url: (${signature}) => {`, '  const query = new URLSearchParams();'];
  for (const parameter of queryParameters) {
    if (parameter.required) lines.push(`  query.set(${JSON.stringify(parameter.sourceName)}, String(${parameter.argumentName}));`);
    else lines.push(`  if (${parameter.argumentName} !== undefined) query.set(${JSON.stringify(parameter.sourceName)}, String(${parameter.argumentName}));`);
  }
  lines.push('  const search = query.toString();', `  return \`${path}\${search ? \`?\${search}\` : ''}\`;`, '},');
  return lines;
}

function renderApi(endpoints: Endpoint[]): string {
  const groups = new Map<string, Endpoint[]>();
  for (const endpoint of endpoints) groups.set(endpoint.group, [...(groups.get(endpoint.group) ?? []), endpoint]);
  const lines = ['// This file is generated by scripts/gen-api.script.ts. Do not edit.', '', 'export const apiUrls = {'];

  for (const [group, groupEndpoints] of groups) {
    lines.push(`  ${JSON.stringify(group)}: {`);
    const keyCounts = new Map<string, number>();
    for (const endpoint of groupEndpoints) {
      const count = (keyCounts.get(endpoint.key) ?? 0) + 1;
      keyCounts.set(endpoint.key, count);
      const key = count === 1 ? endpoint.key : `${endpoint.key}_${count}`;
      lines.push(`    ${key}: {`);
      for (const urlLine of renderUrl(endpoint)) lines.push(`      ${urlLine}`);
      lines.push(`      method: ${JSON.stringify(endpoint.method)},`);
      if (endpoint.body !== undefined) lines.push(`      body: ${JSON.stringify(endpoint.body)},`);
      lines.push(`      response: ${JSON.stringify(endpoint.response)},`, '    },');
    }
    lines.push('  },');
  }
  lines.push('} as const;', '');
  return lines.join('\n');
}

async function fetchSchema(url: string): Promise<OpenApiDocument> {
  let response: Response;
  try {
    response = await fetch(url, { headers: { accept: JSON_MEDIA_TYPE } });
  } catch (error) {
    throw new Error(`Could not reach OpenAPI schema at ${url}`, { cause: error });
  }
  if (!response.ok) throw new Error(`Could not download OpenAPI schema: ${response.status} ${response.statusText}`);

  let value: unknown;
  try {
    value = await response.json();
  } catch (error) {
    throw new Error('OpenAPI endpoint did not return valid JSON', { cause: error });
  }
  if (!isObject(value) || (!value.openapi && !value.swagger) || !isObject(value.paths)) {
    throw new Error('OpenAPI schema is invalid: expected an openapi/swagger version and a paths object');
  }
  return value as OpenApiDocument;
}

async function writeGeneratedFile(path: string, content: string): Promise<void> {
  try {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, 'utf8');
  } catch (error) {
    throw new Error(`Could not write generated file ${path}`, { cause: error });
  }
}

async function main(): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, '');
  if (!baseUrl) throw new Error('NEXT_PUBLIC_API_URL is not defined');

  const schemaUrl = `${baseUrl}/docs-json`;
  const document = await fetchSchema(schemaUrl);
  const types = astToString(await openapiTS(document as unknown as Parameters<typeof openapiTS>[0]));
  const root = process.cwd();
  await writeGeneratedFile(resolve(root, 'src/shared/types/api.d.ts'), types);
  await writeGeneratedFile(resolve(root, 'src/shared/api/api.ts'), renderApi(collectEndpoints(document)));
  console.log('Generated src/shared/types/api.d.ts and src/shared/api/api.ts');
}

main().catch((error: unknown) => {
  console.error(`API generation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
