import { createPagination } from './pagination.js';

export default {
  title: 'Navigation/Pagination',
  tags: ['autodocs'],
  args: { currentPage: 3, totalPages: 12 },
};

export const Default = { render: args => createPagination(args).element };
export const FirstPage = { args: { currentPage: 1 }, render: args => createPagination(args).element };
