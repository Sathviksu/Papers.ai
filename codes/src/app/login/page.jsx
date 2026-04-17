// login page
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  signInWithGoogle,
  useAuth,
  createUserProfile,
  getAdditionalUserInfo,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { useFirestore } from '@/firebase/provider';
import { PlaceHolderImages } from '@/lib/placeholder-images';

import { CursorFollower } from '@/components/ui/cursor-follower';

function GoogleColorLogo() {
  return (
    <svg className="mr-2 h-[18px] w-[18px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}

const signUpSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  terms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const loginBg = PlaceHolderImages.find((img) => img.id === 'login-background');

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [formType, setFormType] = useState('signin');

  const signUpForm = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      terms: false,
    },
  });

  const signInForm = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleGoogleLogin = async () => {
    startTransition(async () => {
      try {
        const userCredential = await signInWithGoogle(auth);
        const additionalInfo = getAdditionalUserInfo(userCredential);
        if (additionalInfo?.isNewUser) {
          await createUserProfile(userCredential.user, firestore);
        }
        toast({
          title: 'Login Successful',
          description: "You're now logged in.",
        });
        router.push('/dashboard');
      } catch (error) {
        console.error('Google login failed:', error);
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description:
            error.message || 'Could not log in with Google. Please try again.',
        });
      }
    });
  };

  const onSignUpSubmit = (values) => {
    startTransition(async () => {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        await createUserProfile(userCredential.user, firestore, {
          name: `${values.firstName} ${values.lastName}`,
        });
        toast({
          title: 'Sign Up Successful',
          description: 'Your account has been created.',
        });
        router.push('/dashboard');
      } catch (error) {
        console.error('Sign up failed:', error);
        toast({
          variant: 'destructive',
          title: 'Sign Up Failed',
          description:
            error.message || 'Could not create an account. Please try again.',
        });
      }
    });
  };

  const onSignInSubmit = (values) => {
    startTransition(async () => {
      try {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        toast({
          title: 'Login Successful',
          description: "You're now logged in.",
        });
        router.push('/dashboard');
      } catch (error) {
        console.error('Sign in failed:', error);
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: 'Invalid email or password. Please try again.',
        });
      }
    });
  };

  const SignInForm = (
    <div className="w-full max-w-sm">
      <div className="grid gap-2 mb-6">
        <h1 className="text-3xl font-bold">Log in</h1>
        <p className="text-balance text-muted-foreground">
          Don't have an account?{' '}
          <button
            onClick={() => {
              setFormType('signup');
              signInForm.reset();
            }}
            className="font-semibold text-primary hover:underline"
            disabled={isPending}
          >
            Create an account
          </button>
        </p>
      </div>
      <Form {...signInForm}>
        <form
          onSubmit={signInForm.handleSubmit(onSignInSubmit)}
          className="space-y-4"
        >
          <FormField
            control={signInForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Email" autoComplete="off" className="border-slate-400 focus-visible:ring-slate-500" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={signInForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    autoComplete="new-password"
                    className="border-slate-400 focus-visible:ring-slate-500"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full font-semibold"
            disabled={isPending}
          >
            {isPending ? 'Logging In...' : 'Log in'}
          </Button>
        </form>
      </Form>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        className="w-full border-slate-400 hover:border-slate-500"
        onClick={handleGoogleLogin}
        disabled={isPending}
      >
        <GoogleColorLogo />
        {isPending ? 'Authenticating...' : 'Continue with Google'}
      </Button>
    </div>
  );

  const SignUpForm = (
    <div className="w-full max-w-sm">
      <div className="grid gap-2 mb-6">
        <h1 className="text-3xl font-bold">Create an account</h1>
        <p className="text-balance text-muted-foreground">
          Already have an account?{' '}
          <button
            onClick={() => {
              setFormType('signin');
              signUpForm.reset();
            }}
            className="font-semibold text-primary hover:underline"
            disabled={isPending}
          >
            Log in
          </button>
        </p>
      </div>
      <Form {...signUpForm}>
        <form
          onSubmit={signUpForm.handleSubmit(onSignUpSubmit)}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={signUpForm.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="First name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={signUpForm.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Last name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={signUpForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="" autoComplete="off" className="border-slate-400 focus-visible:ring-slate-500" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={signUpForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="password"
                    placeholder=""
                    autoComplete="new-password"
                    className="border-slate-400 focus-visible:ring-slate-500"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={signUpForm.control}
            name="terms"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal text-sm text-muted-foreground">
                  I agree to the{' '}
                  <Link href="#" className="underline">
                    Terms & Conditions
                  </Link>
                </FormLabel>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full font-semibold"
            disabled={isPending}
          >
            {isPending ? 'Creating Account...' : 'Create account'}
          </Button>
        </form>
      </Form>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or register with
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        className="w-full border-slate-400 hover:border-slate-500"
        onClick={handleGoogleLogin}
        disabled={isPending}
      >
        <GoogleColorLogo />
        {isPending ? 'Authenticating...' : 'Continue with Google'}
      </Button>
    </div>
  );

  return (
    <main className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <CursorFollower />
      <div className="relative hidden h-full flex-col p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-[#1F1926] -z-10" />
        <div className="absolute inset-5">
          <Image
            src={
              loginBg?.imageUrl ||
              'https://images.pexels.com/photos/6306917/pexels-photo-6306917.jpeg'
            }
            alt="Desert at night"
            fill
            className="object-cover rounded-md"
            data-ai-hint={loginBg?.imageHint}
          />
        </div>
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-extrabold font-headline bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent tracking-tight">Papers.ai</span>
          </Link>
        </div>
        <div className="relative z-20 mt-auto max-w-md">
          <h2 className="text-3xl font-bold">
            The journey into a thousand papers begins with a single query.
          </h2>
          <p className="text-white/80 mt-2">
            Let curiosity be your compass.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center py-12 px-4">
        {formType === 'signup' ? SignUpForm : SignInForm}
      </div>
    </main>
  );
}
