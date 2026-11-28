import { MailCheck } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import OtpInput from '../../components/auth/OtpInput';
import Button from '../../components/ui/Button';
import FormMessage from '../../components/ui/FormMessage';
import { useAppDispatch, useAppSelector } from '../../store';
import { cancelRegistration } from '../../store/auth/authSlice';
import { resendOtp, verifyOtp } from '../../store/auth/authThunks';

const RESEND_SECONDS = 60;

export default function OtpForm() {
  const dispatch = useAppDispatch();
  const { pending, loading, error, notice } = useAppSelector((s) => s.auth);
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timeout = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timeout);
  }, [cooldown]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void dispatch(verifyOtp(code));
  };

  const handleResend = async () => {
    const result = await dispatch(resendOtp());
    if (resendOtp.fulfilled.match(result)) {
      setCode('');
      setCooldown(RESEND_SECONDS);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <span className="grid size-12 place-items-center rounded-2xl bg-lime-300/10">
        <MailCheck className="size-6 text-lime-300" />
      </span>
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-white">
          Check your email.
        </h1>
        <p className="mt-2 text-slate-400">
          We sent a 6-digit code to <span className="font-medium text-white">{pending?.email}</span>
        </p>
      </div>
      <OtpInput value={code} onChange={setCode} />
      <FormMessage message={error} />
      <FormMessage message={notice} tone="success" />
      <Button
        type="submit"
        variant="accent"
        disabled={loading || code.length !== 6}
        className="w-full"
      >
        {loading ? 'Verifying…' : 'Verify email'}
      </Button>
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => dispatch(cancelRegistration())}
          className="text-slate-400 transition hover:text-white"
        >
          Use a different email
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0}
          className="font-semibold text-lime-300 transition hover:text-lime-200 disabled:font-normal disabled:text-slate-600"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
    </form>
  );
}
