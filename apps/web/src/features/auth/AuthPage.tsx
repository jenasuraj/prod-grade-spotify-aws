import { useSearchParams } from 'react-router';
import AuthCard from '../../components/auth/AuthCard';
import ModeSwitch from '../../components/auth/ModeSwitch';
import { useAppDispatch, useAppSelector } from '../../store';
import { cancelRegistration } from '../../store/auth/authSlice';
import type { AuthMode } from '../../types/auth';
import { APP_NAME } from '../../utils/helpers';
import LoginForm from './LoginForm';
import OtpForm from './OtpForm';
import RegisterForm from './RegisterForm';

const copy = {
  login: {
    title: 'Welcome back.',
    subtitle: 'Pick up right where you left off.',
    switchText: "Don't have an account?",
    switchLabel: 'Register',
  },
  register: {
    title: 'Make some noise.',
    subtitle: 'Create an account to upload tracks and follow artists.',
    switchText: 'Already have an account?',
    switchLabel: 'Log in',
  },
};

export default function AuthPage() {
  const dispatch = useAppDispatch();
  const pending = useAppSelector((s) => s.auth.pending);
  const [params, setParams] = useSearchParams();
  const mode: AuthMode = params.get('mode') === 'register' ? 'register' : 'login';
  const other: AuthMode = mode === 'login' ? 'register' : 'login';
  const verifying = mode === 'register' && pending;

  const switchMode = (next: AuthMode) => {
    dispatch(cancelRegistration());
    setParams(next === 'register' ? { mode: 'register' } : {});
  };

  const footer = !verifying && (
    <>
      {copy[mode].switchText}{' '}
      <button
        type="button"
        onClick={() => switchMode(other)}
        className="font-semibold text-lime-300 hover:text-lime-200"
      >
        {copy[mode].switchLabel}
      </button>
    </>
  );

  return (
    <AuthCard footer={footer}>
      <title>{`${mode === 'login' ? 'Log in' : 'Register'} — ${APP_NAME}`}</title>
      {verifying ? (
        <OtpForm />
      ) : (
        <>
          <ModeSwitch mode={mode} onChange={switchMode} />
          <h1 className="font-display text-4xl font-semibold tracking-tight text-white">
            {copy[mode].title}
          </h1>
          <p className="mt-2 mb-8 text-slate-400">{copy[mode].subtitle}</p>
          {mode === 'login' ? <LoginForm /> : <RegisterForm />}
        </>
      )}
    </AuthCard>
  );
}
