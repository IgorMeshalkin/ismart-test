'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthResponseDto } from '@dto';
import { useAuthApi } from '@/hooks/useAuthApi';
import styles from './auth-home.module.scss';

const ACCESS_TOKEN_KEY = 'ismart.accessToken';
const USER_KEY = 'ismart.user';

type Mode = 'login' | 'register';

type RegisterFormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

type LoginFormState = {
  email: string;
  password: string;
};

export function AuthHomeComponent() {
  const router = useRouter();
  const {
    register,
    login,
    isRegisterLoading,
    isLoginLoading,
    registerError,
    loginError,
  } = useAuthApi();

  const [mode, setMode] = useState<Mode>('login');
  const [registerForm, setRegisterForm] = useState<RegisterFormState>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [loginForm, setLoginForm] = useState<LoginFormState>({
    email: '',
    password: '',
  });

  const submitRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await register(registerForm);
    storeAuth(response);
    router.push('/files');
  };

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await login(loginForm);
    storeAuth(response);
    router.push('/files');
  };

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <p className={styles.eyebrow}>iSmart</p>
          <h1 className={styles.title}>
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h1>
        </div>

        {mode === 'login' ? (
          <form className={styles.form} onSubmit={submitLogin}>
            <label className={styles.field}>
              Email
              <input
                className={styles.input}
                name="email"
                onChange={(e) =>
                  setLoginForm((c) => ({ ...c, email: e.target.value }))
                }
                required
                type="email"
                value={loginForm.email}
              />
            </label>
            <label className={styles.field}>
              Password
              <input
                className={styles.input}
                name="password"
                onChange={(e) =>
                  setLoginForm((c) => ({ ...c, password: e.target.value }))
                }
                required
                type="password"
                value={loginForm.password}
              />
            </label>
            {loginError ? <p className={styles.error}>{loginError}</p> : null}
            <button className={styles.button} disabled={isLoginLoading} type="submit">
              {isLoginLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        ) : (
          <form className={styles.form} onSubmit={submitRegister}>
            <label className={styles.field}>
              First name
              <input
                className={styles.input}
                name="firstName"
                onChange={(e) =>
                  setRegisterForm((c) => ({ ...c, firstName: e.target.value }))
                }
                required
                value={registerForm.firstName}
              />
            </label>
            <label className={styles.field}>
              Last name
              <input
                className={styles.input}
                name="lastName"
                onChange={(e) =>
                  setRegisterForm((c) => ({ ...c, lastName: e.target.value }))
                }
                required
                value={registerForm.lastName}
              />
            </label>
            <label className={styles.field}>
              Email
              <input
                className={styles.input}
                name="email"
                onChange={(e) =>
                  setRegisterForm((c) => ({ ...c, email: e.target.value }))
                }
                required
                type="email"
                value={registerForm.email}
              />
            </label>
            <label className={styles.field}>
              Password
              <input
                className={styles.input}
                name="password"
                onChange={(e) =>
                  setRegisterForm((c) => ({ ...c, password: e.target.value }))
                }
                required
                type="password"
                value={registerForm.password}
              />
            </label>
            {registerError ? <p className={styles.error}>{registerError}</p> : null}
            <button className={styles.button} disabled={isRegisterLoading} type="submit">
              {isRegisterLoading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}

        <div className={styles.toggle}>
          {mode === 'login' ? (
            <>
              <span className={styles.toggleText}>Don&apos;t have an account?</span>
              <button
                className={styles.toggleButton}
                type="button"
                onClick={() => setMode('register')}
              >
                Create account
              </button>
            </>
          ) : (
            <>
              <span className={styles.toggleText}>Already have an account?</span>
              <button
                className={styles.toggleButton}
                type="button"
                onClick={() => setMode('login')}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function storeAuth(response: AuthResponseDto) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(response.user));
}
