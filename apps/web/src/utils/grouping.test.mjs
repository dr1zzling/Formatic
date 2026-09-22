import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getNextGroupId,
  applyBulkGroup,
  removeBulkGroup,
} from "./grouping.js";

describe("getNextGroupId", () => {
  it("returns 1 when no groups exist", () => {
    assert.equal(getNextGroupId([{ group_id: null }, {}]), 1);
  });

  it("returns max+1 when groups exist", () => {
    assert.equal(
      getNextGroupId([{ group_id: 1 }, { group_id: 3 }, { group_id: 2 }]),
      4
    );
  });
});

describe("applyBulkGroup", () => {
  it("assigns new group_id to selected, text only on first selected", () => {
    const questions = [
      { question: "A", group_id: null, group_text: null },
      { question: "B", group_id: null, group_text: null },
      { question: "C", group_id: null, group_text: null },
    ];
    const { questions: out, newGroupId } = applyBulkGroup(questions, [2, 0]);
    assert.equal(newGroupId, 1);
    assert.equal(out[0].group_id, 1);
    assert.equal(out[2].group_id, 1);
    assert.equal(out[0].group_text, "");
    assert.equal(out[2].group_text, null);
    // unselected untouched
    assert.equal(out[1].group_id, null);
  });

  it("returns empty selection unchanged", () => {
    const questions = [{ group_id: null }];
    const { questions: out, newGroupId } = applyBulkGroup(questions, []);
    assert.equal(newGroupId, null);
    assert.equal(out[0].group_id, null);
  });
});

describe("removeBulkGroup", () => {
  it("clears group from selected only", () => {
    const questions = [
      { group_id: 1, group_text: "wacana" },
      { group_id: 1, group_text: null },
      { group_id: 2, group_text: "lain" },
    ];
    const out = removeBulkGroup(questions, [0, 1]);
    assert.equal(out[0].group_id, null);
    assert.equal(out[0].group_text, null);
    assert.equal(out[1].group_id, null);
    assert.equal(out[2].group_id, 2);
  });
});
