import { expect, test } from '@playwright/test';

const OUTER = '.s-center-main';
const FIRST_WORK = '.dch2-work-accordion.is-expanded';
const INNER = `${FIRST_WORK} .ds-chessboard__scroll`;
const browserErrors = new WeakMap();

async function waitForMotion(page, milliseconds = 850) {
  await page.waitForTimeout(milliseconds);
}

async function setScroll(locator, scrollTop) {
  await locator.evaluate((element, value) => {
    element.scrollTop = value;
  }, scrollTop);
}

async function scrollMetrics(page) {
  return page.evaluate(({ outerSelector, innerSelector }) => {
    const outer = document.querySelector(outerSelector);
    const inner = document.querySelector(innerSelector);
    const accordion = inner?.closest('.dch2-work-accordion');
    return {
      inner: inner?.scrollTop ?? null,
      innerMax: inner ? inner.scrollHeight - inner.clientHeight : null,
      outer: outer?.scrollTop ?? null,
      outerMax: outer ? outer.scrollHeight - outer.clientHeight : null,
      stickyShift: Number.parseFloat(accordion?.style.getPropertyValue('--dch2-work-sticky-shift')) || 0,
    };
  }, { outerSelector: OUTER, innerSelector: INNER });
}

async function pointOver(page, locator) {
  const box = await locator.boundingBox();
  expect(box, 'Проверяемая матрица должна пересекать viewport').not.toBeNull();
  const viewport = page.viewportSize();
  const x = Math.min(viewport.width - 20, Math.max(20, box.x + box.width * 0.72));
  const visibleTop = Math.max(0, box.y);
  const visibleBottom = Math.min(viewport.height, box.y + box.height);
  expect(visibleBottom - visibleTop).toBeGreaterThan(24);
  const y = Math.min(viewport.height - 20, Math.max(20, (visibleTop + visibleBottom) / 2));
  return { x, y };
}

async function wheelOver(page, locator, deltaY, deltaX = 0) {
  const { x, y } = await pointOver(page, locator);
  await page.mouse.move(x, y);
  await page.mouse.wheel(deltaX, deltaY);
}

test.beforeEach(async ({ page }) => {
  const errors = [];
  browserErrors.set(page, errors);
  page.on('console', message => message.type() === 'error' && errors.push(message.text()));
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator(INNER)).toBeVisible();
  await expect.poll(async () => (await scrollMetrics(page)).innerMax).toBeGreaterThan(500);
});

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page) || []).toEqual([]);
});

test('AC-SCROLL-01/02/03: inner-first routing and remainder on both boundaries', async ({ page }) => {
  const outer = page.locator(OUTER);
  const inner = page.locator(INNER);

  await setScroll(outer, 0);
  await setScroll(inner, 0);
  await wheelOver(page, inner, 220);
  await waitForMotion(page);
  const innerFirst = await scrollMetrics(page);
  expect(innerFirst.inner).toBeGreaterThan(150);
  expect(innerFirst.outer).toBeLessThanOrEqual(1);

  await setScroll(outer, 0);
  await setScroll(inner, innerFirst.innerMax - 30);
  await wheelOver(page, inner, 220);
  await waitForMotion(page);
  const downwardRemainder = await scrollMetrics(page);
  expect(Math.abs(downwardRemainder.innerMax - downwardRemainder.inner)).toBeLessThanOrEqual(1);
  expect(downwardRemainder.outer).toBeGreaterThan(150);

  await setScroll(outer, 150);
  await setScroll(inner, 30);
  await wheelOver(page, inner, -120);
  await waitForMotion(page);
  const upwardRemainder = await scrollMetrics(page);
  expect(upwardRemainder.inner).toBeLessThanOrEqual(1);
  expect(upwardRemainder.outer).toBeLessThan(150);

  await setScroll(outer, 0);
  await setScroll(inner, upwardRemainder.innerMax);
  const sourceHandled = await inner.evaluate(element => !element.dispatchEvent(new WheelEvent('wheel', {
    bubbles: false,
    cancelable: true,
    deltaMode: WheelEvent.DOM_DELTA_PIXEL,
    deltaY: 220,
  })));
  expect(sourceHandled, 'Window capture должен владеть wheel без зависимости от bubbling').toBe(true);
  await waitForMotion(page);
  const directSourceRemainder = await scrollMetrics(page);
  expect(Math.abs(directSourceRemainder.innerMax - directSourceRemainder.inner)).toBeLessThanOrEqual(1);
  expect(directSourceRemainder.outer).toBeGreaterThan(150);

  await setScroll(outer, 0);
  await setScroll(inner, directSourceRemainder.innerMax - 300);
  await inner.evaluate(element => {
    element.scrollLeft = 0;
  });
  await wheelOver(page, inner, 120, 400);
  await waitForMotion(page);
  const trustedInnerFirstDiagonal = await page.evaluate(({ outerSelector, innerSelector }) => {
    const outerElement = document.querySelector(outerSelector);
    const innerElement = document.querySelector(innerSelector);
    return { inner: innerElement.scrollTop, outer: outerElement.scrollTop, innerLeft: innerElement.scrollLeft };
  }, { outerSelector: OUTER, innerSelector: INNER });
  expect(trustedInnerFirstDiagonal.inner).toBeGreaterThan(directSourceRemainder.innerMax - 200);
  expect(trustedInnerFirstDiagonal.outer).toBeLessThanOrEqual(1);
  expect(trustedInnerFirstDiagonal.innerLeft).toBeGreaterThan(250);

  await setScroll(outer, 0);
  await setScroll(inner, directSourceRemainder.innerMax);
  await inner.evaluate(element => {
    element.scrollLeft = 0;
  });
  await wheelOver(page, inner, 120, 400);
  await waitForMotion(page);
  const trustedBoundaryDiagonal = await page.evaluate(({ outerSelector, innerSelector }) => {
    const outerElement = document.querySelector(outerSelector);
    const innerElement = document.querySelector(innerSelector);
    return { outer: outerElement.scrollTop, innerLeft: innerElement.scrollLeft };
  }, { outerSelector: OUTER, innerSelector: INNER });
  expect(trustedBoundaryDiagonal.innerLeft).toBeGreaterThan(250);
  expect(trustedBoundaryDiagonal.outer).toBeGreaterThan(100);
  expect(trustedBoundaryDiagonal.outer).toBeLessThan(140);

  await setScroll(outer, 0);
  await setScroll(inner, directSourceRemainder.innerMax);
  await inner.evaluate(element => {
    element.scrollLeft = 0;
    element.dispatchEvent(new WheelEvent('wheel', {
      bubbles: false,
      cancelable: true,
      deltaMode: WheelEvent.DOM_DELTA_PIXEL,
      deltaX: 400,
      deltaY: 120,
    }));
    element.dispatchEvent(new WheelEvent('wheel', {
      bubbles: false,
      cancelable: true,
      deltaMode: WheelEvent.DOM_DELTA_PIXEL,
      deltaX: 80,
      deltaY: 0,
    }));
  });
  await waitForMotion(page);
  const diagonalWithTrailingHorizontalFrame = await page.evaluate(({ outerSelector, innerSelector }) => {
    const outerElement = document.querySelector(outerSelector);
    const innerElement = document.querySelector(innerSelector);
    return { outer: outerElement.scrollTop, innerLeft: innerElement.scrollLeft };
  }, { outerSelector: OUTER, innerSelector: INNER });
  expect(diagonalWithTrailingHorizontalFrame.innerLeft).toBeGreaterThan(250);
  expect(diagonalWithTrailingHorizontalFrame.outer).toBeGreaterThan(100);
  expect(diagonalWithTrailingHorizontalFrame.outer).toBeLessThan(140);

  await setScroll(outer, 0);
  await setScroll(inner, directSourceRemainder.innerMax);
  const point = await pointOver(page, inner);
  const retargetedHandled = await page.evaluate(({ x, y }) => !window.dispatchEvent(new WheelEvent('wheel', {
    bubbles: false,
    cancelable: true,
    clientX: x,
    clientY: y,
    deltaMode: WheelEvent.DOM_DELTA_PIXEL,
    deltaY: 120,
  })), point);
  expect(retargetedHandled, 'Window-retargeted wheel над матрицей должен быть перехвачен').toBe(true);
  await waitForMotion(page);
  const retargetedBoundary = await scrollMetrics(page);
  expect(retargetedBoundary.outer).toBeGreaterThan(100);
  expect(retargetedBoundary.outer).toBeLessThan(140);

  await setScroll(outer, 220);
  await setScroll(inner, 0);
  await inner.evaluate(element => {
    element.scrollLeft = 0;
  });
  await wheelOver(page, inner, -120, 400);
  await waitForMotion(page);
  const trustedUpwardDiagonal = await page.evaluate(({ outerSelector, innerSelector }) => {
    const outerElement = document.querySelector(outerSelector);
    const innerElement = document.querySelector(innerSelector);
    return { outer: outerElement.scrollTop, innerLeft: innerElement.scrollLeft };
  }, { outerSelector: OUTER, innerSelector: INNER });
  expect(trustedUpwardDiagonal.innerLeft).toBeGreaterThan(250);
  expect(trustedUpwardDiagonal.outer).toBeLessThan(120);
});

test('AC-SCROLL-14 and AC-STICKY-02/09: coupled upward motion and live geometry recalculation', async ({ page }) => {
  const outer = page.locator(OUTER);
  const inner = page.locator(INNER);

  const stickyState = await page.evaluate(async ({ outerSelector, innerSelector }) => {
    const outerElement = document.querySelector(outerSelector);
    const innerElement = document.querySelector(innerSelector);
    const accordion = innerElement.closest('.dch2-work-accordion');
    const header = accordion.querySelector('.ds-accordion__header');
    const matrixHeader = accordion.querySelector('.ds-chessboard__table thead');
    const firstRow = accordion.querySelector('.ds-chessboard__table tbody tr');
    const waitFrames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    for (let position = 250; position <= outerElement.scrollHeight - outerElement.clientHeight; position += 20) {
      outerElement.scrollTop = position;
      await waitFrames();
      const shift = Number.parseFloat(accordion.style.getPropertyValue('--dch2-work-sticky-shift')) || 0;
      const rowHeight = firstRow.getBoundingClientRect().height;
      const maxShift = Math.max(0, innerElement.clientHeight - matrixHeader.getBoundingClientRect().height - 8 * rowHeight);
      if (shift > 24 && shift < maxShift - 32) {
        return { outer: outerElement.scrollTop, shift, maxShift, headerTop: header.getBoundingClientRect().top };
      }
    }
    return null;
  }, { outerSelector: OUTER, innerSelector: INNER });
  expect(stickyState, 'Нужно найти промежуточное sticky-состояние').not.toBeNull();

  const transforms = await page.evaluate((innerSelector) => {
    const accordion = document.querySelector(innerSelector).closest('.dch2-work-accordion');
    const values = [
      accordion.querySelector('.ds-accordion__header'),
      accordion.querySelector('.dch2-work-legend'),
      accordion.querySelector('.ds-chessboard__table thead th'),
    ].map(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42);
    return values;
  }, INNER);
  expect(Math.max(...transforms) - Math.min(...transforms)).toBeLessThanOrEqual(0.5);

  const geometryBefore = await page.evaluate((innerSelector) => {
    const accordion = document.querySelector(innerSelector).closest('.dch2-work-accordion');
    return Number.parseFloat(accordion.style.getPropertyValue('--dch2-work-sticky-shift')) || 0;
  }, INNER);
  const firstFloorRow = page.locator(`${FIRST_WORK} .ds-chessboard__table tbody tr`).first();
  await firstFloorRow.evaluate(row => {
    row.style.height = '100px';
    row.querySelectorAll('th, td').forEach(cell => {
      cell.style.height = '100px';
    });
  });
  await expect.poll(async () => page.evaluate((innerSelector) => {
    const accordion = document.querySelector(innerSelector).closest('.dch2-work-accordion');
    return Number.parseFloat(accordion.style.getPropertyValue('--dch2-work-sticky-shift')) || 0;
  }, INNER)).toBeLessThanOrEqual(1);
  await firstFloorRow.evaluate(row => {
    row.style.removeProperty('height');
    row.querySelectorAll('th, td').forEach(cell => {
      cell.style.removeProperty('height');
    });
  });
  await expect.poll(async () => page.evaluate((innerSelector) => {
    const accordion = document.querySelector(innerSelector).closest('.dch2-work-accordion');
    return Number.parseFloat(accordion.style.getPropertyValue('--dch2-work-sticky-shift')) || 0;
  }, INNER)).toBeGreaterThan(geometryBefore - 1);

  const coupledBefore = await scrollMetrics(page);
  await setScroll(inner, coupledBefore.innerMax);
  const beforeWheel = await scrollMetrics(page);
  await wheelOver(page, inner, -180);
  await waitForMotion(page);
  const afterWheel = await scrollMetrics(page);
  expect(afterWheel.inner).toBeLessThan(beforeWheel.inner - 1);
  expect(afterWheel.outer).toBeLessThan(beforeWheel.outer - 1);
  const distributedDistance = (beforeWheel.inner - afterWheel.inner) + (beforeWheel.outer - afterWheel.outer);
  expect(distributedDistance).toBeGreaterThanOrEqual(178);
  expect(distributedDistance).toBeLessThanOrEqual(182);
  expect(afterWheel.stickyShift).toBeLessThan(beforeWheel.stickyShift);
});

test('AC-SCROLL-15 and AC-LIFE-03: fullscreen is isolated and restores the same matrix position', async ({ page }) => {
  const outer = page.locator(OUTER);
  const inner = page.locator(INNER);
  const initial = await scrollMetrics(page);
  const storedPosition = Math.round(initial.innerMax * 0.45);
  await setScroll(inner, storedPosition);
  await page.waitForTimeout(100);

  await page.getByRole('button', { name: /^Открыть работу на весь экран:/ }).first().click({ force: true });
  await expect(page.locator('.dch2-work-accordion.is-work-fullscreen')).toBeVisible();
  await expect.poll(async () => (await scrollMetrics(page)).inner).toBeCloseTo(storedPosition, 0);
  await expect.poll(async () => inner.evaluate(element => getComputedStyle(element).overscrollBehaviorY)).toBe('contain');

  const fullscreenStart = await scrollMetrics(page);
  await setScroll(inner, fullscreenStart.innerMax);
  const outerBeforeBoundary = await outer.evaluate(element => element.scrollTop);
  await wheelOver(page, inner, 240);
  await page.waitForTimeout(250);
  const atFullscreenBoundary = await scrollMetrics(page);
  expect(Math.abs(atFullscreenBoundary.innerMax - atFullscreenBoundary.inner)).toBeLessThanOrEqual(1);
  expect(Math.abs(atFullscreenBoundary.outer - outerBeforeBoundary)).toBeLessThanOrEqual(1);

  await wheelOver(page, inner, -240);
  await page.waitForTimeout(250);
  const fullscreenScrolled = await scrollMetrics(page);
  expect(fullscreenScrolled.inner).toBeLessThan(atFullscreenBoundary.inner - 100);
  expect(Math.abs(fullscreenScrolled.outer - outerBeforeBoundary)).toBeLessThanOrEqual(1);

  await page.getByRole('button', { name: /^Вернуть в список работ:/ }).click();
  await expect(page.locator('.dch2-work-accordion.is-work-fullscreen')).toHaveCount(0);
  await expect.poll(async () => (await scrollMetrics(page)).inner).toBeCloseTo(fullscreenScrolled.inner, 0);
});

test('reference geometry: wheel keeps both matrix axes and hands vertical remainder to the work list', async ({ page }) => {
  const outer = page.locator(OUTER);
  const inner = page.locator(INNER);
  const initial = await scrollMetrics(page);

  const nestedOverscrollPolicy = await inner.evaluate(element => {
    const style = getComputedStyle(element);
    return { x: style.overscrollBehaviorX, y: style.overscrollBehaviorY };
  });
  expect(nestedOverscrollPolicy).toEqual({ x: 'contain', y: 'contain' });

  const alignedOuter = await page.evaluate(async ({ outerSelector, innerSelector }) => {
    const outerElement = document.querySelector(outerSelector);
    const innerElement = document.querySelector(innerSelector);
    const accordion = innerElement.closest('.dch2-work-accordion');
    const header = accordion.querySelector('.ds-accordion__header');
    const shellHeader = outerElement.querySelector('.s-center-main__header');
    const tabs = document.querySelector('.dch2-tabs > .ds-tabs__list');
    const workList = document.querySelector('.dch2-work-list');
    const rowGap = Number.parseFloat(getComputedStyle(workList).rowGap) || 0;
    const waitFrames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    outerElement.scrollTop = 0;
    await waitFrames();
    const stickyTop = Math.max(
      outerElement.getBoundingClientRect().top,
      shellHeader.getBoundingClientRect().bottom,
      tabs.getBoundingClientRect().bottom,
    ) + rowGap;
    outerElement.scrollTop = Math.max(0, header.getBoundingClientRect().top - stickyTop);
    await waitFrames();
    return outerElement.scrollTop;
  }, { outerSelector: OUTER, innerSelector: INNER });
  await setScroll(inner, initial.innerMax);
  await wheelOver(page, inner, 260);
  await waitForMotion(page);
  const afterDownwardBoundary = await scrollMetrics(page);
  expect(Math.abs(afterDownwardBoundary.innerMax - afterDownwardBoundary.inner)).toBeLessThanOrEqual(1);
  expect(afterDownwardBoundary.outer).toBeGreaterThan(alignedOuter + 180);
  expect(afterDownwardBoundary.stickyShift).toBeGreaterThan(120);

  await inner.evaluate(element => {
    element.scrollLeft = 0;
  });
  const box = await inner.boundingBox();
  expect(box, 'Матрица должна оставаться видимой для горизонтального wheel-ввода').not.toBeNull();
  const viewport = page.viewportSize();
  const x = Math.min(viewport.width - 20, Math.max(20, box.x + box.width * 0.72));
  const visibleTop = Math.max(0, box.y);
  const visibleBottom = Math.min(viewport.height, box.y + box.height);
  const y = Math.min(viewport.height - 20, Math.max(20, (visibleTop + visibleBottom) / 2));
  await page.mouse.move(x, y);
  await page.mouse.wheel(260, 0);
  await page.waitForTimeout(150);
  const horizontal = await inner.evaluate(element => ({
    left: element.scrollLeft,
    maximum: element.scrollWidth - element.clientWidth,
  }));
  expect(horizontal.maximum).toBeGreaterThan(200);
  expect(horizontal.left).toBeGreaterThan(180);

  await inner.evaluate(element => {
    element.scrollLeft = 0;
  });
  await page.keyboard.down('Shift');
  await page.mouse.wheel(0, 260);
  await page.keyboard.up('Shift');
  await page.waitForTimeout(150);
  const shiftedWheelLeft = await inner.evaluate(element => element.scrollLeft);
  expect(shiftedWheelLeft).toBeGreaterThan(180);
});

test('scroll-debug query reports the physical wheel event path without changing the default UI', async ({ page }) => {
  await page.goto('./?scroll-debug=1');
  const panel = page.locator('[data-scroll-debug="wheel-router-v6"]');
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('wheel events=0');

  const inner = page.locator(INNER);
  await wheelOver(page, inner, 80);
  await expect(panel).toContainText('trusted=true');
  await expect(panel).toContainText('matrixPath=true');
  await expect(panel).toContainText('deltaY=80');
  await expect(panel).toContainText('decision=prevented-queued');
  await expect(panel).toContainText('captureBound=true');

  await page.goto('./');
  await expect(page.locator('[data-scroll-debug]')).toHaveCount(0);
});
