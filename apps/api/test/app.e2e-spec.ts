import { Test, TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { attachOpenApiDocs } from '../src/http/open-api';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    attachOpenApiDocs(app);
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        const body = res.body as { status?: string };
        expect(body.status).toBe('ok');
      });
  });

  it('/health/ready (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/health/ready');
    if (process.env.CI === 'true') {
      expect(res.status).toBe(200);
      const body = res.body as { status?: string; database?: boolean };
      expect(body.status).toBe('ok');
      expect(body.database).toBe(true);
      return;
    }
    expect([200, 503]).toContain(res.status);
  });

  it('/api-docs (GET)', () => {
    return request(app.getHttpServer()).get('/api-docs').expect(200);
  });

  afterEach(async () => {
    await app.close();
  });
});
