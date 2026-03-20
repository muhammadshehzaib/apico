'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authService } from '@/services/auth.service';
import { loginSchema } from '@/validations/auth.validation';
import { ZodError } from 'zod';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
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
      const validatedData = loginSchema.parse(formData);
      const result = await authService.login(validatedData);
      router.push('/app/workspace');
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
        setErrors({ submit: 'Login failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-bg-secondary rounded-lg p-8 border border-bg-tertiary">
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
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
          />

          {errors.submit && (
            <div className="bg-danger/10 border border-danger text-danger px-4 py-2 rounded text-sm">
              {errors.submit}
            </div>
          )}

          <Button type="submit" variant="primary" size="md" isLoading={isLoading} className="w-full">
            Login
          </Button>
        </form>

        <p className="text-center text-text-muted mt-6">
          Don't have an account?{' '}
          <Link href="/register" className="text-accent hover:underline">
            Register
          </Link>
        </p>

        <div className="border-t border-bg-tertiary mt-6 pt-6">
          <p className="text-center text-text-muted text-sm mb-3">
            Want to try first?
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
