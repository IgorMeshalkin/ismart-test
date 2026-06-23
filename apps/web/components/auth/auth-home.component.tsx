'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { AuthResponseDto, AuthUserDto } from '@dto';
import { useAuthApi } from '@/hooks/useAuthApi';
import styles from './auth-home.module.scss';

const ACCESS_TOKEN_KEY = 'ismart.accessToken';
const USER_KEY = 'ismart.user';

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
  const {
    register,
    login,
    isRegisterLoading,
    isLoginLoading,
    registerError,
    loginError,
  } = useAuthApi();
  const [user, setUser] = useState<AuthUserDto | null>(null);
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

  useEffect(() => {
    const storedUser = window.localStorage.getItem(USER_KEY);
    const storedAccessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);

    if (storedUser && storedAccessToken) {
      setUser(JSON.parse(storedUser) as AuthUserDto);
    }
  }, []);

  const submitRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await register(registerForm);

    storeAuth(response);
    setUser(response.user);
  };

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await login(loginForm);

    storeAuth(response);
    setUser(response.user);
  };

  const logout = () => {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  if (user) {
    return (
      <main className={styles.shell}>
        <section className={styles.homePanel}>
          <div className={styles.header}>
            <p className={styles.eyebrow}>iSmart</p>
            <h1 className={styles.title}>You successfully logged in to the application.</h1>
            <p className={styles.muted}>
              Signed in as {user.firstName} {user.lastName} ({user.email}).
            </p>
          </div>
          <button className={styles.secondaryButton} type="button" onClick={logout}>
            Logout
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>iSmart</p>
        <h1 className={styles.title}>Authentication</h1>
        <p className={styles.muted}>Create an account or sign in to continue.</p>
      </header>

      <section className={styles.authGrid}>
        <article className={styles.panel}>
          <h2 className={styles.panelTitle}>Register</h2>
          <form className={styles.form} onSubmit={submitRegister}>
            <label className={styles.field}>
              First name
              <input
                className={styles.input}
                name="firstName"
                onChange={(event) =>
                  setRegisterForm((current) => ({
                    ...current,
                    firstName: event.target.value,
                  }))
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
                onChange={(event) =>
                  setRegisterForm((current) => ({
                    ...current,
                    lastName: event.target.value,
                  }))
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
                onChange={(event) =>
                  setRegisterForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
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
                onChange={(event) =>
                  setRegisterForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                required
                type="password"
                value={registerForm.password}
              />
            </label>
            {registerError ? <p className={styles.error}>{registerError}</p> : null}
            <button className={styles.button} disabled={isRegisterLoading} type="submit">
              {isRegisterLoading ? 'Creating account' : 'Create account'}
            </button>
          </form>
        </article>

        <article className={styles.panel}>
          <h2 className={styles.panelTitle}>Login</h2>
          <form className={styles.form} onSubmit={submitLogin}>
            <label className={styles.field}>
              Email
              <input
                className={styles.input}
                name="email"
                onChange={(event) =>
                  setLoginForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
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
                onChange={(event) =>
                  setLoginForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                required
                type="password"
                value={loginForm.password}
              />
            </label>
            {loginError ? <p className={styles.error}>{loginError}</p> : null}
            <button className={styles.button} disabled={isLoginLoading} type="submit">
              {isLoginLoading ? 'Signing in' : 'Sign in'}
            </button>
          </form>
        </article>
      </section>
    </main>
  );
}

function storeAuth(response: AuthResponseDto) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(response.user));
}
