'use client';

import { useState } from 'react';
import type {
  AuthResponseDto,
  LoginDto,
  RegisterUserDto,
} from '@dto';

type AuthApiState = {
  isRegisterLoading: boolean;
  isLoginLoading: boolean;
  registerError: string | null;
  loginError: string | null;
};

type ApiErrorResponse = {
  message?: string | string[];
};

export function useAuthApi() {
  const [state, setState] = useState<AuthApiState>({
    isRegisterLoading: false,
    isLoginLoading: false,
    registerError: null,
    loginError: null,
  });

  const register = async (body: RegisterUserDto): Promise<AuthResponseDto> => {
    setState((current) => ({
      ...current,
      isRegisterLoading: true,
      registerError: null,
    }));

    try {
      return await requestAuth('/auth/register', body);
    } catch (error) {
      const message = toReadableError(error);

      setState((current) => ({ ...current, registerError: message }));
      throw error;
    } finally {
      setState((current) => ({ ...current, isRegisterLoading: false }));
    }
  };

  const login = async (body: LoginDto): Promise<AuthResponseDto> => {
    setState((current) => ({
      ...current,
      isLoginLoading: true,
      loginError: null,
    }));

    try {
      return await requestAuth('/auth/login', body);
    } catch (error) {
      const message = toReadableError(error);

      setState((current) => ({ ...current, loginError: message }));
      throw error;
    } finally {
      setState((current) => ({ ...current, isLoginLoading: false }));
    }
  };

  return {
    register,
    login,
    ...state,
  };
}

async function requestAuth(path: string, body: LoginDto | RegisterUserDto): Promise<AuthResponseDto> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
  const response = await fetch(`${apiUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    const message = Array.isArray(errorBody?.message)
      ? errorBody.message.join(', ')
      : errorBody?.message;

    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<AuthResponseDto>;
}

function toReadableError(error: unknown): string {
  return error instanceof Error ? error.message : 'Authentication request failed';
}
