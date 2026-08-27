/** @type { import('@storybook/html-vite').StorybookConfig } */
const config = {
  stories: ['../src/ui/components/**/*.stories.js'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/html-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
