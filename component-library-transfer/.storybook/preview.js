import '../src/styles/index.css';

export const parameters = {
  layout: 'centered',
  controls: {
    expanded: true,
  },
  a11y: {
    test: 'error',
  },
  options: {
    storySort: {
      order: ['Overview', 'Controls', 'Data Display', 'Navigation', 'Disclosure', 'Overlays', 'Feedback', 'Utilities'],
    },
  },
};

export const decorators = [
  story => {
    const canvas = document.createElement('div');
    canvas.className = 'component-story-canvas';
    canvas.append(story());
    return canvas;
  },
];
