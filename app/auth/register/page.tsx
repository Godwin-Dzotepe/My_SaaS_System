'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';

export default function RegisterPage() {
  return (
    <Card className="w-full">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Create account</CardTitle>
        <CardDescription>Sign up as a parent to get started</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">First Name</label>
            <Input placeholder="John" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Last Name</label>
            <Input placeholder="Doe" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Phone Number</label>
          <Input type="tel" placeholder="+1 (555) 000-0000" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Email (Optional)</label>
          <Input type="email" placeholder="john@example.com" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Password</label>
          <Input type="password" placeholder="Create a password" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Confirm Password</label>
          <Input type="password" placeholder="Confirm your password" />
        </div>

        <div className="flex items-start gap-2">
          <input type="checkbox" className="mt-1 rounded border-gray-300" />
          <span className="text-sm text-gray-600">
            I agree to the{' '}
            <Link href="#" className="text-blue-600 hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="#" className="text-blue-600 hover:underline">Privacy Policy</Link>
          </span>
        </div>

        <Button className="w-full">Create Account</Button>

        <div className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}