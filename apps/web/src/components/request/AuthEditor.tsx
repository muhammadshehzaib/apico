'use client';

import { useState } from 'react';
import { RequestAuth } from '@/types';
import { Input } from '@/components/ui/Input';

interface AuthEditorProps {
  auth: RequestAuth;
  onChange: (auth: RequestAuth) => void;
}

export function AuthEditor({ auth, onChange }: AuthEditorProps) {
  const [showBearerToken, setShowBearerToken] = useState(false);
  const [showBasicPassword, setShowBasicPassword] = useState(false);
  const [showApiKeyValue, setShowApiKeyValue] = useState(false);

  const handleTypeChange = (type: RequestAuth['type']) => {
    onChange({
      type,
      token: type === 'bearer' ? auth.token : undefined,
      username: type === 'basic' ? auth.username : undefined,
      password: type === 'basic' ? auth.password : undefined,
      apiKey: type === 'apikey' ? auth.apiKey : undefined,
      apiValue: type === 'apikey' ? auth.apiValue : undefined,
      apiIn: type === 'apikey' ? auth.apiIn : undefined,
    });
  };

  return (
    <div className="p-4 space-y-6 h-full overflow-auto">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
          Authentication Type
        </label>
        <div className="flex gap-3 flex-wrap">
          {(['none', 'bearer', 'basic', 'apikey'] as const).map((type) => (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border ${auth.type === type
                  ? 'bg-accent/15 text-accent border-accent/40'
                  : 'bg-bg-secondary/80 text-text-muted border-stroke hover:text-text-primary'
                }`}
            >
              {type === 'none'
                ? 'None'
                : type === 'bearer'
                  ? 'Bearer Token'
                  : type === 'basic'
                    ? 'Basic Auth'
                    : 'API Key'}
            </button>
          ))}
        </div>
      </div>

      {auth.type === 'bearer' && (
        <div className="w-full">
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Token</label>
          <div className="relative">
            <input
              type={showBearerToken ? 'text' : 'password'}
              value={auth.token || ''}
              onChange={(e) => onChange({ ...auth, token: e.target.value })}
              placeholder="Your bearer token"
              className="w-full px-4 py-2 bg-bg-secondary/80 text-text-primary border border-stroke rounded-md focus:outline-none focus:ring-2 focus:ring-accent/30 pr-16"
            />
            <button
              type="button"
              onClick={() => setShowBearerToken((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-text-muted hover:text-text-primary"
            >
              {showBearerToken ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
      )}

      {auth.type === 'basic' && (
        <>
          <Input
            label="Username"
            type="text"
            value={auth.username || ''}
            onChange={(e) => onChange({ ...auth, username: e.target.value })}
            placeholder="Username"
          />
          <div className="w-full">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Password</label>
            <div className="relative">
              <input
                type={showBasicPassword ? 'text' : 'password'}
                value={auth.password || ''}
                onChange={(e) => onChange({ ...auth, password: e.target.value })}
                placeholder="Password"
                className="w-full px-4 py-2 bg-bg-secondary/80 text-text-primary border border-stroke rounded-md focus:outline-none focus:ring-2 focus:ring-accent/30 pr-16"
              />
              <button
                type="button"
                onClick={() => setShowBasicPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-text-muted hover:text-text-primary"
              >
                {showBasicPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
        </>
      )}

      {auth.type === 'apikey' && (
        <>
          <Input
            label="Key Name"
            type="text"
            value={auth.apiKey || ''}
            onChange={(e) => onChange({ ...auth, apiKey: e.target.value })}
            placeholder="e.g., X-API-Key"
          />
          <div className="w-full">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Key Value</label>
            <div className="relative">
              <input
                type={showApiKeyValue ? 'text' : 'password'}
                value={auth.apiValue || ''}
                onChange={(e) => onChange({ ...auth, apiValue: e.target.value })}
                placeholder="Your API key"
                className="w-full px-4 py-2 bg-bg-secondary/80 text-text-primary border border-stroke rounded-md focus:outline-none focus:ring-2 focus:ring-accent/30 pr-16"
              />
              <button
                type="button"
                onClick={() => setShowApiKeyValue((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-text-muted hover:text-text-primary"
              >
                {showApiKeyValue ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
              Add to
            </label>
            <div className="flex gap-4">
              {(['header', 'query'] as const).map((location) => (
                <label key={location} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={auth.apiIn === location}
                    onChange={() => onChange({ ...auth, apiIn: location })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-text-primary">
                    {location === 'header' ? 'Header' : 'Query Parameter'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {auth.type === 'none' && (
        <div className="text-text-muted text-sm py-4">No authentication configured</div>
      )}
    </div>
  );
}
