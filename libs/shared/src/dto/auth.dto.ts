import { UserEntity } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';

export class RegisterUserDto {
  firstName!: string;
  lastName!: string;
  email!: string;
  password!: string;
}

export class LoginDto {
  email!: string;
  password!: string;
}

export class AuthUserDto {
  id!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  role!: UserRole;

  static fromEntity(entity: UserEntity): AuthUserDto {
    const dto = new AuthUserDto();

    dto.id = entity.id;
    dto.firstName = entity.firstName;
    dto.lastName = entity.lastName;
    dto.email = entity.email;
    dto.role = entity.role;

    return dto;
  }
}

export class AuthResponseDto {
  accessToken!: string;
  user!: AuthUserDto;

  static fromEntity(entity: UserEntity, accessToken: string): AuthResponseDto {
    const dto = new AuthResponseDto();

    dto.accessToken = accessToken;
    dto.user = AuthUserDto.fromEntity(entity);

    return dto;
  }
}
