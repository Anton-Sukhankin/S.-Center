import { createTaskListCard } from './task-list-card.js';

const avatar = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 rx=%2232%22 fill=%22%23dce9f7%22/%3E%3Ccircle cx=%2232%22 cy=%2225%22 r=%2211%22 fill=%22%23748395%22/%3E%3Cpath d=%22M14 58c2-13 9-20 18-20s16 7 18 20%22 fill=%22%23748395%22/%3E%3C/svg%3E';

const baseTask = {
  taskId: 'ECM-1042',
  title: 'Согласовать изменения условий договора поставки',
  status: 'В работе',
  statusColor: 'blue',
  person: {
    displayName: 'Анна Петрова',
    fullName: 'Петрова Анна Сергеевна',
    email: 'a.petrova@example.ru',
    avatarUrl: avatar,
  },
  date: '12.08.2026',
};

function createStoryCanvas() {
  const canvas = document.createElement('div');
  canvas.className = 'ds-task-list-card-story';
  return canvas;
}

export default {
  title: 'Data Display/Task List Card',
  tags: ['autodocs'],
};

export const Default = {
  render: () => {
    const canvas = createStoryCanvas();
    canvas.append(createTaskListCard(baseTask).element);
    return canvas;
  },
};

export const States = {
  render: () => {
    const canvas = createStoryCanvas();
    canvas.append(
      createTaskListCard(baseTask).element,
      createTaskListCard({ ...baseTask, taskId: 'ECM-1043', title: 'Новая задача', status: 'Новая', statusColor: 'green', newTask: true }).element,
      createTaskListCard({ ...baseTask, taskId: 'ECM-1044', title: 'Просроченная задача', status: 'Просрочена', statusColor: 'red', overdue: true }).element,
      createTaskListCard({ ...baseTask, taskId: 'ECM-1045', title: 'Выбранная задача', selected: true }).element,
    );
    return canvas;
  },
};

export const LongTitle = {
  render: () => {
    const canvas = createStoryCanvas();
    canvas.append(createTaskListCard({
      ...baseTask,
      title: 'Подготовить и согласовать комплект документов по изменению существенных условий договора с несколькими участниками процесса',
    }).element);
    return canvas;
  },
};
