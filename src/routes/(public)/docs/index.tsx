import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/(public)/docs/')({
  beforeLoad: () => {
    throw redirect({
      to: '/docs/theme',
    });
  },
});
