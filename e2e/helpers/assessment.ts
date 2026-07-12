import { expect, type Page } from '@playwright/test';

const region = (page: Page) => page.getByRole('region', { name: 'Current question' });

/** Answers whatever the current question type is (single/multi/scale/text).
 * Scoped to the active "Current question" region and to VISIBLE controls so the
 * outgoing question's controls (during the crossfade) are never targeted. */
export async function answerCurrent(page: Page): Promise<void> {
  const r = region(page);
  const anyControl = r.locator(
    'button[role="radio"]:visible, button[role="checkbox"]:visible, button[aria-pressed]:visible, textarea:visible',
  );
  await anyControl.first().waitFor({ state: 'visible', timeout: 15_000 });

  const textarea = r.locator('textarea:visible');
  const radio = r.locator('button[role="radio"]:visible');
  const checkbox = r.locator('button[role="checkbox"]:visible');
  const scale = r.locator('button[aria-pressed]:visible');
  if (await textarea.count()) await textarea.first().fill('Automated test answer.');
  else if (await radio.count()) await radio.first().click();
  else if (await checkbox.count()) await checkbox.first().click();
  else if (await scale.count()) await scale.first().click();
  else throw new Error('No recognizable answer control on current question');

  await page.waitForTimeout(300); // let canProceed flip / Next enable
}

const nextBtn = (page: Page) => page.getByRole('button', { name: 'Next Question' });
const submitBtn = (page: Page) => page.getByRole('button', { name: 'Submit assessment' });

/** Reads the "n/total" step counter. */
export async function readStep(page: Page): Promise<{ current: number; total: number }> {
  const txt = (await page.locator('text=/^\\d+\\/\\d+$/').first().textContent()) ?? '0/0';
  const [current, total] = txt.split('/').map((n) => parseInt(n.trim(), 10));
  return { current, total };
}

/** Walks the full assessment answering every question; clicks final Submit.
 * Returns the number of questions answered. */
export async function completeAssessment(page: Page): Promise<number> {
  await page.goto('/sleep-assessment');
  await expect(page.getByRole('heading', { name: 'Sleep Assessment' })).toBeVisible();
  let answered = 0;
  for (let i = 0; i < 20; i++) {
    await answerCurrent(page);
    answered++;
    if (await submitBtn(page).count()) {
      await submitBtn(page).click();
      break;
    }
    await nextBtn(page).click();
    await page.waitForTimeout(600); // let the question crossfade complete
  }
  return answered;
}
