Файлы из этой папки кладутся поверх проекта.

Порядок:
1) Выполнить prisma/orders-attribution.sql в PostgreSQL.
2) Заменить блок model orders на prisma/orders-model-replacement.prisma.
3) Выполнить в проекте: npx prisma generate
4) Перезапустить приложение.
