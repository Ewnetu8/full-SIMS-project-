'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { env } from '@/lib/env';

export default function TestAuthPage() {
  const [email, setEmail] = useState('lecturer@sims.com');
  const [password, setPassword] = useState('password123');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('API Base URL:', env.NEXT_PUBLIC_API_BASE_URL);
      console.log('Login URL:', `${env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/login`);
      
      const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      setResult({
        status: response.status,
        ok: response.ok,
        data,
        headers: {
          'content-type': response.headers.get('content-type'),
          'set-cookie': response.headers.get('set-cookie'),
        }
      });
      
      console.log('Login Response:', {
        status: response.status,
        data,
      });
    } catch (error: any) {
      setResult({
        error: error.message,
        stack: error.stack,
      });
      console.error('Login Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold mb-4">Auth API Test</h1>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">API Base URL</label>
          <code className="block p-2 bg-gray-100 rounded text-sm">
            {env.NEXT_PUBLIC_API_BASE_URL}
          </code>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
          />
        </div>
        
        <Button onClick={testLogin} loading={loading}>
          Test Login
        </Button>
      </div>
      
      {result && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">Result:</h2>
          <pre className="p-4 bg-gray-100 rounded overflow-auto text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
