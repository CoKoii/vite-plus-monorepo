import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { INestApplication } from "@nestjs/common";

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("Vite Plus API")
    .setDescription("Vite Plus Monorepo API 文档")
    .setVersion("1.0")
    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "access-token")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);
}
