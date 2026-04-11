import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Registers Swagger UI for the small REST surface. tRPC remains the primary app contract.
 */
export function attachOpenApiDocs(app: INestApplication): void {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('KanuniBaat API')
    .setDescription(
      'REST surface for health and ops. Application clients use tRPC at POST/GET /trpc (see packages/trpc).',
    )
    .setVersion('1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, swaggerDocument);
}
