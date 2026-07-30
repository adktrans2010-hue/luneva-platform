import { expect, test } from "@playwright/test";

const viewports = [
  { width: 320, height: 568 },
  { width: 360, height: 667 },
  { width: 390, height: 844 },
  { width: 412, height: 1024 },
  { width: 768, height: 1024 },
  { width: 820, height: 1024 },
];

test("/about has no clipped or horizontally overflowing text after fonts load", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("luneva_cookie_consent", "accepted");
  });

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/about", { waitUntil: "domcontentloaded" });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    const result = await page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth;
      const describe = (element: Element) => {
        const classes = [...element.classList].join(".");
        return `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${classes ? `.${classes}` : ""}`;
      };

      const textElements = [...document.querySelectorAll<HTMLElement>("body *")]
        .filter((element) =>
          [...element.childNodes].some(
            (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
          ),
        )
        .filter((element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            rect.width > 0 &&
            rect.height > 0
          );
        });

      const issues = textElements.flatMap((element) => {
        const rect = element.getBoundingClientRect();
        const text = element.textContent?.trim().replace(/\s+/g, " ").slice(0, 120) ?? "";
        const issue: string[] = [];
        const range = document.createRange();
        range.selectNodeContents(element);
        const textRect = range.getBoundingClientRect();

        if (rect.left < -1 || rect.right > viewportWidth + 1) {
          issue.push(`rect=${rect.left.toFixed(1)}..${rect.right.toFixed(1)}`);
        }

        let ancestor: HTMLElement | null = element;
        while (ancestor) {
          const ancestorStyle = getComputedStyle(ancestor);
          if (["hidden", "clip"].includes(ancestorStyle.overflowX)) {
            const ancestorRect = ancestor.getBoundingClientRect();
            if (textRect.left < ancestorRect.left - 1 || textRect.right > ancestorRect.right + 1) {
              issue.push(`horizontal clipping in ${describe(ancestor)}`);
            }
          }
          if (["hidden", "clip"].includes(ancestorStyle.overflowY)) {
            const ancestorRect = ancestor.getBoundingClientRect();
            if (textRect.top < ancestorRect.top - 1 || textRect.bottom > ancestorRect.bottom + 1) {
              issue.push(`vertical clipping in ${describe(ancestor)}`);
            }
          }
          ancestor = ancestor.parentElement;
        }

        return issue.length > 0 ? [`${describe(element)}: ${text} (${issue.join(", ")})`] : [];
      });

      return {
        documentScrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        issues,
      };
    });

    expect(result.documentScrollWidth, `${viewport.width}px document overflow`).toBeLessThanOrEqual(
      result.clientWidth + 1,
    );
    expect(result.issues, `${viewport.width}px text overflow:\n${result.issues.join("\n")}`).toEqual([]);
  }
});
