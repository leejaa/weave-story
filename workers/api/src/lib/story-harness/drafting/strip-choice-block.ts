// Safety net for the drafting step. The draft prompt asks the model to write ONLY the
// chapter body — the decision UI (situation/question/choices) is derived later in the
// structure step. Sometimes the model still appends a choice list to the body (e.g.
// "[선택] ① … ② …"), which then renders twice in the reader: once inside the prose and
// again in the choice UI. This strips a trailing choice block from a drafted body.
//
// It only removes a block at the very END of the content, and only when that block is
// clearly a choice list — either introduced by a recognizable header, or a run of two or
// more choice-item lines. Narrative prose does not end in numbered option lists, so the
// risk of clipping real content is negligible.

// A header line like: [선택], **[선택]**, 선택지:, [選択肢], [Choices], ### Options
const CHOICE_HEADER =
  /^\s*[*_#>\s]*\[?\s*(?:선택지|선택|選択肢|選択|選擇|選項|Choices?|Options?)\s*\]?\s*[*_:：]*\s*$/i;

// A choice-item line: ①…⑳, "1." / "1)" / "1、", "A." / "A)", or a bullet, then text.
const CHOICE_ITEM =
  /^\s*(?:[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]|[0-9]{1,2}[.)、]|[A-Za-z][.)]|[-•*])\s+\S/;

// A horizontal-rule / blank line left dangling above a stripped block.
const RULE_OR_BLANK = /^\s*(?:[-*_]{3,})?\s*$/;

export function stripTrailingChoiceBlock(content: string): string {
  const lines = content.replace(/\s+$/, '').split('\n');
  if (lines.length === 0) return content.trimEnd();

  let cut = -1;

  // 1) Cut at a trailing choice header, if one appears near the end.
  const headerWindow = Math.max(0, lines.length - 14);
  for (let i = lines.length - 1; i >= headerWindow; i--) {
    if (CHOICE_HEADER.test(lines[i])) {
      cut = i;
      break;
    }
  }

  // 2) Otherwise, cut at the start of a trailing run of >=2 choice-item lines.
  if (cut === -1) {
    let items = 0;
    let firstItem = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim() === '') continue; // blank separators are allowed inside the run
      if (CHOICE_ITEM.test(lines[i])) {
        items += 1;
        firstItem = i;
        continue;
      }
      break; // any other non-blank line ends the trailing run
    }
    if (items >= 2) cut = firstItem;
  }

  if (cut === -1) return content.trimEnd();

  // Drop the block plus any rule/blank lines dangling above it.
  let end = cut;
  while (end > 0 && RULE_OR_BLANK.test(lines[end - 1])) end -= 1;

  return lines.slice(0, end).join('\n').trimEnd();
}
