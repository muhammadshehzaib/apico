import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as grpc from '@grpc/grpc-js';
import * as protobuf from 'protobufjs';
import { callGrpc } from '../services/grpc.service';

const proto = `syntax = "proto3";
package example;
service Greeter { rpc SayHello (HelloRequest) returns (HelloReply); }
message HelloRequest { string name = 1; }
message HelloReply { string message = 1; }`;

describe('gRPC client', () => {
  const root = protobuf.parse(proto).root;
  root.resolveAll();
  const requestType = root.lookupType('example.HelloRequest');
  const responseType = root.lookupType('example.HelloReply');
  const server = new grpc.Server();
  let target: string;

  beforeAll(async () => {
    server.addService({
      SayHello: {
        path: '/example.Greeter/SayHello',
        requestStream: false,
        responseStream: false,
        requestSerialize: (value: unknown) => Buffer.from(requestType.encode(requestType.fromObject(value as object)).finish()),
        requestDeserialize: (value: Buffer) => requestType.toObject(requestType.decode(value)),
        responseSerialize: (value: unknown) => Buffer.from(responseType.encode(responseType.fromObject(value as object)).finish()),
        responseDeserialize: (value: Buffer) => responseType.toObject(responseType.decode(value)),
        originalName: 'SayHello',
      },
    }, {
      SayHello: (call: grpc.ServerUnaryCall<{ name: string }, { message: string }>, callback: grpc.sendUnaryData<{ message: string }>) => {
        callback(null, { message: `Hello ${call.request.name}` });
      },
    });
    const port = await new Promise<number>((resolve, reject) => {
      server.bindAsync('127.0.0.1:0', grpc.ServerCredentials.createInsecure(), (error, assigned) => error ? reject(error) : resolve(assigned));
    });
    target = `127.0.0.1:${port}`;
  });

  afterAll(() => server.forceShutdown());

  it('calls a unary method and decodes its response', async () => {
    const result = await callGrpc({ target, proto, service: 'example.Greeter', method: 'SayHello', message: { name: 'Apico' }, metadata: {}, tls: false });
    expect(result.response).toEqual({ message: 'Hello Apico' });
  });

  it('rejects an unknown method before connecting', async () => {
    await expect(callGrpc({ target, proto, service: 'example.Greeter', method: 'Missing', message: {}, metadata: {}, tls: false })).rejects.toThrow('was not found');
  });
});
