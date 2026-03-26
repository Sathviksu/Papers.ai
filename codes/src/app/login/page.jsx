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
  const [formType, setFormType] = useState('signup');

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
                  <Input placeholder="Email" {...field} />
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
                  <Input placeholder="Email" {...field} />
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
                    placeholder="Enter your password"
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
        className="w-full"
        onClick={handleGoogleLogin}
        disabled={isPending}
      >
        <svg
          className="mr-2 h-4 w-4"
          aria-hidden="true"
          focusable="false"
          data-prefix="fab"
          data-icon="google"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 488 512"
        >
          <path
            fill="currentColor"
            d="M488 261.8C488 403.3 381.5 512 244 512 109.8 512 0 402.2 0 256S109.8 0 244 0c73 0 135.3 29.7 181.4 78.6l-65.2 65.2c-22.6-21.5-55.2-34.6-96.2-34.6-73.3 0-133.7 60.4-133.7 134.8s60.4 134.8 133.7 134.8c76.9 0 111.8-32.8 116-77.8H244V261.8h244z"
          ></path>
        </svg>
        {isPending ? 'Authenticating...' : 'Google'}
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
