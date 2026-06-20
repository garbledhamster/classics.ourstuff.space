# Vertical Slice 003: Complete Bookclub Progress Loop

## Status

Approved for project-execute Batch 1.

## Type

AFK

## Behavior

A reader can use the Ten-Year Great Conversation plan by year or all-years view, filter it, set Reading Progress, choose Reading Stages, record dates, and see persisted results after reload.

## User Stories Covered

8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18

## Dependencies

Blocked by Vertical Slice 001.

## Acceptance Criteria

- Bookclub year and all-years views are usable for scanning the reading plan.
- Filters help a reader find readings by title, author, Great Idea, tier, status, date, note count, or action where supported by current UI.
- A reader can set Reading Progress and Reading Stage for a Work.
- Start and finished dates can be recorded where date controls are available.
- Reading Progress, stages, and dates persist locally after reload.
- Card and table modes remain usable where present.
- JavaScript syntax checks pass across `src/js`.

## Verification

- Run the repository JavaScript syntax check.
- Serve the app over local HTTP.
- Smoke-test Bookclub year/all-years navigation, filtering, status/stage/date changes, and reload persistence.
