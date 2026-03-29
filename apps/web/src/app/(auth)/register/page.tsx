'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authService } from '@/services/auth.service';
import { registerSchema } from '@/validations/auth.validation';
import { ZodError } from 'zod';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validatedData = registerSchema.parse(formData);
      await authService.register(validatedData);
      const redirectTo = searchParams.get('redirect') || '/workspace';
      router.push(redirectTo);
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ submit: 'Registration failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-bg-secondary rounded-lg p-8 border border-bg-tertiary">
        <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="John Doe"
          />

          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="user@example.com"
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="••••••••"
            helperText="At least 8 characters"
          />

          {errors.submit && (
            <div className="bg-danger/10 border border-danger text-danger px-4 py-2 rounded text-sm">
              {errors.submit}
            </div>
          )}

          <Button type="submit" variant="primary" size="md" isLoading={isLoading} className="w-full">
            Register
          </Button>
        </form>

        <p className="text-center text-text-muted mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-accent hover:underline">
            Login
          </Link>
        </p>

        <div className="border-t border-bg-tertiary mt-6 pt-6">
          <p className="text-center text-text-muted text-sm mb-3">
            Just want to test an API?
          </p>
          <Link href="/playground" className="block text-center">
            <Button variant="secondary" size="md" className="w-full">
              Try the playground →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
