import {DefaultNamingStrategy, NamingStrategyInterface} from "typeorm";
import {snakeCase} from "typeorm/util/StringUtils";

// Global snake_case naming strategy for TypeORM
// Keeps entity property names in camelCase in code while mapping to snake_case in DB
export class SnakeNamingStrategyLocal extends DefaultNamingStrategy implements NamingStrategyInterface {
  tableName(className: string, customName?: string): string {
    return customName ?? snakeCase(className);
  }

  columnName(propertyName: string, customName?: string, embeddedPrefixes: string[] = []): string {
    const prefix = embeddedPrefixes.length ? `${snakeCase(embeddedPrefixes.join("_"))}_` : "";
    return prefix + (customName ?? snakeCase(propertyName));
  }

  relationName(propertyName: string): string {
    return snakeCase(propertyName);
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return snakeCase(`${relationName}_${referencedColumnName}`);
  }

  joinTableName(
    firstTableName: string,
    secondTableName: string,
    firstPropertyName: string,
    _secondPropertyName: string,
  ): string {
    // e.g. user_roles or chat_participants
    return snakeCase(`${firstTableName}_${firstPropertyName}_${secondTableName}`);
  }

  joinTableColumnName(tableName: string, propertyName: string, columnName?: string): string {
    return snakeCase(`${tableName}_${columnName ?? propertyName}`);
  }

  eagerJoinRelationAlias(alias: string, propertyPath: string): string {
    return `${alias}_${snakeCase(propertyPath)}`;
  }
}
