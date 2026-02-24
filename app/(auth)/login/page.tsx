import { LoginForm } from '@/components/auth/login-form';

type Props = { searchParams: Promise<{ callbackUrl?: string }> };

const LoginPage = async ({ searchParams }: Props) => {
  const { callbackUrl } = await searchParams;
  return <LoginForm callbackUrl={callbackUrl} />;
};

export default LoginPage;