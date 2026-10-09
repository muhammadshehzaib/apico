'use client';

import { useEffect, useRef, useState } from 'react';
import { workspaceService } from '@/services/workspace.service';
import { apiService } from '@/services/api.service';
import { HttpMethod } from '@/types';

type Protocol = 'GraphQL' | 'gRPC' | 'WebSocket';
type SocketEvent = { at: string; direction: 'in' | 'out' | 'system'; data: string };

const field = 'w-full rounded border border-stroke bg-bg-secondary px-3 py-2 font-mono text-sm text-text-primary focus:border-accent focus:outline-none';
const button = 'rounded bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';

function parseObject(value: string, label: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(value || '{}');
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(`${label} must be a JSON object`);
  return parsed as Record<string, unknown>;
}

function errorText(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string; error?: string } } }).response;
    if (response?.data?.message) return response.data.message;
    if (response?.data?.error) return response.data.error;
  }
  return error instanceof Error ? error.message : String(error);
}

export function ProtocolWorkbench({ protocol }: { protocol: Protocol }) {
  const [url, setUrl] = useState('');
  const [query, setQuery] = useState('query { __typename }');
  const [variables, setVariables] = useState('{}');
  const [headers, setHeaders] = useState('{}');
  const [target, setTarget] = useState('localhost:50051');
  const [tls, setTls] = useState(false);
  const [proto, setProto] = useState('syntax = "proto3";\npackage example;\nservice Greeter { rpc SayHello (HelloRequest) returns (HelloReply); }\nmessage HelloRequest { string name = 1; }\nmessage HelloReply { string message = 1; }');
  const [service, setService] = useState('example.Greeter');
  const [method, setMethod] = useState('SayHello');
  const [message, setMessage] = useState('{"name":"world"}');
  const [metadata, setMetadata] = useState('{}');
  const [wsMessage, setWsMessage] = useState('');
  const [socketStatus, setSocketStatus] = useState('Disconnected');
  const [events, setEvents] = useState<SocketEvent[]>([]);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    setError('');
    setResult('');
    return () => { socket.current?.close(); socket.current = null; };
  }, [protocol]);

  const addEvent = (direction: SocketEvent['direction'], data: string) => {
    setEvents((prev) => [...prev, { at: new Date().toLocaleTimeString(), direction, data }].slice(-100));
  };

  const sendGraphQL = async () => {
    setBusy(true); setError(''); setResult('');
    try {
      const endpoint = new URL(url);
      if (!['http:', 'https:'].includes(endpoint.protocol)) throw new Error('GraphQL URL must use HTTP or HTTPS');
      const values = parseObject(variables, 'Variables');
      const extraHeaders = parseObject(headers, 'Headers');
      const response = await workspaceService.executeRequest({
        method: HttpMethod.POST,
        url,
        headers: [
          { key: 'Content-Type', value: 'application/json', enabled: true },
          ...Object.entries(extraHeaders).map(([key, value]) => ({ key, value: String(value), enabled: true })),
        ],
        params: [],
        body: JSON.stringify({ query, variables: values }),
        auth: { type: 'none' },
      });
      setResult(`HTTP ${response.statusCode} · ${response.duration} ms\n\n${response.body}`);
    } catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); }
  };

  const sendGrpc = async () => {
    setBusy(true); setError(''); setResult('');
    try {
      const input = {
        target, tls, proto, service, method,
        message: parseObject(message, 'Message'),
        metadata: Object.fromEntries(Object.entries(parseObject(metadata, 'Metadata')).map(([key, value]) => [key, String(value)])),
      };
      const response = await apiService.post<{ response: unknown; duration: number }>('/grpc/call', input);
      const data = response.data.data;
      if (!data) throw new Error('The gRPC server returned an empty response');
      setResult(`${data.duration} ms\n\n${JSON.stringify(data.response, null, 2)}`);
    } catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); }
  };

  const connectSocket = () => {
    setError('');
    try {
      const endpoint = new URL(url);
      if (!['ws:', 'wss:'].includes(endpoint.protocol)) throw new Error('WebSocket URL must use ws:// or wss://');
      socket.current?.close();
      const ws = new WebSocket(url);
      socket.current = ws;
      setSocketStatus('Connecting');
      ws.onopen = () => { setSocketStatus('Connected'); addEvent('system', 'Connected'); };
      ws.onmessage = (event) => addEvent('in', typeof event.data === 'string' ? event.data : '[binary message]');
      ws.onerror = () => { setError('WebSocket connection failed'); addEvent('system', 'Connection error'); };
      ws.onclose = (event) => { setSocketStatus('Disconnected'); addEvent('system', `Disconnected (${event.code})`); if (socket.current === ws) socket.current = null; };
    } catch (cause) { setError(errorText(cause)); }
  };

  const sendSocket = () => {
    if (socket.current?.readyState !== WebSocket.OPEN) return;
    socket.current.send(wsMessage);
    addEvent('out', wsMessage);
    setWsMessage('');
  };

  return <div className="flex-1 overflow-auto p-6 text-text-primary">
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{protocol} client</h1>
        <p className="text-sm text-text-muted">
          {protocol === 'GraphQL' ? 'Send a GraphQL query or mutation over HTTP.' :
            protocol === 'gRPC' ? 'Call a unary method using a pasted .proto definition. The Apico server connects to the target.' :
              'Connect from your browser and exchange text messages. Browser WebSockets cannot set custom handshake headers.'}
        </p>
      </div>

      {protocol === 'GraphQL' && <>
        <label className="block text-sm">Endpoint<input className={`${field} mt-1`} placeholder="https://api.example.com/graphql" value={url} onChange={(e) => setUrl(e.target.value)} /></label>
        <label className="block text-sm">Query or mutation<textarea className={`${field} mt-1 h-44`} value={query} onChange={(e) => setQuery(e.target.value)} /></label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm">Variables (JSON)<textarea className={`${field} mt-1 h-32`} value={variables} onChange={(e) => setVariables(e.target.value)} /></label>
          <label className="block text-sm">Headers (JSON)<textarea className={`${field} mt-1 h-32`} value={headers} onChange={(e) => setHeaders(e.target.value)} /></label>
        </div>
        <button className={button} disabled={busy} onClick={sendGraphQL}>Send GraphQL</button>
      </>}

      {protocol === 'gRPC' && <>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm">Target (host:port)<input className={`${field} mt-1`} value={target} onChange={(e) => setTarget(e.target.value)} /></label>
          <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={tls} onChange={(e) => setTls(e.target.checked)} /> Use TLS</label>
        </div>
        <label className="block text-sm">.proto definition<textarea className={`${field} mt-1 h-44`} value={proto} onChange={(e) => setProto(e.target.value)} /></label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm">Service (package.Service)<input className={`${field} mt-1`} value={service} onChange={(e) => setService(e.target.value)} /></label>
          <label className="block text-sm">Method<input className={`${field} mt-1`} value={method} onChange={(e) => setMethod(e.target.value)} /></label>
          <label className="block text-sm">Message (JSON)<textarea className={`${field} mt-1 h-32`} value={message} onChange={(e) => setMessage(e.target.value)} /></label>
          <label className="block text-sm">Metadata (JSON)<textarea className={`${field} mt-1 h-32`} value={metadata} onChange={(e) => setMetadata(e.target.value)} /></label>
        </div>
        <button className={button} disabled={busy} onClick={sendGrpc}>Call gRPC</button>
      </>}

      {protocol === 'WebSocket' && <>
        <div className="flex gap-2">
          <input className={field} placeholder="wss://echo.example.com" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button className={button} onClick={socketStatus === 'Disconnected' ? connectSocket : () => socket.current?.close()}>{socketStatus === 'Disconnected' ? 'Connect' : 'Disconnect'}</button>
        </div>
        <p className="text-sm text-text-muted">Status: {socketStatus}</p>
        <div className="flex gap-2">
          <input className={field} placeholder="Message" value={wsMessage} onChange={(e) => setWsMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendSocket(); }} />
          <button className={button} disabled={socketStatus !== 'Connected'} onClick={sendSocket}>Send</button>
        </div>
        <div className="h-72 overflow-auto rounded border border-stroke bg-bg-secondary p-3 font-mono text-sm" aria-label="WebSocket messages">
          {events.map((event, index) => <div key={index} className="mb-1 whitespace-pre-wrap break-all"><span className="text-text-muted">{event.at} [{event.direction}]</span> {event.data}</div>)}
        </div>
        <button className="text-sm text-text-muted underline" onClick={() => setEvents([])}>Clear messages</button>
      </>}

      {error && <div role="alert" className="rounded border border-danger/60 bg-danger/10 p-3 text-sm text-danger">{error}</div>}
      {result && <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-all rounded border border-stroke bg-bg-secondary p-4 text-sm">{result}</pre>}
    </div>
  </div>;
}
