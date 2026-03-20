'use client';

import { RequestAuth } from '@/types';
import { Input } from '@/components/ui/Input';

interface AuthEditorProps {
  auth: RequestAuth;
  onChange: (auth: RequestAuth) => void;
}

export function AuthEditor({ auth, onChange }: AuthEditorProps) {
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
    <div className="p-4 space-y-6">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-3">
          Authentication Type
        </label>
        <div className="flex gap-3 flex-wrap">
          {(['none', 'bearer', 'basic', 'apikey'] as const).map((type) => (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                auth.type === type
                  ? 'bg-accent text-white'
                  : 'bg-bg-secondary text-text-muted hover:text-text-primary'
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
        <Input
          label="Token"
          type="password"
          value={auth.token || ''}
          onChange={(e) => onChange({ ...auth, token: e.target.value })}
          placeholder="Your bearer token"
        />
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
          <Input
            label="Password"
            type="password"
            value={auth.password || ''}
            onChange={(e) => onChange({ ...auth, password: e.target.value })}
            placeholder="Password"
          />
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
          <Input
            label="Key Value"
            type="password"
            value={auth.apiValue || ''}
            onChange={(e) => onChange({ ...auth, apiValue: e.target.value })}
            placeholder="Your API key"
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
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
