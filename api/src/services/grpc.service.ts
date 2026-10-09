import * as grpc from '@grpc/grpc-js';
import * as protobuf from 'protobufjs';
import { BadRequestError } from '../errors/AppError';

export interface GrpcCallInput {
  target: string;
  proto: string;
  service: string;
  method: string;
  message: Record<string, unknown>;
  metadata: Record<string, string>;
  tls: boolean;
}

export interface GrpcCallResult {
  response: unknown;
  duration: number;
}

export async function callGrpc(input: GrpcCallInput): Promise<GrpcCallResult> {
  const target = input.target.trim();
  if (!/^[a-zA-Z0-9.-]+:\d{1,5}$/.test(target)) {
    throw new BadRequestError('gRPC target must be host:port');
  }

  let root: protobuf.Root;
  try {
    root = protobuf.parse(input.proto, { keepCase: true }).root;
    root.resolveAll();
  } catch (error) {
    throw new BadRequestError(`Invalid .proto definition: ${error instanceof Error ? error.message : String(error)}`);
  }

  let service: protobuf.Service;
  try {
    service = root.lookupService(input.service.replace(/^\./, ''));
  } catch {
    throw new BadRequestError(`Service ${input.service} was not found in the .proto definition`);
  }
  const method = service.methods[input.method];
  if (!method) throw new BadRequestError(`Method ${input.method} was not found`);
  if (method.requestStream || method.responseStream) {
    throw new BadRequestError('This client currently supports unary gRPC methods only');
  }

  const requestType = method.resolvedRequestType;
  const responseType = method.resolvedResponseType;
  if (!requestType || !responseType) throw new BadRequestError('Could not resolve gRPC message types');
  const requestMessage = requestType.fromObject(input.message);
  const validationError = requestType.verify(requestMessage);
  if (validationError) throw new BadRequestError(`Invalid request message: ${validationError}`);

  const credentials = input.tls ? grpc.credentials.createSsl() : grpc.credentials.createInsecure();
  const client = new grpc.Client(target, credentials, {
    'grpc.max_receive_message_length': 4 * 1024 * 1024,
  });
  const metadata = new grpc.Metadata();
  for (const [key, value] of Object.entries(input.metadata)) {
    if (!/^[a-z0-9_.-]+$/.test(key) || key.endsWith('-bin')) {
      client.close();
      throw new BadRequestError(`Invalid metadata key: ${key}`);
    }
    metadata.set(key, value);
  }

  const started = Date.now();
  const path = `/${service.fullName.slice(1)}/${method.name}`;
  try {
    return await new Promise<GrpcCallResult>((resolve, reject) => {
      client.makeUnaryRequest(
        path,
        (value: Record<string, unknown>) => Buffer.from(requestType.encode(requestType.fromObject(value)).finish()),
        (bytes: Buffer) => responseType.toObject(responseType.decode(bytes), { longs: String, enums: String, bytes: String }),
        requestMessage,
        metadata,
        { deadline: Date.now() + 10000 },
        (error, response) => {
          if (error) return reject(new BadRequestError(`gRPC ${grpc.status[error.code] || error.code}: ${error.details}`));
          resolve({ response, duration: Date.now() - started });
        }
      );
    });
  } finally {
    client.close();
  }
}
